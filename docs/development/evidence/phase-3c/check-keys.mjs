// Local key-format and fingerprint checks only. Does not generate or verify a proof.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ContractOperation} from '@midnight-ntwrk/ledger-v8';
const base=dirname(fileURLToPath(import.meta.url));
const result=JSON.parse(readFileSync(join(base,'result.json'),'utf8'));
const manifest=JSON.parse(readFileSync(join(base,'artifact-manifest.json'),'utf8'));
const rows=[];
for(const name of ['registerIssuerV2','registerCredentialV2','revokeCredentialV2']){
 const row={circuit:name,proverBytes:0,verifierBytes:0,verifierRoundTrip:false};
 for(const type of ['prover','verifier']){
  const p=join(result.output,'keys',name+'.'+type);
  if(existsSync(p))row[type+'Bytes']=readFileSync(p).length;
 }
 if(row.verifierBytes){
  try{const key=readFileSync(join(result.output,'keys',name+'.verifier'));const op=new ContractOperation();op.verifierKey=key;const recovered=ContractOperation.deserialize(op.serialize());row.verifierRoundTrip=Buffer.from(recovered.verifierKey).equals(key);}
  catch(error){row.formatError=String(error);}
 }
 rows.push(row);
}
const historical=JSON.parse(readFileSync(join(base,'../phase-3b/historical-resource-record.json'),'utf8'));
const comparisons=manifest.artifacts.filter(a=>/^(keys|zkir)\/register(Issuer|Credential)V2\./.test(a.path)).map(a=>{const previous=historical.artifacts.find(p=>p.path===a.path);return {path:a.path,previousSha256:previous?.sha256,currentSha256:a.sha256,equal:previous?.sha256===a.sha256,provenance:'Issuer accepted Phase 3A2; credential historical Phase 3B fingerprint, not recovered old keys.'};});
const complete=result.compilerExit===0&&!result.stopReason&&rows.every(r=>r.proverBytes>0&&r.verifierBytes>0&&r.verifierRoundTrip)&&rows.every(r=>['.zkir','.bzkir'].every(ext=>manifest.artifacts.some(a=>a.path==='zkir/'+r.circuit+ext&&a.bytes>0)))&&['compiler/contract-info.json','contract/index.js','contract/index.d.ts','contract/index.js.map'].every(path=>manifest.artifacts.some(a=>a.path===path&&a.bytes>0));
writeFileSync(join(base,'key-check.json'),JSON.stringify({complete,rows,comparisons},null,2)+'\n');
console.log(JSON.stringify({complete,rows,comparisons},null,2));
