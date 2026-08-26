# JustProof Witness Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies the witness model used by the JustProof Credential Protocol to provide private credential data to Compact circuits.

A witness is a private value required by a circuit to establish a protocol statement.

Witnesses form the boundary between:

- private credential state held by the credential holder; and
- the public verification state maintained by the JustProof contract

The witness layer allows a holder to prove credential properties without publishing the underlying credential.

This specification defines:

- witness responsibilities
- private and public boundaries
- witness categories
- witness semantics
- witness consistency requirements
- credential witnesses
- commitment witnesses
- Merkle witnesses
- issuer authentication witnesses
- claim witnesses
- temporal witnesses
- proof-request witnesses
- witness lifecycle
- failure requirements
- implementation invariants

This document does not define the complete credential schema, commitment primitive, Merkle-tree construction, or proof semantics. Those are defined by the corresponding protocol specifications.

## 2. Witness Model

A Compact circuit receives some values as public inputs and obtains private values through witnesses.

Conceptually:

```text
Private Credential State
        │
        ▼
Witness Provider
        │
        ▼
Compact Witness
        │
        ▼
Compact Circuit
        │
        ▼
Zero-Knowledge Proof
```

A witness MUST provide only the private information required by the circuit.

The witness layer MUST NOT be treated as an additional source of protocol authority.

It supplies private facts; it does not determine whether those facts are valid.

## 3. Witness vs Public Input

The protocol distinguishes between private witnesses and public inputs.

### Witness

A witness is private information known by the prover.

Examples:

```text
credential
issuer signature
Merkle path
credential index
private subject data
holder secret
```

### Public input

A public input is information intentionally made available to the verifier or contract.

Examples:

```text
protocol version
proof type
Merkle root
requested qualification
verification parameters
```

The same underlying conceptual value MUST NOT be treated as both private and public within a single proof statement unless the protocol explicitly requires it.

## 4. Witness Privacy Boundary

The intended information flow is:

```text
                 PRIVATE
                    │
          ┌─────────┴─────────┐
          │                   │
      Credential          Merkle Path
      Signature           Subject Data
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
              Witnesses
                    │
                    ▼
              ZK Circuit
                    │
                    ▼
                  Proof
                    │
                    ▼
                 PUBLIC
```

Witness values MUST NOT be published to the Midnight ledger.

Witness values MUST NOT be included in public circuit outputs unless the protocol explicitly defines the value as public.

## 5. Witness Responsibilities

The witness layer is responsible for:

1. retrieving or deriving private protocol values
2. supplying those values to the appropriate Compact circuit
3. maintaining the expected private/public boundary
4. providing values in the representation required by Compact
5. ensuring deterministic witness derivation where required
6. failing safely when required private state is unavailable

The witness layer is NOT responsible for:

- authorizing issuers
- modifying ledger state
- deciding whether a credential is valid
- bypassing circuit constraints
- changing protocol semantics
- exposing private credential data to the frontend
- creating arbitrary public inputs

## 6. Witness Categories

Version 1 recognizes the following conceptual witness categories:

```text
Credential Witness
Commitment Witness
Merkle Witness
Issuer Authentication Witness
Claim Witness
Temporal Witness
Request-Binding Witness
Holder Secret Witness
```

Not every proof requires every witness.

A circuit MUST request only the witnesses required by its proof statement.

## 7. Credential Witness

The credential witness supplies the private credential to the proving circuit.

Conceptually:

```text
credentialWitness()
    └── returns private credential
```

The credential witness MUST represent the canonical credential defined by `credential.md`.

The witness provider MUST NOT silently modify credential semantics while converting the credential into Compact-compatible values.

The credential witness MUST contain all private credential fields required by the proof statement.

## 8. Credential Witness Consistency

The credential supplied through the witness MUST be internally consistent.

For example:

```text
credential.version
credential.issuerId
credential.qualification
credential.issuedAt
credential.expiresAt
credential.claims
```

MUST correspond to one coherent credential.

A witness provider MUST NOT combine fields originating from different credentials.

For example, this MUST NOT be possible:

```text
credential A
+
issuer signature B
+
Merkle path C
```

The proof circuit MUST bind all witness components to the same credential.

## 9. Commitment Witness

The commitment witness supplies the private information required to derive the credential commitment.

In the simplest Version 1 construction, this is the credential itself.

Conceptually:

```text
credential
    │
    ▼
Commit(credential)
    │
    ▼
credentialCommitment
```

The commitment MUST be derived according to `commitments.md`.

A witness provider MUST NOT accept an independently supplied commitment as authoritative when the circuit can derive it from the credential.

This prevents the witness provider from becoming an alternative source of commitment truth.

## 10. Commitment Consistency

The circuit MUST establish:

```text
Commit(privateCredential) == expectedCommitment
```

where `expectedCommitment` is either:

- derived from the applicable public state; or
- otherwise explicitly defined as a public verification input

The witness provider MUST NOT be able to make an incorrect credential appear to correspond to a commitment by supplying an arbitrary commitment value as private witness data.

## 11. Merkle Witness

The Merkle witness supplies the private information necessary to establish credential membership.

Conceptually:

```text
MerkleWitness {
    path
    index
}
```

Where:

- `path` contains the sibling nodes
- `index` identifies the leaf position

The Merkle witness MUST conform to `merkle-tree.md`.

## 12. Merkle Path Witness

For a tree of depth `D`:

```text
path.length == D
```

The path MUST be ordered from the leaf toward the root.

The witness provider MUST NOT reorder path elements based on frontend or implementation convenience.

The circuit MUST interpret each path element according to the protocol's defined path-index convention.

## 13. Merkle Index Witness

The credential's leaf index is part of the Merkle membership witness.

The index determines the ordering of the current node and its sibling at every tree level.

Conceptually:

```text
index
  │
  ├── bit 0 → leaf-level orientation
  ├── bit 1 → next-level orientation
  ├── ...
  └── bit D-1 → root-level orientation
```

The witness provider MUST supply the correct index corresponding to the credential's registered leaf.

A mismatched index MUST cause proof verification to fail.

## 14. Issuer Authentication Witness

The issuer authentication witness supplies the private or cryptographic data required to establish that the credential was signed by its issuer.

Conceptually:

```text
IssuerAuthenticationWitness {
    signature
    auxiliaryData
}
```

The exact fields depend on the selected signature primitive.

The witness MUST correspond to the issuer identified by the credential.

The circuit MUST establish the relationship:

```text
credential
    │
    ▼
canonical credential
    │
    ▼
issuer signature
    │
    ▼
issuer public key
```

## 15. Issuer Public Key

The issuer public key is normally public protocol state rather than a private witness.

The witness provider MUST NOT treat an arbitrary public key supplied alongside a credential as proof of issuer authority.

The authoritative issuer public key MUST be obtained through the issuer registry or another protocol-defined source.

Therefore:

```text
credential.issuerId
        │
        ▼
issuer registry
        │
        ▼
authorized public key
```

The issuer signature witness is evaluated against that authoritative key.

## 16. Claim Witness

A claim witness supplies private claim values required to evaluate a requested qualification predicate.

For example:

```text
score = 92
```

may be supplied privately when the proof statement is:

```text
score >= 80
```

The verifier learns only the result required by the proof statement.

The witness provider MUST NOT expose the claim value merely because the circuit needs it.

## 17. Selective Claim Witnessing

The witness layer SHOULD support selective retrieval of claims.

If a proof only requires:

```text
qualification
```

the witness provider SHOULD NOT unnecessarily expose unrelated private claims to the circuit or application layer.

For example:

```text
credential {
    qualification
    score
    address
    phone
    dateOfBirth
}
```

does not imply that every proof needs every field.

The proof request determines which claims are relevant.

## 18. Temporal Witness

Temporal witnesses supply private credential timestamps when those timestamps are not intended to be disclosed.

Examples include:

```text
issuedAt
expiresAt
```

The circuit can establish conditions such as:

```text
issuedAt <= verificationTime
```

without revealing the underlying timestamps.

If a timestamp is explicitly defined as public protocol state, it MUST NOT be redundantly treated as private merely to obscure it.

The privacy classification of each temporal value MUST be determined by the proof statement.

## 19. Verification Time

When a proof requires a verification-time comparison, the authoritative `verificationTime` is normally a public input or protocol state.

The witness provider MUST NOT substitute a private timestamp for an authoritative verification time.

For example, the witness provider MUST NOT cause:

```text
expiresAt > holderSelectedTime
```

to be accepted when the protocol requires:

```text
expiresAt > authoritativeVerificationTime
```

The source of verification time is defined by the proof protocol.

## 20. Request-Binding Witness

A proof request may contain information that must be cryptographically bound to the private credential.

If required, the witness layer supplies the private information necessary to establish this relationship.

The public request itself MUST remain a public verification input.

Conceptually:

```text
public request
      │
      ▼
proof statement
      ▲
      │
private credential
```

The circuit MUST establish that the credential satisfies the exact requested statement.

## 21. Holder Secret Witness

A holder secret MAY be required when the protocol uses:

- blinded commitments
- nullifiers
- holder binding
- unlinkability
- proof-of-possession semantics

A holder secret MUST remain private.

Conceptually:

```text
holderSecret
     │
     ├──► commitment construction
     │
     ├──► nullifier construction
     │
     └──► proof binding
```

A holder secret MUST NOT be persisted in public ledger state.

If the Version 1 protocol does not require a holder secret, implementations MUST NOT invent one merely for convenience.

## 22. Witness Derivation

Where possible, witnesses SHOULD be derived deterministically from the holder's private credential state and authoritative public state.

For example:

```text
credential
    │
    ├──► commitment
    ├──► credential identifier
    └──► claim values
```

and:

```text
credential commitment
    │
    └──► Merkle leaf
```

Derived values SHOULD NOT be independently stored when they can be safely recomputed.

This reduces the risk of inconsistent private state.

## 23. Witness State Consistency

All witness values used by a proof MUST describe the same protocol state.

For example:

```text
credential
commitment
Merkle path
Merkle index
issuer signature
```

must correspond to the same credential registration.

A witness provider MUST reject inconsistent state rather than attempting to repair it silently.

## 24. Witness Provider Failure

A witness provider MUST fail when required private information is unavailable or invalid.

Examples include:

- credential not found
- malformed credential
- missing issuer signature
- missing Merkle path
- missing Merkle index
- missing holder secret
- incompatible protocol version
- unsupported proof type
- inconsistent credential state

The provider MUST NOT substitute arbitrary defaults for required private values.

For example, this is invalid:

```text
missing Merkle path
        │
        ▼
use empty path
```

unless an empty path is explicitly valid for the configured tree depth and proof statement.

## 25. Witness Provider and Protocol Validation

The witness provider MAY perform early validation to improve usability and avoid unnecessary proof generation.

For example, it MAY detect:

```text
credential.version != expectedVersion
```

before invoking the circuit.

However, application-level validation MUST NOT replace circuit-level constraints.

A malicious prover must not be able to bypass a circuit condition simply because the honest witness provider normally checks it.

Therefore:

```text
Application validation
        +
Circuit validation
```

are complementary.

The circuit remains authoritative for proof soundness.

## 26. Witness Privacy

Witness values MUST remain private throughout proof generation.

Implementations MUST NOT:

- log private witness values
- expose them through browser UI
- serialize them into public transaction metadata
- publish them to the ledger
- include them in analytics
- transmit them to an unnecessary external service

Debugging systems MUST take care not to accidentally serialize private witness state.

## 27. Witness Lifetime

Witnesses SHOULD have the shortest practical lifetime.

A typical proof operation is:

```text
load private state
       │
       ▼
construct witness
       │
       ▼
generate proof
       │
       ▼
discard temporary witness data
```

A witness MUST NOT be persisted beyond the period required by the application unless persistence is explicitly part of the private credential-storage design.

## 28. Browser Witnesses

When proof generation occurs in the browser, private witness values SHOULD remain in browser-controlled private memory or another explicitly protected private-state mechanism.

The frontend SHOULD NOT need to render witness values.

For example:

```text
UI
 │
 ├── "Generate proof"
 │
 ▼
Witness provider
 │
 ▼
Compact circuit
 │
 ▼
Proof
```

The UI does not need to know the credential's private values merely because the proving circuit does.

## 29. Node Witnesses

Node-based tooling MAY provide witnesses for:

- tests
- deployment tooling
- development
- server-side proving
- protocol test vectors

Node implementations MUST follow the same witness semantics as browser implementations.

The execution environment MUST NOT change the meaning of a witness.

Therefore:

```text
Browser witness
      │
      └──── same protocol semantics ────┐
      │                                 ▼
Node witness                    Compact circuit
```

## 30. Witness Interface

The implementation SHOULD expose witness construction through explicit functions corresponding to protocol concepts.

Conceptually:

```text
buildCredentialWitness()
buildMerkleWitness()
buildIssuerWitness()
buildClaimWitness()
buildProofWitness()
```

The actual TypeScript API MAY differ.

However, implementation names SHOULD map clearly to the normative concepts defined in this document.

A generic untyped witness object SHOULD be avoided where doing so could make incompatible witness values easy to combine accidentally.

## 31. Witness and Compact Circuit Boundary

The Compact circuit is the authoritative consumer of witness values.

The witness implementation MUST match the circuit's declared witness interface.

Conceptually:

```text
witness provider
      │
      │ private values
      ▼
Compact witness interface
      │
      ▼
Compact circuit
```

Changing the witness interface changes the contract/application integration boundary.

Such changes SHOULD be accompanied by corresponding protocol tests.

## 32. Witness and Public Inputs

A value MUST NOT be duplicated as both:

```text
private witness
```

and:

```text
public input
```

unless the circuit intentionally proves equality between the private and public representations.

For example, if the credential commitment is public:

```text
private:
    credential

public:
    expectedCommitment
```

the circuit SHOULD derive:

```text
Commit(credential)
```

and constrain it to:

```text
expectedCommitment
```

This establishes the required binding.

## 33. Witness Binding Requirements

A Version 1 qualification proof MUST bind the relevant witnesses together.

At minimum:

```text
credential
    │
    ├──► issuer signature
    │
    ├──► credential commitment
    │
    ├──► Merkle leaf
    │
    ├──► Merkle path
    │
    └──► qualification claims
```

The circuit MUST ensure that all these values refer to the same credential.

The witness provider MUST NOT be relied upon as the sole mechanism enforcing this relationship.

## 34. Witness Ordering

Where a Compact circuit expects multiple witness values, the order and meaning of those values MUST be deterministic.

The witness provider MUST follow the circuit's defined interface.

For example:

```text
witnesses:
    credential
    issuerSignature
    merklePath
    merkleIndex
```

MUST NOT become:

```text
witnesses:
    credential
    merklePath
    issuerSignature
    merkleIndex
```

unless the circuit interface explicitly changes with it.

## 35. Witness Encoding

Witness values MUST be converted into Compact-compatible representations using deterministic encoding.

The encoding MUST preserve the semantic value of the original protocol object.

In particular, implementations MUST define conversion rules for:

- strings
- integers
- byte arrays
- field elements
- arrays
- optional values
- structured objects

Witness encoding MUST NOT change the cryptographic meaning of the underlying protocol value.

## 36. Witness Versioning

Witnesses MUST identify or inherit the protocol version whose semantics they implement.

A Version 1 witness MUST NOT silently supply values according to another protocol version.

Conceptually:

```text
JP:CREDENTIAL:V1
       │
       ▼
Version 1 witness
       │
       ▼
Version 1 circuit
```

A protocol-version mismatch MUST cause witness construction or proof generation to fail.

## 37. Witness Test Requirements

The witness implementation MUST be tested independently from the frontend.

Tests SHOULD cover:

### Credential witnesses

- valid credential
- malformed credential
- unsupported protocol version
- missing required field

### Commitment witnesses

- correct commitment
- modified credential
- commitment mismatch

### Merkle witnesses

- valid path
- incorrect sibling
- incorrect index
- incorrect root
- incorrect path length

### Issuer witnesses

- valid signature
- invalid signature
- signature for another credential
- signature from another issuer

### Claim witnesses

- correct claim
- missing claim
- incorrect claim
- boundary predicate values

### Privacy

- private values are not emitted as public inputs
- private values are not logged
- private values are not serialized into public transaction state

## 38. Negative Witness Tests

The test suite MUST explicitly verify that inconsistent witnesses cannot produce valid proofs.

For example:

```text
Credential A
Issuer Signature B
```

MUST fail.

Likewise:

```text
Credential A
Commitment B
```

MUST fail.

And:

```text
Credential A
Merkle Path B
```

MUST fail.

These tests are particularly important because the witness layer connects independently stored private values.

## 39. Witness Protocol Invariants

Every Version 1 witness implementation MUST preserve the following invariants:

1. Witnesses represent private protocol data.
2. Witnesses MUST NOT be treated as authoritative public state.
3. Witness values MUST correspond to the protocol version of the circuit consuming them.
4. A credential witness MUST represent one coherent credential.
5. Derived commitments MUST correspond to the witnessed credential.
6. Merkle paths MUST correspond to the witnessed credential commitment.
7. Merkle indexes MUST correspond to the witnessed Merkle path.
8. Issuer signatures MUST correspond to the witnessed credential.
9. Claim witnesses MUST correspond to claims in the witnessed credential.
10. Required temporal witnesses MUST correspond to the witnessed credential.
11. Private witnesses MUST NOT become public merely because a circuit consumes them.
12. The circuit MUST independently enforce security-critical relationships between witnesses.
13. Missing required witnesses MUST cause failure.
14. Invalid witness data MUST NOT be replaced with arbitrary defaults.
15. Witness providers MUST NOT silently combine values belonging to different credentials.
16. Witness construction MUST be deterministic where the underlying protocol requires deterministic values.
17. Witness implementations MUST NOT change protocol semantics based on execution environment.
18. Witnesses MUST NOT be unnecessarily persisted.
19. Witnesses MUST NOT be logged or exposed through the frontend.
20. Witness semantics MUST remain consistent with the credential, commitment, Merkle-tree, and proof specifications.

## 40. Reference Witness Flow

The complete Version 1 witness flow is:

```text
                 PRIVATE STATE
                      │
          ┌───────────┼───────────┐
          │           │           │
      Credential   Signature   Merkle Data
          │           │           │
          │           │       ┌───┴───┐
          │           │       │       │
          │           │      Path   Index
          │           │       │       │
          └───────────┼───────┴───────┘
                      │
                      ▼
               Witness Provider
                      │
                      ▼
              Compact Witnesses
                      │
                      ▼
                 ZK Circuit
                      │
                      ▼
                    Proof
                      │
                      ▼
                 Verification
```

The witness layer therefore acts as the private-data adapter between the holder's credential state and the proof circuit.

## 41. Implementation Boundary

- The protocol specification defines **what each witness means**.

- The TypeScript witness implementation defines **how those witnesses are constructed in the application**.

- The Compact contract defines **how those witnesses are consumed by circuits**.

- The frontend defines **how the holder initiates proof generation**.

No layer should introduce semantics that contradict the witness protocol.

In particular, `utils/witnesses.ts` MUST remain an implementation of this protocol rather than becoming an independent source of credential-validation rules.

## 42. Primitive Freeze

Before Version 1 proof circuits are considered complete, the following witness parameters MUST be finalized:

| Parameter                         | Status               |
| --------------------------------- | -------------------- |
| Credential witness representation | TBD                  |
| Commitment witness representation | TBD                  |
| Merkle path representation        | Defined separately   |
| Merkle index representation       | Defined separately   |
| Issuer signature representation   | TBD                  |
| Claim witness representation      | TBD                  |
| Temporal witness representation   | TBD                  |
| Holder secret representation      | TBD                  |
| Public/private boundary           | Defined conceptually |
| Witness encoding                  | TBD                  |
| Compact witness interface         | TBD                  |
| Witness test vectors              | TBD                  |

Any change that alters the cryptographic meaning of a witness MUST be treated as a protocol change.

## 43. Final Protocol Principle

The witness layer exists to make one statement possible:

> **Private credential information can participate in cryptographic verification without becoming public verification data.**

- Witnesses carry private facts into the proving circuit.

- The circuit determines whether those facts satisfy the protocol.

- The proof system demonstrates that the circuit's constraints were satisfied.

- The ledger receives only the public state and proof information required for verification.

The witness layer therefore forms the critical privacy boundary between the holder's credential and the public JustProof verification system.
