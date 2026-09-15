import {describe,it,expect,afterAll} from "vitest";
import {writeFileSync} from "node:fs";
import * as rt from "@midnight-ntwrk/compact-runtime";
import {ledger,type CredentialRevocationWitnessV2 as W} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3c-revoke-credential.js";
import {p,snapshot,overrideState} from "../support/v3a-register-issuer.js";
import {domain,hex,schemas,ReferenceTree} from "../support/v2-reference.js";
import {fixture as bytes} from "../support/v2-vectors.js";
type F=ReturnType<typeof setup>;
const evidence:unknown[]=[];
function failed(name:string,f:F,w=f.witness(),state=f.state,message?:string){
  const ctx=f.context(w,state),before=snapshot(ledger(ctx.currentQueryContext.state)),encoded=ctx.currentQueryContext.state.state.encode(),priv=structuredClone(ctx.currentPrivateState),owned=structuredClone(w),calls=f.calls();
  expect(()=>f.contract.circuits.revokeCredentialV2(ctx)).toThrow(message);
  expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);expect(ctx.currentPrivateState).toEqual(priv);expect(w).toEqual(owned);expect(f.calls()-calls).toBe(1);
  evidence.push({name,before,after:snapshot(ledger(ctx.currentQueryContext.state)),encodedInputPreserved:true,privateInputPreserved:true});
}
function success(f:F,w=f.witness(),state=f.state){
  const ctx=f.context(w,state),before=snapshot(ledger(ctx.currentQueryContext.state)),encoded=ctx.currentQueryContext.state.state.encode(),priv=structuredClone(ctx.currentPrivateState),owned=structuredClone(w),calls=f.calls();
  const out=f.contract.circuits.revokeCredentialV2(ctx);expect(out.result).toEqual([]);expect(out.proofData.input).toEqual({value:[],alignment:[]});expect(out.proofData.output).toEqual({value:[],alignment:[]});
  const leaf=p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment),revoked=p.diagnose_revokedLeafV2(w.credentialId,w.credentialCommitment);
  expect(leaf).toEqual(rt.persistentHash(schemas.CredentialLeafInputV2,{domain:domain("CREDENTIAL_LEAF"),protocolVersion:2n,credentialId:w.credentialId,credentialCommitment:w.credentialCommitment}));
  expect(revoked).toEqual(rt.persistentHash(schemas.RevokedCredentialLeafInputV2,{domain:domain("REVOCATION_REVOKED"),protocolVersion:2n,credentialId:w.credentialId,credentialCommitment:w.credentialCommitment}));
  const index=Number(w.credentialMembership.credentialIndex);f.revocations.setSyntheticLeaf(index,revoked);
  expect(p.root(domain("REVOCATION_MERKLE_NODE"),revoked,BigInt(index),w.revocationPath.siblings)).toEqual(f.revocations.root());
  const after=snapshot(ledger(out.context.currentQueryContext.state)),changed=(Object.keys(before) as (keyof typeof before)[]).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
  expect(changed).toEqual(["revocationRoot"]);expect(after.revocationRoot).toBe(hex(f.revocations.root()));
  expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);expect(ctx.currentPrivateState).toEqual(priv);expect(w).toEqual(owned);expect(f.calls()-calls).toBe(1);
  evidence.push({name:"success index "+index,before,after,changed,encodedInputPreserved:true,privateInputPreserved:true});
  const next=rt.ContractState.deserialize(state.serialize());next.data=out.context.currentQueryContext.state;return next;
}
describe("revokeCredentialV2 compiled contract logic",()=>{
  it("first and nonzero credentials, refreshed paths, exact unit and sole root mutation",()=>{
    const f=setup();let state=success(f);state=success(f,f.witness(1),state);success(f,f.witness(2),state);
  });
  it("synthetic final credential index 65535 with full counter",()=>{
    const f=setup(),w=f.witness(),t=new ReferenceTree("credential");t.setSyntheticLeaf(65535,p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment));w.credentialMembership={credentialIndex:65535n,path:{siblings:t.path(65535)}};w.revocationPath.siblings=f.revocations.path(65535);
    success(f,w,overrideState(f.state,new Map<number,bigint|Uint8Array>([[5,t.root()],[6,65536n]])));
  });
  it("full issuer counter permits allocated membership",()=>{const f=setup();success(f,f.witness(),overrideState(f.state,new Map([[3,65536n]])));});
  for(const role of ["zero","wrong","authority","holder"] as const)it("rejects "+role+" issuer secret",()=>{
    const f=setup(),w=f.witness();w.issuerSecret=role==="zero"?new Uint8Array(32):role==="authority"?f.f.authority:role==="holder"?f.f.subject:bytes("wrong-revocation-secret");failed(role+" secret",f,w,f.state,role==="zero"?"issuer secret zero":"issuer control mismatch");
  });
  const cases:{name:string;change:(w:W,f:F)=>void;error:string}[]=[
    {name:"issuer record version",change:w=>{w.issuerMembership.record.protocolVersion=1n;},error:"issuer protocol version"},
    {name:"zero control",change:w=>{w.issuerMembership.record.issuerControlCommitment=new Uint8Array(32);},error:"issuer control zero"},
    {name:"noncanonical issuer ID",change:w=>{w.issuerMembership.record.issuerId=bytes("bad-id");},error:"noncanonical issuer id"},
    {name:"unallocated issuer index",change:w=>{w.issuerMembership.issuerIndex=2n;},error:"unallocated index"},
    {name:"corrupt issuer path",change:w=>{w.issuerMembership.path.siblings[8][0]^=1;},error:"membership root"},
    {name:"wrong issuer index",change:w=>{w.issuerMembership.issuerIndex=1n;},error:"membership root"},
    {name:"cross-tree issuer path",change:w=>{w.issuerMembership.path.siblings=new ReferenceTree("credential").path(0);},error:"membership root"},
    {name:"other issuer path",change:(w,f)=>{w.issuerMembership.path.siblings=f.issuers.path(1);},error:"membership root"},
    {name:"zero nonce",change:w=>{w.issuanceNonce=new Uint8Array(32);},error:"issuance nonce zero"},
    {name:"changed nonce",change:w=>{w.issuanceNonce=bytes("changed-nonce");},error:"credential id mismatch"},
    {name:"changed retained ID",change:w=>{w.credentialId=bytes("changed-id");},error:"credential id mismatch"},
    {name:"another issuer credential",change:(w,f)=>{w.issuanceNonce=f.packages[2].issuanceNonce;w.credentialId=f.packages[2].statement.credentialId;w.credentialCommitment=f.witness(2).credentialCommitment;w.credentialMembership=f.witness(2).credentialMembership;},error:"credential id mismatch"},
    {name:"changed commitment",change:w=>{w.credentialCommitment=bytes("changed-commitment");},error:"membership root"},
    {name:"unallocated credential index",change:w=>{w.credentialMembership.credentialIndex=3n;},error:"unallocated index"},
    {name:"corrupt credential path",change:w=>{w.credentialMembership.path.siblings[8][0]^=1;},error:"membership root"},
    {name:"wrong credential index",change:w=>{w.credentialMembership.credentialIndex=1n;},error:"membership root"},
    {name:"cross-tree credential path",change:(w,f)=>{w.credentialMembership.path.siblings=f.issuers.path(0);},error:"membership root"},
    {name:"other credential path",change:(w,f)=>{w.credentialMembership.path.siblings=f.credentials.path(1);},error:"membership root"},
    {name:"corrupt revocation path",change:w=>{w.revocationPath.siblings[7][0]^=1;},error:"not revoked root"},
    {name:"credential path as revocation path",change:w=>{w.revocationPath.siblings=w.credentialMembership.path.siblings;},error:"not revoked root"},
  ];
  for(const c of cases)it("rejects "+c.name,()=>{const f=setup(),w=f.witness();c.change(w,f);failed(c.name,f,w,f.state,c.error);});
  for(const [field,name]of [[3,"issuer"],[6,"credential"]] as const)it("rejects "+name+" counter above capacity",()=>{const f=setup();failed(name+" counter",f,f.witness(),overrideState(f.state,new Map([[field,65537n]])),"invalid "+name+" counter");});
  it("rejects stale issuer membership",()=>{const f=setup(),w=f.witness(),t=new ReferenceTree("issuer");t.setSyntheticLeaf(0,p.diagnose_issuerLeafV2(f.records[0]));w.issuerMembership.path.siblings=t.path(0);failed("stale issuer",f,w,f.state,"membership root");});
  it("rejects another valid issuer record/path with wrong secret",()=>{const f=setup(),w=f.witness();w.issuerMembership=f.witness(2).issuerMembership;failed("other record wrong secret",f,w,f.state,"issuer control mismatch");});
  it("another issuer cannot revoke a learned credential with its own valid secret",()=>{const f=setup(),w=f.witness();w.issuerMembership=f.witness(2).issuerMembership;w.issuerSecret=f.secrets[1];failed("other authorized issuer",f,w,f.state,"credential id mismatch");});
  for(const variant of ["context","version","domain"] as const)it("rejects authenticated wrong control "+variant,()=>{
    const f=setup(),w=f.witness(),r=w.issuerMembership.record;
    r.issuerControlCommitment=p.raw_IssuerControlInputV2({domain:variant==="domain"?domain("REGISTRY_AUTHORITY_CONTROL"):domain("ISSUER_CONTROL"),protocolVersion:variant==="version"?1n:2n,registryContext:variant==="context"?bytes("other-context"):f.f.context,issuerSecret:w.issuerSecret});r.issuerId=p.diagnose_issuerIdV2(f.f.context,r.issuerControlCommitment);
    failed("control "+variant,f,w,f.installRecord(w),"issuer control mismatch");
  });
  it("rejects stale credential path after unrelated registration",()=>{const f=setup(),w=f.witness(),t=new ReferenceTree("credential");t.setSyntheticLeaf(0,p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment));w.credentialMembership.path.siblings=t.path(0);failed("stale credential",f,w,f.state,"membership root");});
  it("rejects unregistered credential despite valid non-revocation path",()=>{const f=setup(),w=f.witness();w.issuanceNonce=bytes("never-registered");w.credentialId=p.diagnose_credentialIdV2(w.issuerMembership.record.issuerId,w.issuanceNonce);expect(p.root(domain("REVOCATION_MERKLE_NODE"),p.diagnose_notRevokedV2(),0n,w.revocationPath.siblings)).toEqual(f.revocations.root());failed("unregistered",f,w,f.state,"membership root");});
  it("rejects credential root/path valid only at another index",()=>{const f=setup(),w=f.witness();expect(p.root(domain("CREDENTIAL_MERKLE_NODE"),p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment),0n,w.credentialMembership.path.siblings)).toEqual(f.credentials.root());w.credentialMembership.credentialIndex=1n;failed("credential index binding",f,w,f.state,"membership root");});
  it("rejects repeated revocation with refreshed path",()=>{const f=setup(),next=success(f);failed("repeated",f,f.witness(),next,"not revoked root");});
  it("rejects stale revocation path after unrelated revocation",()=>{const f=setup(),stale=f.witness(1),next=success(f);failed("stale revocation",f,stale,next,"not revoked root");});
  it("rejects already revoked synthetic target",()=>{const f=setup(),w=f.witness();f.revocations.setSyntheticLeaf(0,p.diagnose_revokedLeafV2(w.credentialId,w.credentialCommitment));w.revocationPath.siblings=f.revocations.path(0);failed("already revoked",f,w,overrideState(f.state,new Map([[8,f.revocations.root()]])),"not revoked root");});
  it("rejects revocation path valid only at another index and location decoupling",()=>{
    const f=setup(),next=success(f),w=f.witness(1);w.revocationPath.siblings=f.revocations.path(2);
    expect(p.root(domain("REVOCATION_MERKLE_NODE"),p.diagnose_notRevokedV2(),2n,w.revocationPath.siblings)).toEqual(f.revocations.root());failed("revocation index binding",f,w,next,"not revoked root");
  });
  for(const path of ["issuer","credential","revocation"] as const)for(const n of [15,17])it("rejects "+path+" adapter path length "+n,()=>{const f=setup(),w=f.witness(),bad=Array.from({length:n},()=>bytes("bad-sibling"));if(path==="issuer")w.issuerMembership.path.siblings=bad;else if(path==="credential")w.credentialMembership.path.siblings=bad;else w.revocationPath.siblings=bad;failed(path+" length "+n,f,w);});
  it("one detached snapshot freezes structural containers and copies every caller-owned byte array",()=>{
    const f=setup(),ctx=f.context(),before=structuredClone(ctx.currentPrivateState);f.contract.circuits.revokeCredentialV2(ctx);expect(f.calls()).toBe(1);expect(ctx.currentPrivateState).toEqual(before);
    const snap=f.lastSnapshot();if(!snap)throw new Error("missing snapshot");
    function check(a:unknown,b:unknown){if(a instanceof Uint8Array){expect(a===b).toBe(false);return;}if(a&&typeof a==="object"){expect(Object.isFrozen(a)).toBe(true);for(const [k,v]of Object.entries(a))check(v,(b as Record<string,unknown>)[k]);}}
    check(snap,ctx.currentPrivateState.revocation);
  });
  it("no invented nonzero commitment rule: synthetic authenticated zero commitment",()=>{
    const f=setup(),w=f.witness(),t=new ReferenceTree("credential");w.credentialCommitment=new Uint8Array(32);t.setSyntheticLeaf(0,p.diagnose_credentialLeafV2(w.credentialId,w.credentialCommitment));w.credentialMembership.path.siblings=t.path(0);success(f,w,overrideState(f.state,new Map([[5,t.root()]])));
  });
});
afterAll(()=>writeFileSync("docs/development/evidence/phase-3d/retained-3c-snapshots.json",JSON.stringify(evidence,null,2)));
