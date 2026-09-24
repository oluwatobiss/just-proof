import {tmpdir} from "node:os";
import {join} from "node:path";
import {mkdtempSync} from "node:fs";
import {describe,it,expect,afterAll} from "vitest";
import {writeFileSync} from "node:fs";
import * as rt from "@midnight-ntwrk/compact-runtime";
import {ledger,type QualificationWitnessV2 as W,type QualificationRequestV2 as Request} from "../../contracts/managed/just-proof/contract/index.js";
import {setup} from "../support/v3d-prove-qualification.js";
import {setup as registration} from "../support/v3b-register-credential.js";
import {snapshot,overrideState,p} from "../support/v3a-register-issuer.js";
import {domain,schemas,ReferenceTree,hex} from "../support/v2-reference.js";
import {fixture as bytes} from "../support/v2-vectors.js";
type F=ReturnType<typeof setup>;
const evidence:unknown[]=[];
function failed(name:string,f:F,w=f.witness(),request=f.request(),state=f.state,now=1700000250n,message?:string,expectedCalls=1,address=rt.dummyContractAddress()){
 const ctx=f.context(w,state,now,address),before=snapshot(ledger(ctx.currentQueryContext.state)),encoded=ctx.currentQueryContext.state.state.encode(),priv=structuredClone(ctx.currentPrivateState),owned=structuredClone({w,request}),calls=f.calls();
 expect(()=>f.contract.circuits.proveQualificationV2(ctx,request)).toThrow(message);
 expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);expect(ctx.currentPrivateState).toEqual(priv);expect({w,request}).toEqual(owned);expect(f.calls()-calls).toBe(expectedCalls);
 evidence.push({name,before,after:snapshot(ledger(ctx.currentQueryContext.state)),encodedInputPreserved:true,privateInputPreserved:true});
}
function success(f:F,w=f.witness(),request=f.request(),state=f.state,now=1700000250n,address=rt.dummyContractAddress()){
 const ctx=f.context(w,state,now,address),before=snapshot(ledger(ctx.currentQueryContext.state)),encoded=ctx.currentQueryContext.state.state.encode(),priv=structuredClone(ctx.currentPrivateState),owned=structuredClone({w,request}),calls=f.calls();
 const out=f.contract.circuits.proveQualificationV2(ctx,request);
 expect(Object.keys(out.result)).toEqual(["requestDigest","stateDigest"]);
 expect(out.result.requestDigest).toEqual(rt.persistentHash(schemas.QualificationRequestDigestInputV2,{domain:domain("PROOF_REQUEST"),request}));
 expect(out.result.requestDigest).toEqual(p.diagnose_requestDigestV2(request));
 const st=f.verificationState(state,address);expect(out.result.stateDigest).toEqual(rt.persistentHash(schemas.QualificationVerificationStateDigestInputV2,{domain:domain("PROOF_STATE"),state:st}));expect(out.result.stateDigest).toEqual(p.diagnose_stateDigestV2(st));
 expect(snapshot(ledger(out.context.currentQueryContext.state))).toEqual(before);expect(out.context.currentQueryContext.state.state.encode()).toEqual(encoded);expect(out.context.currentPrivateState).toEqual(priv);
 expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);expect(ctx.currentPrivateState).toEqual(priv);expect({w,request}).toEqual(owned);expect(f.calls()-calls).toBe(1);
 evidence.push({name:"success",before,after:snapshot(ledger(out.context.currentQueryContext.state)),encodedInputPreserved:true,privateInputPreserved:true,output:{requestDigest:hex(out.result.requestDigest),stateDigest:hex(out.result.stateDigest)}});return out;
}
describe("proveQualificationV2 compiled read-only logic",()=>{
 it("unbounded and bounded credentials, nonzero index, exact digests and no mutation",()=>{const f=setup();success(f);success(f,f.witness(1));});
 it("same request may be executed twice: circuit does not consume challenges",()=>{const f=setup();expect(success(f).result).toEqual(success(f).result);});
 const requestCases:{name:string;change:(r:Request)=>void;error:string}[]=[
 {name:"protocol",change:r=>{r.protocolVersion=1n;},error:"request protocol version"},
 {name:"proof type",change:r=>{r.proofType=2n;},error:"proof type"},
 {name:"contract",change:r=>{r.registryContract.bytes=bytes("other-contract");},error:"request contract"},
 {name:"context",change:r=>{r.registryContext=bytes("other-context");},error:"request context"},
 {name:"qualification type",change:r=>{r.qualificationType=bytes("other-qualification");},error:"request qualification type"},
 {name:"qualification version",change:r=>{r.qualificationVersion=2n;},error:"request qualification version"},
 {name:"zero verifier context",change:r=>{r.verifierContext=new Uint8Array(32);},error:"verifier context zero"},
 {name:"zero challenge",change:r=>{r.challenge=new Uint8Array(32);},error:"challenge zero"},
 ];
 for(const c of requestCases)it("rejects request "+c.name+" before witness access",()=>{const f=setup(),r=f.request();c.change(r);failed(c.name,f,f.witness(),r,f.state,1700000250n,c.error,0);});
 const times:{name:string;i:bigint;e:bigint;ri:bigint;re:bigint;now:bigint;error?:string}[]=[
 {name:"inclusive credential and request issuance equality",i:100n,e:200n,ri:100n,re:200n,now:100n},
 {name:"last valid second",i:90n,e:200n,ri:100n,re:200n,now:199n},
 {name:"exclusive request and credential expiry equality",i:90n,e:200n,ri:100n,re:200n,now:200n,error:"request expired"},
 {name:"after deadline",i:90n,e:220n,ri:100n,re:200n,now:201n,error:"request expired"},
 {name:"before request",i:90n,e:220n,ri:100n,re:200n,now:99n,error:"request not started"},
 {name:"zero request issuance",i:1n,e:220n,ri:0n,re:200n,now:100n,error:"request issuance zero"},
 {name:"zero request expiry",i:1n,e:220n,ri:100n,re:0n,now:150n,error:"request interval"},
 {name:"equal request bounds",i:90n,e:220n,ri:100n,re:100n,now:100n,error:"request interval"},
 {name:"reversed request bounds",i:90n,e:220n,ri:200n,re:100n,now:150n,error:"request interval"},
 {name:"zero private issuance",i:0n,e:220n,ri:100n,re:200n,now:150n,error:"credential issuance zero"},
 {name:"equal private bounds",i:90n,e:90n,ri:100n,re:200n,now:150n,error:"credential interval"},
 {name:"reversed private bounds",i:90n,e:80n,ri:100n,re:200n,now:150n,error:"credential interval"},
 {name:"credential issued after request but before block",i:101n,e:220n,ri:100n,re:200n,now:150n,error:"credential not issued at request"},
 {name:"credential expires before deadline",i:90n,e:199n,ri:100n,re:200n,now:150n,error:"credential expires before request"},
 {name:"credential expiry equals request deadline",i:90n,e:200n,ri:100n,re:200n,now:150n},
 {name:"credential expiry after deadline",i:90n,e:201n,ri:100n,re:200n,now:150n},
 {name:"unbounded expiry",i:90n,e:0n,ri:100n,re:200n,now:150n},
 {name:"maximum private expiry",i:90n,e:18446744073709551615n,ri:100n,re:200n,now:150n},
 {name:"maximum Uint64 request expiry",i:90n,e:0n,ri:18446744073709551613n,re:18446744073709551615n,now:18446744073709551614n},
 ];
 for(const c of times)it("time boundary: "+c.name,()=>{const f=setup(),w=f.witness(),r=f.request();w.credential.statement.issuedAt=c.i;w.credential.statement.expiresAt=c.e;r.requestIssuedAt=c.ri;r.requestExpiresAt=c.re;const state=f.installPackage(w);if(c.error)failed(c.name,f,w,r,state,c.now,c.error);else success(f,w,r,state,c.now);});
 const malformed:{name:string;change:(w:W,f:F)=>void;error:string}[]=[
 {name:"issuer protocol",change:w=>{w.issuerMembership.record.protocolVersion=1n;},error:"issuer protocol version"},
 {name:"zero issuer control",change:w=>{w.issuerMembership.record.issuerControlCommitment=new Uint8Array(32);},error:"issuer control zero"},
 {name:"noncanonical issuer ID",change:w=>{w.issuerMembership.record.issuerId=bytes("bad-id");},error:"noncanonical issuer id"},
 {name:"unallocated issuer index",change:w=>{w.issuerMembership.issuerIndex=2n;},error:"unallocated index"},
 {name:"corrupt issuer path",change:w=>{w.issuerMembership.path.siblings[9][0]^=1;},error:"membership root"},
 {name:"wrong issuer index",change:w=>{w.issuerMembership.issuerIndex=1n;},error:"membership root"},
 {name:"cross-tree issuer path",change:(w,f)=>{w.issuerMembership.path.siblings=f.credentials.path(0);},error:"membership root"},
 {name:"other issuer record with valid path",change:(w,f)=>{w.issuerMembership={record:f.records[1],issuerIndex:1n,path:{siblings:f.issuers.path(1)}};},error:"credential issuer mismatch"},
 {name:"credential protocol",change:w=>{w.credential.statement.protocolVersion=1n;},error:"credential protocol version"},
 {name:"credential qualification type",change:w=>{w.credential.statement.qualificationType=bytes("bad-type");},error:"qualification type"},
 {name:"credential qualification version",change:w=>{w.credential.statement.qualificationVersion=2n;},error:"qualification version"},
 {name:"zero nonce",change:w=>{w.credential.issuanceNonce=new Uint8Array(32);},error:"issuance nonce zero"},
 {name:"zero credential opening",change:w=>{w.credential.credentialOpening=new Uint8Array(32);},error:"credential opening zero"},
 {name:"zero subject commitment",change:w=>{w.credential.statement.subjectCommitment=new Uint8Array(32);},error:"subject commitment zero"},
 {name:"credential issuer ID",change:w=>{w.credential.statement.issuerId=bytes("bad-issuer");},error:"credential issuer mismatch"},
 {name:"credential ID",change:w=>{w.credential.statement.credentialId=bytes("bad-credential");},error:"credential id mismatch"},
 {name:"changed nonce",change:w=>{w.credential.issuanceNonce=bytes("bad-nonce");},error:"credential id mismatch"},
 {name:"changed credential opening",change:w=>{w.credential.credentialOpening=bytes("bad-opening");},error:"membership root"},
 {name:"changed private issuance without new membership",change:w=>{w.credential.statement.issuedAt++;},error:"membership root"},
 {name:"changed private expiry without new membership",change:w=>{w.credential.statement.expiresAt=1700000500n;},error:"membership root"},
 {name:"zero subject secret",change:w=>{w.subjectSecret=new Uint8Array(32);},error:"subject secret zero"},
 {name:"wrong subject secret",change:w=>{w.subjectSecret=bytes("wrong-holder");},error:"subject commitment mismatch"},
 {name:"authority secret substituted for subject",change:(w,f)=>{w.subjectSecret=f.f.authority;},error:"subject commitment mismatch"},
 {name:"issuer secret substituted for subject",change:(w,f)=>{w.subjectSecret=f.f.issuer;},error:"subject commitment mismatch"},
 {name:"changed subject commitment",change:w=>{w.credential.statement.subjectCommitment=bytes("bad-subject");},error:"subject commitment mismatch"},
 {name:"unallocated credential index",change:w=>{w.credentialMembership.credentialIndex=2n;},error:"unallocated index"},
 {name:"wrong credential index",change:w=>{w.credentialMembership.credentialIndex=1n;},error:"membership root"},
 {name:"corrupt credential path",change:w=>{w.credentialMembership.path.siblings[7][0]^=1;},error:"membership root"},
 {name:"cross-tree credential path",change:(w,f)=>{w.credentialMembership.path.siblings=f.issuers.path(0);},error:"membership root"},
 {name:"other credential path",change:(w,f)=>{w.credentialMembership.path.siblings=f.credentials.path(1);},error:"membership root"},
 {name:"corrupt revocation path",change:w=>{w.revocationPath.siblings[7][0]^=1;},error:"not revoked root"},
 {name:"cross-tree revocation path",change:w=>{w.revocationPath.siblings=w.credentialMembership.path.siblings;},error:"not revoked root"},
 ];
 for(const c of malformed)it("rejects "+c.name,()=>{const f=setup(),w=f.witness();c.change(w,f);failed(c.name,f,w,f.request(),f.state,1700000250n,c.error);});
 for(const [slot,name]of [[3,"issuer"],[6,"credential"]]as const){
  it("rejects "+name+" counter above 65536",()=>{const f=setup();failed(name+" counter",f,f.witness(),f.request(),overrideState(f.state,new Map([[slot,65537n]])),1700000250n,"invalid "+name+" counter");});
  it("allows "+name+" membership at counter 65536",()=>{const f=setup();success(f,f.witness(),f.request(),overrideState(f.state,new Map([[slot,65536n]])));});
 }
 it("synthetic credential index 65535 at full sentinel",()=>{const f=setup(),w=f.witness();w.credentialMembership.credentialIndex=65535n;w.revocationPath.siblings=f.revocations.path(65535);success(f,w,f.request(),f.installPackage(w));});
 it("rejects stale issuer and credential paths",()=>{const f=setup(),w=f.witness(),old=new ReferenceTree("issuer");old.setSyntheticLeaf(0,p.diagnose_issuerLeafV2(f.records[0]));w.issuerMembership.path.siblings=old.path(0);failed("stale issuer",f,w);const q=f.witness(),t=new ReferenceTree("credential");t.setSyntheticLeaf(0,p.diagnose_credentialLeafV2(q.credential.statement.credentialId,p.diagnose_credentialCommitmentV2(q.credential.statement,q.credential.credentialOpening)));q.credentialMembership.path.siblings=t.path(0);failed("stale credential",f,q);});
 it("revoked credential fails repeatedly; unrelated revocation needs refreshed path and changes state digest",()=>{
  const f=setup(),before=success(f),stale=f.witness(),next=f.revoke(1);failed("stale revocation",f,stale,f.request(),next,1700000250n,"not revoked root");const after=success(f,f.witness(),f.request(),next);expect(after.result.requestDigest).toEqual(before.result.requestDigest);expect(hex(after.result.stateDigest)).not.toBe(hex(before.result.stateDigest));failed("revoked",f,f.witness(1),f.request(),next,1700000250n,"not revoked root");failed("repeated revoked proof",f,f.witness(1),f.request(),next,1700000250n,"not revoked root");
 });
 it("revocation path valid only at another index cannot decouple membership",()=>{const f=setup(),next=f.revoke(1),w=f.witness();w.revocationPath.siblings=f.revocations.path(2);expect(p.root(domain("REVOCATION_MERKLE_NODE"),p.diagnose_notRevokedV2(),2n,w.revocationPath.siblings)).toEqual(f.revocations.root());failed("revocation index binding",f,w,f.request(),next,1700000250n,"not revoked root");});
 for(const path of ["issuer","credential","revocation"]as const)for(const n of [15,17])it("rejects "+path+" path length "+n,()=>{const f=setup(),w=f.witness(),bad=Array.from({length:n},()=>bytes("sibling"));if(path==="issuer")w.issuerMembership.path.siblings=bad;else if(path==="credential")w.credentialMembership.path.siblings=bad;else w.revocationPath.siblings=bad;failed(path+" length "+n,f,w);});
 it("one detached immutable witness; no caller bytes or private state modified",()=>{const f=setup(),ctx=f.context(),original=structuredClone(ctx.currentPrivateState);f.contract.circuits.proveQualificationV2(ctx,f.request());expect(f.calls()).toBe(1);expect(ctx.currentPrivateState).toEqual(original);const snap=f.lastSnapshot();if(!snap)throw new Error("missing snapshot");function check(a:unknown,b:unknown){if(a instanceof Uint8Array){expect(a===b).toBe(false);return;}if(a&&typeof a==="object"){expect(Object.isFrozen(a)).toBe(true);for(const [k,v]of Object.entries(a))check(v,(b as Record<string,unknown>)[k]);}}check(snap,ctx.currentPrivateState.qualification);});
 it("nonzero challenge/verifier and both request times bind the actual output digest",()=>{const f=setup(),base=success(f);for(const field of ["challenge","verifierContext","requestIssuedAt","requestExpiresAt"]as const){const r=f.request();if(field==="challenge"||field==="verifierContext")r[field]=bytes("changed-"+field);else r[field]+=1n;const out=success(f,f.witness(),r);expect(hex(out.result.requestDigest)).not.toBe(hex(base.result.requestDigest));expect(out.result.stateDigest).toEqual(base.result.stateDigest);}});
 it("cross-contract replay fails; matching new contract binds both digests",()=>{const f=setup(),a=success(f),address=rt.decodeContractAddress(bytes("other-contract")),r=f.request();failed("cross-contract replay",f,f.witness(),r,f.state,1700000250n,"request contract",0,address);r.registryContract.bytes=rt.encodeContractAddress(address);const b=success(f,f.witness(),r,f.state,1700000250n,address);expect(hex(a.result.requestDigest)).not.toBe(hex(b.result.requestDigest));expect(hex(a.result.stateDigest)).not.toBe(hex(b.result.stateDigest));});
 it("complete ten-field request and eight-field state digests use distinct typed domains",()=>{
  const f=setup(),out=success(f),r=f.request(),st=f.verificationState();
  for(const field of Object.keys(r)as(keyof Request)[]){const x=structuredClone(r);const value=x[field];if(typeof value==="bigint")Object.assign(x,{[field]:value+1n});else if(value instanceof Uint8Array)Object.assign(x,{[field]:bytes("request-"+field)});else x.registryContract.bytes=bytes("request-address");expect(hex(p.diagnose_requestDigestV2(x))).not.toBe(hex(out.result.requestDigest));}
  for(const field of Object.keys(st)as(keyof typeof st)[]){const x=structuredClone(st),value=x[field];if(typeof value==="bigint")Object.assign(x,{[field]:value+1n});else if(value instanceof Uint8Array)Object.assign(x,{[field]:bytes("state-"+field)});else x.registryContract.bytes=bytes("state-address");expect(hex(p.diagnose_stateDigestV2(x))).not.toBe(hex(out.result.stateDigest));}
  expect(hex(rt.persistentHash(schemas.QualificationRequestDigestInputV2,{domain:domain("PROOF_STATE"),request:r}))).not.toBe(hex(out.result.requestDigest));expect(hex(rt.persistentHash(schemas.QualificationVerificationStateDigestInputV2,{domain:domain("PROOF_REQUEST"),state:st}))).not.toBe(hex(out.result.stateDigest));
 });
 it("sealed context change rejects old request and old issuer identity",()=>{const f=setup(),state=overrideState(f.state,new Map([[1,bytes("different-deployment-context")]]));failed("old request context",f,f.witness(),f.request(),state,1700000250n,"request context",0);const r=f.request();r.registryContext=bytes("different-deployment-context");failed("old issuer context",f,f.witness(),r,state,1700000250n,"noncanonical issuer id");});
 it("actual unrelated issuer and credential registrations require refreshed paths and bind new state",()=>{
  const f=setup(),reg=registration(),before=success(f),staleIssuer=f.witness(),control=p.diagnose_issuerControlV2(f.f.context,bytes("new-issuer-secret"));
  const ctx=rt.createCircuitContext(rt.dummyContractAddress(),f.zs,f.state,{authority:f.f.authority,issuerPath:f.issuers.path(2),credential:reg.witness()});
  const added=reg.contract.circuits.registerIssuerV2(ctx,control);let state=rt.ContractState.deserialize(f.state.serialize());state.data=added.context.currentQueryContext.state;
  f.issuers.setSyntheticLeaf(2,p.diagnose_issuerLeafV2({protocolVersion:2n,issuerId:p.diagnose_issuerIdV2(f.f.context,control),issuerControlCommitment:control}));
  failed("after issuer insertion",f,staleIssuer,f.request(),state,1700000250n,"membership root");const issuerChanged=success(f,f.witness(),f.request(),state);expect(hex(issuerChanged.result.stateDigest)).not.toBe(hex(before.result.stateDigest));
  const staleCredential=f.witness(),w=reg.witness();w.credential=reg.packageFor(reg.records[0],bytes("third-credential"));w.issuerMembership.path.siblings=f.issuers.path(0);w.insertionPath.siblings=f.credentials.path(2);
  const inserted=reg.contract.circuits.registerCredentialV2(reg.context(w,state));const next=rt.ContractState.deserialize(state.serialize());next.data=inserted.context.currentQueryContext.state;state=next;
  f.credentials.setSyntheticLeaf(2,p.diagnose_credentialLeafV2(w.credential.statement.credentialId,p.diagnose_credentialCommitmentV2(w.credential.statement,w.credential.credentialOpening)));
  failed("after credential insertion",f,staleCredential,f.request(),state,1700000250n,"membership root");const credentialChanged=success(f,f.witness(),f.request(),state);expect(credentialChanged.result.requestDigest).toEqual(before.result.requestDigest);expect(hex(credentialChanged.result.stateDigest)).not.toBe(hex(issuerChanged.result.stateDigest));
 });
 for(const variant of ["domain","version"]as const)it("rejects authenticated subject commitment with wrong "+variant,()=>{const f=setup(),w=f.witness();w.credential.statement.subjectCommitment=rt.persistentCommit(schemas.SubjectCommitmentValueV2,{domain:variant==="domain"?domain("CREDENTIAL_COMMITMENT"):domain("SUBJECT_COMMITMENT"),protocolVersion:variant==="version"?1n:2n,credentialId:w.credential.statement.credentialId},w.subjectSecret);failed("subject "+variant,f,w,f.request(),f.installPackage(w),1700000250n,"subject commitment mismatch");});
 for(const field of ["subjectSecret","nonce","opening"]as const)it("rejects malformed private "+field+" byte length",()=>{const f=setup(),w=f.witness();if(field==="subjectSecret")w.subjectSecret=new Uint8Array(31);else if(field==="nonce")w.credential.issuanceNonce=new Uint8Array(31);else w.credential.credentialOpening=new Uint8Array(31);failed(field+" length",f,w);});
 for(const value of [-1n,18446744073709551616n])it("rejects out-of-range private timestamp "+value,()=>{const f=setup(),w=f.witness();w.credential.statement.issuedAt=value;failed("timestamp range",f,w);});
 it("rejects malformed public request at generated adapter boundary",()=>{const f=setup(),r=f.request();r.challenge=new Uint8Array(31);failed("challenge length",f,f.witness(),r,f.state,1700000250n,undefined,0);r.challenge=bytes("valid");r.requestExpiresAt=18446744073709551616n;failed("request time overflow",f,f.witness(),r,f.state,1700000250n,undefined,0);});

});
afterAll(()=>writeFileSync(join(mkdtempSync(join(tmpdir(),"justproof-snapshots-")),"snapshots.json"),JSON.stringify(evidence,null,2)));
