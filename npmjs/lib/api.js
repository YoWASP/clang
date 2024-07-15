import { Application } from '@yowasp/runtime';
import * as resources from '../gen/llvm-resources.js';
import { instantiate } from '../gen/llvm.js';

import { Exit } from '@yowasp/runtime';

const llvm = new Application(resources, instantiate, 'yowasp-llvm');
const runLLVM = llvm.run.bind(llvm);

function subcommand(command, subcommandName) {
    return function (args, files, options) {
        if (args === undefined || args == null)
            return command(args, files, options); // preload resources
        return command([subcommandName, ...args], files, options);
    }
}

// horrific ??? code. [insert standard disclaimer here]
// 'it cant hurt me if im not looking at it'
function runClang(args, files, options = {}) {
    if (args === undefined || args === null)
        return runLLVM(args, files, options); // preload resources

    // We pattern-match output of `-###` plus `args` to understand which subprocesses to run.
    // If `args` contains `-###` this is an explicit user request to display these subprocesess,
    // and we should not interpret the output in any way.
    if (args.includes("-###"))
        return runLLVM(args, files, options);

    // All of these options have more priority than `-###`, and we shouldn't interfere with them.
    if (args.includes(`--version`) ||
            args.includes(`-help`) ||
            args.includes(`--help`) ||
            args.includes(`--help-hidden`))
        return runLLVM(args, files, options);

    function writeStderr(output) {
        if (options.stderr === undefined) {
            console.log(output);
        } else {
            options.stderr(new TextEncoder().encode(output));
            options.stderr(null);
        }
    }

    /** See the `clang/lib/Driver/Job.cpp` file, `Command::Print()` subroutine, as well as
      * the `llvm/lib/Support/Program.cpp` file, `sys::printArg()` subroutine.
      * @param {string} line
      * @return {string[]} */
    function unquoteClangArgs(line) {
        return Array.from(line.matchAll(/ (?:([^ "]+)|"((?:[^"\\$]|\\["\\$])+)")/g), (match) => {
            if (match[1] !== undefined) {
                return match[1];
            } else if (match[2] !== undefined) {
                return match[2].replaceAll(/\\["$\\]/g, (m) => m[1]);
            }
        });
    }

    let gen = (function* () {
        const [arg0, ...argsRest] = args;

        /** @type {Uint8Array[]} Output of `-###` */
        const outputSubarrays = [];
        function captureOutput(bytes) {
            if (bytes !== null)
                outputSubarrays.push(new Uint8Array(bytes));
        }

        /** @type {Exit | undefined} Outcome of running `-###` */
        let hash3Error = undefined;
        try {
            yield runLLVM([arg0, "-###", ...argsRest], files, {
                stdout: captureOutput,
                stderr: captureOutput,
                synchronously: options.synchronously,
            });
        } catch (err) {
            hash3Error = err;
        }

        const outputArray = new Uint8Array(outputSubarrays.reduce((a, b) => a + b.length, 0));
        let outputLength = 0;
        for (const outputSubarray of outputSubarrays) {
            outputArray.subarray(outputLength, outputLength + outputSubarray.length).set(outputSubarray);
            outputLength += outputSubarray.length;
        }
        const output = new TextDecoder().decode(outputArray);

        if (hash3Error !== undefined) {
            // Something definitely went wrong, and the output contains no commands to execute,
            // but probably has a human-readable explanation. We had to squish it all to stderr
            // though, even though some of it might've been printed to stdout originally.
            writeStderr(output);
            throw hash3Error;
        }

        // horrific in-band signaling code. please do not hold me to account for writing this
        let state = 0;
        /** @type {string[][]} */
        const commands = [];
        for (const line of output.split("\n")) {
            if (state === 0) { // header
                if (!(line.startsWith("clang") ||
                      line.startsWith("Target:") ||
                      line.startsWith("Thread model:") ||
                      line.startsWith("InstalledDir:") ||
                      line.startsWith("Build config:"))) {
                    state = 1;
                }
            }
            if (state === 1) { // command lines
                if (line === " (in-process)") {
                    // Ignore; indicates clang would ordinarily invoke itself as a library for
                    // the following command line. Since we do not have an ordinarily working
                    // compiler driver (but rather a compiler driver²), all ordinarily in-process
                    // invocations have to be performed with a separate `runLLVM` call.
                } else if (line.startsWith(' "')) {
                    commands.push(unquoteClangArgs(line));
                } else if (line === "") {
                    state = 2; // final command; success!
                } else {
                    state = 3; // unknown input; error!
                }
                continue;
            }
            if (state === 2) { // success
                state = 3;
            }
            if (state === 3) { // error
                break;
            }
        }
        if (state !== 2) { // no valid `-###` command list in the output
            // Who knows what went wrong? Could have been an odd combination of options, could
            // have been an error (with a zero exit code, other exit codes are handled above).
            // We can't interpret the output of `-###` if there is even any, so just display it.
            writeStderr(output);
        } else { // valid `-###` command list recognized
            // Verbose? Print `-###` output. This will differ slightly from a desktop compiler,
            // but is more in the spirit of the `-v` option.
            if (args.includes('-v'))
                writeStderr(output);
            // Run the command list.
            for (const command of commands) {
                if (command[0] === "") {
                    // Clang would normally run this command in-process, which is indicated by
                    // an empty argument in the command list, followed by clang's argv[0] for
                    // this command. This distinction doesn't matter for us.
                    command.shift();
                }
                // If this command line fails, the `Exit` exception will bubble up its exit code
                // and output tree.
                try {
                    files = yield runLLVM(command, files, options);
                } catch (err) {
                    if (err instanceof Exit)
                        delete err.files.tmp;
                    throw err;
                }
            }
        }
        delete files.tmp;
        return files;
    })();

    let promise, resolve, reject;
    function runNext(value) {
        try {
            let done;
            do {
                ({ value, done } = gen.next(value));
            } while (!(value instanceof Promise) && !done);
            if (done) {
                if (resolve) resolve(value);
                else return value;
            }
            if (!promise) promise = new Promise((_resolve, _reject) =>
                (resolve = _resolve, reject = _reject));
            value.then(
                nextVal => done ? resolve() : runNext(nextVal),
                error => { // give the coroutine a first chance to handle the error.
                    // we have SEH at home!
                    try { ({ value, done } = gen.throw(error)); }
                    catch (e) { reject(e); }
                });
        }
        catch (e) {
            if (reject) reject(e);
            else throw e;
        }
    }
    const maybeSyncReturn = runNext(null);
    return promise || maybeSyncReturn;
}

export { runLLVM, runClang };
export const commands = {
    // LLVM tools
    'addr2line': subcommand(runLLVM, 'addr2line'), // actually `symbolizer`
    'ar': subcommand(runLLVM, 'ar'),
    'c++filt': subcommand(runLLVM, 'c++filt'),
    'dwarfdump': subcommand(runLLVM, 'dwarfdump'),
    'nm': subcommand(runLLVM, 'nm'),
    'objcopy': subcommand(runLLVM, 'objcopy'),
    'objdump': subcommand(runLLVM, 'objdump'),
    'readobj': subcommand(runLLVM, 'readobj'),
    'ranlib': subcommand(runLLVM, 'ranlib'), // actually `ar`
    'size': subcommand(runLLVM, 'size'),
    'strip': subcommand(runLLVM, 'strip'), // actually `objcopy`
    'symbolizer': subcommand(runLLVM, 'symbolizer'),
    // Compiler and linker
    'wasm-ld': subcommand(runLLVM, 'wasm-ld'),
    'clang': subcommand(runClang, 'clang'),
    'clang++': subcommand(runClang, 'clang++'),
};
export const version = VERSION;
