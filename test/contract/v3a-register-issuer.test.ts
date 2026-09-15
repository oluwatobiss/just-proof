import { describe,it,expect } from "vitest";
import { readFileSync,writeFileSync,mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import * as rt from "@midnight-ntwrk/compact-runtime";
import { ledger } from "../../contracts/managed/just-proof/contract/index.js";
import { fixture,leaf,overrideState,snapshot,partition,locations,p } from "../support/v3a-register-issuer.js";
import { domain,ReferenceTree,hex } from "../support/v2-reference.js";

const records:unknown[]=[];
function failure(name:string,f:ReturnType<typeof fixture>,ctx:ReturnType<ReturnType<typeof fixture>["context"]>,control:Uint8Array,message?:string) {
  const before=snapshot(ledger(ctx.currentQueryContext.state));
  const encoded=ctx.currentQueryContext.state.state.encode();
  const privateBefore=structuredClone(ctx.currentPrivateState);
  expect(()=>f.contract.circuits.registerIssuerV2(ctx,control)).toThrow(message);
  const after=snapshot(ledger(ctx.currentQueryContext.state));
  expect(after).toEqual(before);expect(ctx.currentQueryContext.state.state.encode()).toEqual(encoded);
  expect(ctx.currentPrivateState).toEqual(privateBefore);
  records.push({name,before,after,unchanged:true});
}
function success(f:ReturnType<typeof fixture>,ctx:ReturnType<ReturnType<typeof fixture>["context"]>,control:Uint8Array,index:number) {
  const before=snapshot(ledger(ctx.currentQueryContext.state));
  const out=f.contract.circuits.registerIssuerV2(ctx,control);
  expect(out.result).toEqual([]);expect(out.proofData.output).toEqual({value:[],alignment:[]});
  f.tree.setSyntheticLeaf(index,leaf(f.f.context,control));
  const after=snapshot(ledger(out.context.currentQueryContext.state));
  expect(after.issuerRoot).toBe(hex(f.tree.root()));
  expect(after.nextIssuerIndex).toBe(String(index+1));
  expect(after.registeredIssuerLeaves).toEqual([...before.registeredIssuerLeaves,hex(leaf(f.f.context,control))].sort());
  const changed=(Object.keys(before) as (keyof typeof before)[]).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
  expect(changed).toEqual(["issuerRoot","nextIssuerIndex","registeredIssuerLeaves"]);
  expect(snapshot(ledger(ctx.currentQueryContext.state))).toEqual(before);
  records.push({name:"success index "+index,before,after,changed});return out;
}
describe("registerIssuerV2 compiled contract logic",()=>{
  it("first and consecutive registrations use refreshed paths, unit returns and exactly three writes",()=>{
    const f=fixture(),a=f.f.issuer,b=f.f.subject;
    const out=success(f,f.context(),a,0);
    const state=rt.ContractState.deserialize(f.initial.currentContractState.serialize());
    state.data=out.context.currentQueryContext.state;
    success(f,f.context(f.tree.path(1),f.f.authority,state),b,1);
    expect(f.calls()).toBe(2);
  });
  it("last valid index 65535 increments to full sentinel 65536",()=>{
    const f=fixture(),state=overrideState(f.initial.currentContractState,new Map([[3,65535n]]));
    // Synthetic boundary state, not a claim that 65535 prior registrations ran.
    success(f,f.context(f.tree.path(65535),f.f.authority,state),f.f.issuer,65535);
  });
  for(const [name,role] of [["zero authority","zero"],["wrong authority","wrong"],["issuer substitution","issuer"],["holder substitution","subject"]] as const)
    it(name+" rejects with all nine fields unchanged",()=>{
      const f=fixture(),secret=role==="zero"?new Uint8Array(32):role==="wrong"?new Uint8Array(32).fill(197):f.f[role];
      failure(name,f,f.context(undefined,secret),f.f.issuer,role==="zero"?"authority secret zero":"authority control mismatch");
    });
  it("zero commitment rejects before invoking the witness",()=>{
    const f=fixture();failure("zero commitment",f,f.context(),new Uint8Array(32),"issuer control zero");expect(f.calls()).toBe(0);
  });
  for(const variant of ["context","version","domain"] as const)
    it("wrong authority "+variant+" derivation rejects atomically",()=>{
      const f=fixture();
      const bad=p.raw_RegistryAuthorityControlInputV2({domain:variant==="domain"?domain("ISSUER_CONTROL"):domain("REGISTRY_AUTHORITY_CONTROL"),protocolVersion:variant==="version"?1n:2n,registryContext:variant==="context"?f.f.issuer:f.f.context,registryAuthoritySecret:f.f.authority});
      const state=overrideState(f.initial.currentContractState,new Map([[0,bad]]));
      failure("wrong "+variant,f,f.context(undefined,f.f.authority,state),f.f.issuer,"authority control mismatch");
    });
  it("duplicate leaf rejects before late path processing",()=>{
    const f=fixture(),out=success(f,f.context(),f.f.issuer,0),state=rt.ContractState.deserialize(f.initial.currentContractState.serialize());
    state.data=out.context.currentQueryContext.state;
    failure("duplicate",f,f.context(f.tree.path(1),f.f.authority,state),f.f.issuer,"duplicate issuer leaf");
  });
  it("stale insertion path rejects after an unrelated registration",()=>{
    const f=fixture(),stale=f.tree.path(1),out=success(f,f.context(),f.f.issuer,0),state=rt.ContractState.deserialize(f.initial.currentContractState.serialize());
    state.data=out.context.currentQueryContext.state;
    failure("stale path",f,f.context(stale,f.f.authority,state),f.f.subject,"empty slot root");
  });
  it("corrupted sibling rejects atomically",()=>{
    const f=fixture(),path=f.tree.path(0);path[7][0]^=1;
    failure("corrupt sibling",f,f.context(path),f.f.issuer,"empty slot root");
  });
  it("path valid only for another index rejects",()=>{
    const f=fixture(),tree=new ReferenceTree("issuer");tree.setSyntheticLeaf(1,f.f.subject);
    const state=overrideState(f.initial.currentContractState,new Map<number,Uint8Array|bigint>([[2,tree.root()],[3,2n]]));
    expect(p.root(domain("ISSUER_MERKLE_NODE"),p.diagnose_issuerEmptyV2(),0n,tree.path(0))).toEqual(tree.root());
    failure("other index",f,f.context(tree.path(0),f.f.authority,state),f.f.issuer,"empty slot root");
  });
  it("occupied insertion position rejects",()=>{
    const f=fixture();f.tree.setSyntheticLeaf(0,f.f.subject);
    const state=overrideState(f.initial.currentContractState,new Map([[2,f.tree.root()]]));
    failure("occupied",f,f.context(f.tree.path(0),f.f.authority,state),f.f.issuer,"empty slot root");
  });
  it("full counter rejects before narrowing",()=>{
    const f=fixture(),state=overrideState(f.initial.currentContractState,new Map([[3,65536n]]));
    failure("full",f,f.context(undefined,f.f.authority,state),f.f.issuer,"tree full");
  });
  for(const length of [15,17])
    it("generated witness adapter rejects path length "+length,()=>{
      const f=fixture(),path=Array.from({length},()=>new Uint8Array(32));
      failure("path length "+length,f,f.context(path),f.f.issuer);
    });
  it("takes exactly one detached witness snapshot without issuer secret or proof of possession",()=>{
    const f=fixture(),ctx=f.context(),before=structuredClone(ctx.currentPrivateState);
    f.contract.circuits.registerIssuerV2(ctx,new Uint8Array(32).fill(231)); // arbitrary commitment; no known issuer preimage
    expect(f.calls()).toBe(1);expect(ctx.currentPrivateState).toEqual(before);
    expect(Object.keys(ctx.currentPrivateState.registration)).toEqual(["registryAuthoritySecret","insertionPath"]);
    expect(Object.isFrozen(ctx.currentPrivateState)).toBe(true);
  });
  it("incremental ABI exports only the four approved lifecycle circuits and retains issuer witness fields",()=>{
    const f=fixture();expect(Object.keys(f.contract.circuits)).toEqual(["registerIssuerV2","registerCredentialV2","revokeCredentialV2","proveQualificationV2"]);
    expect(Object.keys(f.contract.provableCircuits)).toEqual(["registerIssuerV2","registerCredentialV2","revokeCredentialV2","proveQualificationV2"]);
    const source=readFileSync("contracts/just-proof.compact","utf8");
    expect(source.match(/export circuit/g)).toHaveLength(4);
    expect(source.split("export circuit registerCredentialV2")[0].match(/disclose\(/g)).toHaveLength(4);
    expect(source).not.toContain("disclose(issuerControlCommitment)");
    expect(source.indexOf("const incremented")).toBeLessThan(source.indexOf("issuerRoot = disclose(newRoot)"));
  });
  it("D5 reviewed boundary keeps raw input private and exposes canonical leaf/root without secret leakage",()=>{
    const authority=Uint8Array.from(randomBytes(32)),control=new Uint8Array(32).fill(173),f=fixture(authority),ctx=f.context();
    const out=f.contract.circuits.registerIssuerV2(ctx,control);
    const [guaranteed,fallible]=partition(ctx,out);
    expect(guaranteed).toBeDefined();expect(fallible).toBeUndefined();
    expect(locations(guaranteed,leaf(f.f.context,control)).length).toBeGreaterThan(0);
    expect(locations(guaranteed,ledger(out.context.currentQueryContext.state).issuerRoot).length).toBeGreaterThan(0);
    const surfaces={callerArguments:[control],generatedInput:out.proofData.input,privateWitnessOutputs:out.proofData.privateTranscriptOutputs,publicQueryTranscript:out.proofData.publicTranscript,guaranteed,fallible,effects:out.context.currentQueryContext.effects,ledger:out.context.currentQueryContext.state.state.encode(),output:out.proofData.output};
    const raw=Object.fromEntries(Object.entries(surfaces).map(([name,value])=>[name,locations(value,control)]));
    expect(raw.callerArguments.length).toBeGreaterThan(0);expect(raw.generatedInput.length).toBeGreaterThan(0);
    for(const name of ["privateWitnessOutputs","publicQueryTranscript","guaranteed","fallible","effects","ledger","output"])expect(raw[name]).toEqual([]);
    for(const [name,value] of Object.entries(surfaces))if(name!=="privateWitnessOutputs")expect(locations(value,authority).length).toBe(0);
    expect(locations(out.proofData.privateTranscriptOutputs,authority).length).toBeGreaterThan(0);
    const sdk=readFileSync("node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractExecutable.js","utf8");
    expect(sdk).toMatch(/private: \{\s*result,\s*input: proofData.input/);
    // Persist only synthetic non-secret public material and boolean/location findings. Never witness bytes.
    mkdirSync("/tmp/justproof-phase3a",{recursive:true});
    const replacer=(_key:string,value:unknown)=>typeof value==="bigint"?value.toString():value instanceof Uint8Array?{bytes:hex(value)}:value instanceof Map?[...value]:value;
    writeFileSync("/tmp/justproof-phase3a/d5.json",JSON.stringify({rawLocations:raw,secretAbsentPublic:true,secretPresentPrivateWitness:true,publicQueryTranscript:out.proofData.publicTranscript,guaranteed,fallible,publicInputInterpretation:"Generated input is CompactJS private.input; not a raw public transaction input",rawChainExposure:false,reviewedBoundarySatisfied:true},replacer,2));
    writeFileSync("/tmp/justproof-phase3a/snapshots.json",JSON.stringify(records,null,2));
  });
});
