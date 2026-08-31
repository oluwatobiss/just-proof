# JustProof Verification Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.0`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines how a JustProof V1 verifier issues a qualification-proof request, receives a proof response, authenticates the proof and its complete public transcript, compares it with authoritative current contract state, consumes the verifier challenge, and communicates the result.

Verification answers one narrow question:

> Does this exact request-specific proof establish the frozen JustProof V1 qualification statement against the current state of the configured deployment?

The verifier does not receive or inspect the private credential. It does not separately resolve a private issuer, credential commitment, credential index, Merkle path, signature, or revocation record. Those relations are constrained together inside `proveQualificationV1` under `08-proofs.md`.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names and field order are normative unless the text explicitly says otherwise. Compact field types are normative where stated. Application transport syntax is not a substitute for the typed protocol value.

## 3. Freeze Scope

JustProof V1 freezes the following verification decisions:

- V1 verifies exactly one circuit and proof type: `proveQualificationV1` with `proofType == 1`
- the verifier issues and retains the exact nine-field `QualificationProofRequestV1`
- the verifier, rather than the holder, controls `verifierContext`, `challenge`, and `requestExpiresAt`
- each request has one fresh nonzero 32-byte challenge and a verifier-side lifecycle
- every accepted response is single-use for the issuing verifier
- acceptance requires the exact request digest and the exact current verification-state digest
- every issuer, credential, holder-control, membership, non-revocation, qualification, and credential-time condition is mandatory inside the one proof
- the issuer and credential remain private and are not separately looked up by the verifier
- V1 has no configurable proof policy, issuer constraint, optional revocation, optional expiration, arbitrary claim, historical mode, reusable proof, or presentation nullifier
- verification has exactly three terminal outcomes: `VALID`, `INVALID`, and `COULD_NOT_VERIFY`
- challenge consumption occurs atomically only after every acceptance check succeeds
- stale or invalid submissions do not automatically consume an otherwise active request
- off-chain proof acceptance is permitted only through a supported interface that verifies the proof and complete public transcript
- executing generated Compact JavaScript logic alone is not cryptographic proof verification; and
- verification never mutates a JustProof contract ledger field

Changing the accepted proof type, request identity, trusted deployment, verifier-key rules, current-state rule, challenge lifecycle, result meaning, or guaranteed statement requires a new protocol version.

## 4. Compact V1 Baseline

The verified circuit MUST be compiled from a contract beginning with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

The verifier MUST use artifacts produced by the pinned Compact toolchain and compatible runtime. Typed request and state digests MUST use the `persistentHash<T>` constructions frozen in `08-proofs.md`.

The generated JavaScript implementation MAY be used to:

- decode the contract ledger through the generated ledger view
- reconstruct Compact-compatible typed records
- execute pure digest helpers when the frozen implementation exports them; and
- test circuit logic off-chain

It MUST NOT be treated as a substitute for proof verification, transaction verification, finality, or current-state acquisition.

## 5. Frozen V1 Statement

A `VALID` result establishes:

> The prover knew the secret state of one holder-controlled JustProof V1 credential for the fixed Midnight Builder demonstration qualification; the credential was correctly constructed, signed by the key in a currently registered issuer record, registered under the current credential root, unrevoked at the same credential index under the current revocation root, issued by the circuit's recognized block time, and unexpired through the verifier's request deadline; and the proof was bound to this exact deployment, verifier context, challenge, request, and accepted current-state snapshot.

This is an existential statement. It does not disclose which credential, issuer, index, or holder satisfied it.

## 6. Verification Authority Model

A verifier relies on three distinct authorities:

| Authority | Trusted source | Purpose |
| --- | --- | --- |
| Verifier request state | Verifier-controlled server or equivalent trusted service | Exact request, challenge status, deadline, and single-use enforcement |
| Circuit identity and verification artifacts | Approved JustProof deployment configuration | Selects the supported network, contract, circuit, proof-system version, and verifier artifacts |
| Current protocol state | Latest finalized state of the configured JustProof contract | Supplies the current registry context, roots, and counters |

The holder-supplied artifact is untrusted input. Its network, circuit, request, state snapshot, output, proof bytes, and metadata MUST be checked rather than treated as authority.

Frontend state, browser storage, QR data, URL parameters, cached indexer results, holder APIs, display metadata, and proof-envelope labels are not authority.

## 7. Trusted Verifier Deployment Profile

Before issuing or accepting a request, the verifier MUST be configured with one approved V1 deployment profile containing at least:

```text
protocolVersion = 1
proofType = 1
networkId = configured Midnight network
registryContract = configured JustProof contract address
registryContext = configured nonzero deployment context
circuitId = proveQualificationV1
qualificationType =
    3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7
qualificationVersion = 1
verifierContext = configured nonzero verifier identifier
supported proof-system and verifier artifacts
```

`networkId` and proof-system artifact identifiers use the exact types and encodings of the selected Midnight SDK. Their transport representation is implementation-defined, but comparison MUST be exact.

The profile MUST come from trusted application configuration. The verifier MUST NOT select a network, contract, context, circuit, verifier key, qualification, or proof-system version merely because the submission names it.

## 8. Release Manifest and Verifier Artifacts

Each deployed release SHOULD publish an authenticated deployment manifest that records:

- network identifier
- contract address
- registry context
- circuit identifier
- Compact source revision
- Compact toolchain and runtime versions
- proof-system version
- approved verifier-artifact identity or cryptographic digest; and
- deployment or maintenance-authority policy

The exact verifier-key digest cannot be a universal protocol constant before the contract is compiled and deployed. It is a release-specific trust decision.

If a contract maintenance operation replaces, inserts, or removes the verifier key for `proveQualificationV1`, a verifier MUST NOT assume semantic equivalence. Network-submitted verification follows the finalized network's configured key. Portable verification MUST pause until the new artifact is explicitly reviewed and added to the trusted deployment profile.

## 9. Normative Proof Artifact

The verifier receives the conceptual artifact frozen in `08-proofs.md`:

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

The exact raw proof representation and public-transcript serialization are selected by the pinned Midnight toolchain and supported SDK. An application MUST preserve every proof, ledger-query, block-time-query, input, output, and transcript component required by that verifier.

The exact JustProof public output is:

```text
QualificationProofPublicOutputV1 {
    requestDigest: Bytes<32>
    stateDigest: Bytes<32>
}
```

The field order is normative. There is no success Boolean in the circuit output. A valid proof for this exact output establishes that the circuit assertions succeeded; the output by itself establishes nothing.

The artifact is not valid merely because it contains the expected field names or two expected digests.

## 10. Exact Public Request

The verifier MUST issue and retain:

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

The field order is normative.

The verifier MUST construct every field from its trusted deployment profile and request service. It MUST NOT accept a holder-created request as though the verifier had issued it.

## 11. Request Issuance

To issue a V1 request, the verifier MUST:

1. load the trusted deployment profile
2. generate a fresh nonzero 32-byte challenge from a cryptographically secure random source
3. select a short future exclusive deadline
4. construct the exact request
5. compute its typed request digest
6. atomically persist the request with status `ISSUED`; and
7. return the complete public request to the holder

The recommended production deadline is 15 minutes or less unless measured proving conditions require more time.

The verifier MUST NOT derive a challenge from a timestamp, sequential identifier, credential, holder, wallet, session token, or `Math.random()`.

## 12. Verifier Context

`verifierContext` is the verifier-controlled, nonzero 32-byte relying-party context frozen in `08-proofs.md`.

The request service MUST set it from trusted configuration. A route parameter, request body, holder account, QR payload, or proof artifact MUST NOT override it.

A proof bound to one verifier context MUST NOT be accepted by another context. Sharing a challenge database between contexts does not make their requests interchangeable.

## 13. Challenge Record

The verifier MUST retain enough state to reconstruct and compare the exact issued request. Conceptually:

```text
QualificationChallengeRecordV1 {
    request: QualificationProofRequestV1
    requestDigest: Bytes<32>
    status: ChallengeStatusV1
}
```

The storage schema MAY additionally contain operational timestamps, a finalized state reference for an accepted response, abuse counters, and retention metadata. These fields MUST NOT change the proof statement.

The verifier SHOULD locate a record by its own verifier context and the 32-byte challenge. It MUST compare the complete submitted request with the retained request, not only the lookup key.

## 14. Challenge Lifecycle

The normative lifecycle is:

```text
ISSUED -> CONSUMED
       -> EXPIRED
       -> CANCELLED
```

The transitions mean:

- `ISSUED`: the exact request may still receive a response
- `CONSUMED`: one response was fully accepted
- `EXPIRED`: the exclusive deadline was reached before acceptance; and
- `CANCELLED`: the verifier intentionally ended the request

`CONSUMED`, `EXPIRED`, and `CANCELLED` are terminal. Their challenges MUST never be reassigned to another request.

An invalid, malformed, indeterminate, or stale response does not by itself transition `ISSUED`. A documented abuse policy MAY transition it to `CANCELLED`.

## 15. Verifier Time and Request Deadline

`requestExpiresAt` is an exclusive Unix timestamp in seconds represented by `Uint<64>`.

The verifier MUST use its own trusted, synchronized server clock or an equivalently controlled time source. Holder-provided time, browser time, proof metadata, and URL parameters are not authoritative for verifier acceptance.

The verifier MUST reject acceptance when:

```text
verifierTime >= requestExpiresAt
```

This check MUST occur both before expensive verification and again inside or immediately before atomic challenge consumption.

The circuit independently proves `blockTimeLt(requestExpiresAt)` and credential validity through the deadline. The verifier's clock check does not replace the circuit's block-time transcript check.

Clock synchronization and drift monitoring are operational security requirements. A verifier whose trusted time source is unavailable or known to be unreliable MUST return `COULD_NOT_VERIFY` rather than `VALID`.

## 16. Terminal Verification Outcomes

Every completed V1 verification attempt produces exactly one terminal outcome:

```text
VALID
INVALID
COULD_NOT_VERIFY
```

- `VALID` means every required acceptance condition succeeded and the challenge was atomically consumed.
- `INVALID` means at least one required condition conclusively failed.
- `COULD_NOT_VERIFY` means the verifier lacked authoritative state, artifacts, time, network access, or verification capability needed to decide.

A user interface MAY show `PENDING` while waiting for proof generation, network finality, or verification. `PENDING` is an operational UI state, not a terminal protocol result and MUST NOT be represented as `VALID`.

## 17. Valid Result Record

A successful external result is conceptually:

```text
QualificationVerificationValidV1 {
    outcome: "VALID"
    code: "VERIFIED"
    protocolVersion: Uint<16>
    proofType: Uint<8>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    qualificationType: Bytes<32>
    qualificationVersion: Uint<16>
    requestDigest: Bytes<32>
    stateDigest: Bytes<32>
    verifiedAt: Uint<64>
}
```

The field order is normative for a canonical record. `verifiedAt` is the verifier-controlled Unix acceptance time, not a credential field or a prover-selected time.

The verifier MUST retain the exact issued request associated with `requestDigest`. The result record is an interaction outcome, not a reusable credential, transferable certificate, or independent proof for another verifier.

## 18. Invalid and Indeterminate Result Records

An unsuccessful external result is conceptually one of:

```text
QualificationVerificationInvalidV1 {
    outcome: "INVALID"
    code: VerificationCodeV1
}

QualificationVerificationIndeterminateV1 {
    outcome: "COULD_NOT_VERIFY"
    code: VerificationCodeV1
}
```

An unsuccessful result MUST NOT copy untrusted request or state digests into fields that appear verified.

Internal diagnostics MAY contain more operational detail under access control, but public responses MUST use the safe taxonomy below and MUST NOT reveal private near-match information.

## 19. Safe Diagnostic Codes

The following codes are frozen for V1:

| Outcome | Code | Meaning |
| --- | --- | --- |
| `VALID` | `VERIFIED` | Every required check succeeded and the challenge was consumed |
| `INVALID` | `MALFORMED_SUBMISSION` | The artifact could not be decoded unambiguously within limits |
| `INVALID` | `UNSUPPORTED_PROTOCOL` | The protocol or proof type is not V1 |
| `INVALID` | `WRONG_DEPLOYMENT` | Network, contract, registry context, circuit, verifier context, or fixed qualification does not match configuration |
| `INVALID` | `REQUEST_MISMATCH` | The submitted request is not the exact retained request |
| `INVALID` | `REQUEST_NOT_ACTIVE` | The challenge is unknown, consumed, cancelled, or otherwise not `ISSUED` |
| `INVALID` | `REQUEST_EXPIRED` | The exclusive request deadline has been reached |
| `INVALID` | `INVALID_PROOF` | Proof, verifier-key relation, public transcript, request digest, or frozen circuit statement failed |
| `INVALID` | `STALE_STATE` | The proof-bound state is not the verifier's accepted current state |
| `COULD_NOT_VERIFY` | `NETWORK_UNAVAILABLE` | Required network or finality data could not be obtained |
| `COULD_NOT_VERIFY` | `STATE_UNAVAILABLE` | Authoritative current contract state could not be obtained or safely decoded |
| `COULD_NOT_VERIFY` | `VERIFIER_ARTIFACT_UNAVAILABLE` | The approved verifier artifacts are unavailable or untrusted |
| `COULD_NOT_VERIFY` | `PROOF_VERIFICATION_UNAVAILABLE` | No supported interface can verify the selected proof and complete transcript |
| `COULD_NOT_VERIFY` | `TIME_UNAVAILABLE` | The verifier cannot establish trusted current time |
| `COULD_NOT_VERIFY` | `INTERNAL_ERROR` | An unexpected verifier failure prevented a sound decision |

`INVALID_PROOF` intentionally does not identify whether a private credential, secret, issuer, signature, path, membership, revocation, qualification, or credential-time relation failed.

## 20. Submission Parsing

Before cryptographic work, the verifier MUST:

- enforce transport and decoded-size limits
- reject duplicate, ambiguous, missing, or type-invalid fields
- validate byte lengths and integer ranges
- reject unsupported proof serialization or proof-system versions
- reject extra representations that could produce parser disagreement
- verify that `circuitId == proveQualificationV1`; and
- reject a proof envelope whose public components cannot be decoded through the supported typed interface

The verifier SHOULD apply authentication, rate limits, request-body limits, timeouts, and bounded concurrency before expensive proof verification.

Parser acceptance does not imply protocol validity.

## 21. Exact Request Resolution

The verifier MUST resolve the retained challenge record under its configured verifier context and submitted challenge.

It MUST then require exact field-by-field equality between the retained request and the submitted `QualificationProofRequestV1`:

```text
protocolVersion
proofType
registryContract
registryContext
qualificationType
qualificationVersion
verifierContext
challenge
requestExpiresAt
```

Checking only a challenge, digest, session identifier, qualification label, or deadline is insufficient.

The verifier MUST require status `ISSUED` and a future deadline before continuing.

## 22. Protocol and Deployment Checks

The request and artifact MUST match the trusted deployment profile exactly:

```text
protocolVersion == 1
proofType == 1
networkId == configured network
registryContract == configured contract
registryContext == configured context
circuitId == proveQualificationV1
qualificationType == frozen qualification
qualificationVersion == 1
verifierContext == configured verifier context
challenge != default<Bytes<32>>
requestExpiresAt > 0
```

The verifier MUST reject silent coercion, aliasing, case folding, truncation, padding, alternate network names, or a second contract that merely contains similar ledger fields.

## 23. Request-Digest Verification

The verifier MUST independently reconstruct:

```text
QualificationProofRequestDigestInputV1 {
    domain: DOMAIN_PROOF_REQUEST_V1
    request: exactRetainedRequest
}
```

and compute:

```text
expectedRequestDigest =
    persistentHash<QualificationProofRequestDigestInputV1>(...)
```

It MUST require:

```text
publicOutput.requestDigest == expectedRequestDigest
```

The verifier MUST NOT hash JSON, display text, concatenated strings, QR bytes, or transport serialization in place of the frozen typed hash.

## 24. Verifier-Key Resolution

The verifier MUST select the proof-system version and verifier key from the trusted deployment profile and approved release artifacts.

It MUST NOT trust:

- a verifier key embedded in the response
- a download URL supplied by the holder
- a circuit name without artifact identity
- an unreviewed maintenance-authority update
- a locally cached artifact whose identity cannot be confirmed; or
- a key merely because it verifies some proof bytes

Failure to obtain the exact trusted artifact produces `COULD_NOT_VERIFY` with `VERIFIER_ARTIFACT_UNAVAILABLE`.

## 25. Supported Verification Modes

V1 defines two possible proof-verification modes:

1. finalized network-confirmed execution; and
2. portable off-chain proof verification through a supported Midnight interface.

Both modes MUST preserve the same request, circuit, transcript, current-state, deadline, and challenge semantics. Neither mode may weaken the statement.

An implementation MAY support only the network-confirmed mode. It MUST accurately communicate the unsupported portable mode rather than emulating it with application checks.

## 26. Finalized Network-Confirmed Verification

For a network-submitted `proveQualificationV1` execution, the verifier MUST:

1. obtain the transaction or contract-action reference from an authenticated response channel
2. fetch it independently from the configured Midnight network
3. wait for the required finalized status
4. require the configured contract address and exact circuit
5. require the exact public request, output, and runtime transcript
6. require network acceptance under the circuit's registered verifier key
7. reject failed, replaced, missing, provisional, or wrong-network actions
8. recompute the request digest
9. perform the current-state comparison in Sections 30–33; and
10. atomically consume the challenge only after every remaining check succeeds

Network acceptance proves that the circuit execution was accepted for its transcript. It does not by itself prove that the verifier issued the request, that the challenge is still active, or that the proof-bound state is still current when the verifier accepts it.

## 27. Portable Off-Chain Verification

For a directly received proof artifact, the verifier MUST use a supported Midnight verification interface that checks:

- the exact trusted verifier key and proof-system version
- the raw proof
- every public circuit input and output
- ledger-query commitments and results
- block-time-query commitments and results; and
- every other public transcript component required by the runtime

The verifier MUST then apply the request, current-state, deadline, and challenge checks in this document.

Checking proof bytes without their full public statement is insufficient. Checking the request and state digests without a cryptographic proof is also insufficient.

## 28. Portable Verification Capability Gate

Portable verification MUST remain disabled until the selected Midnight SDK and proof interface have an integration test demonstrating complete verification of `proveQualificationV1` and its public transcript for the pinned artifacts.

If that capability is unavailable, incomplete, undocumented, or incompatible, the verifier MUST return:

```text
COULD_NOT_VERIFY
PROOF_VERIFICATION_UNAVAILABLE
```

It MUST NOT:

- rerun the generated JavaScript circuit and call that proof verification
- trust a Boolean supplied by a proof server
- accept only the two JustProof output digests
- omit ledger-query or block-time-query data
- fall back to frontend validation; or
- label a simulated result `VALID`

## 29. Generated Compact JavaScript Boundary

The generated Compact JavaScript implementation executes the same contract logic and is suitable for typed circuit testing. It does not, by itself:

- generate a zero-knowledge proof
- verify a zero-knowledge proof
- verify a submitted transaction
- establish network finality; or
- prove that locally supplied ledger state was authoritative or current

Application tests MAY use it to exercise assertions and compute deterministic values. Production verification MUST use the network-confirmed or supported portable proof-verification path.

## 30. Authoritative Current-State Acquisition

Immediately before final acceptance, the verifier MUST obtain the latest finalized state of the configured `registryContract` from its trusted Midnight public-data provider or equivalent authoritative network interface.

It MUST:

- query the configured network and exact contract address
- require a finalized state reference
- decode `contractState.data` through the generated JustProof ledger view
- read the current `registryContext`, roots, and counters
- validate the counter ranges; and
- fail closed if data is absent, stale, malformed, inconsistent, or from another deployment

Holder-supplied state, local browser caches, off-chain tree-provider roots, archived blocks, and arbitrary indexer snapshots are not current-state authority.

## 31. Exact Verification-State Reconstruction

The verifier MUST construct:

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

using:

```text
protocolVersion = 1
registryContract = configured contract
registryContext = current sealed ledger registryContext
issuerRoot = current ledger issuerRoot
nextIssuerIndex = current ledger nextIssuerIndex
credentialRoot = current ledger credentialRoot
nextCredentialIndex = current ledger nextCredentialIndex
revocationRoot = current ledger revocationRoot
```

It MUST require:

```text
nextIssuerIndex <= 65,536
nextCredentialIndex <= 65,536
```

The duplicate-registration sets, authority verification key, off-chain paths, and frontend state are not fields in this verification-state record.

## 32. Current-State Digest

The verifier MUST compute:

```text
expectedStateDigest =
    persistentHash<QualificationVerificationStateDigestInputV1>({
        domain: DOMAIN_PROOF_STATE_V1,
        state: currentVerificationState
    })
```

and require:

```text
publicOutput.stateDigest == expectedStateDigest
```

It SHOULD also require exact field-by-field equality between the artifact's decoded `verificationState` and the independently reconstructed current record before accepting the artifact transcript.

Any included root or counter change makes the earlier response stale. V1 defines no root-age allowance, grace period, archived-root allowlist, or verifier-selected snapshot.

## 33. Finality and Acceptance Snapshot

`VALID` is evaluated against one finalized contract-state snapshot obtained for the acceptance attempt.

The verifier SHOULD retain the finalized block, transaction, contract-state, or provider-specific reference that identified that snapshot. The reference is operational audit data and does not alter the proof statement.

A later finalized issuer registration, credential registration, or revocation does not retroactively change an already recorded `VALID` interaction. It does make the old proof unsuitable for a new acceptance attempt because the current state digest has changed.

Provisional chain data MUST NOT produce `VALID`. If the verifier cannot obtain the required finality, it returns `COULD_NOT_VERIFY`.

## 34. State Races and Final Recheck

An implementation MAY perform an early state comparison to reject obviously stale work before expensive verification.

It MUST nevertheless obtain or confirm the finalized acceptance snapshot after cryptographic verification and immediately before challenge consumption. The consumed record MUST identify the state digest that was accepted.

If current state changes before the final comparison, return `INVALID / STALE_STATE` and leave the request `ISSUED` if it remains unexpired and uncancelled.

The holder may refresh paths and regenerate a proof against the same exact request while it remains active.

## 35. Atomic Challenge Consumption

After every check succeeds, the verifier MUST perform an atomic compare-and-set equivalent to:

```text
require status == ISSUED
require trustedVerifierTime < requestExpiresAt
set status = CONSUMED
record requestDigest
record accepted stateDigest
record verifiedAt
record finalized acceptance-state reference
```

Only after that transaction commits may the verifier return `VALID`.

Concurrent submissions for one challenge MUST produce at most one `VALID` result. A losing concurrent attempt returns `INVALID / REQUEST_NOT_ACTIVE`.

The challenge lifecycle is verifier-side state. `proveQualificationV1` remains read-only and MUST NOT write a JustProof ledger field to consume the challenge.

## 36. Normative Verification Algorithm

A conforming verifier MUST implement semantics equivalent to:

1. load the trusted deployment profile
2. apply transport limits and decode the artifact
3. resolve the retained challenge record
4. require `ISSUED` status and a future deadline
5. compare the complete submitted request with the retained request
6. validate all frozen protocol, deployment, circuit, and qualification constants
7. recompute the typed request digest and compare it with the proof output
8. resolve the exact trusted verifier artifacts
9. verify the proof and complete public transcript through a supported mode
10. obtain the latest finalized current contract state
11. reconstruct and validate `QualificationVerificationStateV1`
12. recompute the typed current-state digest and compare it with the proof output
13. confirm the artifact state and transcript correspond to that state
14. recheck trusted time, deadline, request status, and finality
15. atomically transition the challenge from `ISSUED` to `CONSUMED`; and
16. return the exact `VALID` result

An implementation MAY reorder or duplicate safe checks for efficiency, but it MUST preserve the final current-state, time, and atomic-consumption checks.

## 37. Failure Classification

A verifier MUST fail closed:

- a conclusive mismatch produces `INVALID`
- unavailable or indeterminate authority produces `COULD_NOT_VERIFY`
- no failure produces `VALID` before atomic challenge consumption; and
- an exception, timeout, parser disagreement, or SDK failure MUST NOT default to success

Examples:

| Condition | Result |
| --- | --- |
| Proof does not verify | `INVALID / INVALID_PROOF` |
| Proof verifies for an earlier state | `INVALID / STALE_STATE` |
| Current state cannot be fetched | `COULD_NOT_VERIFY / STATE_UNAVAILABLE` |
| Challenge was already consumed | `INVALID / REQUEST_NOT_ACTIVE` |
| Network transaction is not finalized yet | operational `PENDING`, or `COULD_NOT_VERIFY` if the attempt terminates |
| Portable verifier API is unsupported | `COULD_NOT_VERIFY / PROOF_VERIFICATION_UNAVAILABLE` |

## 38. Retry Semantics

A malformed, invalid, stale, or indeterminate response does not automatically consume an otherwise active request.

While the exact request remains `ISSUED` and before its deadline, the holder MAY:

- correct a transport error
- wait for infrastructure recovery
- refresh issuer, credential, or revocation paths
- regenerate a proof against current state; and
- submit the new response for the same request

The request fields MUST NOT change during a retry. A changed deadline, challenge, verifier context, deployment, or qualification is a new request and requires a fresh challenge.

After expiration, cancellation, or consumption, the verifier must issue an entirely new request.

## 39. No Separate Issuer Lookup

The verifier MUST NOT request or receive the private credential's:

- issuer ID
- issuer verification key
- issuer record
- issuer index or path; or
- issuer signature

`proveQualificationV1` privately establishes that the statement issuer ID matches a valid issuer record under the current `issuerRoot` and that the credential signature verifies under that authenticated key.

Looking up a disclosed issuer would weaken issuer privacy and would define a different proof statement.

## 40. No Separate Credential or Revocation Lookup

The verifier MUST NOT request or receive the private:

- credential ID or commitment
- subject commitment or secret
- credential index, leaf, or path
- revocation leaf or path; or
- credential validity timestamps

The proof establishes credential construction, holder control, credential membership, same-index non-revocation, and credential-time conditions. The verifier authenticates the roots and counters through the current-state digest and complete proof transcript.

An off-chain API response saying `registered` or `not revoked` cannot replace the proof relation.

## 41. No Verification Policy Layer

V1 has no verifier-selectable validity policy.

Every `VALID` result requires:

- the fixed V1 qualification
- holder control
- current issuer membership and signature validity
- current credential membership
- current non-revocation at the same index
- issuance by current circuit block time
- non-expiration through the request deadline
- exact deployment and request binding
- exact current-state binding; and
- single-use challenge acceptance

The verifier MUST NOT disable, add, or reinterpret these conditions through request fields, UI toggles, tenant configuration, or API options.

An issuer-specific requirement, new qualification, score, grade, threshold, identity field, or arbitrary claim requires a new protocol version.

## 42. No Historical or Reusable Verification

V1 does not accept:

- historical issuer, credential, or revocation roots
- validity at issuance or another past time
- verifier-selected earlier state
- cached-root grace periods
- reusable bearer proofs
- offline-indefinite proofs; or
- a proof generated for another request

A saved `VALID` result records that one verifier accepted one response at one time. It is not evidence that the credential remains currently valid and MUST NOT be presented as a fresh JustProof verification later.

## 43. No Presentation Nullifier

V1 defines no credential-derived presentation nullifier.

Replay resistance uses the verifier context, fresh challenge, exclusive deadline, and atomic challenge state. The credential-registration nullifier from `05-ledgers.md` MUST NOT be used as a proof identifier, holder identifier, challenge, verifier identifier, or public presentation handle.

The verifier MUST NOT invent a stable credential-derived analytics or deduplication value.

## 44. What `VALID` Does Not Mean

`VALID` does not establish:

- the holder's legal or civil identity
- wallet ownership
- exclusive control or non-transferability of the subject secret
- an official Midnight Academy certification
- that JustProof represents Midnight Academy
- a public or verifier-selected issuer
- a score, grade, age, name, employer, address, or arbitrary claim
- credential validity before proof generation or after the request deadline
- validity under later changed ledger state
- authenticity of a PDF, image, badge, logo, QR code, or display certificate
- truth beyond what a currently registered issuer attested; or
- anonymity against network, verifier, browser, wallet, provider, timing, or proof-server metadata

Applications MUST communicate only the frozen V1 statement.

## 45. Credential Inspection and External Metadata

The verifier MUST NOT require the private credential or human-readable certificate to verify a conforming proof.

Display metadata MAY provide:

- the public qualification name
- general JustProof product information
- deployment status
- explanatory text; and
- non-authoritative visual assets

External metadata MUST NOT determine `VALID`. A badge, PDF, issuer logo, API response, OCR result, or human-readable certificate title is not a cryptographic verification input.

## 46. Privacy-Preserving Result Communication

The public success message SHOULD communicate:

> This proof confirms a current JustProof V1 Midnight Builder demonstration qualification for this verification request.

The interface SHOULD also make clear that:

- the underlying credential and issuer were not disclosed
- the result applies to this request
- the request has been consumed; and
- the result is not an official Midnight Academy certification

Failure messages SHOULD be actionable without revealing which private condition was nearly satisfied. For example, `INVALID_PROOF` may be presented as:

> The proof could not establish every required qualification condition.

The verifier MUST NOT disclose private issuer, credential, signature, path, revocation, expiration, or near-match details through UI text, APIs, timing differences, logs, or support traces.

## 47. Logging, Telemetry, and Retention

The verifier MAY retain the minimum public records needed for challenge enforcement, security, and audit.

It SHOULD retain for an accepted interaction:

- the exact issued request
- request and state digests
- terminal challenge status
- acceptance time
- safe outcome code; and
- finalized acceptance-state reference

It SHOULD minimize or avoid retaining:

- raw proof artifacts beyond operational need
- IP addresses and browser fingerprints
- wallet or account correlation
- third-party analytics identifiers
- precise failure timing; and
- any accidentally received private credential material

Raw proofs, requests, and challenges are public protocol data but remain interaction-linkable and SHOULD be handled as security-sensitive application data.

Secrets, credentials, witnesses, signatures, openings, private paths, and proof-server inputs MUST never enter verifier telemetry.

## 48. Error-Oracles and Timing

The verifier SHOULD normalize public failure responses and avoid materially different timing for private-statement failures.

Public checks such as wrong deployment, expired request, inactive challenge, or stale public state MAY use distinct safe codes. Failures inside the private circuit statement MUST collapse to `INVALID_PROOF`.

Internal logs MAY distinguish infrastructure components but MUST NOT claim knowledge of which private witness relation failed unless such knowledge is independently and legitimately available.

## 49. Availability and Denial of Service

Proof verification is computationally expensive. A conforming verifier SHOULD:

- require a verifier-issued active challenge before proof verification
- cap artifact size and decoding work
- rate-limit issuance and submission endpoints
- bound concurrent proof verifications
- apply timeouts and cancellation
- cache only authenticated release artifacts
- isolate proof verification workers; and
- monitor state-provider, finality, time, and verifier-artifact health

Availability controls MUST NOT weaken cryptographic, current-state, deadline, or challenge checks.

An overload, outage, timeout, or dependency failure produces `COULD_NOT_VERIFY`, never `VALID`.

## 50. Frontend, Backend, and Contract Boundaries

The frontend MAY:

- request and display a verifier-issued request
- transport a proof artifact
- show progress and terminal outcomes; and
- perform non-authoritative structural checks for user experience

The trusted verifier service MUST:

- generate and store challenges
- control verifier configuration and time
- fetch finalized authoritative state
- select trusted verifier artifacts
- verify proofs or finalized network actions
- atomically consume challenges; and
- issue terminal results

The Compact circuit MUST:

- enforce every private credential relation
- bind the exact request and current state
- enforce block-time and credential-time predicates; and
- perform no challenge or qualification-verification ledger write

Frontend success state, client-side JavaScript, a holder-controlled callback, or a proof-server response MUST NOT issue `VALID`.

## 51. Required Test Vectors and Tests

Before V1 verification is considered conformant, the test suite MUST reuse the request and state digest vectors frozen in `08-proofs.md` and cover the cases below.

### 51.1 Request issuance tests

- generate exactly 32 challenge bytes from a CSPRNG
- reject the all-zero challenge
- never reuse a challenge within the verifier context
- construct the exact nine-field request
- retain the exact typed request and digest
- use a future exclusive deadline; and
- reject holder-selected verifier context, challenge, deadline, deployment, or qualification

### 51.2 Parsing and configuration tests

- accept the exact supported artifact encoding
- reject oversized, truncated, duplicated, missing, ambiguous, or wrongly typed fields
- reject wrong network, contract, registry context, circuit, qualification, or version
- reject untrusted verifier keys and artifact URLs; and
- reject unsupported proof-system or serialization versions

### 51.3 Request-binding tests

- accept only the complete retained request
- reject each individually changed request field
- reject the same challenge under another verifier context
- reject an unknown, consumed, cancelled, or expired challenge
- recompute the typed request digest across Compact and TypeScript; and
- reject JSON, text, reordered, truncated, or concatenated hash substitutes

### 51.4 Proof-verification tests

- verify the exact `proveQualificationV1` proof with the trusted verifier artifact
- reject another circuit or verifier key
- reject malformed proof bytes
- reject any changed public input, output, ledger query, or block-time query
- reject missing public-transcript components
- confirm generated JavaScript circuit execution alone cannot return `VALID`; and
- capability-gate portable verification when the supported API is absent

### 51.5 Current-state tests

- fetch and decode the exact configured contract's finalized state
- construct the eight-field verification state in exact order
- enforce both counter bounds
- recompute the state digest across Compact and TypeScript
- reject holder-supplied, cached, archived, wrong-contract, or provisional state
- reject after any included root or counter changes
- return `COULD_NOT_VERIFY` when current state cannot be obtained; and
- record the finalized acceptance-state reference

### 51.6 Deadline and lifecycle tests

- accept strictly before `requestExpiresAt`
- reject at exactly `requestExpiresAt`
- transition an observed overdue `ISSUED` request to `EXPIRED`
- leave an active challenge `ISSUED` after invalid, stale, or indeterminate responses
- allow a regenerated current-state proof against the same active exact request
- atomically consume only after full success
- accept at most one of concurrent valid submissions; and
- never reassign consumed, expired, or cancelled challenges

### 51.7 Outcome tests

- return the exact `VALID` record only after consumption
- map every conclusive failure to an `INVALID` code
- map unavailable authority or capability to `COULD_NOT_VERIFY`
- never copy unverified digests into a success-shaped result
- preserve `PENDING` as a non-terminal UI state; and
- ensure exceptions and timeouts fail closed

### 51.8 Privacy tests

- verify without the credential, issuer ID, issuer key, signature, commitment, index, or path
- return no issuer or credential identifier
- collapse private-statement failures to `INVALID_PROOF`
- avoid private data in logs, telemetry, errors, URLs, or analytics
- confirm external metadata cannot change the result; and
- confirm a saved result is not accepted as a new proof

## 52. Normative Invariants

Every conforming V1 verifier MUST preserve these invariants:

1. V1 accepts only `protocolVersion == 1` and `proofType == 1`.
2. V1 accepts only `circuitId == proveQualificationV1`.
3. The fixed qualification type and version are mandatory.
4. Network, contract, registry context, circuit, artifacts, and verifier context come from trusted configuration.
5. The verifier issues and retains the exact nine-field request.
6. Every request has one fresh nonzero 32-byte CSPRNG challenge.
7. Every challenge belongs to exactly one request and is never reassigned.
8. Request deadlines are exclusive and checked with trusted verifier time.
9. The submitted request equals the retained request field by field.
10. The verifier independently recomputes the typed request digest.
11. The proof and complete public transcript are cryptographically verified.
12. Generated JavaScript circuit execution alone is not proof verification.
13. Portable verification is disabled unless the full supported interface is tested.
14. Current state comes from the latest finalized configured contract state.
15. The verifier reconstructs the exact eight-field verification-state record.
16. The verifier independently recomputes the typed current-state digest.
17. Any included root or counter change makes an unaccepted response stale.
18. No historical root, grace period, or verifier-selected snapshot is accepted.
19. The verifier never receives or separately resolves the private issuer.
20. The verifier never receives or separately resolves the private credential or revocation path.
21. All frozen credential-validity conditions are mandatory in one proof.
22. V1 has no verifier-selectable policy, arbitrary claim, issuer constraint, or optional check.
23. V1 has no reusable proof or presentation nullifier.
24. `VALID` is returned only after atomic `ISSUED -> CONSUMED` transition.
25. At most one submission for a challenge returns `VALID`.
26. Invalid, stale, or indeterminate responses do not automatically consume an active request.
27. Conclusive failures return `INVALID`.
28. Unavailable or indeterminate authority returns `COULD_NOT_VERIFY`.
29. Public errors do not reveal private-statement near matches.
30. Qualification verification changes no JustProof ledger field.
31. A saved result is not a new or reusable qualification proof.
32. Frontend checks and external metadata never establish protocol validity.
33. Every implementation communicates only the exact frozen V1 statement.

## 53. Specification Ownership and Dependencies

This document is authoritative for:

- trusted verifier configuration and artifact resolution
- request issuance and retention
- verifier context and challenge lifecycle
- verifier-controlled deadline checks
- proof-artifact parsing
- network-confirmed and portable verification requirements
- current-state acquisition and acceptance snapshots
- request and state digest recomputation
- verification order and atomic challenge consumption
- `VALID`, `INVALID`, and `COULD_NOT_VERIFY` semantics
- safe diagnostic codes
- verifier privacy, logging, retry, concurrency, and result communication; and
- verification integration tests

`01-credential.md` is authoritative for credential construction, holder control, issuer signature, qualification constants, and credential timestamps.

`02-issuer-registry.md` is authoritative for issuer records, verification keys, issuer membership, and current issuer authorization.

`03-commitments.md` is authoritative for typed hashes, openings, credential IDs, and commitment relations.

`04-revocation.md` is authoritative for current non-revocation at the credential index.

`05-ledgers.md` is authoritative for the current public state, read-only qualification verification, and absence of historical state.

`06-merkle-tree.md` is authoritative for credential membership, tree parameters, paths, and root reconstruction.

`07-witnesses.md` is authoritative for private proof inputs and the rule that a verifier never receives them.

`08-proofs.md` is authoritative for the exact request, state snapshot, public output, proof artifact, circuit statement, challenge semantics, deadline horizon, and state-freshness requirement.

`10-specification.md` MUST consolidate this exact verifier algorithm and result model. It MUST reject the earlier draft's generic policies, issuer lookup, optional revocation, historical verification, reusable proof, issuer-bearing result, and Boolean-only result alternatives.

## 54. Implementation References

Implementations should be checked against the official Midnight documentation for the pinned toolchain:

- [Compact language reference](https://docs.midnight.network/compact/reference/compact-reference)
- [Using Compact contracts from JavaScript](https://docs.midnight.network/guides/use-compact-javascript-implementation)
- [Midnight.js](https://docs.midnight.network/sdks/official/midnight-js)
- [Midnight security and best practices](https://docs.midnight.network/guides/security-best-practices)
- [Deploying and operating a contract](https://docs.midnight.network/getting-started/deploy-mn-app)
- [Compact toolchain `0.31.0`](https://docs.midnight.network/relnotes/compact/toolchain-0.31.0)

The generated JavaScript guide explicitly distinguishes off-chain contract-logic execution from proof generation, proof verification, transaction processing, and changed ledger state. A conforming verifier MUST preserve that boundary.

## 55. Final Protocol Principle

JustProof V1 verification does not ask the holder to reveal a credential so that the verifier can inspect it.

It asks whether the exact request-specific zero-knowledge proof, verified under the trusted `proveQualificationV1` artifacts and complete public transcript, establishes the one frozen qualification statement against the verifier's exact request and the configured contract's current finalized state.

Only after that answer is yes and the challenge is atomically consumed may the verifier return `VALID`.

`VALID` belongs to that verification interaction. It is not a reusable credential, historical certificate, issuer disclosure, or broader claim.
