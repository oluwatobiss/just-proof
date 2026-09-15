/** Synthetic contract-test harness only; state overrides are not deployment APIs. */
import * as rt from "@midnight-ntwrk/compact-runtime";
import * as lv from "@midnight-ntwrk/ledger-v8";
import { Contract, ledger, type IssuerRegistrationWitnessV2, type Ledger, type Witnesses } from "../../contracts/managed/just-proof/contract/index.js";
import { pureCircuits as p } from "../fixtures/managed/phase2-primitives/contract/index.js";
import { ReferenceTree, b32, u32, hex } from "./v2-reference.js";
import { syntheticInputs } from "./v2-vectors.js";
export { p };
export type PS = { readonly secret: Uint8Array; readonly registration: IssuerRegistrationWitnessV2 };
export function snapshot(l: Ledger) {
  return {
    registryAuthorityControlCommitment:hex(l.registryAuthorityControlCommitment), registryContext:hex(l.registryContext),
    issuerRoot:hex(l.issuerRoot), nextIssuerIndex:l.nextIssuerIndex.toString(),
    registeredIssuerLeaves:[...l.registeredIssuerLeaves].map(hex).sort(),
    credentialRoot:hex(l.credentialRoot), nextCredentialIndex:l.nextCredentialIndex.toString(),
    registeredCredentialNullifiers:[...l.registeredCredentialNullifiers].map(hex).sort(),
    revocationRoot:hex(l.revocationRoot)
  };
}
export function fixture(secret=syntheticInputs().authority) {
  const f=syntheticInputs(), tree=new ReferenceTree("issuer");
  let calls=0;
  const witnesses:Witnesses<PS>={
    credentialRevocationWitnessV2:()=>{throw new Error("earlier endpoint must not request revocation witness");},
    credentialRegistrationWitnessV2:()=>{throw new Error("issuer test must not request credential witness");},
    registryAuthoritySecretWitness:({privateState})=>[privateState,Uint8Array.from(privateState.secret)],
    issuerRegistrationWitnessV2:({privateState})=>{
      calls++;
      // One detached operation-scoped snapshot. Generated wrapper validates exact lengths.
      const snapshot=structuredClone(privateState.registration);
      Object.freeze(snapshot.insertionPath.siblings);
      Object.freeze(snapshot.insertionPath);Object.freeze(snapshot);
      return [privateState,snapshot];
    }
  };
  const contract=new Contract(witnesses);
  const ps:PS=Object.freeze({secret:Uint8Array.from(secret),registration:{registryAuthoritySecret:Uint8Array.from(secret),insertionPath:{siblings:tree.path(0)}}});
  const initial=contract.initialState(rt.createConstructorContext(ps,"00".repeat(32)),f.context);
  function context(path=tree.path(0),authority=secret,state=initial.currentContractState) {
    const privateState:PS=Object.freeze({secret:Uint8Array.from(secret),registration:{registryAuthoritySecret:Uint8Array.from(authority),insertionPath:{siblings:path.map(x=>Uint8Array.from(x))}}});
    return rt.createCircuitContext(rt.dummyContractAddress(),initial.currentZswapLocalState,state,privateState);
  }
  return {f,tree,contract,initial,context,calls:()=>calls};
}
export function leaf(context:Uint8Array,control:Uint8Array) {
  return p.diagnose_issuerLeafV2({protocolVersion:2n,issuerId:p.diagnose_issuerIdV2(context,control),issuerControlCommitment:control});
}
/** Synthetic boundary/corruption fixture, using generated ledger layout and runtime cells. */
export function overrideState(state:rt.ContractState, changes:ReadonlyMap<number,Uint8Array|bigint>) {
  const copy=rt.ContractState.deserialize(state.serialize());
  const entries=copy.data.state.asArray();
  if(!entries || entries.length!==9)throw new Error("expected generated nine-field array");
  let data=rt.StateValue.newArray();
  for(let i=0;i<entries.length;i++) {
    const value=changes.get(i);
    data=data.arrayPush(value===undefined?entries[i]:rt.StateValue.newCell(typeof value==="bigint"?{value:u32.toValue(value),alignment:u32.alignment()}:{value:b32.toValue(value),alignment:b32.alignment()}));
  }
  copy.data=new rt.ChargedState(data);return copy;
}
export function partition<S>(ctx:rt.CircuitContext<S>,out:rt.CircuitResults<S,[]>) {
  // Exact conversion and partition procedure used by installed CompactJS ContractExecutable.
  let q=new lv.QueryContext(new lv.ChargedState(lv.StateValue.decode(ctx.currentQueryContext.state.state.encode())),ctx.currentQueryContext.address);
  q.block=ctx.currentQueryContext.block;q.effects=ctx.currentQueryContext.effects;
  for(const [key,value] of out.context.currentQueryContext.comIndices)q=q.insertCommitment(key,value);
  return lv.partitionTranscripts([new lv.PreTranscript(q,out.proofData.publicTranscript)],lv.LedgerParameters.initialParameters())[0];
}
/** Structural exact-value inspection (never substring matching): traverse typed values,
 * encoded cells, operation objects, arrays and Maps, recording matching value locations. */
export function locations(value:unknown,target:Uint8Array,path="$"):string[] {
  if(value instanceof Uint8Array)return value.length===target.length && value.every((b,i)=>b===target[i])?[path]:[];
  if(value instanceof Map)return [...value].flatMap(([k,v],i)=>[...locations(k,target,path+".mapKey"+i),...locations(v,target,path+".mapValue"+i)]);
  if(Array.isArray(value))return value.flatMap((v,i)=>locations(v,target,path+"["+i+"]"));
  if(value && typeof value==="object")return Object.entries(value).flatMap(([k,v])=>locations(v,target,path+"."+k));
  return [];
}
