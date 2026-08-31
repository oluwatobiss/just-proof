# JustProof V1 Consolidated Protocol Specification

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document consolidates the frozen JustProof V1 protocol into one implementation and conformance target.

JustProof V1 allows a holder to prove possession of one currently valid private demonstration credential for the fixed JustProof Midnight Builder qualification without revealing the credential, holder secret, credential identifier, issuer, signature, commitments, Merkle indices, or authentication paths.

The protocol supports exactly four lifecycle operations:

1. issuer registration
2. credential registration
3. credential revocation; and
4. current request-specific qualification proof

This document integrates the component specifications. It does not replace their exact cryptographic, state-transition, witness, proof, or verifier definitions.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly states otherwise.

A displayed UTF-8 label defines a human-readable preimage for a fixed `Bytes<32>` constant. The label itself MUST NOT be passed where the fixed byte value is required.

## 3. Normative Document Set

The frozen JustProof V1 protocol consists of:

| Document | Normative ownership |
| --- | --- |
| `01-credential.md` | Credential statement, construction, issuer signature, temporal semantics, and private package |
| `02-issuer-registry.md` | Issuer identity, registry authority, issuer tree, registration, and membership |
| `03-commitments.md` | Subject and credential commitment constructions, openings, and security requirements |
| `04-revocation.md` | Revocation authority, leaf transition, same-index semantics, and current non-revocation |
| `05-ledgers.md` | Complete ledger schema, constructor, write isolation, and current-state rules |
| `06-merkle-tree.md` | Credential tree, shared paths and nodes, indices, insertion, and current membership |
| `07-witnesses.md` | Exact private semantic records, private-state sourcing, and witness boundaries |
| `08-proofs.md` | Qualification request, state snapshot, output, circuit statement, and proof artifact |
| `09-verification.md` | Verifier configuration, challenge lifecycle, proof acceptance, outcomes, and communication |
| `10-specification.md` | Cross-component integration, conformance, lifecycle, and change control |

Each component specification is authoritative within its stated ownership.

This document is authoritative for how those components fit together. Repetition here is a conformance summary and MUST reproduce the owning document exactly.

If any conflict is discovered:

1. implementation MUST stop for the affected behavior
2. no developer, prover, verifier, frontend, or backend may silently select one alternative
3. the owning component document and this integration document MUST be reconciled
4. affected vectors and tests MUST be regenerated; and
5. the corrected specification set MUST be reviewed and re-frozen before implementation continues

## 4. Freeze Scope

JustProof V1 freezes:

- one protocol version, encoded as `Uint<16>` value `1`
- one proof type, encoded as `Uint<8>` value `1`
- one fixed demonstration qualification and version
- typed Compact constructions with exact field order
- `persistentHash` for persistent identifiers, leaves, nodes, messages, nullifiers, and proof digests
- `persistentCommit` with independent 32-byte openings for subject and credential commitments
- secp256k1 ECDSA for registry, issuer, credential, and revocation signatures
- immutable key-derived issuer identities
- a permissioned append-only issuer registry
- an append-only credential registry
- an irreversible same-index revocation tree
- three root-only depth-16 Merkle trees
- exactly nine ledger fields
- one exact private semantic witness record per lifecycle operation
- one exact public qualification request, current-state record, and two-digest output
- mandatory current issuer authorization, credential membership, non-revocation, holder control, and temporal validity
- request-specific, single-use verifier challenges
- no historical verification; and
- fail-closed verification outcomes

Any incompatible change requires a new protocol version.

## 5. Compact Implementation Baseline

The V1 contract MUST begin with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

The implementation MUST use:

- Compact language `0.23`
- Compact toolchain `0.31.0`
- Compact runtime `0.16.0`
- `persistentHash<T>` and `persistentCommit<T>`
- `Secp256k1Point`, `Secp256k1EcdsaSignature`, and `secp256k1EcdsaVerify`
- `Bytes<32>` for persistent protocol hashes and commitments
- `ContractAddress` and `kernel.self()` for deployment binding
- `blockTimeGte` and `blockTimeLt` for circuit time predicates
- generated Compact and TypeScript types; and
- generated prover, verifier, ZKIR, and runtime artifacts for the exact compiled circuits

Generated files MUST NOT be edited manually.

The generated JavaScript implementation is authoritative for typed contract-logic testing and ledger decoding. Executing that JavaScript alone does not generate or verify a proof, establish transaction finality, or establish current network state.

## 6. Threat Model

V1 assumes three primary adversaries:

| Adversary | Capability | Required defense |
| --- | --- | --- |
| Chain observer | Reads public ledger changes, circuit identity, disclosed values, and timing | Minimize public state, outputs, and credential-specific events |
| Malicious prover | Controls the frontend, private state, circuit arguments, and every witness return | Rederive and constrain every security-critical relation in-circuit |
| Off-chain operator | Sees data routed to an indexer, tree provider, verifier, backend, or proof server | Minimize routing, isolate services, protect transport, and prefer holder-controlled proving |

V1 additionally assumes:

- cryptographically secure randomness for keys, nonces, openings, secrets, contexts, and challenges
- secure issuer, registry-authority, and holder secret storage
- sound and zero-knowledge proof-system behavior
- correct Compact compiler and runtime behavior
- authenticated current contract state
- correct cross-runtime reproduction of typed constructions; and
- verifier-side atomic challenge state

Witness values are untrusted until constrained. `ownPublicKey()`, wallet identity, frontend authentication, and provider validation MUST NOT substitute for holder-control or protocol authorization checks.

## 7. Primitive Types and Fixed Parameters

| Value | Compact type or value |
| --- | --- |
| Protocol version | `Uint<16>` value `1` |
| Proof type | `Uint<8>` value `1` |
| Qualification version | `Uint<16>` value `1` |
| Timestamp or deadline | `Uint<64>` |
| Issuer or credential index | `Uint<32>` |
| Issuer or credential counter | `Uint<32>` |
| Identifier, commitment, root, leaf, sibling, challenge, context, or digest | `Bytes<32>` |
| Issuance nonce | `Bytes<32>` |
| Commitment opening or subject secret | `Bytes<32>` |
| Issuer or registry-authority verification key | `Secp256k1Point` |
| Protocol signature | `Secp256k1EcdsaSignature` |
| Registry contract | `ContractAddress` |
| Merkle path | `Vector<16, Bytes<32>>` |
| Merkle depth | `16` |
| Merkle capacity | `65,536` |
| Valid leaf indices | `0..65,535` |
| Full-tree counter sentinel | `65,536` |

Counters MUST use `Uint<32>` because `Uint<16>` cannot represent the full-tree sentinel.

All timestamps are Unix seconds. `issuedAt` is inclusive. Nonzero `expiresAt` and `requestExpiresAt` are exclusive at their respective validation boundaries.

## 8. Fixed Demonstration Qualification

V1 supports exactly:

```text
JustProof Midnight Builder Demonstration Credential
```

The qualification type is the SHA-256 digest of:

```text
JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1
```

Its exact `Bytes<32>` value is:

```text
3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7
```

The qualification version is `1`.

V1 does not support a claims map, score, grade, threshold, arbitrary attribute, holder name, issuer constraint, or dynamic qualification.

The qualification is a JustProof demonstration. It MUST NOT be presented as an official Midnight Academy credential or as evidence that JustProof represents Midnight Academy.

## 9. Consolidated Domain Registry

Every domain constant is the SHA-256 digest of the exact UTF-8 label.

| Purpose | UTF-8 label | Exact `Bytes<32>` hexadecimal |
| --- | --- | --- |
| Issuer ID | `JP:ISSUER:ID:V1` | `70b86c0aff6bc0b2a063e412ec2b436e404733c59436f1668abacec1edd031fd` |
| Issuer leaf | `JP:ISSUER:LEAF:V1` | `03c97931b086ec930ada16f1a78acf56a1b8b93b54f530cea82fdc8754c8e660` |
| Empty issuer leaf | `JP:ISSUER:EMPTY:V1` | `dd1d80d66678bf2ae0791da8a964f49968c38ac362a60419cc0e920083a7df74` |
| Issuer registration approval | `JP:ISSUER:REGISTRATION:V1` | `03e60131de45805e5768a1f48c7c889425ff4d7a14a7ba5341a88af5a07975bc` |
| Issuer proof of possession | `JP:ISSUER:POSSESSION:V1` | `cabe659040ca5f9ae918a10a2086d76f853a14bdf70ccf349060119c3e465f97` |
| Credential ID | `JP:CREDENTIAL:ID:V1` | `623c528860cfbea80c5c278171c7fee117e356b12ee5a2d8002d60522e56371b` |
| Subject commitment | `JP:SUBJECT:COMMITMENT:V1` | `d0f8ef87f028847a80da0f254686e455ee2548625ca7d6f0fc030246c12cb5b2` |
| Credential commitment | `JP:CREDENTIAL:COMMITMENT:V1` | `c1d6eaac074956c51c0cd0c751db4f42a100c8040e73c45cbe8f50fe4a34ae82` |
| Issuer signature message | `JP:CREDENTIAL:SIGNATURE:V1` | `1406fcb965bc2d002c2da6a691a39e1dcf9c2b062e75d0eeaa88f01821eb5ea6` |
| Credential leaf | `JP:CREDENTIAL:LEAF:V1` | `c34338b6aeb2fe5777695157246c9ac554ca39e8d06f19f20a9664b0dbe7b4c6` |
| Empty credential leaf | `JP:CREDENTIAL:EMPTY:V1` | `70bf51ebea524e89f95bc090768d934243226b73e4e23a0bd556973076ac8770` |
| Credential registration nullifier | `JP:CREDENTIAL:REGISTRATION-NULLIFIER:V1` | `0958ae03b94f43b8081063b1c7ec630ca774a3bead673562cf984c19454efef9` |
| Empty revocation leaf | `JP:REVOCATION:EMPTY:V1` | `ab6b939fe6f80e9b6fdf836cbd14becb49e1c743b739597ec3d89e8abfff0d66` |
| Revoked credential leaf | `JP:REVOCATION:REVOKED:V1` | `e8619ec6bc693ad50f00e5dacc6b7b32f58d343b78609c27caf3774504bf6371` |
| Revocation authorization | `JP:REVOCATION:AUTHORIZATION:V1` | `df04900884c49e6c7917d37ddb0b163fba730acce4119bd3efa9885819bb8f6a` |
| Shared Merkle node | `JP:MERKLE:NODE:V1` | `ac80b146f1c63367493a75e4184b1125ebcb768858d1cbf71d9b0adb9a171e86` |
| Qualification request digest | `JP:PROOF:REQUEST:V1` | `23a6c2cd0cb3f45e30e6e6a4f91ba1c8b8479d96d965fa49e85879f1299c30f9` |
| Verification-state digest | `JP:PROOF:STATE:V1` | `4431ba5e9ed187abe8c1358c62926c343de0fb0336d857d7c2cf3dea4e78f4ea` |

The shared Merkle-node domain MUST be identical across issuer, credential, and revocation trees.

An implementation MUST NOT reuse a domain for another purpose or substitute draft labels.

## 10. Typed Construction Rules

Every cryptographic input MUST be a fixed Compact value with exact field order.

V1 MUST NOT hash or commit:

- JSON or canonical JSON
- JavaScript object serialization
- database records
- delimiter-based strings
- concatenated displayed values
- CBOR, MessagePack, or protocol buffers
- hexadecimal text
- a PDF, image, badge, QR code, or certificate; or
- an application-selected byte encoding

in place of the normative Compact record.

Persistent identities, leaves, messages, nodes, nullifiers, and proof digests use:

```text
persistentHash<ExactType>(exactValue)
```

Hiding commitments use:

```text
persistentCommit<ExactType>(exactValue, independentOpening)
```

Every construction MUST have Compact/TypeScript cross-runtime vectors. Generated Compact-compatible helpers or the generated runtime representation MUST be used; an application MUST NOT infer serialization from sample hashes.

## 11. Deployment Configuration and Constructor

The constructor accepts exactly:

```text
constructor(
    authorityVerificationKey: Secp256k1Point,
    deploymentRegistryContext: Bytes<32>
)
```

The authority key and registry context MUST be nondefault. `deploymentRegistryContext` MUST be a fresh CSPRNG-generated 32-byte value and MUST NOT be reused across deployments.

The constructor MUST:

1. intentionally disclose and seal the authority verification key and registry context
2. initialize the issuer, credential, and revocation roots from their canonical empty leaves
3. initialize both counters to `0`
4. leave both duplicate sets empty; and
5. accept no initial issuer, credential, revocation, root, counter, administrator, or mutable configuration

The registry-authority key is distinct from every issuer key. It authorizes issuer registration only. It does not issue credentials or revoke credentials.

The V1 registry authority and registry context are immutable. Registry-authority rotation, recovery, delegation, threshold governance, and generic administration are outside V1.

The Midnight contract maintenance authority is a separate deployment mechanism. It MUST NOT be confused with the JustProof registry authority or treated as a protocol credential issuer.

## 12. Exact Ledger Schema

The complete V1 ledger schema is:

```compact
export sealed ledger registryAuthorityVerificationKey: Secp256k1Point;
export sealed ledger registryContext: Bytes<32>;

export ledger issuerRoot: Bytes<32>;
export ledger nextIssuerIndex: Uint<32>;
export ledger registeredIssuerLeaves: Set<Bytes<32>>;

export ledger credentialRoot: Bytes<32>;
export ledger nextCredentialIndex: Uint<32>;
export ledger registeredCredentialNullifiers: Set<Bytes<32>>;

export ledger revocationRoot: Bytes<32>;
```

No additional V1 ledger field may represent:

- issuer status, suspension, deletion, or key history
- credential statements, IDs, commitments, signatures, indices, timestamps, or metadata
- revocation timestamps, reasons, counters, maps, or histories
- historical roots or root versions
- tree frontiers or complete trees
- verifier challenges or proof results
- holder identities or wallets
- administrator state; or
- generic setters or mutable protocol configuration

`registeredIssuerLeaves` and `registeredCredentialNullifiers` are public transition guards. They are not authorization or qualification trust anchors.

## 13. Tree Model

Issuer, credential, and revocation trees are separate ordered binary trees with:

```text
depth = 16
capacity = 65,536
indices = 0..65,535
path length = 16 siblings
```

The ledger stores only roots and the two append counters.

The implementation MUST NOT replace this model with:

- Compact `MerkleTree` or `HistoricMerkleTree` ledgers
- `MerkleTreeDigest` roots
- complete public leaf collections
- frontier ledger fields
- sparse maps
- variable-length proofs
- caller-supplied direction bits; or
- historical-root storage

Issuer and credential trees append sequentially. The revocation tree has no allocation counter; it uses the already assigned credential index.

## 14. Shared Merkle Construction

The shared internal-node record is:

```text
MerkleNodeInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    left: Bytes<32>
    right: Bytes<32>
}
```

Construction is:

```text
merkleNodeV1(left, right) =
    persistentHash<MerkleNodeInputV1>({
        domain: DOMAIN_MERKLE_NODE_V1,
        protocolVersion: 1,
        left,
        right
    })
```

Left and right order is significant and MUST NOT be sorted.

Each tree defines a distinct canonical empty-leaf input:

```text
IssuerEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}

CredentialEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}

RevocationEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}
```

Each empty leaf is the `persistentHash` of its exact input with the corresponding frozen domain and `protocolVersion: 1`. None may be an all-zero or default leaf.

The initial root for each tree is:

```text
emptyNode[0] = canonicalEmptyLeaf

for level in 0..15:
    emptyNode[level + 1] =
        merkleNodeV1(emptyNode[level], emptyNode[level])

initialRoot = emptyNode[16]
```

The exact path aliases are:

```text
IssuerMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}

CredentialMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}

RevocationMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}
```

Siblings are ordered from leaf level to root level. Direction at level `n` derives from bit `n` of the `Uint<32>` index, least-significant bit first.

The circuit MUST assert `index < 65,536` and derive all 16 direction bits in-circuit. No witness or caller may supply directions.

## 15. Issuer Identity and Record

Every V1 issuer has one immutable nondefault secp256k1 verification key.

The issuer ID input is:

```text
IssuerIdInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    verificationKey: Secp256k1Point
}
```

Construction is:

```text
issuerId =
    persistentHash<IssuerIdInputV1>({
        domain: DOMAIN_ISSUER_ID_V1,
        protocolVersion: 1,
        verificationKey
    })
```

The authoritative record is:

```text
IssuerRecordV1 {
    protocolVersion: Uint<16>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

The issuer leaf is:

```text
IssuerLeafInputV1 {
    domain: Bytes<32>
    record: IssuerRecordV1
}
```

`issuerLeaf` is `persistentHash<IssuerLeafInputV1>` of the exact record with `DOMAIN_ISSUER_LEAF_V1`.

The issuer ID MUST be rederived from the key. It is not an independent administrator-assigned identifier.

The record and leaf contain no name, URL, status, suspension flag, registration timestamp, scope, index, or metadata.

Current membership of the canonical issuer leaf under `issuerRoot` is authorization. V1 has no deactivation, deletion, suspension, key rotation, or key history.

Registering another key creates another issuer identity.

## 16. Issuer Registration Authorization

Issuer registration requires both:

1. issuer proof of possession; and
2. registry-authority approval.

The possession message is:

```text
IssuerPossessionMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

The registry-authority message is:

```text
IssuerRegistrationMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    currentIssuerRoot: Bytes<32>
    issuerIndex: Uint<32>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

Both use `registryContract = kernel.self()` and the sealed `registryContext`.

The registry-authority message binds the current issuer root and current `nextIssuerIndex`. An unrelated successful issuer registration therefore makes an earlier unused authority approval stale.

Each message digest MUST be rederived in-circuit and its secp256k1 ECDSA signature verified under the appropriate key.

## 17. Issuer Registration Transition

The semantic witness is:

```text
IssuerRegistrationWitnessV1 {
    verificationKey: Secp256k1Point
    issuerPossessionSignature: Secp256k1EcdsaSignature
    registryAuthoritySignature: Secp256k1EcdsaSignature
    insertionPath: IssuerMerklePathV1
}
```

For `i = nextIssuerIndex`, issuer registration MUST:

1. require `i < 65,536`
2. reject the default verification key
3. derive the issuer ID, record, and leaf
4. reject the leaf if it is already in `registeredIssuerLeaves`
5. authenticate `emptyIssuerLeaf` at `i` against current `issuerRoot`
6. verify issuer possession
7. verify registry-authority approval
8. derive the new root by replacing only that empty leaf
9. atomically write:

```text
issuerRoot = newIssuerRoot
registeredIssuerLeaves.insert(issuerLeaf)
nextIssuerIndex = i + 1
```

and consume no state if any assertion fails.

The circuit may return the immutable issuer index. It MUST NOT accept a caller-selected issuer ID, leaf, index, current root, new root, status, or metadata.

The first successful issuer registration in the demonstration deployment MUST be at index `0`. The recommended display name is:

```text
JustProof Demonstration Certification Authority
```

The name is non-authoritative metadata.

The demonstration deployment manifest MUST publish the network, contract address, registry context, registry-authority verification key, founding issuer verification key, derived issuer ID, issuer index, issuer leaf, post-registration issuer root, protocol revision, Compact source and toolchain versions, circuit identity, proof-system version, and approved verifier-artifact identity or digest.

## 18. Credential Statement and Private Package

The exact semantic statement is:

```text
CredentialStatementV1 {
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    issuerId: Bytes<32>
    subjectCommitment: Bytes<32>
    qualificationType: Bytes<32>
    qualificationVersion: Uint<16>
    issuedAt: Uint<64>
    expiresAt: Uint<64>
}
```

It MUST satisfy:

```text
protocolVersion == 1
qualificationType == QUALIFICATION_MIDNIGHT_BUILDER_DEMO_V1
qualificationVersion == 1
issuedAt > 0
expiresAt == 0 OR expiresAt > issuedAt
```

The issuer delivers:

```text
PrivateCredentialPackageV1 {
    statement: CredentialStatementV1
    issuanceNonce: Bytes<32>
    credentialOpening: Bytes<32>
    issuerSignature: Secp256k1EcdsaSignature
}
```

The holder stores this immutable package with the independently generated `subjectSecret`.

The statement and package contain no holder name, email, wallet, issuer key, issuer display name, Merkle index, Merkle path, revocation state, verifier request, challenge, PDF, image, or presentation metadata.

## 19. Credential Cryptographic Construction

### 19.1 Credential ID

```text
CredentialIdInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    issuerId: Bytes<32>
    issuanceNonce: Bytes<32>
}
```

```text
credentialId =
    persistentHash<CredentialIdInputV1>({
        domain: DOMAIN_CREDENTIAL_ID_V1,
        protocolVersion: 1,
        issuerId,
        issuanceNonce
    })
```

`issuanceNonce` MUST be a fresh unpredictable 32-byte issuer-generated value.

### 19.2 Subject commitment

```text
SubjectCommitmentValueV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
}
```

```text
subjectCommitment =
    persistentCommit<SubjectCommitmentValueV1>(
        {
            domain: DOMAIN_SUBJECT_COMMITMENT_V1,
            protocolVersion: 1,
            credentialId
        },
        subjectSecret
    )
```

`subjectSecret` MUST be a fresh nonzero unpredictable 32-byte holder-generated value and MUST NOT be reused across credentials.

### 19.3 Credential commitment

```text
CredentialCommitmentValueV1 {
    domain: Bytes<32>
    statement: CredentialStatementV1
}
```

```text
credentialCommitment =
    persistentCommit<CredentialCommitmentValueV1>(
        {
            domain: DOMAIN_CREDENTIAL_COMMITMENT_V1,
            statement
        },
        credentialOpening
    )
```

`credentialOpening` MUST be a fresh nonzero unpredictable 32-byte issuer-generated value.

### 19.4 Issuer signature

```text
IssuerSignatureMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

The issuer signs the `persistentHash<IssuerSignatureMessageV1>` digest with the private key corresponding to its registered secp256k1 verification key.

The proof circuit MUST rederive the digest and assert:

```text
secp256k1EcdsaVerify(
    signatureMessage,
    issuerSignature,
    authenticatedIssuerVerificationKey
) == true
```

Ed25519 is not a JustProof V1 signature scheme.

## 20. Credential Issuance Sequence

Issuance MUST proceed in this order:

1. issuer has an authenticated registered issuer record
2. issuer generates a fresh issuance nonce
3. credential ID is derived
4. holder generates a fresh subject secret
5. holder derives the subject commitment and sends only the commitment to the issuer
6. issuer constructs the exact statement
7. issuer generates a fresh credential opening
8. issuer derives the credential commitment
9. issuer signs the credential ID and commitment digest
10. issuer delivers the private package to the holder
11. credential registration occurs through the contract; and
12. after finalization, issuer retains the minimum private revocation record, including the exact issuance nonce and assigned credential index

The issuer MUST NOT receive the subject secret during normal issuance.

The holder MUST verify the package, derivations, qualification constants, timestamps, issuer signature, and expected issuer identity before accepting it.

Credential correction or replacement requires reissuance with a new issuance nonce and therefore a new credential ID, commitment, signature, registry position, and revocation state.

## 21. Credential Leaf and Registration Nullifier

The credential leaf is:

```text
CredentialLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

`credentialLeaf` is `persistentHash<CredentialLeafInputV1>` of this exact record with `DOMAIN_CREDENTIAL_LEAF_V1` and protocol version `1`.

It binds the same ID and commitment used in construction and issuer authentication.

The deployment-scoped duplicate guard is:

```text
CredentialRegistrationNullifierInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    credentialId: Bytes<32>
}
```

with:

```text
registryContract = kernel.self()
registryContext = sealed registryContext
```

`credentialRegistrationNullifier` is `persistentHash<CredentialRegistrationNullifierInputV1>` of this exact deployment-bound record.

The circuit MUST derive both values. Caller-supplied leaves and nullifiers are not authoritative.

The nullifier is intentionally public and prevents two registry positions for the same credential ID within one deployment. It is not a presentation nullifier and MUST NOT be used for proof replay prevention.

## 22. Credential Registration Transition

The semantic witness is:

```text
CredentialRegistrationWitnessV1 {
    credentialPackage: PrivateCredentialPackageV1
    issuerMembership: IssuerMembershipWitnessV1
    insertionPath: CredentialMerklePathV1
}
```

Registration intentionally does not require `subjectSecret`.

For `i = nextCredentialIndex`, the circuit MUST:

1. require `i < 65,536`
2. validate statement constants and timestamps
3. rederive credential ID and credential commitment
4. authenticate the exact issuer record under current issuer state
5. require the statement issuer ID to equal the authenticated record ID
6. verify the issuer signature
7. derive the credential leaf and registration nullifier
8. require the nullifier to be absent
9. authenticate `emptyCredentialLeaf` at `i` against current `credentialRoot`
10. derive the new credential root; and
11. atomically write:

```text
credentialRoot = newCredentialRoot
registeredCredentialNullifiers.insert(
    credentialRegistrationNullifier
)
nextCredentialIndex = i + 1
```

The circuit MUST NOT return or emit the credential ID, commitment, leaf, assigned index, signature, issuer record, or path.

Successful finalization establishes the assigned index. The issuer, holder, and authorized tree provider receive the private assignment data they require through confidential off-chain coordination.

Credential registration does not change `revocationRoot` because every revocation position begins as the canonical empty revocation leaf.

## 23. Revocation Model

V1 revocation has one irreversible transition:

```text
NOT_REVOKED -> REVOKED
```

The transition is effective when the new `revocationRoot` becomes authoritative current state.

V1 has no revocation timestamp, scheduled revocation, grace period, unrevocation, batch revocation, public reason, or historical validity.

The original credential issuer is the only revocation authority. The registry authority, holder, wallet, relayer, frontend administrator, or another registered issuer cannot authorize revocation.

The issuer retains:

```text
IssuerRevocationRecordV1 {
    issuerId: Bytes<32>
    issuanceNonce: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialIndex: Uint<32>
    issuerSignature: Secp256k1EcdsaSignature
}
```

The issuer MUST retain the exact `issuanceNonce` used during issuance. Revocation rederives the credential ID from the current authenticated issuer ID and that nonce before verifying the original credential signature. This prevents another registered issuer from authorizing revocation merely by signing a learned credential ID and commitment.

The revoked leaf is:

```text
RevokedCredentialLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

`revokedCredentialLeaf` is `persistentHash<RevokedCredentialLeafInputV1>` of this exact record with `DOMAIN_REVOCATION_REVOKED_V1` and protocol version `1`.

The canonical empty revocation leaf represents `NOT_REVOKED`.

## 24. Revocation Authorization and Transition

The issuer signs:

```text
RevocationAuthorizationMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerId: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialIndex: Uint<32>
}
```

`revocationAuthorizationMessage` is `persistentHash<RevocationAuthorizationMessageV1>` of the exact record with `DOMAIN_REVOCATION_AUTHORIZATION_V1`, protocol version `1`, `registryContract = kernel.self()`, and the sealed registry context.

The message binds one deployment, issuer, credential ID, commitment, and index. It intentionally omits current roots so unrelated registry updates do not invalidate the authorization.

The semantic witness is:

```text
CredentialRevocationWitnessV1 {
    issuerMembership: IssuerMembershipWitnessV1
    issuanceNonce: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialMembership: CredentialMembershipWitnessV1
    issuerSignature: Secp256k1EcdsaSignature
    revocationPath: RevocationMerklePathV1
    revocationAuthorizationSignature: Secp256k1EcdsaSignature
}
```

The circuit MUST:

1. require `credentialIndex < nextCredentialIndex` and tree capacity
2. authenticate the issuer record under current `issuerRoot`
3. rederive the credential ID from that issuer record's ID and `issuanceNonce`, and require equality with the retained credential ID
4. verify the original credential signature under that issuer key
5. authenticate the credential leaf under current `credentialRoot`
6. verify revocation authorization under the same issuer key
7. authenticate `emptyRevocationLeaf` at the same credential index under current `revocationRoot`
8. derive the credential-bound revoked leaf
9. derive the new root with the same index and path; and
10. atomically write only:

```text
revocationRoot = newRevocationRoot
```

A duplicate revocation fails because the old-root proof can no longer authenticate the empty leaf.

Revocation never changes the statement, credential ID, commitments, issuer signature, credential leaf, credential root, credential index, or another revocation position.

## 25. Witness and Private-State Model

Witnesses are untrusted private input adapters. They are not authorities, access-control boundaries, trusted databases, or substitutes for circuit assertions.

V1 SHOULD expose one aggregate witness per semantic operation:

```compact
witness issuerRegistrationWitness(): IssuerRegistrationWitnessV1;
witness credentialRegistrationWitness(): CredentialRegistrationWitnessV1;
witness credentialRevocationWitness(): CredentialRevocationWitnessV1;
witness qualificationWitness(): QualificationWitnessV1;
```

The exact callback names are reference ABI guidance. The semantic record contents and circuit constraints are normative.

Each witness callback MUST:

- use compiler-generated types
- return exactly the generated private-state/value tuple
- produce one operation-scoped stable snapshot
- reject malformed lengths, indices, and missing fields
- avoid `any` and unchecked positional reinterpretation
- avoid mutating shared private state in place
- preserve contract and network scoping; and
- never treat provider validation as replacing circuit validation

Witnesses MUST NOT provide authoritative roots, counters, direction bits, current time, current contract address, registry context, derived leaves, or validity Booleans.

## 26. Exact Membership and Qualification Records

The membership records are:

```text
IssuerMembershipWitnessV1 {
    record: IssuerRecordV1
    issuerIndex: Uint<32>
    path: IssuerMerklePathV1
}

CredentialMembershipWitnessV1 {
    credentialIndex: Uint<32>
    path: CredentialMerklePathV1
}
```

The qualification witness is:

```text
QualificationWitnessV1 {
    credentialPackage: PrivateCredentialPackageV1
    subjectSecret: Bytes<32>
    issuerMembership: IssuerMembershipWitnessV1
    credentialMembership: CredentialMembershipWitnessV1
    revocationPath: RevocationMerklePathV1
}
```

The revocation path reuses `credentialMembership.credentialIndex`. V1 has no independent revocation index.

The qualification witness contains no request, challenge, claim map, verification time, root, counter, direction bits, issuer signing key, wallet key, or caller-supplied derived value.

## 27. Qualification Proof Request

The exact public request is:

```text
QualificationProofRequestV1 {
    protocolVersion: Uint<16>
    proofType: Uint<8>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    qualificationType: Bytes<32>
    qualificationVersion: Uint<16>
    verifierContext: Bytes<32>
    challenge: Bytes<32>
    requestExpiresAt: Uint<64>
}
```

It MUST satisfy:

```text
protocolVersion == 1
proofType == 1
registryContract == kernel.self()
registryContext == sealed registryContext
qualificationType == QUALIFICATION_MIDNIGHT_BUILDER_DEMO_V1
qualificationVersion == 1
verifierContext != default<Bytes<32>>
challenge != default<Bytes<32>>
requestExpiresAt > 0
blockTimeLt(requestExpiresAt)
```

The request has no issuer constraint, credential identifier, holder identity, claim map, expected root, validity switch, revocation override, or prover-selected time.

The verifier generates a fresh nonzero 32-byte CSPRNG challenge, retains the exact request, and assigns the challenge to no other request.

## 28. Proof Digests, State, and Output

The request digest input is:

```text
QualificationProofRequestDigestInputV1 {
    domain: Bytes<32>
    request: QualificationProofRequestV1
}
```

`requestDigest` is `persistentHash<QualificationProofRequestDigestInputV1>` of the exact request under `DOMAIN_PROOF_REQUEST_V1`.

The circuit constructs:

```text
QualificationVerificationStateV1 {
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerRoot: Bytes<32>
    nextIssuerIndex: Uint<32>
    credentialRoot: Bytes<32>
    nextCredentialIndex: Uint<32>
    revocationRoot: Bytes<32>
}
```

Every field comes from constants, `kernel.self()`, sealed configuration, or current ledger state.

The state digest input is:

```text
QualificationVerificationStateDigestInputV1 {
    domain: Bytes<32>
    state: QualificationVerificationStateV1
}
```

`stateDigest` is `persistentHash<QualificationVerificationStateDigestInputV1>` of the exact current state under `DOMAIN_PROOF_STATE_V1`.

The exact output is:

```text
QualificationProofPublicOutputV1 {
    requestDigest: Bytes<32>
    stateDigest: Bytes<32>
}
```

The circuit returns only the disclosed two-field output. It returns no success Boolean, issuer, credential, commitment, index, path, signature, time, or private data.

## 29. Proof Artifact and Circuit

The conceptual artifact is:

```text
QualificationProofArtifactV1 {
    networkId
    circuitId
    request: QualificationProofRequestV1
    verificationState: QualificationVerificationStateV1
    publicOutput: QualificationProofPublicOutputV1
    proof
}
```

The circuit identity is:

```text
proveQualificationV1
```

Its interface is:

```text
proveQualificationV1(
    request: QualificationProofRequestV1
) -> QualificationProofPublicOutputV1
```

The proof bundle MUST preserve every public input, output, ledger-query, block-time-query, and transcript component required by the pinned verifier.

Proof bytes alone, output digests alone, and generated JavaScript execution alone never establish protocol validity.

## 30. Exact Qualification Statement

One valid proof MUST jointly establish:

1. exact protocol, proof type, qualification, deployment, verifier, challenge, and deadline binding
2. exact request and current-state digests
3. valid credential-statement constants and timestamps
4. credential ID rederived from the statement issuer ID and private issuance nonce
5. subject commitment opened by the private subject secret
6. credential commitment opened by the private credential opening
7. valid issuer record rederived from a nondefault key
8. statement issuer ID equal to the authenticated issuer-record ID
9. issuer membership under current `issuerRoot` and `nextIssuerIndex`
10. valid issuer signature over the same credential ID and commitment
11. credential membership under current `credentialRoot` and `nextCredentialIndex`
12. empty revocation leaf at the same credential index under current `revocationRoot`
13. fixed qualification equality between request and private statement
14. current block time at or after `issuedAt`
15. current block time before nonzero `expiresAt`
16. nonzero `expiresAt >= requestExpiresAt`; and
17. no JustProof ledger mutation

All relations MUST use one coherent credential, issuer, signature, commitment, index, and path set. Material from different credentials or issuers MUST NOT be combined.

## 31. Temporal and Current-State Semantics

The circuit MUST enforce:

```text
issuedAt > 0
expiresAt == 0 OR expiresAt > issuedAt
blockTimeGte(issuedAt)
expiresAt == 0 OR blockTimeLt(expiresAt)
expiresAt == 0 OR requestExpiresAt <= expiresAt
blockTimeLt(requestExpiresAt)
```

This proves the credential remains unexpired through the entire request window.

The verifier independently rejects when its trusted time is:

```text
verifierTime >= requestExpiresAt
```

Current validity uses only the current issuer, credential, and revocation state.

Any included root or counter change stales an unaccepted proof, including an unrelated issuer or credential append.

V1 defines no historical root, root-age tolerance, grace period, arbitrary verification time, validity at issuance, or archived-state acceptance.

## 32. Verification Protocol

A conforming verifier MUST:

1. load trusted network, contract, registry context, verifier context, circuit, qualification, and verifier-artifact configuration
2. parse and bound the artifact
3. resolve the exact retained request and require challenge status `ISSUED`
4. require the deadline to be in the future under trusted verifier time
5. compare every request field with the retained request
6. recompute the typed request digest
7. select trusted verifier artifacts rather than holder-supplied artifacts
8. verify finalized network execution or use a supported portable interface that verifies the proof and complete transcript
9. obtain the latest finalized state of the configured contract
10. reconstruct the exact eight-field verification state
11. recompute the state digest and require equality
12. perform a final deadline, state, finality, and challenge-status check
13. atomically consume the challenge; and
14. return `VALID` only after consumption commits

Portable verification MUST remain disabled if the selected SDK cannot verify the full proof and transcript. In that case the verifier returns `COULD_NOT_VERIFY` rather than simulating success.

## 33. Challenge Lifecycle and Outcomes

The challenge lifecycle is:

```text
ISSUED -> CONSUMED
       -> EXPIRED
       -> CANCELLED
```

Only `ISSUED`, unexpired requests may be accepted.

After every check succeeds, the verifier MUST atomically transition `ISSUED -> CONSUMED`. Concurrent submissions for one challenge produce at most one `VALID` result.

Invalid, stale, or indeterminate submissions do not automatically consume an otherwise active request. The holder may refresh paths and regenerate against the same exact request while it remains active.

Terminal outcomes are:

| Outcome | Meaning |
| --- | --- |
| `VALID` | Every required check succeeded and the challenge was consumed |
| `INVALID` | At least one required condition conclusively failed |
| `COULD_NOT_VERIFY` | Required authoritative state, artifacts, time, finality, network data, or verification capability was unavailable or indeterminate |

`PENDING` may be used as a UI state but is not a terminal protocol result.

Private-statement failures MUST collapse to the safe `INVALID_PROOF` diagnostic. Public errors MUST NOT reveal which credential, issuer, signature, path, revocation, or time relation nearly matched.

## 34. Complete Lifecycle

The normative V1 lifecycle is:

1. generate distinct registry-authority and founding-issuer keys
2. generate a fresh deployment registry context
3. deploy the contract with canonical empty roots and counters
4. register the founding issuer at index `0` through proof of possession and authority approval
5. holder generates a fresh subject secret
6. issuer constructs and signs one private credential package
7. register the credential at current `nextCredentialIndex`
8. privately deliver finalized credential index and refreshable paths
9. verifier issues one exact request with a fresh challenge and deadline
10. holder obtains current issuer, credential, and revocation paths
11. holder creates one coherent qualification witness snapshot
12. holder generates `proveQualificationV1`
13. verifier validates the complete artifact against current finalized state
14. verifier atomically consumes the challenge and returns `VALID`
15. issuer may later authorize revocation of the registered credential
16. revocation updates only `revocationRoot`; and
17. every later current qualification proof for that credential fails non-revocation

Expiration requires no ledger transition. Reissuance creates a new credential instance.

## 35. State-Effect Matrix

| Operation | Reads | Writes |
| --- | --- | --- |
| Constructor | Constructor arguments and canonical empty-root constants | All nine ledger fields initialized |
| Issuer registration | Sealed configuration, issuer root/counter, issuer duplicate set | Issuer root, issuer duplicate set, issuer counter |
| Credential registration | Registry context, issuer root/counter, credential root/counter, credential duplicate set | Credential root, credential duplicate set, credential counter |
| Credential revocation | Registry context, all three roots, issuer/credential counters | Revocation root only |
| Qualification proof | Registry context, all three roots, issuer/credential counters | Nothing |

Every write set is atomic. Failed calls commit no partial root, counter, or set update.

No circuit may expose a generic root setter, counter setter, set removal, reset, credential deletion, unrevocation, status update, or arbitrary ledger write.

## 36. Public and Private Boundary

Public protocol state includes:

- contract address and network
- registry-authority verification key and registry context
- issuer, credential, and revocation roots
- issuer and credential counters
- registered issuer-leaf duplicate entries
- registered credential nullifiers
- public circuit and transaction identity
- complete qualification request
- complete verification-state snapshot
- request and state digests
- proof runtime transcript
- verifier challenge lifecycle metadata; and
- state-transition timing

Private protocol material includes:

- issuer, registry-authority, and revocation signing keys
- complete private credential package
- issuance nonce
- subject secret
- credential opening
- issuer and revocation signatures within private circuit inputs
- issuer and credential records as used inside qualification proof
- issuer, credential, and revocation indices and paths used inside qualification proof
- credential ID, subject commitment, and credential commitment in qualification proof
- private tree-provider mappings; and
- the association between a proof and a particular holder, credential, or issuer

Only values explicitly crossing a public boundary through ledger operations, exported returns, events, or transcript semantics may be disclosed.

## 37. Human-Readable Credentials and Metadata

A holder MAY receive a PDF, image, web view, badge, or other human-readable certificate.

Presentation artifacts are not protocol credentials, commitments, signatures, Merkle leaves, or proofs.

A holder name or other private display field MAY appear in a private presentation artifact without becoming part of `CredentialStatementV1`. V1 does not authenticate fields absent from that statement.

A QR code MAY initiate verification or carry non-sensitive routing information. It MUST NOT expose the private package, issuance nonce, subject secret, credential opening, issuer signature, or private paths.

OCR is not an authoritative credential-import path. Proof generation requires the exact structured private credential package and holder secret.

External issuer names, logos, URLs, certificate images, and metadata MUST NOT affect `VALID`.

## 38. Off-Chain Services

V1 requires off-chain storage or services for:

- holder private credential and secret state
- issuer operational issuance and revocation state
- issuer, credential, and revocation tree leaves and paths
- finalized index coordination
- verifier challenge state
- verifier configuration and release artifacts; and
- optional human-readable presentation metadata

Off-chain state is not authoritative merely because it is necessary.

Every tree provider MUST reconstruct its current root and compare it with the on-chain root. Missing, stale, malformed, or inconsistent paths fail closed.

Proof generation SHOULD occur in a holder-controlled environment. A remote proof server processes private witness values and therefore introduces a trust decision even when the final proof is zero knowledge.

Remote services MUST use authenticated encrypted transport, tenant isolation, minimum retention, disabled private-input logs, bounded access, and documented incident handling.

## 39. Concurrency and Recovery

Registry operations may race against other valid transitions.

A stale insertion path, root-bound issuer approval, membership path, or state digest MUST fail. A retry MUST fetch current state and refresh every affected path.

After credential registration finalizes, holder and tree-provider state MUST record the actual assigned index. Simulated or attempted indices MUST NOT be committed locally as final before network finality.

A stale qualification proof leaves an active challenge unconsumed. The holder may regenerate against refreshed state while the exact request remains unexpired.

Loss of:

- registry-authority key prevents future issuer registration
- issuer key prevents new issuance and issuer-authorized revocation
- issuer revocation records may prevent revocation construction
- holder private state prevents qualification proof; and
- tree-provider state may prevent path production

unless an independently secured recovery process exists outside V1.

V1 defines no cryptographic key or private-state recovery mechanism.

## 40. Failure Semantics

Every contract circuit and verifier MUST fail closed.

Failure includes:

- malformed or unsupported types, versions, domains, fields, paths, proofs, or artifacts
- default or invalid required keys, secrets, openings, contexts, or challenges
- wrong qualification, deployment, verifier context, circuit, or deadline
- invalid or stale signatures, approvals, paths, roots, counters, or state digests
- wrong issuer/nonce/credential-ID binding during revocation
- duplicate issuer or credential registration
- full issuer or credential tree
- credential or issuer material mixed across records
- unregistered issuer or credential
- revoked credential
- credential not yet issued, expired, or expiring before the request deadline
- inactive or expired challenge
- unavailable current state, time, verifier artifacts, finality, or proof capability; or
- any unhandled exception or infrastructure ambiguity

Unavailable authority produces `COULD_NOT_VERIFY`, never `VALID`.

Error messages, logs, timing, and telemetry MUST NOT become an oracle for private issuer, credential, membership, revocation, or temporal data.

## 41. Conformance Requirements

A V1 implementation is conforming only if it:

1. compiles with the pinned language, toolchain, and runtime
2. contains exactly the nine frozen ledger fields
3. implements canonical constructor initialization
4. embeds or reproduces every exact constant
5. uses every exact typed record and field order
6. uses `persistentCommit` with independent openings for both hiding commitments
7. uses secp256k1 ECDSA and in-circuit message derivation
8. implements three root-only depth-16 trees and shared ordered nodes
9. derives path directions in-circuit
10. preserves the four exact semantic operation records
11. rederives every witness-supplied security-critical value
12. preserves every atomic write set
13. exposes no prohibited public credential data or operation
14. implements the exact qualification request, state, output, and circuit statement
15. verifies only current state
16. enforces the challenge lifecycle and at-most-once acceptance
17. preserves `VALID`, `INVALID`, and `COULD_NOT_VERIFY` meanings
18. passes all component and cross-component tests
19. ships an authenticated deployment manifest; and
20. has no unresolved conflict among the frozen documents, implementation, generated artifacts, and vectors

Passing happy-path tests alone is not conformance.

## 42. Required Test and Vector Matrix

The complete V1 suite MUST include:

### 42.1 Constant and cross-runtime vectors

- every domain-tag SHA-256 value
- fixed qualification type
- every typed `persistentHash` construction
- both `persistentCommit` constructions with fixed openings
- all three empty leaves and 17-level empty-node sequences
- request and state digests; and
- exact two-field proof output

### 42.2 Constructor and ledger tests

- exact nine-field schema
- exact canonical initial roots
- zero counters and empty sets
- rejected default authority key and zero registry context
- no extra status, history, frontier, administrator, or generic-setter field; and
- exact state-isolation matrix

### 42.3 Issuer tests

- key-derived issuer ID and leaf
- issuer proof of possession
- registry-authority current-state approval
- empty-leaf replacement at current index
- duplicate and capacity rejection
- stale approval and stale path rejection
- atomic root, set, and counter update; and
- absent status, deactivation, and key rotation

### 42.4 Credential and commitment tests

- exact statement schema and constants
- credential ID derivation and nonce uniqueness
- holder secret and subject commitment
- credential opening and credential commitment
- issuer signature message and verification
- changed field, opening, secret, nonce, key, or domain rejection
- mixed-credential rejection; and
- private package immutability

### 42.5 Credential-tree tests

- exact credential and empty leaves
- 16-sibling leaf-to-root paths
- LSB-first derived directions
- membership and empty-position insertion
- sequential indices and capacity
- deployment-scoped nullifier uniqueness
- stale path rejection; and
- root-only ledger representation

### 42.6 Revocation tests

- exact empty and revoked leaves
- credential ID rederivation from the authenticated issuer ID and retained issuance nonce
- original credential-signature binding
- exact revocation-authorization message
- same issuer for credential and revocation signatures
- missing or wrong issuance nonce and mixed issuer/nonce/credential-ID rejection
- same credential index across credential and revocation trees
- irreversible empty-to-revoked replacement
- duplicate revocation rejection
- revocation-root-only write; and
- absence of timestamp, reason, counter, event, or history

### 42.7 Witness and privacy tests

- generated type compatibility for all four semantic records
- one stable snapshot per operation
- provider values treated as untrusted
- no root, counter, direction, time, or validity witness
- no private data in ledger, output, event, log, URL, analytics, or error; and
- holder-controlled or explicitly trusted proof-server behavior

### 42.8 Qualification proof tests

- exact request, state, output, circuit, and verifier artifacts
- holder control
- issuer membership and signature
- credential membership
- same-index non-revocation
- fixed qualification
- inclusive issuance and exclusive expiration boundaries
- validity through request deadline
- request mutation rejection
- stale state rejection after every included field change; and
- no ledger write or credential-specific event

### 42.9 Verifier tests

- fresh CSPRNG challenge issuance
- exact retained request equality
- trusted deployment and artifact selection
- complete proof and transcript verification
- finalized current-state acquisition
- typed digest recomputation
- exclusive deadline behavior
- atomic challenge consumption
- at-most-one concurrent `VALID`
- retry after invalid or stale proof while request remains active
- safe outcome and diagnostic mapping; and
- portable-verification capability gating

No V1 deployment should be labeled conforming until every required vector and negative test passes.

## 43. Normative Invariants

Every V1 implementation MUST preserve:

1. Protocol version is `1`.
2. Proof type is `1` and only `QUALIFICATION` exists.
3. The qualification type and version equal the frozen demonstration values.
4. All cryptographic inputs are exact typed Compact values.
5. Every domain has one frozen purpose and exact value.
6. Subject and credential commitments use `persistentCommit` with fresh nonzero openings.
7. Issuer identity derives from one immutable nondefault secp256k1 key.
8. Every protocol signature uses secp256k1 ECDSA over an in-circuit-derived `Bytes<32>` digest.
9. Issuer registration requires possession and registry-authority approval.
10. Current issuer-tree membership is issuer authorization.
11. V1 has no issuer status, deactivation, deletion, or key rotation.
12. The ledger contains exactly the nine frozen fields.
13. Every tree has depth `16` and capacity `65,536`.
14. Every path has exactly 16 leaf-to-root siblings.
15. Directions derive from the bounded index, least-significant bit first.
16. The ledger stores roots, not trees, paths, frontiers, or histories.
17. Issuer and credential insertions replace the next canonical empty leaf.
18. Issuer and credential indices are sequential, immutable, and never reused.
19. The credential statement has exactly eight fields.
20. Credential ID derives from issuer ID and fresh issuance nonce.
21. Subject commitment binds the credential ID to the holder secret.
22. Credential commitment hides and binds the complete statement.
23. Issuer signature binds the exact credential ID and commitment.
24. Credential leaf binds the same ID and commitment.
25. The registration nullifier is deployment-scoped and used only for registration uniqueness.
26. Credential registration does not require the holder secret.
27. Credential registration changes only its root, duplicate set, and counter.
28. Revocation rederives the credential ID from the authenticated issuer ID and retained private issuance nonce.
29. Revocation uses the exact credential index and changes only `revocationRoot`.
30. Revocation is current, irreversible, issuer-authorized, and has no timestamp.
31. Non-revocation means the canonical empty revocation leaf at the registered credential index.
32. Every witness value remains untrusted until constrained in-circuit.
33. Qualification proof uses exactly `QualificationWitnessV1`.
34. Roots, counters, contract, context, directions, and current time never come from witnesses as authority.
35. The public request has exactly nine fields.
36. The verification state has exactly eight fields.
37. The public output contains exactly request and state digests.
38. The qualification circuit jointly proves every validity obligation.
39. The credential is unexpired through the request deadline.
40. Qualification proof performs no ledger write.
41. State changes stale unaccepted proofs without a grace period.
42. V1 accepts no historical or caller-selected state.
43. Every request has one fresh nonzero 32-byte challenge.
44. Every challenge belongs to exactly one request and is accepted at most once.
45. V1 has no presentation nullifier or reusable bearer proof.
46. The verifier never receives or separately resolves the private issuer or credential.
47. `VALID` follows complete proof, request, current-state, deadline, and challenge verification.
48. Unavailable authority never produces `VALID`.
49. Human-readable artifacts and metadata never establish protocol validity.
50. Private credential data is never required by the verifier.
51. A conflict among frozen artifacts stops implementation until re-freezing.

## 44. V1 Non-Goals

V1 does not provide:

- official Midnight Academy credentials or representation
- arbitrary credential schemas or generalized interoperability
- multiple qualifications or proof types
- score, grade, threshold, age, name, identity, employer, or free-form claim proofs
- holder legal identity, personhood, wallet ownership, or non-transferability
- issuer status, suspension, removal, or key rotation
- registry-authority rotation, governance, or recovery
- credential modification, deletion, replacement in place, or one-use consumption
- unrevocation, scheduled revocation, timestamps, reasons, batches, or history
- historical-root verification or arbitrary verification time
- reusable, bearer, offline-indefinite, or verifier-independent proof acceptance
- public issuer selection or issuer disclosure in qualification proof
- credential-ID disclosure or presentation nullifiers
- native Compact Merkle ledgers, historical Merkle trees, or on-chain frontiers
- on-chain holder private state or complete off-chain tree availability
- cryptographic recovery of lost holder, issuer, or authority state
- proof generation without trusting the machine that processes the witness
- protection against all network, browser, verifier, wallet, timing, or provider metadata correlation; or
- proof that an authorized issuer's attestation is factually true

These are deliberate boundaries, not implementation omissions.

## 45. Versioning and Change Control

A protocol change includes any alteration to:

- a field name, order, type, optionality, or record nesting
- a domain label or exact byte value
- hash, commitment, opening, signature, leaf, node, nullifier, or digest construction
- tree depth, capacity, path order, direction derivation, index, or root semantics
- ledger field, visibility, initialization, or write set
- issuer, credential, revocation, witness, proof, challenge, or verifier semantics
- fixed qualification, timestamp boundary, deadline rule, or current-state rule
- public/private boundary
- meaning of `VALID`; or
- required test vector

Before such a change ships:

1. assign a new protocol or schema version as appropriate
2. update every affected component specification
3. update this consolidated specification
4. regenerate Compact and TypeScript artifacts
5. regenerate affected vectors
6. run the complete negative and cross-component suite
7. publish a new authenticated deployment manifest; and
8. review and freeze the new version

A toolchain update that preserves intended semantics still requires regenerated artifacts and full regression testing. Semantic equivalence MUST NOT be assumed from successful compilation alone.

## 46. Recommended Implementation Sequence

Implementation SHOULD proceed in this order:

1. encode all frozen primitive types and constants
2. implement typed hash and commitment helpers
3. implement shared Merkle reconstruction and index-bit derivation
4. declare the exact ledger and constructor
5. implement issuer registration and tests
6. implement credential construction, issuance helpers, and tests
7. implement credential registration and tests
8. implement revocation and tests
9. implement private-state and witness adapters
10. implement `proveQualificationV1`
11. implement request issuance and verifier challenge storage
12. implement network-confirmed verification
13. capability-gate portable verification
14. integrate holder, issuer, and verifier interfaces
15. audit privacy, logging, telemetry, and remote services
16. run every conformance test; and
17. publish the deployment manifest and demonstration documentation

Implementation SHOULD NOT begin with generalized UI policies, arbitrary credential schemas, historical data, optional claims, or issuer lifecycle features that V1 excludes.

## 47. Implementation References

The frozen design should be implemented against:

- [Compact language reference](https://docs.midnight.network/compact/reference/compact-reference)
- [Compact standard-library exports](https://docs.midnight.network/compact/standard-library/exports)
- [Midnight security and best practices](https://docs.midnight.network/guides/security-best-practices)
- [Compact smart-contract security](https://docs.midnight.network/compact/smart-contract-security)
- [Using Compact contracts from JavaScript](https://docs.midnight.network/guides/use-compact-javascript-implementation)
- [Midnight.js](https://docs.midnight.network/sdks/official/midnight-js)
- [Deploying and operating a contract](https://docs.midnight.network/getting-started/deploy-mn-app)
- [Compact toolchain `0.31.0`](https://docs.midnight.network/relnotes/compact/toolchain-0.31.0)

The standard-library reference is authoritative for `persistentHash`, `persistentCommit`, secp256k1 types and verification, and block-time predicates.

The generated JavaScript guide is authoritative for the boundary between local contract-logic execution and proof, transaction, finality, and current-network verification.

## 48. Final Protocol Principle

JustProof V1 intentionally proves one narrow statement:

> A holder-controlled private credential for the fixed JustProof Midnight Builder demonstration qualification was correctly constructed, authenticated by a currently registered issuer, registered under current credential state, unrevoked at the same index under current revocation state, and unexpired through this verifier's exact request deadline.

The statement is bound to one deployment, verifier context, challenge, request, and current finalized state.

The verifier learns that the statement is true without learning which credential, issuer, or holder satisfied it.

That narrowness is the V1 security and privacy boundary. Implementations MUST preserve it.
