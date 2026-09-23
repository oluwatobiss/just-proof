import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
export async function main(){
 if(process.argv[2]!=='--public-guard-tests')throw new Error('FLAG_REQUIRED');
 const {default:assert}=await import('node:assert/strict');const http=await import('node:http');const net=await import('node:net');const {createGuard}=await import('./proposed-redirect-guard.mjs');
 let mode='ok',lastLength;const mock=http.createServer((q,s)=>{lastLength=q.headers['content-length'];q.resume();q.on('end',()=>{
  if(mode==='timeout')return;
  if(mode==='redirect'){s.writeHead(307,{location:'http://example.invalid/'});s.end('PUBLIC_CANARY');return;}
  if(mode==='error'){s.writeHead(500);s.end('PUBLIC_CANARY');return;}
  if(mode==='overflow'){s.writeHead(200);s.write('x'.repeat(40));s.end();return;}
  s.writeHead(200);s.write('PUBLIC_');s.end('OK');
 });});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));const g=createGuard({host:'127.0.0.1',port:mock.address().port,limit:32,responseLimit:16,deadline:120});await new Promise(r=>g.server.listen(0,'127.0.0.1',r));const port=g.server.address().port;
 const delay=ms=>new Promise(r=>setTimeout(r,ms));let tests=0;
 async function request({method='POST',path='/prove',type='application/octet-stream',body='PUBLIC_CANARY',length=String(body.length)}={}){return new Promise(resolve=>{
  const headers={'content-type':type};if(length!==null)headers['content-length']=length;
  const q=http.request({host:'127.0.0.1',port,path,method,headers},s=>{let body='';s.on('data',c=>body+=c);s.on('aborted',()=>resolve({status:s.statusCode,body,aborted:true}));s.on('end',()=>resolve({status:s.statusCode,body,location:s.headers.location}));});q.on('error',()=>resolve({error:true}));q.end(body);
 });}
 async function raw(headers,body=''){return new Promise(resolve=>{const s=net.connect(port,'127.0.0.1');let out='';s.on('connect',()=>s.end(headers+'\r\nConnection: close\r\n\r\n'+body));s.on('data',c=>out+=c);s.on('close',()=>resolve(out));s.on('error',()=>resolve(out));});}
 const publicReject=r=>{assert.ok(!r.body?.includes('PUBLIC_CANARY'));assert.equal(r.location,undefined);};
 try{
  let before=g.publicCounters();let r=await request();assert.equal(r.body,'PUBLIC_OK');assert.equal(lastLength,'13');await delay(5);let after=g.publicCounters();for(const k of ['inboundRequests','eligibleForForwarding','upstreamRequestsCreated','completedUpstreamResponses'])assert.equal(after[k]-before[k],1);tests++;
  for(const [m,category] of [['redirect','REDIRECT'],['error','UPSTREAM_STATUS']]){mode=m;before=g.publicCounters();r=await request();assert.equal(r.status,502);assert.equal(r.body,'LOCAL_GUARD_REJECTED');publicReject(r);after=g.publicCounters();assert.equal(after.rejections[category]-(before.rejections[category]??0),1);assert.equal(after.upstreamRequestsCreated-before.upstreamRequestsCreated,1);tests++;}
  mode='ok';
  for(const [args,status] of [[{method:'GET'},405],[{path:'/other'},404],[{type:'text/plain'},415],[{body:'',length:'0'},400],[{body:'x'.repeat(33)},413]]){before=g.publicCounters();r=await request(args);assert.equal(r.status,status);publicReject(r);after=g.publicCounters();assert.equal(after.upstreamRequestsCreated,before.upstreamRequestsCreated);assert.equal(after.inboundRequests,before.inboundRequests+1);tests++;}
  for(const extra of ['', 'Content-Length: +1\r\n','Content-Length: 1\r\nContent-Length: 1\r\n','Transfer-Encoding: chunked\r\n','Content-Length: 1\r\nTransfer-Encoding: chunked\r\n']){before=g.publicCounters();const x=await raw('POST /prove HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/octet-stream\r\n'+extra);assert.match(x,/HTTP\/1\.1 (400|411)/);assert.ok(!x.includes('Location:'));after=g.publicCounters();assert.equal(after.upstreamRequestsCreated,before.upstreamRequestsCreated);tests++;}
  mode='timeout';const pending=request();await delay(20);before=g.publicCounters();r=await request();assert.equal(r.status,429);assert.equal(g.publicCounters().upstreamRequestsCreated,before.upstreamRequestsCreated);publicReject(r);tests++;r=await pending;assert.equal(r.status,408);publicReject(r);tests++;
  mode='timeout';before=g.publicCounters();await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1');s.on('connect',()=>{s.write('POST /prove HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/octet-stream\r\nContent-Length: 13\r\n\r\nP');setTimeout(()=>{s.destroy();resolve();},20);});});await delay(20);assert.equal(g.publicCounters().rejections.CLIENT_DISCONNECT-(before.rejections.CLIENT_DISCONNECT??0),1);tests++;
  mode='overflow';before=g.publicCounters();r=await request();await delay(10);assert.equal(g.publicCounters().rejections.RESPONSE_SIZE-(before.rejections.RESPONSE_SIZE??0),1);publicReject(r);tests++;
  const c=g.publicCounters();assert.equal(c.eligibleForForwarding,c.upstreamRequestsCreated);assert.ok(c.completedUpstreamResponses<=c.upstreamRequestsCreated);assert.equal(c.inboundRequests,17);assert.equal(c.upstreamRequestsCreated,6);assert.equal(c.completedUpstreamResponses,4);assert.deepEqual(c.rejections,{REDIRECT:1,UPSTREAM_STATUS:1,METHOD:1,PATH:1,MEDIA_TYPE:1,LENGTH:2,OVERSIZE:1,PARSER:6,FRAMING:1,CONCURRENCY:1,TIMEOUT:1,CLIENT_DISCONNECT:1,RESPONSE_SIZE:1});tests++;
  console.log(JSON.stringify({passed:tests,counters:c,noErrorCanaryEcho:true,noLocation:true,providerUsed:false,proofServerUsed:false}));
 }finally{g.server.closeAllConnections();mock.closeAllConnections();await Promise.all([new Promise(r=>g.server.close(r)),new Promise(r=>mock.close(r))]);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(JSON.stringify({category:'PUBLIC_GUARD_ASSERTION_FAILED',actual:typeof e.actual==='number'?e.actual:null,expected:typeof e.expected==='number'?e.expected:null}));process.exitCode=1;});
