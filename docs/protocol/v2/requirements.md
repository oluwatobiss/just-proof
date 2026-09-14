# Consolidated requirement traceability

## Reviewed D5 clarification — 2026-09-14 (Phase 3A2)

Phase 3A2 measured result: the single unchanged `registerIssuerV2` full build exited 0 with nonzero prover/verifier keys and process-tree memory evidence; the local key-generation question is closed. All 268 focused tests and strict TypeScript checking passed. R61 remains open for the complete protocol and later circuits. See the [Phase 3A2 resource report](../../development/phase-3a2-register-issuer-resource-report.md); no proof or network execution is implied.

`issuerControlCommitment` is caller-supplied, intentionally non-secret protocol data. This does **not** require its raw bytes in public transaction inputs, query/effect transcripts, ledger state or output. The authoritative public representation is the canonical `issuerLeaf` stored in `registeredIssuerLeaves` and committed by `issuerRoot`. The authority, issuer or accepted untrusted registry coordinator may publish and retain `IssuerRecordV2` off-chain. Consumers must recompute its canonical leaf and validate membership/path against current authoritative contract state; publication provides availability, never authorization. Later issuer-controlled transitions must prove that the private issuer secret maps to the control commitment in that authenticated record.

R58/D5 is resolved by this reviewed specification clarification, not by implementing raw chain exposure. The prior Phase 3A observation and “D5 unsupported” conclusion remain correct historical evidence under the former interpretation. No ledger field, event, result, circuit argument, cross-call or forced disclosure is added. The exact accepted contract/witness ABI is unchanged. The complete V2 package remains draft and R61 remains open for the complete protocol. Only the bounded Phase 3A2 resource attempt is authorized; no Phase 3B authorization is implied.


**Draft — User Review Required.** Test names below are proposed targets, not existing/passing tests. `Draft` means specified for review, implementation pending. `Gate` means only the isolated feasibility evidence in the Phase 1 report passed. Positive/negative test labels must become focused Vitest cases in the stated phase. C=contract, I=integration, V=conformance, D=deployment/provider tests. No requirement is discharged by a TypeScript mirror alone.

The audit's referenced464-row temporary inventory is no longer present. This matrix is reconstructed from the retained V1 specifications and the user's original requirements plus D1–D8, consolidating overlaps instead of pretending that absent inventory was inspected. V1 references incorporate the explicitly retained semantics; V2 document sections provide the exact replacements.

| ID / source | Distinct V2 obligation | Compact/TypeScript symbol | Positive test | Negative test | Vector/evidence | Status |
|---|---|---|---|---|---|---|
| R01 User §§1,3,24; D7; V2 00 | Approved WSL/pinned versions and review gates | artifactManifest | D pinned build | wrong compiler/cloud regeneration | compiler metadata | Draft |
| R02 User §§4,5; D4; V2 00,01 | Preserve immutable V1; productV1/protocol 2/demo qualification | protocolVersion; qualificationType | V fixed identifier | protocol 1/wrong qualification/version | raw qualification SHA | Draft |
| R03 User §§6–7; D2,D5; V2 00,02 | Replace all application signatures; no new signature scheme/wallet/backend authority | control hashes; four circuits | I role-authorized lifecycle | role impostor/wallet-only authorization | removed surface list | Draft |
| R04 User §7; D2; V1 03 §§197–231; V2 01 | Independent nonzero CSPRNG secrets/nonces/openings; no reuse/derivation/rotation | secret generation adapters | D independent draws; C nonzero values | zero, cross-role substitution, seed-derived value policy | control/opening vectors | Draft |
| R05 User §§8–9; V2 05 | Exactly nine public ledger fields, sealed context/control, no mirrors | Ledger | C exact schema/initial state | extra field/config/root input | generated decoder/ABI | Draft |
| R06 User §9; V2 05 | Non-secret unique context, private constructor witness and final-hash-only disclosure | constructor; registryAuthoritySecretWitness | v2-constructor: exact nine fields | zero context/secret; diagnostic wrong knowledge | shared-runtime constructor conformance | Phase 2 tested; review |
| R07 User §12; review §3; V2 06,12 | Three candidate depth-16 roots; cross-path agreement plus generated inspection and review | candidate*RootV2 | v2-vectors and v2-generated-types | wrong domain/order/child position | all empty leaves + 16 parents/tree | Phase 2 candidate; review |
| R08 User §§10,12; V1 06; V2 06 | Root-only ordered trees; fixed 16 siblings and ordered children | rootFromV2 | C path reconstruction | wrong sibling/15 or17 entries/sorted children | Merkle probe42 cases | Gate |
| R09 User §10; Merkle gate; V2 06 | Derive all directions from Uint16 index; no direction witnesses | directionsV2 | C all boundary/mixed indices | correct other-index root; flip each of 16 bits | compiled fixed fold | Gate |
| R10 User §10; V2 06 | Uint32 counters; append next index; no overflow; capacity 65536 | nextIssuerIndex; nextCredentialIndex | C insert65535→65536 | full tree; counter/index mismatch | Merkle probe, later both trees | Gate |
| R11 User §§10,13; V2 06 | Membership indices below current allocation counter | authenticateIssuerV2; authenticateCredentialV2 | C last allocated membership | unallocated/wrong index | boundary vectors | Draft |
| R12 User §11; V2 03 | Exact 18 domains, raw UTF8 SHA encoding, no ambiguity/Poseidon claim | DOMAIN_*_V2 | V all constants | case/newline/endian/V1 tag substitution |18 independent SHA matches | Gate |
| R13 User §11; D2; V2 03 | Exact typed order/alignment for every hash/commitment; no raw concatenation | all preimage types | V cross-runtime formulas | changed order/type/field/nesting | fixed schema vectors | Draft |
| R14 User §7; V2 02,03 | Authority hash binds distinct domain/version/context/secret | authorityControlV2 | C correct authority | wrong authority/context/version/domain | control vectors | Draft |
| R15 User §7; V2 02,03 | Issuer control and ID distinct domains; context/record binding | issuerControlV2; issuerIdV2 | C correct issuer record | wrong secret/context/ID/record version | issuer vectors | Draft |
| R16 User §7; D5; V2 02 | Public commitment registration, authority only, no PoP claim | registerIssuerV2 | C register without issuer secret | wrong authority; zero public commitment | witness/ABI inspection | Draft |
| R17 User §13; V2 10 | Reject duplicate issuer leaf, authenticate empty append slot, exact 3 writes | registerIssuerV2 | C root/counter/set update | duplicate/occupied slot/stale root | ledger snapshots | Draft |
| R18 User §13; V2 10 | Authenticate current issuer and secret on credential registration | registerCredentialV2 | C controlled issuer issue | bad membership/wrong issuer secret/cross-role | generated circuit assertions | Draft |
| R19 User §13; V1 01; V2 01,03 | Exact 8-field statement, fixed claim, ID/nonce and private package binding | validateCredentialV2 | C valid package | changed field/nonce/issuer/protocol/qualification | credential vectors | Draft |
| R20 D2; V1 03; V2 01,03 | Subject persistentCommit with holder secret; registration never needs secret | subjectCommitmentV2 | I issuer registers opaque subject binding | proof wrong holder secret/credentialID/opening | subject vectors | Draft |
| R21 D2; V1 03; V2 01,03 | Credential persistentCommit with independent opening | credentialCommitmentV2 | V open exact statement | changed timestamp/field/opening | commitment vectors | Draft |
| R22 User §13; V2 03,10 | Nullifier binds address/context/ID; duplicates rejected; no presentation ID | registrationNullifierV2 | C first insert | duplicate ID with changed package/opening; cross deployment | nullifier vectors | Draft |
| R23 User §13; V2 10 | Credential append exact 3 writes; revocationRoot unchanged | registerCredentialV2 | C root/counter/set update | bad insertion path/stale root/full tree | all-nine-field snapshots | Draft |
| R24 User §13; D3; V2 04,10 | Revocation authenticates issuer secret and rederived ID+nonce | revokeCredentialV2 | C original issuer revoke | other issuer/changed nonce/wrong secret | retained-record vectors | Draft |
| R25 User §§10,13; D3; V2 04,06 | Original credential membership and exact same revocation index | revokeCredentialV2; authenticateNotRevokedV2 | C matched paths | nonexistent credential/wrong index/correct other-index root | paired-tree probe7 cases; lifecycle tests pending | Gate |
| R26 D3; V2 04 | Credential-bound revoked leaf; only empty→revoked | revokedLeafV2 | C first revoke | repeated revoke/constant leaf/unrevocation | ID+commitment leaf vectors | Draft |
| R27 User §13; V2 04,10 | Revocation writes only revocationRoot, needs no holder/statement/opening | revokeCredentialV2 | C minimum witness | forbidden field mutation/holder dependency | exact witness/ledger checks | Draft |
| R28 User §13; V2 08,10 | Proof authenticates issuer+credential+same-index current non-revocation | proveQualificationV2 | I live credential proof | revoked credential/wrong issuer/path/root/index | lifecycle/current-root vectors | Draft |
| R29 D1; V2 08 | Exact ten-field request and complete request digest | QualificationRequestV2; requestDigestV2 | V digest matches retained request | changed issuance/deadline/challenge/context/digest/order | request vectors | Draft |
| R30 D1; V2 08 | All8 time constraints; private Uint<64> comparisons; request-only public bounds | proveQualificationV2 time checks | C inclusive issuance/equal deadline/expiry0 | exclusive expiry/invalid intervals/future issuance/short expiry |16 timestamp probe cases | Gate |
| R31 D1; User §14; V2 07,08 | Neither private timestamp enters public output/ledger/call data/guarantees | time query construction | C invariant public effects | detect credential time disclose | compiled/partitioned transcript equality | Gate |
| R32 User §13; V2 08 | Proof binds current contract/context/all 3 roots/both counters | stateDigestV2 | V exact snapshot digest | root/counter/address/context mismatch/cross-deployment | eight-field state vectors | Draft |
| R33 User §13; V2 08,10 | Exactly two outputs, no Boolean/timestamp/nullifier, no proof writes | QualificationProofPublicOutputV2 | C read-only two-field result | extra public output/effect | generated ABI/ledger snapshots | Draft |
| R34 User §13; V1 09 §§11–14; V2 09 | Nonzero challenge, trusted verifier context, fresh CSPRNG lifecycle | request issuer; proveQualificationV2 | V valid request | zero/reused challenge/context spoof | request/challenge tests | Draft |
| R35 D1; V2 09 | Exact stored request and issuance-time equality; trusted interval twice | verifyQualificationV2 | V retained request acceptance | altered public requestIssuedAt/deadline/untrusted clock/expired request; private issuedAt changes belong to R19/R21/R30 | verifier time boundaries | Draft |
| R36 V1 09 §§30–35; V2 09 | Latest finalized state after crypto verification; race-safe final check | verifyQualificationV2 | V finalized snapshot | stale/provisional state/race/cached state | state-provider tests | Draft |
| R37 V1 09 §§14,35,38; V2 09 | Atomic single-use CAS, terminal challenges, retry only active requests | consumeChallengeV2 | V one concurrent winner | replay/terminal challenge/expired CAS | concurrency tests | Draft |
| R38 D8; V1 09 §§25–29; V2 09,12 | Full proof+transcript capability gate and honest validation layers | verifyQualificationV2 | V supported real verification | missing capability,/check/mock/JS-only acceptance | COULD_NOT_VERIFY tests | Draft |
| R39 V1 09 §§7–10,20–24; V2 09 | Trusted deployment/key/artifact profile and strict bounded parsing | verifier parser/profile | V approved artifact | arbitrary key/URL/network/version/malformed bytes | parser/profile fixtures | Draft |
| R40 User §14; V1 07; V2 07 | Witnesses untrusted immutable snapshots, exact generated types; no backend authority | witness adapters | C stable tuple snapshot | malformed/mutating/untrusted authoritative values | generated typings | Draft |
| R41 User §§14–15; V2 07 | Exact intentional disclosures only; no secret/private metadata logging | disclosures; diagnostics | C public-surface snapshot | secret canary in logs/arguments/transcript | generated source/effect audit | Draft |
| R42 User §§13,15; V2 05,10 | Success exact writes; all failed calls no partial ledger mutation | all four circuits | I documented diffs | early/late failure snapshots for every operation | encoded state equality | Draft |
| R43 User §§15–16; V2 12 | Existing Vitest; contract/integration/conformance via test:local | local test configuration | all suites discovered | omitted compiled tests/mirror-only claims | exact commands/counts | Draft |
| R44 User §§14,18–19; V2 11 | Exact loopback witness-bearing prover, no remote/wallet fallback | browser proof provider | D exact 127.0.0.1:6300 | alternate port/host/redirect/wallet URI | provider request spy | Draft |
| R45 User §§18–19; V2 11 | Preserve CLI and additive user-triggered Preprod browser route; wallet duties | deployment providers | D both adapters | browser-only CLI coupling/wrong network/autosubmit | static wiring tests | Draft |
| R46 User §§17,19; D7; V2 11 | WSL artifacts, hashes, ABI/asset checks, trusted fingerprint | artifactManifest; loader | D approved complete assets | stale placeholder/missing/hash/HTML/0.31.0 assets | artifact hashes | Draft |
| R47 User §20; D6; V2 11 | Independent valid BIP340 maintenance key; same key used once | authority identity; deploy options | D sample/import roundtrip | invalid/derived/substituted key | runtime sign/verify test | Draft |
| R48 D6; V2 11 | PBKDF2-SHA256600k + random salt/AES256GCM96-bitIV; authenticated header | encrypted envelope | D roundtrip/performance | wrong passphrase/cipher/header tamper/unsafe params | Web Crypto tests | Draft |
| R49 D6; V2 11 | Durable encrypted pending storage/readback/download before submission; no plaintext | identity store/export | D persist/reload/decrypt | storage failure/plaintext export/passphrase retention | browser storage tests | Draft |
| R50 User §§19,21; D6; V2 11 | One real pipeline, ID capture corresponds to submitted tx/address; concurrency guard | submission wrapper | D one submission | double click/two tabs/ID from different transaction | provider pipeline test | Draft |
| R51 User §21; D6; V2 11 | Unknown outcome retains encrypted identity; no automatic retry; reconciliation | deployment state machine | D recover known tx | interrupted/unknown outcome/false pre-submit classification | reload/recovery tests | Draft |
| R52 User §22; D6; V2 11 | Authoritative post-finality9-field validation and encrypted finalized export | verifyDeploymentV2 | D exact initial state | wrong network/address/context/root/counter/set/key/artifact | finalized snapshot fixtures | Draft |
| R53 User §§20–21; D6; V2 11 | Separate secret-free public record; backend optional, no identity custody | deployment record | D public-only metadata | leaked secret/passphrase/key/backend-required recovery | export field allowlist | Draft |
| R54 User §19; V2 11 | Hosted PNA/CORS evidence separate from local Vite; no false reliability claim | hosted deployment acceptance | D actual preflight/browser success | exact blocked-browser error/no remote workaround | Phase 5 manual evidence | Draft |
| R55 User §§12,15,25; D8; V2 12 | Separate compile/initialState/proving/verification/deployment metrics | validation report | measured real stages | JS loop/proof-generation misreported as verification | exact logs and layer labels | Draft |
| R56 User §§23–26; V2 00,11 | No scope creep/dependencies/real network runs; CSS preservation; approval stops | phase reports | unchanged-file checks | unauthorized file/command changes | baseline SHA/status | Draft |

Phase 1 gate rows do not imply their future production symbols exist. Every distinct case in the original required test list maps to R04–R43; deployment cases map to R44–R54. Expand individual table tests into focused cases during implementation, without weakening failures to match code. Any unsupported requirement stays open and is reported for user decision.

## Review addendum — 2026-09-14: Phase 3 entry gates

| ID / source | Obligation | Symbol | Positive test | Negative test | Evidence | Status |
|---|---|---|---|---|---|---|
| R57 Review §1; V2 06 addendum | Approve minimum durable leaf/node custody, refresh and recovery model; coordinator never authoritative | reference tree store / path adapter | refreshed path after unrelated transition | withheld/stale/corrupted update; lost state cannot be reconstructed from roots | operational decision and synthetic reference tests | Phase 3 entry gate |
| R58 Review §2; D5 | Prove raw issuer commitment observable boundary from generated artifacts with nine ledger fields and unit return; no forced disclose | registerIssuerV2 boundary | inspected supported observation | argument-only assumption / missing boundary | generated/transcript evidence | Phase 3 entry gate |
| R59 Review §3 | Candidate roots require separately assembled shared-runtime paths plus generated type/source inspection and user review | vectors / constructor constants | cross-path equality | field-order/domain/serialization drift | shared-trust limitation recorded | Phase 2 review gate |
| R60 Review §4 | Exact manifest canonical bytes, CLI version, networkId and identityFormatVersion; fingerprint in header and plaintext | manifest / identity envelope | future fixed synthetic bytes/ciphertext | extra fields or mismatched fingerprint/network | Phase 5 vectors | Draft |
| R61 Phase 2 resource gate | Bounded four-path synthetic cost probe, at most one full key-generation attempt; no hash/depth weakening | phase2-resource.compact | completed bounded full build with measured sizes | timeout/missing parameters/resource failure | skip-zk passed; full build exited 255 fetching missing 2p19 parameters | Phase 3 blocked |

Phase 2 evidence: domain/derivation/vector/type/Merkle tests cover the primitive parts of R04–R15 and R19–R22; constructor tests cover R05–R07 and the constructor portion of R40–R42. These do not discharge lifecycle authorization, full failed-transition atomicity, production D5 observability, cryptographic proof verification, or deployment rows. Exact tests/counts and candidate review status are in the Phase 2 report.

## Accepted Phase 2B review decision — 2026-09-14

This dated status update supersedes the earlier pending-review labels without erasing their historical evidence.

| Requirement | Current decision/status |
|---|---|
| R07 / R59 | User approved all three Phase 2 roots as development implementation constants; no production freeze. Shared-runtime trust limitation remains. |
| R12 | User independently confirmed all 18 raw SHA-256 domain-label constants. |
| R57 | Minimum operational model accepted: optional native Node.js/Express.js coordinator holds only operational hashes/nodes/frontiers, indices and finalized checkpoints/references; credential leaf/index/path metadata is confidential where applicable. Clients and circuits validate untrusted supplied data against authoritative finalized roots/counters. |
| R40 / R41 / R57 | Coordinator must never receive/store role secrets, issuance nonces, openings, complete private credential packages or private statements. Participants retain private packages and role-specific recovery records. Durable backup/recovery is required; roots alone cannot recover unknown tree history. Coordinator can deny service or leak metadata, never authorize invalid transitions/proofs. |
| R56 / R57 | No production backend implementation in Phase 2B or Phase 3; deterministic reference tree remains the contract-test component. Operational implementation/recovery tests remain future work. |
| R58 | D5 generated-artifact observability gate remains open for future registerIssuerV2 work. |

R61 remains **blocked / resource feasibility indeterminate**. The single additionally authorized Phase 2B attempt retrieved 2p19 but was terminated safely under increasing memory pressure after 564.81 seconds; keys remained empty. Focused tests remained 247/247 and focused TypeScript checking passed. Exact evidence and measurement limitations are in the [Phase 2B report](../../development/phase-2b-resource-gate-report.md). No Phase 3 work is authorized by these decisions.

## Phase 3A status — 2026-09-14

This dated update supersedes earlier phase-status labels without changing historical evidence. The user authorized only issuer registration; R61 remains a whole-protocol/release gate rather than a blocker to that bounded implementation.

| Requirement | Evidence / current status |
|---|---|
| R16 | Authority-only registration and exact witness/argument ABI implemented; no issuer secret/PoP. Simulation passed. Raw public observability remains blocked by R58. |
| R17 | Duplicate/empty-slot checks and exactly three writes passed compiled simulation, with all nine fields unchanged after each tested failure. |
| R05–R15, R40–R43 (applicable portions) | Existing 247 focused tests retained, plus 21 registerIssuer tests; strict focused TypeScript check passed. This does not discharge other lifecycle or real proof requirements. |
| R58 / D5 | **Unsupported:** raw commitment exists in generated input classified as CompactJS private material, not in public query/partition/state/output. Stop for review; no interface workaround adopted. |
| R61 | **Open / indeterminate** whole-protocol and release resource gate. Actual registerIssuer full key generation not attempted because D5 failed. No repeat synthetic worst-case build. |
| R57 / R59 | Accepted coordinator assumption and development roots unchanged; shared-runtime limitation retained. |

Exact commands, tests, snapshots, structural transcript evidence and artifact hashes: [Phase 3A report](../../development/phase-3a-register-issuer-report.md). No Phase 3B work is authorized.
