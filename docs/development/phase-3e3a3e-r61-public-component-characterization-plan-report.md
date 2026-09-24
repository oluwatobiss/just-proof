# Phase 3E3A3E — Public Component-Characterization Plan

Date: 2026-09-23. Classification: **PUBLIC_COMPONENT_CHARACTERIZATION_PLAN_READY_FOR_REVIEW**.

This is a static proposal for one later **Phase 3E3A4A — Public Component Characterization** attempt. No component was launched, no HTTP probe was sent, and no attempt was reserved. Ready for review does not authorize execution or predict successful component startup. A4A, A4, and Phase 3E3B remain unauthorized; R61 remains open.

## Baseline and preservation

Baseline commit: `9dc7f06aa0684f3452f8d5186c5fe127b070f966`, subject `docs(protocol-v2): Record R61 A4 static completion blockers`. WSL and canonical repository-root equality passed; initial `git status --short` was empty. All eight user-specified Phase 3E3A3D hashes matched. Its integrity entries and prior preservation baseline were checked before writing proposals. No historical file was edited.

Read-only Docker name inventories found only the retained Phase 3E3A1 original and recovery containers, and the networks `bridge`, `example-hello-world-001_default`, `host`, `justproof-phase3e3a1-internal`, and `none`. No A4/A4A container/network was present. Known A4/A4A evidence, authorization, and output paths were absent, including dangling-symlink checks. Docker socket inspection initially required sandbox approval; the repeated commands were read-only name inventories. No Docker mutation occurred.

The new preservation baseline records 368 existing files, including tracked project/historical files, all 20 managed artifacts, and the seven existing parameter-cache files. End-of-work comparisons matched; the managed inventory contains exactly 20 regular nonempty files, the cache exactly seven regular files, and no managed symlink was found. Source, durable Phase 3E2B marker/evidence, Phase 3E3A3D proposals, and earlier reports remain unchanged. Historical deleted `/tmp` Phase 3E2B paths were neither required nor recreated.

## Four distinct evidence claims

| Claim | A4A scope |
|---|---|
| Component startup, confinement, proposed write paths, shutdown, public readiness | The only potential positive claim, bounded by the observed component configuration |
| Concurrent full-stack resource readiness | Excluded: proof server must stop before node starts |
| Proof-server parameter compatibility/completeness | Excluded: all seven host files remain candidate-only, with no mount or parameter resolution |
| Proof generation and cryptographic verification | Excluded: no `/check`, `/prove`, circuit, wallet, transaction, or verifier operation |

Health/readiness cannot establish parameter availability. The unresolved parameter resolver, all-four-circuit/native-wallet parameter set, and compatibility gates remain separate. The future proof guard must validate successful upstream media type and unambiguous framing as well as status/size; the historical guard is untouched and is not part of this characterization topology.

## Exact proposal artifacts and sequence

The plan is [proposed-plan.json](evidence/phase-3e3a3e/proposed-plan.json). Exact Docker container definitions are in [container-definitions.json](evidence/phase-3e3a3e/container-definitions.json); these deliberately replace an all-at-once Compose proposal. No Compose launch command is provided or used. The monitor constructs `docker container create --pull never ...` from these hash-bound definitions, validates confinement before each start, then uses `docker start` once per created container. Those commands are proposal code only and were not run.

1. Create dedicated internal networks `justproof-phase3e3a4a-proof-internal` (`172.29.71.0/24`) and `justproof-phase3e3a4a-ledger-internal` (`172.29.72.0/24`), after name/subnet checks. Start `justproof-phase3e3a4a-proof` at `.71.10` and the proof probe at `.71.12`. Use proof-server 8.1.0's exact binary, `--port 6300 --no-fetch-params --num-workers 1`, no verbose flag, `RUST_BACKTRACE=0`, and no mounts. Pass public health/version/ready startup and dwell, then stop both containers and require exit zero.
2. Start `justproof-phase3e3a4a-node` at `.72.10`, with `CFG_PRESET=dev` and the public beneficiary from the committed Compose file. Start the node probe at `.72.12`. Future authorization must explicitly allow autonomous empty development blocks. No wallet, submitted transaction, contract deployment/call, funding, or transaction-body query is permitted.
3. Only after the node probe passes, start `justproof-phase3e3a4a-indexer` at `.72.11` and its probe at `.72.13`. The same node continues; it is never restarted. On completion or any failure, stop launched containers, retain stopped containers/networks, and finalize evidence. Any startup/configuration ambiguity fails the attempt; there is no changed configuration, permission relaxation, or modified relaunch.

The three probe containers use the existing offline runner image. They only run the hash-bound public-probe module and receive two read-only file binds: that module and the exact authorization bytes copied into durable future evidence after reservation. No committed disabled template is mounted. The output path is separately reserved and is not a host data/cache/project mount.

| Component image | Exact ID |
|---|---|
| proof-server 8.1.0 | `sha256:801bbc0340e9e96f16735f77b523f23c7459e3359842f7c79c2c53f4e994d531` |
| midnight-node 1.0.0 | `sha256:ede01da35e982b6a4b85461ad8492ae2753ef14246fba33c8039b782aa8e39fb` |
| indexer-standalone 4.3.3 | `sha256:03afd079b00bcd229df29a24771439c5e7695c339cd89216d0763ce40731cc4b` |
| offline Node runner | `sha256:e2833f0160c095894cfccd33cd48980cd524ed96e553bebb1bc388c9702354ec` |

Read-only image inspection reconfirmed those IDs. No image was pulled, built, tagged, exported, or removed.

All definitions require read-only roots, `--cap-drop ALL`, `no-new-privileges`, no restart or auto-removal, no published ports, fixed IPs, internal-only networks, and `--dns 127.0.0.1` with IP-literal service endpoints. No proxy variables, external/default/host network, secrets, wallet material, cache, managed files, or parameters are supplied. Probe UID/GID and proof UID/GID are `65532:65532`; node/indexer use `10001:10001`. Limits: proof 2 GiB/128 PIDs; node 3 GiB/256; indexer 2 GiB/256; each probe 128 MiB/32. Container memory-plus-swap equals its memory cap. Bounded tmpfs paths: proof `/tmp` 64 MiB; node `/tmp` 256 MiB and `/node` 512 MiB; indexer `/tmp` 256 MiB and `/var/run/indexer-standalone` 1 MiB. Probes need no tmpfs. Exact ownership/mode options are in the definitions.

These are characterization candidates, not assertions that node/indexer can operate under those restrictions. The indexer receives only fixed local node URLs, `undeployed`, and `RUST_BACKTRACE=0`; no secret/password fixture is injected. Missing required configuration or another required write path will stop the attempt. Image-layer changes are rejected; tmpfs contents are never read. The proposal records declared tmpfs metadata, container resources, image-layer diff, and sanitized write failures; it does not claim a complete inventory of individual tmpfs writes or inspect database contents.

## Public probes and source basis

[proposed-public-probes.mjs](evidence/phase-3e3a3e/proposed-public-probes.mjs) contains all three fixed probes, avoiding duplicate executable modules. It imports inertly even with its flag present and accepts no user-supplied target URL or request.

- Proof: bounded GET `/health`, `/version`, `/ready` to `.71.10:6300`; expected version `8.1.0`, health/readiness JSON status `ok`, matching the prior public service checkpoint. No parameter/proving claim follows.
- Node: POST the committed Compose health probe's exact public JSON-RPC `chain_getBlockHash` with `[1]` to `.72.10:9944/`. Retain only `BLOCK_ONE_PRESENT`, not the returned block hash or transaction content.
- Indexer: POST `query PublicComponentHeight { block { height } }` to `.72.11:8088/api/v4/graphql`. This projects only the installed pinned schema's `Block.height`; endpoint comes from `utils/config.ts`. Require a safe integer height at least 1 and no GraphQL errors, then reject height regression during dwell. This is public API/block-height readiness, not transaction finality or complete storage correctness.

[static-findings.json](evidence/phase-3e3a3e/static-findings.json) records exact source/declaration locations, sizes, and hashes. The installed `gen/gql.d.ts` provides `BLOCK_HASH_QUERY`, and `gen/graphql.d.ts` provides `Block.height`. No generated contract bindings or provider were imported.

Each HTTP call has a 1.5-second absolute deadline and 8,192-byte response cap. No redirects, proxies, provider retries, or remote targets are used. HTTP errors, redirects, malformed data, overflow, and explicit API errors stop immediately. Startup connection/not-yet-ready observations may repeat once per bounded poll cycle without recreating a container; after first readiness, any loss fails. Only fixed categories, boolean readiness, and a public indexer block height can be printed. Raw responses, errors, headers, and transaction/state content are never retained.

## Proposed monitor and authorization

[proposed-component-monitor.py](evidence/phase-3e3a3e/proposed-component-monitor.py) is a complete unexecuted proposal, not the earlier refusal-only scaffold. Future command:

```text
python3 docs/development/evidence/phase-3e3a3e/proposed-component-monitor.py --separately-authorized-phase3e3a4a-public-components --authorization-file /tmp/justproof-phase3e3a4a-authorization.json
```

The flag alone is insufficient. Before reservation it validates WSL/root, clean exact authorized HEAD, mode-0600 owned nonsymlink authorization, exact permission schema and hashes, images/platform/no declared volumes, required file permissions, resource/disk floors, parameter/managed/preservation inventories, absent names/paths and nonoverlapping network subnets. It rejects proxy or Docker-host/context overrides. It rechecks HEAD, clean status, and bindings immediately before reservation.

Bindings cover plan, monitor, definitions, probe, preservation baseline, production source, accepted managed manifest, parameter-candidate manifest, and all four image IDs. A later authorization must name the exact clean commit containing the reviewed proposal. The current design baseline is not an executable authorization for uncommitted proposal files.

Reservation uses exclusive creation of `docs/development/evidence/phase-3e3a4a/`, its `attempt-started` marker, and `/tmp/justproof-phase3e3a4a-public-components-attempt1`, with fsync. Exact validated authorization bytes and hash are preserved immediately in durable evidence. The public, non-secret durable copy is created mode0444 so the fixed nonroot probe UID can read its read-only bind; the original input remains mode0600. No disabled template is mounted. Neither marker nor resources are deleted automatically, including after pre-launch failure. One attempt only. The disabled template has `authorized:false`, `validForExecution:false`, `baselineCommit:null`, exact binding hashes, and unapproved review switches. Wallet/funding/proof/check/deployment/call/user-transaction/download/pull/cache-mutation permissions are all false.

### Finite proposed limits — not approved execution values

| Budget | Proposal |
|---|---:|
| Proof startup / ready dwell / component deadline | 45 / 10 / 65 seconds |
| Node startup / ready dwell / component deadline | 120 / 15 / 145 seconds |
| Indexer startup / ready dwell / component deadline | 120 / 15 / 145 seconds |
| Overall TERM / KILL initiation | 415 / 420 seconds |
| TERM-to-KILL interval | 5 seconds |
| System sample interval / maximum gap | 0.5 / 2 seconds |
| Maximum container observation age | 2 seconds |

The component ceilings total 355 seconds, leaving 65 seconds for bounded network/container commands and shutdown before the hard-stop boundary. Startup budgets are characterization limits, not measured startup guarantees. Dwell checks persistence of public readiness only. An independent watchdog requests TERM and then KILL on deadline or heartbeat failure. An unresponsive Docker daemon cannot be repaired by this proposal: cleanup failure permanently blocks the result and requires review of retained resources.

Resource floors remain: MemTotal ≥12,253,256 KiB; SwapTotal ≥8,388,608 KiB; launch MemAvailable ≥8,388,608 KiB; launch SwapFree ≥6,291,456 KiB; runtime MemAvailable and SwapFree ≥2,097,152 KiB; free disk ≥10 GiB at repository, `/tmp`, and parameter-cache filesystems. OS samples and independently refreshed Docker status/PID/resource/network observations are age-checked; an excessive sampling or telemetry gap fails instead of silently reusing stale measurements. CLI calls have bounded time/output and never log raw error output.

Status collection, sanitized logs, image-layer diff, network comparison, managed inventory, cache comparison, tracked/historical preservation, and core result finalization have independent guards. A failed action does not skip subsequent preservation checks. Any error, service exit, resource stop, unknown diagnostic, incomplete cleanup, or incomplete evidence yields nonzero. Result fields explicitly keep full-stack readiness, parameter readiness, proof generation, and cryptographic verification false.

## Bounded public diagnostics

Docker uses `json-file` with `max-size=64k`, `max-file=2`, and no compression, not `logging:none`. These are bounded public diagnostics only. The monitor limits each cumulative log capture to less than 49,152 bytes, applies fixed categories in memory, and never writes a raw line into repository evidence. Unknown diagnostics, secret/environment/body indicators, fetch/parameter-missing indicators, or oversized output fail. Probe output has a strict field/category allowlist. Raw Docker buffers remain bounded and retained with the stopped containers for review; they are not represented as a safe destination for later private witnesses.

This conservative classifier may stop on a previously unseen benign startup line. That is an intentional fail-closed characterization outcome, not permission to expand the allowlist and relaunch within the attempt. Missing diagnostics, rotated/oversized capture, or unclassified content cannot yield a successful result. No general witness-privacy or service-redaction guarantee is claimed.

## Static validation

- All new JSON parsed; both Python sources passed `ast.parse` without importing/executing the monitor.
- `static-scenarios.py`: **71 passed** synthetic assertions. It AST-selects only named pure validators/orchestration callbacks and exclusive-write helpers. File helpers operate only in a temporary mock directory. No `main`, `Attempt`, watchdog, live capture, subprocess, Docker, or networking implementation is loaded into the test namespace.
- Coverage includes exact and disabled authorization, changed bindings/permissions, resource and disk boundaries, two-second sample/telemetry limits, confinement/replacement/mount/environment failures, log budgets/private-looking content, exact phase sequence, every sequential failure point, no relaunch, exclusive write preservation, and continuing independent finalization after an injected error.
- `node --check` passed for both new `.mjs` files. Controlled import of the public-probe module with its execution flag present left active handles/resources and absent attempt paths unchanged. **11 pure response-decoder cases** passed; no HTTP request was made.
- Exact container definitions are JSON; no YAML or Compose file was necessary and no Compose command was run. These static tests do not establish Docker/runtime behavior.
- All 368 preservation entries, exact 20-file managed inventory, and exact seven-file cache inventory matched. Docker resource-name lists before/after remained identical. `git diff --check` passed. No tracked or staged file changed.

Exact validation commands and outcomes: [validation.json](evidence/phase-3e3a3e/validation.json), [static-scenarios-result.json](evidence/phase-3e3a3e/static-scenarios-result.json), and [inert-probe-validation.json](evidence/phase-3e3a3e/inert-probe-validation.json).

## Remaining decisions and limitations

Review must approve the proposed definitions, restrictive diagnostic policy, timeouts, and exact future committed hashes before considering an A4A authorization. Runtime viability of the nonroot/read-only node and minimal indexer configuration, sufficiency of tmpfs paths, public startup diagnostics, and ability to meet the strict telemetry budget remain empirical characterization questions. A failure stops without changing those constraints or retrying.

Concurrent full-stack resource readiness, parameter resolution/completeness, wallet/funding safety, proof generation, independent cryptographic verification, user-ledger operations, and R61 completion remain outside this checkpoint. The indexer/node candidate may fail immediately; ready-for-review means the bounded fail-closed plan is available, not that those components have been demonstrated to run.

## Created-file inventory

Only this report and `docs/development/evidence/phase-3e3a3e/` were created. The table below hashes proposal/evidence files before report/integrity finalization. The integrity manifest records this report's final size/hash and every evidence file except its own hash, avoiding recursion; its own hash is reported separately to the user.

| File under evidence/phase-3e3a3e | Bytes | SHA-256 |
|---|---:|---|
| `baseline-gate.json` | 671 | `1e44bbdd53216a44a5e4f3047ee8f9e6c5083c51db2b7c4a00958da2f9dc2fc2` |
| `container-definitions.json` | 7170 | `4cf206f9df72be3e75569f6d8b1abb7293735906e55116a62811e0b34d5108e6` |
| `disabled-authorization.json` | 1631 | `a518544ca88df8b8b00fa259b2dfb09284d51715b741d517f9171fac23f5b1bf` |
| `inert-probe-validation.json` | 263 | `4f084514ac3d6b3f7309a4897c19e2ea1bccb448b7e9fbeca76911b0900e0060` |
| `preservation-baseline.json` | 59268 | `4a5f2afabd8c351b88fa44483617542abb6068c4d28cff8470f6b9e1f9dd3866` |
| `preservation-results.json` | 4332 | `0c2d4f7216333271d588bcaac303833e8ce3c132147651f0553d543ee9194267` |
| `proposed-component-monitor.py` | 30517 | `7681ec733f594d6d1a182b9fcb71dd98c0ce89202e173d06bdf347c14fa67abe` |
| `proposed-plan.json` | 5202 | `0243779f76403cd02f489738f6de3c246d1531668f92ca5f8bc4b7b5d4023800` |
| `proposed-public-probes.mjs` | 5116 | `af943c52ed7ea7be89d39dd91a7716a8d4be1d18bb2af37f6ddb520f56184f17` |
| `static-findings.json` | 3713 | `161e17d51732648ed888668836706b4259b7598a50f6af9d4b71726d93d2a4e4` |
| `static-scenarios-result.json` | 6000 | `46bec3523f0a85674a55b3376efe60d67f54084c5fb5e7fb53ae541d780b19f5` |
| `static-scenarios.py` | 9066 | `b0291240b0441e1204e7669b0fbc9af93f6af683169cab6ce3ddd4da49b8e2d8` |
| `validate-inert-probes.mjs` | 2232 | `7951b4ec5ce5e4ece4aeb432e936e8445b2eb3483d735edebfe8f94298b53060` |
| `validation.json` | 1441 | `cb1894cfa62b68f0ed6b127b304a3f3c6f35a2858536d298bf6b9b23807b449c` |

Priority review files: this report, `integrity.json`, `proposed-plan.json`, `proposed-component-monitor.py`, `container-definitions.json`, `proposed-public-probes.mjs`, and `disabled-authorization.json`.

Final unstaged status:

```text
?? docs/development/evidence/phase-3e3a3e/
?? docs/development/phase-3e3a3e-r61-public-component-characterization-plan-report.md
```

No staging, commit, service launch, proof/check request, wallet, transaction, compilation, typecheck, project test, or external network operation occurred. **PUBLIC_COMPONENT_CHARACTERIZATION_PLAN_READY_FOR_REVIEW**. A4A, A4, and Phase 3E3B remain unauthorized; R61 remains open.


## 2026-09-23 — Bounded execution-safeguard correction

**Current classification: BLOCKED_PUBLIC_COMPONENT_CHARACTERIZATION_PLAN.** This addendum supersedes the earlier ready-for-review conclusion and its helper-only coverage claims. The original 19,731-byte report remains an exact prefix, SHA-256 `e4736210cec0c576a822eb591c976a47dd1199cab8dd5c5d7448919f3c55a2dc`. The previous integrity hash was `cf3d584861c3399992fd6bddb8e1b00be3ae93247baaaf5945f0c35683e5aecd`.

The baseline remained `9dc7f06aa0684f3452f8d5186c5fe127b070f966` with the required subject, canonical WSL root, and only this untracked report/evidence directory. All seven requested attachment identities matched. No A4/A4A attempt state or resource name existed. Both retained Phase 3E3A1 containers remained stopped with exit 0 before and after this correction. No Docker mutation occurred.

### Corrections and explicit remaining blockers

1. **Injected production orchestration.** The inert monitor now exports `Capabilities`, `Attempt`, `Shutdown`, and `DiagnosticStream`. `Attempt.run` is the same orchestration selected by production `main`, rather than a reimplemented test sequence. Docker/command operations, monotonic time, filesystem reservation, signal delivery, resource observations, evidence writes, and preflight validation are explicit capabilities. Production constructs its candidate `RealAdapters` only after direct-entry, disabled-flag, authorization-schema and hash gates. It then repeats the real preflight before reservation. No real adapter was constructed or run here.

2. **Continuous capture candidate replaces cumulative logs.** The new real-adapter proposal uses a single `docker start --attach` process per container, with stdout/stderr pipes and Docker logging driver `none`. No `docker logs` polling, snapshots, or rotation remain in the active adapter. Incremental classification permits at most 4,096 bytes per line and less than 49,152 cumulative bytes, retaining only public categories. Invalid UTF-8, partial final lines, EOF before observed container exit, capture-process/exit mismatch, stale capture health, or byte/line exhaustion reject the attempt. Pipes are drained in bounded chunks with backpressure; no raw line is persisted or printed by the monitor.

   **Still blocked:** available static evidence has not established the exact pinned Docker CLI's attach-before-start ordering and stream delivery guarantees. The public mocks establish the classifier behavior, not a lossless Docker transport. Therefore the earlier no-loss/no-rotation claim is withdrawn. `proposed-plan.json` explicitly sets `captureOrderingEstablished:false`; the real preflight rejects this before reservation even if authorization were enabled. Resolving it requires version-matched implementation evidence or a separately authorized public-only capture characterization. Neither was invented or performed here.

3. **Process/resource observation model.** The adapter proposes stable Docker-reported root-PID checks, bounded `docker top -eo pid,ppid,rss,pcpu`, and batched Docker statistics. CPU, memory, PID count, network I/O, and block I/O are normalized into numeric public fields and validated as nonnegative/finite by the state machine. Docker CLI size counters are rounded display values, explicitly labelled as such, not claimed exact byte counters. OS, Docker status, processes, networks, capture, and statistics have separate freshness timestamps; any age over two seconds fails. WSL RAM/swap, disk, CPU count/affinity, parsed cgroup membership, and available v1/v2 interface text are proposed observations. Large kernel limit values remain text. Docker VM cgroup paths/usage are **not** claimed visible through Ubuntu `/proc`; unobservable fields are explicit. Docker inspect limits are distinguished from direct cgroup-file observations. Process IDs/parent IDs come from Docker, not invented Ubuntu descendants.

4. **Shared shutdown coordinator.** Normal sequence cleanup, signals, and watchdog conditions use one idempotent coordinator. Each container gets at most one recorded TERM initiation, with its timestamp, and at most one KILL request after five seconds. These per-container timestamps are necessary because proof and ledger components stop in different sequential episodes. Bounded status observation is separate from signal delivery; there is no multi-container `docker stop --time 5` assumption. Natural exits and monitor-initiated exits are recorded separately. Probe exit 0 additionally requires a final successful dwell event and complete capture. Services may report 0, 143, or -15 after monitor TERM; a pre-stop service exit, OOM, unexpected exit, forced kill, or unverifiable final state cannot pass.

   **Still blocked:** the actual watchdog decision currently runs through the injected orchestration tick. Its simulation coverage does not establish an independent real deadline dispatcher capable of enforcing TERM/KILL while an adapter or daemon stalls. Individual CLI timeouts do not prove the combined 0.5-second sampling, two-second freshness, or five-second shutdown timing. The shared coordinator is tested, but real scheduling remains incomplete. The 415/420-second overall limits and all existing resource/component budgets are unchanged; they have not been silently relaxed. No execution-ready claim is made until the independent dispatcher and its interaction with the coordinator are completed and reviewed.

5. **Typed preservation and repeated gate.** Every preservation entry now records `type:regular`, size, and SHA-256. `identity()` uses `lstat`, regular-file validation, canonical nonsymlink parents, `O_NOFOLLOW`, and before/open/after inode and metadata comparisons. A symlink to identical bytes is rejected. Equivalent validation applies to proposal, authorization, managed, and cache paths. The same candidate real gate is invoked twice: initial and immediately pre-reservation. It checks HEAD/clean status/bindings, authorization bytes/owner/mode, names, Docker subnets, WSL host-route overlaps, absent paths including symlinks, images, resource/disk floors, and preservation. Exclusive reservation ownership is tracked separately from mere path existence, so a collided preexisting directory is not adopted or finalized. The real gate itself was not executed during validation.

6. **Containment wording corrected.** Results and plan now say **configured internal-network containment**. Inspected internal networks and fixed addresses are not empirical proof that every host or external route is unreachable. No egress canary was added or executed. Membership, ports, default/host networks, proxy settings, extra hosts, DNS, and subnet overlap remain rejection conditions.

7. **Public HTTP transport hardened without requests.** The probe waits for normal `end` with `IncomingMessage.complete === true`, rejects `aborted`, premature close, error, incomplete framing, unexpected trailers, duplicate framing/media headers, CL+TE ambiguity, unsupported transfer encoding, truncated/oversized content, and wrong media type. The existing 8,192-byte cap and 1.5-second deadline remain. Proof JSON and version media rules are supported by committed Phase 3E3A1 response headers (`application/json` and `text/plain; charset=utf-8`). JSON-RPC/GraphQL `application/json` is a conservative proposed rule, not a newly observed response. Chunked responses require normal parser completion. No block hash, raw body, header value, SDK exception, transaction, or state is retained. Probe output has exact kind-specific fields and a terminal `dwell-passed` event before exit 0. Transport failure is fatal, not silently retried.

8. **Outcome and finalization separated.** Results distinguish component-runtime blockage from permanent monitor/containment/cleanup/preservation/evidence failure. A cleanly finalized incompatible component may have `finalizationComplete:true` with nonzero exit. Every permanent failure sets `successPermanentlyBlocked:true`; cleanup and finalization failures make finalization incomplete. The append-only failure journal contains fixed categories/stages and monotonic timestamps only. Journal/result-write failure blocks success. Full-stack readiness, parameter readiness, proof generation, cryptographic verification, and R61 completion are always false.

### Validation performed and limits

- **99 actual production-state-machine scenarios passed**, using `Attempt.run` with explicit fakes and temporary directories. Coverage includes disabled authorization, repeated preflight rejection, exclusive reservation and exact authorization copying, every observed network/container create/inspect/start/stop/final write failure point, service/probe exit, OOM, ID/PID replacement, foreign membership, stale telemetry/capture, SIGINT/SIGTERM, watchdog TERM/KILL, command timeout/unresponsive-daemon categories, no retry/relaunch, resource retention, independent final collectors, journal/result-write failure, and the complete proof-stop-before-node sequence.
- **14 supplementary capture/preservation assertions passed**: invalid UTF-8, line/cumulative limits, partial final line, early EOF, nonregular file types, identical-byte symlink rejection, symlink-parent rejection, and an exclusive reservation collision. These supplement rather than replace the production state-machine tests.
- **24 mocked HTTP transport cases passed**, including normal proof/version/node/indexer responses, aborted/close/error/deadline/incomplete responses, duplicate/ambiguous/missing/signed framing, wrong/duplicate media, unsupported/chunked encoding, truncation/overflow, redirect/error status, and trailers. No socket or real timer was created by these mocks.
- Python controlled imports used `PYTHONDONTWRITEBYTECODE=1`, non-`__main__` names, and the execution flag in `argv`. Both monitor and candidate-adapter imports left file descriptors, child processes, threads, files, and future paths unchanged; no real adapter was instantiated. JavaScript import was likewise inert with its flag present.
- JSON parsing, Python AST inspection, JavaScript syntax checks, typed preservation comparison, and `git diff --check` passed. No project tests, typechecking, compiler, services, HTTP requests, wallet, proof, or ledger operation ran.

Two added simulation assertions initially failed and are recorded in `correction-findings.json`: the fake service status and fake capture disagreed about whether a process had exited; and a timing assertion incorrectly assumed injected failing TERM dispatch had succeeded. The fake was made internally consistent, and timing now checks the production coordinator's recorded initiation. No failed output was characterized as a compiler, contract, proof, or live-service failure.

The old AST-only 71-case files and their validation record remain as superseded pre-correction history; they are not the active orchestration validation command. `pre-correction-identities.json` preserves prior identities and the complete former result. The new principal test imports the actual state machine; it does not AST-extract or duplicate that state machine. Real OS/Docker adapter bodies remain syntax-inspected proposals, not proven live behavior.

Exact validation commands:

```text
PYTHONDONTWRITEBYTECODE=1 python3 docs/development/evidence/phase-3e3a3e/python-inert-import-check.py
PYTHONDONTWRITEBYTECODE=1 python3 docs/development/evidence/phase-3e3a3e/production-simulations.py
node --check docs/development/evidence/phase-3e3a3e/proposed-public-probes.mjs
node --check docs/development/evidence/phase-3e3a3e/mock-probe-transport-tests.mjs
node docs/development/evidence/phase-3e3a3e/mock-probe-transport-tests.mjs
```

Additional validation used inline Python `ast.parse`, `json.loads`, `lstat`, and streaming SHA-256 checks; `git diff --check` and new-file whitespace checks. An early public-only test stdout capture used `/tmp/jp-static-simulation-result.json`; it is not an A4A output, authorization, or marker. Authoritative final results are under this evidence directory.

### Preservation and current identities

All 368 typed preservation entries, 20 managed artifacts, and seven parameter-cache files matched. All historical phases, including the old guard, remain unchanged. No numerical resource floor or component timeout changed. The disabled authorization remains disabled with null baseline and false execution flags; it now binds the candidate real-adapter module too. A4A/A4/3E3B remain unauthorized. No resource, image, file, or runtime compatibility is inferred from simulated success.

The following table identifies changed/new evidence, relative to the attachment baseline. Unchanged files remain in the refreshed integrity inventory. Report and integrity hashes are recorded separately to avoid recursive hashing.

| Evidence file | Change | Bytes | SHA-256 |
|---|---|---:|---|
| `container-definitions.json` | modified | 7363 | `266635d3fcabf85efa2d45af6382033e29f813b77a2c6cdf6bb2b50ddd27c28b` |
| `correction-findings.json` | created | 4137 | `ede6bf09b6527416c463ac340a17e2e41ed2ce8032abb0bb6cffe78826ec01b4` |
| `correction-preservation-results.json` | created | 4867 | `3999e4b4d25e2f01f7ffd76ac41ecf351e2bbc0807157107cbaff0837656aa9f` |
| `disabled-authorization.json` | modified | 1725 | `764461397fea90ab27af78438de7e8f44177eced3182edd14c34af7e4b3a0421` |
| `mock-probe-transport-results.json` | created | 1141 | `7fddae80e428056460cf397215c88b4e6164ffd29dd6b62c50b4e5373375cb63` |
| `mock-probe-transport-tests.mjs` | created | 4849 | `8771a5b5fbe941d87268ceac81b0bd6529dc1cc2c3de697c0607f7e3ba2732f4` |
| `pre-correction-identities.json` | created | 9629 | `acab518f730b0a1dadb4ddd8d1b875e98fcac9345cb46b1910b6c949ed374741` |
| `preservation-baseline.json` | modified | 67732 | `3c37c6a00666970f133b13275bc1224aa3293d496bf8f59677f312f85c5277cb` |
| `production-simulation-results.json` | created | 9010 | `63fdb260fa3a1d16b257fc5c5a6ff678a16a5003be0bbc4af09fea0c534ae99d` |
| `production-simulations.py` | created | 12305 | `a5a438130864e3ba5c368e384419e6f9ed3ef1f7a16e313123df05157f7c667e` |
| `proposed-component-monitor.py` | modified | 25097 | `5b5fc4451b291055562986439ec231b25d81c9e1082a59a6e77b82702947c7cb` |
| `proposed-plan.json` | modified | 6334 | `ec86c132243e4e17d5c36cad061046f2db1f0c440183b9d6635ca437414edd7c` |
| `proposed-public-probes.mjs` | modified | 7215 | `eaaa30bbc5693f81426b1ed4173a7d05fe84791fcef61614a136505c761ce0af` |
| `proposed-real-adapters.py` | created | 19085 | `26ff33d193d1e136886bf8b052b5c5cc4fb24d857e63bcb5c09821ff73165a9a` |
| `python-inert-import-check.py` | created | 1658 | `ad65b643353ba8c0194a93740c66b5cb3f44e33727e272c36f813dfd62e012e0` |
| `python-inert-import-result.json` | created | 293 | `9282dbf8fefc7b685fbf700d8b9d4db5e86cce3c88a79134eea734efc63b8231` |
| `validation.json` | modified | 2766 | `1e02b3083b02e6638b7ff6183b9a8ccb0f3058a3da3708d2aba703c0053fddf6` |

The report is append-only for this correction. `integrity.json` is refreshed, excludes its own hash, and retains the prior integrity hash and exact original report-prefix identity. The final report/integrity hashes and exact complete inventory are supplied by that manifest and the final response.

Final Git status remains only the existing untracked Phase 3E3A3E report and evidence directory. No staging or commit occurred. **BLOCKED_PUBLIC_COMPONENT_CHARACTERIZATION_PLAN**: capture ordering and independent real deadline enforcement still require resolution and review. A4A, A4, and Phase 3E3B remain unauthorized; R61 remains open.
