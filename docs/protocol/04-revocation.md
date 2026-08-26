# JustProof Credential Revocation Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies credential revocation for the JustProof Credential Protocol.

Revocation allows an authorized issuer to invalidate a previously issued credential without requiring the credential itself to be publicly disclosed.

The revocation system establishes whether a specific credential remains valid under the applicable verification policy.

The revocation protocol is intentionally separate from issuer authorization.

The issuer registry answers:

> Is this issuer authorized to issue credentials?

The revocation registry answers:

> Is this particular credential still valid?

Together they establish issuer and credential status.

## 2. Scope

This specification defines:

- credential revocation
- credential identifiers
- revocation state
- revocation authority
- revocation operations
- revocation verification
- proof interaction
- historical revocation state
- unrevocation policy
- privacy requirements
- contract requirements
- verification semantics
- failure conditions

This specification does not define:

- the complete credential schema
- issuer registration
- credential commitments
- the credential Merkle tree
- zero-knowledge proof construction
- issuer signature construction

Those concerns are defined by the corresponding protocol specifications.

## 3. Revocation Model

A credential may transition from valid to revoked after issuance.

Conceptually:

```text
                 Credential Issuance
                         │
                         ▼
                      VALID
                         │
                         │ revoke
                         ▼
                     REVOKED
```

The protocol MUST distinguish:

```text
VALID
```

from:

```text
REVOKED
```

A revoked credential MUST NOT satisfy a verification policy that requires a currently valid credential.

## 4. Revocation and Issuer Authorization

Issuer authorization and credential revocation are independent properties.

An issuer MAY be authorized while a credential issued by that issuer is revoked.

Likewise, an issuer MAY later become unauthorized while previously issued credentials remain represented in historical registry state.

Conceptually:

```text
             Issuer Registry
                   │
                   ▼
          Issuer authorized?
                   │
                   │
             Credential
                   │
                   ▼
         Revocation Registry
                   │
                   ▼
          Credential revoked?
```

A verification policy MAY require both conditions.

## 5. Credential Identity

Every revocable credential MUST have a stable protocol identifier.

The identifier MUST uniquely identify the credential whose validity is being tracked.

The identifier MUST NOT depend on mutable presentation metadata.

Conceptually:

```
Credential
    │
    ▼
credentialId
```

The exact credential identifier construction MUST be frozen as part of Version 1.

## 6. Credential Identifier Construction

The recommended Version 1 construction is to derive the credential identifier from the canonical credential representation.

Conceptually:

```text
credentialId =
    H(
        "JP:CREDENTIAL:V1:ID" ||
        canonicalCredential
    )
```

The exact encoding and hashing rules MUST follow the canonical serialization rules defined by the credential and commitment specifications.

An implementation MUST NOT derive a credential identifier from:

- display names
- certificate filenames
- URLs
- database IDs
- mutable issuer metadata
- frontend-generated identifiers

## 7. Relationship Between Credential ID and Commitment

The credential identifier and credential commitment serve different purposes.

The credential identifier establishes:

> Which credential is being referenced by revocation state.

The commitment establishes:

> A cryptographic binding to the credential contents.

Conceptually:

```text
Credential
   │
   ├──────────► credentialId
   │
   └──────────► credentialCommitment
```

They MAY be derived from the same canonical credential, but they MUST NOT be treated as interchangeable unless the protocol explicitly defines them as equivalent.

## 8. Recommended V1 Identifier

For Version 1, the protocol SHOULD use a deterministic credential identifier derived from the credential commitment.

Conceptually:

```text
credentialId =
    H(
        "JP:CREDENTIAL:V1:REVOCATION" ||
        credentialCommitment
    )
```

This has several advantages:

- the identifier is deterministic
- the identifier does not require publishing the credential
- the identifier is cryptographically bound to the credential
- the same credential produces the same identifier
- the revocation registry does not need to store private credential data

The exact construction MUST be frozen before contract implementation.

## 9. Revocation Registry

The revocation registry is public protocol state recording the revocation status of credentials.

Conceptually:

```text
Revocation Registry
│
├── credential A → VALID
├── credential B → REVOKED
├── credential C → VALID
└── credential D → REVOKED
```

The registry MUST NOT contain the private credential itself.

## 10. Minimal Revocation State

Version 1 SHOULD use the smallest state necessary to determine whether a credential has been revoked.

Conceptually:

```text
RevocationRecord {
    credentialId
    revoked
}
```

An implementation MAY represent this more efficiently using:

- a set of revoked identifiers
- a map
- a sparse Merkle tree
- another authenticated data structure

The representation MUST preserve the protocol semantics defined here.

## 11. Recommended V1 Representation

For the initial MVP, a simple authenticated set of revoked credential identifiers is recommended.

Conceptually:

```text
RevokedCredentials = {
    credentialIdA,
    credentialIdB,
    credentialIdC
}
```

Membership means:

```text
credentialId ∈ RevokedCredentials
```

Therefore:

```text
Revoked(credentialId)
    =
credentialId ∈ RevokedCredentials
```

This keeps the initial protocol significantly simpler than introducing a dedicated revocation Merkle tree.

## 12. Revocation State

A credential is considered revoked when its identifier is present in authoritative revocation state.

Conceptually:

```text
credentialId
    │
    ▼
Revocation State
    │
    ├── present → REVOKED
    └── absent  → NOT REVOKED
```

The absence of a credential identifier MUST mean only:

> No revocation record currently exists.

It MUST NOT independently establish every other validity property of the credential.

## 13. Revocation Authority

Only an authorized party MAY revoke a credential.

For Version 1, the credential issuer SHOULD be the revocation authority for credentials it issued.

Conceptually:

```text
             Issuer
               │
               │ revoke
               ▼
         Revocation State
```

The issuer MUST NOT be able to revoke credentials issued by another issuer.

## 14. Issuer Binding

A revocation request MUST establish that the revoking party is authorized to revoke the specified credential.

Conceptually:

```text
credentialId
     │
     ▼
credential
     │
     ▼
issuerId
     │
     ▼
Issuer Registry
     │
     ▼
Authorized Issuer
```

The revocation mechanism MUST prevent:

```text
Issuer A
    │
    └── revoke Credential B
                     │
                     └── issued by Issuer B
```

unless an explicit protocol rule grants Issuer A that authority.

## 15. Revocation Authorization

The revocation operation MUST authenticate the revoking issuer.

Conceptually:

```text
revoke(
    credentialId,
    authorization
)
```

The authorization MAY be established through:

- the issuer's registered signing key
- an issuer-controlled authorization circuit
- another protocol-defined authority mechanism

The exact mechanism MUST be frozen for Version 1.

## 16. Revocation Operation

A Version 1 revocation operation SHOULD conceptually perform:

1. Authenticate the caller.
2. Establish the caller's issuer identity.
3. Establish that the issuer is authorized.
4. Establish that the credential belongs to that issuer.
5. Mark the credential as revoked.
6. Prevent unauthorized modification of the revocation state.

The operation MUST be atomic with respect to the resulting revocation state.

## 17. Revocation by Credential ID

The issuer SHOULD revoke a credential using its canonical `credentialId`.

Conceptually:

```text
revokeCredential(credentialId)
```

The issuer MUST NOT need to publish the complete credential merely to revoke it.

This preserves the privacy properties of the protocol.

## 18. Revocation by Commitment

If the Version 1 credential identifier is derived from the credential commitment, an issuer MAY derive the revocation identifier from the commitment.

Conceptually:

```text
credential
    │
    ▼
commitment
    │
    ▼
credentialId
    │
    ▼
revocation state
```

The issuer does not need to publish the credential contents.

## 19. Revocation and Credential Privacy

Revocation MUST NOT require publication of private credential fields.

The revocation state SHOULD reveal only:

```text
credentialId
+
revocation state
```

It SHOULD NOT reveal:

```text
name
address
email
date of birth
qualification details
private claims
```

unless those values are already intentionally public protocol data.

## 20. Privacy Considerations

Although the credential itself remains private, a public revocation registry containing stable credential identifiers may introduce linkability.

Therefore Version 1 MUST explicitly consider whether:

```text
credentialId
```

is itself privacy-sensitive.

If the credential identifier is derived from a publicly known credential commitment, repeated use of that identifier may allow observers to correlate verification activity.

The Version 1 privacy model SHOULD therefore avoid unnecessarily exposing credential identifiers in application-level presentation.

## 21. Revocation and Zero-Knowledge Proofs

A qualification proof MAY establish non-revocation without revealing the credential identifier to the verifier.

Conceptually:

```text
Private:
    credential
    credentialId

Public:
    revocation state

        │
        ▼
    ZK Circuit
        │
        ▼
Proof of non-revocation
```

The circuit establishes:

```text
credentialId ∉ RevokedCredentials
```

without requiring the credential identifier to become part of the public proof statement.

## 22. Public vs Private Revocation Checking

There are two possible Version 1 approaches.

### Public identifier verification

The credential identifier is supplied publicly and the verifier checks:

```text
credentialId ∉ RevokedCredentials
```

### Zero-knowledge non-revocation

The credential identifier remains private and the proof establishes:

```text
credentialId ∉ RevokedCredentials
```

The second approach provides stronger privacy.

Version 1 SHOULD prefer zero-knowledge non-revocation when the chosen Compact architecture can support it without disproportionate complexity.

## 23. Revocation State and Merkle Trees

If the revocation registry later becomes large, a dedicated authenticated data structure MAY be introduced.

For example:

```text
Revocation Entries
      │
      ▼
Revocation Merkle Tree
      │
      ▼
Revocation Root
```

A verifier could then verify non-membership against an authenticated revocation root.

However, Version 1 SHOULD NOT introduce a second Merkle-tree construction unless required by scale or proof efficiency.

The credential Merkle tree and revocation structure serve different purposes.

## 24. Credential Merkle Tree vs Revocation State

The credential Merkle tree establishes:

> The credential is represented in the authoritative credential state.

The revocation registry establishes:

> The credential has not been invalidated.

Conceptually:

```text
Credential
    │
    ├──► Credential Merkle Tree
    │         │
    │         └── membership
    │
    └──► Revocation Registry
              │
              └── non-revocation
```

Both may be required for a valid qualification proof.

## 25. Revocation and Issuance

Issuance and revocation are separate lifecycle operations.

Conceptually:

```text
ISSUE
  │
  ▼
ACTIVE
  │
  │ revoke
  ▼
REVOKED
```

A credential MUST NOT be considered revoked merely because it has never been verified.

Likewise, a credential MUST NOT be considered valid merely because it was once issued.

## 26. Revocation Irreversibility

Version 1 SHOULD make revocation irreversible.

Once:

```text
credentialId ∈ RevokedCredentials
```

becomes true, the protocol SHOULD NOT allow the identifier to be removed.

This provides a simple and auditable state transition:

```text
NOT REVOKED → REVOKED
```

rather than:

```text
NOT REVOKED ⇄ REVOKED
```

Irreversible revocation is recommended for the MVP unless the product requirements explicitly require reinstatement.

## 27. Unrevocation

Version 1 SHOULD NOT support unrevocation.

If an issuer needs to restore a qualification after revocation, the preferred mechanism SHOULD be:

```text
revoke Credential A
        │
        ▼
issue Credential B
```

Credential B represents a new credential lifecycle.

This avoids ambiguity about whether a previously revoked credential should become valid again.

## 28. Reissuance

Reissuance MUST produce a distinct credential identity.

Conceptually:

```text
Credential A
    │
    ▼
  REVOKED
    │
    ▼
New issuance
    │
    ▼
Credential B
```

Credential B MUST NOT reuse Credential A's `credentialId`.

This preserves an unambiguous credential history.

## 29. Revocation Timestamp

The registry MAY record when a credential was revoked.

Conceptually:

```text
RevocationRecord {
    credentialId
    revokedAt
}
```

The timestamp is useful for historical verification.

However, Version 1 MAY omit the timestamp if the ledger transaction itself provides an authoritative ordering or timestamp sufficient for the application's requirements.

If `revokedAt` is included, its semantic meaning MUST be explicitly defined.

## 30. Historical Verification

Historical verification distinguishes between:

> Was the credential valid at time T?

and:

> Is the credential valid now?

These are different statements.

If Version 1 supports historical verification, the verifier MUST evaluate revocation state relative to the relevant historical point.

Conceptually:

```text
Verification Time
      │
      ▼
Revocation State
      │
      ▼
Valid at T?
```

If historical verification is not supported, the verifier MUST use current authoritative revocation state.

## 31. Current Verification

The default Version 1 verification policy SHOULD be current-state verification.

A credential is currently valid with respect to revocation when:

```text
credentialId ∉ CurrentRevocationState
```

subject to all other verification requirements.

Therefore:

```text
ValidNow(credential)
    =
AuthorizedIssuer
&&
ValidSignature
&&
CredentialMembership
&&
NotRevoked
&&
QualificationSatisfied
```

## 32. Revocation and Proof Lifetime

A zero-knowledge proof may remain cryptographically valid after the underlying credential is revoked.

Therefore:

```text
CryptographicallyValid(proof)
```

does NOT necessarily imply:

```text
CurrentlyValid(credential)
```

The verifier MUST evaluate current revocation state whenever the verification policy requires current validity.

This distinction is critical.

## 33. Proofs Generated Before Revocation

Suppose:

```text
T1 = proof generated
T2 = credential revoked
T3 = proof verified
```

A proof generated at `T1` MAY still be cryptographically valid at `T3`.

However, if the verification policy requires current credential validity, the verifier MUST reject the proof at `T3`.

Conceptually:

```text
T1                    T2                    T3
│                     │                     │
│ generate proof      │ revoke              │ verify
│                     │                     │
▼                     ▼                     ▼
VALID ───────────────► REVOKED ───────────► INVALID
```

This prevents previously generated proofs from indefinitely bypassing revocation.

## 34. Proofs Bound to Historical State

If Version 1 supports historical verification, a proof MAY instead establish:

> The credential was not revoked at a specified historical state.

Such a proof MUST be explicitly bound to:

- the relevant revocation state
- the relevant state identifier or root
- the historical verification point

A historical non-revocation proof MUST NOT automatically imply current non-revocation.

## 35. Revocation State Freshness

When current validity is required, the verifier MUST use sufficiently current revocation state.

A stale revocation snapshot MUST NOT be presented as authoritative current state.

If the verifier cannot obtain sufficiently current revocation state, it MUST NOT return `VALID` for a policy requiring current revocation status.

## 36. Revocation Registry Authority

The revocation registry MUST be authoritative.

The frontend MUST NOT maintain an independent revocation list and treat it as authoritative.

For example:

```text
    Frontend state
        │
        └── revoked = false

does not override:

    Ledger state
        │
        └── credentialId = REVOKED
```

The authoritative contract state determines protocol validity.

## 37. Duplicate Revocation

Revoking an already revoked credential SHOULD be idempotent.

Conceptually:

```text
    revoke(A)
    revoke(A)
```

SHOULD result in:

```text
    A = REVOKED
```

without creating contradictory state.

The implementation MAY reject the second operation instead, but it MUST NOT produce a state in which the credential becomes valid again.

## 38. Unknown Credential Revocation

An issuer MUST NOT revoke an arbitrary identifier unless the protocol can establish that the identifier corresponds to a credential issued by that issuer.

This prevents:

```text
    Issuer A
        │
        ▼
    arbitrary identifier
        │
        ▼
    unauthorized revocation
```

The revocation circuit MUST establish the issuer-to-credential relationship.

## 39. Revocation Authorization and Issuer Registry

The issuer registry provides the authorization root for issuer-controlled revocation.

Conceptually:

```text
    Revocation Request
          │
          ▼
    Revoking Issuer
          │
          ▼
    Issuer Registry
          │
          ▼
    Authorized?
          │
          ▼
    Credential Ownership
          │
          ▼
    Revoke
```

An issuer whose registry authorization does not satisfy the applicable policy MUST NOT be able to perform issuer-controlled revocation.

## 40. Revocation and Credential Ownership

The protocol MUST establish that the issuer performing a revocation is the issuer associated with the credential.

Conceptually:

```text
    credential.issuerId
            │
            ▼
      Issuer Registry
            │
            ▼
    revoking issuer identity
```

These identities MUST match.

This prevents one authorized issuer from revoking another issuer's credentials.

## 41. Revocation and Signatures

Revocation MUST NOT modify the original credential signature.

The original credential remains a historical artifact representing what the issuer signed at issuance.

Revocation changes the credential's validity state.

Conceptually:

```text
    Credential
       │
       ├── signature → "This credential was issued by me."
       │
       └── revocation → "This credential is no longer valid."
```

These are separate statements.

## 42. Revocation and Commitment

Revocation MUST NOT modify the credential commitment.

The commitment remains bound to the original credential.

Revocation state is additional public state associated with the credential identifier.

Conceptually:

```text
    Credential
       │
       ├──► Commitment
       │
       └──► Credential ID
                  │
                  ▼
            Revocation State
```

Changing revocation state MUST NOT change the credential commitment.

## 43. Revocation and Merkle Membership

Revocation MUST NOT require removing the credential from the credential Merkle tree.

A revoked credential may remain a valid member of historical credential state while simultaneously being invalid for current verification.

Conceptually:

```text
    Credential
       │
       ├── Merkle membership = TRUE
       │
       └── Revoked = TRUE
```

Therefore:

```text
    Membership ≠ Current Validity
```

## 44. Verification Algorithm

For a current-state qualification proof, the verifier SHOULD conceptually perform:

1. Validate proof structure.
2. Validate protocol version.
3. Validate proof type.
4. Validate public inputs.
5. Resolve issuer registry state.
6. Verify issuer authorization.
7. Verify issuer authentication.
8. Verify credential commitment.
9. Verify credential Merkle membership.
10. Verify credential non-revocation.
11. Verify the zero-knowledge proof.
12. Evaluate the requested qualification.
13. Return VALID.

The exact implementation order MAY differ.

All required conditions MUST be enforced.

## 45. Revocation Verification

For current-state verification:

```text
    NotRevoked(credentialId)
        =
    credentialId ∉ CurrentRevocationState
```

If the credential identifier remains private, the proof circuit MUST establish non-membership without revealing the identifier where the chosen revocation construction supports that privacy model.

## 46. Verification Failure

Verification MUST fail closed when revocation state cannot be established.

For example:

```text
    Revocation Registry unavailable
            │
            ▼
    Cannot establish non-revocation
            │
            ▼
    NOT VALID
```

The verifier MUST NOT interpret:

```text
    "revocation state unavailable"
```

as:

```text
    "credential is not revoked."
```

## 47. Revocation Error Categories

The implementation MAY expose machine-readable errors such as:

```text
    UNKNOWN_CREDENTIAL
    UNAUTHORIZED_REVOCATION
    ALREADY_REVOKED
    INVALID_REVOCATION_AUTHORIZATION
    REVOCATION_STATE_UNAVAILABLE
    REVOKED_CREDENTIAL
    STALE_REVOCATION_STATE
```

The final error taxonomy MUST be frozen before the Version 1 verifier API is finalized.

## 48. Contract Requirements

The Compact contract implementing revocation MUST ensure:

1. only authorized issuers can revoke credentials
2. an issuer can revoke only its own credentials
3. revocation state is publicly verifiable
4. revocation cannot be bypassed through frontend logic
5. revoked credentials cannot be treated as currently valid when current validity is required
6. revocation state cannot be arbitrarily overwritten
7. revocation does not alter the underlying credential commitment
8. revocation does not alter the original credential signature

## 49. Test Requirements

The contract test suite MUST cover at least:

### Revocation

- revoke valid credential
- verify credential becomes revoked
- revoke already revoked credential
- reject unauthorized revocation
- reject revocation by another issuer
- reject malformed credential identifiers

### Verification

- valid non-revoked credential succeeds
- revoked credential fails
- unknown credential fails where appropriate
- unavailable revocation state does not produce `VALID`

### Integration

- issuer registry + revocation
- credential commitment + revocation
- Merkle membership + revocation
- zero-knowledge proof + non-revocation

## 50. Negative Tests

The test suite MUST explicitly verify that the following combinations fail:

```text
    Authorized Issuer
    +
    Valid Credential
    +
    Valid Merkle Membership
    +
    Revoked Credential
```

MUST NOT produce:

```text
    VALID
```

Likewise:

```text
    Revoked Credential
    +
    Previously Generated Valid Proof
```

MUST NOT produce:

```text
    VALID
```

when current validity is required.

## 51. Privacy Tests

Tests MUST verify that revocation does not unnecessarily expose private credential information.

At minimum, tests SHOULD verify that:

- credential contents are not stored in revocation state
- private claims are not emitted by revocation circuits
- revocation transactions do not contain unnecessary credential fields
- zero-knowledge non-revocation does not expose the credential identifier when private non-revocation is required

## 52. Protocol Invariants

Every Version 1 implementation MUST preserve the following invariants:

1. Credential revocation is distinct from issuer authorization.
2. Every revocable credential has a stable credential identifier.
3. Revocation state MUST NOT require publication of private credential contents.
4. Only an authorized party may revoke a credential.
5. An issuer MUST NOT revoke another issuer's credential.
6. Revocation MUST NOT modify the original credential.
7. Revocation MUST NOT modify the original credential signature.
8. Revocation MUST NOT modify the credential commitment.
9. Revocation MUST NOT require removing a credential from the credential Merkle tree.
10. A credential MAY be a valid Merkle member while being revoked.
11. A cryptographically valid proof MAY correspond to a revoked credential.
12. Current verification MUST check current revocation state when required.
13. Historical non-revocation MUST NOT be interpreted as current non-revocation.
14. Verification MUST fail closed when required revocation state cannot be established.
15. Revocation SHOULD be irreversible in Version 1.
16. Reissued credentials MUST receive distinct credential identifiers.
17. Revocation state MUST be authoritative.
18. Frontend state MUST NOT override authoritative revocation state.
19. Revocation MUST NOT expose unnecessary private credential information.
20. Changes to the meaning of credential validity constitute a protocol change.

## 53. Reference Credential Lifecycle

The complete Version 1 credential lifecycle is:

```text
                 Issuance
                    │
                    ▼
              ┌──────────┐
              │  ACTIVE  │
              └────┬─────┘
                   │
                   │ revoke
                   ▼
              ┌──────────┐
              │ REVOKED  │
              └──────────┘
```

A revoked credential MUST remain distinguishable from a credential that was never issued.

A new qualification SHOULD be represented by a newly issued credential rather than restoring a revoked credential.

## 54. Reference Verification Model

A current qualification proof SHOULD establish:

```text
    AuthorizedIssuer
        &&
    ValidSignature
        &&
    ValidCommitment
        &&
    CredentialMembership
        &&
    NotRevoked
        &&
    QualificationSatisfied
```

Conceptually:

```text
                    ┌────────────────────┐
                    │   Issuer Registry  │
                    └─────────┬──────────┘
                              │
                              ▼
                       Issuer Authorized
                              │
                              ▼
    Private Credential ──► Issuer Signature
             │                    │
             ▼                    ▼
        Commitment          Authentication
             │
             ▼
       Merkle Membership
             │
             ▼
       Non-Revocation
             │
             ▼
     Qualification Predicate
             │
             ▼
             ZK Proof
             │
             ▼
          VALID
```

Every required condition contributes to the final verification result.

## 55. Version 1 Decisions

The following decisions are recommended for the initial JustProof MVP:

| Decision                             | Version 1                          |
| ------------------------------------ | ---------------------------------- |
| Credential revocation                | Supported                          |
| Revocation authority                 | Credential issuer                  |
| Revocation state                     | Public authenticated state         |
| Credential contents in registry      | Never                              |
| Revocation identifier                | Derived from credential commitment |
| Revocation                           | Irreversible                       |
| Unrevocation                         | Not supported                      |
| Reissuance                           | New credential                     |
| Revocation timestamp                 | Optional / TBD                     |
| Current verification                 | Supported                          |
| Historical verification              | Deferred unless required           |
| Private non-revocation proof         | Preferred                          |
| Dedicated revocation Merkle tree     | Deferred                           |
| Revocation modifies credential       | No                                 |
| Revocation modifies commitment       | No                                 |
| Revocation removes Merkle membership | No                                 |

## 56. Open Protocol Decisions

Before Version 1 is frozen, the following MUST be resolved:

1. Exact credential identifier derivation.
2. Exact revocation-state representation in Compact.
3. Exact authorization mechanism for issuer revocation.
4. Whether the revocation identifier is public or private during verification.
5. Exact zero-knowledge non-revocation construction.
6. Whether Version 1 requires a dedicated authenticated revocation structure.
7. Whether revocation timestamps are required.
8. Whether historical verification is supported.
9. Exact freshness requirements for revocation state.
10. Exact revocation error taxonomy.

Until these decisions are frozen, this document remains a protocol draft.

## 57. Final Protocol Principle

Credential issuance and credential validity are different events.

An issuer signature establishes:

> **This issuer issued this credential.**

Credential membership establishes:

> **This credential is represented in the authoritative credential state.**

Revocation establishes:

> **This credential has not been invalidated.**

A current qualification proof therefore establishes the conjunction:

```text
    Issuer Authorized
          &&
    Credential Authenticated
          &&
    Credential Registered
          &&
    Credential Not Revoked
          &&
    Qualification Satisfied
```

The verifier does not need the private credential itself to establish these properties.

This separation allows JustProof to provide a credential system in which:

> **Credentials can be issued, privately proven, publicly verified, and explicitly invalidated without exposing the credential itself.**
