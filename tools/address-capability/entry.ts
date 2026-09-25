import { bootstrap } from './bootstrap';
const target=document.getElementById('root');
if(target) void bootstrap(target,async()=>{
  const { mountProbe }=await import('./main');
  mountProbe(target);
});
