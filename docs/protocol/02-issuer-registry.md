# JustProof Issuer Registry Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies the issuer registry used by the JustProof Credential Protocol to establish which entities are authorized to issue credentials.

The issuer registry provides the public authority layer that connects:

- an issuer identity
- an issuer verification key
- issuer authorization
- credential issuer identifiers
- credential signatures
- proof verification

The registry allows a verifier to distinguish between:

> A credential containing an issuer identifier

and:

> A credential issued by an issuer that JustProof recognizes as authorized.

The issuer registry is therefore a foundational component of credential authenticity.

## 2. Scope

This specification defines:

- issuer identity
- issuer identifiers
- issuer registration
- issuer verification keys
- issuer authorization
- issuer registry state
- credential-to-issuer binding
- issuer lookup
- issuer status
- registry updates
- verification requirements
- registry invariants

This specification does not define:

- the complete credential schema
- credential commitments
- Merkle-tree construction
- zero-knowledge proof construction
- issuer private-key management
- the human-readable certificate format

Those concerns are defined by the corresponding protocol specifications.

## 3. Issuer Model

An issuer is an entity authorized by the JustProof registry to issue credentials under the JustProof protocol.

Conceptually:

```text
Issuer
  │
  ├── issuerId
  ├── verificationKey
  └── registry status
       │
       ▼
Issuer Registry
       │
       ▼
Authorized Issuer
```

An issuer's authorization is represented by public registry state.

The registry MUST be authoritative for determining whether an issuer is recognized by the JustProof protocol.

## 4. Issuer Identity

Every registered issuer MUST have a unique issuer identifier.

The issuer identifier is the canonical reference to the issuer within the credential protocol.

Conceptually:

```text
Issuer
  │
  ▼
issuerId
```

The `issuerId` MUST be deterministic and uniquely identify the registered issuer.

The identifier MUST NOT depend on mutable issuer metadata.

## 5. Issuer Identifier Construction

Version 1 SHOULD derive the issuer identifier from the issuer's canonical verification key.

Conceptually:

```text
issuerId =
    H(
        "JP:CREDENTIAL:V1:ISSUER" ||
        verificationKey
    )
```

The exact hash construction MUST be frozen alongside the cryptographic primitives.

An implementation MUST NOT derive issuer identifiers from:

- issuer display names
- URLs
- email addresses
- mutable metadata
- human-readable organization names

Human-readable issuer information MAY be associated with the issuer, but it MUST NOT be the cryptographic identity of the issuer.

## 6. Issuer Verification Key

Every registered issuer MUST have a public verification key.

The verification key is used to authenticate credentials issued by that issuer.

Conceptually:

```text
Issuer
  │
  ├── private signing key
  │
  └── public verification key
              │
              ▼
        Issuer Registry
```

The private signing key MUST remain under the issuer's control.

The registry MUST store or otherwise make available the corresponding public verification key required for credential verification.

## 7. Issuer Signing Key

The issuer's signing key is private cryptographic material.

The JustProof contract MUST NOT store issuer private keys.

The issuer MUST use its private signing key to authenticate canonical credentials before publication.

Conceptually:

```text
private signing key
        │
        ▼
canonical credential
        │
        ▼
credential signature
```

The corresponding public verification key is obtained from the issuer registry.

## 8. Issuer Registration

An issuer MUST be registered before its credentials can be considered authorized JustProof credentials.

Conceptually:

```text
Issuer
  │
  │ registration
  ▼
Issuer Registry
  │
  ▼
Registered Issuer
```

Registration MUST establish at least:

```text
issuerId
verificationKey
status
```

Additional issuer metadata MAY be associated with the registration.

## 9. Registration Authority

Version 1 MUST define who is permitted to register issuers.

For the initial MVP, the registry SHOULD use a controlled registry authority rather than attempting to implement decentralized governance.

Conceptually:

```text
Qualification Proof Certification Authority
                    │
                    │ register
                    ▼
              Issuer Registry
```

The authority's identity and authorization mechanism MUST be defined by the contract implementation.

The registration authority MUST NOT be confused with the credential issuer.

An authority registers issuers; an issuer signs credentials.

## 10. Issuer Registration Record

A Version 1 issuer record SHOULD contain:

```text
IssuerRecord {
    issuerId
    verificationKey
    status
}
```

Optional metadata MAY include:

```text
displayName
metadataUri
registeredAt
```

Only data required for cryptographic verification SHOULD be placed in the authoritative contract state.

Human-readable metadata SHOULD NOT be treated as authentication data.

## 11. Issuer Status

Version 1 defines the following issuer status:

```text
ACTIVE
```

An `ACTIVE` issuer is authorized to issue credentials that can be accepted under the protocol's verification policy.

Future versions MAY introduce:

```text
SUSPENDED
REVOKED
```

These states MUST NOT be implicitly implemented in Version 1 without corresponding protocol semantics.

## 12. Active Issuer

An issuer is active when its registry record satisfies the protocol's authorization conditions.

Conceptually:

```text
issuerId
   │
   ▼
registry record
   │
   ├── verificationKey
   └── status = ACTIVE
          │
          ▼
    Authorized Issuer
```

A verifier MUST verify issuer status when issuer authorization is part of the proof statement.

## 13. Credential Issuer Binding

Every credential MUST identify its issuer using the registered `issuerId`.

Conceptually:

```text
Credential
    │
    └── issuerId
             │
             ▼
       Issuer Registry
             │
             ▼
      verificationKey
```

The credential's issuer identifier MUST NOT be interpreted as proof of authorization by itself.

Authorization comes from the registry.

## 14. Credential Signature Binding

The issuer MUST sign the canonical credential representation.

Conceptually:

```text
canonical credential
        │
        ▼
   issuer signature
        │
        ▼
verification using
registered public key
```

The proof protocol MUST establish that:

```text
Verify(
    issuerVerificationKey,
    canonicalCredential,
    issuerSignature
) == true
```

A credential with a valid signature from an unregistered issuer MUST NOT be considered an authorized JustProof credential.

## 15. Issuer Identity and Signature

The credential's issuer identity and signature MUST refer to the same issuer.

The protocol MUST prevent a prover from combining:

```text
issuerId = Issuer A
signature = Issuer B
```

and producing a valid proof.

Conceptually:

```text
credential.issuerId
        │
        ▼
Issuer A
        │
        ▼
Issuer A verification key
        │
        ▼
signature verification
```

The issuer registry therefore provides the bridge between credential identity and signature verification.

## 16. Issuer Lookup

A verifier MUST be able to resolve an `issuerId` to its authoritative registry record.

Conceptually:

```text
issuerId
   │
   ▼
Issuer Registry
   │
   ▼
IssuerRecord
```

A successful lookup MUST provide sufficient information to determine whether the issuer is authorized under the applicable verification policy.

At minimum, this requires:

```text
verificationKey
status
```

## 17. Unknown Issuers

An issuer identifier that does not resolve to an authorized registry record MUST NOT be treated as an authorized issuer.

Therefore:

```text
issuerId
   │
   ▼
no registry record
   │
   ▼
NOT AUTHORIZED
```

A credential MAY still exist as an arbitrary signed document, but it MUST NOT be treated as a valid JustProof credential under a verification policy requiring an authorized issuer.

## 18. Issuer Key Rotation

Issuer key rotation is a protocol-sensitive operation.

Version 1 SHOULD avoid mutable issuer verification keys after registration unless key rotation is explicitly required.

If key rotation is introduced, the protocol MUST define:

- how a new key is authorized
- whether old credentials remain valid
- which key signs new credentials
- how historical signatures are verified
- how proofs bind to the correct key
- whether key history is retained

Changing the verification key MUST NOT silently invalidate or alter the meaning of previously issued credentials.

## 19. Issuer Deregistration

Version 1 SHOULD avoid permanent deletion of issuer records.

Instead, future status mechanisms SHOULD allow an issuer to become unauthorized while preserving historical registry state.

This distinction is important because deleting an issuer record can make historical credentials impossible to interpret.

Conceptually:

```text
Issuer Record
     │
     ├── historical identity
     ├── historical key
     └── current authorization state
```

The registry SHOULD therefore favor state transitions over destructive deletion.

## 20. Issuer Revocation

Issuer authorization and credential revocation are separate protocol concepts.

### Issuer authorization

Determines whether an issuer is recognized by JustProof.

### Credential revocation

Determines whether a particular credential remains valid.

Therefore:

```text
Issuer Registry
      │
      ▼
Issuer authorization

Credential Registry / Revocation State
      │
      ▼
Credential validity
```

A Version 1 issuer registry MUST NOT be used as a substitute for credential-level revocation.

## 21. Historical Credentials

The protocol MUST define how historical credentials behave when issuer authorization changes.

For Version 1, the recommended policy is:

> A credential's validity is determined according to the verification policy and issuer state applicable to the verification.

If an issuer becomes unauthorized, a verifier MAY reject its credentials under a current-authorization policy.

However, the protocol SHOULD preserve sufficient registry history to distinguish:

```text
issuer never authorized
```

from:

```text
issuer was previously authorized
```

if historical verification is required.

## 22. Registry State

The authoritative issuer registry consists of public state representing registered issuers.

Conceptually:

```text
Issuer Registry
│
├── issuer A
│    ├── verificationKey
│    └── status
│
├── issuer B
│    ├── verificationKey
│    └── status
│
└── issuer C
     ├── verificationKey
     └── status
```

The exact Compact ledger representation is an implementation detail, provided that the public semantics defined here are preserved.

## 23. Registry and Merkle State

The issuer registry is logically separate from the credential Merkle tree.

The two structures answer different questions:

```text
Issuer Registry
    │
    └── "Who is authorized to issue?"

Credential Merkle Tree
    │
    └── "Is this credential represented in the
         authorized credential state?"
```

A credential proof MAY depend on both.

A valid Merkle membership proof MUST NOT by itself establish issuer authorization.

Likewise, an authorized issuer record MUST NOT establish that a particular credential exists.

## 24. Registry and Commitment State

The issuer registry MUST NOT be used as the credential commitment store unless explicitly required by the protocol.

The conceptual relationship is:

```text
Issuer Registry
      │
      ▼
Issuer authorization
      │
      │
Credential
      │
      ▼
Credential Commitment
      │
      ▼
Credential Merkle Tree
```

Each layer establishes a distinct property.

## 25. Issuer Registry and Zero-Knowledge Proofs

A qualification proof MAY establish issuer authorization without revealing unnecessary issuer or credential information.

Conceptually:

```text
Private:
    credential
    issuer signature

Public:
    issuerId
    registry state

        │
        ▼
      ZK Circuit
        │
        ▼
Proof that:
    credential.issuerId
    corresponds to
    authorized issuer
```

The exact amount of issuer information exposed by the proof MUST be determined by the proof statement.

## 26. Issuer Registry Witnesses

Issuer registry state is normally public.

The witness layer SHOULD NOT provide the issuer's authorization record as private witness data when the record is already public protocol state.

Instead:

```text
Private witness
    │
    └── issuer signature

Public state
    │
    ├── issuerId
    └── verificationKey / authorization
```

The circuit establishes the relationship between the private signature and the public issuer record.

## 27. Issuer Registration Transaction

An issuer registration operation SHOULD establish the issuer record atomically.

Conceptually:

```text
registerIssuer(
    issuerId,
    verificationKey,
    status
)
```

The exact Compact circuit interface MAY differ.

Registration MUST ensure that:

- `issuerId` is valid
- the issuer does not unintentionally overwrite another issuer
- the verification key is valid
- the resulting registry state is consistent

## 28. Duplicate Registration

An `issuerId` MUST uniquely identify one issuer registration.

The registry MUST NOT allow an unrelated issuer to overwrite an existing issuer record.

If an existing issuer needs to update its registration, the protocol MUST use an explicit update mechanism.

Conceptually:

```text
new issuerId
     │
     ▼
already registered?
     │
 ┌───┴───┐
No      Yes
 │        │
 ▼        ▼
Register  Reject or
          explicit update
```

## 29. Registration Authorization

Only an authorized registry administrator or registration authority MAY register an issuer.

The registration mechanism MUST NOT allow arbitrary users to add an issuer and thereby make that issuer authoritative.

This is a critical security invariant.

## 30. Issuer Metadata

Human-readable issuer metadata MAY be associated with an issuer.

Examples:

```text
displayName
description
website
logo
metadataUri
```

However, metadata MUST NOT determine cryptographic authorization.

A verifier MUST be able to verify issuer authorization without trusting:

- a website
- a logo
- a display name
- an external metadata document

The cryptographic identity remains:

```text
issuerId
+
verificationKey
+
registry state
```

## 31. Registry Metadata Integrity

If issuer metadata is stored outside the ledger, the protocol SHOULD provide a way to detect unauthorized metadata substitution.

For example, metadata MAY be referenced by a content-addressed identifier.

However, Version 1 MAY keep issuer metadata entirely outside the cryptographic verification path.

This keeps the initial protocol small.

## 32. Issuer Identity Presentation

An issuer MAY present itself to users using a human-readable name.

For example:

```text
Qualification Proof Certification Authority
```

However, the human-readable name is not the issuer's cryptographic identity.

Applications SHOULD present enough information for users to distinguish:

```text
Issuer display name
Issuer ID
```

when appropriate.

The display name MUST NOT be used as a security decision.

## 33. Registry Verification Algorithm

A verifier requiring an authorized issuer SHOULD perform the following conceptual checks:

```text
1. Read credential.issuerId.
2. Resolve issuerId in the issuer registry.
3. Reject if no issuer exists.
4. Read issuer verification key.
5. Check issuer authorization status.
6. Verify the credential signature.
7. Continue with credential commitment and proof verification.
```

The order MAY differ in implementation, but all required conditions MUST be enforced.

## 34. Verification Conditions

An issuer is authorized for a credential only when:

```text
issuerId exists
AND
issuer status satisfies verification policy
AND
credential.issuerId == issuerId
AND
credential signature verifies under issuer verification key
```

Conceptually:

```text id="2n8v6k"
AuthorizedIssuer(credential) =
    RegistryContains(credential.issuerId)
    &&
    IsAuthorized(credential.issuerId)
    &&
    VerifySignature(
        issuerVerificationKey,
        credential,
        signature
    )
```

## 35. Failure Conditions

Issuer authorization MUST fail when the:

- issuer does not exist
- issuer is unauthorized
- issuer status does not satisfy the verification policy
- issuer verification key is invalid
- credential issuer identifier is malformed
- credential signature is invalid
- signature does not correspond to the credential
- credential references a different issuer than the signature
- registry state cannot be interpreted safely

The verifier MUST fail closed.

## 36. Security Properties

The issuer registry MUST provide the following properties.

### Unique issuer identity

One issuer identifier MUST resolve to one authoritative issuer identity.

### Authentic issuer verification

Credentials MUST be verifiable against the registered issuer verification key.

### Authorization

Only registered and authorized issuers may satisfy an authorization check.

### Credential binding

An issuer signature MUST authenticate the exact credential being verified.

### Registry integrity

Unauthorized parties MUST NOT be able to modify issuer authorization state.

### Historical interpretability

The registry SHOULD preserve enough information to interpret credentials issued under previous issuer states when required.

## 37. Protocol Invariants

Every Version 1 implementation MUST preserve the following invariants:

1. Every registered issuer has a unique `issuerId`.
2. Every registered issuer has an authoritative verification key.
3. `issuerId` MUST NOT be derived from mutable human-readable metadata.
4. Issuer authorization MUST come from registry state.
5. An issuer identifier alone MUST NOT constitute proof of authorization.
6. An issuer signature MUST correspond to the registered issuer.
7. The issuer registry MUST NOT store issuer private keys.
8. Unauthorized users MUST NOT be able to register authoritative issuers.
9. An existing issuer MUST NOT be silently overwritten by another issuer.
10. Issuer authorization and credential revocation MUST remain separate concepts.
11. Human-readable metadata MUST NOT determine cryptographic authorization.
12. A valid signature from an unregistered issuer MUST NOT constitute a valid JustProof issuer authorization.
13. The issuer registry and credential Merkle tree MUST remain logically distinct.
14. A valid Merkle membership proof MUST NOT by itself establish issuer authorization.
15. Registry verification MUST fail closed.
16. Registry semantics MUST be independent of frontend implementation details.
17. Any change to the cryptographic meaning of issuer identity or authorization constitutes a protocol change.

## 38. Test Requirements

The issuer registry MUST have contract tests covering at least:

### Registration

- register valid issuer
- reject duplicate issuer
- reject unauthorized registration
- reject malformed issuer data

### Lookup

- retrieve registered issuer
- resolve issuer by identifier
- unknown issuer returns unauthorized state

### Authorization

- active issuer is authorized
- unauthorized issuer is rejected
- issuer status changes are respected

### Credential binding

- valid issuer signature succeeds
- invalid signature fails
- signature from another issuer fails
- credential referencing another issuer fails

### Isolation

Tests MUST verify that:

```text
Issuer Registry
```

cannot be manipulated to falsely establish:

```text
Credential Membership
```

and that:

```text
Credential Merkle Membership
```

cannot be manipulated to falsely establish:

```text
Issuer Authorization
```

## 39. Reference Architecture

The complete Version 1 issuer architecture is:

```text
                    Registry Authority
                           │
                           │ register
                           ▼
                    ┌──────────────┐
                    │Issuer Registry│
                    └──────┬───────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
              issuerId          public key
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                       Credential
                           │
                 ┌─────────┴─────────┐
                 │                   │
              issuerId           signature
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                    Credential Proof
                           │
                           ▼
                       Verifier
```

The registry therefore provides the public trust anchor required for credential issuer authentication.

## 40. Relationship to the Credential Protocol

The credential specification defines:

> What information constitutes a credential.

The issuer registry defines:

> Which issuer is authorized to issue that credential.

The relationship is:

```text
Credential
    │
    └── issuerId ──────────────┐
                               │
                               ▼
                        Issuer Registry
                               │
                               ├── verificationKey
                               └── authorization
```

The credential remains a private object held by the credential holder.

The issuer registry remains public protocol state.

## 41. Relationship to the Proof Protocol

The proof protocol uses the issuer registry to establish issuer authenticity without requiring the credential itself to become public.

Conceptually:

```text
Private
  │
  ├── credential
  └── issuer signature
          │
          ▼
       ZK Proof
          ▲
          │
Public
  │
  ├── issuerId
  └── issuer registry state
```

The proof therefore demonstrates that:

> The private credential was authenticated by the issuer identified by the public registry state.

## 42. Version 1 Decisions

The following decisions are recommended for the initial JustProof MVP:

| Decision                           | Version 1                            |
| ---------------------------------- | ------------------------------------ |
| Issuer identifier                  | Derived from issuer verification key |
| Issuer registration                | Required                             |
| Issuer verification key            | Public registry state                |
| Issuer private key                 | Never on-chain                       |
| Registration authority             | Controlled JustProof authority       |
| Issuer status                      | `ACTIVE`                             |
| Key rotation                       | Deferred                             |
| Issuer deletion                    | Deferred                             |
| Historical registry                | Preserve state where practical       |
| Issuer metadata                    | Non-authoritative                    |
| Credential revocation              | Separate protocol                    |
| Credential Merkle tree             | Separate protocol                    |
| Issuer registry Merkle tree        | Not required initially               |
| Zero-knowledge issuer verification | Supported through proof layer        |

These decisions should be frozen before implementing the registry contract.

## 43. Open Protocol Decisions

Before Version 1 is frozen, the following MUST be resolved:

1. Exact issuer identifier derivation.
2. Exact issuer signature algorithm.
3. Exact issuer public-key representation.
4. Registry authority authorization mechanism.
5. Issuer registration circuit.
6. Issuer status representation.
7. Whether historical issuer state is required.
8. Whether issuer metadata is stored on-chain or referenced externally.
9. Key rotation policy.
10. Interaction between issuer authorization and credential validity.

Until these decisions are frozen, implementations SHOULD treat this document as a protocol draft.

## 44. Final Protocol Principle

The issuer registry establishes the answer to a fundamental question:

> **Who is authorized to issue a JustProof credential?**

- The registry does not prove that a credential exists.

- The credential does not prove that its issuer is authorized.

- The signature does not prove that the issuer is registered.

Each layer establishes a distinct property:

```text
Issuer Registry
    │
    └── establishes issuer authorization

Issuer Signature
    │
    └── establishes credential authentication

Credential Commitment
    │
    └── establishes credential binding

Merkle Tree
    │
    └── establishes credential membership

Zero-Knowledge Proof
    │
    └── establishes the requested qualification statement
```

Together, these components form the trust and verification foundation of the JustProof Credential Protocol.
