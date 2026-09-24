import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventEmitter} from 'node:events';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const paths=['docs/development/evidence/phase-3e3a4a','/tmp/justproof-phase3e3a4a-public-components-attempt1','/tmp/justproof-phase3e3a4a-authorization.json'];
const absent=p=>{try{fs.lstatSync(p);return false;}catch(e){if(e.code==='ENOENT')return true;throw e;}};
assert(paths.every(absent));
const handles=process._getActiveHandles().slice(),resources=process.getActiveResourcesInfo().slice();
process.argv[2]='--authorized-public-component-probe';process.argv[3]='proof';
const m=await import(pathToFileURL(resolve('docs/development/evidence/phase-3e3a3e/proposed-public-probes.mjs')));
assert.deepEqual(process._getActiveHandles(),handles);assert.deepEqual(process.getActiveResourcesInfo(),resources);
const cases=[];
async function check(name,patch,expected,kind='proof',endpoint='/health'){
 const body=kind==='node'?JSON.stringify({jsonrpc:'2.0',id:1,result:'0x'+'a'.repeat(64)}):kind==='indexer'?'{"data":{"block":{"height":1}}}':endpoint==='/version'?'8.1.0':'{"status":"ok"}';
 let timer;let requests=0;
 const spec={status:200,headers:['Content-Type',endpoint==='/version'?'text/plain; charset=utf-8':'application/json','Content-Length',String(Buffer.byteLength(body))],complete:true,body,action:'end',...patch};
 const transport={setTimeout:fn=>{timer=fn;return 1;},clearTimeout:()=>{},request:(options,cb)=>{
  requests++;assert.equal(options.agent,false);assert.equal(options.host,m.targets[kind].host);
  const q=new EventEmitter();q.destroy=()=>{};
  q.end=()=>queueMicrotask(()=>{
    if(spec.action==='request-error'){q.emit('error',new Error('PUBLIC_CANARY'));return;}
    if(spec.action==='timeout'){timer();return;}
    const r=new EventEmitter();r.statusCode=spec.status;r.rawHeaders=spec.headers;r.complete=spec.complete;r.aborted=false;r.rawTrailers=spec.trailers??[];r.destroy=()=>{};cb(r);
    r.emit('data',Buffer.from(spec.body));
    if(spec.action==='aborted'){r.aborted=true;r.emit('aborted');}
    else if(spec.action==='close')r.emit('close');
    else if(spec.action==='error')r.emit('error',new Error('PUBLIC_CANARY'));
    else {r.emit('end');r.emit('close');}
  });return q;
 }};
 const r=await m.request(kind,endpoint,undefined,transport);assert.equal(r.passed,expected,name);assert.equal(requests,1);
 assert(!JSON.stringify(r).includes('PUBLIC_CANARY'));cases.push({name,passed:true});
}
await check('normally complete proof JSON',{},true);
await check('version committed media type',{},true,'proof','/version');
await check('node complete JSON',{},true,'node','/');
await check('indexer complete JSON',{},true,'indexer','/api/v4/graphql');
await check('response aborted',{action:'aborted'},false);
await check('premature close',{action:'close'},false);
await check('response error',{action:'error'},false);
await check('request error',{action:'request-error'},false);
await check('deadline',{action:'timeout'},false);
await check('incomplete parser framing',{complete:false},false);
await check('duplicate length',{headers:['Content-Type','application/json','Content-Length','15','Content-Length','15']},false);
await check('CL and TE ambiguity',{headers:['Content-Type','application/json','Content-Length','15','Transfer-Encoding','chunked']},false);
await check('missing framing',{headers:['Content-Type','application/json']},false);
await check('signed length',{headers:['Content-Type','application/json','Content-Length','+15']},false);
await check('wrong media',{headers:['Content-Type','text/html','Content-Length','15']},false);
await check('duplicate media',{headers:['Content-Type','application/json','Content-Type','application/json','Content-Length','15']},false);
await check('unsupported TE',{headers:['Content-Type','application/json','Transfer-Encoding','gzip']},false);
await check('complete chunked',{headers:['Content-Type','application/json','Transfer-Encoding','chunked']},true);
await check('truncated length',{headers:['Content-Type','application/json','Content-Length','100']},false);
await check('overflow length',{headers:['Content-Type','application/json','Content-Length','1']},false);
await check('oversized chunked',{headers:['Content-Type','application/json','Transfer-Encoding','chunked'],body:'x'.repeat(8193)},false);
await check('redirect',{status:302},false);
await check('HTTP error',{status:500},false);
await check('unexpected trailers',{trailers:['Content-Length','1']},false);
assert.deepEqual(process._getActiveHandles(),handles);assert.deepEqual(process.getActiveResourcesInfo(),resources);assert(paths.every(absent));
process.stdout.write(JSON.stringify({inertImport:true,flagPresent:true,socketCount:0,realTimers:0,realHttpRequests:0,cases,count:cases.length,passed:true})+'\n');
