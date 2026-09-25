import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Inline only the pinned ledger WASM. No browser fetch of WASM or remote fallback.
export function inlineLedgerWasm(): Plugin {
  const path=resolve('node_modules/@midnight-ntwrk/ledger-v8/midnight_ledger_wasm_bg.wasm');
  return {name:'capability-inline-ledger-wasm',enforce:'pre',load(id) {
    if(id!==path) return null;
    const bytes=readFileSync(path);const module=new WebAssembly.Module(bytes);
    const imports=[...new Set(WebAssembly.Module.imports(module).map(x=>x.module))];
    const lines=imports.map((name,i)=>`import * as i${i} from ${JSON.stringify(resolve(dirname(path),name))};`);
    lines.push(`const bytes=Uint8Array.from(atob(${JSON.stringify(bytes.toString('base64'))}),c=>c.charCodeAt(0));`);
    lines.push(`const {instance}=await WebAssembly.instantiate(bytes,{${imports.map((name,i)=>`${JSON.stringify(name)}:i${i}`).join(',')}});`);
    for(const entry of WebAssembly.Module.exports(module)) {
      if(!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry.name)) throw new Error('WASM_EXPORT_UNSUPPORTED');
      lines.push(`export const ${entry.name}=instance.exports[${JSON.stringify(entry.name)}];`);
    }
    return lines.join('\n');
  }};
}
export default defineConfig(({command,mode})=>{
  if(mode!=='capability-probe') throw new Error('EXPLICIT_CAPABILITY_PROBE_MODE_REQUIRED');
  if(command!=='serve') throw new Error('CAPABILITY_PROBE_IS_DEVELOPMENT_ONLY');
  return {
    root:fileURLToPath(new URL('.',import.meta.url)),envDir:false,publicDir:false,cacheDir:'/tmp/justproof-capability-vite-cache',
    plugins:[inlineLedgerWasm(),{name:'capability-no-dev-client',transformIndexHtml:{order:'post',handler:html=>html.replace(/<script type="module" src="\/@vite\/client"><\/script>/g,'')}}],
    optimizeDeps:{noDiscovery:true,include:['react','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','@scure/base'],exclude:['@midnight-ntwrk/ledger-v8']},
    server:{host:'127.0.0.1',port:5174,strictPort:true,hmr:false,headers:{
      'Content-Security-Policy':"default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'",
      'Referrer-Policy':'no-referrer','Cache-Control':'no-store',
    }},
  };
});
