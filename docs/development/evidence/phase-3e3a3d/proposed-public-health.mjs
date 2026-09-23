import http from 'node:http';import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const targets=Object.freeze({health:['172.28.61.10',6300,'/health'],version:['172.28.61.10',6300,'/version'],ready:['172.28.61.10',6300,'/ready']});
export async function main(){
 if(process.argv[2]!=='--separately-authorized-a4-public-health'||!Object.hasOwn(targets,process.argv[3]))throw new Error('AUTHORIZATION_REQUIRED');
 const [host,port,path]=targets[process.argv[3]];
 const result=await new Promise(resolve=>{let done=false;const finish=v=>{if(!done){done=true;resolve(v);}};const q=http.get({host,port,path,agent:false,timeout:2000},r=>{let size=0,body='';r.on('data',c=>{size+=c.length;if(size>4096){q.destroy();finish(false);}else body+=c;});r.on('end',()=>{let ok=r.statusCode===200;try{ok=ok&&(process.argv[3]==='version'?body.trim()==='8.1.0':JSON.parse(body).status==='ok');}catch{ok=false;}finish(ok);});r.on('error',()=>finish(false));});q.on('timeout',()=>{q.destroy();finish(false);});q.on('error',()=>finish(false));});
 process.stdout.write(JSON.stringify({probe:process.argv[3],passed:result})+'\n');if(!result)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{process.stderr.write('HEALTH_REJECTED\n');process.exitCode=1;});
