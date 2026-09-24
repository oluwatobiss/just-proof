// Inert proposal. Public block metadata only; no SDK, wallet, proof, or state query.
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export const targets = Object.freeze({
  proof: Object.freeze({host:'172.29.71.10',port:6300,startup:45,dwell:10}),
  node: Object.freeze({host:'172.29.72.10',port:9944,startup:120,dwell:15}),
  indexer: Object.freeze({host:'172.29.72.11',port:8088,startup:120,dwell:15})
});
export function decode(kind, endpoint, status, bytes) {
  if(status!==200) return {category:'HTTP_REJECTED',passed:false};
  try {
    const s=bytes.toString('utf8');
    if(kind==='proof') {
      const passed=endpoint==='/version'?s.trim()==='8.1.0':JSON.parse(s).status==='ok';
      return {category:passed?'READY':'NOT_READY',passed};
    }
    const j=JSON.parse(s);
    if(kind==='node') {
      if(j.error)return {category:'PUBLIC_API_ERROR',passed:false};
      const passed=j.jsonrpc==='2.0'&&j.id===1&&/^0x[0-9a-fA-F]{64}$/.test(j.result);
      return {category:passed?'BLOCK_ONE_PRESENT':'NOT_READY',passed};
    }
    if(j.errors)return {category:'PUBLIC_API_ERROR',passed:false};
    const height=j.data?.block?.height;
    const passed=!j.errors&&Number.isSafeInteger(height)&&height>=1;
    return {category:passed?'PUBLIC_HEIGHT':'NOT_READY',passed,...(passed?{height}:{})};
  } catch { return {category:'MALFORMED_PUBLIC_RESPONSE',passed:false}; }
}
export function framing(kind,endpoint,rawHeaders) {
  if(!Array.isArray(rawHeaders)||rawHeaders.length%2!==0)throw Error('FRAMING');
  const fields=new Map();
  for(let i=0;i<rawHeaders.length;i+=2){
    if(typeof rawHeaders[i]!=='string'||typeof rawHeaders[i+1]!=='string')throw Error('FRAMING');
    const k=rawHeaders[i].toLowerCase();
    if(['content-length','transfer-encoding','content-type'].includes(k)){
      if(fields.has(k))throw Error('FRAMING');fields.set(k,rawHeaders[i+1]);
    }
  }
  const cl=fields.get('content-length'),te=fields.get('transfer-encoding');
  if((cl!==undefined&&te!==undefined)||(cl===undefined&&te===undefined))throw Error('FRAMING');
  if(cl!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(cl)||Number(cl)>8192||!Number.isSafeInteger(Number(cl))))throw Error('FRAMING');
  if(te!==undefined&&te.toLowerCase()!=='chunked')throw Error('FRAMING');
  const type=fields.get('content-type')?.toLowerCase();
  const permitted=kind==='proof'&&endpoint==='/version'?['text/plain; charset=utf-8','text/plain']:['application/json','application/json; charset=utf-8'];
  if(!permitted.includes(type))throw Error('MEDIA');
  return {length:cl===undefined?null:Number(cl)};
}
export function request(kind,endpoint,body,transport={request:http.request,setTimeout,clearTimeout}) {
  const t=targets[kind];
  return new Promise(resolveResult=>{
    let done=false,total=0,q=null,response=null,ended=false,expected=null;const parts=[];
    const finish=result=>{if(!done){done=true;transport.clearTimeout(deadline);resolveResult(result);}};
    const fail=category=>{finish({category,passed:false});response?.destroy();q?.destroy();};
    const deadline=transport.setTimeout(()=>fail('DEADLINE'),1500);
    try {
      q=transport.request({host:t.host,port:t.port,path:endpoint,method:body?'POST':'GET',agent:false,
        headers:body?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}:{}},r=>{
        response=r;
        r.on('aborted',()=>fail('TRANSPORT'));
        r.on('error',()=>fail('TRANSPORT'));
        r.on('close',()=>{if(!ended)fail('TRANSPORT');});
        if(r.statusCode>=300&&r.statusCode<400){fail('REDIRECT_REJECTED');return;}
        try{expected=framing(kind,endpoint,r.rawHeaders);}catch(e){fail(e.message==='MEDIA'?'MEDIA_REJECTED':'FRAMING_REJECTED');return;}
        r.on('data',b=>{if(done)return;total+=b.length;if(total>8192||(expected.length!==null&&total>expected.length)){fail('RESPONSE_LIMIT');}else parts.push(b);});
        r.on('end',()=>{
          ended=true;
          if(r.complete!==true||r.aborted===true||(r.rawTrailers?.length??0)!==0||(expected.length!==null&&total!==expected.length)){fail('FRAMING_REJECTED');return;}
          finish(decode(kind,endpoint,r.statusCode,Buffer.concat(parts)));
        });
      });
      q.on('error',()=>fail('TRANSPORT'));q.end(body);
    } catch { fail('TRANSPORT'); }
  });
}
export async function main() {
  if(process.argv.length!==4||process.argv[2]!=='--authorized-public-component-probe'||!Object.hasOwn(targets,process.argv[3]))throw Error('DENIED');
  const a=JSON.parse(fs.readFileSync('/authorization/authorization.json','utf8'));
  const hash=crypto.createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex');
  if(a.authorized!==true||a.validForExecution!==true||a.phase!=='3E3A4A'||a.bindings?.probeSha256!==hash||a.permissions?.publicComponentCharacterization!==true||a.permissions?.autonomousEmptyBlocks!==true)throw Error('DENIED');
  for(const p of ['wallet','funding','proof','check','deployment','contractCall','userTransaction','download','pull','cacheMutation'])if(a.permissions[p]!==false)throw Error('DENIED');
  const kind=process.argv[3],t=targets[kind],start=performance.now();let readyAt=null,previousHeight=null;
  while(performance.now()-start<(t.startup+t.dwell+5)*1000){
    const results=[];
    if(kind==='proof')for(const endpoint of ['/health','/version','/ready'])results.push(await request(kind,endpoint));
    else if(kind==='node')results.push(await request(kind,'/',JSON.stringify({jsonrpc:'2.0',id:1,method:'chain_getBlockHash',params:[1]})));
    else results.push(await request(kind,'/api/v4/graphql',JSON.stringify({query:'query PublicComponentHeight { block { height } }'})));
    const passed=results.every(r=>r.passed);
    // Never print response bodies, hashes, headers, unknown errors, or transaction contents.
    process.stdout.write(JSON.stringify({kind,event:'observation',passed,categories:results.map(r=>r.category),...(results[0].height===undefined?{}:{height:results[0].height})})+'\n');
    if(results.some(r=>['REDIRECT_REJECTED','RESPONSE_LIMIT','MALFORMED_PUBLIC_RESPONSE','HTTP_REJECTED','PUBLIC_API_ERROR','TRANSPORT','FRAMING_REJECTED','MEDIA_REJECTED'].includes(r.category)))throw Error('PUBLIC_PROBE_FAILED');
    if(readyAt!==null&&!passed)throw Error('READINESS_LOST');
    if(passed){
      if(readyAt===null)readyAt=performance.now();
      if(kind==='indexer'){if(previousHeight!==null&&results[0].height<previousHeight)throw Error('HEIGHT_REGRESSION');previousHeight=results[0].height;}
      if(performance.now()-readyAt>=t.dwell*1000){
        process.stdout.write(JSON.stringify({kind,event:'dwell-passed',passed:true,categories:results.map(r=>r.category),...(kind==='indexer'?{height:results[0].height}:{})})+'\n');return;
      }
    } else if(performance.now()-start>=t.startup*1000)throw Error('STARTUP_DEADLINE');
    await new Promise(r=>setTimeout(r,1000));
  }
  throw Error('PUBLIC_PROBE_DEADLINE');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){main().catch(()=>{process.stderr.write('PUBLIC_COMPONENT_PROBE_FAILED\n');process.exitCode=1;});}
