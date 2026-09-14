# Conformance vectors and validation layers

**Draft — User Review Required.** Root numbers are not frozen or approved. The independently checked 18 domain-label hashes in [03](03-domains-and-commitments.md) do not validate typed hashes, persistent commitments, Merkle roots or proofs.

## Required separately assembled conformance paths

Phase 2 compares (A) separately assembled TypeScript descriptors using the pinned Compact runtime and (B) compiler-generated execution with its generated descriptors/source. These are cross-path agreement with a **shared runtime hashing and serialization trust base**, not independent cryptographic implementations. Never feed one path's hash into the other as its expected computation. Shared normative inputs/domains are allowed; independently inspect generated order/types/alignment and runtime delegation. Do not invent serialization. A genuinely separate cryptographic reference is allowed only if derived from authoritative pinned semantics; absent that, retain the limitation explicitly.

For each tree emit its domain bytes; exact typed empty input and empty leaf; all 16 successive parent input records and hashes; final depth 16 root; byte order and encoding. For revocation the empty vector is all NOT_REVOKED; test credential-bound revoked leaves separately. Do not import Antigravity candidate roots into constants. Root values remain candidate constants until both separately assembled paths, generated type/source inspection and user review agree.

Include vectors for authority control, issuer control/ID/leaf, credential ID, subject/credential commitment, credential leaf/nullifier, each empty and revoked leaf, all three node domains, ten-field request digest, eight-field state digest, exact two-field output, Merkle indices 0,1,32767,32768,65535 and full counter 65536. Include version/domain/context/field-order/nonce/opening/left-right changes. Synthetic vector openings must be plainly designated public test inputs, never live role secrets or real credentials. Real secret generation tests use ephemeral CSPRNG values without logging.

A deterministic vector command must record exact WSL platform, Node/npm, compiler/toolchain/language/runtime, CompactJS/Midnight.js versions, source/artifact fingerprints, exact commands and deterministic output. It may not use a clock, random ordering or unseeded randomness for fixed-vector generation. Test randomized secret generation separately. Publication of test vectors must not disclose live private values.

## Existing-runner layout and semantics

Keep existing Vitest and dependencies. `test/conformance/` covers typed hashes, domain manifest, order/serialization, roots, paths and digests; `test/contract/` exercises generated Compact constructor/circuit assertions, decoding, exact writes and failed-call atomicity; `test/integration/` exercises complete valid/invalid four-circuit lifecycles. `npm run test:local` must discover all of these later tests; make only the smallest approved wiring change if needed. No aliases replacing Preview/Preprod tests with local tests.

Required cases and symbol/test ownership are in [requirements](requirements.md). For every negative compiled test assert failure **and** unchanged original ledger/private-state snapshot. For every success compare all nine fields and only the documented mutation set. Test early and late failures, duplicate races, refreshed paths/current roots and cross-deployment rejection. ABI assertions require exactly four exported lifecycle circuits; diagnostic helper exports must not reach production ABI.

## Separately reported validation layers

1. Compiled contract-logic simulation: generated JS assertions/queries with local state. No ZK proof implied.
2. Local proof generation: actual pinned local server at 127.0.0.1:6300 returns a proof. `/check` or mocks do not qualify.
3. Local proof verification: actual supported proof **and full transcript** verification; capability-gated, unavailable means COULD_NOT_VERIFY.
4. Local ledger integration: complete local transaction/state/finality validation. Never substitute a remote Preview/Preprod failure for a contract failure.

Report compile/key-generation time, generated initialState execution time, actual local proving time, complete local deployment time and any available circuit rows/size **separately**. Off-chain Merkle hashing speed is not ZK performance. Phase 1 feasibility probes establish only their documented compiler/simulation/transcript behavior, not complete V2 conformance or a deployed contract.

## Review addendum — 2026-09-14

Raw domain-label SHA-256 validation is distinct from shared-runtime typed conformance. Phase 5 must add fixed **synthetic-only** vectors for exact manifest bytes/fingerprint, envelope header/AAD bytes, KDF inputs and AES-GCM ciphertext/tag, with extra-field and tampering rejection. Fixed salts/IVs/passphrases/keys are test data only; production randomness remains mandatory. Phase 2 has no production lifecycle circuits; diagnostic exports stay in separate sources.

## Phase 2 candidate evidence — 2026-09-14

[protocol-v2-candidates.json](../../../test/conformance/vectors/protocol-v2-candidates.json) contains 18 domain constants, 18 typed derivation cases (including the three node domains), ordered fields/alignment/values, all 17 empty-tree levels per tree, empty and populated boundary paths, candidate roots and two-field digest output. Regenerate using `node_modules/.bin/vite-node test/fixtures/generate-phase2-vectors.ts` after the explicit pinned diagnostic compilation recorded in the report. The reference descriptors and generated code share the runtime trust base; source/generated hashes are diagnostic provenance, not a deployment release manifest.

The [untrusted synthetic reference tree](../../../test/support/v2-reference.ts) stores node hashes for tests and witness-path refresh demonstrations. It is not a production coordinator or an authoritative registry. The 247 focused Vitest cases and generated-type checks passed; proof generation/verification and full lifecycle behavior remain untested. The bounded resource build failed on a missing parameter fetch; no successful full resource key generation is established. See the [Phase 2 report](../../development/phase-2-primitives-constructor-report.md) for exact evidence, the unexpected fetch deviation and Phase 3 blockers.
