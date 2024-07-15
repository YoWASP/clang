export type Tree = {
    [name: string]: Tree | string | Uint8Array
};

export type InputStream =
    (byteLength: number) => Uint8Array | null;

export type OutputStream =
    (bytes: Uint8Array | null) => void;

export type RunOptions = {
    stdin?:  InputStream  | null;
    stdout?: OutputStream | null;
    stderr?: OutputStream | null;
    decodeASCII?: boolean;
    synchronously?: boolean;
};

export type Command =
    (args?: string[], files?: Tree, options?: RunOptions) => Promise<Tree> | Tree | undefined;

export class Exit extends Error {
    code: number;
    files: Tree;
}

//--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------

export const runLLVM: Command;

export const commands: {
    'addr2line': Command,
    'size': Command,
    'objdump': Command,
    'objcopy': Command,
    'strip': Command,
    'c++filt': Command,
    'ar': Command,
    'ranlib': Command,
    'wasm-ld': Command,
    'clang': Command,
    'clang++': Command,
};
