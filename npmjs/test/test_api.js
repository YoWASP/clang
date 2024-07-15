const { runClang, commands } = await import('@yowasp/clang');

await commands.clang(["--version"]);

const { meowC } = await runClang(["clang", "test.c", "-o", "meowC"],
    {"test.c": `#include <stdio.h>\nint main() { puts("meow"); }`});
const { meowCXX } = await runClang(["clang++", "test.cc", "-o", "meowCXX"],
    {"test.cc": `#include <iostream>\nint main() { std::cout << "meow++" << std::endl; }`});

const { WASI } = await import('node:wasi');
for (const meow of [meowC, meowCXX]) {
    const meowdule = await WebAssembly.compile(meow);
    const wasi = new WASI({ version: 'preview1' });
    const instance = await WebAssembly.instantiate(meowdule,
        {wasi_snapshot_preview1: wasi.wasiImport});
    wasi.start(instance);
}
