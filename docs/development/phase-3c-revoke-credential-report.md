# Phase 3C — revokeCredentialV2

**2026-09-15 — Draft — User Review Required.** Implements revocation only, retaining the reviewed constructor and two registration endpoints. Qualification, production coordination, providers, frontend and deployments remain outside scope.

## Baseline and pinned environment

The working tree was clean before edits. Required source SHA-256 matched `8b021b83b9c28e6e63cdeb01f2a8af50e23272e401bd9be8fb1e8147eb57955b`; issuer text ZKIR matched `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699`; credential text ZKIR matched `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e`. [Durable baseline](evidence/phase-3c/baseline.json) captured 160 tracked/untracked/ignored-managed files and HEAD before implementation. Existing ignored compiler outputs are included; no original evidence depends solely on temporary storage.

All commands ran under WSL kernel 5.15.146.1-microsoft-standard-WSL2, Compact developer CLI 0.5.2, explicit compiler/toolchain 0.31.1, language 0.23.0 and runtime 0.16.0. [Environment evidence](evidence/phase-3c/environment.json) records installed package versions, including Node/npm. No dependency or registry configuration changed. No upgrade or install was attempted.

The only prior-report edit is a short dated Phase 3B acceptance addendum. Its recovered historical resource record is unchanged and remains historical, not current key availability or proof evidence.

## Exact ABI and witness

```compact
export circuit registerIssuerV2(issuerControlCommitment: Bytes<32>): []
export circuit registerCredentialV2(): []
export circuit revokeCredentialV2(): []
```

Exactly these three endpoints appear in generated `circuits`, `impureCircuits`, `provableCircuits` and compiler metadata. Constructor ABI and all nine ledger fields remain unchanged. No diagnostic or qualification circuit/witness is exported or implemented.

```text
credentialRevocationWitnessV2(): CredentialRevocationWitnessV2
CredentialRevocationWitnessV2 {
  issuerSecret: Bytes<32>
  issuerMembership: IssuerMembershipWitnessV2
  issuanceNonce: Bytes<32>
  credentialId: Bytes<32>
  credentialCommitment: Bytes<32>
  credentialMembership: CredentialMembershipWitnessV2
  revocationPath: RevocationMerklePathV2
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
```

The callback uses the exact generated `[PS, CredentialRevocationWitnessV2]` tuple. It returns one detached operation-scoped snapshot, copying all byte arrays and freezing structural containers. Typed-array contents are copied, not claimed deeply frozen by JavaScript. No unchecked `any` adaptation, shared-input mutation, separate revocation index, directions, authoritative root/counter/configuration, statement/package, credential opening, holder secret, signature, wallet identity, timestamp or reason is added.

## Transition ordering

1. Read sealed context and issuer counter/root. Validate counter ≤65536, V2 record, nonzero control, canonical issuer ID, allocated index and current issuer membership with internally derived directions. Authenticate nonzero issuer secret against the record control commitment.
2. Reject zero retained issuance nonce. Rederive credential ID from canonical authenticated issuer ID and nonce, then compare the retained ID. Another valid issuer cannot revoke a learned credential ID/commitment using its own secret.
3. Derive the original credential leaf using existing ordered helpers. Read credential counter/root, require counter ≤65536 and index allocated, and authenticate current membership. No new nonzero credential-commitment rule is invented.
4. Reuse exactly that credential index to authenticate canonical NOT_REVOKED under current revocationRoot. Derive the credential-bound revoked leaf and replacement root using the same path/index.
5. After all assertions, write only revocationRoot and return unit. Leave the other eight ledger fields unchanged. No credential-nullifier Set access, kernel.self read, time query, asset effect or cross-contract call occurs.

Existing `issuerIdV2`, `issuerLeafV2`, `issuerControlV2`, `credentialIdV2`, `credentialLeafV2`, `membershipV2`, `rootFromV2`, `notRevokedV2`, `revokedLeafV2` and exact domain constants are reused. No cryptographic schema/helper/domain/root change was needed. Full counter 65536 permits existing membership in both trees.

## Compilation and tests

The only iterative pinned skip build completed with exit 0 in **1.52 seconds**, maximum process RSS **223340 KiB**. No compiler diagnostic, protocol adjustment or forbidden disclosure workaround occurred. [Complete compiler log](evidence/phase-3c/compile-1.log).

Initial revocation transition tests: **50/50**, 30.92 seconds. Initial structural/ABI tests: **2/2**, 4.92 seconds. First complete run had **368 passing / 1 failing**: an earlier constructor source assertion still expected two exported circuits. It was deliberately updated to exactly three; all constructor privacy/ledger assertions were retained. [Original failed run](evidence/phase-3c/tests-first-full.json) preserves that evidence. This was a stale test expectation, not a compiler or contract semantic failure.

Final pre-resource run through `test:local`: **369/369 across 11 files**, exit 0, **51.04 seconds**. Full names, outcomes and per-case timings are in [tests.json](evidence/phase-3c/tests.json); human-readable output is in [tests-all.log](evidence/phase-3c/tests-all.log). All original 317 cases remain, plus 52 Phase 3C cases. The extra `--` correctly forwards JSON reporter flags through the nested npm script; direct Vitest was unnecessary.

| Focused file | Passing cases |
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

Expanded strict focused TypeScript passed with exit 0 and no diagnostics. Generated source-map warnings about unavailable original source paths remain; generated execution completed. The known global integration diagnostics in DeployRoute.tsx, scripts/deploy.ts and test/just-proof.test.ts remain deferred. No global typecheck was rerun or claimed passing in this phase, and those files were not changed.

Exact material commands (also machine-readable in [commands.json](evidence/phase-3c/commands.json)):

```bash
/usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' compact compile +0.31.1 --skip-zk contracts/just-proof.compact contracts/managed/just-proof > docs/development/evidence/phase-3c/compile-1.log 2>&1
npm run test:local -- -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts test/contract/v3b-register-credential.test.ts test/contract/v3b-public-surface.test.ts test/contract/v3c-revoke-credential.test.ts test/contract/v3c-public-surface.test.ts --reporter=default --reporter=json --outputFile=docs/development/evidence/phase-3c/tests.json > docs/development/evidence/phase-3c/tests-all.log 2>&1
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-*.test.ts test/contract/v2-constructor.test.ts test/contract/v3*.test.ts test/support/v3*.ts > docs/development/evidence/phase-3c/typecheck.log 2>&1
```

## Atomicity and reference evidence

[54 ledger snapshot pairs](evidence/phase-3c/snapshots.json) cover success setup/transitions and early/late rejections. Every rejection compares all nine ledger fields, complete encoded input state, caller-owned witness bytes and private-state input; every success checks exactly revocationRoot changes and input state/private state remain unchanged. The callback is invoked once on each attempted call, including malformed adapter paths. Snapshot evidence saves public synthetic ledger values and assertions, never private packages/canaries.

Ordinary setup executes actual generated registerIssuerV2 and registerCredentialV2 calls for two issuers and three credentials. Counter-boundary fixtures and authenticated malformed-control/root fixtures use explicitly synthetic runtime state overrides; they do not claim 65,536 real registrations. The zero-commitment fixture checks absence of an unapproved validation rule, not evidence of a realistic zero commitment preimage.

Coverage includes first/nonzero/multiple revocations, refreshed paths, capacity sentinels, all requested secret/record/control/nonce/credential/index/path failures, another issuer's valid secret, nonexistent credential, repeated/already-revoked positions, stale revocation paths, and all three 15/17-sibling adapter failures. Recursive snapshot checks prove structural freezing and detached byte arrays. Cross-tree and correct-other-index positive root controls exercise direction binding rather than relying on arbitrary corrupt bytes alone.

Separately assembled TypeScript descriptors agree with generated credential leaf, revoked leaf and root derivations. Both paths share Compact runtime hashing/serialization. This is cross-path agreement with a shared trust base, not independent cryptographic implementations.

## Public-surface gate

The actual installed runtime/ledger partitioning produced one guaranteed partition and no fallible partition. Generated source inspection agreed with the runtime query program. Exact structural traversal checked independently random ephemeral private atoms and all path siblings; unique synthetic indices 31337/23456 avoid confusing common public counters/selector values with private-index canaries.

| Location | Result |
|---|---|
| Lifecycle input/arguments | Empty value/alignment; no public arguments |
| Result/output | Exactly unit / empty value/alignment |
| Witness private transcript | Positive controls find secret, record atoms, nonce/ID/commitment, both indices and all path siblings |
| Public query | Exactly 21 operations: six `dup,idx,popeq` reads followed by `push,push,ins` root write |
| Read selectors | `[1,3,2,6,5,8]`: context, issuer count/root, credential count/root, revocation root; all dup slots zero |
| Guaranteed partition | Positive controls find final root; forbidden raw atoms absent |
| Fallible partition | Absent |
| Ledger | Exactly nine fields; only revocationRoot changes; no raw private additions |
| Effects | Unchanged empty asset/call effects; no nullifier operation, kernel address read, log or time query |

The sole new disclosure is `revocationRoot = disclose(newRoot)`, acknowledging the final high-entropy root for its public write. No reconstructed-current-root disclosure was required. Issuer secret/control/ID/index/path, nonce, credential ID/commitment/original leaf/index/path, revocation path and revoked leaf are absent from each inspected public location. Exact witness schema excludes statement fields/timestamps, openings, subject commitment and holder secret entirely. The expected public final root and actual private canary appearances are positively detected; absence is not the only evidence. [Durable public-surface findings](evidence/phase-3c/public-surface.json) contain public program/effects and counts/booleans only.

## Three-circuit resource attempt

The only authorized full attempt is distinct from the lost Phase 3B build. No synthetic worst-case probe or retry is used. Full keys remain under the fresh temporary output path, never promoted to managed assets. The monitor, exclusive attempt marker, compiler log and memory samples are written directly to the durable evidence directory while execution proceeds.

```bash
python3 docs/development/evidence/phase-3c/monitor.py
# monitored child:
RAYON_NUM_THREADS=2 XDG_CACHE_HOME=/home/oluwatobiss/.cache compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3c-three-circuits-20260915
```

[Monitor source](evidence/phase-3c/monitor.py) asserts the final source hash and passed pre-resource gate, requires a nonexistent output path, and creates an exclusive marker. It samples compiler and descendant RSS/HWM plus system memory approximately every 0.5 seconds. It sends SIGTERM below 768 MiB MemAvailable or 512 MiB free swap, and SIGKILL after five seconds. Graceful time termination is 1345 seconds with an independent 1350-second hard kill. Aggregate sampled RSS can count shared pages twice and miss between-sample peaks; child rusage is separately labelled and is not substituted for process-tree RSS.

The established compiler cache is reused. Only the built-in compiler may request at most one missing parameter from `midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`. New names/origins are monitored in compiler diagnostics and cache changes; no independent network packet capture is claimed. Parameter hashes are local fingerprints, not authenticated official checksums. [Pre-run memory/disk](evidence/phase-3c/pre-run.json), [full log](evidence/phase-3c/build.log), [memory samples](evidence/phase-3c/memory.jsonl), and final resource results accompany this report.

The attempt was safely terminated for memory pressure; the completed outcome and partial artifacts are recorded below. No key generation is proof generation, proof verification or ledger integration.

## Source and frozen-reference fingerprints

Final production SHA-256: `4010eed928402850684930b2adb921153690a410fd5a88fcf52bd02847e87974`. The constructor and registration circuit bodies are retained; both accepted registration text ZKIR files are byte-identical. [Managed artifact manifest](evidence/phase-3c/managed-artifacts.json) records all compiler-produced repository artifacts, sizes and hashes.

All frozen V1 references match the durable pre-phase baseline:

| File | SHA-256 |
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

The previous Phase 3B report body is preserved as a byte-identical prefix with only its acceptance addendum appended. Earlier reports/evidence, including historical-resource-record.json, remain unchanged. [Integrity comparison](evidence/phase-3c/integrity.json) is refreshed before completion and identifies every phase-only file, including ignored managed compiler output.

## Completed resource outcome — safe stop, not a successful build

The sole monitored compiler invocation ended with **compiler exit −15 (SIGTERM)** after **1055.003175732 seconds**. The monitor itself exited 0 after saving its result; that is **not compiler success**. There was no timeout or retry. At 1054.381 seconds, MemAvailable fell to **776132 KiB (757.94 MiB)**, below the approved 768 MiB threshold, and the monitor sent SIGTERM. The compiler exited before the five-second escalation interval. The monitor's final cleanup also sends best-effort SIGKILL to the process group; the final sample shows aggregate resident memory zero. The 1345/1350-second time limits were not reached.

Peak sampled aggregate compiler/descendant RSS was **4646684 KiB (4.43 GiB)**. At that sample, compact used 2636 KiB, compactc.bin 183696 KiB, and zkir **4460352 KiB**, with zkir HWM also 4460352 KiB. These are observed process-tree measurements, not the timeout wrapper. The recorded waited-child rusage value of 17336 KiB is inadequate as a compiler peak in this terminated run and must not be substituted. Maximum system swap use was 563204 KiB. There are **1935 complete samples**, with a maximum observed gap of 1.685 seconds despite the approximately 0.5-second nominal interval. Sampling limitations therefore remain explicit.

The system recovered to 2881552 KiB MemAvailable in the monitor's post-run reading. The safe-stop condition occurred before a compiler OOM diagnostic; no OOM failure is being inferred. These are aggregate three-circuit build measurements, not isolated revocation timing or a claim of product-acceptable performance.

[Machine-readable result](evidence/phase-3c/result.json), [resource analysis](evidence/phase-3c/resource-analysis.json), [complete memory samples](evidence/phase-3c/memory.jsonl), [exclusive attempt marker](evidence/phase-3c/attempt-started), and [monitor](evidence/phase-3c/monitor.py) are durable. The **complete compiler log** contains only:

```text
Compiling 3 circuits:
```

There was no compiler-reported new parameter or origin. All seven established cached parameter files retained the same sizes and SHA-256 hashes; no new cache file appeared. [Before](evidence/phase-3c/cache-before.json) and [after](evidence/phase-3c/cache-after.json) inventories preserve this evidence. No parameter download or independently authenticated checksum is claimed. There was no proof-server, wallet, ledger, Preview or Preprod activity.

### Partial full-build artifact inventory

These files were freshly inspected after termination. [Artifact manifest](evidence/phase-3c/artifact-manifest.json) records the final source hash and output path. The full-build `contract/index.js`, `contract/index.d.ts` and `contract/index.js.map` were **not emitted**. Repository-managed skip-build bindings remain available and separately inventoried; they must not be mistaken for completed full-build outputs.

| Artifact under fresh /tmp output | Bytes | SHA-256 |
|---|---:|---|
| compiler/contract-info.json | 14470 | `ce7cdf4f44ae441be9283e15bc91c0101e1ecbb554354b3e3eefb2601fca7a1f` |
| keys/registerCredentialV2.prover | 76642841 | `1722f6f9cf0e818f414639fb179b9a3d7756242102e9fbe1367b5c167b5e263e` |
| keys/registerCredentialV2.verifier | 2119 | `c0abaaf254564c21488f90784d8b29c8b106ae2e273fde89fa6fa392c4610d22` |
| keys/registerIssuerV2.prover | 76490158 | `9c136a8ce811aedd13ad2e364005b1d3454f76fd7e29cd6edaff5b5a99dcca28` |
| keys/registerIssuerV2.verifier | 2119 | `b6c78daa6b3964912d9cbf2bd783365de7c18521ca26efffbee5b37e410e1a9a` |
| keys/revokeCredentialV2.prover | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| keys/revokeCredentialV2.verifier | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| zkir/registerCredentialV2.bzkir | 5613 | `26015eecbe8847ec442d288b3d252189892772e3af6168aa30b7a6b8ab4eedba` |
| zkir/registerCredentialV2.zkir | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| zkir/registerIssuerV2.bzkir | 3056 | `be21a00eda843b8ec88fb8e19f9a9645fe81659ed9354f8515d651991f3bab56` |
| zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| zkir/revokeCredentialV2.bzkir | 6209 | `98eedb891db4d2b3220c1306078033f8079cc92b8212e24c0e84bebc59d0d573` |
| zkir/revokeCredentialV2.zkir | 71809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

Both revocation key files are zero-byte placeholders. No usable revocation key pair resulted, so the three-circuit resource gate is **blocked / incomplete**.

The issuer and credential key pairs are nonzero. Their verifier keys both passed installed ledger-v8 `ContractOperation` serialization/deserialization round trips. The empty revocation verifier key could not undergo that format check. [Exact check source](evidence/phase-3c/check-keys.mjs) and [results/comparisons](evidence/phase-3c/key-check.json) are retained; command:

```bash
node docs/development/evidence/phase-3c/check-keys.mjs
```

All eight issuer/credential circuit-local artifacts (each pair of keys and text/binary ZKIR) match their accepted issuer or historical credential fingerprints. This is fresh inspection of partial Phase 3C outputs, not recovery or retroactive verification of lost Phase 3B files. The Phase 3B historical-resource-record.json remains unchanged. Module-wide compiler metadata changed for the third endpoint; managed bindings and source map changed as expected. No unexpected circuit-local difference was found.

No keys were copied into repository-managed/deployment assets. No actual proof was generated, no cryptographic proof verification was attempted, and no ledger execution occurred. Verifier-key format round trips do not substitute for those validation layers. Text ZKIR size (revocation 71809 bytes) and key/parameter sizes are not circuit row counts or proving-performance evidence.

## Requirement status and review stop

- **R24–R27**, including exact same-index membership (R25) and credential-bound irreversible empty-to-revoked behavior (R26): implemented and passing scoped compiled simulation/atomicity/schema tests.
- **R40–R43:** applicable revocation privacy, witness, state-preservation and type checks pass; qualification and full lifecycle obligations remain open.
- **R58:** resolved by the existing reviewed D5 clarification; no forced raw-control disclosure was added.
- **R61:** remains open for the complete protocol/release, with this actual three-circuit resource attempt safely terminated and revocation keys unavailable. No hash/depth/schema/authorization/privacy requirement was weakened. No retry is authorized or performed.

The accepted untrusted coordinator availability model remains an operational dependency for future path refresh and durable recovery; no backend is implemented here. Conformance retains its shared Compact-runtime hashing/serialization trust base. Known global integration diagnostics remain deferred. Complete V2 documents remain draft.

The next action is user review of this Phase 3C result and resource limitation. No qualification circuit or other phase begins automatically.

## Repository-managed generated artifacts

Generated only by the successful pinned skip build; these are not full-build key assets:

| File | Bytes | SHA-256 |
|---|---:|---|
| contracts/managed/just-proof/compiler/contract-info.json | 14470 | `ce7cdf4f44ae441be9283e15bc91c0101e1ecbb554354b3e3eefb2601fca7a1f` |
| contracts/managed/just-proof/contract/index.d.ts | 11812 | `3b42e8779489892dbca466bcafd5637c4e99be6301f666b7a6a0ac15d8a82f98` |
| contracts/managed/just-proof/contract/index.js | 157854 | `bcea498b4be47b28bcade3a2f41298f77c519f882c230f0266d2d8e62b4da934` |
| contracts/managed/just-proof/contract/index.js.map | 8339 | `a4c8b67be104dad7f17464985bfbf97d2ca1f40300a9f3af1cd60b9b4671530a` |
| contracts/managed/just-proof/zkir/registerCredentialV2.zkir | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| contracts/managed/just-proof/zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| contracts/managed/just-proof/zkir/revokeCredentialV2.zkir | 71809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

## Evidence-durability hardening — 2026-09-15

Before this pass, `git check-ignore -v` confirmed `.gitignore:17:*.log` ignored all four report-required logs. The earlier “durable” description meant files had been saved in the workspace; the exact inventory omitted them and did not ensure ordinary commit inclusion. This pass repairs that discrepancy without rewriting or regenerating historical output.

`.gitignore` now contains four root-anchored exceptions, only for the files below. Logs elsewhere, including optional initial-run scratch logs, remain ignored. `capture-integrity.py` includes `.gitignore` in the expressly authorized Phase 3C change set, explicitly inventories the four required logs, and fails if any report-linked evidence is missing or ignored. It validates JSON/JSONL, parses Python source, and syntax-checks the JavaScript evidence helper without executing it. Linked text evidence must decode as UTF-8. These checks and log fingerprints are saved in refreshed `integrity.json`.

| Unchanged historical log | Bytes | SHA-256 |
|---|---:|---|
| [build.log](evidence/phase-3c/build.log) | 22 | `9edaf86c4c3c3c2cbe1fe7d1544aea59244163482ace630bab6f9964f7e2077a` |
| [compile-1.log](evidence/phase-3c/compile-1.log) | 38 | `2a9adb867ee12a6274c46348208edcaa847b253c5e8a21bf2dc448e149fd7987` |
| [tests-all.log](evidence/phase-3c/tests-all.log) | 10906 | `dd5ff7731a190899f4c1862054eec5b180937bb3214d931cef376024aa35dd2e` |
| [typecheck.log](evidence/phase-3c/typecheck.log) | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

The empty typecheck log is intentional: the accepted focused command emitted no diagnostics; its recorded exit status is in the pre-resource gate/report, not inferred from empty output alone. Every other report-linked evidence file exists and passed the applicable parse/syntax check, including result.json, resource-analysis.json, snapshots.json, tests-first-full.json and tests.json. The complete 1935-line memory stream parses as JSONL.

Only `.gitignore`, the integrity-capture helper, integrity.json and this report were edited during hardening. The four log artifacts are now eligible for an ordinary commit, but nothing was staged or committed. No build, test suite, key-generation attempt, download, package operation or network/proof/wallet/deployment work was rerun. Their byte sizes and hashes match the pre-hardening files.

Substantive results are unchanged: 369/369 tests and focused TypeScript passed; the one full compiler attempt ended with −15 at the approved memory floor, not success; revocation prover/verifier files are unusable zero-byte placeholders; no keys are promoted. R61 remains open. The resource limitation does not invalidate the accepted Phase 3C source/test checkpoint. No Phase 3D work begins.

## Exact Phase 3C-only inventory

Derived from the durable pre-phase content-hash baseline, including ignored managed output and the four explicitly retained historical logs. The narrowly scoped `.gitignore` change is authorized by the evidence-hardening review. Existing source changes implement the endpoint and schema; earlier test/support changes add the required unused-callback guards and exact three-endpoint expectations. New revocation support/tests implement synthetic setup, atomicity and structural checks. The four V2 documents record implementation/status only; the Phase 3B report receives only its dated acceptance addendum. Evidence files retain commands, baselines, results, diagnostics, measurements and checking source. No frozen V1, provider, frontend, deployment, package, CI, Netlify or network configuration file appears in the changed inventory.

```text
.gitignore
contracts/just-proof.compact
contracts/managed/just-proof/compiler/contract-info.json
contracts/managed/just-proof/contract/index.d.ts
contracts/managed/just-proof/contract/index.js
contracts/managed/just-proof/contract/index.js.map
contracts/managed/just-proof/zkir/revokeCredentialV2.zkir
docs/development/evidence/phase-3c/artifact-manifest.json
docs/development/evidence/phase-3c/attempt-started
docs/development/evidence/phase-3c/baseline.json
docs/development/evidence/phase-3c/build.log
docs/development/evidence/phase-3c/cache-after.json
docs/development/evidence/phase-3c/cache-before.json
docs/development/evidence/phase-3c/capture-integrity.py
docs/development/evidence/phase-3c/check-keys.mjs
docs/development/evidence/phase-3c/commands.json
docs/development/evidence/phase-3c/compile-1.log
docs/development/evidence/phase-3c/environment.json
docs/development/evidence/phase-3c/gate.json
docs/development/evidence/phase-3c/integrity.json
docs/development/evidence/phase-3c/key-check.json
docs/development/evidence/phase-3c/managed-artifacts.json
docs/development/evidence/phase-3c/memory.jsonl
docs/development/evidence/phase-3c/monitor.py
docs/development/evidence/phase-3c/pre-run.json
docs/development/evidence/phase-3c/public-surface.json
docs/development/evidence/phase-3c/resource-analysis.json
docs/development/evidence/phase-3c/result.json
docs/development/evidence/phase-3c/snapshots.json
docs/development/evidence/phase-3c/tests-all.log
docs/development/evidence/phase-3c/tests-first-full.json
docs/development/evidence/phase-3c/tests.json
docs/development/evidence/phase-3c/typecheck.log
docs/development/phase-3b-register-credential-report.md
docs/development/phase-3c-revoke-credential-report.md
docs/protocol/v2/04-revocation.md
docs/protocol/v2/07-witnesses-and-disclosures.md
docs/protocol/v2/10-specification.md
docs/protocol/v2/requirements.md
test/contract/v2-constructor.test.ts
test/contract/v3a-register-issuer.test.ts
test/contract/v3b-public-surface.test.ts
test/contract/v3c-public-surface.test.ts
test/contract/v3c-revoke-credential.test.ts
test/support/v3a-register-issuer.ts
test/support/v3b-register-credential.ts
test/support/v3c-revoke-credential.ts
```

Final `git status --short` (ignored compiler files are included above, not in this Git output):

```text
 M .gitignore
 M contracts/just-proof.compact
 M docs/development/phase-3b-register-credential-report.md
 M docs/protocol/v2/04-revocation.md
 M docs/protocol/v2/07-witnesses-and-disclosures.md
 M docs/protocol/v2/10-specification.md
 M docs/protocol/v2/requirements.md
 M test/contract/v2-constructor.test.ts
 M test/contract/v3a-register-issuer.test.ts
 M test/contract/v3b-public-surface.test.ts
 M test/support/v3a-register-issuer.ts
 M test/support/v3b-register-credential.ts
?? docs/development/evidence/phase-3c/
?? docs/development/phase-3c-revoke-credential-report.md
?? test/contract/v3c-public-surface.test.ts
?? test/contract/v3c-revoke-credential.test.ts
?? test/support/v3c-revoke-credential.ts
```

Final `git diff --check` passed. All 12 frozen V1 references, earlier evidence and the original registration circuit bodies remain unchanged against the durable baseline. No staged files, commit, push, publish, dependency installation, real proof, wallet operation or deployment occurred. The full resource attempt was not repeated. **Stop for user review.**

## Phase 3C acceptance — 2026-09-15

Accepted as a development checkpoint for source, compiled simulation, atomicity, public-surface evidence and accurate safe-stop reporting, including the evidence-hardening repair. Compiler exit −15 and unusable revocation key placeholders do not establish full key generation or proof/ledger/release readiness. R61 remains open. Phase 3D permits qualification source and local simulation only; no full key generation or parameter retrieval is authorized.
