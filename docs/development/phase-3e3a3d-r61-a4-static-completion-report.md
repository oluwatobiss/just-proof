# Phase 3E3A3D — A4 static plan completion adjudication

2026-09-18. **BLOCKED_PARAMETER_OR_FULL_STACK_PLAN**.

The new guard and its public tests are substantially hardened. A4 is **not safely executable**: parameter resolution, complete indexer storage/write paths, full-stack compatibility and monitoring remain unestablished. The monitor is an inert refusal-stage scaffold, not a completed service supervisor. Its exact proposed command always refuses before reservation; no missing implementation is represented as passed. No Midnight service, provider, wallet, proof, contract or user transaction ran.

## Baseline and preservation

WSL, canonical repository root; initial Git status empty. HEAD `efb6ec32eae6d43decf88daa9c631b3bc87240c7`, subject `docs(protocol-v2): Record R61 contained runtime scaffold`. All seven required explicit SHA-256 identities matched, as did every Phase 3E3A3C integrity entry including image and public-runtime evidence. Prior evidence is unchanged. All 20 managed files and exactly seven compiler-cache files match their accepted size/hash inventories; local preservation hashes are not official authenticated parameter checksums.

Read-only Docker baseline confirmed retained runner image `sha256:e2833f0160c095894cfccd33cd48980cd524ed96e553bebb1bc388c9702354ec`. Both Phase 3E3A1 containers remain stopped with exit0. No image rebuild/tag/export/push/prune/removal occurred. All historical proposal copies remain byte-identical. New files exist only in this report and phase-3e3a3d evidence directory.

## Public-image configuration adjudication

Exact commands and filtered outputs are in entrypoint-filtered-inspection.json and writable-path-metadata.json. Each inspection used --rm --pull never --network none --read-only --cap-drop ALL --security-opt no-new-privileges, no mounts, /bin/sh override. Only script lines relevant to configuration/write paths/readiness and filesystem metadata were read. No image service entrypoint was invoked.

**Node 1.0.0:** image ID `sha256:ede01da35e982b6a4b85461ad8492ae2753ef14246fba33c8039b782aa8e39fb`; Config.User=root, BASE_PATH=/node/chain. /entrypoint.sh lines4–33 select --base-path or BASE_PATH, mkdir if missing, then exec /midnight-node. /node is mode0755 owner10001:10001; /tmp is01777 root. Thus the earlier guessed /data mount is replaced in the proposal by bounded /node tmpfs with UID/GID10001. This identifies storage intent but does not prove the binary needs no other writable paths. CFG_PRESET=dev is present in committed Compose; its exact binary behavior, capability compatibility and startup under nonroot remain unresolved. No inference from a variable name substitutes for that evidence.

**Indexer 4.3.3:** image ID `sha256:03afd079b00bcd229df29a24771439c5e7695c339cd89216d0763ce40731cc4b`; user appuser, working directory /opt/indexer-standalone. /var/run/indexer-standalone mode0755 owner10001:10001; public executable /usr/local/bin/indexer-standalone metadata recorded. The entrypoint traps removal of the running marker, touches it, then starts the process. Marker presence alone is not backend/API readiness. No complete storage/write-path configuration was found in the bounded inspection. Read-only-root compatibility therefore remains unknown; the template must not be launched.

**Proof server 8.1.0:** exact ID `sha256:801bbc0340e9e96f16735f77b523f23c7459e3359842f7c79c2c53f4e994d531`; Config only establishes PATH and PORT, no cache volume or explicit HOME/XDG resolver. Existing help/metadata evidence proves neither required filenames nor compatibility. No executable string search was used to invent resolver semantics. The retained Node runner image identity/configuration is unchanged.

image-configurations.json records the four public configurations. No real environment/secrets were captured. No new image or network/service was created; only bounded ephemeral inspection/mock containers were auto-removed.

## Parameter allowlist: completeness UNKNOWN

parameter-allowlist.json separates required-present, required-absent, candidate-only and unresolved. No file is promoted from candidate to required without evidence. The seven existing host compiler files are candidate-only: bls_midnight_2p6, 2p7, 2p9, 2p13, 2p17, 2p18, 2p19. Each entry records exact accepted size/hash plus current type, mode and owner. Hashes are preservation evidence only.

Unresolved: proof-server resolver location, HOME/XDG behavior, all-four-contract required parameter-name set, native-wallet proving dependencies, compatible filename mapping, nonroot directory traversal and safe mount destination. File world-read permission alone is not proof of access through parent directories or inside a container. No mount is proposed until resolved. Required-present and required-absent are empty because requirement identity is unknown, not because every parameter is present. Downloads, additions, mutation and inferred completeness are prohibited. Seven compiler files cannot presently be certified as satisfying the service/native set.

## Guard framing and privacy

Pinned call path: midnight-js-http-client-proof-provider4.1.1 makeHttpRequest passes a Uint8Array with application/octet-stream; cross-fetch4.1.0 node ponyfill delegates to its installed node-fetch. node-fetch/lib/index.js around199 converts ArrayBuffer views to Buffer; around1344–1350 getTotalBytes writes Content-Length. Exact files/hashes are in static-findings.json. The guard supports positive buffered lengths, not arbitrary streams/chunked input; a future SDK version or configured header override must be re-reviewed.

Corrected guard proposal keeps production upstream172.28.61.10:6300 and listener172.28.61.11:6301. Exact POST /check or /prove only, one application/octet-stream header, one positive canonical decimal Content-Length, maximum128MiB request. Transfer-Encoding, Expect, Trailer, duplicate/malformed/zero/oversized lengths are rejected (some malformed framing is rejected by Node's HTTP parser first). It forwards the validated Content-Length and fixed media type only; client Host, Authorization, Cookie, redirect and logging headers are not forwarded. Destination is fixed numeric IP; no redirect implementation exists. All upstream non-200/3xx failures produce constant bounded errors without Location or raw response text. Successful response limit32MiB; deadline2700s; header timeout10s; concurrency1. Bounds are proposal limits, not validated JustProof payload/performance sizing.

Streaming uses backpressure. Request limits, response-size overflow, client disconnect and timeout destroy the upstream and release the slot. After successful headers are sent, later overflow/disconnect may cause a truncated stream/socket rejection rather than a new constant HTTP status; this is recorded as failure and must never be accepted as a complete proof response. No request/response/exception/body logging exists. Main requires exact direct-entry flag and later bound authorization. It validates basic guard-specific authorization; the future supervisor must additionally validate the entire authorization contract before launching it. Disabled template cannot start it.

Counters: inboundRequests counts request events (including rejected parsed requests) plus parser-only initial malformed connections; eligibleForForwarding increments only after all allowlists/concurrency gates; upstreamRequestsCreated increments after actual http.request construction; completedUpstreamResponses counts complete upstream response streams, including complete error/overflow responses—not successful proofs. Rejections use fixed categories; parser errors are deduplicated per socket. Parser rejection is connection-level because arbitrary malformed bytes do not define a reliable HTTP request count. Parsed pipelining counts through request events; the counter is not a packet counter. This limitation is explicit.

The in-memory publicCounters accessor returns a detached sanitized snapshot. Direct main can emit only that snapshot upon SIGUSR1. A future monitor transport for this channel is not complete: current Compose logging=none does not provide a captured log channel, and Docker attach/signal collection remains to be designed. Thus counters are exposed for integration but not claimed monitored in A4. No bodies, headers or URLs appear in counter data.

## Public guard validation

Only loopback mock upstreams inside the retained network-none/read-only/nonroot runner image were used; no SDK provider/proof server. The final test explicitly reports **18 passed assertions/scenarios**, with exact aggregate counters:

- inboundRequests17; eligibleForForwarding6; upstreamRequestsCreated6; completedUpstreamResponses4.
- REDIRECT1, UPSTREAM_STATUS1, METHOD1, PATH1, MEDIA_TYPE1, LENGTH2, OVERSIZE1, PARSER6, FRAMING1, CONCURRENCY1, TIMEOUT1, CLIENT_DISCONNECT1, RESPONSE_SIZE1.

Tests cover 200 streaming and exact forwarded length; redirect/non-200; method/path/media type; missing/signed/duplicate/zero/oversized lengths; unsupported transfer framing; concurrency; timeout; partial client disconnect; response overflow; exact counters; no error canary echo or Location. Parser rejection and completed response are not conflated with proof verification. This is bounded test coverage, not a comprehensive HTTP security audit.

Historical attempts are preserved: validation1 failed with a constant diagnostic; validation2 identified numeric expected18 versus actual14 parsed requests; validation3 corrected that expectation and passed; validation4 added parser-category deduplication and passed; validation5 added parser-only initial connections to inbound count and asserted all exact final counters, passing. These are public proposal-test corrections, no proof/service retries. The final source is the validation5 source.

Final inert-import check set the accepted guard flag in argv then imported guard, health, idle and test modules; active handles/resources and read-only file inventory remained unchanged. No main ran through import. Public tests ran only afterward under their explicit public flag. Exact commands/stdout/stderr/exits are saved. No raw private input existed.

## Topology and static rendering

proposed-compose.yml pins all four exact image IDs; pull_policy never; no build, restart, published port, host network or external network. Two internal networks with fixed numeric addresses, proof membership runner/guard/prover and ledger membership runner/node/indexer. DNS is configured to loopback; actual Docker embedded DNS and routing isolation still require later public validation, not assumed from YAML. Read-only roots, capability drops, no-new-privileges, PID256 caps and bounded memory/tmpfs are explicit. Bind mounts use create_host_path=false, read-only. No accidental directory creation from a missing authorization path.

Node /node and indexer readiness-marker mounts reflect new metadata; other indexer writes/backend configuration remain unresolved. Nonroot10001 proposals match observed directory owners but operational compatibility is not established. Memory caps remain prover2GiB, node3GiB, indexer2GiB, runner512MiB, guard256MiB, plus bounded tmpfs overhead; limits are not proof of actual idle headroom. Parameter mount is intentionally absent. `x-unresolved.launchAllowed=false` is documentary, not a Docker enforcement mechanism; the monitor refusal is the actual no-launch safeguard.

Static render only:

```text
docker compose --env-file /dev/null --file docs/development/evidence/phase-3e3a3d/proposed-compose.yml config --no-interpolate --format json
```

Exit0; exact rendered configuration retained. No create/up/start was run. The public proof health module only supports fixed /health,/version,/ready endpoints, bounded4096-byte response, two-second timeout, no redirects, constant results. It was syntax/import checked, not executed. Node/indexer health implementation remains missing because readiness/backend behavior is unresolved. A complete runnable Compose topology is therefore not claimed.

## Monitor, plan and disabled authorization

Priority files: proposed-plan.json, proposed-a4-monitor.py, proposed-compose.yml, parameter-allowlist.json, proposed-redirect-guard.mjs, disabled-authorization.json, integrity.json.

Exact proposed monitor command (not executed):

```text
python3 docs/development/evidence/phase-3e3a3d/proposed-a4-monitor.py --separately-authorized-a4-service-preflight --authorization-file /tmp/justproof-phase3e3a4-authorization.json
```

It checks full authorization structure, clean exact root/baseline and all bound hashes; disabled flags never authorize anything. It then **unconditionally refuses** with nonzero status before reservation because the service supervisor is incomplete. This is a refusal-stage scaffold, not fulfillment of the requested complete one-attempt monitor. It contains no service launch, reservation, sampling, stopping or result-finalization implementation. These requirements remain unmet; copying a speculative monitor would overstate safety.

The plan records the proposed future Compose up invocation with --no-build --pull never, but it is not approved or executable through this monitor. Required future durable marker is docs/development/evidence/phase-3e3a4/attempt-started; output /tmp/justproof-phase3e3a4-public-service-attempt1. Future complete monitor must validate all bindings first, reserve with exclusive creation/fsync, immediately copy exact authorization bytes/hash, never retry/delete marker, monitor all process/container/WSL/network/cache/health dimensions, and retain stopped resources with independently guarded cleanup/evidence. None of that attempt state exists.

Disabled authorization: authorized=false, validForExecution=false, phase3E3A4, explicit hashes for plan/monitor/Compose/guard/idle/health/allowlist/source/managed manifest/image config plus all four IDs. Clean committed proposal baseline remains null. Unresolved fields listed. Only future autonomous empty dev blocks are permitted in the template; wallet/funding/proof/check/deploy/call/user transaction/download/pull/cache mutation permissions are false. This is not an executable authorization.

Resource floors unchanged: MemTotal12,253,256KiB; SwapTotal8,388,608KiB; launch availableRAM8,388,608KiB/freeSwap6,291,456KiB; runtime floors2,097,152KiB each; sampling0.5s, maxgap2s, TERM→KILL5s, disk10GiB. Post-all-services-ready headroom must be checked. Startup/dwell/hard timeout values remain null because no full-stack readiness behavior is established; no unjustified values are silently selected. This explicitly unmet requirement also prevents readiness classification.

## Completion limits and preservation

JSON/YAML parsing, final static Compose render, JS syntax/inert-import checks, Python AST (no import/execute), public guard tests and preservation comparisons passed. No TypeScript proposal was added; no typecheck/project test/compile/proof/wallet/ledger operation occurred. Historical cache/source/evidence and image identities remain unchanged. No parameter content inspection outside authorized host preservation hashing occurred. No A4/B marker, output or authorization was created.

Remaining blockers: resolver/name/compatibility/mount evidence; complete indexer storage/write paths; proven dev/nonroot/capability behavior; node/indexer public readiness probes; complete supervisor authorization/reservation/monitor/cleanup implementation and justified timeouts. Independent verification remains an open R61 item but does not itself block metadata-only A4. A4 and B remain unauthorized. Nothing staged or committed.

## Created inventory

Exact hashes below; integrity.json additionally records this report and excludes its own hash.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| compose-render-validation.json | 328 | `ea85ec4ad5c5a8f8959560b1b163640cd43f13c9af0ca834235275811a6eb20d` |
| disabled-authorization.json | 2200 | `1afa5f6a6859983a3998b9844b7deb2032269626c319cea07c06a095e2ac0379` |
| entrypoint-filtered-inspection.json | 1840 | `42740bb007f0fd744fe9e78ff691ca086dba51ed7bb95b3b4541586401e196ef` |
| guard-validation-1.json | 585 | `461290729581bd0ab2f6052453192d0d5218c8adffb6172e5fa34c536f7124df` |
| guard-validation-2.json | 634 | `b5961cc41b04fbd5b21bff71cf2ea95657aeaadeef9f0a5f339210b9dfca5057` |
| guard-validation-3.json | 1168 | `0a045e6187d95a25785b660a15f718aaa28334fb0b4506acc19f31307316f141` |
| guard-validation-4.json | 1148 | `71dbf0f1bf4ee8cedb64014d6ae6b7eff4db18e3458e666c7a1d2312644b147a` |
| guard-validation-5.json | 1229 | `d48bc6637e8d7e8e926364fbdd9fc21724b179ce20ec04582cd2654349f0140f` |
| image-configurations.json | 5371 | `4016007d6c2b292ae71c508b13fda41626c123351c15dd3dc77a8ad022423c7d` |
| inert-import-validation.mjs | 836 | `7f2eeae8efd54262bfa0d0048c52c94dd1f85f92667a6463f222356bdae403b8` |
| managed-artifact-manifest.json | 2857 | `9e0695100e7f8bdfcbf46741828341930750d330b1b45058f86713d0e1364a26` |
| parameter-allowlist.json | 4251 | `97698106692ae4ade59e998ac1f707c613930354fdaaaa905939bebc167502a0` |
| preservation-baseline.json | 54865 | `ec3836e7a59b3c4dabcec02e57c1cdbbc7de8a8a2af448d7c41e2c8494e6f91f` |
| proposed-a4-monitor.py | 3607 | `7f895d00e5e335f434965e3228a6c1664c65af41f5fc02afb5ce99ef0d00541f` |
| proposed-compose.yml | 3288 | `adab24ceff3bff4cc9f29ef75bc8ad13cc6d5a1aa345eef1e892b0bbe7eee2a3` |
| proposed-idle-runtime.mjs | 414 | `28606ce9b7ddf7a0ae5263e5a368ccb20235f79217f4329b80c3ca9242f1cfdf` |
| proposed-plan.json | 3855 | `8eabc39f0f1fb5ca5efc5f91b24cdec0333ea76c48b9c7d72ce2406400edf37c` |
| proposed-public-health.mjs | 1327 | `03eeb4010efebd5f7eb4b30134a564e55e700189446e0d13bb43d77d07c91b92` |
| proposed-redirect-guard.mjs | 5381 | `851c36140554f58f57fceac4365885b5353acba8b5c297ff6b29c4626f8da3b6` |
| public-guard-tests.mjs | 5825 | `557f1dfddd5062c9ce9a8eda214ec34e9115e39fbdeee2a8b15483d6f5800096` |
| rendered-compose.json | 6288 | `f81f9facd74a29bccabe084a44457f0552346af27683e7bf1d284bd59da15b48` |
| static-findings.json | 2454 | `22bfba5df83241c2d5a21b7574020d6bf64545dca5f8bb92f9f06c698e620d08` |
| writable-path-metadata.json | 1928 | `43999fcdd0ccb7268a7202cfe46c5033f18b156d1ab6520646ffb188db3cb6b2` |

Also created: `integrity.json` (self hash intentionally excluded).

Final Git status:

```text
?? docs/development/evidence/phase-3e3a3d/
?? docs/development/phase-3e3a3d-r61-a4-static-completion-report.md
```
