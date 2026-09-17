# Phase 3E2B monitored four-circuit attempt

Classification: **ATTEMPT_ELIGIBLE_FOR_SEPARATE_POSTCHECK**.

This records exactly one authorized monitor invocation against commit `b6eb850a441db20d944f212efb077226a3804571` (`fix(protocol-v2): Record exact R61 cgroup execution baseline`). The attempt completed while the conversation was interrupted; resumption inspected the existing evidence and recovered the original execution session's exit status. No relaunch occurred.

## Pre-reservation and authorization

All checks passed before creating authorization: WSL and canonical repository root; exact clean HEAD; plan/monitor/postcheck hashes; absent output, authorization, evidence directory and marker (including dangling symlinks); exact prospective CPU/cgroup controls and decimal-string memory limits; normalized mounts and inactive v2 controls; all resource/disk floors; pinned versions; source/four text-ZKIR fingerprints; seven-file cache inventory. Docker CLI was unavailable, checked Docker sockets were absent, and no matching Docker/containerd/proof-server/Affinity process names were observed. The user separately confirmed avoidable workloads stopped.

Pre-reservation memory (KiB): MemTotal 12,253,260; MemAvailable 10,962,160; SwapTotal and SwapFree 8,388,608. Free disk was 1,005,221,085,184 bytes at each relevant path. Versions: Compact CLI 0.5.2, compiler 0.31.1, language 0.23.0, runtime 0.16.0, Node v24.18.0, npm 11.16.0.

`/tmp/justproof-phase3e2b-authorization.json` was created exclusively with mode 0600, flushed/fsynced, parsed, and hashed without later modification. SHA-256: `8652a02b153cae3cacbf6dc3e8b5affad1cb79ff6cdde6f48045ce6dc60b7087`.

Exact single invocation:

```text
python3 docs/development/evidence/phase-3e2a/proposed-monitor.py --authorization-file /tmp/justproof-phase3e2b-authorization.json
```

The monitor launched:

```text
compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3e2-four-circuit-74591b08-attempt1
```

Overrides: `RAYON_NUM_THREADS=2`, `XDG_CACHE_HOME=/home/oluwatobiss/.cache`. No outer timeout, pipeline, or retry was used. The durable reservation [attempt-started](evidence/phase-3e2b/attempt-started) remains in place. Exact thresholds and provenance are recorded in that marker and [preflight.json](evidence/phase-3e2b/preflight.json).

## Outcome

| Measurement | Result |
| --- | --- |
| Monitor exit | 0; recovered from the original execution session |
| Monitor terminal eligibility | true |
| Compiler launched / exit | true / 0 |
| Stop reason | null |
| Compiler wait elapsed | 1436.7545950050007 seconds |
| Cleanup-inclusive elapsed | 1446.2761655489994 seconds |
| Peak sampled aggregate RSS | 4,971,680 KiB |
| Minimum MemAvailable | 5,982,824 KiB |
| Minimum SwapFree | 8,388,608 KiB |
| Maximum sample gap | 0.905406188001507 seconds |
| Parsed memory samples | 2,729 |
| Finalization complete | true |
| Finalization errors / permanent block | empty / false |
| keyGenerationSuccess | false |

The original session returned exactly:

```json
{"eligibleForSeparatePostcheck": true, "compilerExit": 0, "stopReason": null, "finalizationErrorCount": 0, "keyGenerationSuccess": false}
```

[Result](evidence/phase-3e2b/result.json), [compiler log](evidence/phase-3e2b/build.txt), and [memory samples](evidence/phase-3e2b/memory.jsonl) remain unmodified. Measurements are aggregate four-circuit build observations, not per-circuit resource costs or row counts.

## Provenance, cache, and artifacts

The [final provenance scan](evidence/phase-3e2b/final-provenance-scan.json) completed with no reported URLs, parameter requests, or new cache names. No parameter retrieval occurred. [Cache before](evidence/phase-3e2b/cache-before.json) and [cache after](evidence/phase-3e2b/cache-after.json) agree exactly; [comparison](evidence/phase-3e2b/cache-comparison.json) records no additions, removals, or mutations. Local hashes are not independently authenticated official checksums.

The monitor's [artifact manifest](evidence/phase-3e2b/artifact-manifest.json) contains 20 entries with byte sizes and SHA-256 hashes: four bindings/metadata/source-map files and four sets of prover, verifier, text ZKIR, and binary ZKIR files. The manifest reports nonzero sizes for every entry. These are monitor-produced inventory observations; the separately authorized postcheck, fresh complete-manifest comparison, and verifier-key serialization round trips have **not** run. Nothing was promoted to managed assets.

Nine JSON documents (including the extensionless marker), all 2,729 JSONL records, and the compiler text log were readable and parsed. Marker/preflight/result provenance agreed, recorded memory extrema matched the samples, and [watchdog.json](evidence/phase-3e2b/watchdog.json) records done=true. No finalization-error journal exists. No monitor-produced evidence was rewritten or repaired.

## Limits and repository state

Eligibility is not accepted/completed key generation. Postcheck and subsequent user review remain outstanding; `keyGenerationSuccess` stays false. No proof generation, cryptographic proof verification, ledger/network application execution, artifact promotion, deployment, tests, or typechecking occurred. No parameter download was requested. R61 remains open.

The only repository additions are this report and the monitor-created evidence directory. Existing source, managed artifacts, proposal files, and historical evidence were not edited. Nothing was staged or committed. Final status:

```text
?? docs/development/evidence/phase-3e2b/
?? docs/development/phase-3e2b-monitored-attempt-report.md
```


## Separately authorized postcheck — 2026-09-17

Classification: **POSTCHECK_PASSED_AWAITING_USER_ACCEPTANCE**.

The user explicitly authorized one execution after accepting the monitored attempt as eligible. Before execution, WSL/canonical repository root, exact HEAD and subject, absence of tracked/staged changes, and the two permitted repository additions were confirmed. No completed-attempt process identity, monitor, compiler, or watchdog remained running. Every supplied monitor-evidence and report byte size/hash matched. The authorization file remained a regular nonsymlink mode-0600 file with its accepted hash. The output was a real directory containing exactly the manifest's 20 regular files and four expected directories, without symlinks or special files. All files were nonempty and matched their saved sizes/hashes. Provenance, successful finalization, unchanged cache comparison, absent finalization-error journal, exact postcheck identity, Node v24.18.0, and runtime 0.16.0 passed. All four new postcheck/integrity paths were absent.

Exact single command:

```text
node docs/development/evidence/phase-3e2a/proposed-key-format-check.mjs --separately-authorized-phase-3e2b-postcheck
```

Started `2026-09-17T01:48:28.954521+00:00`; finished `2026-09-17T01:48:32.575841+00:00`. Direct Node exit: **0**. No pipeline or retry was used. Stdout and stderr were created exclusively and flushed/fsynced. [Stdout](evidence/phase-3e2b/postcheck-stdout.txt) is one JSON document (3,618 bytes); [stderr](evidence/phase-3e2b/postcheck-stderr.txt) is empty. [Execution record](evidence/phase-3e2b/postcheck-execution.json) records the exact command, timestamps, exit, stream hashes, checks, and classification.

| Circuit | Verifier-key serialization round trip |
| --- | --- |
| registerIssuerV2 | true |
| registerCredentialV2 | true |
| revokeCredentialV2 | true |
| proveQualificationV2 | true |

The fresh complete inventory exactly equals the saved 20-entry artifact manifest in relative paths, byte sizes, and SHA-256 hashes. Required prover/verifier keys, text/binary ZKIR, metadata, bindings, and source map remain nonempty regular files. This establishes artifact presence, integrity, and verifier-key serialization compatibility only. The output explicitly records `proofGeneration: false` and `cryptographicProofVerification: false`.

Before/after preservation checks found no changes to tracked content, historical evidence, source, managed artifacts, cache entries, or monitor-produced evidence. No monitor evidence was rewritten. This report's original 5,626 bytes remain an exact prefix; the new [integrity inventory](evidence/phase-3e2b/integrity.json) records the prefix hash, updated report hash, all monitor evidence, new postcheck files, reviewed proposal files, source/ZKIR/cache/managed artifacts, and final unstaged status. Its own hash is excluded.

All Phase 3E2B JSON and all 2,729 memory JSONL records parsed successfully. `git diff --check` passed. The existing monitor `result.json` remains unchanged with `keyGenerationSuccess: false`. No second compiler attempt, second postcheck, artifact promotion, proof operation, network operation, tests, typechecking, staging, commit, or deployment occurred. The output, authorization, marker, and evidence remain retained. R61 remains open pending user review.

Final `git status --short`:

```text
?? docs/development/evidence/phase-3e2b/
?? docs/development/phase-3e2b-monitored-attempt-report.md
```


## Phase 3E2C acceptance reconciliation — 2026-09-17

Classification: **FOUR_CIRCUIT_KEY_GENERATION_ACCEPTED_AWAITING_PROMOTION**.

The user accepted the monitored attempt and postcheck subject to this reconciliation. All reconciliation requirements passed. Under that conditional acceptance, the user accepts the single monitored four-circuit compiler attempt, its resource measurements, complete nonempty four-circuit key/binary/text-ZKIR output, exact saved-versus-current manifest agreement, all four verifier-key serialization round trips, and source/ABI/metadata consistency. This is an accepted **key-generation and resource checkpoint** only.

[Acceptance reconciliation](evidence/phase-3e2b/acceptance-reconciliation.json) records the exact inventories, metadata signatures, hashes, and comparisons. The baseline is unchanged at `b6eb850a441db20d944f212efb077226a3804571`. Accepted report/postcheck/integrity identities and all 11 monitor-produced evidence hashes matched before any update. No tracked or staged changes or remaining attempt/postcheck process was found. Temporary output, authorization, marker, and evidence remain retained.

Static inspection (without importing or executing generated bindings) reconciled source declarations, compiler metadata, TypeScript Circuits/ImpureCircuits/ProvableCircuits, JavaScript circuits/impureCircuits/provableCircuits, and registered operation names. Each contains exactly:

```text
registerIssuerV2(issuerControlCommitment: Bytes<32>): []
registerCredentialV2(): []
revokeCredentialV2(): []
proveQualificationV2(request: QualificationRequestV2): QualificationProofPublicOutputV2
```

The ten ordered request fields, Uint widths, ContractAddress representation, byte fields, and two Bytes<32> digest outputs agree. Generated TypeScript maps Uint values to bigint and Bytes to Uint8Array; its CircuitContext parameter is the generated runtime interface, not an additional protocol argument. Accepted Phase 3D source/artifact fingerprints, ABI report, and passed public-surface evidence remain unchanged. No simulation or public-surface test was rerun.

The temporary manifest still has exactly 20 files and matches both the saved manifest and postcheck output. Seven specified temporary files are byte-identical to their managed counterparts: metadata, declarations, executable JavaScript, and all four text ZKIR files. All eight existing managed files match the accepted Phase 3D inventory. Managed keys/ and binary ZKIR remain absent; nothing was copied there.

The exact source-map structural difference is solely:

| Field | Temporary | Managed |
| --- | --- | --- |
| sourceRoot | empty string | ../../../../ |

Temporary map: 10,670 bytes, `4a5ae38bbdca175bd3104826df8671db6a53ec001837f65764393924b05a1b4d`.
Managed map: 10,682 bytes, `2ff2c49f300b2843a8cbf7d365a4b4f739d1addd1da9f476a6cf7e8ad81ebe78`.

Version, file (`index.js`), sources, names, and mappings are structurally identical. Neither map embeds sourcesContent. The difference is output-location/source-root metadata, not executable code or mapping changes. The managed sourceRoot reaches the repository root; the temporary map retains identical source entries with an empty root. This does not assert those relative source URLs resolve from /tmp. Applicable repository source/module bytes are preserved and the standard-library source reference is unchanged. No map was normalized or rewritten.

Circuit-local classification:

* **registerIssuerV2:** prover, verifier, binary ZKIR, and text ZKIR match all four accepted historical fingerprints.
* **registerCredentialV2:** prover, verifier, binary ZKIR, and text ZKIR match all four accepted historical fingerprints. This does not restore the unavailable original Phase 3B logs or artifacts; current evidence is independently retained.
* **revokeCredentialV2:** text ZKIR matches the accepted fingerprint; binary ZKIR matches the earlier partial-build fingerprint. Both nonempty keys are newly completed, not historical matches to the zero-byte Phase 3C placeholders.
* **proveQualificationV2:** text ZKIR matches Phase 3D. Binary ZKIR and both keys are newly completed, not historical key-generation evidence.

All 16 exact circuit-local hashes/classifications are recorded in the reconciliation JSON. The compiler executable's current local hash is recorded separately from the build's compiler-version attestation; no compiler invocation occurred during reconciliation.

The accepted aggregate measurements remain: compiler wait 1436.7545950050007 seconds; cleanup-inclusive 1446.2761655489994 seconds; peak sampled aggregate RSS 4,971,680 KiB; minimum MemAvailable 5,982,824 KiB; minimum SwapFree 8,388,608 KiB; maximum sample gap 0.905406188001507 seconds. No parameter was requested; the seven-file cache remains unchanged.

All Phase 3E2B JSON and all 2,729 JSONL samples parsed; `git diff --check` passed. The original 9,113-byte report remains an exact prefix. The integrity refresh retains the previous integrity hash, all immutable monitor/postcheck hashes, source/Phase 3D/managed/cache/tracked preservation, and updated report/reconciliation hashes. `result.json` is immutable and still records `keyGenerationSuccess: false`; this later reviewed acceptance is recorded separately.

The key-generation/resource portion of R61 is satisfied. **R61 as a whole remains open** for actual proof generation, cryptographic proof verification, ledger execution, artifact-profile/release work, and other explicitly retained requirements. No artifact promotion, proof generation, cryptographic proof verification, ledger execution, deployment, or release readiness is claimed. No compiler, monitor, postcheck, test, typecheck, or network operation was rerun. No staging, commit, or push occurred. Do not restart WSL or clear /tmp before the separately reviewed promotion phase.

Final unstaged status:

```text
?? docs/development/evidence/phase-3e2b/
?? docs/development/phase-3e2b-monitored-attempt-report.md
```


## Bounded local artifact promotion — 2026-09-17

Classification: **FOUR_CIRCUIT_ARTIFACTS_PROMOTED_AWAITING_USER_COMMIT**.

Following explicit user acceptance of Phase 3E2C and authorization of this exact promotion, all baseline gates passed at `b6eb850a441db20d944f212efb077226a3804571`. Accepted reconciliation/report/integrity/manifest identities matched; the complete retained 20-entry temporary manifest was recomputed and matched. No tracked/staged changes or running attempt/postcheck process existed. More than 1 GiB destination free space was available. Authorization, marker, evidence and temporary output were retained.

Exactly **12 previously absent files, totaling 382,340,091 bytes**, were copied from `/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1` into corresponding paths beneath `contracts/managed/just-proof`. All 12 destinations were untracked and ignored by `.gitignore:67:managed/`. The keys directory and all four binary-ZKIR paths were absent including dangling symlinks; existing destination directories were real directories.

The keys directory used fail-if-exists creation and every destination used exclusive binary creation. Each source was rehashed immediately before copying; copies used 1 MiB chunks, flushed and fsynced each completed file, and fsynced affected directories. Destination sizes/hashes and chunk-by-chunk source/destination equality passed. No existing destination was overwritten, truncated, deleted, renamed, repaired, or retried. No general recursive copy was used.

Promoted inventory:

| Relative path | Bytes | SHA-256 |
| --- | ---: | --- |
| `keys/registerIssuerV2.prover` | 76,490,158 | `9c136a8ce811aedd13ad2e364005b1d3454f76fd7e29cd6edaff5b5a99dcca28` |
| `keys/registerIssuerV2.verifier` | 2,119 | `b6c78daa6b3964912d9cbf2bd783365de7c18521ca26efffbee5b37e410e1a9a` |
| `zkir/registerIssuerV2.bzkir` | 3,056 | `be21a00eda843b8ec88fb8e19f9a9645fe81659ed9354f8515d651991f3bab56` |
| `keys/registerCredentialV2.prover` | 76,642,841 | `1722f6f9cf0e818f414639fb179b9a3d7756242102e9fbe1367b5c167b5e263e` |
| `keys/registerCredentialV2.verifier` | 2,119 | `c0abaaf254564c21488f90784d8b29c8b106ae2e273fde89fa6fa392c4610d22` |
| `zkir/registerCredentialV2.bzkir` | 5,613 | `26015eecbe8847ec442d288b3d252189892772e3af6168aa30b7a6b8ab4eedba` |
| `keys/revokeCredentialV2.prover` | 152,517,062 | `87a0a6d42dc536f855d806418db0a47b6ab78535cbdfda5856c01a2ad2798908` |
| `keys/revokeCredentialV2.verifier` | 2,119 | `eb07cc2b21b2181426e596b9f459b13a441db99c177ad29b4fad1923209523d0` |
| `zkir/revokeCredentialV2.bzkir` | 6,209 | `98eedb891db4d2b3220c1306078033f8079cc92b8212e24c0e84bebc59d0d573` |
| `keys/proveQualificationV2.prover` | 76,660,599 | `1dc78862643d288d1731fc43567667c9923b017ec23fa77f471f8c66059c762b` |
| `keys/proveQualificationV2.verifier` | 2,119 | `21fcff4439ed11bd959a0f3f6f58a2bc2358912de142014309fdaf7c5ad4e56a` |
| `zkir/proveQualificationV2.bzkir` | 6,077 | `918ce164f19565f8323efcfe29483f1976e5a302304f6d0deb41b8c1e9200ec6` |

Preserved original managed inventory:

| Relative path | Bytes | SHA-256 |
| --- | ---: | --- |
| `compiler/contract-info.json` | 24,565 | `868cca4e3cc858d9cb0cb63ce93e81808509a2eaa60d9ff65c32b54bd3a4902d` |
| `contract/index.d.ts` | 12,959 | `0139fd7406b87a3498b5141ff2bdce2dcef9193753597326af99aa9e738b0d08` |
| `contract/index.js` | 200,816 | `b7396f8c593c99104aeb7ae0bf2f4fe4341beadf525ab841deeb5a064addaeef` |
| `contract/index.js.map` | 10,682 | `2ff2c49f300b2843a8cbf7d365a4b4f739d1addd1da9f476a6cf7e8ad81ebe78` |
| `zkir/proveQualificationV2.zkir` | 72,144 | `7ca590bb29edd4f6dab806f7278878b1720b6773f4702b82e7c2e371db58a803` |
| `zkir/registerCredentialV2.zkir` | 65,083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| `zkir/registerIssuerV2.zkir` | 37,980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| `zkir/revokeCredentialV2.zkir` | 71,809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

The final managed inventory is exactly the union of these tables: **20 regular, nonempty files**, no symlink or special file. All eight original files retain their byte hashes and modification times. The managed source map remains 10,682 bytes with `sourceRoot: "../../../../"`; the temporary map was not copied.

[Promotion evidence](evidence/phase-3e2b/promotion.json) records the allowlist, immediate pre-copy hashes, absence/ignore checks, copy method, completed destinations, preserved files, and final inventory. Source, cache, tracked files, historical evidence, monitor/postcheck/reconciliation evidence, authorization, marker, and complete temporary output remain unchanged. No ignored artifact was staged. Existing verifier-key round-trip evidence carries forward by byte equality; no key operation was rerun.

All Phase 3E2B JSON and all 2,729 memory JSONL records parsed. `git diff --check` passed. The original 15,110-byte report is preserved exactly as a prefix. The integrity refresh retains its preceding hash, the new promotion evidence, unchanged execution evidence, promoted/preserved managed hashes, and final unstaged/ignored status, excluding its own current hash.

This satisfies the local managed-artifact portion of the accepted key-generation checkpoint. R61 remains open for actual proof generation, cryptographic proof verification, ledger execution, artifact-profile/release work, and other retained requirements. No compiler, monitor, postcheck, generated binding, proof, test, typecheck, network, wallet/provider, deployment or Docker operation ran. Nothing was staged, committed, amended, pushed or force-added. Retained temporary output and attempt evidence must not be cleared before further review.

Final `git status --short`:

```text
?? docs/development/evidence/phase-3e2b/
?? docs/development/phase-3e2b-monitored-attempt-report.md
```

Ignored-file summary: all 12 promoted paths match `.gitignore:67:managed/`; the managed tree remains ignored. No ignore rules were changed.
