/** Untrusted synthetic tree/coordinator fixtures. Ordinary setup executes both registration circuits. */
import * as rt from "@midnight-ntwrk/compact-runtime";
import {Contract,type CredentialRevocationWitnessV2 as W,type Witnesses} from "../../contracts/managed/just-proof/contract/index.js";
import {setup as registrations,freezeSnapshot} from "./v3b-register-credential.js";
import {p,overrideState} from "./v3a-register-issuer.js";
import {ReferenceTree} from "./v2-reference.js";
import {fixture as bytes} from "./v2-vectors.js";
export type PS={readonly revocation:W};
export function setup(){
  const base=registrations(),revocations=new ReferenceTree("revocation");
  let state=base.state;
  const packages=[base.packageFor(),base.packageFor(base.records[0],bytes("revocation-second-nonce")),base.packageFor(base.records[1],bytes("revocation-other-issuer-nonce"))];
  const states:rt.ContractState[]=[state];
  for(let i=0;i<packages.length;i++){
    const w=base.witness(),issuer=i===2?1:0;
    w.credential=packages[i];w.issuerSecret=base.secrets[issuer];w.issuerMembership={record:base.records[issuer],issuerIndex:BigInt(issuer),path:{siblings:base.issuers.path(issuer)}};w.insertionPath.siblings=base.credentials.path(i);
    const out=base.contract.circuits.registerCredentialV2(base.context(w,state));
    const next=rt.ContractState.deserialize(state.serialize());next.data=out.context.currentQueryContext.state;state=next;states.push(state);
    const commitment=p.diagnose_credentialCommitmentV2(packages[i].statement,packages[i].credentialOpening);
    base.credentials.setSyntheticLeaf(i,p.diagnose_credentialLeafV2(packages[i].statement.credentialId,commitment));
  }
  let calls=0,last:W|undefined;
  const witnesses:Witnesses<PS>={
    registryAuthoritySecretWitness:()=>{throw new Error("revocation must not request authority");},
    issuerRegistrationWitnessV2:()=>{throw new Error("revocation must not request issuer registration");},
    credentialRegistrationWitnessV2:()=>{throw new Error("revocation must not request credential package");},
    qualificationWitnessV2:()=>{throw new Error("earlier endpoint must not request qualification witness");},
    credentialRevocationWitnessV2:({privateState})=>{calls++;last=freezeSnapshot(structuredClone(privateState.revocation));return [privateState,last];}
  };
  const contract=new Contract(witnesses);
  function witness(i=0):W{
    const issuer=i===2?1:0,pkg=packages[i];
    return structuredClone({issuerSecret:base.secrets[issuer],issuerMembership:{record:base.records[issuer],issuerIndex:BigInt(issuer),path:{siblings:base.issuers.path(issuer)}},issuanceNonce:pkg.issuanceNonce,credentialId:pkg.statement.credentialId,credentialCommitment:p.diagnose_credentialCommitmentV2(pkg.statement,pkg.credentialOpening),credentialMembership:{credentialIndex:BigInt(i),path:{siblings:base.credentials.path(i)}},revocationPath:{siblings:revocations.path(i)}});
  }
  function context(w=witness(),s=state){return rt.createCircuitContext(rt.dummyContractAddress(),base.zs,s,freezeSnapshot({revocation:structuredClone(w)}));}
  function installRecord(w:W){
    const t=new ReferenceTree("issuer");t.setSyntheticLeaf(Number(w.issuerMembership.issuerIndex),p.diagnose_issuerLeafV2(w.issuerMembership.record));w.issuerMembership.path.siblings=t.path(Number(w.issuerMembership.issuerIndex));
    return overrideState(state,new Map<number,bigint|Uint8Array>([[2,t.root()],[3,w.issuerMembership.issuerIndex+1n]]));
  }
  return {...base,contract,state,states,packages,revocations,witness,context,installRecord,calls:()=>calls,lastSnapshot:()=>last};
}
