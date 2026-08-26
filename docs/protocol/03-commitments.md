# JustProof Commitment Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies the commitment scheme used by the JustProof Credential Protocol to bind on-chain verification state to a credential without publishing the credential itself.

A commitment allows the protocol to establish that a private credential corresponds to a previously published on-chain value while keeping the credential contents private.

This specification defines:

- the commitment input
- commitment construction
- domain separation
- encoding requirements
- binding requirements
- hiding requirements
- credential-to-commitment relationships
- on-chain representation
- verification requirements

This document does not define the complete credential schema, issuer registry, revocation protocol, or zero-knowledge proof circuits. Those concerns are specified separately.

## 2. Commitment Model

A commitment is a cryptographic value derived from credential data.

Conceptually:

```text
credential
    │
    ▼
canonicalization
    │
    ▼
commitment input
    │
    ▼
cryptographic hash
    │
    ▼
credential commitment
```

The resulting commitment is suitable for publication on the Midnight ledger.

The credential itself remains private.

A holder can subsequently provide the credential as a private witness and demonstrate that it produces the same commitment recorded on-chain.

## 3. Terminology

| Term                         | Definition                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Credential**               | The canonical structured qualification credential defined by the credential protocol.                       |
| **Commitment**               | A cryptographic value binding a private credential to an on-chain representation.                           |
| **Commitment input**         | The canonical byte sequence supplied to the commitment function.                                            |
| **Domain separator**         | A protocol-specific constant identifying the cryptographic purpose of a hash.                               |
| **Canonical representation** | The deterministic representation of protocol data used for cryptographic operations.                        |
| **Opening**                  | The private credential data that can be used to demonstrate correspondence with a commitment.               |
| **Binding**                  | The property that prevents a commitment from being validly associated with two different credential states. |
| **Hiding**                   | The property that prevents the commitment from revealing the committed credential.                          |

## 4. Commitment Requirements

A Version 1 credential commitment MUST satisfy the following properties.

### 4.1 Determinism

The same canonical credential MUST always produce the same commitment.

```text
Commit(C) = Commit(C)
```

An implementation MUST NOT introduce nondeterministic values into commitment construction.

### 4.2 Binding

A commitment MUST cryptographically bind the commitment to the credential contents.

An attacker SHOULD NOT be able to construct two materially different credentials `C1` and `C2` such that:

```text
Commit(C1) = Commit(C2)
```

except with negligible probability under the security assumptions of the selected cryptographic primitive.

### 4.3 Hiding

The commitment MUST NOT expose the credential contents to an observer who only has access to the public commitment.

The commitment MUST therefore be computationally infeasible to reverse into the underlying credential.

However, this property depends on the entropy of the committed data.

A commitment constructed only from a small, publicly predictable value is susceptible to dictionary attacks.

Consequently, sensitive or low-entropy private values MUST NOT be committed directly without an appropriate secret or other entropy source.

### 4.4 Domain Separation

Commitment hashing MUST use a domain separator distinct from all other protocol hash operations.

Version 1 uses:

```text
JP:CREDENTIAL:V1:COMMITMENT
```

The commitment domain MUST NOT be reused for:

- credential identifiers
- issuer identifiers
- subject identifiers
- signatures
- unrelated application hashes

## 5. Commitment Primitive

Version 1 defines the commitment function as:

```text
Commit(m) = H(
    encode("JP:CREDENTIAL:V1:COMMITMENT") ||
    encode(m)
)
```

Where:

- `H` is the protocol's selected cryptographic hash function
- `encode(...)` is the canonical byte encoding defined by this specification
- `m` is the canonical commitment input

The exact hash primitive MUST be frozen before Version 1 contract implementation.

## 6. Credential Commitment

The primary commitment used by JustProof is the credential commitment.

Conceptually:

```text
C = canonicalCredential
```

and:

```text
credentialCommitment =
    H(
        "JP:CREDENTIAL:V1:COMMITMENT" ||
        C
    )
```

The credential commitment MUST cover every credential field whose alteration would change the semantic identity of the credential.

Consequently:

```text
C1 ≠ C2
```

MUST result in distinct commitments except with negligible probability.

## 7. Credential Identifier vs Commitment

The credential identifier and credential commitment serve different purposes.

The **credential identifier** identifies a credential.

The **credential commitment** binds private credential data to public verification state.

They MUST NOT be treated as interchangeable.

Conceptually:

```text
Credential
    │
    ├──► Credential ID
    │
    └──► Credential Commitment
```

Version 1 uses separate domain separators for these operations:

```text
JP:CREDENTIAL:V1:ID
JP:CREDENTIAL:V1:COMMITMENT
```

Therefore:

```text
CredentialId(C)
```

and:

```text
Commit(C)
```

are cryptographically distinct operations even when they use the same underlying hash primitive.

## 8. Commitment Input

The commitment MUST operate on the canonical credential representation rather than an implementation-specific object representation.

The following MUST NOT be used as commitment inputs:

- JavaScript object serialization
- arbitrary JSON serialization
- language-specific object representations
- pretty-printed JSON
- human-readable certificate files
- PDF files
- image files
- frontend-generated strings

The commitment input MUST be deterministic across compatible implementations.

## 9. Canonical Encoding

Version 1 requires a canonical encoding function:

```text
encode(Credential)
```

The encoding MUST uniquely represent the credential.

The encoding rules MUST define:

- field ordering
- field names
- string encoding
- integer encoding
- byte encoding
- boolean encoding
- optional values
- array ordering
- nested structures

Two implementations MUST produce identical commitment inputs for semantically identical credentials.

For textual values, Version 1 uses UTF-8.

For binary values, Version 1 uses the protocol's canonical byte representation rather than textual hexadecimal unless explicitly specified otherwise.

## 10. Field Ordering

Credential fields MUST appear in the protocol-defined order.

Field order MUST NOT depend on:

- insertion order in a JavaScript object
- database column order
- JSON property ordering
- frontend state ordering

The canonical order is:

```text
version
issuerId
subject
qualification
issuedAt
expiresAt
claims
```

The derived `credentialId` MUST NOT be included as an input to its own derivation.

Likewise, the issuer signature MUST NOT be included in the unsigned credential representation used to calculate the credential commitment unless explicitly specified by the finalized protocol.

## 11. Signature Relationship

The credential commitment and issuer signature authenticate related but distinct protocol objects.

The issuer signature authenticates the issuer's assertion about the credential.

The commitment binds the credential to public on-chain state.

Conceptually:

```text
canonicalCredential
       │
       ├──────────────► issuer signature
       │
       └──────────────► credential commitment
```

The protocol MUST define both operations over deterministic representations.

A verifier MUST NOT assume that a valid commitment implies a valid issuer signature.

Likewise, a valid issuer signature MUST NOT be interpreted as proof that a credential commitment exists on-chain.

Both relationships must be established during verification.

## 12. Commitment Publication

The credential commitment is suitable for publication as public ledger state.

Conceptually:

```text
Holder / Issuer
       │
       │ credential commitment
       ▼
Midnight Contract
       │
       ▼
Public Ledger State
```

The ledger MUST NOT require publication of the credential itself to store the commitment.

The public commitment SHOULD be sufficient for the contract to determine whether a submitted proof refers to the expected credential state.

## 13. Commitment Verification

A proof verifier MUST establish that the private credential used by the prover corresponds to the expected commitment.

Conceptually:

```text
private credential
       │
       ▼
canonicalization
       │
       ▼
Commit(privateCredential)
       │
       ▼
expected commitment
```

The resulting value MUST equal the commitment referenced by the public verification state.

Formally:

```text
Commit(C_private) = C_public
```

A proof MUST NOT be accepted when this equality does not hold.

## 14. Commitment and Revocation

Credential revocation operates on credential-specific public state.

The commitment MAY be used as the primary lookup key for credential state, provided the resulting contract representation permits unambiguous identification of the credential.

If Version 1 uses `credentialId` rather than the commitment as the revocation key, the relationship MUST remain deterministic:

```text
credential
    │
    ├──► credentialId
    │
    └──► commitment
```

The contract MUST NOT infer revocation state from the mere existence of a commitment.

Authenticity, existence, and revocation are separate protocol properties.

## 15. Commitment Privacy

Publishing a commitment does not constitute publishing the credential.

An observer of the ledger MUST receive no direct access to the committed credential contents from the commitment itself.

However, the protocol does not guarantee privacy against an observer who can enumerate a small credential space.

For example, if the committed message can only have a small number of possible values:

```text
"Midnight Builder"
"JavaScript Developer"
"Rust Developer"
```

an observer may calculate commitments for each candidate and compare them.

Therefore, Version 1 implementations MUST carefully distinguish:

- commitment to high-entropy private data
- commitment to publicly enumerable data

Where necessary, a secret nonce or holder-controlled randomness MUST be incorporated into the commitment input.

## 16. Salt / Blinding Value

If a credential contains low-entropy or publicly guessable values that must remain private, Version 1 MAY incorporate a holder-controlled blinding value.

Conceptually:

```text
commitment =
    H(
        "JP:CREDENTIAL:V1:COMMITMENT" ||
        canonicalCredential ||
        blindingSecret
    )
```

The blinding value MUST:

- remain private
- have sufficient entropy
- be included consistently during proof generation
- never be published merely to enable commitment verification

If a blinding value is required by the finalized Version 1 construction, its encoding and generation requirements MUST be frozen before implementation.

The protocol MUST NOT use an implicit or implementation-specific blinding value.

## 17. Commitment Immutability

Once a credential commitment has been published, the commitment MUST be treated as immutable.

A change to any committed credential field produces a different commitment.

For example:

```text
C = Commit(credential)
```

and:

```text
C' = Commit(modifiedCredential)
```

MUST satisfy:

```text
C ≠ C'
```

except with negligible probability.

A corrected credential therefore requires a new credential commitment.

The protocol MUST NOT mutate the meaning of an existing commitment.

## 18. Duplicate Credentials

Two credentials with identical canonical contents produce the same deterministic commitment.

This means that the commitment alone MUST NOT be interpreted as proof that two independently issued credential events occurred.

If issuance uniqueness is required, the credential MUST contain an issuer-controlled or protocol-defined unique value before commitment construction.

Examples include:

- issuance nonce
- credential sequence number
- unique issuance identifier

Such a value MUST be part of the canonical credential and therefore part of the commitment.

## 19. Commitment Collision Requirements

The security of the commitment's binding property depends on the collision resistance of the selected hash function.

An implementation MUST NOT truncate the commitment below the security level required by the protocol without an explicit protocol decision.

Any truncation, serialization, or field-size conversion MUST be specified as part of Version 1.

The Compact representation of the commitment MUST preserve the protocol-defined cryptographic security properties.

## 20. Commitment Domain Separation Rules

All Version 1 commitment operations MUST use the exact domain separator:

```text
JP:CREDENTIAL:V1:COMMITMENT
```

The domain separator MUST be encoded according to the canonical encoding rules.

Implementations MUST NOT:

- abbreviate the domain separator
- change its capitalization
- omit the protocol version
- replace it with an application-specific string
- concatenate it without the defined encoding rules

For example, these values are distinct protocol domains:

```text
JP:CREDENTIAL:V1:ID
JP:CREDENTIAL:V1:COMMITMENT
JP:CREDENTIAL:V1:SIGNATURE
```

## 21. Security Properties

Assuming the selected cryptographic primitive is secure, the Version 1 commitment scheme provides:

### Binding

A malicious party cannot feasibly create two different valid credential openings for the same commitment.

### Hiding

A commitment does not feasibly reveal the committed credential when the commitment input contains sufficient entropy.

### Domain separation

Commitments cannot accidentally be interpreted as other protocol hash constructions.

### Determinism

The same credential produces the same commitment.

### Verifiability

A verifier can establish that private credential data corresponds to a known public commitment.

## 22. What the Commitment Does Not Prove

A commitment alone does **not** prove that:

- the credential was issued by an authorized issuer
- the issuer signature is valid
- the credential holder is the subject
- the credential has not expired
- the credential has not been revoked
- a particular qualification claim is true
- the credential was issued legitimately
- the holder is entitled to use the credential

These properties require additional protocol verification.

The commitment establishes only the cryptographic binding between private credential data and the committed public value.

## 23. Protocol Invariants

Every Version 1 implementation MUST preserve the following invariants:

1. Identical canonical credentials produce identical commitments.
2. Materially different credentials produce different commitments except with negligible probability.
3. Commitment construction uses the `JP:CREDENTIAL:V1:COMMITMENT` domain separator.
4. Commitment construction uses the protocol's canonical encoding.
5. The credential commitment does not include the credential identifier as an input to its own derivation.
6. The commitment does not depend on presentation artifacts.
7. The commitment does not depend on frontend implementation details.
8. A proof must bind its private credential to the expected public commitment.
9. Public ledger state must not require publication of the complete credential.
10. Changes to committed credential contents require a new commitment.
11. Commitment construction must be deterministic across implementations.
12. The selected cryptographic primitive and encoding rules must be frozen before Version 1 implementation is considered complete.

## 24. Test Vectors

Before the commitment protocol is frozen, Version 1 MUST define normative test vectors.

Each test vector SHOULD include:

```text
canonical credential
canonical encoded bytes
domain separator
commitment input
expected commitment
```

At minimum, test vectors MUST cover:

- a minimal valid credential
- a credential with multiple claims
- a credential containing optional fields
- a credential containing non-ASCII text
- a credential with the maximum supported integer values
- a modified credential
- identical credentials serialized independently
- domain-separation failures
- invalid encoding
- incorrect field ordering

The contract tests and TypeScript implementation tests MUST use the same normative vectors.

## 25. Primitive Freeze

Before implementing the commitment circuit, the following values MUST be finalized:

| Parameter                            | Status                        |
| ------------------------------------ | ----------------------------- |
| Hash primitive                       | TBD                           |
| Hash output size                     | TBD                           |
| Domain separator                     | `JP:CREDENTIAL:V1:COMMITMENT` |
| Canonical encoding                   | TBD                           |
| Field ordering                       | Defined                       |
| Blinding strategy                    | TBD                           |
| Commitment representation in Compact | TBD                           |
| Commitment test vectors              | TBD                           |

Once these values are frozen, changing any of them constitutes a cryptographic protocol change and SHOULD require a new protocol version.

## 26. Reference Commitment Flow

The complete Version 1 commitment flow is:

```text
                 PRIVATE
                    │
                    ▼
             Credential data
                    │
                    ▼
          Canonical representation
                    │
                    ▼
        +-------------------------+
        | JP:CREDENTIAL:V1:       |
        | COMMITMENT              |
        +-------------------------+
                    │
                    ▼
              Hash function
                    │
                    ▼
          Credential commitment
                    │
                    ▼
              PUBLIC STATE
                    │
                    ▼
             Midnight Ledger
```

During proof generation:

```text
Private credential
       │
       ▼
Commit(credential)
       │
       ▼
Compare against
public commitment
       │
       ▼
Zero-knowledge proof
       │
       ▼
On-chain verification
```

The protocol therefore establishes the following relationship:

```text
private credential
        ║
        ║ cryptographically bound
        ║
        ▼
public commitment
        ║
        ║ verified through ZK proof
        ║
        ▼
public verification result
```

## 27. Final Protocol Principle

The commitment layer exists to make one statement possible:

> **This private credential is the credential represented by this public verification state.**

It does not reveal the credential.

It does not establish issuer authority.

It does not establish qualification validity by itself.

Those properties are established by the other layers of the JustProof protocol.

The commitment layer provides the cryptographic binding that connects the private credential to the public proof system.
