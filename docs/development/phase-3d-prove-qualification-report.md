# Phase 3D — proveQualificationV2

**Draft — User Review Required.** Implementation and validation: 2026-09-15. Evidence/report completion: 2026-09-16. This checkpoint establishes pinned source compilation, generated simulation, read-only atomicity, ABI, time-query and structural public-surface behavior only. **R61 remains open.** No full key generation, parameter retrieval, actual proof, cryptographic proof verification or ledger execution was attempted.

## Baseline and preservation

The pre-edit working tree was clean at HEAD `70bc1df509141ec401c852416e080a789bf6abec`. The production contract matched required SHA-256 `4010eed928402850684930b2adb921153690a410fd5a88fcf52bd02847e87974`. All three accepted lifecycle text ZKIR fingerprints matched before changes and remain unchanged afterward:

| Existing circuit | Text ZKIR SHA-256 |
|---|---|
| registerIssuerV2 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| registerCredentialV2 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| revokeCredentialV2 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

[Durable baseline](evidence/phase-3d/baseline.json) contains 191 tracked, untracked and ignored managed-file hashes. The original constructor and all three lifecycle circuit bodies are preserved byte-for-byte. The prior Phase 3C report remains a byte-identical prefix followed only by its dated acceptance addendum. Frozen V1 references and all earlier evidence, including the failed Phase 3C resource result and historical Phase 3B resource record, remain unchanged.

All commands used WSL kernel `5.15.146.1-microsoft-standard-WSL2`, Compact developer CLI **0.5.2**, explicit toolchain/compiler **0.31.1**, language **0.23.0**, runtime **0.16.0**. [Environment evidence](evidence/phase-3d/environment.json) records installed package and Node/npm versions. No dependency, package script, registry override, CI or deployment setting changed.

## Exact ABI and ordered schemas

```compact
export circuit registerIssuerV2(issuerControlCommitment: Bytes<32>): []
export circuit registerCredentialV2(): []
export circuit revokeCredentialV2(): []
export circuit proveQualificationV2(request: QualificationRequestV2): QualificationProofPublicOutputV2
```

All four and only four occur in generated `circuits`, `impureCircuits`, `provableCircuits` and compiler metadata. Inclusion in the generated impure-circuit collection does not imply a ledger write: qualification reads state and time; the actual transcript and state comparisons establish its read-only behavior. Exported schema types are not extra callable lifecycle endpoints.

```text
qualificationWitnessV2(): QualificationWitnessV2
QualificationWitnessV2 {
  credential: PrivateCredentialPackageV2
  subjectSecret: Bytes<32>
  issuerMembership: IssuerMembershipWitnessV2
  credentialMembership: CredentialMembershipWitnessV2
  revocationPath: RevocationMerklePathV2
}
PrivateCredentialPackageV2 {
  statement: CredentialStatementV2
  issuanceNonce: Bytes<32>
  credentialOpening: Bytes<32>
}
CredentialStatementV2 {
  protocolVersion: Uint<16>
  credentialId: Bytes<32>
  issuerId: Bytes<32>
  subjectCommitment: Bytes<32>
  qualificationType: Bytes<32>
  qualificationVersion: Uint<16>
  issuedAt: Uint<64>
  expiresAt: Uint<64>
}
IssuerMembershipWitnessV2 {
  record: IssuerRecordV2
  issuerIndex: Uint<16>
  path: IssuerMerklePathV2
}
IssuerRecordV2 {
  protocolVersion: Uint<16>
  issuerId: Bytes<32>
  issuerControlCommitment: Bytes<32>
}
CredentialMembershipWitnessV2 {
  credentialIndex: Uint<16>
  path: CredentialMerklePathV2
}
IssuerMerklePathV2 { siblings: Vector<16, Bytes<32>> }
CredentialMerklePathV2 { siblings: Vector<16, Bytes<32>> }
RevocationMerklePathV2 { siblings: Vector<16, Bytes<32>> }
QualificationRequestV2 {
  protocolVersion: Uint<16>
  proofType: Uint<8>
  registryContract: ContractAddress
  registryContext: Bytes<32>
  qualificationType: Bytes<32>
  qualificationVersion: Uint<16>
  verifierContext: Bytes<32>
  challenge: Bytes<32>
  requestIssuedAt: Uint<64>
  requestExpiresAt: Uint<64>
}
QualificationVerificationStateV2 {
  protocolVersion: Uint<16>
  registryContract: ContractAddress
  registryContext: Bytes<32>
  issuerRoot: Bytes<32>
  nextIssuerIndex: Uint<32>
  credentialRoot: Bytes<32>
  nextCredentialIndex: Uint<32>
  revocationRoot: Bytes<32>
}
QualificationProofPublicOutputV2 {
  requestDigest: Bytes<32>
  stateDigest: Bytes<32>
}
```

The callback uses the exact generated `[PS, QualificationWitnessV2]` tuple. It returns one detached snapshot, copies all byte arrays, freezes structural containers and does not mutate caller-owned private state. Typed-array contents are copied rather than claimed deeply frozen. No unchecked `any` adaptation, authority/issuer secret, independent path directions, separate revocation index, root/counter/configuration witness, signature or output field was added. Other-role callbacks in the qualification contract harness throw if invoked; ordinary setup uses separate real registration calls.

## Implemented order and reused primitives

1. Read `kernel.self()` and sealed context, then check protocol 2, proof type 1, exact contract/context, the retained demo qualification identifier/version 1, and nonzero verifier context/challenge. These early rejections do not request a private witness.
2. Read issuer/credential counters and all three roots from ledger state; acquire the qualification snapshot once. Authenticate the V2 issuer record, nonzero control commitment, canonical issuer ID and allocated current-root membership. No issuer-secret proof is required for qualification.
3. Validate the private package: exact protocol/qualification fields, nonzero nonce/opening/subject commitment, issuer binding and canonical credential ID. Derive the persistent credential commitment and leaf using the retained ordered types.
4. Reject zero subjectSecret and rederive the persistent subject commitment using that secret as its subject opening, matching the authenticated statement. No extra opening field is introduced.
5. Authenticate allocated credential membership and canonical NOT_REVOKED membership at the exact same credential index, with internally derived directions. Both counters must be ≤65536; full allocation sentinels remain usable for existing memberships.
6. Apply all eight time constraints. Only request timestamps reach block-time APIs. Private issuance/expiry structure and containment checks remain private comparisons.
7. Construct the exact eight-field verification state from constant protocol 2, actual contract/context and current roots/counters. Return the request and state digests under their distinct typed domains. Do not write any of the nine ledger fields.

Reuses the existing issuer/credential derivations, persistent subject/credential commitments, membership/root helpers, NOT_REVOKED leaf and request/state digest helpers. No domains, hash functions, depths, root constants, field order or protocol semantics changed.

## Compilation, tests and strict checking

Exactly **one** pinned production skip build was run. It completed with **exit 0**, **2.22 seconds**, maximum process RSS **222320 KiB**. [Complete compiler output](evidence/phase-3d/compile-1.txt) contains the timing line and no compiler diagnostics. No additional disclosure or semantic workaround was required. No full build, isolated substitute circuit, parameter fetch or resource retry occurred.

Initial qualification logic run: **79/79**, 56.77 seconds ([output](evidence/phase-3d/tests-initial.txt)). Initial structural/ABI run: **2/2**, 4.96 seconds ([output](evidence/phase-3d/surface-initial.txt)). Additional cross-state, malformed-input and derivation cases increased the qualification file to 89 tests.

The complete applicable `test:local` suite passed **460/460 across 13 files**, exit 0, **93.53 seconds**. This retains all 369 earlier cases and adds 91 qualification cases. Complete names, outcomes and per-case durations are in [tests.json](evidence/phase-3d/tests.json); console output is preserved in [tests-all.txt](evidence/phase-3d/tests-all.txt).

After that full run, the cross-contract rejection assertion was strengthened to use the same explicit nine-field/encoded/private-input snapshot helper as all other rejections. No production code changed. The affected qualification file was rerun: **89/89**, exit 0, **65.42 seconds** ([final JSON](evidence/phase-3d/tests-qualification-final.json), [output](evidence/phase-3d/tests-qualification-final.txt)). This is a focused follow-up, not a second claim of running the complete 13-file suite. There were no failing test runs or compiler attempts in this phase.

| Focused file | Passing cases in complete run |
|---|---:|
| v2-derivations.test.ts | 122 |
| v2-domains.test.ts | 19 |
| v2-generated-types.test.ts | 18 |
| v2-merkle.test.ts | 81 |
| v2-vectors.test.ts | 1 |
| v2-constructor.test.ts | 6 |
| v3a-register-issuer.test.ts | 21 |
| v3b-public-surface.test.ts | 2 |
| v3b-register-credential.test.ts | 47 |
| v3c-public-surface.test.ts | 2 |
| v3c-revoke-credential.test.ts | 50 |
| v3d-prove-qualification.test.ts | 89 |
| v3d-public-surface.test.ts | 2 |

### Typecheck capture clarification — 2026-09-16

The retained [initial strict TypeScript capture](evidence/phase-3d/typecheck-1.txt) is an empty, successful earlier validation capture, not failed diagnostic output. The Phase 3D session history records the expanded focused check completing with exit **0**, before the complete focused suite. Its exact command was:

```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-*.test.ts test/contract/v2-constructor.test.ts test/contract/v3*.test.ts test/support/v3*.ts > docs/development/evidence/phase-3d/typecheck-1.txt 2>&1
```

The file contains **0 bytes**, no diagnostics, and SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. The exit outcome comes from the recorded command-completion history, not an inference from empty output. It is preserved byte-for-byte because it represents a real validation attempt. The later `typecheck.txt` records the final successful check after the strengthened qualification assertion; there was no failed-typecheck correction associated with `typecheck-1.txt`. Both commands and outcomes are now represented in `commands.json` and `validation.json`.

This evidence-only clarification reruns no compilation, tests, typechecking, resource build or network operation. The existing integrity helper validates this newly linked capture's existence, nonignored status, UTF-8 readability, byte size and SHA-256. The exact inventory remains **43 files**, with **20 report-linked evidence files** validated. All substantive Phase 3D results and R61's open status remain unchanged.

Expanded focused strict TypeScript passed with exit 0 and no diagnostics ([output](evidence/phase-3d/typecheck.txt)). The empty output is intentional; the exit status was observed when the command completed, not inferred merely from an empty file. [Validation record](evidence/phase-3d/validation.json) distinguishes completed validation from stages not attempted. Generated source-map warnings about missing original source locations persist but did not prevent execution. No global typecheck was run; previously deferred DeployRoute.tsx, scripts/deploy.ts and test/just-proof.test.ts integration diagnostics remain outside scope.

Exact material commands ([machine-readable commands](evidence/phase-3d/commands.json)):

```bash
/usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' compact compile +0.31.1 --skip-zk contracts/just-proof.compact contracts/managed/just-proof > docs/development/evidence/phase-3d/compile-1.txt 2>&1
npm run test:local -- -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts test/contract/v3b-register-credential.test.ts test/contract/v3b-public-surface.test.ts test/contract/v3c-revoke-credential.test.ts test/contract/v3c-public-surface.test.ts test/contract/v3d-prove-qualification.test.ts test/contract/v3d-public-surface.test.ts --reporter=default --reporter=json --outputFile=docs/development/evidence/phase-3d/tests.json > docs/development/evidence/phase-3d/tests-all.txt 2>&1
npm run test:local -- -- test/contract/v3d-prove-qualification.test.ts --reporter=default --reporter=json --outputFile=docs/development/evidence/phase-3d/tests-qualification-final.json > docs/development/evidence/phase-3d/tests-qualification-final.txt 2>&1
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-*.test.ts test/contract/v2-constructor.test.ts test/contract/v3*.test.ts test/support/v3*.ts > docs/development/evidence/phase-3d/typecheck.txt 2>&1
```

## Behavioral coverage and atomicity

[107 qualification snapshot pairs](evidence/phase-3d/snapshots.json) record all nine public ledger fields before/after successful and rejected calls, plus encoded-input/private-input preservation assertions. All successful qualification outputs preserve ledger encoding, input state, output private state and caller-owned bytes. All rejection helpers preserve all nine fields, complete encoded input state and private-state input, including early request and late time failures. Valid calls request the witness once; early fixed-request or generated-argument validation failures request it zero times.

Coverage includes bounded/unbounded credentials, nonzero and final indices, refreshed paths after actual unrelated issuer/credential registrations and actual revocation, stale/corrupt/wrong-index/cross-tree paths, wrong issuer, invalid/full counters, package fields/openings/nonces, subject-secret role substitutions, wrong subject commitment domain/version, malformed bytes/path lengths and timestamp ranges. Cross-contract/context failures and current-state digest changes are tested. Separate descriptor assembly agrees with generated request/state digests, and every one of the ten request and eight state fields affects its typed digest. The two hash domains are tested separately.

The 19 time-boundary cases cover inclusive credential/request issuance, the last valid second, exclusive request/credential expiry equality, before/after request bounds, zero/equal/reversed intervals, credential issuance after request but before block time, private expiry before/equal/after the request deadline, unbounded expiry, maximum private expiry and maximum Uint<64> request expiry. Additional adapter tests reject out-of-range private/public timestamp values.

Synthetic boundary and malformed authenticated-package fixtures deliberately override local state to reach validation gates; they do not claim that 65536 registrations occurred or that an invalid package could pass registration. Normal setup executes compiler-generated issuer and credential registration. Actual revocation and unrelated append transitions exercise refreshed paths. Reference trees remain untrusted local test components. Hash/serialization paths share the Compact runtime; separately assembled descriptor agreement is not an independent cryptographic implementation.

Retained Phase 3C tests write new observations to [retained snapshots](evidence/phase-3d/retained-3c-snapshots.json) and [retained public-surface evidence](evidence/phase-3d/retained-3c-public-surface.json), preserving committed Phase 3C evidence byte-for-byte.

## Time-query and public-surface gate

The test uses actual installed runtime/ledger partitioning and structural exact-value traversal, not substring search or mocked providers. Independently random ephemeral canaries cover the subject secret, issuer identity/control, credential ID/subject commitment/credential commitment/leaf, nonce/opening, both membership indices and all three paths. Distinct private timestamps are also checked. No private canary bytes or witness packages are saved in evidence.

| Location | Observed behavior |
|---|---|
| Generated argument | Exact ten-field request value/alignment; intentionally non-secret caller metadata |
| Return/result and generated output | Exactly requestDigest and stateDigest, two Bytes<32> values |
| Private witness material | Positive controls locate private fields and path/timestamp canaries |
| Public query | Exactly 31 operations: seven read triplets and two five-operation time comparisons; no write/log/Set operation |
| Read selectors and stack | `[0,1,3,2,6,5,8,2,2]`, dup slots `[2,0,0,0,0,0,0,2,2]`; contract address, context, counters/roots, then two kernel-time reads |
| Time operands/results | Only requestIssuedAt and requestExpiresAt; with request 100–200 and simulated block time 150, blockTime<100 is false and blockTime<200 is true |
| Guaranteed partition | Present; current roots positively located and private atoms absent |
| Fallible partition | Absent |
| Effects | Unchanged; no asset movement, contract call or extra ledger write |
| Encoded ledger | All nine fields unchanged; no additional private values |

The only two new explicit disclosures are:

```compact
blockTimeGte(disclose(request.requestIssuedAt))
blockTimeLt(disclose(request.requestExpiresAt))
```

Both operands are public request metadata. Neither credential timestamp, secret, ID, opening, commitment, path or index is disclosed. No final digest disclosure wrapper was required. The public output contains digests, not timestamps or a Boolean/nullifier.

Three private time variants `(91,211)`, `(92,222)` and `(93,0)` use the same request `[100,200)` and simulated block time 150. The exact public time-query program stays identical. Their authenticated credential roots and state digests legitimately change with their private statements; the test does not claim the entire transcript is identical across changed authoritative roots. The zero expiry sentinel and fixed protocol/qualification constants are shared public values, not unique secret canaries. The nonzero private timestamps and other private atoms are absent at every inspected public location.

All request fields appear in the generated argument descriptor. That is not a claim that Compact separately exposes all ten as raw public chain-query fields: the query independently exposes the expected contract/context/state reads and two time operands, while the request digest binds the complete request. The installed-runtime argument/transcript distinction from the reviewed D5 clarification is preserved without forced disclosure.

[Public-surface findings](evidence/phase-3d/public-surface.json) retain three successful runs with public program/effects and positive controls. Boundary simulations use an explicit block context with zero clock uncertainty. No real chain-time, finality or cryptographic transcript-verification behavior is claimed.

## Artifacts, preservation and resource limitation

Final production SHA-256: `9ffa12d0570659ec703479ffb35c5ab2e1248f668abff6f9fbd91f344ef62ecf`.

All repository-generated output came only from the approved pinned skip command. No file under managed output was hand-edited. [Artifact manifest](evidence/phase-3d/artifacts.json) records every generated file:

| Generated file | Bytes | SHA-256 |
|---|---:|---|
| contracts/managed/just-proof/compiler/contract-info.json | 24565 | `868cca4e3cc858d9cb0cb63ce93e81808509a2eaa60d9ff65c32b54bd3a4902d` |
| contracts/managed/just-proof/contract/index.d.ts | 12959 | `0139fd7406b87a3498b5141ff2bdce2dcef9193753597326af99aa9e738b0d08` |
| contracts/managed/just-proof/contract/index.js | 200816 | `b7396f8c593c99104aeb7ae0bf2f4fe4341beadf525ab841deeb5a064addaeef` |
| contracts/managed/just-proof/contract/index.js.map | 10682 | `2ff2c49f300b2843a8cbf7d365a4b4f739d1addd1da9f476a6cf7e8ad81ebe78` |
| contracts/managed/just-proof/zkir/proveQualificationV2.zkir | 72144 | `7ca590bb29edd4f6dab806f7278878b1720b6773f4702b82e7c2e371db58a803` |
| contracts/managed/just-proof/zkir/registerCredentialV2.zkir | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| contracts/managed/just-proof/zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| contracts/managed/just-proof/zkir/revokeCredentialV2.zkir | 71809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

No new prover/verifier keys or binary ZKIR were generated. Text ZKIR size is not a circuit row count or evidence of proving cost. Phase 3C's compiler −15 at the approved memory floor remains a failed full-resource attempt with unusable revocation placeholders. No partial key was promoted, no cache parameter was fetched, and no resource threshold, Rayon setting, compiler, environment or dependency was changed. R61 requires a separately authorized higher-memory four-circuit resource phase. The Phase 3D source/test checkpoint does not establish release readiness.

All frozen V1 files remain byte-identical to the pre-phase baseline:

| Frozen reference | SHA-256 |
|---|---|
| PROPOSAL.md | `7a94d94ce6aa876ec0823bd48fb22bb23d611098b22a6375e51c1c2e6ae9d4a2` |
| docs/USAGE.md | `62cd11c18708cec304e4f9796a66f342a31be61c9f5f71bb7a4f2627449807a7` |
| docs/protocol/01-credential.md | `117fbca7711675b9612eba220d1e8b774b2b7fccda1fb41787981f550c49f539` |
| docs/protocol/02-issuer-registry.md | `5460dbb9fca37bd68f3215e71da87fed655618a4c72c843def83cc70a45a5a4f` |
| docs/protocol/03-commitments.md | `2342f8a268294e5af25f03d5d80cc4ae88fa3ef7b4fa66b9f5ac838a9cbaa9f9` |
| docs/protocol/04-revocation.md | `bc74505866a2d766d92ad1045480703ecd7f78f7f0eb8f0251e55bd03da140ee` |
| docs/protocol/05-ledgers.md | `9b7a972042babece3752737f5f6b726fd739a88faa2fe69d7ba4fc19cb2e7dd7` |
| docs/protocol/06-merkle-tree.md | `b4d04677588ee891e7d5af9b61e0a789ff524bad15c895aeb314bdcc3e89a8c9` |
| docs/protocol/07-witnesses.md | `0c1d1154a535d8be9188e69fdca3ec6af01507cc6d096ccaa984386d2804ed74` |
| docs/protocol/08-proofs.md | `ec1cd4252b9580e601758f297f2fcd8dc101b7834f1d87245ecb48b9ef5a96c9` |
| docs/protocol/09-verification.md | `2b3d6f3b92de61fc0ec4b40e26b9ea1f35fbd58eb681dbc5a4ba3c85196848d4` |
| docs/protocol/10-specification.md | `0fa343641677a5ac9ebf55f656541d54b81f608adc5764887677b0e17d705bb4` |

[Integrity comparison](evidence/phase-3d/integrity.json) verifies those hashes, preserved earlier bodies/evidence/ZKIR, scoped changes and report-linked evidence availability. [Capture helper](evidence/phase-3d/capture-integrity.py) checks parseability and ignore status. Command outputs use nonignored `.txt` filenames from their original invocations; no ignore exception or historical output rewrite is needed.

## Requirement status and limitations

| Requirement | Result at this evidence level |
|---|---|
| R28 | Current issuer/credential/same-index non-revocation checks pass compiled simulation, including rejection after real simulated revocation |
| R29 | Exact ten-field request, output digest, separate typed domain and all-field binding pass |
| R30 | All eight time constraints pass boundary simulation, including Uint<64> limits and request-only time bounds |
| R31 | Structural runtime inspection finds no raw private timestamps or other non-public witness atoms in public locations |
| R32 | Exact eight-field current-state digest binds contract/context, roots and counters read from authoritative local contract state |
| R33 | Exact two-field output; no ledger writes; all nine fields and encoded/private input preserved on successes and failures |
| R34 | Circuit-side nonzero challenge/verifier context, digest binding and interval checks only; repeating the same request can succeed. Trusted verifier context/clock, freshness and atomic single use are not implemented |
| R40–R43 | Applicable snapshot, strict typing, intentional-disclosure, atomicity and scoped test:local evidence passes. This does not establish proof or ledger verification |
| R58 | Existing reviewed D5 clarification remains unchanged |
| R61 | Open; full four-circuit resource/proof/release gate remains unmeasured and unauthorized here |

Portable proof/transcript verification remains capability-gated. Generated JavaScript execution and digest agreement must not be reported as full proof verification; an unavailable verification capability requires COULD_NOT_VERIFY in later verifier work. No verifier service, challenge storage/consumption, proof serialization/provider, coordinator, frontend, wallet, deployment, Preview/Preprod, CI or Netlify behavior was implemented. No package installation, staging, commit, push, publication or deployment occurred. Complete V2 specifications remain draft.

## Changed-file purposes

- Production contract: adds only the qualification witness/schema and read-only lifecycle endpoint.
- New qualification support and two focused test files: actual generated calls, untrusted tree fixtures, time/atomicity/schema/privacy gates and durable non-secret evidence.
- Earlier constructor/issuer/credential/revocation test/support files: exact four-endpoint expectations and unused-witness guards; generic result typing for the real partition helper; retained Phase 3C evidence redirected into this phase's directory. Endpoint-specific semantic assertions remain intact.
- V2 witnesses/proofs/specification/requirements documents: implemented behavior and evidence-level statuses only.
- Prior Phase 3C report: short acceptance addendum only.
- This report and Phase 3D evidence: commands, source/artifact manifests, test names/results, snapshots, structural findings and integrity checks.

The baseline-derived exact phase-only inventory and final Git status follow. Stop for review; no subsequent phase is authorized.

## Exact Phase 3D-only inventory

Includes ignored compiler-managed outputs, as captured against the pre-phase content baseline.

```text
contracts/just-proof.compact
contracts/managed/just-proof/compiler/contract-info.json
contracts/managed/just-proof/contract/index.d.ts
contracts/managed/just-proof/contract/index.js
contracts/managed/just-proof/contract/index.js.map
contracts/managed/just-proof/zkir/proveQualificationV2.zkir
docs/development/evidence/phase-3d/artifacts.json
docs/development/evidence/phase-3d/baseline.json
docs/development/evidence/phase-3d/capture-integrity.py
docs/development/evidence/phase-3d/commands.json
docs/development/evidence/phase-3d/compile-1.txt
docs/development/evidence/phase-3d/environment.json
docs/development/evidence/phase-3d/integrity.json
docs/development/evidence/phase-3d/public-surface.json
docs/development/evidence/phase-3d/retained-3c-public-surface.json
docs/development/evidence/phase-3d/retained-3c-snapshots.json
docs/development/evidence/phase-3d/snapshots.json
docs/development/evidence/phase-3d/surface-initial.txt
docs/development/evidence/phase-3d/tests-all.txt
docs/development/evidence/phase-3d/tests-initial.txt
docs/development/evidence/phase-3d/tests-qualification-final.json
docs/development/evidence/phase-3d/tests-qualification-final.txt
docs/development/evidence/phase-3d/tests.json
docs/development/evidence/phase-3d/typecheck-1.txt
docs/development/evidence/phase-3d/typecheck.txt
docs/development/evidence/phase-3d/validation.json
docs/development/phase-3c-revoke-credential-report.md
docs/development/phase-3d-prove-qualification-report.md
docs/protocol/v2/07-witnesses-and-disclosures.md
docs/protocol/v2/08-proofs.md
docs/protocol/v2/10-specification.md
docs/protocol/v2/requirements.md
test/contract/v2-constructor.test.ts
test/contract/v3a-register-issuer.test.ts
test/contract/v3b-public-surface.test.ts
test/contract/v3c-public-surface.test.ts
test/contract/v3c-revoke-credential.test.ts
test/contract/v3d-prove-qualification.test.ts
test/contract/v3d-public-surface.test.ts
test/support/v3a-register-issuer.ts
test/support/v3b-register-credential.ts
test/support/v3c-revoke-credential.ts
test/support/v3d-prove-qualification.ts
```

## Final repository status

```text
 M contracts/just-proof.compact
 M docs/development/phase-3c-revoke-credential-report.md
 M docs/protocol/v2/07-witnesses-and-disclosures.md
 M docs/protocol/v2/08-proofs.md
 M docs/protocol/v2/10-specification.md
 M docs/protocol/v2/requirements.md
 M test/contract/v2-constructor.test.ts
 M test/contract/v3a-register-issuer.test.ts
 M test/contract/v3b-public-surface.test.ts
 M test/contract/v3c-public-surface.test.ts
 M test/contract/v3c-revoke-credential.test.ts
 M test/support/v3a-register-issuer.ts
 M test/support/v3b-register-credential.ts
 M test/support/v3c-revoke-credential.ts
?? docs/development/evidence/phase-3d/
?? docs/development/phase-3d-prove-qualification-report.md
?? test/contract/v3d-prove-qualification.test.ts
?? test/contract/v3d-public-surface.test.ts
?? test/support/v3d-prove-qualification.ts
```

Final integrity capture confirms no unexpected changes, unchanged frozen V1 documents and historical evidence, preserved prior report bodies, and unchanged constructor/earlier lifecycle bodies and text ZKIR fingerprints. All report-linked evidence exists and is nonignored; structured evidence parses successfully. Final `git diff --check` passed.

## User acceptance — 2026-09-16

Phase 3D, including its evidence clarification, is accepted only as a source-compilation, generated-simulation, ABI, atomicity, and structural public-surface checkpoint. R61, full four-circuit key generation, actual proof generation, cryptographic verification, and ledger execution remain open. This acceptance authorizes committing the checkpoint only; it does not authorize another implementation or resource phase.

Commit preparation: `git diff --check` passed before staging. The required `git diff --cached --check` found only original captured-output blank lines at EOF in `surface-initial.txt:22` and `tests-initial.txt:96`. These historical command outputs are deliberately preserved byte-for-byte; the staged check is not reported as passing. The staged inventory matches exactly the 38 intended nonignored Phase 3D files, including both typecheck captures; no ignored managed artifacts are staged.
