# Phase 2B resource gate report

**Date:** 2026-09-14. **Status:** Resource gate blocked / feasibility indeterminate; stopped for user review. JustProof V1 / Protocol V2 remains draft.

The single authorized new full build retrieved `bls_midnight_2p19`, but was stopped safely under rapidly increasing memory pressure. No completed prover/verifier keys exist. **247/247 focused tests passed; focused TypeScript check passed.** No lifecycle implementation, real proof, proof-server request, wallet, ledger integration or deployment occurred.

## Exact repository files changed in Phase 2B

- `docs/protocol/v2/06-merkle-tree.md`: dated accepted coordinator model and development root approval.
- `docs/protocol/v2/07-witnesses-and-disclosures.md`: coordinator forbidden inputs, participant custody, untrusted-path boundary.
- `docs/protocol/v2/10-specification.md`: accepted availability assumption, no backend implementation in Phase 2B or Phase 3.
- `docs/protocol/v2/requirements.md`: dated R07/R12/R40/R41/R56–R59/R61 status updates.
- `docs/development/phase-2-primitives-constructor-report.md`: short dated link/status addendum only; original evidence preserved.
- `docs/development/phase-2b-resource-gate-report.md`: this report.

The pre-existing modified AGENTS, contract, and untracked Phase 1/2 work were preserved. No production backend was implemented. The coordinator is untrusted for authorization; confidential operational metadata, durable backup/recovery, and participant private custody remain required.

## Pre-run environment and pinned versions

Commands: `uname -r`, `pwd`, `compact --version`, `compact compile +0.31.1 --version`, `compact compile +0.31.1 --language-version`, `compact compile +0.31.1 --runtime-version`, `node --version`, `npm --version`, `sha256sum test/fixtures/phase2-resource.compact`, `free -m`, `df -h /tmp`.

| Item | Observed value |
|---|---|
| WSL Linux | 5.15.146.1-microsoft-standard-WSL2 |
| Repository | /home/oluwatobiss/projects/midnight/risein/just-proof |
| Compact developer CLI | 0.5.2 |
| Explicit compiler/toolchain | 0.31.1 |
| Language | 0.23.0 |
| Runtime | 0.16.0 |
| Node / npm | v24.18.0 / 11.16.0 |
| RAM before run | 7862 MiB total, 4406 MiB available |
| Swap before run | 2048 MiB total, 6 MiB used, 2041 MiB free |
| /tmp disk | 1007 GiB total, 20 GiB used, 937 GiB available |

No toolchain/package installation or version change occurred. This phase did not run unrelated remote version checks.

## Unchanged probe and invocation

Source: [phase2-resource.compact](../../test/fixtures/phase2-resource.compact).
SHA-256: `86006c85bd6ad6f9f5c5dfcad84ee3fc3b6dbfa08a3aa66f7cad67c099c9b522`.

The retained source matches the Phase 2 source formulation and was not edited. The original Phase 2 report did not record a raw source-file hash; this is the newly recorded source hash, not a fabricated earlier measurement. The regenerated text ZKIR and binary ZKIR match the earlier reported SHA-256 values exactly, corroborating unchanged compiled circuit content. Included primitive sources also remained unchanged.

Exactly one new full compiler invocation, with a fresh output path:
```bash
test ! -e /tmp/justproof-phase2/resource-2b-20260914 && env XDG_CACHE_HOME=/home/oluwatobiss/.cache RAYON_NUM_THREADS=2 /usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' timeout --signal=TERM --kill-after=10s 900 compact compile +0.31.1 test/fixtures/phase2-resource.compact /tmp/justproof-phase2/resource-2b-20260914 > /tmp/justproof-phase2/resource-2b.log 2>&1
```

The invocation was authorized outside the restricted sandbox to allow the compiler's built-in fetch and established WSL cache write. No standalone download command, invented URL, alternate registry, package installation or second build was used.

Expected built-in requested endpoint, identified by the same pinned probe's preserved Phase 2 diagnostic:
`https://midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com/bls_midnight_2p19`.
Host: `midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`.
Parameter: `bls_midnight_2p19`.

The successful fetch path did not print its HTTP URL in this invocation. Thus this report identifies the expected host from pinned prior diagnostic evidence, not an independently captured network trace or enforced origin allowlist. No other origin/parameter request was reported, and only the authorized parameter was newly observed in cache. Redirect behavior was not independently observed.

## Parameter/cache evidence

Established cache: `/home/oluwatobiss/.cache/midnight/zk-params`.
New file: `bls_midnight_2p19`.
Size: **100663684 bytes**.
Local SHA-256: `8e8dc15c4362f05c912f1e770559a3945db3e58a374def416ed5d3e65ad5b10e`.

This is a locally recorded fingerprint. No authoritative published checksum or authenticated checksum-validation result was supplied by the observed tooling. Successful retrieval and subsequent processing do not establish independent cryptographic authenticity.

All five pre-existing cached parameters (2p6, 2p7, 2p9, 2p13, 2p17) retained their pre-run sizes and SHA-256 values. No cache file was deleted or manually overwritten. The parameter and probe artifacts remain local and were not staged, committed or published.

## Resource outcome and exact diagnostic

**Shell exit: 143 (SIGTERM). Elapsed: 564.81 seconds. Timeout: no; manually stopped before 900 seconds. Compiler success: not achieved.**

Memory monitoring showed available RAM falling through 2972, 2074, 1148, 892 and 615 MiB, with swap rising to 521 MiB at the stop decision. The stop was preventive: neither an OOM kill nor proven resource exhaustion is claimed. By the post-stop sample, RAM available recovered to 5197 MiB and swap use was 1037 MiB.

Exact stop command:
```bash
pkill -TERM -f '^timeout --signal=TERM --kill-after=10s 900 compact compile \+0\.31\.1 test/fixtures/phase2-resource\.compact /tmp/justproof-phase2/resource-2b-20260914$'
```
Stop command exit: 0. No retry occurred.

Complete build log:
```text
Compiling 1 circuits:
Command terminated by signal 15
elapsed=564.81 exit=0 maxrss_kib=3808
```

**Measurement limitation:** GNU time's `exit=0` field is not a successful compiler exit: the same log reports signal termination and the execution tool returned 143. Likewise `maxrss_kib=3808` is the interrupted timeout-wrapper measurement, not a valid peak for its compiler/key-generation descendants. An accurate compiler peak RSS was not recovered; global memory samples are not a substitute. There is no completed key-generation timing or product-performance acceptance result. Fetch, compilation and partial key generation occurred in one elapsed interval and were not independently timed.

## Every generated resource artifact

Output base: `/tmp/justproof-phase2/resource-2b-20260914/`.

| Relative path | Bytes | SHA-256 |
|---|---:|---|
| compiler/contract-info.json | 4957 | dba3c4593609084babaf362460dde935d400a3aa3432388bb2bce2582778fd7c |
| keys/resourceProbe.prover | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| keys/resourceProbe.verifier | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| zkir/resourceProbe.bzkir | 6163 | 334e392e716a9dfe7b01d00b8655c70c74780715ae1f9a3c5c2e36ab022d0a5b |
| zkir/resourceProbe.zkir | 70672 | 9274ee2a6e2069d02c1e5a8f709e21352477fb3454ea97776e8a061bd29cb7a0 |

No generated JavaScript/bindings completed in this output directory. Empty keys are unusable. Parameter names, artifact sizes and ZKIR sizes are not exact row counts. No generated repository artifact was modified or hand-edited.

## Focused validation after the resource attempt

```bash
npm run test:local -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts
```

Exit **0**, six files passed, **247 passed / 0 failed**, Vitest duration **9.23 seconds**.

| File | Passed |
|---|---:|
| v2-domains.test.ts | 19 |
| v2-derivations.test.ts | 122 |
| v2-merkle.test.ts | 81 |
| v2-vectors.test.ts | 1 |
| v2-generated-types.test.ts | 18 |
| v2-constructor.test.ts | 6 |

Coverage includes domains, typed derivation/opening/order changes, all empty-tree levels and boundary paths, generated types, nine-field constructor initialization and diagnostic secret knowledge. These are conformance checks and **compiled contract-logic simulation**, not proof generation/verification or ledger integration. Existing generated sourcemap missing-source warnings remain; no files were edited to silence them.

```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts
```

Exit **0**, no diagnostics. Global application typechecking was not rerun; previously reported placeholder integration errors remain outside this phase. Unfiltered deployment-bearing `test:local`, Preview and Preprod commands were not run.

Temporary evidence: `/tmp/justproof-phase2/phase2b-baseline.json`, `resource-2b.log`, `phase2b-evidence.json`, `phase2b-tests.log`, `phase2b-typecheck.log`. Durable essential results are reproduced here.

## Review gates and remaining blockers

- R07/R59: all three Phase 2 root values approved as implementation constants for development, not release freeze.
- R12: user independently confirmed all 18 raw SHA-256 labels.
- R57: minimum coordinator assumption accepted. Production deployment/access/backup/recovery implementation remains future work; no backend implementation in Phase 3.
- R61: **blocked / indeterminate** despite successful parameter retrieval. This attempt produced no completed keys or valid full compiler peak-RSS result. No weakening or further attempt is authorized.
- R58/D5: future registerIssuerV2 generated-artifact observability gate remains unresolved.
- Explicit Phase 3 authorization is still required. No lifecycle circuits were implemented.
- Separately assembled conformance paths share Compact runtime hashing/serialization; the shared trust base remains. No independent cryptographic implementation is claimed.
- Full proof/transcript verification, local proving and actual ledger/deployment behavior remain untested here. Performance acceptability remains the user's decision.

## Preservation and final repository state

Phase 2B baseline hashes confirm unchanged frozen V1 documents and unchanged contract, primitive/test sources, package/configuration files and existing user work. Repository generated artifacts were not regenerated in this phase. No provider, frontend, deployment workflow, package script/dependency, CI, Netlify or Preview/Preprod configuration changed. No stage, commit, push, publish, real proof or deployment occurred. The only network-bearing operation requested was the authorized built-in parameter retrieval.

Final `git status --short`:
```text
 M AGENTS.md
 M contracts/just-proof.compact
?? contracts/protocol-v2/
?? docs/development/
?? docs/protocol/v2/
?? test/conformance/
?? test/contract/
?? test/fixtures/
?? test/support/
```

`git diff --stat` (tracked files only; these differences predate Phase 2B):
```text
 AGENTS.md                    | 18 ++++++++++++++++++
 contracts/just-proof.compact | 35 +++++++++++++++++++++++++++++++----
 2 files changed, 49 insertions(+), 4 deletions(-)
```

Untracked directories make git's summary insufficient for phase attribution; the six-file list above is based on a separate pre-phase content-hash baseline. Work stops here for user review.

