/** Synthetic local test harness; no backend, authority or network service. */
import * as rt from "@midnight-ntwrk/compact-runtime";
import { Contract, type CredentialRegistrationWitnessV2 as W, type IssuerRecordV2, type Witnesses } from "../../contracts/managed/just-proof/contract/index.js";
import { p, overrideState } from "./v3a-register-issuer.js";
import { ReferenceTree,qualification } from "./v2-reference.js";
import { fixture as bytes,syntheticInputs } from "./v2-vectors.js";
export type PS={authority:Uint8Array;issuerPath:Uint8Array[];credential:W};
export function freezeSnapshot<T>(value:T):T {
  if(value && typeof value==="object" && !(value instanceof Uint8Array)) {
    for(const x of Object.values(value))freezeSnapshot(x);
    Object.freeze(value);
  }return value;
}
export function setup() {
  const f=syntheticInputs(),issuers=new ReferenceTree("issuer"),credentials=new ReferenceTree("credential");
  let calls=0,last:W|undefined;
  const witnesses:Witnesses<PS>={
    registryAuthoritySecretWitness:({privateState})=>[privateState,Uint8Array.from(privateState.authority)],
    issuerRegistrationWitnessV2:({privateState})=>[privateState,{registryAuthoritySecret:Uint8Array.from(privateState.authority),insertionPath:{siblings:privateState.issuerPath.map(x=>Uint8Array.from(x))}}],
    credentialRevocationWitnessV2:()=>{throw new Error("earlier endpoint must not request revocation witness");},
    credentialRegistrationWitnessV2:({privateState})=>{
      calls++;last=freezeSnapshot(structuredClone(privateState.credential));return [privateState,last];
    }
  };
  const contract=new Contract(witnesses);
  const secrets=[f.issuer,bytes("issuer-two")];
  const records:IssuerRecordV2[]=secrets.map(secret=>{
    const control=p.diagnose_issuerControlV2(f.context,secret);
    return {protocolVersion:2n,issuerId:p.diagnose_issuerIdV2(f.context,control),issuerControlCommitment:control};
  });
  function packageFor(record=records[0],nonce=f.nonce):W["credential"] {
    return {statement:{protocolVersion:2n,credentialId:p.diagnose_credentialIdV2(record.issuerId,nonce),issuerId:record.issuerId,
      subjectCommitment:bytes("opaque-subject-commitment"),qualificationType:qualification,qualificationVersion:1n,issuedAt:1700000123n,expiresAt:0n},
      issuanceNonce:Uint8Array.from(nonce),credentialOpening:Uint8Array.from(f.opening)};
  }
  const seed:W={issuerSecret:f.issuer,credential:packageFor(),issuerMembership:{record:records[0],issuerIndex:0n,path:{siblings:issuers.path(0)}},insertionPath:{siblings:credentials.path(0)}};
  let state=contract.initialState(rt.createConstructorContext({authority:f.authority,issuerPath:issuers.path(0),credential:seed},"00".repeat(32)),f.context).currentContractState;
  const zs=contract.initialState(rt.createConstructorContext({authority:f.authority,issuerPath:issuers.path(0),credential:seed},"00".repeat(32)),f.context).currentZswapLocalState;
  for(let i=0;i<2;i++){
    const ctx=rt.createCircuitContext(rt.dummyContractAddress(),zs,state,{authority:f.authority,issuerPath:issuers.path(i),credential:seed});
    const out=contract.circuits.registerIssuerV2(ctx,records[i].issuerControlCommitment);
    state=rt.ContractState.deserialize(state.serialize());state.data=out.context.currentQueryContext.state;
    issuers.setSyntheticLeaf(i,p.diagnose_issuerLeafV2(records[i]));
  }
  function witness():W{return structuredClone({...seed,issuerMembership:{record:records[0],issuerIndex:0n,path:{siblings:issuers.path(0)}}});}
  function context(w=witness(),s=state,address=rt.dummyContractAddress()){
    return rt.createCircuitContext(address,zs,s,freezeSnapshot({authority:Uint8Array.from(f.authority),issuerPath:issuers.path(0),credential:structuredClone(w)}));
  }
  function installRecord(w:W){
    const tree=new ReferenceTree("issuer");tree.setSyntheticLeaf(Number(w.issuerMembership.issuerIndex),p.diagnose_issuerLeafV2(w.issuerMembership.record));
    w.issuerMembership.path.siblings=tree.path(Number(w.issuerMembership.issuerIndex));
    return overrideState(state,new Map<number,Uint8Array|bigint>([[2,tree.root()],[3,w.issuerMembership.issuerIndex+1n]]));
  }
  return {f,records,secrets,issuers,credentials,contract,state,zs,witness,context,packageFor,installRecord,calls:()=>calls,lastSnapshot:()=>last};
}

