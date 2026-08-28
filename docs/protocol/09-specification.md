# JustProof V1 Protocol Specification

- **Status:** Frozen
- **Protocol Version:** V1
- **Compact Language Version:** `0.23`

This document defines the frozen cryptographic and semantic decisions for the JustProof V1 protocol.

The component documents under `docs/protocol/` describe individual parts of the protocol. This document consolidates their normative decisions into one implementation target.

The Compact implementation MUST conform to this specification. Implementation details MAY differ where they do not alter the protocol semantics, cryptographic constructions, public interfaces, or security properties defined here.

## 1. Protocol Scope

JustProof V1 provides privacy-preserving proof of qualification ownership.

A credential issuer can:

1. register as an issuer
2. issue a credential to a holder
3. register the credential on-chain
4. revoke a previously issued credential

A credential holder can prove, without revealing the underlying credential, that:

1. the credential was issued by a registered issuer
2. the issuer's signature is valid
3. the credential is registered
4. the credential satisfies the requested qualification claim
5. the holder controls the credential
6. the credential was valid at the relevant verification time; and
7. the credential had not been revoked at that time

V1 deliberately excludes functionality that is not necessary to establish these guarantees.

## 2. Implementation Baseline

The V1 Compact implementation MUST use:

```compact
pragma language_version 0.23;
```

The protocol specification is independent of Compact syntax, but the V1 implementation MUST target Compact language version `0.23`.

Protocol semantics MUST NOT be changed merely to accommodate a newer language version.

A future protocol version MAY target a different Compact language version.

## 3. Cryptographic Primitives

V1 uses a hash-based commitment architecture and Merkle authentication structures.

The implementation MUST use a cryptographic hash primitive supported by the V1 Midnight/Compact environment.

The same underlying hash primitive SHOULD be reused throughout the protocol unless a specific protocol component requires otherwise.

Every distinct cryptographic purpose MUST use domain separation.

The following domain labels are reserved:

```text
JP:ISSUER:ID:V1
JP:CREDENTIAL:ID:V1
JP:SUBJECT:V1
JP:CREDENTIAL:COMMITMENT:V1
JP:CREDENTIAL:SIGNED:V1
JP:MERKLE:LEAF:V1
JP:MERKLE:NODE:V1
JP:REVOCATION:LEAF:V1
```

Additional domains MUST NOT reuse an existing domain for a different semantic purpose.

## 4. Canonical Encoding

All values that participate in hashing or signing MUST have a deterministic canonical representation.

The protocol MUST NOT hash or sign language-specific object serialization, JSON serialization, or other application-level representations whose encoding is not explicitly defined.

The canonical encoding rules MUST specify:

- field ordering
- field types
- integer widths
- integer byte order
- byte-string representation
- optional-value representation
- enumeration representation; and
- protocol version representation

Where a field has a fixed-width representation, the width MUST be fixed by the protocol.

The canonical encoding MUST produce exactly one byte sequence for a given semantic credential.

## 5. Issuer Identity

An issuer has a distinct registered identifier.

The issuer identifier is independent of the issuer's verification key.

Conceptually:

```text
issuerId = H(
    "JP:ISSUER:ID:V1" ||
    issuerIdentifierMaterial
)
```

The exact identifier material MUST be deterministic and assigned as part of issuer registration.

The issuer registry binds the identifier to the issuer's verification key.

An issuer's verification key is immutable after registration.

V1 does not support issuer key rotation.

Changing an issuer's verification key requires registration of a new issuer identity.

This deliberately avoids key-history and key-validity-period complexity in V1.

## 6. Issuer Registration

An issuer MUST be registered before credentials issued by that issuer can be accepted by the JustProof protocol.

An issuer registration establishes at minimum:

```text
issuerId
verificationKey
issuerStatus
```

V1 issuer status is intentionally minimal.

An issuer MAY be:

```text
ACTIVE
SUSPENDED
```

Only an active issuer MAY perform operations that require an active issuer.

Issuer registration is distinct from credential issuance.

## 7. Credential Identity

Every credential issuance MUST have a unique credential identifier.

The credential identifier identifies a specific credential instance.

Two credentials MAY contain identical semantic credential data and still have different credential identifiers.

This is achieved through an issuance-specific nonce.

Conceptually:

```text
credentialId = H(
    "JP:CREDENTIAL:ID:V1" ||
    issuerId ||
    issuanceNonce
)
```

where:

```text
issuanceNonce = unpredictable issuance-specific value
```

The issuance nonce MUST be unique with overwhelming probability.

The credential ID is not itself the credential commitment.

The credential ID identifies **which credential instance exists**.

## 8. Subject Commitment

The credential MUST NOT require the holder's real-world identity to be stored on-chain.

Instead, the credential contains a commitment to a private holder-controlled secret.

Conceptually:

```text
subjectCommitment = H(
    "JP:SUBJECT:V1" ||
    subjectSecret
)
```

The holder proves knowledge of the corresponding secret during verification.

The subject secret MUST remain private.

V1 does not require a globally identifiable subject identifier.

## 9. Credential Semantics

A credential consists of semantic fields whose values determine the meaning and validity of the credential.

For the founding Midnight Academy Builder Certification, the semantic credential MUST support at least:

```text
credentialId
issuerId
subjectCommitment
qualificationType
qualificationVersion
issuedAt
expiresAt
issuanceNonce
```

Additional fields MAY be introduced only if they are included in the frozen credential schema before implementation.

Presentation-only information MUST NOT be treated as credential semantics.

Examples include:

- certificate image
- logo
- typography
- display formatting
- image URL
- presentation metadata

Changing presentation information MUST NOT alter the credential's semantic identity.

## 10. Credential Commitment

The credential commitment commits to every semantic credential field whose alteration would change the meaning, identity, or validity of the credential.

Conceptually:

```text
credentialCommitment = H(
    "JP:CREDENTIAL:COMMITMENT:V1" ||
    canonicalSemanticCredential
)
```

The commitment MUST NOT depend on application-specific object serialization.

The credential commitment and credential identifier serve different purposes:

```text
credentialId
    → identifies the credential instance

credentialCommitment
    → commits to the credential's semantic contents
```

The credential identifier SHOULD NOT be included inside the credential commitment unless required by a future protocol revision.

The relationship between the identifier and commitment is established by the credential Merkle leaf.

## 11. Issuer Signature

The issuer MUST cryptographically authenticate the credential statement.

The issuer MUST sign a well-defined protocol message rather than an arbitrary application object.

Conceptually:

```text
signedCredential = H(
    "JP:CREDENTIAL:SIGNED:V1" ||
    credentialId ||
    credentialCommitment
)
```

The issuer signature is:

```text
signature = Sign(
    issuerVerificationKey,
    signedCredential
)
```

The exact signature primitive, public-key representation, signature representation, and verification procedure MUST be the implementation supported by the V1 Midnight/Compact environment.

The signature MUST bind:

```text
issuer
    +
credentialId
    +
credentialCommitment
```

A valid signature therefore authenticates the relationship between a specific credential instance and its committed contents.

## 12. Credential Registry

The credential registry is an append-only authenticated registry.

A successfully registered credential MUST remain represented in the credential registry.

Credential registration is immutable.

Credentials MUST NOT be removed from the credential registry when revoked.

The registry root represents the ordered sequence of all credentials ever successfully registered.

Thus, revocation does not modify credential-registry membership.

## 13. Credential Merkle Tree

The credential registry uses an append-only binary Merkle tree.

A credential leaf is derived from the credential commitment and is bound to the credential identifier.

Conceptually:

```text
credentialLeaf = H(
    "JP:MERKLE:LEAF:V1" ||
    credentialId ||
    credentialCommitment
)
```

The Merkle layer therefore does not depend on the private representation of the credential.

The tree commits only to the protocol-level credential identifier and commitment.

Internal nodes are constructed as:

```text
parent = H(
    "JP:MERKLE:NODE:V1" ||
    leftChild ||
    rightChild
)
```

The tree MUST define deterministic behavior for:

- tree depth
- insertion order
- empty nodes
- left/right child ordering
- incomplete final levels; and
- membership paths

These parameters MUST be frozen before the Compact implementation is considered protocol-complete.

## 14. Credential Registry Root

The credential registry root commits to all credentials ever registered.

A root represents a particular state of the append-only registry.

A credential membership proof MUST establish that the credential leaf corresponding to:

```text
credentialId
credentialCommitment
```

exists under the claimed credential registry root.

The credential registry does not encode current credential validity.

Current validity is determined by combining credential semantics with issuer and revocation state.

## 15. Revocation Registry

V1 uses a separate revocation registry.

Revocation MUST NOT mutate or remove the corresponding credential from the credential registry.

A revocation record binds a credential identifier to the time at which the credential became revoked.

Conceptually:

```text
revocationRecord {
    credentialId
    revokedAt
}
```

The revocation record is authenticated independently from the credential registry.

## 16. Revocation Merkle Structure

The revocation registry is an authenticated data structure separate from the credential registry.

A revocation leaf is conceptually:

```text
revocationLeaf = H(
    "JP:REVOCATION:LEAF:V1" ||
    credentialId ||
    revokedAt
)
```

The revocation structure MUST support proving the temporal revocation status of a credential.

For V1, the preferred representation is a credential-ID-keyed sparse Merkle structure where absence of a revocation record represents non-revocation.

The exact sparse-tree parameters, including:

- tree depth
- key derivation
- empty value
- leaf encoding
- internal-node encoding; and
- non-membership proof representation

MUST be frozen before Compact implementation.

The revocation structure MUST NOT require storage of the credential's private contents.

## 17. Revocation Semantics

Revocation is temporal.

A credential is considered revoked at and after its `revokedAt` timestamp.

Conceptually:

```text
verificationTime < revokedAt
    → credential was not yet revoked

verificationTime >= revokedAt
    → credential was revoked
```

A credential that has never been revoked has no revocation record.

V1 revocation is irreversible.

V1 does not support unrevocation.

A revoked credential remains present in the credential registry but is no longer valid for verification at or after its revocation time.

## 18. Credential Expiration

Expiration is independent of revocation.

A credential MAY contain an `expiresAt` value.

If `expiresAt` is absent, the credential does not expire under the credential's expiration rule.

For a credential with an expiration time:

```text
verificationTime < expiresAt
```

is required for validity.

Expiration MUST NOT be represented as revocation.

This distinction preserves the difference between:

```text
expiration
    → credential naturally ceased to be valid

revocation
    → issuer explicitly invalidated the credential
```

## 19. Credential Validity

For a verification time `T`, a credential is valid only if all required conditions hold.

At minimum:

```text
credential is registered
AND
issuer is registered and authorized
AND
issuer signature is valid
AND
credential semantics satisfy the requested claim
AND
holder controls the subject secret
AND
issuedAt <= T
AND
(
    expiresAt is absent
    OR
    T < expiresAt
)
AND
(
    credential has no revocation record
    OR
    T < revokedAt
)
```

The exact verification circuit MAY prove additional conditions required by the selected credential type.

## 20. Verification Proof

The V1 verification proof is a zero-knowledge proof of credential validity and holder possession.

The prover MUST be able to demonstrate knowledge of the private values necessary to establish the validity of the credential.

Private proof inputs MAY include:

```text
credential
issuanceNonce
subjectSecret
issuerSignature
credentialMerklePath
revocationMerklePath
```

Public inputs SHOULD contain only information necessary for verification.

The underlying credential SHOULD remain private.

The verifier MUST be able to verify the qualification claim without receiving the complete credential.

## 21. Public Verification Data

V1 should minimize public disclosure.

The proof MAY expose:

```text
issuerId
qualificationType
verificationTime
credentialRoot
revocationRoot
```

as required by the verification interface.

The credential identifier MAY remain private.

A verification flow MUST NOT reveal the credential merely because the credential identifier is used internally by the registry or revocation structure.

Credential-ID disclosure MAY be supported as an explicit presentation option without changing the underlying credential protocol.

## 22. Replay and Nullifiers

V1 does not require nullifiers by default.

A proof is not considered invalid merely because an identical proof can be presented more than once.

Nullifiers MUST NOT be introduced unless a V1 use case requires prevention of repeated use.

Future protocol versions MAY introduce domain-specific nullifiers for applications requiring one-time or limited-use credential presentations.

## 23. V1 Deliberate Non-Features

The following are intentionally excluded from V1:

- issuer key rotation
- issuer key history
- issuer key validity periods
- credential deletion
- credential modification
- credential unrevocation
- revocation history beyond the effective revocation timestamp
- mandatory global subject identifiers
- mandatory credential-ID disclosure
- nullifiers
- multiple signature schemes
- arbitrary credential schemas
- generalized credential interoperability standards
- complex issuer lifecycle states

These features MAY be considered in future protocol versions.

Their absence is intentional and MUST NOT be treated as an implementation gap.

## 24. Founding Qualification

The founding demonstration credential for JustProof is the **Midnight Academy Builder Certification**.

This credential is used to validate the V1 protocol implementation.

The founding credential MUST exercise the complete V1 lifecycle:

```text
issuer registration
        ↓
credential issuance
        ↓
credential registration
        ↓
private credential possession
        ↓
zero-knowledge verification
        ↓
credential revocation
        ↓
temporal verification failure
```

The founding credential is a protocol demonstration and MUST NOT imply that JustProof is an authorized representative of Midnight Academy.

## 25. Protocol Invariants

The following invariants MUST hold:

### Issuer identity

```text
issuerId uniquely identifies an issuer registration.
```

### Issuer key

```text
issuerId → one immutable verification key
```

### Credential identity

```text
credentialId uniquely identifies a credential issuance.
```

### Credential commitment

```text
credentialCommitment commits to all semantic credential fields.
```

### Credential registry

```text
registered credential → immutable registry membership
```

### Revocation

```text
revocation does not remove credential registry membership
```

### Temporal validity

```text
T >= revokedAt → revoked
T >= expiresAt → expired
```

### Privacy

```text
private credential data is not required to be revealed to verify a qualification claim.
```

### Holder possession

```text
valid proof requires knowledge of the credential holder's private subject secret.
```

## 26. Implementation Rule

The Compact implementation MUST implement these protocol semantics directly.

Where an implementation detail is not specified here, the implementation MAY choose the simplest correct representation that:

1. preserves the protocol semantics
2. preserves the cryptographic security properties
3. is compatible with Compact language version `0.23`
4. does not unnecessarily expose private information; and
5. does not introduce additional protocol complexity

If an implementation requirement forces a change to any normative decision in this document, the protocol specification MUST be updated and re-frozen before implementation proceeds.

## 27. V1 Freeze

This specification constitutes the V1 protocol baseline.

Before Compact implementation begins, the following remaining low-level parameters MUST be explicitly recorded:

- exact hash primitive and representation
- exact canonical byte encoding
- exact issuer-ID material
- exact issuance nonce representation
- exact signature primitive and encoding
- exact Merkle tree depth
- exact empty-node construction
- exact append-only insertion algorithm
- exact sparse revocation-tree parameters
- exact timestamp representation; and
- exact Compact circuit public/private interfaces

Once those parameters are frozen, changes to them constitute protocol changes rather than ordinary implementation changes.
