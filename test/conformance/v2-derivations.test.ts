import { describe, it, expect } from "vitest";
import * as rt from "@midnight-ntwrk/compact-runtime";
import { pureCircuits as c } from "../fixtures/managed/phase2-primitives/contract/index.js";
import { schemas as s, hex, domain } from "../support/v2-reference.js";
import { derivations, fixture } from "../support/v2-vectors.js";

// Same-shape scalar mutations of PUBLIC SYNTHETIC input only. No live secret fixture.
function mutations<T>(input:T):{path:string;value:T}[] {
  function walk(value:unknown):{path:string;value:unknown}[] {
    if(value instanceof Uint8Array) { const changed=Uint8Array.from(value);changed[0]^=1;return [{path:"bytes",value:changed}]; }
    if(typeof value==="bigint") return [{path:"uint",value:value^1n}];
    if(value && typeof value==="object") return Object.entries(value).flatMap(([key,v])=>walk(v).map(m=>({path:`${key}.${m.path}`,value:{...value,[key]:m.value}})));
    return [];
  }
  return walk(input).map(m=>({path:m.path,value:m.value as T}));
}
function check<T extends {domain:Uint8Array}>(name:string,schema:rt.CompactType<T> & {fieldOrder:(keyof T)[]},input:T,generated:(value:T,opening?:Uint8Array)=>Uint8Array,opening?:Uint8Array) {
  const hash=(v:T,o=opening)=>o?rt.persistentCommit(schema,v,o):rt.persistentHash(schema,v);
  const compute=(v:T,o=opening)=>o ? generated(v,o) : generated(v);
  describe(name,()=>{
    it("agrees with generated typed hashing and alignment round trip",()=>{
      expect(hex(compute(input))).toBe(hex(hash(input)));
      expect(schema.fromValue(schema.toValue(input))).toEqual(input);
    });
    it.each(mutations(input))("binds every typed scalar: $path",({value})=>{
      expect(hex(compute(value))).toBe(hex(hash(value)));
      expect(hex(compute(value))).not.toBe(hex(hash(input)));
    });
    it("rejects a differently ordered reference preimage by hash disagreement",()=>{
      const reversed:rt.CompactType<T>={
        alignment:()=>schema.alignment().slice().reverse(),
        toValue:v=>schema.toValue(v).slice().reverse(),
        fromValue:()=>{throw new Error("negative descriptor only");},
      };
      const wrong=opening?rt.persistentCommit(reversed,input,opening):rt.persistentHash(reversed,input);
      expect(hex(wrong)).not.toBe(hex(compute(input)));
    });
    if(opening) it("binds independent commitment opening and does not equal a plain hash",()=>{
      const changed=fixture("changed-opening");
      expect(hex(generated(input,changed))).toBe(hex(hash(input,changed)));
      expect(hex(generated(input,changed))).not.toBe(hex(hash(input)));
      expect(hex(generated(input,opening))).not.toBe(hex(rt.persistentHash(schema,input)));
    });
  });
}
const d=derivations();
check("authority",s.RegistryAuthorityControlInputV2,d.authorityInput,c.raw_RegistryAuthorityControlInputV2);
check("issuer control",s.IssuerControlInputV2,d.issuerControlInput,c.raw_IssuerControlInputV2);
check("issuer ID",s.IssuerIdInputV2,d.issuerIdInput,c.raw_IssuerIdInputV2);
check("issuer leaf",s.IssuerLeafInputV2,d.issuerLeafInput,c.raw_IssuerLeafInputV2);
check("credential ID",s.CredentialIdInputV2,d.credentialIdInput,c.raw_CredentialIdInputV2);
check("subject commitment",s.SubjectCommitmentValueV2,d.subjectInput,(v,o)=>c.raw_SubjectCommitmentValueV2(v,o!),d.f.subject);
check("credential commitment",s.CredentialCommitmentValueV2,d.credentialInput,(v,o)=>c.raw_CredentialCommitmentValueV2(v,o!),d.f.opening);
check("credential leaf",s.CredentialLeafInputV2,d.leafInput,c.raw_CredentialLeafInputV2);
check("registration nullifier",s.CredentialRegistrationNullifierInputV2,d.nullifierInput,c.raw_CredentialRegistrationNullifierInputV2);
check("revoked leaf",s.RevokedCredentialLeafInputV2,d.revokedInput,c.raw_RevokedCredentialLeafInputV2);
check("request digest",s.QualificationRequestDigestInputV2,{domain:domain("PROOF_REQUEST"),request:d.request},c.raw_QualificationRequestDigestInputV2);
check("state digest",s.QualificationVerificationStateDigestInputV2,{domain:domain("PROOF_STATE"),state:d.state},c.raw_QualificationVerificationStateDigestInputV2);
check("issuer empty",s.IssuerEmptyLeafInputV2,{domain:domain("ISSUER_EMPTY"),protocolVersion:2n},c.raw_IssuerEmptyLeafInputV2);
check("credential empty",s.CredentialEmptyLeafInputV2,{domain:domain("CREDENTIAL_EMPTY"),protocolVersion:2n},c.raw_CredentialEmptyLeafInputV2);
check("not revoked",s.RevocationNotRevokedLeafInputV2,{domain:domain("REVOCATION_NOT_REVOKED"),protocolVersion:2n},c.raw_RevocationNotRevokedLeafInputV2);
for(const tree of ["ISSUER_MERKLE_NODE","CREDENTIAL_MERKLE_NODE","REVOCATION_MERKLE_NODE"] as const) {
  check(tree,s.MerkleNodeInputV2,{domain:domain(tree),protocolVersion:2n,left:fixture("left"),right:fixture("right")},c.raw_MerkleNodeInputV2);
}
it("canonical helpers independently assemble the complete credential derivation chain",()=>{
  const control=c.diagnose_issuerControlV2(d.f.context,d.f.issuer);
  const issuerId=c.diagnose_issuerIdV2(d.f.context,control);
  const id=c.diagnose_credentialIdV2(issuerId,d.f.nonce);
  const subject=c.diagnose_subjectCommitmentV2(id,d.f.subject);
  const statement={...d.credentialInput.statement,issuerId,credentialId:id,subjectCommitment:subject};
  const commitment=c.diagnose_credentialCommitmentV2(statement,d.f.opening);
  expect(hex(c.diagnose_authorityControlV2(d.f.context,d.f.authority))).toBe(hex(rt.persistentHash(s.RegistryAuthorityControlInputV2,d.authorityInput)));
  expect(hex(control)).toBe(hex(d.record.issuerControlCommitment));
  expect(hex(c.diagnose_issuerLeafV2({protocolVersion:2n,issuerId,issuerControlCommitment:control}))).toBe(hex(rt.persistentHash(s.IssuerLeafInputV2,d.issuerLeafInput)));
  expect(hex(c.diagnose_credentialLeafV2(id,commitment))).toBe(hex(rt.persistentHash(s.CredentialLeafInputV2,d.leafInput)));
  expect(hex(c.diagnose_registrationNullifierV2(d.f.address,d.f.context,id))).toBe(hex(rt.persistentHash(s.CredentialRegistrationNullifierInputV2,d.nullifierInput)));
  expect(hex(c.diagnose_revokedLeafV2(id,commitment))).toBe(hex(rt.persistentHash(s.RevokedCredentialLeafInputV2,d.revokedInput)));
  expect(hex(c.diagnose_revokedLeafV2(fixture("other-id"),commitment))).not.toBe(hex(c.diagnose_revokedLeafV2(id,commitment)));
});
