# Domains and typed cryptographic derivations

**Draft — User Review Required.** All schema field orders below are normative.

## Complete 18-entry cryptographic manifest

For each literal label use raw SHA-256 of its exact UTF-8 bytes, case-sensitive, no newline, NUL, length prefix or BOM. The lowercase hexadecimal below encodes the 32 digest bytes in order: first pair is Bytes<32>[0], last pair is [31]. Never reverse bytes or parse the whole digest as an integer. Symbol X below names constant DOMAIN_X_V2. Hash validation: 18/18 matches between Python hashlib and GNU sha256sum; these are domain-label hashes, not typed Compact hashes or root vectors.

| Symbol suffix | Exact literal label | Lowercase hex | Exact typed preimage | Purpose/migration |
|---|---|---|---|---|
| `REGISTRY_AUTHORITY_CONTROL` | `JP:REGISTRY-AUTHORITY:CONTROL-COMMITMENT:V2` | `041195cccf3d2478134564cd763f85c43651d07c7162404638dc92556a96739d` | `RegistryAuthorityControlInputV2` | Authority knowledge; new |
| `ISSUER_CONTROL` | `JP:ISSUER:CONTROL-COMMITMENT:V2` | `75789ba30e63431456ef6a210602fdd264f60dae655d7e5c6fb66ebcb0ec30ae` | `IssuerControlInputV2` | Issuer knowledge; new |
| `ISSUER_ID` | `JP:ISSUER:ID:V2` | `000cff8bf7318394e234a89ec37474047e8878dd54760ea537b701080199a926` | `IssuerIdInputV2` | Context/control-based identifier; renamed semantics and rotation |
| `ISSUER_LEAF` | `JP:ISSUER:LEAF:V2` | `9e9928281d6500cb13eefc68a2016715061b7e4494d9db1dd4bb91721007d544` | `IssuerLeafInputV2` | Authenticated issuer record; rotated with changed record |
| `CREDENTIAL_ID` | `JP:CREDENTIAL:ID:V2` | `0ad6d845bc733846f7f6b3917083ba50c122cd127ba98823a7d1dfd002e69e81` | `CredentialIdInputV2` | Issuer/nonce-derived identifier; rotated |
| `SUBJECT_COMMITMENT` | `JP:SUBJECT:COMMITMENT:V2` | `8a65d117dc43d15df1382048ad7b3d15060c8577d25d5a59ebe065fe01fa0173` | `SubjectCommitmentValueV2` | Holder commitment; rotated |
| `CREDENTIAL_COMMITMENT` | `JP:CREDENTIAL:COMMITMENT:V2` | `cd625a02c4b906e325c373f2fe106761689302c59ee770b2dc86920923b68ecd` | `CredentialCommitmentValueV2` | Statement commitment; rotated |
| `CREDENTIAL_LEAF` | `JP:CREDENTIAL:LEAF:V2` | `8c6ff789c9bf4e5d48dca96ebff8513f61508a69e443bb7cfc79540406ef09f3` | `CredentialLeafInputV2` | Registered credential; rotated |
| `CREDENTIAL_REGISTRATION_NULLIFIER` | `JP:CREDENTIAL:REGISTRATION-NULLIFIER:V2` | `fe65d324a624715af14244d6c2abb9dfc251b2609c58cdca24c36730f2f60f36` | `CredentialRegistrationNullifierInputV2` | Duplicate guard; rotated |
| `ISSUER_EMPTY` | `JP:ISSUER:EMPTY:V2` | `6552a0855810a4ebcad247eba441b99ae0b7361afe3935b11ec527cf402fe8a1` | `IssuerEmptyLeafInputV2` | Empty issuer slot; rotated |
| `CREDENTIAL_EMPTY` | `JP:CREDENTIAL:EMPTY:V2` | `d83db46371879221acdd35291aa00322a17e0441e02886fef1ba78a63ec25b81` | `CredentialEmptyLeafInputV2` | Empty credential slot; rotated |
| `REVOCATION_NOT_REVOKED` | `JP:REVOCATION:NOT-REVOKED:V2` | `44955b7e44458ef89d309b54a4f08c6663f5ecc6da9c150157650baca95f6f24` | `RevocationNotRevokedLeafInputV2` | V1 REVOCATION:EMPTY renamed and rotated |
| `REVOCATION_REVOKED` | `JP:REVOCATION:REVOKED:V2` | `69709dbf8aeb6534ec5580e86aa330e512f7358e9c733b80d60786d777fc76db` | `RevokedCredentialLeafInputV2` | Credential-bound revoked leaf; rotated |
| `ISSUER_MERKLE_NODE` | `JP:ISSUER:MERKLE:NODE:V2` | `31adbe635d437cf017ce4e0dd97275791a12312326ca4f250ec59188959c9ae4` | `MerkleNodeInputV2` | Issuer node; shared V1 node split/renamed and rotated |
| `CREDENTIAL_MERKLE_NODE` | `JP:CREDENTIAL:MERKLE:NODE:V2` | `c79013b6526d61308d38da060db894afb9ba87f08f6ae57a57f451dff63bfb91` | `MerkleNodeInputV2` | Credential node; shared V1 node split/renamed and rotated |
| `REVOCATION_MERKLE_NODE` | `JP:REVOCATION:MERKLE:NODE:V2` | `09785f97ac0de3e1c013ea0eaef955f9e8a74b4f14c4cb78efd31446862a3bea` | `MerkleNodeInputV2` | Revocation node; shared V1 node split/renamed and rotated |
| `PROOF_REQUEST` | `JP:PROOF:REQUEST:V2` | `6be08866846f0221d03a53174ed029012413faf9db98009296a9dcb64503d071` | `QualificationRequestDigestInputV2` | Complete ten-field request; rotated |
| `PROOF_STATE` | `JP:PROOF:STATE:V2` | `3be3e3097e1ceecad2e7ecc590e556bb34806abe06ad79f136abe713a04e2eb2` | `QualificationVerificationStateDigestInputV2` | Current-state binding; rotated |

The qualification schema identifier is separately retained at V1 and is **not** a nineteenth V2 cryptographic domain. V1 consolidated §9 lists 18 domains: 4 signature domains removed, 13 other domains rotated/renamed, shared node replaced by 3 tree domains, and 2 control domains added: 18−4−1+3+2=18. The issuer-ID formula changes semantics (key→context/control), issuer leaf embeds the changed record, request adds issuance time; these are not byte-only rotations. Every old consolidated domain is covered by this table or the four removals in [00](00-decisions.md). V1 REVOCATION:EMPTY maps to V2 REVOCATION:NOT-REVOKED. V1 MERKLE:NODE maps to the three named node domains. Obsolete proposal spellings such as JP:CREDENTIAL:V1:MERKLE:LEAF, JP:CREDENTIAL:V1:MERKLE:NODE, JP:CREDENTIAL:V1:PROOF, JP:CREDENTIAL:V1:PROOF:REQUEST and JP:CREDENTIAL:V1:PROOF:NULLIFIER are not accepted aliases; no presentation-nullifier domain exists.

## Primitive distinction

Use CompactStandardLibrary persistentHash<T> for typed persistent identifiers, control hashes, leaves, nodes, nullifiers and digests. Use persistentCommit<T>(value, opening) for the two hiding commitments. Raw SHA-256 only derives the static constants above. Do not substitute raw concatenation, JSON hashing, transientHash, a library's generic Merkle hash, or hand-guessed serialization. Do not describe persistentHash as Poseidon. The pinned Compact runtime's typed descriptors and compiler-generated representation determine encoding; struct names alone are not cryptographic tags, hence explicit domain fields are mandatory.

## Additional exact preimage schemas

Authority, issuer-control, issuer-ID and issuer-leaf schemas are in [02](02-issuer-registry.md); their field sequences are incorporated here. Tree/empty schemas are in [06](06-merkle-tree.md), revoked leaf in [04](04-revocation.md), request/state wrappers in [08](08-proofs.md).

```text
CredentialIdInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  issuerId: Bytes<32>
  issuanceNonce: Bytes<32>
}
SubjectCommitmentValueV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  credentialId: Bytes<32>
}
CredentialCommitmentValueV2 {
  domain: Bytes<32>
  statement: CredentialStatementV2
}
CredentialLeafInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  credentialId: Bytes<32>
  credentialCommitment: Bytes<32>
}
CredentialRegistrationNullifierInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  registryContract: ContractAddress
  registryContext: Bytes<32>
  credentialId: Bytes<32>
}
```

## Complete formulas

In this table H<T>=persistentHash<T>, C<T>=persistentCommit<T>; braces list populated fields **in schema order**. D_X is the manifest constant for X, v=2, context=sealed registryContext, address=kernel.self(). The constructor alone uses its checked deployment context before sealing it. No witness supplies a domain or version constant as authority.

| Derived value | Exact typed construction |
|---|---|
| authority control | H<RegistryAuthorityControlInputV2>({D_REGISTRY_AUTHORITY_CONTROL, v, context, registryAuthoritySecret}) |
| issuer control | H<IssuerControlInputV2>({D_ISSUER_CONTROL, v, context, issuerSecret}) |
| issuerId | H<IssuerIdInputV2>({D_ISSUER_ID, v, context, issuerControlCommitment}) |
| issuerLeaf | H<IssuerLeafInputV2>({D_ISSUER_LEAF, IssuerRecordV2{v,issuerId,issuerControlCommitment}}) |
| credentialId | H<CredentialIdInputV2>({D_CREDENTIAL_ID, v, issuerId, issuanceNonce}) |
| subjectCommitment | C<SubjectCommitmentValueV2>({D_SUBJECT_COMMITMENT, v, credentialId}, subjectSecret) |
| credentialCommitment | C<CredentialCommitmentValueV2>({D_CREDENTIAL_COMMITMENT, statement}, credentialOpening) |
| credentialLeaf | H<CredentialLeafInputV2>({D_CREDENTIAL_LEAF, v, credentialId, credentialCommitment}) |
| registrationNullifier | H<CredentialRegistrationNullifierInputV2>({D_CREDENTIAL_REGISTRATION_NULLIFIER, v, address, context, credentialId}) |
| issuerEmptyLeaf | H<IssuerEmptyLeafInputV2>({D_ISSUER_EMPTY,v}) |
| credentialEmptyLeaf | H<CredentialEmptyLeafInputV2>({D_CREDENTIAL_EMPTY,v}) |
| notRevokedLeaf | H<RevocationNotRevokedLeafInputV2>({D_REVOCATION_NOT_REVOKED,v}) |
| revokedLeaf | H<RevokedCredentialLeafInputV2>({D_REVOCATION_REVOKED,v,credentialId,credentialCommitment}) |
| issuer/credential/revocation node | H<MerkleNodeInputV2>({respective D_TREE_MERKLE_NODE,v,left,right}) |
| requestDigestV2 | H<QualificationRequestDigestInputV2>({D_PROOF_REQUEST,complete ten-field request}) |
| stateDigestV2 | H<QualificationVerificationStateDigestInputV2>({D_PROOF_STATE,current eight-field state}) |

Credential ID inherits deployment-context binding through canonical issuerId; nullifier additionally binds contract address and context directly. Subject commitment binds credential ID; credential commitment binds the entire ordered statement, including the subject commitment and private timestamps. Registration authenticates an issuer-supplied subject commitment without requiring its opening. Presentation rederives that opening relation. Registration nullifier is a public duplicate guard, never a proof identifier or public presentation nullifier.

All secret/opening inputs are nonzero independent random 32-byte values; a circuit checks only values it receives. Opening reuse, entropy quality and global independence require off-chain discipline. Control hashes rely on high-entropy secrets, not low-entropy passwords. If compiler privacy tracking requires disclosure for public control state, wrap only the final hash. Intermediate private values remain private; hashing does not require disclosing its inputs.

