# V1 → V2 decisions

## Reviewed D5 clarification — 2026-09-14 (Phase 3A2)

`issuerControlCommitment` is caller-supplied, intentionally non-secret protocol data. This does **not** require its raw bytes in public transaction inputs, query/effect transcripts, ledger state or output. The authoritative public representation is the canonical `issuerLeaf` stored in `registeredIssuerLeaves` and committed by `issuerRoot`. The authority, issuer or accepted untrusted registry coordinator may publish and retain `IssuerRecordV2` off-chain. Consumers must recompute its canonical leaf and validate membership/path against current authoritative contract state; publication provides availability, never authorization. Later issuer-controlled transitions must prove that the private issuer secret maps to the control commitment in that authenticated record.

R58/D5 is resolved by this reviewed specification clarification, not by implementing raw chain exposure. The prior Phase 3A observation and “D5 unsupported” conclusion remain correct historical evidence under the former interpretation. No ledger field, event, result, circuit argument, cross-call or forced disclosure is added. The exact accepted contract/witness ABI is unchanged. The complete V2 package remains draft and R61 remains open for the complete protocol. Only the bounded Phase 3A2 resource attempt is authorized; no Phase 3B authorization is implied.


**Draft — User Review Required.** D1–D8 are user-directed decisions; this complete normative package still awaits review.

| Decision | Selected design and consequence |
|---|---|
| D1 | Ten-field verifier request adds `requestIssuedAt` immediately before `requestExpiresAt`. Only these public timestamps enter block-time queries. Private credential times are compared privately. Isolated compiler and generated-logic evidence is in the report. Validity guarantees are preserved; completeness is deliberately narrower: credentials issued after request creation require a new request. |
| D2 | Subject and credential use `persistentCommit` with independent random 32-byte openings. The holder's `subjectSecret` **is** the subject opening, as in V1; no third subject-opening secret is introduced. Authority/issuer control use separate typed domain-separated `persistentHash` preimages. |
| D3 | Non-revoked leaves are deterministic; revoked leaves bind credential ID and commitment. Never a globally constant revoked leaf. |
| D4 | Preserve the existing demo qualification identifier and qualification version 1. Only cryptographic protocol version becomes 2. |
| D5 | Issuer registration accepts a public issuer control commitment, authorized by the authority witness. No issuer secret or issuer proof of possession at registration. An unusable or third-party-controlled commitment may consume capacity; it cannot issue without its preimage. Preventing that operational mistake is outside the on-chain guarantee. |
| D6 | Before browser submission, persist and download an encrypted pending identity; independent authority and maintenance secrets, Web Crypto PBKDF2-SHA-256/AES-256-GCM, authenticated versioned header, no plaintext export or storage. Phase 5 validates performance/durability. |
| D7 | Only WSL compiler/toolchain 0.31.1, language 0.23.0, runtime 0.16.0. Explicit `compact compile +0.31.1 ...`; cloud builds consume approved artifacts and verify their manifest. No silent 0.31.0 or 0.34.0 generation. |
| D8 | Full proof/transcript verification is capability-gated. Missing capability yields `COULD_NOT_VERIFY`. Simulation and proof generation do not establish verification. This does not block later circuit implementation. |

## Further explicit V2 differences

Authority verification key becomes a sealed authority-control hash. Issuer record's verification key becomes issuer-control commitment; issuer ID now binds version and registry context. Signatures become in-circuit knowledge checks. Three tree-specific node domains replace V1's shared node domain. The V1 empty-revocation domain is renamed to NOT-REVOKED, retaining its semantics. All retained cryptographic domains rotate. The nine-field ledger shape remains, with the authority field replaced.

Authenticated membership indices use `Uint<16>` (0–65535), consistent with the requested feasibility gate. Public append counters remain `Uint<32>` to represent 65536 when full. This is an explicit private witness/retention schema width change from V1's `Uint<32>` index; no capacity change. Counter bounds are checked before narrowing. Directions are computed in the circuit, never supplied as witnesses.

## Removed V1 application signature surface

Remove application types `Secp256k1Point`, `Secp256k1EcdsaSignature`, and primitive `secp256k1EcdsaVerify`; issuer/authority signing and verification keys have no V2 application schema. Do not substitute `JubjubScalar`, `JubjubSchnorrSignature`, `jubjubSchnorrVerify`, Ed25519, custom secp256k1, backend checks or wallet signatures.

Remove fields `registryAuthorityVerificationKey`, `verificationKey` in issuer records/ID inputs, `registryAuthoritySignature`, `issuerPossessionSignature`, `issuerSignature`, and `revocationAuthorizationSignature`, including their occurrences in credential packages, witnesses, retained revocation records and deployment metadata. Replace public authority/issuer key metadata with the corresponding control commitments and derived identifiers.

Remove signed structures and their digest/signing/verification operations: `IssuerRegistrationMessageV1`, `IssuerPossessionMessageV1`, `IssuerSignatureMessageV1`, `RevocationAuthorizationMessageV1`. Remove domains `JP:ISSUER:REGISTRATION:V1`, `JP:ISSUER:POSSESSION:V1`, `JP:CREDENTIAL:SIGNATURE:V1`, `JP:REVOCATION:AUTHORIZATION:V1`; no V2 signature-domain replacements exist. The independent runtime maintenance `SigningKey` remains a versioned BIP-340 key.

V1's portable issuer-signature authentication is intentionally lost. Only finalized authorized registration and current membership establish authenticity. An authority may register arbitrary commitments; it cannot impersonate a separately controlled issuer without that secret. A holder may hold a malformed/unregistered package; possession of bytes alone establishes no qualification. Issuers remain trusted to assess and issue the demonstration qualification honestly.

## Reference preservation

`PROPOSAL.md`, `docs/USAGE.md` and `docs/protocol/01-credential.md` through `10-specification.md` remain byte-for-byte unchanged. V1 section references in this package preserve semantic obligations only where explicitly retained and not superseded here. The demonstration is JustProof's Midnight Builder Certification, with a clearly identified demo authority; no official Midnight Academy integration or endorsement is implied.
