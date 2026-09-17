import http from 'node:http';
import { Transform } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const DEFAULTS=Object.freeze({host:'172.28.61.10',port:6300,limit:134217728,responseLimit:33554432,deadline:2700000});
// Construction alone opens no socket or timer. Test overrides are public self-test only.
export function createGuard(options=DEFAULTS) {
  let active=0, transmissions=0;
  const server=http.createServer((req,res)=>{
    transmissions++;
    const fail=(status)=>{ if(!res.headersSent){res.writeHead(status,{'content-type':'text/plain','connection':'close'});res.end('LOCAL_GUARD_REJECTED');}else res.destroy(); };
    if(req.method!=='POST'||!['/check','/prove'].includes(req.url)){fail(400);req.resume();return;}
    if(req.headers['content-type']!=='application/octet-stream'){fail(415);req.resume();return;}
    if(active){fail(429);req.resume();return;}
    const length=req.headers['content-length'];
    if(length!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(length)||Number(length)>options.limit)){fail(413);req.resume();return;}
    active++;let finished=false,upstream,response,timer;
    const finish=()=>{if(finished)return;finished=true;active--;clearTimeout(timer);};
    const abort=(status)=>{fail(status);upstream?.destroy();response?.destroy();req.unpipe();req.resume();finish();};
    const cap=(limit)=>{let bytes=0;return new Transform({transform(chunk,encoding,cb){bytes+=chunk.length;cb(bytes>limit?new Error('LIMIT'):null,bytes>limit?undefined:chunk);}});};
    const requestCap=cap(options.limit);requestCap.on('error',()=>abort(413));
    timer=setTimeout(()=>abort(408),options.deadline);
    upstream=http.request({host:options.host,port:options.port,path:req.url,method:'POST',headers:{'content-type':'application/octet-stream'},agent:false},r=>{
      response=r;
      if(r.statusCode!==200){r.resume();abort(502);return;}
      const responseCap=cap(options.responseLimit);responseCap.on('error',()=>abort(502));r.on('error',()=>abort(502));
      res.writeHead(200,{'content-type':'application/octet-stream'});
      r.pipe(responseCap).pipe(res);
    });
    upstream.on('error',()=>abort(502));req.on('error',()=>abort(400));req.on('aborted',()=>abort(400));res.on('close',()=>{upstream?.destroy();response?.destroy();finish();});res.on('finish',finish);
    req.pipe(requestCap).pipe(upstream);
  });
  server.requestTimeout=0;server.headersTimeout=10000;server.keepAliveTimeout=1000;
  server.on('clientError',(_error,socket)=>{socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');});
  return {server,publicCounts:()=>({transmissions})};
}
export async function main(){
  if(process.argv.length!==3||process.argv[2]!=='--separately-authorized-phase3e3a4-guard')throw new Error('AUTHORIZATION_REQUIRED');
  // This service remains a proposal; supervisor must validate bound authorization before launch.
  const {server}=createGuard();server.listen(6301,'172.28.61.11');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) await main();
