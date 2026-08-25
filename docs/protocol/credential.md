# JustProof Credential Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Version:** `V1`
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

The JustProof Credential Protocol defines a privacy-preserving format for issuing, holding, and proving qualifications.

The protocol allows an issuer to create a cryptographically authenticated credential describing a qualification awarded to a subject. A credential holder can subsequently prove selected properties of that credential without publishing the underlying credential or exposing unnecessary personal information.

The protocol separates three concerns:

1. **Credential issuance:** an authorized issuer creates and signs a credential.
2. **Credential publication:** a cryptographic commitment to the credential is recorded on Midnight.
3. **Credential proof:** a holder proves that a credential satisfies specified conditions without revealing the credential itself.

The protocol does not require the human-readable representation of a credential, such as a PDF or image, to be stored on-chain.

## 2. Design Goals

Version 1 has the following goals:

- provide a deterministic representation of a qualification credential
- allow credentials to be cryptographically authenticated by their issuer
- provide a stable credential identifier
- allow credential commitments to be verified on-chain
- allow holders to prove credential properties privately
- prevent unnecessary disclosure of the holder's credential data
- separate issuer identity from individual credential data
- support credential revocation without exposing the credential contents
- make the cryptographic protocol independent of the frontend
- make protocol behavior testable independently of the Midnight UI

The protocol intentionally does **not** attempt to define:

- a visual certificate design
- a particular frontend framework
- a particular wallet implementation
- an issuer's internal database
- a universal identity system for credential subjects

## 3. Terminology

| Term                      | Definition                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| **Issuer**                | An entity authorized to issue JustProof credentials.                                     |
| **Holder**                | The entity possessing a credential and its associated private data.                      |
| **Verifier**              | An entity requesting or validating a proof.                                              |
| **Credential**            | The canonical structured representation of a qualification.                              |
| **Credential ID**         | A deterministic identifier derived from the credential.                                  |
| **Credential commitment** | A cryptographic commitment to a credential.                                              |
| **Issuer signature**      | A digital signature authenticating the credential as issued by an issuer.                |
| **Proof**                 | A zero-knowledge proof demonstrating that specified credential conditions are satisfied. |
| **Issuer registry**       | The on-chain registry used to determine whether an issuer is authorized.                 |
| **Revocation**            | The process of invalidating an otherwise authentic credential.                           |
| **Claim**                 | A machine-readable statement contained in a credential.                                  |

## 4. Protocol Versioning

All cryptographic domain-separated values include the protocol version.

The version namespace for this specification is:

```text
JP:CREDENTIAL:V1
```

A protocol implementation MUST NOT silently interpret a credential created under another protocol version as a Version 1 credential.

Changes to any of the following require a new protocol version:

- credential serialization
- hash construction
- signature construction
- field semantics
- identifier derivation
- commitment construction
- proof semantics

Implementations MAY support multiple protocol versions simultaneously, but each credential MUST explicitly identify the protocol version under which it was created.

## 5. Credential Model

A credential consists of two conceptual layers:

1. **Public protocol metadata**
2. **Credential claims**

The credential is represented as a canonical structured object before cryptographic processing.

A Version 1 credential has the following logical structure:

```text
Credential {
    version
    credentialId
    issuerId
    subject
    qualification
    issuedAt
    expiresAt
    claims
    signature
}
```

The exact serialized representation MUST be deterministic.

Two semantically identical credentials MUST produce identical canonical representations and therefore identical cryptographic identifiers.

## 6. Credential Fields

### 6.1 `version`

Identifies the protocol version.

For Version 1:

```text
version = V1
```

The version MUST be included in all credential-domain cryptographic operations.

### 6.2 `credentialId`

Uniquely identifies the credential.

The identifier is derived from the canonical credential contents rather than being an arbitrary issuer-assigned value.

The credential identifier MUST be deterministic.

Conceptually:

```text
credentialId = H("JP:CREDENTIAL:V1:ID" || canonicalCredential)
```

The exact encoding of the input components is defined by the canonical serialization rules in this specification.

The credential identifier MUST NOT depend on:

- the credential's human-readable PDF
- the filename of a certificate
- the frontend
- the blockchain transaction identifier

### 6.3 `issuerId`

Identifies the issuer responsible for issuing the credential.

The issuer identifier MUST resolve to an issuer registered with the JustProof issuer registry.

The credential itself does not establish issuer authorization.

Issuer authorization is established by resolving `issuerId` against the issuer registry.

### 6.4 `subject`

Identifies the credential subject.

Version 1 SHOULD avoid requiring a plaintext personal identifier.

A subject MAY instead be represented using a holder-controlled identifier or commitment.

The protocol MUST NOT require a verifier to learn the subject's underlying personal identity merely to establish that a qualification is authentic.

### 6.5 `qualification`

Identifies the qualification awarded by the issuer.

Examples include:

```text
Midnight Builder
Certified JavaScript Developer
Blockchain Security Specialist
```

The qualification name is a semantic claim and MUST be represented canonically.

Where a qualification requires additional structured information, that information MUST be represented as explicit claims rather than encoded into a free-form string.

### 6.6 `issuedAt`

The timestamp at which the issuer issued the credential.

The timestamp MUST use a deterministic representation.

Version 1 uses Unix time in seconds:

```text
issuedAt: uint64
```

### 6.7 `expiresAt`

Defines when the credential expires.

A credential that does not expire MAY use an agreed sentinel value.

The sentinel value MUST be defined by the implementation rather than inferred from an omitted field.

### 6.8 `claims`

Contains the machine-readable qualification claims.

Claims MUST have deterministic names and values.

For example:

```text
claims = {
    level: "professional",
    score: 92,
    course: "Midnight Academy"
}
```

A verifier MUST be able to prove a property of a claim without necessarily revealing the claim's value.

For example, a proof may establish:

```text
score >= 80
```

without revealing:

```text
score = 92
```

### 6.9 `signature`

Contains the issuer's cryptographic signature over the canonical unsigned credential.

The signature MUST NOT be calculated over itself.

Conceptually:

```text
signature = Sign(
    issuerPrivateKey,
    credentialSigningMessage
)
```

The corresponding issuer public key is obtained through the issuer registry.

## 7. Canonical Credential Representation

Cryptographic operations MUST operate on a canonical representation.

The protocol MUST NOT hash or sign:

- JSON with arbitrary property ordering
- JSON containing insignificant whitespace
- language-specific object serialization
- a human-readable certificate
- a JavaScript object directly

The canonical representation MUST define:

- field ordering
- field names
- integer encoding
- string encoding
- optional-field behavior
- array ordering
- boolean representation
- null representation
- byte encoding

An implementation MUST produce exactly the same canonical representation for the same logical credential.

For Version 1, UTF-8 is used for textual values.

## 8. Cryptographic Domain Separation

All protocol hashes MUST use explicit domain separation.

The Version 1 credential namespace is:

```text
JP:CREDENTIAL:V1
```

Different cryptographic purposes MUST use different domain-separated labels.

For example:

```text
JP:CREDENTIAL:V1:ID
JP:CREDENTIAL:V1:COMMITMENT
JP:CREDENTIAL:V1:SIGNATURE
JP:CREDENTIAL:V1:SUBJECT
```

A hash used for one purpose MUST NOT be reused for another purpose merely because the underlying input is identical.

This prevents structurally different protocol operations from unintentionally sharing the same cryptographic domain.

## 9. Credential Identifier

The credential identifier provides a stable cryptographic identifier for a credential.

Conceptually:

```text
CREDENTIAL_ID =
    H(
        "JP:CREDENTIAL:V1:ID" ||
        canonicalCredential
    )
```

The identifier MUST be derived from all fields whose modification would constitute a materially different credential.

Consequently, changing any credential claim MUST produce a different credential identifier.

The identifier is not itself proof of authenticity.

Authenticity requires successful verification of the issuer signature and issuer authorization.

## 10. Credential Commitment

The credential commitment is the value published to the Midnight ledger.

Conceptually:

```text
COMMITMENT =
    H(
        "JP:CREDENTIAL:V1:COMMITMENT" ||
        canonicalCredential
    )
```

The commitment provides a cryptographic binding between the on-chain record and the credential held privately by the holder.

A verifier MUST NOT infer credential contents from the commitment.

The commitment MUST be computationally infeasible to invert under the security assumptions of the selected hash primitive.

## 11. Issuer Authentication

An issuer MUST possess an issuer signing key.

The corresponding issuer identity MUST be registered before credentials issued by that identity are considered valid by the JustProof protocol.

The issuance flow is:

```text
Issuer
  │
  ├── constructs credential
  │
  ├── canonicalizes credential
  │
  ├── computes signing message
  │
  ├── signs credential
  │
  └── gives credential to holder
```

The issuer signature authenticates the credential's contents.

A valid signature alone does not establish that the issuer is currently authorized.

A verifier MUST therefore establish both:

1. the issuer signature is valid; and
2. the issuer is authorized by the issuer registry

## 12. Issuer Registry

The issuer registry is the authoritative source for issuer authorization.

An issuer registry entry associates an issuer identifier with the cryptographic material required to authenticate credentials issued by that issuer.

Conceptually:

```text
IssuerRecord {
    issuerId
    publicKey
    status
}
```

Where:

```text
status ∈ {
    active,
    revoked
}
```

An issuer MUST be in the `active` state for a newly verified credential to be considered valid.

The registry is separate from the credential.

This allows issuer authorization to change without modifying previously issued credential data.

## 13. Credential Lifecycle

A credential progresses through the following lifecycle:

```text
ISSUED
   │
   ▼
PUBLISHED
   │
   ├──────────────► REVOKED
   │
   ▼
PROVABLE
```

### Issued

The issuer has created and signed the credential.

### Published

The credential commitment has been recorded on Midnight.

### Provable

The holder possesses sufficient private information to generate a valid zero-knowledge proof.

### Revoked

The credential has been invalidated by the issuer according to the revocation rules.

A credential MUST NOT be considered valid merely because its commitment exists on-chain.

## 14. Revocation

Credential validity is distinct from credential authenticity.

A credential may have:

- a valid issuer signature
- a valid credential commitment

and nevertheless be revoked.

The protocol therefore treats revocation as an independent state.

The revocation mechanism MUST allow a verifier to determine whether the credential is currently revoked without requiring publication of the credential itself.

Version 1 uses credential-level revocation identified by `credentialId`.

## 15. Proof

A proof allows a holder to demonstrate that a private credential satisfies specified verification conditions.

The holder supplies the credential and any required private values to the local proving environment.

The prover generates a zero-knowledge proof demonstrating the required statements.

Conceptually:

```text
private:
    credential
    issuerSignature
    subject data
    claim values

public:
    credentialId
    issuerId
    requested qualification
    verification parameters
```

The proof MUST reveal only the information required by the verification policy.

For example, a verifier MAY request proof that:

```text
qualification == "Midnight Builder"
```

without learning:

- the holder's complete credential
- unrelated claims
- private subject information
- other credential metadata

## 16. Proof Soundness Requirements

A verifier MUST accept a proof only if the proof establishes all required protocol conditions.

At minimum, Version 1 verification SHOULD establish:

1. the credential conforms to the expected protocol version
2. the credential commitment corresponds to the credential used by the prover
3. the credential identifier is correct
4. the issuer signature is valid
5. the issuer is authorized
6. the credential has not been revoked
7. the requested qualification conditions are satisfied
8. any required temporal conditions are satisfied

The verifier MUST NOT accept a proof merely because the prover knows a credential-shaped value.

## 17. Privacy Requirements

The protocol is designed around data minimization.

A verifier SHOULD receive only:

- the proof
- public verification inputs
- information intentionally disclosed by the holder

The verifier SHOULD NOT receive the complete credential unless the holder explicitly chooses to disclose it.

The Midnight ledger MUST NOT contain:

- the holder's complete credential
- plaintext personal information
- private claim values
- issuer private keys
- holder private state

The ledger may contain cryptographic commitments, issuer registry information, revocation information, and other public verification state required by the protocol.

## 18. Human-Readable Credentials

A human-readable certificate MAY be generated from the structured credential.

Examples include:

- PDF certificates
- images
- printable certificates
- web-based credential views

These representations are presentation artifacts and are not authoritative protocol objects.

The authoritative credential is the canonical structured credential.

A visual certificate MUST NOT be treated as proof of authenticity merely because it contains:

- a logo
- a QR code
- a certificate number
- an issuer name
- a signature image

Authenticity is established through the cryptographic protocol.

## 19. Credential Publication

Publishing a credential does not require publishing the credential contents.

The holder or issuer publishes the cryptographic information required to establish the credential's existence and later verify proofs.

Conceptually:

```text
credential
    │
    ▼
canonicalization
    │
    ▼
credential commitment
    │
    ▼
Midnight contract
    │
    ▼
on-chain verification state
```

The published state MUST be sufficient for a verifier to determine whether a proof refers to an authentic and currently valid credential.

## 20. Separation of Private and Public State

The protocol distinguishes between private credential data and public verification state.

### Private state

Examples:

- complete credential
- private claims
- subject information
- issuer signature
- holder secrets required by the proving protocol

### Public state

Examples:

- issuer registry entries
- credential commitments
- credential identifiers
- revocation state
- other values explicitly designated as public protocol inputs

Private state MUST NOT be published to the ledger.

## 21. Threat Model

Version 1 assumes:

- cryptographic primitives are secure
- issuer private keys remain secret
- the issuer registry correctly represents issuer authorization
- canonicalization is implemented deterministically
- the Midnight ledger provides the expected integrity guarantees
- the zero-knowledge proving system provides computational soundness and zero-knowledge under its documented assumptions

The protocol does not protect against an issuer intentionally issuing a false credential.

It also does not establish the real-world identity or trustworthiness of an issuer beyond the issuer registration process.

## 22. Non-Goals

Version 1 does not attempt to provide:

- decentralized identity
- anonymous issuer registration
- universal interoperability with W3C Verifiable Credentials
- biometric identity verification
- recovery of lost credentials
- encrypted on-chain credential storage
- decentralized certificate design
- automatic trust in arbitrary issuers

These concerns may be addressed by future protocol versions or application-layer extensions.

## 23. Implementation Boundary

The protocol specification defines **what must be true**.

The Compact contract defines **how public verification state is maintained and verified on Midnight**.

The witnesses define **how private credential information is supplied to Compact circuits**.

The TypeScript application defines **how credentials, proofs, wallets, and user interactions are orchestrated**.

The frontend defines **how the protocol is presented to users**.

The implementation MUST NOT introduce semantics that contradict this specification.

## 24. Version 1 Cryptographic Primitives

The following primitives are protocol-level parameters and MUST be frozen before contract implementation.

| Purpose               | Primitive                       |
| --------------------- | ------------------------------- |
| Hashing               | TBD                             |
| Digital signatures    | TBD                             |
| Credential identifier | Version 1 domain-separated hash |
| Credential commitment | Version 1 domain-separated hash |
| Zero-knowledge proofs | Midnight Compact proving system |
| Canonical encoding    | TBD                             |

The selected primitives MUST be compatible with the Midnight Compact environment and its supported cryptographic types.

Once finalized, changing a primitive requires a new protocol version.

## 25. Normative Invariants

The following invariants MUST hold for every valid Version 1 credential:

1. A credential MUST identify its protocol version.
2. A credential MUST identify its issuer.
3. The issuer MUST be registered before the credential can be considered authorized.
4. The credential MUST have a deterministic canonical representation.
5. The credential identifier MUST be deterministically derived from the canonical credential.
6. The credential commitment MUST be deterministically derived from the canonical credential.
7. The issuer signature MUST authenticate the canonical unsigned credential.
8. A credential commitment MUST NOT reveal the credential contents.
9. A valid proof MUST bind to the credential commitment being verified.
10. A verifier MUST be able to distinguish an authentic credential from a forged credential.
11. A verifier MUST be able to distinguish a valid credential from a revoked credential.
12. Private credential information MUST NOT be required to be published on-chain.
13. Human-readable certificate representations MUST NOT be authoritative.
14. Protocol semantics MUST NOT depend on frontend implementation details.

## 26. Reference Verification Flow

A verifier requesting proof of a qualification follows this conceptual flow:

```text
Verifier
   │
   │ requests proof
   ▼
Holder
   │
   │ selects credential privately
   ▼
Local prover
   │
   ├── validates credential structure
   ├── validates issuer signature
   ├── derives credential identifier
   ├── derives credential commitment
   ├── checks required claims
   └── generates zero-knowledge proof
   │
   ▼
Midnight verification
   │
   ├── checks proof
   ├── checks issuer authorization
   ├── checks credential state
   └── checks requested qualification
   │
   ▼
Verifier receives result
```

At no point does the verifier need to receive the holder's complete credential.

## 27. Protocol Status

This document defines the intended semantics of JustProof Credential Protocol Version 1.

Before the Compact contract is considered protocol-complete, the following MUST be frozen:

- canonical serialization
- hash function
- signature scheme
- public-key representation
- credential identifier construction
- commitment construction
- issuer identifier construction
- issuer registry semantics
- revocation semantics
- credential validity rules
- exact public and private circuit inputs

Contract implementation and protocol tests MUST subsequently conform to these frozen definitions.
