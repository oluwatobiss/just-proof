# JustProof Verification Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies how a JustProof credential proof is verified.

Verification determines whether a submitted proof satisfies the public verification requirements of the JustProof Credential Protocol.

Verification combines the protocol guarantees defined by:

- `credential.md`
- `issuer-registry.md`
- `commitments.md`
- `merkle-tree.md`
- `witnesses.md`; and
- `proofs.md` 

The purpose of verification is to establish a precise statement about a credential without requiring the verifier to obtain the credential's private contents.

## 2. Verification Model

A JustProof verifier evaluates a proof against authoritative public protocol state.

Conceptually:

                    Private Credential
                           │
                           ▼
                    Proof Generation
                           │
                           ▼
                         Proof
                           │
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Public Proof Data          Public Ledger State
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                       Verifier
                           │
                           ▼
                    VALID / INVALID

The verifier MUST NOT require disclosure of the private credential merely to determine whether the proof is valid.

## 3. Verification Statement

A verification result is meaningful only in relation to a specific proof statement.

A successful verification MUST establish the statement encoded by the proof.

For example, a proof MAY establish:

> The prover possesses a credential issued by an authorized issuer that satisfies the requested qualification requirements.

A verifier MUST NOT infer properties that are not established by the proof statement.

For example, proving:

```text
qualification == "Certified Midnight Builder"
```

does not by itself prove:

```text
the holder's name
the holder's address
the holder's date of birth
the holder's exact certificate contents
```

unless those properties are explicitly included in the proof statement.

## 4. Verification Inputs

A Version 1 verification operation MAY require:

```text
VerificationInput {
    proof
    proofType
    protocolVersion
    publicInputs
    ledgerState
}
```

The exact representation is implementation-defined.

The verifier MUST have sufficient information to determine:

1. which protocol version applies
2. which proof statement is being evaluated
3. which public inputs the proof is bound to
4. which issuer state applies
5. which credential commitment state applies
6. whether the cryptographic proof is valid

## 5. Protocol Version

Every proof MUST identify the protocol version under which it was generated.

Version 1 proofs MUST identify:

```text
JP:CREDENTIAL:V1
```

A verifier MUST reject a proof whose protocol version is unsupported.

A verifier MUST NOT silently interpret a proof according to a different protocol version.

Conceptually:

```text
proof.protocolVersion
        │
        ▼
supported?
   │         │
  yes        no
   │          │
   ▼          ▼
continue    INVALID
```

## 6. Proof Type

A proof MUST identify the type of statement it establishes.

Examples MAY include:

```text
QUALIFICATION
CREDENTIAL_MEMBERSHIP
ISSUER_AUTHENTICITY
```

The exact Version 1 proof-type enumeration MUST be frozen by `proofs.md`.

A verifier MUST reject an unknown proof type.

The proof type determines which verification rules apply.

## 7. Verification Layers

Verification SHOULD be understood as a sequence of logically distinct checks:

```text
1. Protocol validity
        ↓
2. Proof-type validity
        ↓
3. Public-input validity
        ↓
4. Issuer authorization
        ↓
5. Credential commitment consistency
        ↓
6. Credential membership
        ↓
7. Proof verification
        ↓
8. Proof-statement validation
        ↓
9. VALID
```

The exact execution order MAY differ for implementation reasons.

The semantic requirements MUST remain equivalent.

## 8. Protocol Validity

The verifier MUST first establish that the proof is structurally compatible with the protocol.

This includes checking:

- protocol version
- proof type
- required public inputs
- required proof fields
- expected encodings
- expected parameter versions

Malformed or incomplete proof objects MUST be rejected.

## 9. Public Input Integrity

Public inputs are part of the statement proved by the zero-knowledge proof.

The verifier MUST ensure that the supplied public inputs correspond exactly to the inputs against which the proof was generated.

A verifier MUST NOT modify public inputs and then interpret the resulting proof as valid.

For example:

```text
proof generated for:

qualification = A

verification request:

qualification = B
```

MUST NOT be accepted.

## 10. Verification Request Binding

If a proof is generated in response to a verification request, the proof MUST be cryptographically bound to the relevant request parameters.

Conceptually:

```
             Verification Request
                      │
                      ▼
                Public Inputs
                      │
                      ▼
                     Proof
```

The verifier MUST verify the exact request that was proven.

A prover MUST NOT be able to generate a proof for one request and present it as satisfying another request.

## 11. Issuer Verification

When the proof statement requires an authorized issuer, the verifier MUST resolve the credential's issuer through the issuer registry.

Conceptually:

```text
credential.issuerId
        │
        ▼
Issuer Registry
        │
        ├── verificationKey
        └── status
```

The verifier MUST establish that:

```text
issuer exists
AND
issuer is authorized under the applicable policy
AND
credential signature verifies under the registered key
```

A valid signature from an unknown or unauthorized issuer MUST NOT satisfy issuer verification.

## 12. Issuer Registry State

The issuer registry is authoritative for issuer authorization.

The verifier MUST use the applicable registry state rather than trusting issuer information supplied by the prover.

For example, a prover MUST NOT be able to provide:

```text
issuerId
verificationKey
status = ACTIVE
```

as private or public proof metadata and thereby establish authorization if the authoritative registry does not contain that state.

## 13. Credential Commitment Verification

When the proof relies on a credential commitment, the verifier MUST establish that the commitment used by the proof corresponds to the protocol-defined credential commitment.

Conceptually:

```text
private credential
        │
        ▼
Commit(credential)
        │
        ▼
expected commitment
```

The proof MUST establish the appropriate equality between the derived commitment and the public commitment state.

The verifier MUST NOT trust an independently supplied commitment merely because it is included in the proof request.

## 14. Commitment State

The authoritative credential commitment state MUST come from the protocol-defined source.

Depending on the protocol version, this MAY be:

- a Compact ledger state
- a Merkle-tree root
- another authenticated public state

The verifier MUST use the commitment representation defined by `commitments.md`.

## 15. Merkle Membership Verification

If the proof requires credential membership, the verifier MUST establish that the credential commitment belongs to the applicable credential Merkle tree.

Conceptually:

```text
credential commitment
        │
        ▼
      leaf
        │
        ▼
   Merkle proof
        │
        ▼
   expected root
```

The proof MUST establish membership against the correct Merkle root.

A credential commitment that is not a member of the authoritative tree MUST NOT satisfy membership verification.

## 16. Merkle Root Selection

The verifier MUST use the Merkle root associated with the applicable verification state.

The verifier MUST NOT accept an arbitrary root supplied by the prover unless that root is itself authenticated by authoritative protocol state.

Conceptually:

```text
Authoritative Ledger State
          │
          ▼
     Merkle Root
          │
          ▼
     Proof Verification
```

## 17. Proof Verification

The verifier MUST cryptographically verify the proof using the proof system and verification parameters defined by `proofs.md`.

Conceptually:

```text
Verify(
    verificationKey,
    proof,
    publicInputs
)
```

A cryptographically invalid proof MUST be rejected.

Cryptographic verification MUST NOT be replaced by application-level checks.

## 18. Proof Statement Verification

A cryptographically valid proof is not necessarily sufficient by itself.

The verifier MUST also ensure that the public statement represented by the proof satisfies the requested verification policy.

For example:

```text
Proof proves:

qualification = "Certified Midnight Builder"
```

A verifier requesting:

```text
qualification = "Certified Midnight Builder"
```

may accept the proof.

A verifier requesting:

```text
qualification = "Certified Midnight Instructor"
```

MUST reject it.

## 19. Verification Policy

The verification policy defines the conditions under which a proof is accepted.

A policy MAY specify:

```text
required qualification
required issuer
required issuer status
credential validity requirements
credential membership requirements
proof freshness
protocol version
proof type
```

The policy MUST be explicit.

A verifier MUST NOT silently add or remove security-critical requirements.

## 20. Qualification Verification

A qualification proof MUST establish the requested qualification predicate without requiring disclosure of unrelated credential information.

Conceptually:

```text
Private:
    credential

Public:
    requestedQualification

Proof establishes:

    credential satisfies requestedQualification
```

The verifier learns the result of the predicate rather than the private data used to evaluate it.

## 21. Temporal Verification

If the proof statement includes credential validity periods, the verifier MUST use the authoritative verification time defined by the protocol.

Conceptually:

```text
credential.expiration
        │
        ▼
authoritative verification time
        │
        ▼
valid / expired
```

A prover MUST NOT control the verification time if the protocol defines it as authoritative public state.

If temporal verification is not part of a particular proof type, the verifier MUST NOT infer temporal validity from the mere existence of a proof.

## 22. Credential Revocation

Credential revocation is distinct from issuer authorization.

The verifier MUST consult the revocation state defined by `revocation.md`.

Conceptually:

```text
Issuer Registry
       │
       └── issuer authorized?

Credential Revocation State
       │
       └── credential revoked?

Both may be required.
```

If revocation is not part of the applicable Version 1 verification policy, a verifier MUST NOT claim that successful proof verification establishes non-revocation.

## 23. Historical Verification

A proof MAY be verified against current or historical protocol state depending on the verification policy.

The policy MUST specify which state is authoritative.

For example:

```text
CURRENT
```

may mean:

> The credential and issuer satisfy the current verification requirements.

Whereas:

```text
AT_ISSUANCE
```

may mean:

> The credential satisfied the relevant registry conditions when it was issued.

These are different statements and MUST NOT be conflated.

## 24. Proof Freshness

A proof may become unsuitable for verification even if its underlying cryptographic proof remains valid.

If freshness is required, the proof MUST include or bind to an appropriate freshness mechanism.

Possible mechanisms include:

- verification timestamp
- challenge
- nonce
- verification request identifier
- protocol-defined validity period

Version 1 MUST explicitly define whether proofs are:

```text
reusable
```

or:

```text
bound to a particular verification request
```

A verifier MUST NOT assume replay protection unless the proof protocol explicitly provides it.

## 25. Replay Resistance

If Version 1 requires request-specific proofs, the proof MUST bind to a verifier-provided challenge or equivalent unique value.

Conceptually:

```text
Verifier
   │
   │ challenge
   ▼
Prover
   │
   │ proof bound to challenge
   ▼
Verifier
```

A proof generated for challenge `A` MUST NOT be accepted for challenge `B`.

If Version 1 uses reusable proofs instead, this requirement does not apply, but the protocol MUST explicitly acknowledge that proofs may be replayed.

## 26. Verification Result

A successful verification SHOULD return a structured result rather than only a boolean.

Conceptually:

```text
VerificationResult {
    valid
    protocolVersion
    proofType
    statement
}
```

Additional non-sensitive metadata MAY include:

```text
issuerId
qualification
verificationState
```

The result MUST NOT expose private credential fields merely because they were used during proof generation.

## 27. Valid Result

`VALID` means:

> The supplied proof is cryptographically valid and satisfies every protocol condition required by the applicable verification policy.

It does NOT necessarily mean:

- the credential holder's identity is known
- every field in the credential is valid
- the issuer is currently operating
- the credential is not revoked, unless checked
- the proof is fresh, unless freshness is checked
- the underlying credential is publicly available

The verifier MUST communicate only the guarantees actually established.

## 28. Invalid Result

`INVALID` means that at least one required verification condition failed.

The verifier MAY provide a machine-readable failure reason.

Possible categories include:

```text
UNSUPPORTED_PROTOCOL
UNSUPPORTED_PROOF_TYPE
MALFORMED_PROOF
INVALID_PUBLIC_INPUTS
UNKNOWN_ISSUER
UNAUTHORIZED_ISSUER
INVALID_SIGNATURE
INVALID_COMMITMENT
INVALID_MERKLE_MEMBERSHIP
INVALID_PROOF
STATEMENT_NOT_SATISFIED
EXPIRED_CREDENTIAL
REVOKED_CREDENTIAL
STALE_PROOF
```

The exact error taxonomy MUST be frozen before the Version 1 verifier API is finalized.

## 29. Failure Semantics

Verification MUST fail closed.

If the verifier cannot establish a required security condition, it MUST NOT return `VALID`.

For example:

```text
issuer registry unavailable
        │
        ▼
cannot establish issuer authorization
        │
        ▼
NOT VALID
```

The verifier MUST distinguish between:

```text
PROVEN INVALID
```

and:

```text
COULD NOT VERIFY
```

where the application needs to communicate infrastructure or availability failures separately.

## 30. Verification vs Credential Inspection

A verifier MUST NOT require the original credential merely to verify a valid JustProof proof.

The protocol is specifically designed to allow:

```text
Credential Holder
       │
       │ private credential
       ▼
Proof
       │
       ▼
Verifier
```

without:

```text
Credential Holder
       │
       │ full credential
       ▼
Verifier
```

The verifier receives the minimum public information required by the proof statement.

## 31. Selective Disclosure

A proof MAY reveal selected credential properties while keeping unrelated properties private.

For example, a credential may contain:

```text
name
email
qualification
score
address
dateOfBirth
```

while the proof establishes only:

```text
qualification = "Certified Midnight Builder"
```

The verifier MUST NOT infer the undisclosed fields.

Selective disclosure is therefore a property of the proof statement, not an implicit property of every credential.

## 32. Verifier Trust Boundaries

The verifier SHOULD distinguish between:

### Authoritative protocol state

Examples:

```text
issuer registry
credential commitment state
Merkle root
```

### Proof-supplied data

Examples:

```text
proof
public inputs
proof metadata
```

### Untrusted presentation metadata

Examples:

```text
issuer display name
credential title
images
external URLs
```

Security decisions MUST rely on authoritative state and cryptographically verified proof data.

## 33. External Metadata

A verifier MAY retrieve human-readable issuer or credential metadata from an external source.

External metadata MUST NOT determine whether a proof is cryptographically valid.

For example:

```text
metadata says:
"Certified Midnight Builder"

```

does not establish that:

```text
proof proves:
"Certified Midnight Builder"
```

The proof statement remains authoritative.

## 34. Verification Independence

A verifier SHOULD be independently capable of reproducing the verification result from:

```text
proof
+
public inputs
+
authoritative protocol state
```

The verifier MUST NOT depend on the prover's application logic to determine validity.

This is an important property of a trust-minimized verification system.

## 35. Verification Flow

The recommended Version 1 verification flow is:

```text
Receive proof
     │
     ▼
Validate structure
     │
     ▼
Check protocol version
     │
     ▼
Check proof type
     │
     ▼
Validate public inputs
     │
     ▼
Resolve issuer state
     │
     ▼
Verify issuer authorization
     │
     ▼
Verify credential binding
     │
     ▼
Verify Merkle membership
     │
     ▼
Verify zero-knowledge proof
     │
     ▼
Evaluate verification policy
     │
     ▼
Check temporal / revocation state
     │
     ▼
Return verification result
```

Not every proof type necessarily requires every step.

The applicable proof specification determines which checks are mandatory.

## 36. Verification Order and Security

The order shown above is primarily a conceptual model.

An implementation MAY reorder checks for:

- efficiency
- early failure
- reduced computation
- reduced network access

However, optimization MUST NOT cause a required verification condition to be skipped.

## 37. Verification and Compact Contracts

When verification is performed by a Compact contract, the contract MUST enforce all security-critical protocol constraints that are required for on-chain verification.

The frontend MUST NOT be treated as a trusted verifier.

Conceptually:

```text
Frontend
   │
   │ presentation
   ▼
Compact Contract
   │
   │ authoritative verification
   ▼
Ledger State
```

Client-side validation MAY improve user experience but MUST NOT establish protocol validity.

## 38. Off-Chain Verification

If JustProof supports off-chain verification, the verifier MUST use the same cryptographic and semantic rules as the Compact contract.

An off-chain verifier MUST NOT implement a weaker interpretation of the protocol.

Conceptually:

```text
                 Verification Rules
                       │
              ┌────────┴────────┐
              │                 │
        Compact verifier   Off-chain verifier
              │                 │
              └────────┬────────┘
                       │
                 same semantics
```

## 39. Verification Test Requirements

The test suite MUST cover at least:

### Valid proofs

- valid protocol version
- valid proof type
- valid issuer
- valid issuer signature
- valid commitment
- valid Merkle membership
- valid qualification predicate

### Invalid proofs

- malformed proof
- unsupported protocol version
- unsupported proof type
- invalid public input
- unknown issuer
- unauthorized issuer
- invalid signature
- invalid commitment
- invalid Merkle path
- wrong Merkle root
- invalid proof
- unsatisfied qualification predicate

### Policy failures

- expired credential
- revoked credential, if supported
- incorrect requested qualification
- incorrect issuer requirement
- stale proof, if supported
- wrong verification challenge, if supported

### Privacy

Tests MUST verify that successful verification does not require disclosure of private credential fields.

## 40. Negative Verification Tests

The test suite MUST explicitly test combinations that could otherwise appear superficially valid.

For example:

```text
Valid credential
+
Valid signature
+
Unauthorized issuer
```

MUST fail.

Likewise:

```text
Authorized issuer
+
Valid credential signature
+
Credential not in authoritative Merkle tree
```

MUST fail when membership is required.

And:

```text
Valid credential
+
Valid issuer
+
Valid membership
+
Proof for qualification A
+
Request for qualification B
```

MUST fail.

## 41. Verification Invariants

Every Version 1 verifier MUST preserve the following invariants:

1. Verification is defined relative to a specific protocol version.
2. Verification is defined relative to a specific proof type.
3. Public inputs MUST match the statement proved.
4. Issuer authorization MUST be established from authoritative registry state.
5. A signature from an unauthorized issuer MUST NOT satisfy issuer verification.
6. Credential commitments MUST correspond to the credential represented by the proof.
7. Merkle membership MUST use the authoritative Merkle root.
8. Cryptographic proof verification MUST be performed according to `proofs.md`.
9. The verification policy MUST be explicit.
10. Verification MUST fail closed.
11. A verifier MUST NOT infer undisclosed credential properties.
12. A valid proof MUST establish only the statement encoded by the proof.
13. Revocation MUST NOT be inferred unless revocation state is actually checked.
14. Freshness MUST NOT be inferred unless freshness is actually checked.
15. Client-side validation MUST NOT replace security-critical protocol verification.
16. Off-chain and on-chain verification MUST preserve the same protocol semantics.
17. Private credential data MUST NOT be required solely for verification.
18. Verification results MUST NOT expose unnecessary private information.
19. Verification MUST use authoritative protocol state rather than prover-supplied authority claims.
20. Changes to the meaning of `VALID` constitute a protocol change.

## 42. Relationship to Other Protocol Specifications

The protocol specifications establish separate guarantees:

```text
credential.md
    │
    └── defines the credential

issuer-registry.md
    │
    └── defines authorized issuers

commitments.md
    │
    └── defines credential binding

merkle-tree.md
    │
    └── defines credential membership

witnesses.md
    │
    └── defines private circuit inputs

proofs.md
    │
    └── defines cryptographic proof statements

verification.md
    │
    └── defines how those guarantees are evaluated together
```

`verification.md` therefore acts as the integration specification for the protocol.

## 43. Reference Verification Statement

A Version 1 qualification proof SHOULD ultimately establish a statement conceptually equivalent to:

```text
The prover possesses a credential that:

1. conforms to JP:CREDENTIAL:V1
2. identifies an issuer registered in the JustProof issuer registry
3. is authenticated by that issuer's registered verification key
4. corresponds to the credential commitment represented by the proof
5. is included in the authoritative credential state when membership is required
6. satisfies the requested qualification predicate; and
7. satisfies any additional validity requirements defined by the verification policy
```

The verifier learns the truth of this statement without necessarily learning the private credential itself.

## 44. Version 1 Verification Decisions

The following decisions are recommended for the initial MVP:

| Decision                           | Version 1                             |
| ---------------------------------- | ------------------------------------- |
| Protocol namespace                 | `JP:CREDENTIAL:V1`                    |
| Proof verification                 | Required                              |
| Issuer registry verification       | Required                              |
| Credential commitment verification | Required                              |
| Merkle membership                  | Required where proof type requires it |
| Selective disclosure               | Supported                             |
| Full credential disclosure         | Not required                          |
| Verification failure               | Fail closed                           |
| Client-side verification           | Non-authoritative                     |
| On-chain verification              | Authoritative where applicable        |
| Proof freshness                    | TBD                                   |
| Replay protection                  | TBD                                   |
| Credential revocation              | TBD                                   |
| Historical verification            | TBD                                   |
| Off-chain verifier                 | Same semantics as on-chain verifier   |

## 45. Open Protocol Decisions

Before Version 1 is frozen, the following MUST be resolved:

1. Exact Version 1 proof types.
2. Exact verification-policy representation.
3. Whether proofs are reusable or request-bound.
4. Whether Version 1 requires nonce/challenge-based replay protection.
5. Exact temporal verification semantics.
6. Credential revocation semantics.
7. Historical verification semantics.
8. Exact failure/error taxonomy.
9. Which verification checks are performed on-chain.
10. Which checks, if any, are intentionally performed only off-chain.

Until these decisions are frozen, this document remains a protocol draft.

## 46. Final Protocol Principle

The purpose of JustProof verification is not to answer:

> "Can I see the credential?"

It is to answer:

> **"Can I cryptographically verify the specific qualification claim without requiring the credential itself to be disclosed?"**

A successful verification therefore represents a precise cryptographic statement:

```text
PRIVATE CREDENTIAL
       │
       ▼
  Zero-Knowledge Proof
       │
       ├── issuer authenticity
       ├── credential binding
       ├── credential membership
       └── qualification predicate
       │
       ▼
     VERIFIER
       │
       ▼
      VALID
```

`VALID` means that the requested statement has been established according to the JustProof Credential Protocol and the applicable verification policy.

It does not mean more than that.
