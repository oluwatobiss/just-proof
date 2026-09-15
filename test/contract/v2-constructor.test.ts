import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import * as rt from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger, type Ledger, type Witnesses } from "../../contracts/managed/just-proof/contract/index.js";
import { Contract as Diagnostic } from "../fixtures/managed/phase2-constructor/contract/index.js";
import { schemas, emptyLevels, hex } from "../support/v2-reference.js";
import { syntheticInputs } from "../support/v2-vectors.js";

type PrivateState={secret:Uint8Array};
const witnesses:Witnesses<PrivateState>={credentialRevocationWitnessV2:()=>{throw new Error("earlier endpoint must not request revocation witness");},
    credentialRegistrationWitnessV2:()=>{throw new Error("constructor test must not request credential witness");},registryAuthoritySecretWitness:({privateState})=>[privateState,privateState.secret],issuerRegistrationWitnessV2:()=>{throw new Error("constructor test must not request registration witness");}};
const keys=["registryAuthorityControlCommitment","registryContext","issuerRoot","nextIssuerIndex","registeredIssuerLeaves","credentialRoot","nextCredentialIndex","registeredCredentialNullifiers","revocationRoot"];
function initialize(secret=syntheticInputs().authority,context=syntheticInputs().context) {
  const contract=new Contract(witnesses);
  return {contract,state:contract.initialState(rt.createConstructorContext({secret},"00".repeat(32)),context)};
}
function snapshot(l:Ledger) {
  return {keys:Object.keys(l),context:hex(l.registryContext),authority:hex(l.registryAuthorityControlCommitment),issuer:hex(l.issuerRoot),credential:hex(l.credentialRoot),revocation:hex(l.revocationRoot),issuerIndex:l.nextIssuerIndex,credentialIndex:l.nextCredentialIndex,issuers:l.registeredIssuerLeaves.size(),nullifiers:l.registeredCredentialNullifiers.size()};
}
describe("Phase 2 compiled constructor and diagnostic knowledge check",()=>{
  it("initializes exactly nine fields, both empty sets, zero counters and candidate roots",()=>{
    const f=syntheticInputs(),{contract,state}=initialize(); const l=ledger(state.currentContractState.data);
    expect(Object.keys(l)).toEqual(keys);
    expect(hex(l.registryContext)).toBe(hex(f.context));
    expect(hex(l.registryAuthorityControlCommitment)).toBe(hex(rt.persistentHash(schemas.RegistryAuthorityControlInputV2,{domain:syntheticDomain(),protocolVersion:2n,registryContext:f.context,registryAuthoritySecret:f.authority})));
    expect(hex(l.issuerRoot)).toBe(hex(emptyLevels("issuer")[16]));
    expect(hex(l.credentialRoot)).toBe(hex(emptyLevels("credential")[16]));
    expect(hex(l.revocationRoot)).toBe(hex(emptyLevels("revocation")[16]));
    expect(l.nextIssuerIndex).toBe(0n);expect(l.nextCredentialIndex).toBe(0n);
    expect(l.registeredIssuerLeaves.isEmpty()).toBe(true);expect(l.registeredIssuerLeaves.size()).toBe(0n);
    expect(l.registeredCredentialNullifiers.isEmpty()).toBe(true);expect(l.registeredCredentialNullifiers.size()).toBe(0n);
    expect(Object.keys(contract.circuits)).toEqual(["registerIssuerV2","registerCredentialV2","revokeCredentialV2"]);expect(Object.keys(contract.provableCircuits)).toEqual(["registerIssuerV2","registerCredentialV2","revokeCredentialV2"]);
  });
  it("rejects zero context and zero secret without mutating private input",()=>{
    const f=syntheticInputs(),ps={secret:f.authority};const saved=hex(ps.secret);
    const c=new Contract(witnesses);
    expect(()=>c.initialState(rt.createConstructorContext(ps,"00".repeat(32)),new Uint8Array(32))).toThrow("registry context zero");
    expect(()=>initialize(new Uint8Array(32))).toThrow("authority secret zero");
    expect(hex(ps.secret)===saved).toBe(true);
  });
  it("different nonzero constructor secret creates a different identity, not an invented rejection rule",()=>{
    const first=ledger(initialize().state.currentContractState.data);
    const other=ledger(initialize(syntheticInputs().issuer).state.currentContractState.data);
    expect(hex(first.registryAuthorityControlCommitment)===hex(other.registryAuthorityControlCommitment)).toBe(false);
  });
  it("diagnostic accepts matching knowledge and rejects wrong/cross-role secrets with unchanged ledger",()=>{
    const f=syntheticInputs(),diagnostic=new Diagnostic(witnesses);
    const initial=diagnostic.initialState(rt.createConstructorContext({secret:f.authority},"00".repeat(32)),f.context);
    const before=snapshot(ledger(initial.currentContractState.data));
    for(const secret of [f.authority,f.issuer,f.subject]) {
      const ctx=rt.createCircuitContext(rt.dummyContractAddress(),initial.currentZswapLocalState,initial.currentContractState,{secret});
      if(secret===f.authority) {
        const out=diagnostic.circuits.checkAuthorityKnowledge(ctx);
        expect(snapshot(ledger(out.context.currentQueryContext.state))).toEqual(before);
      } else expect(()=>diagnostic.circuits.checkAuthorityKnowledge(ctx)).toThrow("authority control mismatch");
      expect(snapshot(ledger(initial.currentContractState.data))).toEqual(before);
    }
  });
  it("secret canary stays out of ledger bytes and diagnostic observable transcript; input/private witness distinguished",()=>{
    const canary=Uint8Array.from(randomBytes(32));const context=syntheticInputs().context;
    const c=new Diagnostic(witnesses),initial=c.initialState(rt.createConstructorContext({secret:canary},"00".repeat(32)),context);
    const out=c.circuits.checkAuthorityKnowledge(rt.createCircuitContext(rt.dummyContractAddress(),initial.currentZswapLocalState,initial.currentContractState,{secret:canary}));
    const publicMaterial={input:out.proofData.input,output:out.proofData.output,transcript:out.proofData.publicTranscript,effects:out.context.currentQueryContext.effects,ledger:snapshot(ledger(initial.currentContractState.data))};
    const contains=(value:unknown):boolean=>{
      if(value instanceof Uint8Array) return Buffer.from(value).includes(Buffer.from(canary));
      if(typeof value==="string") return value.includes(hex(canary));
      if(Array.isArray(value))return value.some(contains);
      if(value && typeof value==="object")return Object.values(value).some(contains);
      return false;
    };
    // Boolean assertions deliberately avoid printing the ephemeral canary on failure.
    expect(contains(publicMaterial)).toBe(false);
    expect(Buffer.from(initial.currentContractState.serialize()).includes(Buffer.from(canary))).toBe(false);
    expect(contains(out.proofData.privateTranscriptOutputs)).toBe(true);
    expect(out.proofData.input.value).toHaveLength(0);expect(out.proofData.output.value).toHaveLength(0);
  });
  it("source retains two constructor disclosures and sealed configuration; Phase 3C exports only the three approved lifecycle endpoints",()=>{
    const source=readFileSync("contracts/just-proof.compact","utf8");
    expect(source.split("export circuit registerIssuerV2")[0].match(/disclose\(/g)).toHaveLength(2);
    expect(source).toContain("disclose(deploymentRegistryContext)");
    expect(source).toContain("disclose(authorityControlV2(deploymentRegistryContext,secret))");
    expect(source.match(/export sealed ledger/g)).toHaveLength(2);
    expect(source.match(/export (?:pure )?circuit/g)).toHaveLength(3);
    const metadata=JSON.parse(readFileSync("contracts/managed/just-proof/compiler/contract-info.json","utf8"));
    expect(metadata["compiler-version"]).toBe("0.31.1");expect(metadata.circuits.map((c:{name:string})=>c.name)).toEqual(["registerIssuerV2","registerCredentialV2","revokeCredentialV2"]);
  });
});
import { domain } from "../support/v2-reference.js";
function syntheticDomain(){return domain("REGISTRY_AUTHORITY_CONTROL");}
