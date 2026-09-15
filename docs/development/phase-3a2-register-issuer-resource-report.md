# Phase 3A2 — registerIssuerV2 resource completion

**Date: 2026-09-14. Draft — User Review Required.**
This pass records the reviewed D5 clarification, one full key-generation attempt for the unchanged issuer-registration contract, and subsequent focused local validation. It does not authorize Phase 3B or freeze Protocol V2.

## Reviewed D5 decision

R58/D5 is resolved **by specification clarification**, not by implementing raw chain exposure. The commitment is caller-supplied, intentionally non-secret protocol data. The canonical issuer leaf in the public Set and issuer root is the authoritative on-chain representation. An authority, issuer or the accepted untrusted coordinator may publish/retain the corresponding issuer record off-chain. Consumers must recompute its leaf and authenticate membership/path against current authoritative contract state. Publication is availability, never authorization. Later issuer-controlled transitions must prove secret knowledge against the commitment in the authenticated record.

The Phase 3A investigation correctly found the former raw-exposure requirement unsupported. Its report body, measurements and evidence were preserved, with only a dated addendum. No Compact workaround or production code change was made.

The existing structural test now names/enforces the reviewed boundary: raw argument/generated private input present; raw commitment absent from witness outputs and public chain material; canonical leaf/root positively present in the guaranteed program; authority secret absent publicly. Exact-value structural traversal, real runtime partitioning and positive controls remain. Its temporary evidence flags now distinguish `rawChainExposure:false` from `reviewedBoundarySatisfied:true`. Historical Phase 3A JSON evidence was not replaced.

## Environment and pre-run integrity

The required production SHA-256 matched before any implementation-dependent work and again immediately before launching:
`f27b2a13e71c68a85f70e6083b2457c3f4273475a15f6e061c39c9ba81e7a6db`.

All commands ran in WSL at `/home/oluwatobiss/projects/midnight/risein/just-proof`.

| Item | Observed |
|---|---|
| Linux | 5.15.146.1-microsoft-standard-WSL2 |
| Compact developer CLI | 0.5.2 |
| Explicit compiler/toolchain | 0.31.1 |
| Language | 0.23.0 |
| Runtime | 0.16.0 |
| Node / npm | v24.18.0 / 11.16.0 |
| Initial RAM | 7862 MiB total, 4790 MiB available |
| RAM immediately before launch | 4788 MiB available |
| Swap | 2048 MiB total, unused |
| /tmp filesystem | 1007 GiB total, 937 GiB available |
| Established parameter cache | /home/oluwatobiss/.cache/midnight/zk-params |

Version commands: `uname -r`, `compact --version`, `compact compile +0.31.1 --version`, `compact compile +0.31.1 --language-version`, `compact compile +0.31.1 --runtime-version`, `node --version`, `npm --version`. Resource checks used `free -m` and `df -h /tmp`. Repository status and all existing tracked/untracked source/document files plus ignored managed artifacts were hashed into a pre-phase baseline. Cache files were separately fingerprinted. No dependency or toolchain change occurred.

## Exact single full invocation and monitoring

Launcher:
```bash
python3 /tmp/justproof-phase3a2/monitor.py
```

The monitor invokes exactly once, through a subprocess argument array:
```bash
RAYON_NUM_THREADS=2 XDG_CACHE_HOME=/home/oluwatobiss/.cache compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3a2/register-issuer-full-20260914
```

The output path was asserted nonexistent before launch. An exclusively created `attempt-started` marker prevents accidental reruns. Production source hash is asserted by the launcher. Compiler stdout/stderr go to `/tmp/justproof-phase3a2/build.log`. Repository-managed artifacts are not the output target.

The compiler starts in its own process group. Every approximately 0.5 seconds, the monitor reads process RSS/high-water RSS from /proc for the compiler group and recursively discovered descendants, and samples system MemAvailable/SwapFree. It logs process names/PIDs and memory only, not environment secrets or arbitrary process arguments. It observes `compact`, `compactc.bin`, and `zkir`, not merely a timeout wrapper.

Safety rules set before launch: SIGTERM if MemAvailable <768 MiB or SwapFree <512 MiB; SIGKILL after five seconds if needed. Time limit: graceful termination at 895 seconds, with an independent hard SIGKILL timer at 900 seconds. An unexpected reported origin or more than one missing parameter also triggers termination. The script performs no download itself.

Memory terminology: peak sampled aggregate RSS sums the observed compiler/descendant resident sets. This includes shared pages more than once and can miss sub-sample peaks; it is **not** exact unique physical memory or an exact continuous-time peak. Per-process kernel high-water RSS and waited-child maximum RSS are separate observations, not added together as an aggregate peak. System available-memory and swap samples support the safety decision. Elapsed time is monotonic launch-to-reaping/monitor completion wall time; polling can add up to roughly one sample interval. These limitations are explicit rather than substituting wrapper RSS.

## Cache and parameter source

The sole newly observed cache file is `bls_midnight_2p18` (50,332,036 bytes), retrieved by the pinned compiler during this invocation. Local SHA-256:
`e8436dc5d8b598f169c127c745135d889744007e6d384ff126df8d1332522f86`.

Expected compiler-managed source host:
`midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`.
The host is established by the pinned compiler's earlier diagnostic, retained in Phase 2/2B evidence. The successful fetch here did not print its URL; there is no independent HTTP/redirect trace or network-origin allowlist claim. No other origin or parameter was reported/observed. This report distinguishes expected-source provenance from direct packet observation.

No standalone downloader, manual URL, mirror, alternate registry or parameter substitution was used. Existing `bls_midnight_2p19` remains in the established cache. All cache hashes here are local fingerprints, not independently authenticated official checksums.

## Scope and interpretation

Production Compact and repository-managed generated artifacts remain unchanged. The exact constructor/one-endpoint ABI, two witness callbacks, ordered registration witness fields, nine ledger fields, unit return and authority-only/no-PoP semantics are preserved. Success changes only issuerRoot, nextIssuerIndex and registeredIssuerLeaves; tested failures preserve all nine fields.

The 37,980-byte registerIssuer text ZKIR is smaller than the prior 70,672-byte synthetic text ZKIR. Neither byte size is a row count or a performance guarantee. The synthetic probe was not rerun.

R58 is resolved by reviewed clarification. R61 remains open for the whole four-circuit protocol and later larger circuits regardless of this local attempt's outcome. Compiled simulation, key generation, proof generation, proof verification and network execution are distinct layers; only the measured layers below are claimed.

No other lifecycle circuit, coordinator, frontend, provider, wallet, deployment, CI, Netlify, Preview or Preprod work occurred. No packages were installed/upgraded; no proof, ledger call, stage, commit, push, publication or deployment occurred. Work stops for user review.


## Completed resource result

**Compiler exit 0. Successful local registerIssuerV2 key generation.** One invocation only; no timeout, memory stop, failure or retry. All eight expected generated files completed, with nonzero prover/verifier keys. No partial or zero-byte files remain in the output directory.

| Measurement | Result |
|---|---:|
| Monotonic elapsed seconds | 321.499274561 |
| Peak sampled aggregate compiler/descendant RSS, KiB | 2584768 |
| Waited-child maximum RSS, KiB (not aggregate) | 2387536 |
| Minimum system MemAvailable, KiB | 2343040 |
| Maximum system swap used, KiB | 6960 |
| Samples | 591 |
| Largest observed sample gap, seconds | 0.917 |
| Peak aggregate sample time, seconds | 194.562 |

Peak sampled aggregate RSS is approximately 2.47 GiB. At that peak, compact RSS was 3632 KiB, compactc.bin 193600 KiB and zkir 2387536 KiB. This directly captures key-generation descendants. Neither safety threshold was reached.

Complete compiler stdout/stderr:
```text
Compiling 1 circuits:
```
The separate monitor result records compiler exit 0 and memory/timing; an empty diagnostic stream alone was not used as success evidence.

The 2119-byte verifier key was assigned to the installed Compact runtime's ContractOperation, serialized/deserialized, and its bytes compared exactly; round trip passed. This tests the runtime's verifier-key format acceptance without contacting a ledger. The prover key was generated to completion by the successful pinned compiler and is nonzero; actual proof-server consumption/proof generation was not tested. These are completed key-generation/format checks, not proof verification or deployment acceptance.

Runtime key check used `node --input-type=module` with:
```javascript
const key = readFileSync('/tmp/justproof-phase3a2/register-issuer-full-20260914/keys/registerIssuerV2.verifier');
const op = new rt.ContractOperation();
op.verifierKey = key;
const restored = rt.ContractOperation.deserialize(op.serialize());
if (!Buffer.from(restored.verifierKey).equals(key)) throw new Error('verifier key round trip mismatch');
```
Imports were node:fs and @midnight-ntwrk/compact-runtime. Exit 0. No proving operation was invoked.

## Every generated artifact

Base: `/tmp/justproof-phase3a2/register-issuer-full-20260914/`.

| Relative file | Bytes | SHA-256 |
|---|---:|---|
| compiler/contract-info.json | 3411 | `92d3cae646e709824faa5cfc00cc045766d5c343f7a4c8faccd31cfbd1ebbdcb` |
| contract/index.d.ts | 9455 | `5ba30f01f19a6fd4661e44bf442d8cb5941076925dce1e161217de9aa7605561` |
| contract/index.js | 82685 | `c5166146f78904abe31c345c515d94ca56e77ca5d3e35d64724b54461a4433cc` |
| contract/index.js.map | 4339 | `43e88a2b80bde1678441f9955f88340f5d1cf2ef8b4c78c451e16bc0bfa349ca` |
| keys/registerIssuerV2.prover | 76490158 | `9c136a8ce811aedd13ad2e364005b1d3454f76fd7e29cd6edaff5b5a99dcca28` |
| keys/registerIssuerV2.verifier | 2119 | `b6c78daa6b3964912d9cbf2bd783365de7c18521ca26efffbee5b37e410e1a9a` |
| zkir/registerIssuerV2.bzkir | 3056 | `be21a00eda843b8ec88fb8e19f9a9645fe81659ed9354f8515d651991f3bab56` |
| zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |

Generated JavaScript, declarations, metadata and text ZKIR match the repository-managed Phase 3A files byte-for-byte. The source map differs because this build uses a different output directory. The full keys and binary ZKIR remain in /tmp; they were not copied over repository-managed assets, staged or published.

All six pre-existing parameter files retained their byte hashes. The only new parameter is the authorized compiler-managed 2p18 file. No manual key/parameter modification occurred.

## Post-attempt validation

```bash
npm run test:local -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts
```

Exit **0**; **7 files, 268 passed, 0 failed**, duration **11.00 seconds**. Per-file counts remain 19 domains, 122 derivations, 81 Merkle, 1 vectors, 18 generated types, 6 constructor and 21 issuer-registration tests. Existing generated sourcemap warnings remain non-failing.

The updated D5 test is named **D5 reviewed boundary keeps raw input private and exposes canonical leaf/root without secret leakage**. Its assertions retain real partitioned-transcript inspection and positive controls. No public raw-commitment implementation is claimed.

```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/support/v3a-register-issuer.ts test/contract/v3a-register-issuer.test.ts
```

Exit **0**, no diagnostics. `git diff --check` exited **0**. The unfiltered deployment-bearing suite and global application typecheck were not run.

Contract SHA-256 remained exactly the approved value. Runtime/metadata checks and the retained tests reconfirmed:

- Sole lifecycle endpoint: `registerIssuerV2(issuerControlCommitment: Bytes<32>): []`.
- Constructor callback unchanged; registration callback supplies only authority secret and insertion path, in the approved order, with exactly 16 siblings and no independent directions.
- Exactly nine ledger fields, exactly the three approved success mutations, exact unit output and unchanged state after each tested early/late failure.
- Authority-only registration without issuer-secret/PoP dependency.
- Twenty-one complete before/after ledger snapshot pairs from the retained tests; success/failure conditions remain enforced.
- All twelve frozen V1 files match the earlier stored Phase 3A hashes.
- Fourteen existing production/test managed files match the pre-phase hashes; no managed file was overwritten.
- The entire old Phase 3A report body matches its pre-phase hash after removing only the new appended addendum. Its evidence JSON files are unchanged.
- No excluded source/configuration/package file changed relative to the pre-phase baseline.

Validation layers: compiled simulation/conformance **passed**; actual local key generation **completed**; verifier-key format round trip **passed**; proof generation **not run**; cryptographic proof verification **not run**; ledger/network execution **not run**. Compiler-managed parameter fetching is the sole authorized network-bearing build behavior.

## Exact phase-only files

Existing files modified:

- `docs/protocol/v2/00-decisions.md` — reviewed D5 decision, preserving prior decisions.
- `docs/protocol/v2/02-issuer-registry.md` — canonical public representation and authenticated off-chain records.
- `docs/protocol/v2/07-witnesses-and-disclosures.md` — clarified non-secret/private-input distinction; historical finding preserved.
- `docs/protocol/v2/10-specification.md` — unchanged interface under reviewed semantics.
- `docs/protocol/v2/requirements.md` — R58 resolved by clarification; local key generation measured; R61 remains open.
- `docs/development/phase-3a-register-issuer-report.md` — short dated addendum only.
- `test/contract/v3a-register-issuer.test.ts` — renamed D5 case and clarified evidence expectation flags; same 268 total tests.

New files:

- `docs/development/phase-3a2-register-issuer-resource-report.md` — this report.
- `docs/development/evidence/phase-3a2/monitor.py` — exact monitor source used for the one invocation.
- `docs/development/evidence/phase-3a2/memory.jsonl` — all 591 non-secret memory samples.
- `docs/development/evidence/phase-3a2/resource-evidence.json` — result, artifact hashes, peak sample, cache/integrity and validation summary.

The parameter and full build artifacts are local files outside the repository, documented above, not phase source edits. The production contract was not changed.

## Evidence fingerprints

- `docs/development/evidence/phase-3a2/memory.jsonl`: 280814 bytes, SHA-256 `344db641b1ebd08e076421206bb07bb69bf909f6f82c3c9c7247c48b0c9cd241`.
- `docs/development/evidence/phase-3a2/monitor.py`: 5022 bytes, SHA-256 `d27f1d813198eba4288e8aea7252e9748e071d29723b38a9ecf292a142981df1`.
- `docs/development/evidence/phase-3a2/resource-evidence.json`: 5406 bytes, SHA-256 `cf18d6093fad9cb507ebcb584b3cf65f80ee7cd0288d98e49d4895ac59166b92`.

## Final repository status

`git status --short`:
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

This includes pre-existing user/earlier-phase work. The phase-only list is derived from the separate pre-phase content-hash baseline, not from treating every untracked directory as new work. Nothing was staged.

**Review stop:** R58 resolved by approved clarification; the local registerIssuerV2 key-generation question is closed at the stated evidence level. R61 remains open for the complete protocol. No Phase 3B work has begun.

## Acceptance addendum — 2026-09-15

The user accepted Phase 3A2 as successful local registerIssuerV2 resource completion at the documented evidence level. This is not proof, cryptographic-verification, ledger, deployment or whole-protocol acceptance. R61 remains open. Phase 3B authorizes only registerCredentialV2 and its conditional local resource gate; see the [Phase 3B report](phase-3b-register-credential-report.md).
