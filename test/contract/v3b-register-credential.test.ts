import { describe,it,expect,afterAll } from "vitest";
import {mkdirSync,writeFileSync} from "node:fs";
import * as rt from "@midnight-ntwrk/compact-runtime";
import {ledger,type CredentialRegistrationWitnessV2 as W} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3b-register-credential.js";
import {snapshot,overrideState,p} from "../support/v3a-register-issuer.js";
import {domain,hex,schemas,ReferenceTree} from "../support/v2-reference.js";
import {fixture as bytes} from "../support/v2-vectors.js";
type F=ReturnType<typeof setup>;
const evidence:unknown[]=[];
function failed(name:string,f:F,w=f.witness(),state=f.state,message?:string){
  const ctx=f.context(w,state),before=snapshot(ledger(ctx.currentQueryContext.state)),encoded=ctx.currentQueryContext.state.state.encode(),privateBefore=structuredClone(ctx.currentPrivateState),calls=f.calls();
  expect(()=>f.contract.circuits.registerCredentialV2(ctx)).toThrow(message);
  expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);
  expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);expect(ctx.currentPrivateState).toEqual(privateBefore);expect(f.calls()-calls).toBe(1);
  evidence.push({name,before,after:snapshot(ledger(ctx.currentQueryContext.state)),unchanged:true});
}
function success(f:F,w=f.witness(),state=f.state,index=0,address=rt.dummyContractAddress()){
  const ctx=f.context(w,state,address),before=snapshot(ledger(ctx.currentQueryContext.state)),privateBefore=structuredClone(ctx.currentPrivateState),calls=f.calls();
  const out=f.contract.circuits.registerCredentialV2(ctx);
  expect(out.result).toEqual([]);expect(out.proofData.input).toEqual({value:[],alignment:[]});expect(out.proofData.output).toEqual({value:[],alignment:[]});
  expect(ctx.currentPrivateState).toEqual(privateBefore);expect(f.calls()-calls).toBe(1);
  const st=w.credential.statement,id=p.diagnose_credentialIdV2(st.issuerId,w.credential.issuanceNonce);
  expect(id).toEqual(rt.persistentHash(schemas.CredentialIdInputV2,{domain:domain("CREDENTIAL_ID"),protocolVersion:2n,issuerId:st.issuerId,issuanceNonce:w.credential.issuanceNonce}));
  const commitment=p.diagnose_credentialCommitmentV2(st,w.credential.credentialOpening);
  expect(commitment).toEqual(rt.persistentCommit(schemas.CredentialCommitmentValueV2,{domain:domain("CREDENTIAL_COMMITMENT"),statement:st},w.credential.credentialOpening));
  const leaf=p.diagnose_credentialLeafV2(id,commitment);
  expect(leaf).toEqual(rt.persistentHash(schemas.CredentialLeafInputV2,{domain:domain("CREDENTIAL_LEAF"),protocolVersion:2n,credentialId:id,credentialCommitment:commitment}));
  const addr={bytes:rt.encodeContractAddress(address)},context=ledger(state.data).registryContext;
  const nullifier=p.diagnose_registrationNullifierV2(addr,context,id);
  expect(nullifier).toEqual(rt.persistentHash(schemas.CredentialRegistrationNullifierInputV2,{domain:domain("CREDENTIAL_REGISTRATION_NULLIFIER"),protocolVersion:2n,registryContract:addr,registryContext:context,credentialId:id}));
  expect(p.root(domain("CREDENTIAL_MERKLE_NODE"),leaf,BigInt(index),w.insertionPath.siblings)).toEqual((()=>{f.credentials.setSyntheticLeaf(index,leaf);return f.credentials.root();})());
  const after=snapshot(ledger(out.context.currentQueryContext.state));
  expect(after.credentialRoot).toBe(hex(f.credentials.root()));expect(after.nextCredentialIndex).toBe(String(index+1));
  expect(after.registeredCredentialNullifiers).toEqual([...before.registeredCredentialNullifiers,hex(nullifier)].sort());
  const changed=(Object.keys(before) as (keyof typeof before)[]).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
  expect(changed).toEqual(["credentialRoot","nextCredentialIndex","registeredCredentialNullifiers"]);
  expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);
  evidence.push({name:"success "+index,before,after,changed});
  const next=rt.ContractState.deserialize(state.serialize());next.data=out.context.currentQueryContext.state;return {out,next,nullifier};
}
describe("registerCredentialV2 compiled contract logic",()=>{
  it("first and consecutive refreshed registrations, zero/positive expiry, opaque subject, exact outputs and derivations",()=>{
    const f=setup(),first=success(f),w=f.witness();w.credential=f.packageFor(f.records[0],bytes("second-nonce"));w.credential.statement.expiresAt=1800000999n;w.insertionPath.siblings=f.credentials.path(1);
    success(f,w,first.next,1);
  });
  it("last credential index 65535 reaches full sentinel",()=>{const f=setup(),w=f.witness();w.insertionPath.siblings=f.credentials.path(65535);success(f,w,overrideState(f.state,new Map([[6,65535n]])),65535);});
  it("full issuer allocation counter still permits allocated membership",()=>{const f=setup();success(f,f.witness(),overrideState(f.state,new Map([[3,65536n]])));});
  for(const role of ["zero","wrong","authority","holder"] as const)it("rejects "+role+" issuer secret",()=>{
    const f=setup(),w=f.witness();w.issuerSecret=role==="zero"?new Uint8Array(32):role==="authority"?f.f.authority:role==="holder"?f.f.subject:bytes("wrong-issuer-secret");
    failed(role+" secret",f,w,f.state,role==="zero"?"issuer secret zero":"issuer control mismatch");
  });
  const issuerCases:{name:string;change:(w:W)=>void;error:string}[]=[
    {name:"record version",change:w=>{w.issuerMembership.record.protocolVersion=1n;},error:"issuer protocol version"},
    {name:"zero control",change:w=>{w.issuerMembership.record.issuerControlCommitment=new Uint8Array(32);},error:"issuer control zero"},
    {name:"noncanonical issuer ID",change:w=>{w.issuerMembership.record.issuerId=bytes("bad-id");},error:"noncanonical issuer id"},
    {name:"unallocated index",change:w=>{w.issuerMembership.issuerIndex=2n;},error:"unallocated index"},
    {name:"corrupt issuer sibling",change:w=>{w.issuerMembership.path.siblings[8][0]^=1;},error:"membership root"},
    {name:"wrong issuer index",change:w=>{w.issuerMembership.issuerIndex=1n;},error:"membership root"},
    {name:"cross-tree issuer path",change:w=>{w.issuerMembership.path.siblings=new ReferenceTree("credential").path(0);},error:"membership root"},
  ];
  for(const c of issuerCases)it("rejects "+c.name,()=>{const f=setup(),w=f.witness();c.change(w);failed(c.name,f,w,f.state,c.error);});
  it("rejects invalid issuer counter above capacity",()=>{const f=setup();failed("invalid issuer counter",f,f.witness(),overrideState(f.state,new Map([[3,65537n]])),"invalid issuer counter");});
  it("rejects stale issuer path after unrelated issuer registration",()=>{const f=setup(),w=f.witness();const old=new ReferenceTree("issuer");old.setSyntheticLeaf(0,p.diagnose_issuerLeafV2(f.records[0]));w.issuerMembership.path.siblings=old.path(0);failed("stale issuer",f,w,f.state,"membership root");});
  it("rejects another registered issuer record and valid path with wrong secret",()=>{const f=setup(),w=f.witness();w.issuerMembership={record:f.records[1],issuerIndex:1n,path:{siblings:f.issuers.path(1)}};failed("other issuer",f,w,f.state,"issuer control mismatch");});
  for(const variant of ["context","version","domain"] as const)it("rejects authenticated issuer control using wrong "+variant+" derivation",()=>{
    const f=setup(),w=f.witness();
    w.issuerMembership.record.issuerControlCommitment=p.raw_IssuerControlInputV2({domain:variant==="domain"?domain("REGISTRY_AUTHORITY_CONTROL"):domain("ISSUER_CONTROL"),protocolVersion:variant==="version"?1n:2n,registryContext:variant==="context"?bytes("other-context"):f.f.context,issuerSecret:w.issuerSecret});
    w.issuerMembership.record.issuerId=p.diagnose_issuerIdV2(f.f.context,w.issuerMembership.record.issuerControlCommitment);
    failed("wrong control "+variant,f,w,f.installRecord(w),"issuer control mismatch");
  });
  const cases:{name:string;change:(w:W)=>void;error:string}[]=[
    {name:"statement protocol",change:w=>{w.credential.statement.protocolVersion=1n;},error:"credential protocol version"},
    {name:"qualification type",change:w=>{w.credential.statement.qualificationType=bytes("other-qualification");},error:"qualification type"},
    {name:"qualification version",change:w=>{w.credential.statement.qualificationVersion=2n;},error:"qualification version"},
    {name:"zero nonce",change:w=>{w.credential.issuanceNonce=new Uint8Array(32);},error:"issuance nonce zero"},
    {name:"zero opening",change:w=>{w.credential.credentialOpening=new Uint8Array(32);},error:"credential opening zero"},
    {name:"zero subject commitment",change:w=>{w.credential.statement.subjectCommitment=new Uint8Array(32);},error:"subject commitment zero"},
    {name:"zero issuedAt",change:w=>{w.credential.statement.issuedAt=0n;},error:"issuedAt zero"},
    {name:"equal expiry",change:w=>{w.credential.statement.expiresAt=w.credential.statement.issuedAt;},error:"invalid expiry"},
    {name:"earlier expiry",change:w=>{w.credential.statement.expiresAt=w.credential.statement.issuedAt-1n;},error:"invalid expiry"},
    {name:"statement issuer mismatch",change:w=>{w.credential.statement.issuerId=bytes("different-issuer");},error:"credential issuer mismatch"},
    {name:"credential ID mismatch",change:w=>{w.credential.statement.credentialId=bytes("different-id");},error:"credential id mismatch"},
    {name:"nonce changed",change:w=>{w.credential.issuanceNonce=bytes("different-nonce");},error:"credential id mismatch"},
    {name:"credential ID field substitution",change:w=>{w.credential.statement.credentialId=p.diagnose_credentialIdV2(w.credential.issuanceNonce,w.credential.statement.issuerId);},error:"credential id mismatch"},
    {name:"credential ID wrong domain",change:w=>{w.credential.statement.credentialId=p.raw_CredentialIdInputV2({domain:domain("ISSUER_ID"),protocolVersion:2n,issuerId:w.credential.statement.issuerId,issuanceNonce:w.credential.issuanceNonce});},error:"credential id mismatch"},
  ];
  for(const c of cases)it("rejects "+c.name,()=>{const f=setup(),w=f.witness();c.change(w);failed(c.name,f,w,f.state,c.error);});
  for(const change of ["opening","valid statement"] as const)it("duplicate ID rejects changed "+change+" before corrupted late path",()=>{
    const f=setup(),first=success(f),w=f.witness();if(change==="opening")w.credential.credentialOpening=bytes("second-opening");else w.credential.statement.issuedAt++;
    w.insertionPath.siblings[15][0]^=1;failed("duplicate "+change,f,w,first.next,"duplicate credential nullifier");
  });
  it("rejects stale credential insertion path",()=>{const f=setup(),old=f.credentials.path(1),first=success(f),w=f.witness();w.credential=f.packageFor(f.records[0],bytes("next"));w.insertionPath.siblings=old;failed("stale insertion",f,w,first.next,"empty slot root");});
  it("rejects corrupt insertion sibling",()=>{const f=setup(),w=f.witness();w.insertionPath.siblings[5][0]^=1;failed("corrupt insertion",f,w,f.state,"empty slot root");});
  it("rejects path valid only at another insertion index",()=>{
    const f=setup(),w=f.witness(),tree=new ReferenceTree("credential");tree.setSyntheticLeaf(1,bytes("occupied-other"));w.insertionPath.siblings=tree.path(0);
    const state=overrideState(f.state,new Map<number,bigint|Uint8Array>([[5,tree.root()],[6,2n]]));
    expect(p.root(domain("CREDENTIAL_MERKLE_NODE"),p.diagnose_credentialEmptyV2(),0n,w.insertionPath.siblings)).toEqual(tree.root());failed("other insertion index",f,w,state,"empty slot root");
  });
  it("rejects occupied insertion position",()=>{const f=setup(),w=f.witness();f.credentials.setSyntheticLeaf(0,bytes("occupied"));w.insertionPath.siblings=f.credentials.path(0);failed("occupied insertion",f,w,overrideState(f.state,new Map([[5,f.credentials.root()]])),"empty slot root");});
  it("full credential counter rejects before narrowing",()=>{const f=setup();failed("full counter",f,f.witness(),overrideState(f.state,new Map([[6,65536n]])),"credential tree full");});
  for(const path of ["issuer","credential"] as const)for(const n of [15,17])it("rejects "+path+" path adapter length "+n,()=>{
    const f=setup(),w=f.witness();const bad=Array.from({length:n},()=>bytes("sibling"));if(path==="issuer")w.issuerMembership.path.siblings=bad;else w.insertionPath.siblings=bad;failed(path+" length "+n,f,w);
  });
  it("contract address changes actual nullifier and context changes typed nullifier",()=>{
    const f=setup(),w=f.witness(),a=success(f,w).nullifier;
    // Reset only the untrusted expected tree; both calls start at the same initial authoritative state.
    const g=setup(),address=rt.decodeContractAddress(bytes("deployment-two")),b=success(g,g.witness(),g.state,0,address).nullifier;
    expect(hex(a)).not.toBe(hex(b));
    expect(hex(p.diagnose_registrationNullifierV2({bytes:rt.encodeContractAddress(address)},bytes("context-two"),w.credential.statement.credentialId))).not.toBe(hex(b));
  });
  it("one detached snapshot, frozen containers, no input mutation or extra witness fields",()=>{
    const f=setup(),ctx=f.context(),original=structuredClone(ctx.currentPrivateState);f.contract.circuits.registerCredentialV2(ctx);expect(f.calls()).toBe(1);expect(ctx.currentPrivateState).toEqual(original);
    const snap=f.lastSnapshot();expect(snap).toBeDefined();if(!snap)throw new Error("missing snapshot");
    expect(Object.keys(snap)).toEqual(["issuerSecret","credential","issuerMembership","insertionPath"]);expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.credential.statement)).toBe(true);expect(Object.isFrozen(snap.issuerMembership.path.siblings)).toBe(true);
    expect(snap.issuerSecret===ctx.currentPrivateState.credential.issuerSecret).toBe(false);expect(snap.insertionPath.siblings[0]===ctx.currentPrivateState.credential.insertionPath.siblings[0]).toBe(false);
  });
});
afterAll(()=>{mkdirSync("/tmp/justproof-phase3b",{recursive:true});writeFileSync("/tmp/justproof-phase3b/snapshots.json",JSON.stringify(evidence,null,2));});

