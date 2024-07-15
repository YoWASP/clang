import { Application } from '@yowasp/runtime';
import { instantiate } from '../gen/llvm.js';

export { Exit } from '@yowasp/runtime';

const llvm = new Application(() => import('./resources-llvm.js'), instantiate, 'yowasp-llvm');
const runLLVM = llvm.run.bind(llvm);

export { runLLVM };

export const commands = {
    'addr2line': null,
    'size': null,
    'objdump': null,
    'objcopy': null,
    'strip': null,
    'c++filt': null,
    'ar': null,
    'ranlib': null,
    'wasm-ld': null,
    'clang': null,
    'clang++': null,
};
