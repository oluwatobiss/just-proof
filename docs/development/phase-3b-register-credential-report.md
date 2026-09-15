# Phase 3B — registerCredentialV2

**2026-09-15 — Draft — User Review Required.** This phase implements only credential registration alongside the accepted issuer-registration endpoint. Revocation, qualification proving and deployment remain outside scope.

## Baseline and implementation

The pre-edit production SHA-256 matched the required `f27b2a13e71c68a85f70e6083b2457c3f4273475a15f6e061c39c9ba81e7a6db`. A content-hash baseline captured 150 tracked/untracked files plus ignored managed files and the existing compiler parameter cache before changes. Initial git status was clean. The short dated acceptance addendum is the sole change to the Phase 3A2 report; older bodies/evidence are preserved.

Final production source SHA-256:
`8b021b83b9c28e6e63cdeb01f2a8af50e23272e401bd9be8fb1e8147eb57955b`.

Exactly two production lifecycle endpoints:
```compact
export circuit registerIssuerV2(issuerControlCommitment: Bytes<32>): []
export circuit registerCredentialV2(): []
```

The existing constructor and issuer-registration behavior remain unchanged. The added ordered witness ABI is:
```text
credentialRegistrationWitnessV2(): CredentialRegistrationWitnessV2
CredentialRegistrationWitnessV2 {
  issuerSecret: Bytes<32>
  credential: PrivateCredentialPackageV2
  issuerMembership: IssuerMembershipWitnessV2
  insertionPath: CredentialMerklePathV2
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
IssuerMerklePathV2 { siblings: Vector<16, Bytes<32>> }
CredentialMerklePathV2 { siblings: Vector<16, Bytes<32>> }
```

Generated callback return type is exactly `[PS, CredentialRegistrationWitnessV2]`. No holder secret, signature, wallet identity, independent directions, credential index, roots, counters, caller nullifier or configuration was added. The test adapter returns one detached snapshot, copies typed-array bytes and freezes all structural containers. It does not claim that JavaScript freezes typed-array contents. Generated execution invokes the witness once and does not mutate private input. No unchecked `any` adapter was introduced.

Implementation order:

1. Read sealed context and current issuer count/root. Check count ≤65536, record version/nonzero control/canonical ID, allocated index, derived directions and current-root membership; then authenticate nonzero private issuer secret against the record control hash.
2. Validate the exact private statement, retained demo identifier/version, nonzero issuance time and private expiry relation, nonce/opening/subject commitment. Bind statement issuer ID and rederived credential ID. No holder secret or time query.
3. Derive persistent credential commitment, private credential leaf and contract-address/context/ID-bound registration nullifier. Reject duplicate nullifier before late insertion-path processing.
4. Check credential capacity before narrowing. Authenticate the canonical empty leaf at that index; derive the replacement root and bounded increment before writes.
5. Write only credentialRoot, nextCredentialIndex and registeredCredentialNullifiers. Return exactly unit; issuer state, sealed configuration and revocationRoot remain unchanged.

All existing domains, commitments and Merkle helpers are reused. The internal demo-identifier helper stores the retained SHA-256 constant `3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7` for literal `JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1`; this is not a rotated qualification identifier or a nineteenth protocol domain.

## Pinned compilation and pre-resource gates

All commands ran in WSL at `/home/oluwatobiss/projects/midnight/risein/just-proof`, using developer CLI 0.5.2, explicit compiler/toolchain 0.31.1, language 0.23.0 and runtime 0.16.0. Versions were read from the CLI, not inferred from latest releases. No dependencies were installed or changed.

One iterative skip build:
```bash
/usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' compact compile +0.31.1 --skip-zk contracts/just-proof.compact contracts/managed/just-proof
```
Output was redirected to `/tmp/justproof-phase3b/compile-1.log`.
**Exit 0, 0.70 seconds, max RSS 221824 KiB.** No compiler failure, unapproved disclosure request or semantic workaround occurred. Generated files were never edited manually.

Initial new contract tests: **47/47 passed**, 17.39 seconds. Initial ABI/surface tests: **2/2 passed**, 4.51 seconds. Focused strict TypeScript checking passed. The complete pre-resource suite then passed **317/317 tests across nine files**, 38.07 seconds; typecheck and diff check passed. This comprises all retained 268 cases plus 49 new cases. The exact source hash and gate-result file were asserted before the sole full build.

A supplemental structural assertion checks the precise allowed query-operation/selector sequence, proving that no extra log/time query was hidden behind an absence-only comparison. It passed 2/2 surface tests in 5.05 seconds. This strengthened tests only; production source and the passed pre-build privacy behavior did not change.

## Public-surface and disclosure findings

The installed runtime produced a 34-operation public query program and a guaranteed partition; no fallible partition was produced. The test uses the same runtime state conversion and real ledger-v8 partitionTranscripts procedure previously validated against installed CompactJS. No mocked partition or proof provider is used.

Read selectors are precisely ledger context (1), issuer counter (3), issuer root (2), kernel contract address (0 in the kernel stack), credential-nullifier Set (7), credential counter (6) and credential root (5). The final Set-write selector is 7. Query stack duplicate selectors are [0,0,0,2,0,0,0], distinguishing the kernel address read from ledger configuration. No time-query or log operation is present.

| Location | Observed boundary |
|---|---|
| Lifecycle arguments / generated input | Empty value and alignment |
| Output | Exactly [] / empty value and alignment |
| Private witness material | Contains the expected canaries and ordered private package |
| Public query / guaranteed program | Existing public reads, contract address, final nullifier, new root/counter and Set insertion |
| Fallible partition | Absent |
| Effects | Unchanged: empty claimed nullifiers/receives/spends/calls, shielded/unshielded mints/inputs/outputs |
| Ledger state | Nine fields; only the approved three changed |
| Logs/time-query operations | Absent from the exact inspected operation sequence |

Structural exact-value traversal tests ephemeral issuer secret, raw control commitment/issuer ID, credential ID, subject commitment, credential commitment, credential leaf, nonce, opening, every sibling of both paths, and typed encodings of a distinct private issuer index and both timestamps. None occurs in the public surfaces. Whole private record/package/statement objects therefore have no raw public representation; the distinctive private atoms are also individually checked. Shared small public constants such as protocol version are not misleadingly treated as unique secret canaries.

Positive controls locate the actual final nullifier/root in the guaranteed program and the nullifier in the public Set, and find private canaries in private witness output. The synthetic gate uses issuer index 31337 and count 31338 to avoid mistaking coincidentally equal public zero counters/field selectors for disclosure of a private index. Generated source was also inspected; source searches are supplemental, not the privacy evidence by themselves.

Registration adds exactly two explicit disclosures:

| Value | Reason and public location |
|---|---|
| final registrationNullifierV2(kernel.self(), context, id) | Public duplicate guard: Set membership query and insertion |
| final newRoot | Public credentialRoot write |

No credential ID, commitment, leaf, statement, timestamp, path, issuer record/control or secret is disclosed. No reconstructed-root/control acknowledgment was required. The four earlier constructor/issuer disclosures are unchanged. Confidential assignment/path delivery remains future untrusted coordination work.

Canaries are independently random and ephemeral. No private canary, statement, witness package or secret is saved in reports. Durable surface evidence includes only public program/effects and boolean/count findings.

## Tests, atomicity and evidence limits

New generated-logic tests cover first/consecutive registration with refreshed paths, zero/nonzero expiry, opaque subject binding, final capacity boundary, exact unit output, independent descriptor assembly agreeing with generated ID/commitment/leaf/nullifier/root derivations, and full issuer allocation membership.

Failure coverage includes role-secret substitutions; bad record version/control/ID/index/path; stale/cross-tree/other-issuer paths; authenticated wrong-domain/version/context control hashes; all required statement/nonce/opening/time/qualification checks; duplicate ID despite altered opening or otherwise-valid fields; late path corruption/staleness/wrong index/occupied slot/full count; and both path adapters at lengths 15 and 17.

Every failing case snapshots all nine ledger fields, full encoded input state and private state before/after, including early and late failures, and checks one witness invocation. Success checks the exact three changed fields, unchanged input state/private state and unit output. Fifty-one snapshot pairs include success setup calls as well as all failure cases.

Boundary/corruption fixtures deliberately override runtime state using StateValue/ChargedState; they are not deployable mutation APIs or claims that 65535 earlier insertions were executed. Valid ordinary setup uses the real registerIssuerV2 circuit to register two issuers. Contract-address nullifier separation is tested through actual registerCredentialV2 calls; the fixed-ID context-separation comparison uses the generated typed derivation. Retained conformance paths share Compact runtime hashing/serialization; no independent cryptographic implementation is claimed.

This phase does not authenticate credential timestamps against current time at issuance: the approved rule is private structural validity only. Request-time validity remains future qualification work.

## Full-build arrangement

Exactly one conditional full invocation, after compile/tests/atomicity/public-surface gates:
```bash
python3 /tmp/justproof-phase3b/monitor.py
```
The process-group monitor invokes:
```bash
RAYON_NUM_THREADS=2 XDG_CACHE_HOME=/home/oluwatobiss/.cache compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3b/two-registration-circuits-full-20260915
```
Source hash and passed gate are asserted; output is verified nonexistent; exclusive attempt marker prevents reruns. No repository-managed output is overwritten by the full build. The monitor retains the Phase 3A2 limits: approximately 0.5-second process RSS/HWM and system-memory samples, SIGTERM below 768 MiB MemAvailable or 512 MiB free swap, graceful time stop at 895 seconds and independent hard kill at 900 seconds. Descendants are included; wrapper RSS is not substituted.

Pre-run system: 7862 MiB RAM total, 4457 MiB available; 2048 MiB swap total, 6 MiB used; /tmp disk 937 GiB available. Aggregate build timing/memory is not attributed to registerCredentialV2 alone. The compiler reported two circuits and emitted credential key placeholders first.

The expected compiler-managed parameter host remains `midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`. Existing parameters are reused; at most one compiler-requested missing parameter is permitted. No manual downloader, URL substitution, mirror or registry change is used. Local hashes are fingerprints, not independently authenticated official checksums.

## Resumed-session validation — 2026-09-15

The production source still matches the final SHA-256 above. No contract,
generated artifact, dependency or deployment code was changed during this pass.

- `npm test -- test/contract`: **76/76 passed**, four files, 10.89 seconds.
- `npm test -- test/conformance`: **241/241 passed**, five files, 1.15 seconds.
- Together these reruns cover **317/317 tests** across the nine scoped files.
- `git diff --check`: passed before this documentation update.
- `npm run typecheck`: **failed**. `app/components/DeployRoute.tsx:119`,
  `scripts/deploy.ts:86` and `test/just-proof.test.ts:154` omit the required
  constructor context argument. The legacy integration test also references
  removed `message` and `storeMessage` members at lines 184, 190 and 199.
  These callers remain outside Phase 3B's scope. The earlier typecheck success
  must not be read as a current repository-wide typecheck pass.

Vitest reported missing source-map sources in generated artifacts; all selected
tests completed successfully using the available generated JavaScript.

**Resource gate unresolved:** `/tmp/justproof-phase3b` is absent in this
session, and no Phase 3B full-build outcome or durable resource evidence was
found in `docs/development/evidence/`. The prior narrative records a started
attempt, but does not establish its completion, exit status, memory peak or
usable key artifacts. No second full build was attempted: the documented
single-attempt constraint remains in effect. Recover the original logs and
artifacts to finish this gate, or obtain explicit authorization for a replacement
bounded attempt. Do not infer success or failure from missing temporary files.

## Review scope

R18–R23 and R40–R43 have the applicable credential-registration simulation/structural evidence; other lifecycle parts are not discharged. R58 remains resolved by the reviewed D5 clarification. R61 remains open for the complete four-circuit protocol regardless of the bounded resource outcome.

No revokeCredentialV2, proveQualificationV2, full lifecycle flow, coordinator/backend, frontend, /deploy, provider/wallet, deployment assets/scripts, CI, Netlify, Preview or Preprod work was performed. No dependency installation, actual proof, cryptographic proof verification, wallet operation, ledger call, staging, commit, push, publication or deployment occurred. Work stops after this report for review.

## Completion-pass evidence reconciliation — 2026-09-15

The preceding resumed-session paragraph is preserved as the assessment made when temporary evidence was missing. The recovered conversation summary **does record completion** of the sole full invocation: compiler exit 0, 699.389838207 seconds, no timeout/safety stop, both nonzero key pairs and both verifier-key serialization round trips. This corrects the statement that the narrative only recorded a started attempt. However, the original full-build logs, keys, attempt marker, baseline and memory samples have not survived in this workspace. No second attempt was made. Resource evidence therefore remains incomplete for durable audit/reinspection; the recorded success is not being presented as a fresh artifact verification.

[Historical resource record](evidence/phase-3b/historical-resource-record.json) preserves those previously observed measurements and every reported artifact size/hash, explicitly labelled with its recovered-summary provenance. The sampled aggregate compiler/descendant RSS peak was 2,585,684 KiB (about 2.47 GiB), across 1,297 samples. Minimum system available RAM was 2,085,496 KiB and maximum swap use 103,524 KiB. The waited-child maximum RSS was 2,386,696 KiB; it is not an aggregate peak. Sampling can miss between-sample peaks and summed RSS can count shared pages more than once. Measurements cover the complete two-circuit build, not credential registration alone.

The prior result recorded no new parameter request/cache file, and unchanged existing cache hashes. Both issuer keys and its text/binary ZKIR were reported byte-identical to Phase 3A2. Module-wide bindings, source map and metadata changed as expected for the added endpoint. Verifier round trips used installed ledger-v8 ContractOperation serialization/deserialization; they were format checks, not cryptographic proof verification. No exact row count follows from artifact sizes or parameter selection.

### Recorded full-build artifacts (historical, unavailable for reinspection)

| Relative artifact | Bytes | SHA-256 |
|---|---:|---|
| compiler/contract-info.json | 9597 | `ee63080db5e7efbf186d49561a7fde811eecfb1e498984c9d7457c16ba257bc8` |
| contract/index.d.ts | 10547 | `93de34f2ed84e1f759ef117db73dd7951327ee53f720190774aafb303e5e6da2` |
| contract/index.js | 130635 | `f2cca9f384ade18f559ee104434fcd8eaf42cc64855f57d0000acab61dd4653c` |
| contract/index.js.map | 6976 | `f34689e07778cd356997b217894974477cc3f785aab36c7b76a4b0f2c8f9e770` |
| keys/registerCredentialV2.prover | 76642841 | `1722f6f9cf0e818f414639fb179b9a3d7756242102e9fbe1367b5c167b5e263e` |
| keys/registerCredentialV2.verifier | 2119 | `c0abaaf254564c21488f90784d8b29c8b106ae2e273fde89fa6fa392c4610d22` |
| keys/registerIssuerV2.prover | 76490158 | `9c136a8ce811aedd13ad2e364005b1d3454f76fd7e29cd6edaff5b5a99dcca28` |
| keys/registerIssuerV2.verifier | 2119 | `b6c78daa6b3964912d9cbf2bd783365de7c18521ca26efffbee5b37e410e1a9a` |
| zkir/registerCredentialV2.bzkir | 5613 | `26015eecbe8847ec442d288b3d252189892772e3af6168aa30b7a6b8ab4eedba` |
| zkir/registerCredentialV2.zkir | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| zkir/registerIssuerV2.bzkir | 3056 | `be21a00eda843b8ec88fb8e19f9a9645fe81659ed9354f8515d651991f3bab56` |
| zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |

### Durable local validation

The completion pass reran the exact nine focused files to save complete test names and outcomes in [tests.json](evidence/phase-3b/tests.json): **317 passed, 0 failed**, command exit 0. This is compiled contract simulation and conformance testing. The prior nested npm invocation had consumed JSON-reporter flags; direct installed Vitest was used solely to produce the missing durable result, without editing package scripts:

```bash
MIDNIGHT_NETWORK=local node_modules/.bin/vitest run test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts test/contract/v3b-register-credential.test.ts test/contract/v3b-public-surface.test.ts --reporter=json --outputFile=docs/development/evidence/phase-3b/tests.json
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts test/support/v3a-register-issuer.ts test/support/v3b-register-credential.ts test/contract/v3b-register-credential.test.ts test/contract/v3b-public-surface.test.ts
```

Focused strict TypeScript exit 0, no diagnostics. The earlier out-of-scope global diagnostics remain separately recorded above. Source-map warnings do not represent failed cases.

[Public-surface evidence](evidence/phase-3b/public-surface.json) and [all-nine-field snapshots](evidence/phase-3b/snapshots.json) were regenerated by the passing structural/simulation tests. They contain synthetic public state and findings, not saved private witness packages. [Integrity evidence](evidence/phase-3b/integrity.json) records all 12 frozen V1 hashes and current managed-artifact sizes/hashes. Every frozen file matches committed HEAD byte-for-byte. The initial clean status is recorded historically, but the original 150-file pre-phase baseline is missing; an exact baseline-derived inventory of ignored changes cannot now be independently reconstructed.

### Phase-only file inventory and remaining review limits

- `contracts/just-proof.compact`: adds only the credential-registration endpoint, exact witness schemas and retained qualification constant helper.
- `test/support/v3b-register-credential.ts`: typed detached snapshot adapter and synthetic reference-tree setup.
- `test/contract/v3b-register-credential.test.ts`: 47 focused behavior/atomicity cases.
- `test/contract/v3b-public-surface.test.ts`: two generated-schema/transcript cases.
- `test/contract/v2-constructor.test.ts`, `test/contract/v3a-register-issuer.test.ts`, `test/support/v3a-register-issuer.ts`: deliberate incremental ABI updates, retaining prior semantics.
- `docs/protocol/v2/07-witnesses-and-disclosures.md`, `10-specification.md`, `requirements.md`: scoped draft behavior/evidence statuses.
- `docs/development/phase-3a2-register-issuer-resource-report.md`: acceptance addendum only.
- This report and `evidence/phase-3b/{tests.json,snapshots.json,public-surface.json,integrity.json,historical-resource-record.json}`: durable non-secret validation and provenance.
- Ignored compiler output under `contracts/managed/just-proof`: compiler metadata, generated JS/declarations/map and credential ZKIR; issuer ZKIR remains the accepted hash. Current hashes are inventoried, not hand-edited. No full-build key assets were promoted.

R18–R23 and applicable R40–R43 have passing simulation, atomicity and structural disclosure evidence. R58 remains resolved by reviewed specification clarification. **R61 remains open**, including whole-protocol resources and the missing durable Phase 3B full-build evidence. The prior successful resource observation does not establish current key availability, actual proof generation, proof verification, ledger execution or release readiness. Complete V2 documents remain draft. No further circuit or resource attempt is authorized by this completion pass.

Final environment recheck: WSL kernel `5.15.146.1-microsoft-standard-WSL2`, Node `v24.18.0`, npm `11.16.0`, Compact developer CLI `0.5.2`, compiler `0.31.1`. The original issuer circuit body matches HEAD exactly and the prior 3A2 report remains an unchanged prefix followed by its acceptance addendum.

Final `git status --short` (ignored compiler files are separately inventoried):

```text
 M contracts/just-proof.compact
 M docs/development/phase-3a2-register-issuer-resource-report.md
 M docs/protocol/v2/07-witnesses-and-disclosures.md
 M docs/protocol/v2/10-specification.md
 M docs/protocol/v2/requirements.md
 M test/contract/v2-constructor.test.ts
 M test/contract/v3a-register-issuer.test.ts
 M test/support/v3a-register-issuer.ts
?? docs/development/evidence/phase-3b/
?? docs/development/phase-3b-register-credential-report.md
?? test/contract/v3b-public-surface.test.ts
?? test/contract/v3b-register-credential.test.ts
?? test/support/v3b-register-credential.ts
```

`git diff --check` passed. All excluded tracked application/configuration areas and historical reports other than the permitted addendum are unchanged. Frozen V1 preservation is confirmed against HEAD; the missing temporary baseline limitation above remains explicit. Stop for user review; do not begin Phase 3C.
