# Verifier acceptance and single-use challenges

**Draft — User Review Required.** Incorporates [V1 verification](../09-verification.md) §§6–14, 16–54 for trust, parsing, outcomes, races, privacy, retention and capability boundaries, substituting V2 schemas/domains/circuit identity and adding the issuance-time checks below. V1 signature authentication and old nine-field request are not retained.

## Issuance and retained record

Load a trusted deployment profile (network, address, context, protocol 2, fixed qualification, approved source/artifact/circuit/verifier-key identities). Generate a nonzero CSPRNG challenge never assigned to another request. Set nonzero verifierContext from trusted configuration, `requestIssuedAt` from a trusted synchronized clock, and a strictly later short exclusive deadline (retained V1 recommendation: at most 15 minutes unless measured proving conditions justify longer). Compute the ten-field typed digest and atomically store:

```text
QualificationChallengeRecordV2 {
  request: QualificationRequestV2
  requestDigest: Bytes<32>
  status: ChallengeStatusV2
}
ChallengeStatusV2 = ISSUED | CONSUMED | EXPIRED | CANCELLED
```

The request contains the authoritative stored issuance time; any redundant database issuance-time column must agree exactly. Operational audit/finality/retention fields do not alter the statement. Holder/browser/proof-provided time is not a trusted clock. Return `COULD_NOT_VERIFY` if time is unavailable/unreliable.

## Required acceptance algorithm

1. Apply bounded transport parsing and exact schema/range/length checks. Reject missing/extra/reordered interpreted fields, malformed encoding and unexpected versions; construct typed values using approved descriptors, never arbitrary JSON hashing.
2. Locate retained request by trusted verifierContext and challenge. Require ISSUED, compare **every** submitted request field against it, including exact stored requestIssuedAt. Require requestIssuedAt≤trustedNow<requestExpiresAt.
3. Validate trusted network, address, context, protocol 2, fixed qualification/version 1, proofType1, circuit identity and artifact fingerprint. Untrusted URLs/keys/network selectors cannot override the trusted profile.
4. Recompute complete requestDigestV2 and require equality with the bound public output. Resolve the approved verifier artifacts. Verify the cryptographic proof and **complete** public/query/time transcript through a supported capability.
5. After cryptographic verification, obtain or confirm the latest authoritative finalized contract state. Reconstruct all eight state fields, validate counter ranges and profile/context, recompute stateDigestV2, compare output, artifact state, transcript and trusted current snapshot. No historical roots, stale caches or prover-provided state may authorize acceptance.
6. Immediately before consumption reconfirm current finalized acceptance snapshot and trusted time/status. State change before final comparison is INVALID/STALE_STATE; an active request can be retried with refreshed paths. Do not promise perpetual validity after the accepted finalized snapshot.
7. Atomically compare-and-set ISSUED→CONSUMED with both time inequalities, exact retained request/digest, accepted stateDigest, verifiedAt and finalized snapshot reference. Only after commit return VALID. At most one concurrent response may succeed; losing attempts are INVALID/REQUEST_NOT_ACTIVE.

Expiry and cancellation are terminal alternative transitions from ISSUED. Terminal challenges are never reassigned. Invalid/malformed/indeterminate/stale attempts do not automatically consume a still-active request; documented abuse policy may cancel it. The contract never stores or consumes challenges.

## Capability gate and result semantics

VALID requires all checks and atomic consumption; INVALID is a conclusive failed condition; COULD_NOT_VERIFY means required proof/transcript verification capability, trusted artifacts/state/time or finality is unavailable. PENDING is UI progress only. Generated JS execution, digest equality, mocked proof providers, successful `/check`, and even successful proof **generation** are not full verification.

Portable verification remains unavailable until an actual supported pinned capability verifies proof, complete transcript (including time bounds), circuit/key identity and state binding. If unavailable, return COULD_NOT_VERIFY, not VALID. Finalized network-confirmed verification, if later supported and tested, must authenticate the exact successful circuit call, transcript, outputs and finality and still apply current-state/time/single-use checks. No claim of this capability is made in Phase 1.

Retain V1 safe outcome records/diagnostic-code principles with V2 request/state names. Never expose witness data, timestamps from the private credential, secrets, raw SDK errors or sensitive tree data in errors/logs. VALID means the fixed demonstration qualification holds at the accepted finalized snapshot for this request; it does not certify legal identity, employment, official Midnight endorsement, arbitrary PDF contents or future non-revocation. Backend services may assist availability or track verifier-owned challenges; they may not become authoritative issuer/credential registries.
