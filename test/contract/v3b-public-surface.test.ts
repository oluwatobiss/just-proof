import {it,expect} from "vitest";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {randomBytes} from "node:crypto";
import * as rt from "@midnight-ntwrk/compact-runtime";
import ts from "typescript";
import {ledger} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3b-register-credential.js";
import {p,partition,locations,overrideState} from "../support/v3a-register-issuer.js";
import {hex,u8,u16,u64} from "../support/v2-reference.js";
it("exact two-endpoint ABI and ordered generated witness/nested schemas",()=>{
  const f=setup(),names=["registerIssuerV2","registerCredentialV2"];
  for(const endpoints of [f.contract.circuits,f.contract.impureCircuits,f.contract.provableCircuits])expect(Object.keys(endpoints)).toEqual(names);
  const meta=JSON.parse(readFileSync("contracts/managed/just-proof/compiler/contract-info.json","utf8"));
  expect(meta.circuits.map((x:{name:string})=>x.name)).toEqual(names);
  expect(meta.circuits.find((x:{name:string})=>x.name==="registerCredentialV2").arguments).toEqual([]);
  const file=ts.createSourceFile("generated.d.ts",readFileSync("contracts/managed/just-proof/contract/index.d.ts","utf8"),ts.ScriptTarget.Latest,true);
  const schemas:Record<string,string[]>={
    CredentialRegistrationWitnessV2:["issuerSecret","credential","issuerMembership","insertionPath"],
    PrivateCredentialPackageV2:["statement","issuanceNonce","credentialOpening"],
    CredentialStatementV2:["protocolVersion","credentialId","issuerId","subjectCommitment","qualificationType","qualificationVersion","issuedAt","expiresAt"],
    IssuerMembershipWitnessV2:["record","issuerIndex","path"],
    IssuerRecordV2:["protocolVersion","issuerId","issuerControlCommitment"],
    IssuerMerklePathV2:["siblings"],CredentialMerklePathV2:["siblings"]
  };
  for(const [name,fields]of Object.entries(schemas)){
    const node=file.statements.find((x):x is ts.TypeAliasDeclaration=>ts.isTypeAliasDeclaration(x)&&x.name.text===name);
    if(!node||!ts.isTypeLiteralNode(node.type))throw new Error("missing generated struct "+name);
    expect(node.type.members.map(x=>x.name?.getText(file))).toEqual(fields);
  }
});
it("structural public-surface gate: only nullifier/root/counters and existing reads; no private atoms or time bounds",()=>{
  const f=setup(),w=f.witness();
  // Ephemeral independent canaries; never write or log private witness values.
  w.issuerSecret=Uint8Array.from(randomBytes(32));w.credential.issuanceNonce=Uint8Array.from(randomBytes(32));
  w.credential.credentialOpening=Uint8Array.from(randomBytes(32));w.credential.statement.subjectCommitment=Uint8Array.from(randomBytes(32));
  const record=w.issuerMembership.record;
  record.issuerControlCommitment=p.diagnose_issuerControlV2(f.f.context,w.issuerSecret);record.issuerId=p.diagnose_issuerIdV2(f.f.context,record.issuerControlCommitment);
  w.issuerMembership.issuerIndex=31337n; // Distinct from public field selectors/counters.
  w.credential.statement.issuerId=record.issuerId;
  w.credential.statement.credentialId=p.diagnose_credentialIdV2(record.issuerId,w.credential.issuanceNonce);
  w.credential.statement.issuedAt=1734567890123n;w.credential.statement.expiresAt=1834567890123n;
  const state=f.installRecord(w),ctx=f.context(w,state),beforeEffects=structuredClone(ctx.currentQueryContext.effects);
  const out=f.contract.circuits.registerCredentialV2(ctx),[guaranteed,fallible]=partition(ctx,out);
  expect(guaranteed).toBeDefined();expect(fallible).toBeUndefined();
  expect(out.proofData.input).toEqual({value:[],alignment:[]});expect(out.proofData.output).toEqual({value:[],alignment:[]});expect(out.result).toEqual([]);
  expect(out.context.currentQueryContext.effects).toEqual(beforeEffects);
  // Exact installed-runtime query structure: no log, time query or extra effect.
  const program=out.proofData.publicTranscript;
  expect(program.map(op=>typeof op==="string"?op:Object.keys(op)[0])).toEqual([
    "dup","idx","popeq","dup","idx","popeq","dup","idx","popeq","dup","idx","popeq",
    "dup","idx","push","member","popeq","dup","idx","popeq","dup","idx","popeq",
    "push","push","ins","push","push","ins","idx","push","push","ins","ins"
  ]);
  const selectors=program.flatMap(op=>typeof op==="object" && "idx" in op?op.idx.path.map(key=>{
    if(key.tag!=="value")throw new Error("unexpected dynamic public selector");
    return u8.fromValue([...key.value.value]);
  }):[]);
  expect(selectors).toEqual([1n,3n,2n,0n,7n,6n,5n,7n]);
  expect(program.flatMap(op=>typeof op==="object" && "dup" in op?[op.dup.n]:[])).toEqual([0,0,0,2,0,0,0]);
  const surfaces={arguments:out.proofData.input,output:out.proofData.output,query:out.proofData.publicTranscript,guaranteed,fallible,effects:out.context.currentQueryContext.effects,ledger:out.context.currentQueryContext.state.state.encode()};
  const commitment=p.diagnose_credentialCommitmentV2(w.credential.statement,w.credential.credentialOpening);
  const credentialLeaf=p.diagnose_credentialLeafV2(w.credential.statement.credentialId,commitment);
  const privateAtoms:Record<string,Uint8Array[]>={
    issuerSecret:[w.issuerSecret],issuerControl:[record.issuerControlCommitment],issuerId:[record.issuerId],credentialId:[w.credential.statement.credentialId],
    subjectCommitment:[w.credential.statement.subjectCommitment],credentialCommitment:[commitment],credentialLeaf:[credentialLeaf],
    nonce:[w.credential.issuanceNonce],opening:[w.credential.credentialOpening],issuerIndex:u16.toValue(w.issuerMembership.issuerIndex),
    issuedAt:u64.toValue(w.credential.statement.issuedAt),expiresAt:u64.toValue(w.credential.statement.expiresAt),
    issuerPath:w.issuerMembership.path.siblings,insertionPath:w.insertionPath.siblings
  };
  const findings:Record<string,Record<string,number>>={};
  for(const [name,atoms]of Object.entries(privateAtoms)){
    findings[name]={};
    for(const [place,value]of Object.entries(surfaces)){
      const count=atoms.reduce((n,x)=>n+locations(value,x).length,0);findings[name][place]=count;
      expect(count===0).toBe(true); // Avoid emitting private canaries in a failed assertion.
    }
  }
  for(const atom of [w.issuerSecret,record.issuerControlCommitment,w.credential.issuanceNonce,w.credential.credentialOpening,w.credential.statement.subjectCommitment])
    expect(locations(out.proofData.privateTranscriptOutputs,atom).length>0).toBe(true);
  const l=ledger(out.context.currentQueryContext.state),nullifier=p.diagnose_registrationNullifierV2({bytes:rt.encodeContractAddress(rt.dummyContractAddress())},f.f.context,w.credential.statement.credentialId);
  expect(locations(guaranteed,nullifier).length>0).toBe(true);expect(locations(guaranteed,l.credentialRoot).length>0).toBe(true);
  expect(l.registeredCredentialNullifiers.member(nullifier)).toBe(true);
  const source=readFileSync("contracts/just-proof.compact","utf8").split("export circuit registerCredentialV2")[1];
  expect(source.match(/disclose\(/g)).toHaveLength(2);expect(source).toContain("disclose(registrationNullifierV2(kernel.self(),context,id))");expect(source).toContain("disclose(newRoot)");
  const replacer=(_k:string,v:unknown)=>typeof v==="bigint"?v.toString():v instanceof Uint8Array?{bytes:hex(v)}:v instanceof Map?[...v]:v;
  mkdirSync("/tmp/justproof-phase3b",{recursive:true});
  writeFileSync("/tmp/justproof-phase3b/public-surface.json",JSON.stringify({passed:true,findings,positiveControls:{nullifier:true,root:true,privateWitnessCanaries:true},input:out.proofData.input,output:out.proofData.output,query:out.proofData.publicTranscript,guaranteed,fallible,effectsBefore:beforeEffects,effectsAfter:out.context.currentQueryContext.effects},replacer,2));
});
