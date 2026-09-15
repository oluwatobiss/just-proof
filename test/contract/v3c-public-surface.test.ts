import {it,expect} from "vitest";
import {readFileSync,writeFileSync} from "node:fs";
import {randomBytes} from "node:crypto";
import ts from "typescript";
import {ledger} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3c-revoke-credential.js";
import {p,partition,locations,overrideState} from "../support/v3a-register-issuer.js";
import {hex,u8,u16,domain} from "../support/v2-reference.js";
it("exact four-circuit ABI, ordered revocation witness and no diagnostic callback",()=>{
  const f=setup(),names=["registerIssuerV2","registerCredentialV2","revokeCredentialV2","proveQualificationV2"];
  for(const group of [f.contract.circuits,f.contract.impureCircuits,f.contract.provableCircuits])expect(Object.keys(group)).toEqual(names);
  const meta=JSON.parse(readFileSync("contracts/managed/just-proof/compiler/contract-info.json","utf8"));expect(meta.circuits.map((x:{name:string})=>x.name)).toEqual(names);expect(meta.circuits.find((x:{name:string})=>x.name==="revokeCredentialV2").arguments).toEqual([]);
  const file=ts.createSourceFile("generated.d.ts",readFileSync("contracts/managed/just-proof/contract/index.d.ts","utf8"),ts.ScriptTarget.Latest,true);
  const schemas:Record<string,string[]>={CredentialRevocationWitnessV2:["issuerSecret","issuerMembership","issuanceNonce","credentialId","credentialCommitment","credentialMembership","revocationPath"],CredentialMembershipWitnessV2:["credentialIndex","path"],IssuerMembershipWitnessV2:["record","issuerIndex","path"],IssuerRecordV2:["protocolVersion","issuerId","issuerControlCommitment"],IssuerMerklePathV2:["siblings"],CredentialMerklePathV2:["siblings"],RevocationMerklePathV2:["siblings"],Witnesses:["registryAuthoritySecretWitness","issuerRegistrationWitnessV2","credentialRegistrationWitnessV2","credentialRevocationWitnessV2","qualificationWitnessV2"]};
  for(const [name,fields]of Object.entries(schemas)){
    const node=file.statements.find((x):x is ts.TypeAliasDeclaration=>ts.isTypeAliasDeclaration(x)&&x.name.text===name);if(!node||!ts.isTypeLiteralNode(node.type))throw new Error("missing struct "+name);expect(node.type.members.map(x=>x.name?.getText(file))).toEqual(fields);
  }
});
it("real partition structural gate: only existing reads and final revocation root; no private atoms or extra effects",()=>{
  const f=setup(),w=f.witness(),random=()=>Uint8Array.from(randomBytes(32));
  w.issuerSecret=random();w.issuanceNonce=random();w.credentialCommitment=random();
  const r=w.issuerMembership.record;r.issuerControlCommitment=p.diagnose_issuerControlV2(f.f.context,w.issuerSecret);r.issuerId=p.diagnose_issuerIdV2(f.f.context,r.issuerControlCommitment);w.credentialId=p.diagnose_credentialIdV2(r.issuerId,w.issuanceNonce);
  w.issuerMembership.issuerIndex=31337n;w.credentialMembership.credentialIndex=23456n;
  // Synthetic authenticated roots with unique private siblings; no authority is delegated to these fixtures.
  w.issuerMembership.path.siblings=Array.from({length:16},random);w.credentialMembership.path.siblings=Array.from({length:16},random);w.revocationPath.siblings=Array.from({length:16},random);
  const leaf=p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment),revoked=p.diagnose_revokedLeafV2(w.credentialId,w.credentialCommitment);
  const issuerRoot=p.root(domain("ISSUER_MERKLE_NODE"),p.diagnose_issuerLeafV2(r),w.issuerMembership.issuerIndex,w.issuerMembership.path.siblings);
  const credentialRoot=p.root(domain("CREDENTIAL_MERKLE_NODE"),leaf,w.credentialMembership.credentialIndex,w.credentialMembership.path.siblings);
  const revocationRoot=p.root(domain("REVOCATION_MERKLE_NODE"),p.diagnose_notRevokedV2(),w.credentialMembership.credentialIndex,w.revocationPath.siblings);
  const state=overrideState(f.state,new Map<number,bigint|Uint8Array>([[2,issuerRoot],[3,31338n],[5,credentialRoot],[6,23457n],[8,revocationRoot]]));
  const ctx=f.context(w,state),beforeEffects=structuredClone(ctx.currentQueryContext.effects),out=f.contract.circuits.revokeCredentialV2(ctx),[guaranteed,fallible]=partition(ctx,out);
  expect(guaranteed).toBeDefined();expect(fallible).toBeUndefined();expect(out.result).toEqual([]);expect(out.proofData.input).toEqual({value:[],alignment:[]});expect(out.proofData.output).toEqual({value:[],alignment:[]});expect(out.context.currentQueryContext.effects).toEqual(beforeEffects);
  const program=out.proofData.publicTranscript;
  expect(program.map(op=>typeof op==="string"?op:Object.keys(op)[0])).toEqual([...Array.from({length:6},()=>["dup","idx","popeq"]).flat(),"push","push","ins"]);
  const selectors=program.flatMap(op=>typeof op==="object"&&"idx"in op?op.idx.path.map(key=>{if(key.tag!=="value")throw new Error("dynamic selector");return u8.fromValue([...key.value.value]);}):[]);
  expect(selectors).toEqual([1n,3n,2n,6n,5n,8n]);expect(program.flatMap(op=>typeof op==="object"&&"dup"in op?[op.dup.n]:[])).toEqual([0,0,0,0,0,0]);
  const surfaces={arguments:out.proofData.input,output:out.proofData.output,query:program,guaranteed,fallible,effects:out.context.currentQueryContext.effects,ledger:out.context.currentQueryContext.state.state.encode()};
  const privateAtoms:Record<string,Uint8Array[]>={issuerSecret:[w.issuerSecret],issuerControl:[r.issuerControlCommitment],issuerId:[r.issuerId],issuerIndex:u16.toValue(w.issuerMembership.issuerIndex),issuerPath:w.issuerMembership.path.siblings,nonce:[w.issuanceNonce],credentialId:[w.credentialId],credentialCommitment:[w.credentialCommitment],credentialLeaf:[leaf],credentialIndex:u16.toValue(w.credentialMembership.credentialIndex),credentialPath:w.credentialMembership.path.siblings,revocationPath:w.revocationPath.siblings,revokedLeaf:[revoked]};
  const findings:Record<string,Record<string,number>>={};
  for(const [name,atoms]of Object.entries(privateAtoms)){findings[name]={};for(const [place,value]of Object.entries(surfaces)){const count=atoms.reduce((n,x)=>n+locations(value,x).length,0);findings[name][place]=count;expect(count===0).toBe(true);}}
  for(const atom of [w.issuerSecret,r.issuerControlCommitment,r.issuerId,w.issuanceNonce,w.credentialId,w.credentialCommitment,...w.issuerMembership.path.siblings,...w.credentialMembership.path.siblings,...w.revocationPath.siblings,...u16.toValue(w.issuerMembership.issuerIndex),...u16.toValue(w.credentialMembership.credentialIndex)])expect(locations(out.proofData.privateTranscriptOutputs,atom).length>0).toBe(true);
  const finalRoot=ledger(out.context.currentQueryContext.state).revocationRoot;expect(locations(guaranteed,finalRoot).length>0).toBe(true);expect(locations(program,finalRoot).length>0).toBe(true);
  const source=readFileSync("contracts/just-proof.compact","utf8").split("export circuit revokeCredentialV2")[1].split("export circuit proveQualificationV2")[0];expect(source.match(/disclose\(/g)).toHaveLength(1);expect(source).toContain("revocationRoot = disclose(newRoot)");
  const replacer=(_k:string,v:unknown)=>typeof v==="bigint"?v.toString():v instanceof Uint8Array?{bytes:hex(v)}:v instanceof Map?[...v]:v;
  writeFileSync("docs/development/evidence/phase-3d/retained-3c-public-surface.json",JSON.stringify({passed:true,findings,positiveControls:{finalRoot:true,privateWitnessCanaries:true},input:out.proofData.input,output:out.proofData.output,query:program,guaranteed,fallible,effectsBefore:beforeEffects,effectsAfter:out.context.currentQueryContext.effects},replacer,2));
});
