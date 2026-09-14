/** Synthetic conformance/reference code, NOT an authorization service.
 * Separately assembled descriptors; shares pinned Compact runtime hashing/serialization.
 */
import { createHash } from "node:crypto";
import * as rt from "@midnight-ntwrk/compact-runtime";
import type * as T from "../fixtures/managed/phase2-primitives/contract/index.js";

export const hex = (value: Uint8Array): string => Buffer.from(value).toString("hex");
export const bytes = (value: string): Uint8Array => {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("expected canonical Bytes<32> hex");
  return Uint8Array.from(Buffer.from(value, "hex"));
};
export const labels = {
  REGISTRY_AUTHORITY_CONTROL: "JP:REGISTRY-AUTHORITY:CONTROL-COMMITMENT:V2",
  ISSUER_CONTROL: "JP:ISSUER:CONTROL-COMMITMENT:V2",
  ISSUER_ID: "JP:ISSUER:ID:V2",
  ISSUER_LEAF: "JP:ISSUER:LEAF:V2",
  CREDENTIAL_ID: "JP:CREDENTIAL:ID:V2",
  SUBJECT_COMMITMENT: "JP:SUBJECT:COMMITMENT:V2",
  CREDENTIAL_COMMITMENT: "JP:CREDENTIAL:COMMITMENT:V2",
  CREDENTIAL_LEAF: "JP:CREDENTIAL:LEAF:V2",
  CREDENTIAL_REGISTRATION_NULLIFIER: "JP:CREDENTIAL:REGISTRATION-NULLIFIER:V2",
  ISSUER_EMPTY: "JP:ISSUER:EMPTY:V2",
  CREDENTIAL_EMPTY: "JP:CREDENTIAL:EMPTY:V2",
  REVOCATION_NOT_REVOKED: "JP:REVOCATION:NOT-REVOKED:V2",
  REVOCATION_REVOKED: "JP:REVOCATION:REVOKED:V2",
  ISSUER_MERKLE_NODE: "JP:ISSUER:MERKLE:NODE:V2",
  CREDENTIAL_MERKLE_NODE: "JP:CREDENTIAL:MERKLE:NODE:V2",
  REVOCATION_MERKLE_NODE: "JP:REVOCATION:MERKLE:NODE:V2",
  PROOF_REQUEST: "JP:PROOF:REQUEST:V2",
  PROOF_STATE: "JP:PROOF:STATE:V2",
} as const;
export type Domain = keyof typeof labels;
export const domain = (name: Domain): Uint8Array => Uint8Array.from(createHash("sha256").update(labels[name], "utf8").digest());
export const qualification = Uint8Array.from(createHash("sha256").update("JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1", "utf8").digest());
export const b32 = new rt.CompactTypeBytes(32);
export const u8 = new rt.CompactTypeUnsignedInteger(255n, 1);
export const u16 = new rt.CompactTypeUnsignedInteger(65535n, 2);
export const u32 = new rt.CompactTypeUnsignedInteger(4294967295n, 4);
export const u64 = new rt.CompactTypeUnsignedInteger(18446744073709551615n, 8);

// Delegate each field to the pinned descriptor, in explicit normative declaration order.
// This is not an invented byte serializer or an independent cryptographic implementation.
export function record<T extends object>(fields: { [K in keyof T]: rt.CompactType<T[K]> }): rt.CompactType<T> & { fieldOrder: (keyof T)[] } {
  const names = Object.keys(fields) as (keyof T)[];
  return {
    fieldOrder: names,
    alignment: () => names.flatMap((name) => fields[name].alignment()),
    toValue: (value) => names.flatMap((name) => fields[name].toValue(value[name])),
    fromValue: (value) => {
      const result: Partial<T> = {};
      for (const name of names) result[name] = fields[name].fromValue(value);
      // Every required field was decoded above by its runtime descriptor.
      return result as T;
    },
  };
}
export const addressType = record<{ bytes: Uint8Array }>({ bytes: b32 });
export const issuerRecord = record<T.IssuerRecordV2>({ protocolVersion: u16, issuerId: b32, issuerControlCommitment: b32 });
export const statementType = record<T.CredentialStatementV2>({
  protocolVersion: u16, credentialId: b32, issuerId: b32, subjectCommitment: b32,
  qualificationType: b32, qualificationVersion: u16, issuedAt: u64, expiresAt: u64,
});
export const requestType = record<T.QualificationRequestV2>({
  protocolVersion: u16, proofType: u8, registryContract: addressType, registryContext: b32,
  qualificationType: b32, qualificationVersion: u16, verifierContext: b32, challenge: b32,
  requestIssuedAt: u64, requestExpiresAt: u64,
});
export const stateType = record<T.QualificationVerificationStateV2>({
  protocolVersion: u16, registryContract: addressType, registryContext: b32, issuerRoot: b32,
  nextIssuerIndex: u32, credentialRoot: b32, nextCredentialIndex: u32, revocationRoot: b32,
});
export const schemas = {
  RegistryAuthorityControlInputV2: record<T.RegistryAuthorityControlInputV2>({ domain: b32, protocolVersion: u16, registryContext: b32, registryAuthoritySecret: b32 }),
  IssuerControlInputV2: record<T.IssuerControlInputV2>({ domain: b32, protocolVersion: u16, registryContext: b32, issuerSecret: b32 }),
  IssuerIdInputV2: record<T.IssuerIdInputV2>({ domain: b32, protocolVersion: u16, registryContext: b32, issuerControlCommitment: b32 }),
  IssuerLeafInputV2: record<T.IssuerLeafInputV2>({ domain: b32, record: issuerRecord }),
  CredentialIdInputV2: record<T.CredentialIdInputV2>({ domain: b32, protocolVersion: u16, issuerId: b32, issuanceNonce: b32 }),
  SubjectCommitmentValueV2: record<T.SubjectCommitmentValueV2>({ domain: b32, protocolVersion: u16, credentialId: b32 }),
  CredentialCommitmentValueV2: record<T.CredentialCommitmentValueV2>({ domain: b32, statement: statementType }),
  CredentialLeafInputV2: record<T.CredentialLeafInputV2>({ domain: b32, protocolVersion: u16, credentialId: b32, credentialCommitment: b32 }),
  CredentialRegistrationNullifierInputV2: record<T.CredentialRegistrationNullifierInputV2>({ domain: b32, protocolVersion: u16, registryContract: addressType, registryContext: b32, credentialId: b32 }),
  IssuerEmptyLeafInputV2: record<T.IssuerEmptyLeafInputV2>({ domain: b32, protocolVersion: u16 }),
  CredentialEmptyLeafInputV2: record<T.CredentialEmptyLeafInputV2>({ domain: b32, protocolVersion: u16 }),
  RevocationNotRevokedLeafInputV2: record<T.RevocationNotRevokedLeafInputV2>({ domain: b32, protocolVersion: u16 }),
  RevokedCredentialLeafInputV2: record<T.RevokedCredentialLeafInputV2>({ domain: b32, protocolVersion: u16, credentialId: b32, credentialCommitment: b32 }),
  MerkleNodeInputV2: record<T.MerkleNodeInputV2>({ domain: b32, protocolVersion: u16, left: b32, right: b32 }),
  QualificationRequestDigestInputV2: record<T.QualificationRequestDigestInputV2>({ domain: b32, request: requestType }),
  QualificationVerificationStateDigestInputV2: record<T.QualificationVerificationStateDigestInputV2>({ domain: b32, state: stateType }),
};
export type Tree = "issuer" | "credential" | "revocation";
export const nodeDomains: Record<Tree, Domain> = { issuer: "ISSUER_MERKLE_NODE", credential: "CREDENTIAL_MERKLE_NODE", revocation: "REVOCATION_MERKLE_NODE" };
export const emptyInput = (tree: Tree) => ({ domain: domain(tree === "issuer" ? "ISSUER_EMPTY" : tree === "credential" ? "CREDENTIAL_EMPTY" : "REVOCATION_NOT_REVOKED"), protocolVersion: 2n });
export const emptyLeaf = (tree: Tree): Uint8Array => rt.persistentHash(tree === "issuer" ? schemas.IssuerEmptyLeafInputV2 : tree === "credential" ? schemas.CredentialEmptyLeafInputV2 : schemas.RevocationNotRevokedLeafInputV2, emptyInput(tree));
export const nodeInput = (tree: Tree, left: Uint8Array, right: Uint8Array) => ({ domain: domain(nodeDomains[tree]), protocolVersion: 2n, left, right });
export const node = (tree: Tree, left: Uint8Array, right: Uint8Array): Uint8Array => rt.persistentHash(schemas.MerkleNodeInputV2, nodeInput(tree,left,right));
export function emptyLevels(tree: Tree): Uint8Array[] {
  const levels = [emptyLeaf(tree)];
  for (let level = 0; level < 16; level++) levels.push(node(tree, levels[level], levels[level]));
  return levels;
}
export function rootFrom(tree: Tree, leaf: Uint8Array, index: number, siblings: readonly Uint8Array[]): Uint8Array {
  if (!Number.isInteger(index) || index < 0 || index >= 65536 || siblings.length !== 16) throw new Error("invalid reference path");
  let h = leaf;
  for (let level = 0; level < 16; level++) h = ((index >>> level) & 1) ? node(tree,siblings[level],h) : node(tree,h,siblings[level]);
  return h;
}

/** Untrusted synthetic node store. No contract authority, persistence, backend or secret custody.
 * Stores hashes only. root/counter inputs still require authoritative circuit validation.
 */
export class ReferenceTree {
  private readonly nodes = new Map<string, Uint8Array>();
  private readonly empty: Uint8Array[];
  constructor(readonly tree: Tree) { this.empty = emptyLevels(tree); }
  private get(level: number, index: number): Uint8Array { return Uint8Array.from(this.nodes.get(`${level}:${index}`) ?? this.empty[level]); }
  root(): Uint8Array { return this.get(16,0); }
  path(index: number): Uint8Array[] {
    if (!Number.isInteger(index) || index < 0 || index >= 65536) throw new Error("reference index out of range");
    return Array.from({length:16},(_,level)=>this.get(level,(index >>> level) ^ 1));
  }
  setSyntheticLeaf(index: number, leaf: Uint8Array): void {
    this.path(index);
    if (leaf.length !== 32) throw new Error("reference leaf length");
    let at = index;
    this.nodes.set(`0:${at}`,Uint8Array.from(leaf));
    for(let level=0;level<16;level++) {
      const parent = at >>> 1;
      this.nodes.set(`${level+1}:${parent}`,node(this.tree,this.get(level,parent*2),this.get(level,parent*2+1)));
      at=parent;
    }
  }
}
