// Public-code-only module inspection. Explicit direct entry; no wallet or external origin.
import {init,parse} from 'es-module-lexer';
import { SourceTextModule, createContext } from 'node:vm';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export async function checkGraph() {
  const origin='http://127.0.0.1:5174';
  const sources=new Map();const queue=[`${origin}/primitives.ts`];
  await init;
  const imports=s=>parse(s)[0].filter(x=>x.n!==undefined).map(x=>x.n);
  while(queue.length){const url=queue.shift();if(sources.has(url))continue;if(new URL(url).origin!==origin)throw new Error('NONLOCAL_MODULE');
    const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('content-type')?.includes('javascript'))throw new Error('MODULE_RESPONSE_INVALID');
    const s=await r.text();sources.set(url,s);for(const x of imports(s))queue.push(new URL(x,url).href);
    if(sources.size>80)throw new Error('MODULE_LIMIT');
  }
  const context=createContext({WebAssembly,Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,BigInt64Array,BigUint64Array,Float32Array,Float64Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,atob,btoa,console:{log(){},error(){},warn(){}},crypto:undefined});
  const modules=new Map();
  const linker=(specifier,reference)=>{const m=modules.get(new URL(specifier,reference.identifier).href);if(!m)throw new Error('MODULE_MISSING');return m;};
  for(const [url,s] of sources)modules.set(url,new SourceTextModule(s,{context,identifier:url,importModuleDynamically:async(specifier,reference)=>{const m=linker(specifier,reference);if(m.status==='unlinked')await m.link(linker);if(m.status==='linked')await m.evaluate({timeout:15000});return m;}}));
  const root=modules.get(`${origin}/primitives.ts`);
  const evidence={moduleCount:sources.size,modules:[...sources].map(([url,s])=>({name:new URL(url).pathname.split('/').pop(),bytes:Buffer.byteLength(s),sha256:createHash('sha256').update(s).digest('hex')})),browserExecuted:false};
  try {await root.link((specifier,reference)=>{const m=modules.get(new URL(specifier,reference.identifier).href);if(!m)throw new Error('MODULE_MISSING');return m;});await root.evaluate({timeout:15000});
    const api=typeof root.namespace.initializeLocalLedger==='function'?await root.namespace.initializeLocalLedger():root.namespace;
    evidence.evaluation='PASS';evidence.verifySignatureCallable=typeof api.verifySignature==='function';evidence.addressFromKeyCallable=typeof api.addressFromKey==='function';
    const source=readFileSync(new URL('./public-verifier-vector.ts',import.meta.url),'utf8');const vector=JSON.parse(source.slice(source.indexOf('Object.freeze(')+14,source.lastIndexOf(');')));
    const bytes=new TextEncoder().encode(vector.message);const changed=bytes.slice();changed[0]^=1;
    evidence.publicSignatureSelftest=api.verifySignature(vector.verifyingKey,bytes,vector.signature)===true && api.verifySignature(vector.verifyingKey,changed,vector.signature)===false;
    evidence.publicAddressSelftest=api.addressFromKey(vector.verifyingKey)===vector.expectedAddressPayload;
  }catch(e){evidence.evaluation=e instanceof ReferenceError||e?.name==='ReferenceError'?'ESM_INITIALIZATION_REFERENCE_ERROR':e?.name==='CompileError'?'WASM_COMPILE_FAILED':e?.name==='LinkError'?'WASM_LINK_FAILED':'MODULE_EVALUATION_FAILED';}
  return evidence;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]!=='--public-loopback-module-check')throw new Error('FLAG_REQUIRED');
 try{console.log(JSON.stringify(await checkGraph(),null,2));}catch{console.log(JSON.stringify({evaluation:'PUBLIC_MODULE_CHECK_FAILED'}));process.exitCode=1;}
}
