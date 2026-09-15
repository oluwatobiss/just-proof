# Normative lifecycle transitions

## Phase 3B implementation status — 2026-09-15

The incremental production ABI now contains exactly `registerIssuerV2(issuerControlCommitment: Bytes<32>): []` and `registerCredentialV2(): []`. Revocation and qualification proving remain unimplemented. Credential registration authenticates the current issuer record/path/secret before validating the exact private statement, derives the address/context-bound nullifier, rejects duplicates, checks capacity before narrowing, and authenticates the empty credential slot. Every assertion and bounded increment precedes the three writes: credentialRoot, nextCredentialIndex and registeredCredentialNullifiers. Revocation state and the other five unrelated fields remain unchanged. No block-time query, holder participation or assignment output is added. See the [Phase 3B report](../../development/phase-3b-register-credential-report.md) for simulation, public-surface and conditional resource evidence. These statuses do not freeze the draft or authorize another lifecycle circuit.

## Reviewed D5 clarification — 2026-09-14 (Phase 3A2)

`issuerControlCommitment` is caller-supplied, intentionally non-secret protocol data. This does **not** require its raw bytes in public transaction inputs, query/effect transcripts, ledger state or output. The authoritative public representation is the canonical `issuerLeaf` stored in `registeredIssuerLeaves` and committed by `issuerRoot`. The authority, issuer or accepted untrusted registry coordinator may publish and retain `IssuerRecordV2` off-chain. Consumers must recompute its canonical leaf and validate membership/path against current authoritative contract state; publication provides availability, never authorization. Later issuer-controlled transitions must prove that the private issuer secret maps to the control commitment in that authenticated record.

R58/D5 is resolved by this reviewed specification clarification, not by implementing raw chain exposure. The prior Phase 3A observation and “D5 unsupported” conclusion remain correct historical evidence under the former interpretation. No ledger field, event, result, circuit argument, cross-call or forced disclosure is added. The exact accepted contract/witness ABI is unchanged. The complete V2 package remains draft and R61 remains open for the complete protocol. Only the bounded Phase 3A2 resource attempt is authorized; no Phase 3B authorization is implied.


## Accepted Phase 2B review decision — 2026-09-14

Later lifecycle work assumes the [minimum coordinator availability model](06-merkle-tree.md#accepted-phase-2b-review-decision--2026-09-14). A native Node.js/Express.js coordinator may retain tree hashes/nodes/frontiers, indices and finalized checkpoints/references, with confidential handling of credential leaf and path metadata where applicable. It is never authorization authority and never receives role secrets, nonces, openings, complete private packages or private statements. Participants retain private packages/recovery records; clients and circuits authenticate coordinator data against finalized ledger roots/counters. Durable backup/recovery is required because unknown private tree history cannot be recovered from roots alone. No production backend is implemented in Phase 2B or Phase 3; tests use the deterministic reference tree. The development root approval in that decision preserves the shared-runtime limitation and does not freeze this draft or authorize Phase 3.

**Draft — User Review Required.** This document owns transition ordering/dependencies. Exact types, hashes, witnesses and public boundaries are incorporated from [01–09](README.md). The generated lifecycle ABI must expose **only** these four circuits. Helpers stay internal; exported data types/ledger accessors do not add callable lifecycle circuits.

## Shared authenticated checks

`authenticateIssuerV2`: record.protocolVersion=2; record control commitment nonzero; canonical issuerId under sealed context; issuerIndex<nextIssuerIndex≤65536; depth 16 issuer leaf membership under current issuerRoot. For issuer-controlled calls additionally require nonzero issuerSecret and equality of its typed V2 control hash to this authenticated commitment. Do not trust a caller-supplied issuer ID, root or role claim.

`validateCredentialV2`: exact eight-field statement, protocol 2, fixed qualification/version 1, nonzero issuance nonce/credential opening/subject commitment, structural time validity, statement issuerId equals authenticated issuer ID; rederive credentialId using that issuer and nonce and assert equality; derive credentialCommitment and credentialLeaf from exact typed values. No issuer signature. Subject opening is a separate qualification-only check; registration cannot prove it without the holder secret.

`authenticateCredentialV2`: credentialIndex<nextCredentialIndex≤65536; reconstruct credentialLeaf membership under current credentialRoot. `authenticateNotRevokedV2`: use this same authenticated index and its private revocation path to authenticate the canonical NOT_REVOKED leaf under current revocationRoot. No independent revocation index or witness root.

## registerIssuerV2

Protocol-public/non-secret argument: issuerControlCommitment Bytes<32>. Return `[]`. Private input: IssuerRegistrationWitnessV2. This terminology does not claim raw chain visibility.

1. Read sealed authority commitment/context and current issuer root/counter; reject zero public commitment/authority secret. Recompute authority control hash with version 2/context; require equality to sealed authority commitment.
2. Require nextIssuerIndex<65536. Derive canonical issuerId, IssuerRecordV2 and issuerLeaf from public supplied control commitment. Reject registeredIssuerLeaves membership.
3. Derive insertion directions from checked nextIssuerIndex; authenticate canonical issuer empty leaf at that index under current root. No issuerSecret or issuer PoP.
4. Recompute root with the new leaf/same path/index. Atomically write issuerRoot, insert leaf into registeredIssuerLeaves, increment nextIssuerIndex exactly once. Change no other field and return no record/index/path.

### Phase 3A implementation status — 2026-09-14

The incremental production ABI now contains the constructor and **only** `registerIssuerV2`. The other three lifecycle circuits remain unimplemented. The witness is obtained exactly once, both zero checks and authority authentication precede mutation, and capacity is checked before narrowing the index. Empty-slot authentication and the bounded counter increment are evaluated before the three writes. Compiled simulation tests cover first/consecutive registration, the 65535 boundary, duplicate/path/authentication failures and complete nine-field state preservation on failure.

The required D5 raw observable boundary is **unsupported** in generated/partitioned material. This endpoint is not accepted as a complete protocol implementation: full key generation was not attempted and work stops for review. See [Phase 3A evidence](../../development/phase-3a-register-issuer-report.md). No other lifecycle circuit, production backend, proof generation or deployment is authorized by this status.

## registerCredentialV2

No public arguments. Return `[]`. Private input: CredentialRegistrationWitnessV2.

1. Authenticate current issuer membership and prove corresponding issuer-secret knowledge bound to version 2/context.
2. Validate private package and statement as above, deriving ID, credential commitment and leaf. Retain issuer-supplied subject commitment unchanged; do not require or derive it using a holder secret here.
3. Derive registrationNullifier using canonical credentialId, kernel.self(), current sealed context/version 2; reject if already in registeredCredentialNullifiers.
4. Require nextCredentialIndex<65536; derive insertion index/directions from this public counter. Authenticate credential empty leaf under current credentialRoot.
5. Recompute root with credentialLeaf and identical path/index. Atomically write credentialRoot, insert final nullifier, increment nextCredentialIndex exactly once. revocationRoot is unchanged. No emitted credential ID/commitment/index/statement/issuer record. Assignment is coordinated privately after finality, acknowledging that public counters disclose sequence counts.

## revokeCredentialV2

No public arguments. Return `[]`. Private input: CredentialRevocationWitnessV2.

1. Authenticate issuer membership and corresponding issuer-secret knowledge against current issuerRoot and context/version 2.
2. Require nonzero retained issuanceNonce. Rederive credentialId from authenticated issuerId/nonce and require equality with the supplied retained credentialId.
3. Derive original credential leaf from that ID and retained credential commitment. Authenticate membership under current credentialRoot at credentialIndex<nextCredentialIndex.
4. Authenticate canonical NOT_REVOKED under current revocationRoot at **exactly that index**. Derive credential-bound revoked leaf using ID and commitment, then new root using same path/index.
5. Atomically write only revocationRoot. No statement/credential opening/holder secret required. Fail on nonexistent credential, wrong issuer, stale path, mismatch index or repeated revocation.

## proveQualificationV2

Public argument: QualificationRequestV2. Return exactly QualificationProofPublicOutputV2. Private input: QualificationWitnessV2. **No ledger writes.**

1. Validate all ten request fields and fixed constants/address/context/nonzero challenge/verifierContext. Read current roots/counters/configuration directly from ledger.
2. Authenticate issuer membership; validate package/statement and rederive credentialId, credentialCommitment and credentialLeaf. No issuer-secret witness or removed signature.
3. Require nonzero subjectSecret; rederive persistent subject commitment and assert equality with statement.subjectCommitment. This proves holder control without revealing the secret.
4. Authenticate current credential membership and same-index NOT_REVOKED membership. Apply every private/public time constraint in [08](08-proofs.md), disclosing only request timestamps to time operations.
5. Construct the exact current eight-field verification state; hash exact ten-field request and state with separate V2 domains. Return only requestDigest and stateDigest. Verifier is responsible for fresh challenge issuance, trusted-clock checks and atomic single use.

## Security and implementation invariants

Every path has exactly16 siblings; no independent directions; no witness-authoritative configuration; context/version/domain substitutions fail; private role substitution fails cryptographic checks except accidental secret equality excluded by generation policy. Successful calls mutate only the documented fields. Failed calls publish no partial ledger change. No private branch may add public credential-dependent effects. Tests must exercise generated Compact logic rather than only a TypeScript mirror. The final four-circuit lifecycle remains incomplete; the Phase 3A status above identifies the sole incremental endpoint and its blocker. Phase 1 probes are not lifecycle implementations.

## Phase 3C implemented boundary — 2026-09-15

Production exports exactly `registerIssuerV2(Bytes<32>): []`, `registerCredentialV2(): []` and `revokeCredentialV2(): []`. The ledger still has exactly nine fields. Revocation authenticates issuer control and original issuance nonce/ID, current credential membership, and same-index canonical NOT_REVOKED membership, then changes only revocationRoot. Both allocation counters permit membership at their full 65536 sentinel. No statement, credential opening, holder secret, separate revocation index, timestamp/reason or nullifier operation is introduced. The complete specification remains draft; qualification implementation and complete lifecycle verification are not authorized in this phase. Resource evidence is separately reported in the [Phase 3C report](../../development/phase-3c-revoke-credential-report.md).

## Phase 3D implemented boundary — 2026-09-15

The incremental source ABI now contains all four and only four specified lifecycle circuits, including `proveQualificationV2(request: QualificationRequestV2): QualificationProofPublicOutputV2`. Earlier incremental-status entries remain historical. Qualification reads current state, authenticates membership/package/holder opening, applies the approved public-request/private-credential time constraints, and returns the two typed digests without ledger writes. The prior constructor and three lifecycle bodies and their text ZKIR fingerprints remain unchanged.

This establishes source compilation and local generated simulation only. No full four-circuit key generation, proof generation/verification, verifier service or ledger integration occurred. The Phase 3C safe-stop limitation remains; R61 is open for a separately authorized higher-memory resource phase. Complete specifications remain draft. See the [Phase 3D report](../../development/phase-3d-prove-qualification-report.md).
