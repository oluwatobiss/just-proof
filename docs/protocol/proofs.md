# JustProof ZK Proof Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies the zero-knowledge proof protocol used by JustProof to prove qualification claims without revealing the underlying credential.

A JustProof proof allows a credential holder to demonstrate that a private credential:

- corresponds to an authentic credential commitment
- belongs to the authorized credential set
- was issued by an authorized issuer
- satisfies the requested qualification conditions
- remains valid under the protocol's applicable validity rules

without requiring the holder to disclose the complete credential to the verifier.

The proof protocol combines the cryptographic primitives defined by the other protocol specifications:

```text
Credential
    │
    ▼
Credential Commitment
    │
    ▼
Merkle Membership
    │
    ▼
Issuer Authentication
    │
    ▼
Requested Claim
    │
    ▼
Zero-Knowledge Proof
    │
    ▼
Verification Result
```

## 2. Scope

This specification defines:

- proof semantics
- public proof inputs
- private proof inputs
- proof statements
- proof generation requirements
- proof verification requirements
- credential binding
- issuer authentication
- Merkle membership
- claim verification
- validity verification
- proof freshness
- nullifiers
- verification outcomes
- protocol invariants

This document does not define:

- the frontend
- wallet UX
- the complete credential schema
- the exact Compact source code
- the concrete Compact circuit signatures
- the selected hash primitive
- the selected signature primitive

Those concerns are specified elsewhere or remain protocol parameters to be frozen.

## 3. Proof Model

A JustProof proof is a zero-knowledge proof that a private witness satisfies a publicly specified verification statement.

Conceptually:

```text
Private Witness
      │
      ├── Credential
      ├── Issuer Signature
      ├── Merkle Path
      ├── Subject Data
      └── Required Secrets
      │
      ▼
   Prover Circuit
      │
      ▼
  Zero-Knowledge Proof
      │
      ▼
 Public Verification
```

The verifier receives the proof and the required public inputs but does not receive the private witness.

## 4. Proof Statement

Every proof MUST have a clearly defined statement.

A Version 1 qualification proof establishes, at minimum:

> There exists a private credential and corresponding private authentication data such that the credential is correctly formed, authenticated by an authorized issuer, represented by the expected public tree state, and satisfies the requested qualification conditions.

Formally, the proof establishes the existence of private values `W` such that:

```text
Verify(W, PublicInputs) = true
```

without revealing `W`.

## 5. Proof Types

Version 1 defines a primary proof type:

```text
QUALIFICATION
```

A qualification proof establishes that the holder possesses a credential satisfying a requested qualification predicate.

The protocol MAY define additional proof types in future versions, such as:

```text
EXPIRATION
ISSUER
ATTRIBUTE
AGE
MEMBERSHIP
```

Such proof types MUST NOT be introduced into Version 1 implicitly.

## 6. Proof Domain Separation

Proof-related cryptographic operations MUST use explicit protocol domain separation where applicable.

Version 1 defines:

```text
JP:CREDENTIAL:V1:PROOF
```

If proof-specific hashes, nullifiers, or derived identifiers are introduced, they MUST use distinct subdomains.

For example:

```text
JP:CREDENTIAL:V1:PROOF:NULLIFIER
JP:CREDENTIAL:V1:PROOF:REQUEST
```

The exact use of these domains MUST be frozen before implementation.

## 7. Public Inputs

Public inputs are values that the verifier is allowed to know.

A Version 1 qualification proof MAY include the following public inputs:

```text
PublicInputs {
    protocolVersion
    proofType
    merkleRoot
    issuerId
    qualification
    validityParameters
    requestId
}
```

Not every field must be exposed for every proof.

The proof circuit MUST expose only the minimum information required by the verification policy.

## 8. Private Inputs

Private inputs contain information that the holder does not need to disclose to the verifier.

A Version 1 proof MAY require:

```text
PrivateInputs {
    credential
    issuerSignature
    issuerSignatureAuxiliaryData
    merklePath
    credentialIndex
    subjectData
    holderSecret
}
```

The exact private witness depends on the cryptographic primitives selected for Version 1.

Private inputs MUST NOT be emitted as public circuit outputs.

## 9. Public and Private Boundary

The core privacy boundary is:

```text
                PRIVATE
                   │
        ┌──────────┴──────────┐
        │                     │
    Credential          Merkle Path
    Signature           Subject Data
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
             ZK Prover
                   │
                   ▼
             Proof Output
                   │
                   ▼
                PUBLIC
```

The verifier receives evidence that the private values satisfy the requested conditions, not the private values themselves.

## 10. Credential Binding

A proof MUST bind to a specific credential.

The prover derives the credential commitment from the private credential:

```text
credential
    │
    ▼
Commit(credential)
    │
    ▼
credentialCommitment
```

The proof MUST establish that the resulting commitment corresponds to the credential commitment represented in the Merkle tree.

This prevents a prover from using one credential's claims while proving membership of another credential.

## 11. Credential Identifier Binding

Where the credential identifier is used by the verification protocol, the proof MUST establish that it was correctly derived from the private credential.

Conceptually:

```text
credential
    │
    ├──► Credential ID
    │
    └──► Credential Commitment
```

The proof MUST NOT accept a credential identifier supplied independently of the credential if that would allow the prover to substitute unrelated public data.

## 12. Merkle Membership

The proof MUST establish that the credential commitment corresponds to a leaf contained in the authorized Merkle tree.

The prover privately supplies:

```text
credentialCommitment
merklePath
credentialIndex
```

The circuit reconstructs the Merkle root.

Conceptually:

```text
credential
    │
    ▼
credential commitment
    │
    ▼
Merkle leaf
    │
    ├── private Merkle path
    │
    ▼
reconstructed root
    │
    ▼
public merkleRoot
```

The proof is valid only when:

```text
reconstructedRoot == publicMerkleRoot
```

## 13. Issuer Authentication

A proof MUST establish that the credential was authenticated by the issuer identified by the credential.

The proof MUST verify the issuer signature over the canonical credential representation.

Conceptually:

```text
credential
    │
    ▼
canonical credential
    │
    ▼
issuer signature verification
    │
    ▼
valid / invalid
```

A valid credential commitment without a valid issuer signature MUST NOT produce a valid qualification proof.

## 14. Issuer Authorization

Issuer signature validity and issuer authorization are separate conditions.

The proof MUST establish that the issuer associated with the credential corresponds to an authorized issuer.

Conceptually:

```text
credential issuerId
       │
       ▼
issuer registry
       │
       ▼
authorized issuer
```

The issuer MUST satisfy the protocol's authorization requirements at the relevant verification point.

The exact registry representation is defined by the issuer-registry protocol.

## 15. Requested Qualification

The verifier specifies the qualification that the proof must establish.

For example:

```text
qualification = "Midnight Builder"
```

The proof MUST establish that the private credential satisfies the requested qualification predicate.

The holder MUST NOT be able to substitute a different qualification while still producing a proof accepted for the requested qualification.

The requested qualification therefore forms part of the public proof statement.

## 16. Selective Disclosure

A proof SHOULD expose only the credential information necessary for the requested verification.

For example, suppose a credential contains:

```text
{
    qualification: "Midnight Builder",
    holderName: "Alice",
    score: 94,
    issuedAt: ...,
    expiresAt: ...
}
```

A verifier requesting:

```text
qualification == "Midnight Builder"
```

should not need to learn:

```text
holderName
score
```

unless those values are explicitly part of the verification request.

The proof circuit MUST therefore distinguish between:

- information required to establish the statement
- information that may remain private

## 17. Claim Predicates

A qualification proof MAY establish predicates rather than exact equality.

Examples include:

```text
qualification == "Midnight Builder"

score >= 80

issuedAt <= verificationTime

expiresAt > verificationTime
```

A predicate MUST be explicitly defined by the proof request.

The proof MUST establish the predicate over the private credential data.

A verifier MUST NOT infer an unrequested claim from a proof.

## 18. Temporal Validity

Where credential validity depends on time, the proof MUST establish the required temporal conditions.

For example, a currently valid credential may require:

```text
issuedAt <= verificationTime
```

and:

```text
expiresAt > verificationTime
```

The exact treatment of expiration boundaries MUST be defined explicitly.

Version 1 uses:

```text
issuedAt <= verificationTime < expiresAt
```

for credentials with an expiration timestamp.

Non-expiring credentials require an explicit protocol representation rather than relying on an omitted value.

## 19. Verification Time

A proof involving temporal validity MUST define which time is authoritative.

The verifier MUST NOT blindly trust a timestamp supplied by the prover.

Where verification occurs on-chain, the protocol SHOULD use an authoritative protocol-recognized time source or another explicitly defined mechanism.

Where verification occurs off-chain, the verification environment MUST clearly identify the source of `verificationTime`.

The final Version 1 time semantics MUST be frozen before temporal proofs are implemented.

## 20. Revocation

A qualification proof MUST account for credential revocation when revocation is part of the requested validity policy.

The proof MAY establish revocation status through:

- public contract state
- a revocation root
- a revocation registry
- another protocol-defined mechanism

The specific revocation mechanism is defined separately.

The important invariant is:

```text
revoked credential
       │
       ▼
invalid qualification proof
```

unless the verification request explicitly permits revoked credentials.

## 21. Proof Request

A verifier SHOULD express the requested proof as an explicit verification request.

Conceptually:

```text
ProofRequest {
    protocolVersion
    proofType
    qualification
    issuerConstraint
    validityPolicy
    requestId
}
```

The request defines what the verifier is asking the holder to prove.

A proof MUST be bound to the request or to an equivalent public statement.

This prevents a proof generated for one purpose from being incorrectly reused as evidence for a different purpose.

## 22. Request Binding

If a proof request has a unique identifier or cryptographic digest, the proof SHOULD bind to it.

Conceptually:

```text
request
    │
    ▼
request identifier
    │
    ▼
proof statement
```

This prevents ambiguity about the intended verification policy.

For example, a proof satisfying:

```text
qualification == "Midnight Builder"
```

should not automatically be interpreted as proving:

```text
qualification == "Midnight Builder"
AND
issuer == "Issuer A"
```

unless the latter condition was part of the proof statement.

## 23. Proof Freshness

A proof MUST NOT be assumed to be fresh merely because its cryptographic verification succeeds.

Where replay protection is required, the proof MUST bind to a verifier-controlled challenge, request identifier, or equivalent freshness mechanism.

Version 1 SHOULD support a verifier-provided challenge.

Conceptually:

```text
Verifier
   │
   │ challenge
   ▼
Holder
   │
   │ proof(challenge, statement)
   ▼
Verifier
```

A proof generated for one challenge MUST NOT be accepted as a response to a different challenge.

## 24. Nullifiers

A nullifier MAY be used when the protocol needs to prevent repeated use of the same credential for a particular purpose without revealing the credential itself.

Conceptually:

```text
nullifier =
    H(
        "JP:CREDENTIAL:V1:PROOF:NULLIFIER" ||
        credentialSecret ||
        scope
    )
```

The `scope` determines where reuse is prevented.

For example:

```text
scope = verifierId
```

could prevent repeated proof use against one verifier while allowing use elsewhere.

Version 1 does not require nullifiers unless the application needs replay or duplicate-use prevention beyond challenge-based freshness.

If nullifiers are adopted, their construction and privacy properties MUST be frozen before implementation.

## 25. Proof Non-Disclosure

The proof MUST NOT reveal private witness values through explicit outputs.

In particular, the proof MUST NOT expose:

- the complete credential
- private claim values
- private subject information
- issuer private keys
- holder secrets
- private Merkle paths

A proof MAY reveal public values that are explicitly required by the proof statement.

## 26. Proof Generation

Proof generation occurs locally from the holder's private state.

Conceptually:

```text
Holder
  │
  ├── credential
  ├── issuer signature
  ├── Merkle path
  └── private inputs
  │
  ▼
Local prover
  │
  ▼
Zero-knowledge proof
```

Private inputs SHOULD remain within the holder-controlled proving environment.

The frontend MUST NOT expose private credential values merely to display proof-generation progress.

Proof generation MAY be computationally expensive.

The application SHOULD therefore treat proof generation as an explicit asynchronous operation.

## 27. Proof Verification

Verification consists of two conceptual layers.

### Cryptographic verification

The verifier checks that the proof is valid under the selected proving system.

### Protocol verification

The verifier checks that the public inputs and resulting statement satisfy the JustProof protocol.

Conceptually:

```text
Proof
 │
 ▼
ZK verification
 │
 ▼
Protocol conditions
 │
 ├── correct protocol
 ├── correct proof type
 ├── authorized issuer
 ├── valid credential
 ├── valid membership
 ├── requested claim
 └── validity policy
 │
 ▼
ACCEPT / REJECT
```

A cryptographically valid proof MUST still be rejected if its public inputs violate protocol requirements.

## 28. Verification Result

Version 1 defines two primary outcomes:

```text
VALID
INVALID
```

A verifier MUST treat any failure of a required proof condition as `INVALID`.

Implementations MAY expose more detailed diagnostic information to the holder or developer.

However, a production verifier SHOULD avoid unnecessarily revealing sensitive information about why a private proof failed.

## 29. Failure Conditions

A proof MUST be rejected if any required condition fails.

Examples include:

- malformed proof
- unsupported protocol version
- unsupported proof type
- invalid zero-knowledge proof
- invalid credential commitment
- invalid Merkle membership
- invalid issuer signature
- unauthorized issuer
- revoked credential
- expired credential
- qualification mismatch
- request mismatch
- challenge mismatch
- invalid public input

A verifier MUST fail closed.

## 30. Public Verification State

The proof protocol depends on authoritative public state.

Depending on the final contract architecture, this may include:

```text
issuer registry state
Merkle root
revocation state
protocol version
```

The proof MUST be interpreted against the correct state.

A proof referencing an outdated or unauthorized root MUST NOT be accepted as evidence of current validity when the verification policy requires current state.

## 31. State Binding

Where a proof depends on mutable public state, the proof MUST be bound to the state being verified.

For example:

```text
proof
  │
  ├── merkleRoot
  ├── issuer state
  └── revocation state
```

The verifier MUST know which public state the proof was generated against.

This prevents a valid proof against an old state from being silently interpreted as a proof against a newer state.

## 32. Proof and Credential Commitment Relationship

The complete cryptographic relationship is:

```text
                  Credential
                      │
              ┌───────┴───────┐
              │               │
              ▼               ▼
        Issuer Signature   Commitment
              │               │
              │               ▼
              │          Merkle Leaf
              │               │
              │               ▼
              │          Merkle Root
              │               │
              └───────┬───────┘
                      │
                      ▼
                ZK Proof
                      │
                      ▼
              Public Verification
```

The proof binds these independently defined protocol components into one verifiable statement.

## 33. Security Properties

A secure Version 1 proof MUST provide the following properties.

### Completeness

An honest holder possessing a valid credential should be able to generate a proof that verifies successfully.

### Soundness

A holder who does not possess a credential satisfying the proof statement should not be able to generate an accepted proof except with negligible probability.

### Zero knowledge

The proof should not reveal private witness information beyond the information explicitly contained in the public statement.

### Credential binding

The proof must refer to the same credential across credential claims, commitment, signature, and Merkle membership.

### State binding

The proof must be interpreted against the intended public verification state.

### Domain separation

Proof-related cryptographic operations must not collide semantically with unrelated protocol operations.

## 34. What a Valid Proof Means

A valid Version 1 qualification proof means:

> There exists a private credential satisfying the requested qualification conditions, whose cryptographic representation is consistent with the public verification state and whose issuer authentication satisfies the JustProof protocol.

It does **not** necessarily mean:

- the holder's real-world identity has been independently verified
- the issuer is trustworthy beyond the issuer registry's authorization
- the qualification has value outside the issuer's stated authority
- every credential attribute has been disclosed
- the human-readable certificate is authentic merely because it exists

The proof establishes only the claims explicitly defined by its statement.

## 35. Privacy Model

The privacy model is based on minimizing the verifier's knowledge.

The desired information flow is:

```text
Holder
  │
  │ private credential
  │
  ▼
Local Prover
  │
  │ zero-knowledge proof
  ▼
Verifier
  │
  ├── knows requested qualification
  ├── knows proof is valid
  └── does not know unnecessary credential data
```

The verifier SHOULD learn no more than the proof request requires.

This principle is central to JustProof.

## 36. Proof Lifecycle

The proof lifecycle is:

```text
1. Verification request
          │
          ▼
2. Holder selects credential
          │
          ▼
3. Private credential validation
          │
          ▼
4. Commitment derivation
          │
          ▼
5. Merkle membership derivation
          │
          ▼
6. Issuer authentication
          │
          ▼
7. Qualification predicate evaluation
          │
          ▼
8. Local ZK proof generation
          │
          ▼
9. Proof submission
          │
          ▼
10. Cryptographic verification
          │
          ▼
11. Protocol-state verification
          │
          ▼
12. VALID / INVALID
```

## 37. Protocol Invariants

Every Version 1 proof implementation MUST preserve the following invariants:

1. A proof MUST identify its protocol version.
2. A proof MUST identify its proof type.
3. A proof MUST establish the requested statement rather than an arbitrary statement.
4. Private credential data MUST remain private.
5. The proof MUST bind credential claims to the credential commitment.
6. The credential commitment MUST bind to the Merkle membership proof.
7. The proof MUST establish valid issuer authentication where required.
8. The proof MUST establish issuer authorization where required.
9. The proof MUST evaluate the requested qualification predicate.
10. Required temporal validity conditions MUST be enforced.
11. Required revocation conditions MUST be enforced.
12. Public inputs MUST be explicitly defined.
13. Private inputs MUST NOT become public outputs.
14. A proof MUST fail closed when any required condition fails.
15. A proof MUST be interpreted against the appropriate public state.
16. A proof request MUST NOT be silently changed after proof generation.
17. A proof generated for one challenge MUST NOT be accepted for another challenge when challenge-based freshness is enabled.
18. Merkle membership MUST NOT be treated as equivalent to credential validity.
19. Cryptographic validity MUST NOT be treated as equivalent to protocol validity.
20. Proof semantics MUST NOT depend on frontend implementation details.

## 38. Test Requirements

Before Version 1 is frozen, the proof protocol MUST have tests covering the complete verification statement.

At minimum, tests MUST cover:

### Valid proofs

- valid credential
- valid issuer signature
- authorized issuer
- valid Merkle membership
- correct qualification
- valid temporal state
- non-revoked credential

### Invalid proofs

- modified credential
- invalid issuer signature
- unauthorized issuer
- invalid Merkle path
- incorrect Merkle root
- incorrect credential commitment
- incorrect qualification
- expired credential
- revoked credential
- malformed public inputs
- malformed proof
- incorrect protocol version
- incorrect proof type

### Privacy

Tests SHOULD verify that:

- private credential values are not public inputs
- private claims are not emitted as outputs
- private Merkle paths are not exposed
- proof verification succeeds without access to the complete credential

### Binding

Tests MUST verify that a prover cannot combine:

```text
credential A
+
signature A
+
commitment B
+
Merkle membership B
```

to produce a valid proof.

The proof must bind all cryptographic components to the same credential.

## 39. Reference Proof Flow

The complete Version 1 proof flow is:

```text
                 PRIVATE
                    │
                    ▼
               Credential
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   Commitment   Signature   Credential Claims
        │           │           │
        ▼           │           ▼
   Merkle Leaf      │       Qualification
        │           │           │
        ▼           │           │
   Merkle Path      │           │
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
              ZK Prover
                    │
                    ▼
                 Proof
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
      Public Root        Public Request
          │                   │
          └─────────┬─────────┘
                    ▼
             ZK Verification
                    │
                    ▼
          Protocol Verification
                    │
                    ▼
               VALID / INVALID
```

## 40. Primitive Freeze

Before the Version 1 proof protocol is considered frozen, the following parameters MUST be finalized:

| Parameter                | Status                          |
| ------------------------ | ------------------------------- |
| Proof system             | Midnight Compact proving system |
| Proof type               | `QUALIFICATION`                 |
| Proof domain             | `JP:CREDENTIAL:V1:PROOF`        |
| Public inputs            | TBD                             |
| Private inputs           | TBD                             |
| Qualification predicates | TBD                             |
| Temporal semantics       | Defined conceptually            |
| Revocation semantics     | TBD                             |
| Request binding          | TBD                             |
| Challenge mechanism      | TBD                             |
| Nullifier mechanism      | TBD                             |
| Issuer signature scheme  | TBD                             |
| Merkle configuration     | Defined separately              |
| Commitment construction  | Defined separately              |
| Test vectors             | TBD                             |

Any change to the cryptographic meaning of these parameters MUST be treated as a protocol change.

## 41. Final Protocol Principle

The proof layer exists to make one statement possible:

> **I can prove that I possess a valid credential satisfying your requested conditions without giving you the credential itself.**

- The commitment layer establishes cryptographic binding.

- The Merkle layer establishes membership in public verification state.

- The issuer layer establishes credential authenticity.

- The proof layer combines those properties into a zero-knowledge statement.

Together, these layers form the core privacy-preserving verification model of JustProof.
