import { createHash } from "node:crypto";
import * as rt from "@midnight-ntwrk/compact-runtime";
import { pureCircuits as compiled } from "../fixtures/managed/phase2-primitives/contract/index.js";
import { domain, labels, qualification, schemas as s, hex, emptyInput, emptyLeaf, nodeInput, node, ReferenceTree, type Tree } from "./v2-reference.js";

// Published synthetic fixtures only. NEVER use these values as live secrets/openings.
export const fixture = (name: string): Uint8Array => Uint8Array.from(createHash("sha256").update(`JUSTPROOF-PHASE2-PUBLIC-SYNTHETIC:${name}`).digest());
export function syntheticInputs() {
  return {
    context: fixture("context"), address: {bytes:fixture("contract-address")}, authority: fixture("authority"), issuer: fixture("issuer"),
    subject: fixture("subject-opening"), opening: fixture("credential-opening"), nonce: fixture("issuance-nonce"),
  };
}
export function derivations() {
  const f=syntheticInputs();
  const authorityInput={domain:domain("REGISTRY_AUTHORITY_CONTROL"),protocolVersion:2n,registryContext:f.context,registryAuthoritySecret:f.authority};
  const issuerControlInput={domain:domain("ISSUER_CONTROL"),protocolVersion:2n,registryContext:f.context,issuerSecret:f.issuer};
  const issuerControl=rt.persistentHash(s.IssuerControlInputV2,issuerControlInput);
  const issuerIdInput={domain:domain("ISSUER_ID"),protocolVersion:2n,registryContext:f.context,issuerControlCommitment:issuerControl};
  const issuerId=rt.persistentHash(s.IssuerIdInputV2,issuerIdInput);
  const record={protocolVersion:2n,issuerId,issuerControlCommitment:issuerControl};
  const issuerLeafInput={domain:domain("ISSUER_LEAF"),record};
  const credentialIdInput={domain:domain("CREDENTIAL_ID"),protocolVersion:2n,issuerId,issuanceNonce:f.nonce};
  const credentialId=rt.persistentHash(s.CredentialIdInputV2,credentialIdInput);
  const subjectInput={domain:domain("SUBJECT_COMMITMENT"),protocolVersion:2n,credentialId};
  const subjectCommitment=rt.persistentCommit(s.SubjectCommitmentValueV2,subjectInput,f.subject);
  const statement={protocolVersion:2n,credentialId,issuerId,subjectCommitment,qualificationType:qualification,qualificationVersion:1n,issuedAt:1700000000n,expiresAt:1800000000n};
  const credentialInput={domain:domain("CREDENTIAL_COMMITMENT"),statement};
  const credentialCommitment=rt.persistentCommit(s.CredentialCommitmentValueV2,credentialInput,f.opening);
  const leafInput={domain:domain("CREDENTIAL_LEAF"),protocolVersion:2n,credentialId,credentialCommitment};
  const nullifierInput={domain:domain("CREDENTIAL_REGISTRATION_NULLIFIER"),protocolVersion:2n,registryContract:f.address,registryContext:f.context,credentialId};
  const revokedInput={domain:domain("REVOCATION_REVOKED"),protocolVersion:2n,credentialId,credentialCommitment};
  const request={protocolVersion:2n,proofType:1n,registryContract:f.address,registryContext:f.context,qualificationType:qualification,qualificationVersion:1n,verifierContext:fixture("verifier"),challenge:fixture("challenge"),requestIssuedAt:1750000000n,requestExpiresAt:1750000900n};
  const state={protocolVersion:2n,registryContract:f.address,registryContext:f.context,issuerRoot:fixture("issuer-state-root"),nextIssuerIndex:1n,credentialRoot:fixture("credential-state-root"),nextCredentialIndex:2n,revocationRoot:fixture("revocation-state-root")};
  return {f,authorityInput,issuerControlInput,issuerIdInput,record,issuerLeafInput,credentialIdInput,subjectInput,credentialInput,leafInput,nullifierInput,revokedInput,request,state};
}
export function buildVectors() {
  const d=derivations();
  const entries: object[]=[];
  function entry<T>(name:string, descriptor:rt.CompactType<T> & {fieldOrder:(keyof T)[]}, value:T, generated:Uint8Array, opening?:Uint8Array) {
    const reference=opening ? rt.persistentCommit(descriptor,value,opening) : rt.persistentHash(descriptor,value);
    if(hex(reference)!==hex(generated)) throw new Error(`cross-path mismatch: ${name}`);
    entries.push({name,fieldOrder:descriptor.fieldOrder,input:value,...(opening?{syntheticOpening:opening}:{}),alignment:descriptor.alignment(),alignedValue:descriptor.toValue(value),reference,generated});
  }
  entry("RegistryAuthorityControlInputV2",s.RegistryAuthorityControlInputV2,d.authorityInput,compiled.raw_RegistryAuthorityControlInputV2(d.authorityInput));
  entry("IssuerControlInputV2",s.IssuerControlInputV2,d.issuerControlInput,compiled.raw_IssuerControlInputV2(d.issuerControlInput));
  entry("IssuerIdInputV2",s.IssuerIdInputV2,d.issuerIdInput,compiled.raw_IssuerIdInputV2(d.issuerIdInput));
  entry("IssuerLeafInputV2",s.IssuerLeafInputV2,d.issuerLeafInput,compiled.raw_IssuerLeafInputV2(d.issuerLeafInput));
  entry("CredentialIdInputV2",s.CredentialIdInputV2,d.credentialIdInput,compiled.raw_CredentialIdInputV2(d.credentialIdInput));
  entry("SubjectCommitmentValueV2",s.SubjectCommitmentValueV2,d.subjectInput,compiled.raw_SubjectCommitmentValueV2(d.subjectInput,d.f.subject),d.f.subject);
  entry("CredentialCommitmentValueV2",s.CredentialCommitmentValueV2,d.credentialInput,compiled.raw_CredentialCommitmentValueV2(d.credentialInput,d.f.opening),d.f.opening);
  entry("CredentialLeafInputV2",s.CredentialLeafInputV2,d.leafInput,compiled.raw_CredentialLeafInputV2(d.leafInput));
  entry("CredentialRegistrationNullifierInputV2",s.CredentialRegistrationNullifierInputV2,d.nullifierInput,compiled.raw_CredentialRegistrationNullifierInputV2(d.nullifierInput));
  entry("RevokedCredentialLeafInputV2",s.RevokedCredentialLeafInputV2,d.revokedInput,compiled.raw_RevokedCredentialLeafInputV2(d.revokedInput));
  entry("QualificationRequestDigestInputV2",s.QualificationRequestDigestInputV2,{domain:domain("PROOF_REQUEST"),request:d.request},compiled.diagnose_requestDigestV2(d.request));
  entry("QualificationVerificationStateDigestInputV2",s.QualificationVerificationStateDigestInputV2,{domain:domain("PROOF_STATE"),state:d.state},compiled.diagnose_stateDigestV2(d.state));
  const trees=(["issuer","credential","revocation"] as const).map((tree:Tree)=>{
    let reference=emptyLeaf(tree);
    let generated=tree==="issuer"?compiled.diagnose_issuerEmptyV2():tree==="credential"?compiled.diagnose_credentialEmptyV2():compiled.diagnose_notRevokedV2();
    if(hex(reference)!==hex(generated)) throw new Error("empty leaf mismatch");
    const emptySchema=tree==="issuer"?s.IssuerEmptyLeafInputV2:tree==="credential"?s.CredentialEmptyLeafInputV2:s.RevocationNotRevokedLeafInputV2;
    const emptyType=tree==="issuer"?"IssuerEmptyLeafInputV2":tree==="credential"?"CredentialEmptyLeafInputV2":"RevocationNotRevokedLeafInputV2";
    entry(emptyType,emptySchema,emptyInput(tree),generated);
    const levels:object[]=[{level:0,type:emptyType,fieldOrder:emptySchema.fieldOrder,input:emptyInput(tree),reference,generated}];
    for(let level=1;level<=16;level++) {
      const input=nodeInput(tree,reference,reference);
      const generatedInput=nodeInput(tree,generated,generated);
      reference=node(tree,reference,reference);
      generated=compiled.diagnose_nodeV2(generatedInput.domain,generatedInput.left,generatedInput.right);
      if(hex(reference)!==hex(generated)) throw new Error("empty root mismatch");
      levels.push({level,type:"MerkleNodeInputV2",fieldOrder:s.MerkleNodeInputV2.fieldOrder,input,generatedInput,reference,generated});
    }
    const store=new ReferenceTree(tree);
    const boundaryPaths=[0,1,32767,32768,65535].map(index=>({index,directions:compiled.bits(BigInt(index)),siblings:store.path(index),root:reference}));
    for(const index of [0,1,32767,32768,65535]) store.setSyntheticLeaf(index,fixture(`boundary-leaf-${index}`));
    const populatedBoundaryPaths=[0,1,32767,32768,65535].map(index=>{
      const leaf=fixture(`boundary-leaf-${index}`),siblings=store.path(index);
      const calculated=compiled.root(nodeInput(tree,leaf,leaf).domain,leaf,BigInt(index),siblings);
      if(hex(calculated)!==hex(store.root())) throw new Error("populated boundary mismatch");
      return {index,leaf,siblings,referenceRoot:store.root(),generatedRoot:calculated};
    });
    const nonEmptyNodes=nodeInput(tree,fixture("left"),fixture("right"));
    entry(`${tree}:MerkleNodeInputV2`,s.MerkleNodeInputV2,nonEmptyNodes,compiled.diagnose_nodeV2(nonEmptyNodes.domain,nonEmptyNodes.left,nonEmptyNodes.right));
    return {tree,emptyLeafInput:emptyInput(tree),levels,candidateRoot:reference,boundaryPaths,populatedBoundaryPaths};
  });
  return {status:"CANDIDATE — USER REVIEW REQUIRED; SYNTHETIC INPUTS ONLY",trust:"Separately assembled paths share Compact runtime hashing and serialization; not independent cryptographic implementations.",
    domains:Object.entries(labels).map(([name,label])=>({name,label,hex:hex(createHash("sha256").update(label,"utf8").digest())})),
    qualificationIdentifier:hex(qualification),derivations:entries,trees,fullCounter:"65536",
    publicOutput:{requestDigest:compiled.diagnose_requestDigestV2(d.request),stateDigest:compiled.diagnose_stateDigestV2(d.state)}};
}
export function serializeVectors(value:unknown):string {
  // Buffer's toJSON would otherwise run before a JSON replacer; recurse first.
  function convert(x:unknown):unknown {
    if(x instanceof Uint8Array) return hex(x);
    if(typeof x==="bigint") return x.toString();
    if(Array.isArray(x)) return x.map(convert);
    if(x && typeof x==="object") return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,convert(v)]));
    return x;
  }
  return JSON.stringify(convert(value),null,2)+"\n";
}
