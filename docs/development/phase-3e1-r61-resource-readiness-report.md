# Phase 3E1 — R61 higher-memory resource readiness audit

2026-09-16. Planning and local preflight only. R61 remains open. No build, key generation, parameter download, proof operation, or network execution was performed.

## Baseline and evidence

The initial WSL check confirmed HEAD `74591b08a808cc94bb19e0fa4331db4bbdd44a44` and empty `git status --short` before creating audit files. [Readiness evidence](evidence/phase-3e1/readiness.json) records commands, exit codes, outputs, memory/cgroup observations, process limits, disk space, cache hashes and a preservation baseline. The [capture source](evidence/phase-3e1/capture-readiness.py) reads local state and writes only evidence; it is not a build monitor. Version-only compiler invocations do not compile source. No update check or npm registry request was made because network access is prohibited in this audit.

## Observed capacity

WSL2 kernel `5.15.146.1-microsoft-standard-WSL2`; Ubuntu 24.04.1 LTS. Compact developer CLI 0.5.2; selected toolchain/compiler 0.31.1; language 0.23.0; compiler-required and installed runtime 0.16.0; Node v24.18.0; npm 11.16.0. All recorded version commands exited 0.

| Resource | Observed |
|---|---:|
| MemTotal | 8,050,760 KiB (about 7.68 GiB) |
| MemAvailable | 4,962,796 KiB |
| SwapTotal | 2,097,152 KiB |
| SwapFree | 1,642,492 KiB |
| CPU count / allowed affinity CPUs | 8 / 8 |
| Free disk, each of repository, /tmp and parameter cache | 1,005,084,258,304 bytes |

All three disk paths resolve to the same reported capacity; their free space must not be summed. These are point-in-time samples, not reserved capacity.

Hybrid cgroups: memory is controlled by v1. Root and `/init.scope` memory and combined memory+swap limits are `9223372036854771712` bytes (unlimited sentinel), with hierarchy enabled. Root current memory is 4,922,195,968 bytes and combined memory+swap 5,364,383,744 bytes; init.scope current values are 2,450,214,912 and 2,862,735,360 bytes respectively. These independently read counters are not an atomic sample or additional RAM. v2 controllers are empty and memory/swap controller files are absent; raw missing-file observations are retained. No smaller finite cgroup ceiling was found along the applicable memory hierarchy. The WSL physical ceiling still applies.

Relevant process limits: CPU time, address space, data size and RSS unlimited; stack soft 8,388,608 bytes; max processes 31,422; open files soft 1,024/hard 1,048,576; locked memory 67,108,864 bytes; core size zero. Full soft/hard limits are preserved in JSON. No limits or WSL settings were changed.

## Phase 3C comparison

Preserved [resource analysis](evidence/phase-3c/resource-analysis.json) and [result](evidence/phase-3c/result.json) remain unchanged. That compiler exited −15 after approximately 1055 seconds, with peak sampled aggregate RSS 4,646,684 KiB, minimum MemAvailable 776,132 KiB and maximum swap use 563,204 KiB. It was stopped at the 768 MiB available-memory floor; required free swap was 512 MiB. Threads were 2 and time limits 1345/1350 seconds.

The current MemTotal **exactly equals** the failed environment's 8,050,760 KiB and SwapTotal **exactly equals** its 2,097,152 KiB. More free RAM at idle does not make this a higher-capacity VM. The four-circuit workload has no demonstrated peak requirement; unlimited cgroups and ample disk do not remove the WSL RAM ceiling. Another attempt is blocked. No numerical higher-memory target is invented or approved by this audit.

## Source, text ZKIR and cache

| File | Bytes | SHA-256 |
|---|---:|---|
| `contracts/just-proof.compact` | 13714 | `9ffa12d0570659ec703479ffb35c5ab2e1248f668abff6f9fbd91f344ef62ecf` |
| `contracts/managed/just-proof/zkir/proveQualificationV2.zkir` | 72144 | `7ca590bb29edd4f6dab806f7278878b1720b6773f4702b82e7c2e371db58a803` |
| `contracts/managed/just-proof/zkir/registerCredentialV2.zkir` | 65083 | `b04a6e786914be257ab88d09d148ca8918d08b302e970bc81cdaec47efc1227e` |
| `contracts/managed/just-proof/zkir/registerIssuerV2.zkir` | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |
| `contracts/managed/just-proof/zkir/revokeCredentialV2.zkir` | 71809 | `e28c864710d6b05da43dc1caa01e6d7e4ca4a66d6a87fe63511bcc0bac3a7c84` |

Read-only cache inventory at `/home/oluwatobiss/.cache/midnight/zk-params`:

| Parameter | Bytes | Locally recorded SHA-256 |
|---|---:|---|
| `bls_midnight_2p13` | 1573252 | `d3324910969c4cc54143b8045b649e5c3a4bd5fb7b8f85fe1b770f640ce1c803` |
| `bls_midnight_2p17` | 25166212 | `4a9ef6c7c0619aab74eede44b13e753e3ba54508a02dd3b7106a949aabb73b74` |
| `bls_midnight_2p18` | 50332036 | `e8436dc5d8b598f169c127c745135d889744007e6d384ff126df8d1332522f86` |
| `bls_midnight_2p19` | 100663684 | `8e8dc15c4362f05c912f1e770559a3945db3e58a374def416ed5d3e65ad5b10e` |
| `bls_midnight_2p6` | 12676 | `cf2ad6be7d0fedf5bec2aaa35f6be4aca33053d74268fdf5aa54fcb2891ea6df` |
| `bls_midnight_2p7` | 24964 | `e82ae890c080188355f37feaffe91372584cd810615082d9143d4dec0453fd9d` |
| `bls_midnight_2p9` | 98692 | `b9009f1098bcefffec3c461ab3a5e3a17f7e5599f0f08c70fcdc55a89227bcbd` |

These local hashes are not independently authenticated official checksums. No cache file was deleted, overwritten or downloaded. Cache and preserved repository-file comparisons are in [integrity evidence](evidence/phase-3e1/integrity.json).

## Proposed Phase 3E2 plan — not executable authorization

[Machine-readable plan](evidence/phase-3e1/proposed-execution.json). No monitor is run or saved as an executable build driver in this audit. Neither the proposed output directory nor marker exists; the final integrity check reconfirms this.

Proposed exact compiler subprocess, to be launched only by a separately reviewed monitor after a fresh higher-memory preflight and explicit user authorization:

```bash
env RAYON_NUM_THREADS=2 XDG_CACHE_HOME=/home/oluwatobiss/.cache compact compile +0.31.1 contracts/just-proof.compact /tmp/justproof-phase3e2-four-circuit-74591b08-attempt1
```

1. Recheck accepted HEAD/source and generated fingerprints, pinned versions, CPU/process/disk/cgroup observations, cache inventory and clean execution baseline. Require a separately reviewed materially higher-memory environment with observable headroom. The present environment fails regardless of its momentary free RAM. Preflight must satisfy at least the existing 768 MiB available-memory and 512 MiB free-swap floors, but satisfying those floors alone is not readiness. No new disk quota, swap size, concurrency limit or RAM target is adopted.
2. Verify `/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1` and `/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1.marker` are absent, including dangling symlinks. Atomically create the marker with exclusive creation and the output directory with fail-if-exists semantics only during the authorized attempt. Record source hash and authorization/gate result in the marker. Keep the marker after any outcome; no retries or overwrite of managed assets.
3. Start the compiler in its own process group. Track both group membership and descendant ancestry, including retained descendant identities, rather than timeout-wrapper RSS. Sample per-process RSS/HWM, aggregate instantaneous RSS, system MemAvailable/SwapFree and applicable cgroup usage/headroom approximately every 0.5 seconds. Persist samples and complete compiler output during the same session. Summed per-process HWM is not a simultaneous peak; sampled RSS may miss peaks and must be labeled accordingly.
4. Retain SIGTERM at MemAvailable <786432 KiB or SwapFree <524288 KiB; SIGKILL remaining descendants after five seconds. Loss of reliable process/resource monitoring or an unexpected restrictive cgroup is a stop condition, not permission to continue. Retain graceful time termination at 1345 seconds and an independent hard-kill watchdog at 1350 seconds. These equal the earlier limits, despite the additional circuit; no longer timeout is proposed or implicitly authorized. A timeout remains indeterminate. The future review may separately approve changed limits; none are assumed here.
5. Reuse the established cache without deletion or substitution. Any download needs separate Phase 3E2 execution authorization. Permit at most one missing parameter through the pinned compiler mechanism from `midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com`. Snapshot names/sizes/hashes before and after. Record exact requested name, reported origin, resulting size/hash, and provenance limitations. Stop on a second missing name, different origin, unexplained parameter, or unobservable provenance. Do not guess a future parameter name, fetch proactively, or use manual URLs/mirrors. Compiler logs alone cannot prove unreported redirects or complete network provenance; inability to establish the approved boundary is a stop condition requiring review.
6. Preserve complete logs, memory samples, result JSON, command/versions, cache comparisons and every partial artifact's size/hash under separately approved Phase 3E2 evidence. Partial outputs stay in the fresh temporary directory; no keys are promoted into managed assets. No retry after failure, timeout or safe stop.
7. Success requires compiler exit 0; nonzero prover/verifier key pairs for **all four** endpoints; complete binary/text ZKIR, generated bindings and metadata; all artifact hashes/sizes; valid timing and process-tree memory evidence; and installed-runtime verifier-key deserialize/serialize round trips for every verifier key. Compare existing circuit-local fingerprints with accepted values and explain changes. Parameter names and artifact sizes are not circuit row counts. Key format round trips and key generation are neither actual proof generation nor cryptographic proof verification.

## Scope, validation and created files

No compilation, tests, typechecking, monitor/build, parameter download, actual proof, wallet/provider, ledger, Preview/Preprod or deployment command ran. No dependency/script/configuration/resource-limit changes, staging, committing or pushing occurred. The capture command's `compact compile` uses only version-reporting flags, with no source or output argument. Frozen V1, prior reports/evidence, circuit bodies, generated artifacts and cache content are preserved.

JSON was parsed and Python evidence was syntax-checked with `ast.parse`, without executing a proposed monitor or producing bytecode. `git diff --check` passed. The integrity record contains final status and preservation comparisons. Created files only:

- `docs/development/phase-3e1-r61-resource-readiness-report.md`
- `docs/development/evidence/phase-3e1/capture-readiness.py`
- `docs/development/evidence/phase-3e1/readiness.json`
- `docs/development/evidence/phase-3e1/proposed-execution.json`
- `docs/development/evidence/phase-3e1/integrity.json`

Final `git status --short`:

```text
?? docs/development/evidence/phase-3e1/
?? docs/development/phase-3e1-r61-resource-readiness-report.md
```

R61 remains open. Stop for user review; no Phase 3E2 attempt is authorized. Readiness classification:

BLOCKED_INSUFFICIENT_RESOURCES
