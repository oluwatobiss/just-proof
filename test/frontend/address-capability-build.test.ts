import { describe,it,expect } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import config,{inlineLedgerWasm} from '../../tools/address-capability/vite.config';
describe('separate capability development configuration',()=>{
  it('requires explicit mode and prohibits deployable builds',()=>{
    if(typeof config!=='function')throw new Error('CONFIG_EXPECTED');
    expect(()=>config({command:'serve',mode:'development'})).toThrow('EXPLICIT_CAPABILITY_PROBE_MODE_REQUIRED');
    expect(()=>config({command:'build',mode:'capability-probe'})).toThrow('CAPABILITY_PROBE_IS_DEVELOPMENT_ONLY');
    const value=config({command:'serve',mode:'capability-probe'});
    expect(value).toMatchObject({publicDir:false,envDir:false,server:{host:'127.0.0.1',port:5174,strictPort:true,hmr:false}});
  });
  it('pins WASM source and contains no remote loader',()=>{
    const plugin=inlineLedgerWasm();expect(plugin.name).toBe('capability-inline-ledger-wasm');
    const source=readFileSync('tools/address-capability/vite.config.ts','utf8');
    expect(source).toContain("connect-src 'none'");expect(source).not.toContain('instantiateStreaming');
    expect(source).not.toMatch(/fetch\(/);expect(source).toContain('await WebAssembly.instantiate(bytes,');expect(source).not.toContain('new WebAssembly.Instance(new WebAssembly.Module(bytes)');
    const wasm=new WebAssembly.Module(readFileSync(resolve('node_modules/@midnight-ntwrk/ledger-v8/midnight_ledger_wasm_bg.wasm')));
    for(const item of WebAssembly.Module.imports(wasm))expect(item.module).toMatch(/^\.\/(?:midnight_ledger_wasm_bg\.js|snippets\/midnight-ledger-wasm-[a-f0-9]+\/inline[0-9]+\.js)$/);
    for(const item of WebAssembly.Module.exports(wasm))expect(item.name).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
  });
});
