# JustProof Credential Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the normative JustProof V1 qualification credential: its semantic fields, private opening material, holder binding, identifier, commitment, issuer-authentication message, lifecycle, and privacy boundary.

JustProof allows a holder to prove that a privately held qualification credential satisfies a verifier's request without sending the underlying credential to the verifier or publishing it on the Midnight ledger.

The protocol separates five properties that MUST NOT be conflated:

1. **Credential identity:** which credential instance is referenced.
2. **Holder control:** whether the prover knows the credential-specific subject secret.
3. **Issuer authenticity:** whether the registered issuer signed the credential commitment.
4. **Registry membership:** whether the credential is represented in authoritative credential-registry state.
5. **Current validity:** whether the credential is unexpired and unrevoked under current authoritative state.

No single identifier, commitment, signature, Merkle root, or proof establishes all five properties by itself.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- the base credential schema
- the credential-ID construction
- credential-specific holder binding
- the credential-commitment construction
- the issuer signature message and signature scheme
- timestamp and expiration semantics
- the private/public credential boundary
- the relationship between a credential and the issuer, credential, and revocation registries

The following are defined by their own frozen specifications and MUST conform to this document:

- issuer-registry leaf and root construction
- credential Merkle-leaf and internal-node construction
- revocation-tree construction
- witness interfaces
- proof requests and public proof inputs
- verification result semantics

Changing a field, field type, field order, domain tag, hash or commitment construction, signature scheme, temporal boundary, or semantic meaning defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Baseline

The V1 contract implementation MUST begin with:

```compact
pragma language_version 0.23;
```

V1 uses Compact's typed representation for every value participating in a protocol hash or commitment. JSON, JavaScript object serialization, property insertion order, delimiter-based string concatenation, and human-readable certificate files are not cryptographic encodings.

The protocol uses:

- `persistentHash<T>` for persistent identifiers and message digests
- `persistentCommit<T>` for persistent hiding commitments
- `secp256k1EcdsaVerify` for in-circuit issuer-signature verification
- `blockTimeGte` and `blockTimeLt` for current on-chain temporal checks

The Compact implementation MUST import the required native types and circuits from `CompactStandardLibrary`.

## 5. Terminology

| Term | Definition |
| --- | --- |
| **Credential statement** | The fixed typed record containing the semantic V1 qualification assertion. |
| **Private credential package** | The credential statement plus the private opening material and issuer signature delivered to the holder. |
| **Credential ID** | A stable pseudonymous identifier for one issuance. |
| **Issuance nonce** | A fresh issuer-generated 32-byte value used to derive the credential ID. |
| **Subject secret** | A fresh holder-generated 32-byte secret proving control of the credential. |
| **Subject commitment** | A credential-specific commitment to the subject secret. |
| **Credential opening** | A fresh 32-byte opening used by `persistentCommit` to hide the credential statement. |
| **Credential commitment** | The persistent commitment to the complete credential statement. |
| **Issuer signature** | The issuer's secp256k1 ECDSA signature authenticating the credential ID and commitment. |
| **Presentation artifact** | A PDF, image, JSON envelope, or UI representation that is not itself an authoritative protocol object. |

## 6. Primitive Types

V1 uses the following protocol types:

| Value | Compact type |
| --- | --- |
| Protocol version | `Uint<16>` |
| Qualification schema version | `Uint<16>` |
| Timestamp | `Uint<64>` |
| Issuer ID | `Bytes<32>` |
| Credential ID | `Bytes<32>` |
| Issuance nonce | `Bytes<32>` |
| Subject secret | `Bytes<32>` |
| Subject commitment | `Bytes<32>` |
| Credential opening | `Bytes<32>` |
| Credential commitment | `Bytes<32>` |
| Qualification type | `Bytes<32>` |
| Domain tag | `Bytes<32>` |
| Issuer verification key | `Secp256k1Point` |
| Issuer signature | `Secp256k1EcdsaSignature` |

The V1 protocol version value is:

```text
1
```

All byte strings in application storage or transport MUST use an explicitly documented encoding. Lowercase hexadecimal without a `0x` prefix is RECOMMENDED. Transport encoding MUST NOT change the Compact value that enters a protocol construction.

## 7. Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose | UTF-8 label | `Bytes<32>` hexadecimal |
| --- | --- | --- |
| Credential ID | `JP:CREDENTIAL:ID:V1` | `623c528860cfbea80c5c278171c7fee117e356b12ee5a2d8002d60522e56371b` |
| Subject commitment | `JP:SUBJECT:COMMITMENT:V1` | `d0f8ef87f028847a80da0f254686e455ee2548625ca7d6f0fc030246c12cb5b2` |
| Credential commitment | `JP:CREDENTIAL:COMMITMENT:V1` | `c1d6eaac074956c51c0cd0c751db4f42a100c8040e73c45cbe8f50fe4a34ae82` |
| Issuer signature message | `JP:CREDENTIAL:SIGNATURE:V1` | `1406fcb965bc2d002c2da6a691a39e1dcf9c2b062e75d0eeaa88f01821eb5ea6` |

Implementations MUST embed or deterministically reproduce the exact 32-byte values. They MUST NOT pass the variable-length labels directly where a `Bytes<32>` domain field is required.

## 8. Founding Qualification Schema

JustProof V1 supports one protocol qualification schema:

```text
JustProof Midnight Builder Demonstration Credential
```

Its qualification type is the SHA-256 digest of the exact UTF-8 label:

```text
JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1
```

The resulting value is:

```text
3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7
```

Its qualification schema version is:

```text
1
```

The qualification is a demonstration credential. It MUST NOT be presented as an official Midnight Academy credential or as evidence that JustProof represents Midnight Academy.

V1 does not support an arbitrary claims map. Free-form claims, dynamic claim names, scores, grades, and generalized predicates are outside the frozen V1 schema. A new cryptographically provable claim requires an explicit schema extension and protocol-version decision; it MUST NOT be smuggled into presentation metadata.

This restriction is deliberate. Compact circuits require fixed, typed proof semantics, and the V1 product scope requires one qualification proof rather than a generalized credential framework.

## 9. Credential Statement

The normative semantic credential is:

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

The field order is normative.

The statement contains no holder name, email address, wallet address, certificate image, issuer display name, issuer verification key, signature, revocation flag, or Merkle position.

The statement MUST satisfy:

```text
protocolVersion == 1
qualificationType == 3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7
qualificationVersion == 1
issuedAt > 0
expiresAt == 0 OR expiresAt > issuedAt
```

## 10. Credential ID

Each issuance MUST have a fresh credential ID.

The issuer MUST generate a fresh, unpredictable 32-byte `issuanceNonce` using a cryptographically secure random source. It MUST NOT intentionally reuse the same nonce with the same issuer ID.

The normative input is:

```text
CredentialIdInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    issuerId: Bytes<32>
    issuanceNonce: Bytes<32>
}
```

The field order is normative. Construction is:

```text
credentialId =
    persistentHash<CredentialIdInputV1>({
        domain: DOMAIN_CREDENTIAL_ID_V1,
        protocolVersion: 1,
        issuerId,
        issuanceNonce
    })
```

The credential ID identifies an issuance instance. It is not a commitment to the complete credential and is not evidence of issuer authorization, holder control, registry membership, or current validity.

The credential ID MUST NOT depend on the subject commitment, qualification, timestamps, credential commitment, issuer verification key, Merkle position, Merkle root, revocation state, transaction ID, or presentation artifact.

The credential ID is immutable. A corrected, replaced, or reissued credential MUST use a fresh issuance nonce and therefore a new credential ID.

The issuance nonce is part of the private credential package so that a proof circuit can rederive and constrain the credential ID. The nonce is not required to be disclosed to a verifier or stored on the public ledger.

## 11. Holder Binding

Each credential MUST bind to a fresh credential-specific secret controlled by the holder.

The holder MUST generate a fresh, unpredictable 32-byte `subjectSecret` using a cryptographically secure random source. The secret MUST NOT be derived from a name, email address, phone number, government identifier, wallet seed, wallet private key, or other low-entropy or reusable identity value.

The holder MUST NOT intentionally reuse a subject secret across credentials.

The subject commitment value is:

```text
SubjectCommitmentValueV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
}
```

Construction is:

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

The subject commitment is credential-specific because the committed value includes `credentialId`.

The holder sends `subjectCommitment`, not `subjectSecret`, to the issuer. The issuer MUST NOT require the subject secret during normal issuance.

A valid holder-possession proof MUST rederive the subject commitment from the private subject secret and the credential ID and constrain it to the value in the credential statement.

Knowledge of the subject secret proves control of the credential-bound secret. It does not prove the holder's legal identity, prevent voluntary credential sharing, or provide recovery if the secret is lost.

## 12. Credential Commitment

The credential commitment is a persistent hiding commitment to the complete credential statement.

The issuer MUST generate a fresh, unpredictable 32-byte `credentialOpening` for every issuance. The opening MUST be generated with a cryptographically secure random source and securely delivered with the private credential package.

The normative committed value is:

```text
CredentialCommitmentValueV1 {
    domain: Bytes<32>
    statement: CredentialStatementV1
}
```

Construction is:

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

The credential commitment therefore binds:

- protocol version
- credential ID
- issuer ID
- subject commitment
- qualification type
- qualification version
- issuance time; and
- expiration time

The credential opening, issuance nonce, subject secret, issuer signature, presentation metadata, Merkle position, and revocation state MUST NOT be fields inside the committed statement.

The credential commitment is immutable. Changing any credential-statement field or the credential opening produces a different commitment except with negligible probability.

The credential commitment is distinct from the credential ID:

```text
credentialId
    = identity of one issuance

credentialCommitment
    = hiding commitment to that issuance's semantic statement
```

An implementation MUST NOT replace `persistentCommit` with `persistentHash` for this construction. The mandatory random opening is part of the V1 privacy design, not an optional application salt.

## 13. Issuer Authentication

V1 uses ECDSA over secp256k1 because Compact language version 0.23 exposes `Secp256k1Point`, `Secp256k1EcdsaSignature`, and `secp256k1EcdsaVerify` for in-circuit verification.

Ed25519 is not the V1 JustProof credential-signature scheme and MUST NOT be used as a drop-in substitute.

The normative signature-message input is:

```text
IssuerSignatureMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

Construction is:

```text
signatureMessage =
    persistentHash<IssuerSignatureMessageV1>({
        domain: DOMAIN_CREDENTIAL_SIGNATURE_V1,
        protocolVersion: 1,
        credentialId,
        credentialCommitment
    })
```

The issuer signs the resulting `Bytes<32>` message digest with the private key corresponding to its registered secp256k1 verification key:

```text
issuerSignature = Secp256k1EcdsaSign(
    issuerSigningKey,
    signatureMessage
)
```

Verification MUST constrain:

```text
secp256k1EcdsaVerify(
    signatureMessage,
    issuerSignature,
    registeredIssuerVerificationKey
) == true
```

The verification key MUST come from an issuer leaf authenticated against the authoritative V1 issuer root. A key supplied only by the prover is not authoritative.

The signature is not part of the credential statement or credential commitment. This prevents a circular construction:

```text
credential statement
        ↓
credential commitment
        ↓
signature message
        ↓
issuer signature
```

A valid signature proves only that the holder of the issuer signing key authenticated the credential ID and commitment. It does not by itself prove that the issuer is registered, the credential is registered, the prover knows the subject secret, or the credential is currently valid.

## 14. Private Credential Package

The issuer delivers a private credential package to the holder:

```text
PrivateCredentialPackageV1 {
    statement: CredentialStatementV1
    issuanceNonce: Bytes<32>
    credentialOpening: Bytes<32>
    issuerSignature: Secp256k1EcdsaSignature
}
```

The holder stores the package together with the independently generated `subjectSecret`.

The holder's complete private credential state is conceptually:

```text
HolderCredentialStateV1 {
    credentialPackage: PrivateCredentialPackageV1
    subjectSecret: Bytes<32>
    credentialIndex: Uint<32>
    credentialMerklePath
    revocationMerklePath
}
```

`credentialIndex` and the Merkle paths are registry witness material, not immutable fields of the credential. Paths MAY be refreshed as authenticated registry roots change.

The application MAY wrap the package in JSON, CBOR, an encrypted file, or another transport format. That wrapper is not the cryptographic representation and MUST NOT be hashed or signed in place of the typed constructions in this specification.

The holder SHOULD encrypt the private package and subject secret at rest. Logs, analytics, crash reports, URLs, browser-rendered markup, and public transaction metadata MUST NOT contain them.

## 15. Issuance Protocol

The V1 issuance sequence is:

1. The issuer obtains its registered `issuerId`.
2. The issuer generates a fresh `issuanceNonce`.
3. The issuer derives `credentialId`.
4. The holder generates a fresh `subjectSecret` locally.
5. The holder derives `subjectCommitment` and sends only the commitment to the issuer.
6. The issuer constructs and validates `CredentialStatementV1`.
7. The issuer generates a fresh `credentialOpening`.
8. The issuer derives `credentialCommitment` with `persistentCommit`.
9. The issuer derives `signatureMessage` and signs it with the registered issuer key.
10. The issuer delivers the private credential package to the holder through an authenticated confidential channel.
11. The credential registration circuit validates the applicable constructions and appends the credential leaf to the credential registry.
12. After finalization, the issuer retains the private `IssuerRevocationRecordV1`, including the exact issuance nonce and assigned credential index, and the holder records the index and obtains the registry witness data required for later proofs.

The issuer MUST NOT issue a package whose credential statement, commitment, and signature disagree.

An issued but unregistered package is an issuer-authenticated artifact, but it is not a registered JustProof credential and MUST NOT satisfy a proof requiring registry membership.

## 16. Registration Relationship

The credential registry MUST derive its leaf from exactly:

```text
credentialId
credentialCommitment
```

using the frozen credential-leaf construction defined by the Merkle specification.

The complete credential, subject secret, issuance nonce, credential opening, and issuer signature MUST NOT be stored in the credential leaf.

The public ledger is required to expose the authoritative credential root and registry counter. This specification does not require individual credential IDs, commitments, or leaves to be exposed as standalone public ledger fields.

Registration MUST NOT change the credential statement, credential ID, subject commitment, credential commitment, or issuer signature.

## 17. Revocation Relationship

Revocation is separate from the credential and credential registry.

V1 revocation is:

- credential-level
- current-state
- monotonic; and
- irreversible

The only transition is:

```text
NOT_REVOKED → REVOKED
```

Revocation MUST NOT modify or delete the credential statement, credential ID, subject commitment, credential commitment, issuer signature, credential leaf, or credential-registry membership.

V1 does not support unrevocation, scheduled revocation, historical validity proofs, or revocation timestamps as part of the credential schema. If a credential is revoked in error, the issuer MUST issue a new credential with a new issuance nonce and credential ID.

The revocation specification defines how the current revocation root authenticates the revocation state at the credential's immutable registry index.

Issuer-authorized revocation MUST rederive the credential ID from the current authenticated issuer ID and the exact issuance nonce retained in `IssuerRevocationRecordV1`. This issuer-side binding does not require the holder's subject secret, credential opening, complete statement, or participation.

## 18. Temporal Semantics

All V1 timestamps are Unix time in seconds from `1970-01-01T00:00:00Z` and use `Uint<64>`.

`issuedAt` is inclusive. `expiresAt` is exclusive.

For current block time `T`, the expiration condition is:

```text
issuedAt <= T
AND
(expiresAt == 0 OR T < expiresAt)
```

An `expiresAt` value of `0` means that the credential does not expire. No actual expiration timestamp may use `0`.

For on-chain current-validity verification, the Compact circuit MUST express the boundary with the standard-library block-time comparison circuits rather than accepting a prover-selected clock:

```text
blockTimeGte(issuedAt)
AND
(expiresAt == 0 OR blockTimeLt(expiresAt))
```

V1 verification is current-state verification. Historical verification at an arbitrary supplied timestamp is outside scope.

## 19. Credential Lifecycle

The V1 lifecycle is:

```text
UNISSUED
    ↓ issuer creates and signs package
ISSUED
    ↓ authorized registration
REGISTERED
    ├── current and unexpired → PROVABLE
    ├── current time reaches expiresAt → EXPIRED
    └── authorized revocation → REVOKED
```

`PROVABLE` describes a holder who possesses the required private state and current registry witnesses. It is not a permanent on-chain status.

`EXPIRED` is derived from the current block time and immutable credential fields. `REVOKED` is derived from the current revocation registry. Neither state mutates the credential.

## 20. Current Qualification Proof Requirements

A valid V1 qualification proof MUST jointly establish:

1. `protocolVersion == 1`
2. the credential ID is correctly derived from the issuer ID and private issuance nonce
3. the subject commitment is correctly opened with the private subject secret
4. the credential commitment is correctly opened with the private credential statement and credential opening
5. the issuer signature message is correctly derived
6. the issuer signature verifies under the registered issuer verification key
7. the issuer leaf is a member of the authoritative current issuer root
8. the credential leaf binds the same credential ID and credential commitment
9. the credential leaf is a member of the authoritative current credential root
10. the corresponding current revocation position is unrevoked
11. the qualification type and version satisfy the exact proof request
12. the current block time satisfies the issuance and expiration rules; and
13. the proof is bound to the public request parameters required by the verification protocol

Every private component MUST refer to the same credential. A prover MUST NOT be able to combine one credential's statement, another credential's signature, a third credential's Merkle path, or an unrelated subject secret.

## 21. Private and Public Boundary

The following values are private by default:

- the complete credential statement
- issuance nonce
- subject secret
- credential opening
- issuer signature
- credential ID
- credential commitment
- credential and revocation Merkle paths
- credential registry index; and
- any presentation metadata identifying the holder

The following values are authoritative public state:

- protocol deployment and contract address
- issuer root and next issuer index
- credential root and next credential index
- revocation root; and
- circuit verifier keys and other network-required contract metadata

A particular proof request MAY intentionally disclose the issuer ID or qualification type. Such disclosure MUST be explicit in the proof statement.

The protocol MUST NOT assume that a value remains private merely because the frontend does not display it. Transaction arguments, disclosed circuit values, returned exported-circuit values, emitted events, and public ledger fields are public.

When a Compact circuit moves witness-derived information into public state, the implementation MUST use `disclose` only at the smallest intentional boundary. An implementation MUST NOT wrap an entire private credential or compound private object in `disclose` when only a derived root or explicitly public value is required.

## 22. Human-Readable Credentials

A holder MAY receive a PDF, image, web view, or other human-readable certificate generated from the private credential package.

Presentation artifacts are non-authoritative. They MUST NOT be treated as proof merely because they contain a logo, certificate number, QR code, signature image, or issuer name.

Human-readable fields such as a holder name MAY appear in a private presentation artifact without becoming V1 cryptographic fields. If such a field is not in `CredentialStatementV1`, a JustProof V1 proof does not authenticate it.

A QR code MAY initiate a JustProof verification flow or encode non-sensitive routing metadata. It MUST NOT require embedding the private credential package, subject secret, credential opening, or issuer signature in a publicly scannable artifact.

OCR of a presentation artifact is not an authoritative credential-import path in V1. A structured private credential package is required for proof generation.

## 23. Security Properties

Assuming secure randomness and the security of the Compact primitives, V1 provides:

- **Instance separation:** fresh issuance nonces produce distinct credential IDs.
- **Holder binding:** a proof requires knowledge of a credential-specific subject secret.
- **Credential hiding:** `persistentCommit` hides the credential statement using a fresh 32-byte opening.
- **Credential binding:** changing the committed statement invalidates the commitment opening.
- **Issuer authenticity:** the issuer signature authenticates the credential ID and commitment.
- **Registry binding:** Merkle membership binds the credential to authoritative issuer and credential roots.
- **Current-state invalidation:** the current revocation root can invalidate an otherwise authentic registered credential.
- **Selective verification:** the verifier can learn the requested qualification result without receiving the complete credential.

## 24. Threat Model and Limitations

V1 assumes:

- the issuer and holder use cryptographically secure random sources
- the issuer protects its signing key and retained private revocation record, including the issuance nonce
- the holder protects the subject secret, credential opening, issuance nonce, and private package
- the registry authority follows the frozen issuer-registration rules
- the Compact compiler, runtime, proof system, and network satisfy their documented security assumptions; and
- application-side representations match Compact through cross-runtime test vectors

V1 does not prevent:

- an authorized issuer from issuing a false or misleading credential
- a holder from voluntarily transferring the private package and subject secret
- loss of access when the holder loses required private state
- correlation through information intentionally disclosed by a proof request
- compromise of private data by a remote or untrusted proof service; or
- metadata leakage outside the cryptographic protocol

The proof server processes witness data during proof generation. Production deployments SHOULD keep proof generation and the proof server within a holder-controlled or explicitly trusted environment.

## 25. Non-Goals

V1 does not provide:

- a decentralized identity system
- real-world identity proof
- wallet-address binding
- arbitrary credential schemas or claims
- W3C Verifiable Credentials interoperability
- issuer key rotation or issuer lifecycle status
- credential modification or deletion
- unrevocation or historical verification
- nullifiers or one-time presentations
- recovery of lost holder secrets
- encrypted on-chain credential storage; or
- authoritative verification from a PDF, image, or OCR result

## 26. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. The credential statement has exactly the frozen fields, types, order, and semantics.
2. Protocol version, qualification type, and qualification version equal their frozen V1 values.
3. Every issuance uses a fresh issuance nonce, subject secret, and credential opening.
4. Credential ID derivation uses the frozen typed input and domain tag.
5. Subject commitment derivation uses `persistentCommit` with the frozen value, domain tag, and subject secret.
6. Credential commitment derivation uses `persistentCommit` with the frozen value, domain tag, and credential opening.
7. The issuer signature message uses the frozen typed input and domain tag.
8. Issuer signatures use secp256k1 ECDSA and are verified in-circuit against a registry-authenticated `Secp256k1Point`.
9. No cryptographic construction hashes or signs arbitrary JSON or a presentation artifact.
10. Credential ID, subject commitment, credential commitment, and issuer signature are immutable after issuance.
11. Credential registration and revocation do not mutate the credential.
12. Revocation does not remove credential-registry membership.
13. A reissued credential receives a new credential ID.
14. Current validity uses current authoritative registry state and Compact block time.
15. A valid signature is not treated as issuer registration.
16. Credential membership is not treated as current validity.
17. Holder-secret knowledge is not treated as real-world identity proof.
18. Private credential material is not stored as public ledger state.
19. Presentation metadata is not treated as a cryptographic credential field.
20. The verifier learns only the public statement and any values intentionally disclosed by that statement.
21. Issuer-authorized revocation rederives the credential ID from the authenticated issuer ID and the retained issuance nonce.

## 27. Required Test Vectors and Tests

Before the V1 implementation is considered conformant, it MUST include cross-runtime vectors that match Compact and TypeScript for:

- all four domain-tag constants
- the founding qualification-type constant
- credential ID derivation
- subject commitment opening
- credential commitment opening
- issuer signature-message derivation; and
- secp256k1 ECDSA verification

The suite MUST also test:

- the `expiresAt == 0` sentinel
- the exact `issuedAt` inclusive boundary
- the exact `expiresAt` exclusive boundary
- modified credential fields
- incorrect issuance nonce
- incorrect subject secret
- incorrect credential opening
- signature from another issuer
- unregistered issuer
- incorrect credential path or root
- revoked credential
- wrong issuer/nonce/credential-ID binding during revocation
- wrong qualification request
- proof input mixing across credentials; and
- absence of private values from ledger state, events, exported outputs, logs, and analytics

A changed cryptographic vector is a protocol change, not an ordinary regression update.

## 28. Specification Ownership

To prevent future drift, this document is authoritative for:

- `CredentialStatementV1`
- credential ID construction
- subject commitment construction
- credential commitment construction
- issuer signature-message construction
- the secp256k1 ECDSA credential-signature choice; and
- expiration boundaries

Other protocol documents MUST reference these definitions rather than restating incompatible alternatives.

The issuer-registry specification is authoritative for issuer-ID, issuer-leaf, registry-authority, root, and membership rules.

The commitments specification is authoritative for the security analysis and implementation constraints of the commitment constructions, but MUST use the exact constructions frozen here.

The Merkle specification is authoritative for credential-leaf, internal-node, empty-tree, path, root, depth, and index rules.

The revocation specification is authoritative for current revocation state and transitions.

The witness, proof, and verification specifications are authoritative for how these frozen credential values enter and are constrained by a proof.

## 29. Reference Flow

```text
Issuer                     Holder                     Midnight
  │                           │                           │
  │ generate nonce            │                           │
  │ derive credential ID      │                           │
  │ ─── issuance context ───► │                           │
  │                           │ generate subject secret   │
  │ ◄── subject commitment ── │                           │
  │ build statement           │                           │
  │ commit statement          │                           │
  │ sign commitment           │                           │
  │ ── private package ─────► │                           │
  │                           │                           │
  │ register credential ───────────────────────────────► │
  │                           │ ◄── index/path/state ─── │
  │                           │                           │
  │                           │ generate private proof    │
  │                           │ ───── proof only ───────► │
  │                           │                           │ verify current
  │                           │                           │ qualification
```

The protocol's central guarantee is:

> A holder can prove control of a currently valid, registered, issuer-authenticated V1 qualification credential without giving the verifier the credential itself.

## 30. Implementation References

This specification is aligned with the official Midnight documentation for the pinned toolchain:

- [Compact toolchain 0.31.0 release notes](https://docs.midnight.network/relnotes/compact/toolchain-0.31.0)
- [Compact standard-library API](https://docs.midnight.network/compact/standard-library/exports)

These references are informative. The frozen constants and protocol semantics in this document are normative for JustProof V1.
