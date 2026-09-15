/** Local compiled-simulation harness; reference trees are untrusted synthetic coordinators. */
import * as rt from "@midnight-ntwrk/compact-runtime";
import {Contract,ledger,type QualificationWitnessV2 as W,type QualificationRequestV2 as Request,type CredentialRevocationWitnessV2,type Witnesses} from "../../contracts/managed/just-proof/contract/index.js";
import {setup as registration,freezeSnapshot} from "./v3b-register-credential.js";
import {p,overrideState} from "./v3a-register-issuer.js";
import {ReferenceTree,qualification} from "./v2-reference.js";
import {fixture as bytes} from "./v2-vectors.js";
export type PS={readonly qualification:W};
export function setup(){
  const base=registration(),revocations=new ReferenceTree("revocation"),holders=[base.f.subject,bytes("holder-two")];
  const packages=[base.packageFor(),base.packageFor(base.records[0],bytes("qualification-nonce-two"))];
  let state=base.state;const states=[state];
  for(let i=0;i<2;i++){
    packages[i].statement.subjectCommitment=p.diagnose_subjectCommitmentV2(packages[i].statement.credentialId,holders[i]);
    if(i===1)packages[i].statement.expiresAt=1700000400n;
    const w=base.witness();w.credential=packages[i];w.insertionPath.siblings=base.credentials.path(i);
    const out=base.contract.circuits.registerCredentialV2(base.context(w,state));
    const next=rt.ContractState.deserialize(state.serialize());next.data=out.context.currentQueryContext.state;state=next;states.push(state);
    base.credentials.setSyntheticLeaf(i,p.diagnose_credentialLeafV2(packages[i].statement.credentialId,p.diagnose_credentialCommitmentV2(packages[i].statement,packages[i].credentialOpening)));
  }
  let calls=0,last:W|undefined;
  const forbidden=()=>{throw new Error("qualification must not request another role witness");};
  const witnesses:Witnesses<PS>={registryAuthoritySecretWitness:forbidden,issuerRegistrationWitnessV2:forbidden,credentialRegistrationWitnessV2:forbidden,credentialRevocationWitnessV2:forbidden,
    qualificationWitnessV2:({privateState})=>{calls++;last=freezeSnapshot(structuredClone(privateState.qualification));return [privateState,last];}};
  const contract=new Contract(witnesses);
  function witness(i=0):W{return structuredClone({credential:packages[i],subjectSecret:holders[i],issuerMembership:{record:base.records[0],issuerIndex:0n,path:{siblings:base.issuers.path(0)}},credentialMembership:{credentialIndex:BigInt(i),path:{siblings:base.credentials.path(i)}},revocationPath:{siblings:revocations.path(i)}});}
  function request():Request{return {protocolVersion:2n,proofType:1n,registryContract:{bytes:rt.encodeContractAddress(rt.dummyContractAddress())},registryContext:base.f.context,qualificationType:qualification,qualificationVersion:1n,verifierContext:bytes("qualification-verifier"),challenge:bytes("qualification-challenge"),requestIssuedAt:1700000200n,requestExpiresAt:1700000300n};}
  function context(w=witness(),s=state,now=1700000250n,address=rt.dummyContractAddress()){
    const ctx=rt.createCircuitContext(address,base.zs,s,freezeSnapshot({qualification:structuredClone(w)}));ctx.currentQueryContext.block={...ctx.currentQueryContext.block,secondsSinceEpoch:now,secondsSinceEpochErr:0};return ctx;
  }
  /** Synthetic authenticated package fixtures for reaching validation gates or time boundaries. */
  function installPackage(w:W,s=state){
    const t=new ReferenceTree("credential"),index=Number(w.credentialMembership.credentialIndex);
    const st=w.credential.statement;t.setSyntheticLeaf(index,p.diagnose_credentialLeafV2(st.credentialId,p.diagnose_credentialCommitmentV2(st,w.credential.credentialOpening)));w.credentialMembership.path.siblings=t.path(index);
    return overrideState(s,new Map<number,bigint|Uint8Array>([[5,t.root()],[6,BigInt(index+1)]]));
  }
  function revoke(i:number,s=state){
    const q=witness(i),rw:CredentialRevocationWitnessV2={issuerSecret:base.secrets[0],issuerMembership:q.issuerMembership,issuanceNonce:q.credential.issuanceNonce,credentialId:q.credential.statement.credentialId,credentialCommitment:p.diagnose_credentialCommitmentV2(q.credential.statement,q.credential.credentialOpening),credentialMembership:q.credentialMembership,revocationPath:{siblings:revocations.path(i)}};
    const revoker=new Contract<PS>({...witnesses,credentialRevocationWitnessV2:({privateState})=>[privateState,freezeSnapshot(structuredClone(rw))]});
    const out=revoker.circuits.revokeCredentialV2(context(q,s));const next=rt.ContractState.deserialize(s.serialize());next.data=out.context.currentQueryContext.state;
    revocations.setSyntheticLeaf(i,p.diagnose_revokedLeafV2(rw.credentialId,rw.credentialCommitment));return next;
  }
  function verificationState(s=state,address=rt.dummyContractAddress()){
    const l=ledger(s.data);return {protocolVersion:2n,registryContract:{bytes:rt.encodeContractAddress(address)},registryContext:l.registryContext,issuerRoot:l.issuerRoot,nextIssuerIndex:l.nextIssuerIndex,credentialRoot:l.credentialRoot,nextCredentialIndex:l.nextCredentialIndex,revocationRoot:l.revocationRoot};
  }
  return {...base,contract,state,states,packages,holders,revocations,witness,request,context,installPackage,revoke,verificationState,calls:()=>calls,lastSnapshot:()=>last};
}
