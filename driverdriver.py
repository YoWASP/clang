#!/usr/bin/env python3

import os
import sys
import shlex
import subprocess


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAUNCHER = [
    "wasmtime", "run",
    "--dir", f"{ROOT_DIR}::/wasi",
    "--dir", "/tmp",
    "--dir", "/",
    "--dir", ".",
    f"{ROOT_DIR}/bin/llvm.wasm",
]
DIR_ARGS = [
    "--sysroot", "/wasi",
    "-resource-dir", "/wasi",
]


def run_llvm_tool(args):
    arg0, *args = args
    return subprocess.call([*LAUNCHER, os.path.basename(arg0), *args])


def run_clang_driver(args):
    arg0, *args = args
    if "-###" in args:
        return run_llvm_tool([arg0, *DIR_ARGS, *args])
    output = subprocess.check_output(
        [*LAUNCHER, os.path.basename(arg0), "-###", *DIR_ARGS, *args],
        stderr=subprocess.STDOUT,
        text=True,
    )
    # horrific in-band signaling code. please do not hold me to account for writing this
    state = 0
    commands = []
    for line in output.splitlines():
        if state == 0:
            if not line.startswith(
                    ("clang", "Target:", "Thread model:", "InstalledDir:", "Build config:")):
                state = 1
        if state == 1:
            if line == " (in-process)": # doesn't seem to be used with `llvm` driver enableds
                pass
            elif line.startswith(" \""):
                commands.append(shlex.split(line))
            else:
                state = 2
        if state == 2:
            pass
    if state == 1: # valid `-###` output recognized
        for command in commands:
            if command[0] == "": # clang would normally run this (usually cc1/cc1as) in-process
                del command[0]
            exit_code = run_llvm_tool(command)
            if exit_code != 0:
                return exit_code
    else: # something else, perhaps an error? just display it
        print(output)


RUNNERS = {
    "addr2line":    run_llvm_tool,
    "size":         run_llvm_tool,
    "objdump":      run_llvm_tool,
    "objcopy":      run_llvm_tool,
    "strip":        run_llvm_tool,
    "c++filt":      run_llvm_tool,
    "ar":           run_llvm_tool,
    "ranlib":       run_llvm_tool,
    "wasm-ld":      run_llvm_tool,
    "clang":        run_clang_driver,
    "clang++":      run_clang_driver,
}


if __name__ == "__main__":
    if os.getenv("__DRIVERDRIVER_LIST") == "1":
        print(" ".join(runner for runner in RUNNERS if runner))
    else:
        sys.exit(RUNNERS[os.path.basename(sys.argv[0])](sys.argv))
