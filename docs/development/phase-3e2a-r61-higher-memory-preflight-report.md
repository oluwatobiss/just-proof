# Phase 3E2A — R61 higher-memory revalidation

2026-09-16. Draft execution proposal — user review required. This phase performed local resource/version reads, content hashing and evidence syntax validation only. No four-circuit build is authorized or attempted. R61 remains open.

## Baseline and preserved state

Initial WSL checks confirmed a clean working tree and HEAD `fd0a8bb8590dd1d74d735b6365e601b7f6125163`, subject `docs(protocol-v2): Document the accepted R61 resource readiness audit`. The [fresh readiness snapshot](evidence/phase-3e2a/readiness.json) includes the exact baseline, commands/output, original tracked-file and ignored managed-artifact hashes. [Integrity evidence](evidence/phase-3e2a/integrity.json) verifies these remain unchanged, including frozen V1, all prior reports/evidence, source and generated artifacts. Dependencies and configuration were not changed. The previous Phase 3E1 capture was not rerun or edited; a new [capture script](evidence/phase-3e2a/capture-readiness.py) writes only this phase's evidence.

## Fresh resource observations

| Resource | Phase 3E1 | Phase 3E2A |
|---|---:|---:|
| MemTotal, KiB | 8,050,760 | 12,253,256 |
| MemAvailable, KiB (point-in-time) | 4,962,796 | 10,555,124 |
| SwapTotal, KiB | 2,097,152 | 8,388,608 |
| SwapFree, KiB (point-in-time) | 1,642,492 | 8,388,608 |

Physical capacity increased by **4,202,496 KiB**, about 52.2%, to about **11.69 GiB**; swap increased by **6,291,456 KiB** to **8 GiB**. This conclusion uses total capacity, not just idle free memory. No WSL configuration or swap was changed by this task. Fresh available memory is about 10.07 GiB; observations are neither reservations nor future availability guarantees.

WSL kernel: `5.15.146.1-microsoft-standard-WSL2`. Distribution: Ubuntu 24.04.1 LTS. CPU count and affinity both 8. Each of repository, `/tmp` and cache reports 1,005,230,452,736 bytes free, on the same filesystem; do not sum their space.

The applicable hybrid hierarchy uses cgroup v1 memory. Root and `/init.scope` both report memory and memory+swap limits of `9223372036854771712` bytes, the unlimited sentinel. Root current memory/combined usage is 4,143,775,744 / 4,143,779,840 bytes; init.scope values are 1,767,968,768 / 1,767,968,768 bytes. The hierarchy is enabled. v2 `cgroup.controllers` is empty at root and init.scope, and its memory/swap controller files are absent. These observations identify no tighter finite cap than WSL RAM; they do not imply unlimited physical memory. The proposed monitor rejects a changed hierarchy or limit until reviewed.

Process limits: CPU, address space, data and RSS unlimited; processes 47,838; stack soft 8,388,608 bytes; open files soft 1,024/hard 1,048,576; locked memory 67,108,864 bytes; core size zero. Complete limits and cgroup raw observations, including absent files, are in the snapshot.

Pinned tools are unchanged: Compact developer CLI **0.5.2**, compiler/toolchain **0.31.1**, language **0.23.0**, required and installed runtime **0.16.0**, Node **v24.18.0**, npm **11.16.0**. All six version commands exited 0. Compiler commands used only `--version`, `--language-version`, and `--runtime-version`, no source/output arguments or compilation. No latest-version registry/update request or other network operation was performed.

## Comparison with failed Phase 3C

Phase 3C exited **−15** after **1055.003 seconds**, at peak sampled aggregate RSS **4,646,684 KiB**, minimum available memory **776,132 KiB**, maximum swap use **563,204 KiB**. That was a memory-floor termination, not a success or elapsed-time exhaustion. Its physical totals equaled the blocked Phase 3E1 totals. The new totals materially exceed those totals, but that does not establish the four-circuit peak requirement or predict success. Three-circuit measurements and text-ZKIR sizes are not four-circuit row counts or a performance bound.

## Current fingerprints and parameter cache

| File | Bytes | SHA-256 |
|---|---:|---|
| `contracts/just-proof.compact` | 13714 | `9ffa12d0570659ec703479ffb35c5ab2e1248f668abff6f9fbd91f344ef62ecf` |
| `contracts/managed/just-proof/zkir/proveQualificationV2.zkir` | 72144 | `7ca590bb29edd4f6dab806f7278878b1720b6773f4702b82e7c2e371db58a803` |
| `contracts/managed/just-proof/zkir/registerCredentialV2.zkir` | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| `contracts/managed/just-proof/zkir/registerIssuerV2.zkir` | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| `contracts/managed/just-proof/zkir/revokeCredentialV2.zkir` | 71809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

All five fingerprints match accepted Phase 3E1 evidence. Cache `/home/oluwatobiss/.cache/midnight/zk-params` contains the same seven files:

| Filename | Bytes | Local SHA-256 |
|---|---:|---|
| `bls_midnight_2p13` | 1573252 | `d3324910969c4cc54143b8045b649e5c3a4bd5fb7b8f85fe1b770f640ce1c803` |
| `bls_midnight_2p17` | 25166212 | `4a9ef6c7c0619aab74eede44b13e753e3ba54508a02dd3b7106a949aabb73b74` |
| `bls_midnight_2p18` | 50332036 | `e8436dc5d8b598f169c127c745135d889744007e6d384ff126df8d1332522f86` |
| `bls_midnight_2p19` | 100663684 | `8e8dc15c4362f05c912f1e770559a3945db3e58a374def416ed5d3e65ad5b10e` |
| `bls_midnight_2p6` | 12676 | `cf2ad6be7d0fedf5bec2aaa35f6be4aca33053d74268fdf5aa54fcb2891ea6df` |
| `bls_midnight_2p7` | 24964 | `e82ae890c080188355f37feaffe91372584cd810615082d9143d4dec0453fd9d` |
| `bls_midnight_2p9` | 98692 | `b9009f1098bcefffec3c461ab3a5e3a17f7e5599f0f08c70fcdc55a89227bcbd` |

These are locally recorded hashes, not independently authenticated official checksums. No cache contents were modified or downloaded. The current attempt paths are absent (including dangling-symlink checks). The original readiness snapshot retains its historical `/tmp` marker observation; the refreshed integrity record verifies the durable marker below:

- `/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1`
- `docs/development/evidence/phase-3e2b/attempt-started`

The source-derived path label intentionally retains the prior plan's identifier; it does not assert that current HEAD is 74591b08. Future evidence belongs to a fresh `docs/development/evidence/phase-3e2b/`, also absent at this preflight.

## Proposed safeguards — not approved execution limits

[Exact plan JSON](evidence/phase-3e2a/proposed-plan.json), [proposed monitor](evidence/phase-3e2a/proposed-monitor.py) and [proposed key-format gate](evidence/phase-3e2a/proposed-key-format-check.mjs) are review artifacts only. None was executed. All changed numerical limits below require explicit user review; this report does not authorize them.

| Safeguard | Previous plan/attempt | Proposed Phase 3E2B | Reason |
|---|---:|---:|---|
| Minimum launch MemAvailable | 768 MiB floor, insufficient by itself | **8 GiB (8,388,608 KiB)** | Below observed 10,555,124 KiB but requires substantial launch headroom |
| Minimum launch SwapFree | 512 MiB floor | **6 GiB (6,291,456 KiB)** | Requires most of observed 8 GiB swap still free |
| Runtime MemAvailable SIGTERM floor | 768 MiB | **2 GiB (2,097,152 KiB)** | Reserves 1,280 MiB more available RAM for WSL/other processes |
| Runtime SwapFree SIGTERM floor | 512 MiB | **2 GiB (2,097,152 KiB)** | Retains 1,536 MiB more free swap |
| SIGTERM to SIGKILL | 5 seconds | **5 seconds**, unchanged | Bounded graceful shutdown |
| Graceful timeout | 1345 seconds | **2695 seconds** | Proposed bounded extra time for fourth circuit; not a measured runtime prediction |
| Independent hard timeout | 1350 seconds | **2700 seconds (45 minutes)** | Adds 1350 seconds, preserves five-second shutdown window |
| Rayon threads | 2 | **2**, unchanged | No concurrency increase |
| Sampling | approximately 0.5 seconds | **0.5 seconds**, fail at gap >2 seconds | Stop on inadequate monitoring |
| Launch free disk | no numeric minimum approved | **10 GiB** per relevant filesystem | Proposed explicit conservative guard; not an artifact-size prediction |

The observed physical capacity must remain at least 12,253,256 KiB and swap at least 8,388,608 KiB at launch. Free-memory floors are rechecked after cache hashing. At the minimum launch headroom, approximately 6 GiB of available RAM can be consumed before reaching the 2 GiB reserve. Swap is a backstop, not equivalent RAM or a promise that swapping is product-acceptable. Workload spikes may cross a sampled threshold before detection. Existing memory pressure from other processes is included in system observations. The proposal does not change actual WSL/resource settings.

The timeout increase is a proposal because adding qualification to an uncompleted three-circuit build has unknown cost. It is deliberately bounded and may still time out. The prior failure gives no evidence that 45 minutes is sufficient or necessary. User review can reject or change it before execution.

## Exact proposed execution and monitor behavior

From the repository root, only after separate Phase 3E2B authorization, a fresh clean execution checkpoint, and approval of the exact plan/monitor/postcheck hashes:

```bash
python3 docs/development/evidence/phase-3e2a/proposed-monitor.py --authorization-file /tmp/justproof-phase3e2b-authorization.json
```

The authorization file is **not created** in this phase. It must record `authorized: true`, `phase: "3E2B"`, the later approved clean `baselineHead`, and exact `planSha256`/`monitorSha256`/`postcheckSha256`. It must also confirm `avoidableDockerWorkloadsStopped: true` after the future operator has stopped the relevant workloads. It is a procedural anti-accident gate, not a substitute for actual user authorization. No monitor import, `--help`, self-test, or build driver execution occurred.

Its compiler subprocess is exactly:

```bash
env RAYON_NUM_THREADS=2 XDG_CACHE_HOME=/home/oluwatobiss/.cache compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3e2-four-circuit-74591b08-attempt1
```

The monitor checks WSL, pinned versions, current clean authorized HEAD, source/four text-ZKIR hashes, cache inventory, cgroup compatibility and launch resources. It requires the temporary output, durable marker and Phase 3E2B evidence directory to be nonexistent before reservation. After validating authorization and the clean baseline, it creates the evidence directory with fail-if-exists semantics, then exclusively creates and fsyncs `attempt-started` and fsyncs its directory before version/resource/cache preflight and compiler launch. The evidence directory and marker remain after every subsequent outcome, including pre-launch failure; if marker creation itself fails, the retained directory still prevents retry. Invalid authorization is rejected without reserving an attempt. Output creation also fails if the path exists. No deletion or automatic retry exists. Compiler output cannot overwrite managed assets.

The compiler starts in its own process group. The monitor enumerates group members and descendants, retains PID/start-time identities to track observed escaped descendants, and samples individual RSS/HWM, aggregate RSS, system RAM/swap and cgroup usage. Sampling failures, unreadable required process data, excessive sample gaps or watchdog exit trigger termination. Per-process HWM is retained, but its sum is not called a simultaneous aggregate peak. An independent interpreter watchdog observes heartbeat and the 2700-second hard deadline; it can terminate the process group and known descendants if the main monitor stalls or disappears. RSS remains sampled, and descendants that start, escape and disappear entirely between samples cannot be fully measured. This monitor is syntax-inspected, not dynamically tested in this phase.

No wrapper RSS is reported as compiler peak. Evidence contains compiler wait elapsed time separately from cleanup-inclusive elapsed time, raw memory JSONL, full compiler output, exit/stop reason and manifests. Failure or inability to complete evidence/format checks cannot be reported as success.

## Parameter provenance and cache rules

Reuse existing cache files without deletion, overwrite or substitution. The single future invocation may request at most one missing `bls_midnight_2pN` parameter through the pinned compiler's own mechanism, **only if separately authorized**. Expected host: `midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`, HTTPS default/443. No missing parameter name is predicted here. No proactive/manual downloader, mirror or invented URL is used.

During the run, the proposed monitor inspects reported URLs/names and cache entry metadata. It stops on another reported origin, malformed/unexplained parameter, a second missing parameter, a cache addition without the corresponding reported request, an existing entry's change/disappearance, or missing provenance. Before/after SHA-256 inventories establish content preservation. Strict handling may stop on undocumented compiler temporary-cache behavior; it must be reviewed rather than silently relaxed or retried.

**Provenance limitation:** log inspection is not network egress enforcement. It cannot prove unreported redirects, hidden origins or prevent a request already initiated between samples. A missing parameter with no observable approved URL causes a conservative stop. If actual execution requires stronger origin enforcement or the compiler does not provide sufficient provenance, stop for review; this proposal does not claim those assurances are already established. Recorded hashes remain local hashes unless the pinned tool demonstrably authenticates an official checksum.

## Future completion gate and reporting

All partial/successful keys remain in the temporary output directory; no promotion to managed assets. After any attempt, persist non-secret logs, samples, source/plan/monitor/postcheck/authorization hashes, exit result, timing, complete artifact sizes/hashes, cache inventories and comparison. Nonzero exit, timeout, safety stop, monitoring/provenance failure or changed existing cache leaves the resource gate failed/indeterminate and prohibits retries.

A future successful compiler result requires exit 0 without a stop reason, complete generated metadata/bindings/source map and nonzero `keys/<circuit>.prover`, `keys/<circuit>.verifier`, `zkir/<circuit>.zkir`, `zkir/<circuit>.bzkir` for **all four** lifecycle circuits. Verify exact endpoint inventory in generated metadata/declarations and compare every circuit-local hash against accepted/historical evidence; explain differences rather than assuming stability of module-wide artifacts. Compare saved manifests with current bytes to detect post-build changes.

Proposed key-format postcheck (also not run):

```bash
node docs/development/evidence/phase-3e2a/proposed-key-format-check.mjs --separately-authorized-phase-3e2b-postcheck > docs/development/evidence/phase-3e2b/key-format-check.json
```

It uses the installed runtime's `ContractOperation` verifier-key assignment, serialization/deserialization and exact byte equality for each of the four verifier keys, checks required nonempty files, and inventories all artifacts. Additional source/ABI/manifest reconciliation and valid memory evidence are mandatory before declaring success. The monitor never sets `keyGenerationSuccess` to true. Cleanup/evidence failures are recorded in `finalizationErrors`, permanently block success and are rejected by the postcheck along with incomplete finalization, a finalization-error journal, or inconsistent provenance. Successful key generation/format checks establish neither actual proof generation, cryptographic verification, ledger execution nor whole-protocol/release readiness. R61 remains open in this phase regardless of classification.

## Validation, preservation and files

All generated JSON was parsed. Both Python sources were syntax-checked with `ast.parse` without executing the proposed monitor or creating bytecode. The proposed JavaScript postcheck received syntax-only validation, with no module execution or key operation. `git diff --check` passed. Integrity comparison records all preserved baseline files, unchanged cache, exact source/ZKIR agreement with Phase 3E1, and absence of attempt paths/authorization/evidence output. Prior reports/evidence are not modified.

Created files:

- `docs/development/phase-3e2a-r61-higher-memory-preflight-report.md`
- `docs/development/evidence/phase-3e2a/capture-readiness.py`
- `docs/development/evidence/phase-3e2a/readiness.json`
- `docs/development/evidence/phase-3e2a/proposed-plan.json`
- `docs/development/evidence/phase-3e2a/proposed-monitor.py`
- `docs/development/evidence/phase-3e2a/proposed-key-format-check.mjs`
- `docs/development/evidence/phase-3e2a/integrity.json`

Final `git status --short`:

```text
?? docs/development/evidence/phase-3e2a/
?? docs/development/phase-3e2a-r61-higher-memory-preflight-report.md
```

## Bounded proposal hardening — 2026-09-16

The user accepted the materially higher-memory finding and found the numerical safeguards reasonable, while withholding Phase 3E2B execution authorization. The hardening baseline remained `fd0a8bb8590dd1d74d735b6365e601b7f6125163` with only this report and Phase 3E2A evidence untracked. No fresh resource capture was run: `capture-readiness.py` and `readiness.json` remain byte-identical, as do all prior committed evidence and cache files.

The authoritative one-attempt reservation now resides durably in `docs/development/evidence/phase-3e2b/attempt-started`, never solely in `/tmp`. The generated output remains the existing fresh `/tmp` path. Neither directory nor marker is created by this hardening pass. Absence must be confirmed before future authorization and rechecked at invocation. Once the authorized reservation is made, resource/version/cache checks run inside the guarded finalization region so a pre-launch failure retains the evidence directory and marker and writes a blocked result wherever storage permits.

Execution provenance includes the exact SHA-256 of plan, monitor, postcheck and authorization-file bytes. Authorization must approve all three proposal hashes and the clean baseline commit. The marker, preflight and result carry the authorized baseline, actual source hash, four provenance hashes, exact compiler command, exact environment overrides and applicable thresholds. Hashes are rechecked before launch. Only the authorization hash is persisted; the authorization contents and unrelated environment variables are not dumped. The postcheck requires matching marker/preflight/result provenance and matching current proposal hashes.

Finalization handles watchdog wait timeout by recording it, terminating the watchdog, waiting a bounded interval, then killing and bounded-waiting if necessary. Compiler cleanup, watchdog cleanup, log closure, artifact inventory/write, cache inventory/write and cache comparison are independently guarded. A preliminary core result precedes expensive inventory work; finalization errors are included in the final result, with an independent error-journal/blocked-result fallback where writable. Any cleanup or evidence error permanently disqualifies success even if compiler exit is zero. Disk failure can prevent all writes; no implementation can guarantee durable evidence in that condition, and no success claim is permitted. The sampled loop contains exactly one `gap = now - last` assignment.

All reviewed numerical proposal values remain unchanged: minimum RAM/swap totals 12,253,256/8,388,608 KiB; launch available RAM/free swap 8,388,608/6,291,456 KiB; runtime floors 2,097,152/2,097,152 KiB; two Rayon threads; 0.5-second samples; two-second maximum sample gap; five-second termination interval; 2695/2700-second timeouts; at most one compiler-requested missing parameter from the existing approved host. The existing 10 GiB disk proposal is also unchanged. **No execution authorization follows from these reviewed values.**

Before the eventual attempt, the operator must stop the JustProof Compose/proof-server environment and other avoidable Docker workloads: the compiler does not require them, and they consume shared resources. This task neither queried, started nor stopped Docker. The future authorization's workload acknowledgment is a procedural operator confirmation, not an automated Docker-state inspection.

Validation is limited to JSON parsing, Python AST inspection, JavaScript syntax-only validation, preservation/cache comparisons and `git diff --check`. Neither monitor nor postcheck was imported/executed, and their failure paths remain untested dynamically. The refreshed integrity evidence records unchanged baseline/cache files and the proposal/report hashes; it excludes its own hash. Changed in this hardening pass only: `proposed-plan.json`, `proposed-monitor.py`, `proposed-key-format-check.mjs`, this report and `integrity.json`.

Refreshed proposal SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| `proposed-plan.json` | `0aa964d4baeb874a370b0bcf736015113e03305fb07f3bae3c52d9067e208aca` |
| `proposed-monitor.py` | `ad628ea9dcfe82a780d5e8dda4f62348bfed73927432a375a8ba6ed5b4308324` |
| `proposed-key-format-check.mjs` | `18e3e311e6bccd5cf83b54bfd828d3242c2712c28f9a6bfebad1ca4b176eefb0` |

No compilation, tests, typechecking, build, keys, downloads, proof operations, Preview/Preprod, wallet/provider, deployment, package installation, configuration change, staging, commit, amend or push occurred. No new phase or execution is authorized. Stop for user review. Final classification:

HIGHER_MEMORY_OBSERVED_AWAITING_EXECUTION_AUTHORIZATION
