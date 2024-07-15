YoWASP Clang/LLD package
========================

This package provides a complete [Clang/LLD][] toolchain built for [WebAssembly][] and targeting WebAssembly as well. See the [overview of the YoWASP project][yowasp] for details.

At the moment, this package only provides an API allowing to run Clang and LLD in a virtual filesystem; no binaries are provided.

[llvm/clang]: https://llvm.org/
[webassembly]: https://webassembly.org/
[yowasp]: https://yowasp.github.io/


API reference
-------------

This package provides one function:

- `runLLVM`

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

This package is covered by the [MIT license](LICENSE.txt), which is the same as the [Boolector license](https://github.com/Boolector/boolector/blob/master/COPYING).
