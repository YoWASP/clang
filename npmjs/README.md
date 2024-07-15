YoWASP Clang/LLD package
========================

This package provides a complete [Clang/LLD][] toolchain built for [WebAssembly][] and targeting WebAssembly as well. See the [overview of the YoWASP project][yowasp] for details.

At the moment, this package only offers an API allowing to run Clang and LLD in a virtual filesystem; no executables are provided.

[Clang/LLD]: https://llvm.org/
[WebAssembly]: https://webassembly.org/
[yowasp]: https://yowasp.github.io/


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
