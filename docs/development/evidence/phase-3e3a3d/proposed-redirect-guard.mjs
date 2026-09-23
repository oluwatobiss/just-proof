import http from 'node:http';
import {Transform} from 'node:stream';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const fixed=Object.freeze({host:'172.28.61.10',port:6300,limit:134217728,responseLimit:33554432,deadline:2700000});
export function createGuard(config=fixed){
 const counts={inboundRequests:0,eligibleForForwarding:0,upstreamRequestsCreated:0,completedUpstreamResponses:0,rejections:{}};
 let active=false;const parserReported=new WeakSet();const parsedSockets=new WeakSet();
 const rejectCount=c=>{counts.rejections[c]=(counts.rejections[c]??0)+1;};
 const server=http.createServer((req,res)=>{
  counts.inboundRequests++;parsedSockets.add(req.socket);
  let rejected=false,done=false,up,response,timer,requestLimiter,responseLimiter;
  const fail=(category,status)=>{
   if(!rejected){rejected=true;rejectCount(category);}
   if(!res.headersSent){res.writeHead(status,{'content-type':'text/plain','connection':'close'});res.end('LOCAL_GUARD_REJECTED');}else res.destroy();
  };
  const early=(c,s)=>{fail(c,s);req.resume();};
  if(req.method!=='POST')return early('METHOD',405);
  if(req.url!=='/check'&&req.url!=='/prove')return early('PATH',404);
  const raw=req.rawHeaders;const fields={};for(let i=0;i<raw.length;i+=2){const k=raw[i].toLowerCase();(fields[k]??=[]).push(raw[i+1]);}
  if(fields['transfer-encoding']||fields.expect||fields.trailer)return early('FRAMING',400);
  if(fields['content-type']?.length!==1||fields['content-type'][0]!=='application/octet-stream')return early('MEDIA_TYPE',415);
  const lengths=fields['content-length'];
  if(!lengths||lengths.length!==1)return early('LENGTH',411);
  const length=lengths[0];if(!/^[1-9][0-9]*$/.test(length))return early('LENGTH',400);
  if(length.length>9||Number(length)>config.limit)return early('OVERSIZE',413);
  if(active)return early('CONCURRENCY',429);
  counts.eligibleForForwarding++;active=true;
  const finish=()=>{if(done)return;done=true;active=false;clearTimeout(timer);};
  const abort=(c,s)=>{if(done)return;fail(c,s);req.unpipe();up?.destroy();response?.destroy();requestLimiter?.destroy();responseLimiter?.destroy();req.resume();finish();};
  const limiter=(limit)=>{let seen=0;return new Transform({transform(chunk,encoding,cb){seen+=chunk.length;if(seen>limit)cb(new Error('LIMIT'));else cb(null,chunk);}});};
  timer=setTimeout(()=>abort('TIMEOUT',408),config.deadline);
  requestLimiter=limiter(Number(length));requestLimiter.on('error',()=>abort('REQUEST_SIZE',413));
  try{
   up=http.request({host:config.host,port:config.port,path:req.url,method:'POST',agent:false,headers:{'content-type':'application/octet-stream','content-length':length}},r=>{
    response=r;
    r.once('end',()=>{if(r.complete)counts.completedUpstreamResponses++;});
    r.on('error',()=>abort('UPSTREAM_RESPONSE',502));r.on('aborted',()=>abort('UPSTREAM_RESPONSE',502));
    if(r.statusCode!==200){r.resume();abort(r.statusCode>=300&&r.statusCode<400?'REDIRECT':'UPSTREAM_STATUS',502);return;}
    const cl=r.headers['content-length'];if(cl&&(!/^(0|[1-9][0-9]*)$/.test(cl)||Number(cl)>config.responseLimit)){r.resume();abort('RESPONSE_SIZE',502);return;}
    responseLimiter=limiter(config.responseLimit);responseLimiter.on('error',()=>abort('RESPONSE_SIZE',502));
    res.writeHead(200,{'content-type':'application/octet-stream'});r.pipe(responseLimiter).pipe(res);
   });counts.upstreamRequestsCreated++;
  }catch{abort('UPSTREAM_CREATE',502);return;}
  up.on('error',()=>abort('UPSTREAM_CONNECTION',502));req.on('aborted',()=>abort('CLIENT_DISCONNECT',400));req.on('error',()=>abort('CLIENT_DISCONNECT',400));
  res.on('finish',finish);res.on('close',()=>{if(!done)abort('CLIENT_DISCONNECT',400);});
  req.pipe(requestLimiter).pipe(up);
 });
 server.requestTimeout=0;server.headersTimeout=10000;server.keepAliveTimeout=1000;
 server.on('checkContinue',(req,res)=>{counts.inboundRequests++;parsedSockets.add(req.socket);rejectCount('FRAMING');res.writeHead(400,{'connection':'close'});res.end('LOCAL_GUARD_REJECTED');});
 server.on('clientError',(_e,socket)=>{if(parserReported.has(socket)){socket.destroy();return;}parserReported.add(socket);if(!parsedSockets.has(socket))counts.inboundRequests++;rejectCount('PARSER');if(socket.writable)socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');});
 return {server,publicCounters:()=>structuredClone(counts)};
}
export async function main(){
 if(process.argv.length!==4||process.argv[2]!=='--separately-authorized-a4-guard')throw new Error('AUTHORIZATION_REQUIRED');
 const a=JSON.parse(readFileSync(process.argv[3],'utf8'));
 const self=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
 if(a.authorized!==true||a.validForExecution!==true||a.phase!=='3E3A4'||a.bindings?.guardSha256!==self||a.permissions?.proofRequests!==false)throw new Error('AUTHORIZATION_INVALID');
 const g=createGuard();
 process.on('SIGUSR1',()=>process.stdout.write(JSON.stringify(g.publicCounters())+'\n'));
 process.once('SIGTERM',()=>{g.server.closeAllConnections();g.server.close();});
 g.server.listen(6301,'172.28.61.11');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{process.stderr.write('GUARD_START_REJECTED\n');process.exitCode=1;});
