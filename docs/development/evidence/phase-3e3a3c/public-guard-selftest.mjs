import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
export async function main(){
 if(process.argv[2]!=='--public-guard-selftest')throw new Error('FLAG_REQUIRED');
 const http=await import('node:http');const {default:assert}=await import('node:assert/strict');const {createGuard}=await import('./proposed-redirect-guard.mjs');
 const mock=http.createServer((q,s)=>{q.resume();if(q.url==='/check'){s.writeHead(302,{location:'http://example.invalid/'});s.end('PUBLIC_CANARY');}else if(q.headers['content-type']){s.writeHead(500);s.end('PUBLIC_CANARY');}});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));const g=createGuard({host:'127.0.0.1',port:mock.address().port,limit:16,responseLimit:32,deadline:80});await new Promise(r=>g.server.listen(0,'127.0.0.1',r));
 async function req(path,method='POST',body='PUBLIC_CANARY'){return new Promise((resolve,reject)=>{const q=http.request({host:'127.0.0.1',port:g.server.address().port,path,method,headers:{'content-type':'application/octet-stream','content-length':Buffer.byteLength(body)}},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>resolve({status:s.statusCode,body:b,location:s.headers.location}));});q.on('error',reject);q.end(body);});}
 let count=0;try{
 for(const [path,method,body,expected] of [['/check','POST','PUBLIC_CANARY',502],['/prove','POST','PUBLIC_CANARY',502],['/bad','POST','PUBLIC_CANARY',400],['/prove','GET','PUBLIC_CANARY',400],['/prove','POST','x'.repeat(17),413]]){const r=await req(path,method,body);assert.equal(r.status,expected);assert.equal(r.body,'LOCAL_GUARD_REJECTED');assert.equal(r.location,undefined);count++;}
 mock.removeAllListeners('request');mock.on('request',q=>q.resume());const r=await req('/prove');assert.equal(r.status,408);assert.equal(r.body,'LOCAL_GUARD_REJECTED');count++;
 console.log(JSON.stringify({passed:count,transmissions:g.publicCounts().transmissions,canaryEcho:false,proofProviderUsed:false,proofServerUsed:false}));
 }finally{g.server.closeAllConnections();mock.closeAllConnections();await Promise.all([new Promise(r=>g.server.close(r)),new Promise(r=>mock.close(r))]);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
