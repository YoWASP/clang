YoWASP Clang/LLD package
========================

This package provides a complete [Clang/LLD][] toolchain built for [WebAssembly][] and targeting WebAssembly as well. See the [overview of the YoWASP project][yowasp] for details.

At the moment, this package only offers an API allowing to run Clang and LLD in a virtual filesystem; no executables are provided. Note that if you are importing `.../gen/bundle.js` directly, you must use it as a module.

[Clang/LLD]: https://llvm.org/
[WebAssembly]: https://webassembly.org/
[yowasp]: https://yowasp.github.io/


Examples
--------

All examples below are written for Node.js; to run them, install `@yowasp/clang` first. The C/C++ code can be compiled equally well in the browser and other runtimes, but WASI is unevenly supported.

### Hosted C++ executable

```js
import { runClang } from '@yowasp/clang';
const { meow } = await runClang(['clang++', 'test.cc', '-o', 'meow'],
    {"test.cc": `#include <iostream>\nint main() { std::cout << "meow++" << std::endl; }`});

import { WASI } from 'node:wasi';
const wasi = new WASI({ version: 'preview1' });
const module = await WebAssembly.compile(meow);
const instance = await WebAssembly.instantiate(module,
    {wasi_snapshot_preview1: wasi.wasiImport});
wasi.start(instance);
// prints "meow++"
```


### Freestanding C library

```js
import { runClang } from '@yowasp/clang';
const { 'a.out': wasm } = await runClang(['clang', '-nostdlib', '-Wl,--no-entry', 'test.c'], {
    'test.c': 'int add(int a, int b) __attribute__((export_name("add"))) { return a + b; }'});

const module = await WebAssembly.compile(wasm);
const instance = await WebAssembly.instantiate(module);
console.log('add(1, 2) =', instance.exports.add(1, 2));
// prints "add(1, 2) = 3"
```


API reference
-------------

This package provides two functions:

- `runLLVM`
  - The first argument is the utility to run: one of `addr2line`, `ar`, `c++filt`, `dwarfdump`, `nm`, `objcopy`, `objdump`, `readobj`, `ranlib`, `size`, `strip`, `symbolizer`, `wasm-ld`.
- `runClang`
  - The first argument is either `clang` or `clang++`.
  - Due to WASI limitations (an inability to spawn subprocesses), this function is a wrapper that parses the output of `clang -###` or `clang++ -###` to determine the sequence of processes to run. The parser was written with great care and handles many common exceptional conditions (e.g. the `-help` option), but the resulting function still deviates from how a standard Clang compiler driver would behave. Please report any deviations that impact your workflow as [issues].

[issues]: https://github.com/YoWASP/clang/issues

For more detail, see the documentation for [the JavaScript YoWASP runtime](https://github.com/YoWASP/runtime-js#api-reference).


Versioning
----------

The version of this package is derived from the upstream LLVM package version in the `X.Y.Z-S-M` or `X.Y.Z-M` format, where the symbols are:

1. `X`: LLVM major version
2. `Y`: LLVM minor version
3. `Z`: LLVM patch version
4. `S`: `gitK` for unreleased LLVM snapshots, `rcN` for LLVM release candidates, not present for LLVM releases
5. `M`: package build version; disambiguates different builds produced from the same LLVM source tree

With this scheme, there is a direct correspondence between upstream versions and [SemVer][semver] NPM package versions.

[semver]: https://semver.org/


License
-------

This package is covered by the [Apache 2 license](LICENSE.txt), which is the same as the (base) [LLVM license](https://github.com/llvm/llvm-project/blob/main/LICENSE.TXT).
