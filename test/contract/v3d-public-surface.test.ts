import {it,expect} from "vitest";
import {readFileSync,writeFileSync} from "node:fs";
import {randomBytes} from "node:crypto";
import ts from "typescript";
import * as rt from "@midnight-ntwrk/compact-runtime";
import {ledger} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3d-prove-qualification.js";
import {p,partition,locations,overrideState,snapshot} from "../support/v3a-register-issuer.js";
import {hex,u8,u16,u64,b32,requestType,domain} from "../support/v2-reference.js";
it("exact four-endpoint ABI and qualification/request/state/output/witness field order",()=>{
 const f=setup(),names=["registerIssuerV2","registerCredentialV2","revokeCredentialV2","proveQualificationV2"];
 for(const group of [f.contract.circuits,f.contract.impureCircuits,f.contract.provableCircuits])expect(Object.keys(group)).toEqual(names);
 const meta=JSON.parse(readFileSync("contracts/managed/just-proof/compiler/contract-info.json","utf8"));expect(meta.circuits.map((x:{name:string})=>x.name)).toEqual(names);
 const file=ts.createSourceFile("generated.d.ts",readFileSync("contracts/managed/just-proof/contract/index.d.ts","utf8"),ts.ScriptTarget.Latest,true);
 const schemas:Record<string,string[]>={QualificationWitnessV2:["credential","subjectSecret","issuerMembership","credentialMembership","revocationPath"],QualificationRequestV2:["protocolVersion","proofType","registryContract","registryContext","qualificationType","qualificationVersion","verifierContext","challenge","requestIssuedAt","requestExpiresAt"],QualificationVerificationStateV2:["protocolVersion","registryContract","registryContext","issuerRoot","nextIssuerIndex","credentialRoot","nextCredentialIndex","revocationRoot"],QualificationProofPublicOutputV2:["requestDigest","stateDigest"],PrivateCredentialPackageV2:["statement","issuanceNonce","credentialOpening"],CredentialStatementV2:["protocolVersion","credentialId","issuerId","subjectCommitment","qualificationType","qualificationVersion","issuedAt","expiresAt"],IssuerMembershipWitnessV2:["record","issuerIndex","path"],CredentialMembershipWitnessV2:["credentialIndex","path"],Witnesses:["registryAuthoritySecretWitness","issuerRegistrationWitnessV2","credentialRegistrationWitnessV2","credentialRevocationWitnessV2","qualificationWitnessV2"]};
 for(const [name,fields]of Object.entries(schemas)){const node=file.statements.find((x):x is ts.TypeAliasDeclaration=>ts.isTypeAliasDeclaration(x)&&x.name.text===name);if(!node||!ts.isTypeLiteralNode(node.type))throw new Error("missing schema "+name);expect(node.type.members.map(x=>x.name?.getText(file))).toEqual(fields);}
});
it("runtime structural privacy gate and invariant public time bounds across private timestamp changes",()=>{
 const f=setup(),w=f.witness(),r=f.request(),random=()=>Uint8Array.from(randomBytes(32));r.requestIssuedAt=100n;r.requestExpiresAt=200n;
 w.subjectSecret=random();w.credential.issuanceNonce=random();w.credential.credentialOpening=random();
 const record=w.issuerMembership.record;record.issuerControlCommitment=p.diagnose_issuerControlV2(f.f.context,random());record.issuerId=p.diagnose_issuerIdV2(f.f.context,record.issuerControlCommitment);
 const statement=w.credential.statement;statement.issuerId=record.issuerId;statement.credentialId=p.diagnose_credentialIdV2(record.issuerId,w.credential.issuanceNonce);statement.subjectCommitment=p.diagnose_subjectCommitmentV2(statement.credentialId,w.subjectSecret);
 w.issuerMembership.issuerIndex=31337n;w.credentialMembership.credentialIndex=23456n;
 w.issuerMembership.path.siblings=Array.from({length:16},random);w.credentialMembership.path.siblings=Array.from({length:16},random);w.revocationPath.siblings=Array.from({length:16},random);
 const issuerRoot=p.root(domain("ISSUER_MERKLE_NODE"),p.diagnose_issuerLeafV2(record),31337n,w.issuerMembership.path.siblings),revocationRoot=p.root(domain("REVOCATION_MERKLE_NODE"),p.diagnose_notRevokedV2(),23456n,w.revocationPath.siblings);
 const runs:unknown[]=[];let previousTimeProgram:unknown;
 for(const [issuedAt,expiresAt]of [[91n,211n],[92n,222n],[93n,0n]]){
  statement.issuedAt=issuedAt;statement.expiresAt=expiresAt;
  const commitment=p.diagnose_credentialCommitmentV2(statement,w.credential.credentialOpening),leaf=p.diagnose_credentialLeafV2(statement.credentialId,commitment),credentialRoot=p.root(domain("CREDENTIAL_MERKLE_NODE"),leaf,23456n,w.credentialMembership.path.siblings);
  const state=overrideState(f.state,new Map<number,bigint|Uint8Array>([[2,issuerRoot],[3,31338n],[5,credentialRoot],[6,23457n],[8,revocationRoot]])),ctx=f.context(w,state,150n),beforeEffects=structuredClone(ctx.currentQueryContext.effects);
  const out=f.contract.circuits.proveQualificationV2(ctx,r),[guaranteed,fallible]=partition(ctx,out),program=out.proofData.publicTranscript;
  expect(guaranteed).toBeDefined();expect(fallible).toBeUndefined();expect(out.context.currentQueryContext.effects).toEqual(beforeEffects);expect(snapshot(ledger(out.context.currentQueryContext.state))).toEqual(snapshot(ledger(ctx.currentQueryContext.state)));
  expect(out.proofData.input).toEqual({value:requestType.toValue(r),alignment:requestType.alignment()});
  expect(out.proofData.output).toEqual({value:[...b32.toValue(out.result.requestDigest),...b32.toValue(out.result.stateDigest)],alignment:[...b32.alignment(),...b32.alignment()]});
  expect(program.map(op=>typeof op==="string"?op:Object.keys(op)[0])).toEqual([...Array.from({length:7},()=>["dup","idx","popeq"]).flat(),...Array.from({length:2},()=>["dup","idx","push","lt","popeq"]).flat()]);
  const selectors=program.flatMap(op=>typeof op==="object"&&"idx"in op?op.idx.path.map(key=>{if(key.tag!=="value")throw new Error("dynamic selector");return u8.fromValue([...key.value.value]);}):[]);
  expect(selectors).toEqual([0n,1n,3n,2n,6n,5n,8n,2n,2n]);expect(program.flatMap(op=>typeof op==="object"&&"dup"in op?[op.dup.n]:[])).toEqual([2,0,0,0,0,0,0,2,2]);
  const pushedTimes=program.flatMap(op=>typeof op==="object"&&"push"in op?(()=>{const cell=rt.StateValue.decode(op.push.value).asCell();if(!cell)throw new Error("expected time cell");return [u64.fromValue([...cell.value])];})():[]);expect(pushedTimes).toEqual([100n,200n]);
  const timeProgram=program.slice(21);if(previousTimeProgram)expect(timeProgram).toEqual(previousTimeProgram);previousTimeProgram=structuredClone(timeProgram);
  const comparisons=timeProgram.flatMap(op=>typeof op==="object"&&"popeq"in op&&op.popeq.result?[rt.CompactTypeBoolean.fromValue([...op.popeq.result.value])]:[]);expect(comparisons).toEqual([false,true]);
  const surfaces={argument:out.proofData.input,result:out.result,output:out.proofData.output,query:program,guaranteed,fallible,effects:out.context.currentQueryContext.effects,ledger:out.context.currentQueryContext.state.state.encode()};
  const atoms:Record<string,Uint8Array[]>={subjectSecret:[w.subjectSecret],issuerControl:[record.issuerControlCommitment],issuerId:[record.issuerId],credentialId:[statement.credentialId],subjectCommitment:[statement.subjectCommitment],credentialCommitment:[commitment],credentialLeaf:[leaf],nonce:[w.credential.issuanceNonce],opening:[w.credential.credentialOpening],issuerIndex:u16.toValue(31337n),credentialIndex:u16.toValue(23456n),issuerPath:w.issuerMembership.path.siblings,credentialPath:w.credentialMembership.path.siblings,revocationPath:w.revocationPath.siblings,issuedAt:u64.toValue(issuedAt),...(expiresAt!==0n?{expiresAt:u64.toValue(expiresAt)}:{})};
  // Zero expiry, fixed qualification and protocol constants are not unique secret canaries.
  const findings:Record<string,Record<string,number>>={};for(const [name,values]of Object.entries(atoms)){findings[name]={};for(const [place,value]of Object.entries(surfaces)){const count=values.reduce((n,x)=>n+locations(value,x).length,0);findings[name][place]=count;expect(count===0).toBe(true);}}
  for(const atom of [w.subjectSecret,record.issuerId,statement.credentialId,statement.subjectCommitment,w.credential.issuanceNonce,w.credential.credentialOpening,...w.issuerMembership.path.siblings,...w.credentialMembership.path.siblings,...w.revocationPath.siblings,...u64.toValue(issuedAt)])expect(locations(out.proofData.privateTranscriptOutputs,atom).length>0).toBe(true);
  for(const root of [issuerRoot,credentialRoot,revocationRoot])expect(locations(guaranteed,root).length>0).toBe(true);
  expect(locations(out.proofData.output,out.result.requestDigest).length>0).toBe(true);expect(locations(out.proofData.output,out.result.stateDigest).length>0).toBe(true);
  runs.push({passed:true,findings,positiveControls:{privateWitness:true,currentRoots:true,outputDigests:true,requestInput:true},input:out.proofData.input,output:out.proofData.output,query:program,guaranteed,fallible,effects:out.context.currentQueryContext.effects,pushedTimes});
 }
 const source=readFileSync("contracts/just-proof.compact","utf8").split("export circuit proveQualificationV2")[1];expect(source.match(/disclose\(/g)).toHaveLength(2);expect(source).toContain("blockTimeGte(disclose(request.requestIssuedAt))");expect(source).toContain("blockTimeLt(disclose(request.requestExpiresAt))");
 const replacer=(_k:string,v:unknown)=>typeof v==="bigint"?v.toString():v instanceof Uint8Array?{bytes:hex(v)}:v instanceof Map?[...v]:v;
 writeFileSync("docs/development/evidence/phase-3d/public-surface.json",JSON.stringify({passed:true,privateTimesChangeOnlyAuthenticatedRootsAndDigests:true,timeProgramInvariant:true,runs},replacer,2));
});
