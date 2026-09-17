import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export function main(){
 if(process.argv.length!==3||process.argv[2]!=='--separately-authorized-phase3e3a4-idle')throw new Error('AUTHORIZATION_REQUIRED');
 const timer=setInterval(()=>{},1000);
 process.once('SIGTERM',()=>clearInterval(timer));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
