# Phase 3E3A1 — Local proof-service-only preflight

Date: 2026-09-17. Classification: **BLOCKED_LOCAL_PROOF_SERVICE**.

The isolated container started, but all three one-shot loopback GETs failed to connect. No canary POST was sent. The container stopped gracefully and was retained with its internal network. Phase 3E3B remains unauthorized and R61 remains open.

## Baseline and preservation

HEAD `28e906388e6558cb037f57ffa2973429fe859a13`, subject `docs(protocol-v2): Record R61 proof-verification capability gate`. Initial Git status was empty. WSL kernel `5.15.146.1-microsoft-standard-WSL2`; canonical repository `/home/oluwatobiss/projects/midnight/risein/just-proof`. The five required Phase 3E3A hashes matched before service work. The 20 managed artifacts matched promotion.json and remain unchanged, regular, nonempty and ignored.

**Final preservation discrepancy:** after continuation, the 20 retained Phase 3E2B temporary output files and `/tmp/justproof-phase3e2b-authorization.json` are absent. They are listed individually in observations.json. The earlier task record reported preservation before service work; the cause/timing of loss is unknown. No cleanup, reconstruction or overwrite was performed by this preflight. Complete retained-/tmp preservation cannot now be confirmed. All remaining 262 baseline files match, including source, historical/Phase 3E2B repository evidence, managed artifacts and host cache. This discrepancy is separate from the loopback networking failure and requires review.

## Docker inventory and image

Docker client/server 29.7.2, API 1.55; Docker Desktop 4.90.0 (238679), Compose v5.5.1. Context default, endpoint unix:///var/run/docker.sock, Linux amd64 daemon on WSL. Initial running-container and JustProof Compose-container queries were empty. Initial networks: bridge, example-hello-world-001_default, host, none. Initial volume inventory empty; port 6300 unused. Proposed container/network names were absent.

The ordinary resolved Compose proof-server uses image 8.1.0, command `midnight-proof-server -v`, RUST_BACKTRACE=full, loopback port 6300 and default network. It was inspected only; Compose was not started or edited.

Local image ID/repository digest: `sha256:801bbc0340e9e96f16735f77b523f23c7459e3359842f7c79c2c53f4e994d531`; Linux amd64, 26,730,919 bytes, created 1970-01-01T00:00:01Z. Exact entrypoint, command, exposed port and optional fields are in image.json. Entrypoint is Nix bash with -c; command invokes the Nix proof-server with --port $PORT. User/Volumes absent; 6300/tcp exposed. No image pull/build/update occurred.

## Help and isolated launch

Exactly one ephemeral help-only command:

```text
timeout --signal=TERM --kill-after=5s 20s docker run --rm --pull never --network none --entrypoint /nix/store/6naj0x3l5n0b4cx722xwasyp597p6z3h-ledger-8.1.0/bin/midnight-proof-server midnightntwrk/proof-server:8.1.0 --help
```

Exit 0, elapsed 0.400686769 seconds. No mounts, ports or network; automatic removal. help.txt is transcribed from the earlier tool output, not a direct stream capture. Help confirms --no-fetch-params; port default 6300; num-workers default 2; job-capacity default 0; job-timeout default 600; optional verbose flag and corresponding MIDNIGHT_PROOF_SERVER_* environment options. No cache/parameter-source option is listed.

Created once: `docker network create --driver bridge --internal justproof-phase3e3a1-internal`. ID `c8156d022d15008cacaed4da76f70e8385a45b59ba5d49be594149ee672c957a`. Internal=true, IPv4 subnet 172.18.0.0/16, gateway 172.18.0.1; IPv6 disabled. No external network attached or external connectivity request sent.

Exactly one retained launch:

```text
docker run -d --name justproof-phase3e3a1-proof-server --pull never --network justproof-phase3e3a1-internal --publish 127.0.0.1:6300:6300 --restart no --env RUST_BACKTRACE=0 --entrypoint /nix/store/6naj0x3l5n0b4cx722xwasyp597p6z3h-ledger-8.1.0/bin/midnight-proof-server midnightntwrk/proof-server:8.1.0 --port 6300 --no-fetch-params --num-workers 1
```

No mounts, host cache, project, managed artifacts, credentials or unrelated environment variables were supplied. No verbose flag, no restart policy; RUST_BACKTRACE=0. Startup wait was bounded to 15 one-second checks. Logs promptly reported listening on 0.0.0.0:6300. The eight Actix HTTP workers in logs are distinct from the requested --num-workers 1 proving-worker setting; proving concurrency was not tested.

HostConfig.PortBindings requested 127.0.0.1:6300, but startup NetworkSettings.Ports was `{"6300/tcp": []}`. The internal bridge configured egress isolation, but loopback publication did not work. **The required combined pre-launch assurance of denied egress with retained loopback access was not established:** launch relied on the requested Docker configuration, which proved insufficient. This is a procedural limitation, not a passed networking gate. No bypass, reconfiguration, second network or restart was attempted. The exact Docker networking cause remains unestablished.

## Endpoint observations

Exactly once each, curl used --retry 0 --max-redirs 0 --noproxy '*' --connect-timeout 2 --max-time 5, without -L. Complete commands/results are in endpoints.json.

| Endpoint | Exit | HTTP response | Seconds |
| --- | ---: | --- | ---: |
| /health | 7 | None (curl 000) | 0.021136136 |
| /version | 7 | None (curl 000) | 0.010176533 |
| /ready | 7 | None (curl 000) | 0.006437295 |

All reported failure to connect to 127.0.0.1:6300. Headers are empty; body files were never created because no response arrived. No redirects or retries occurred. Live version 8.1.0 and readiness were not established despite the pinned local image identity.

No malformed /prove canary was sent because all three prerequisite endpoints failed. No /check or /prove request of any kind occurred. Request-body logging privacy remains untested.

## Logs, parameter observations and stop

Complete Docker log streams are saved in container-stdout.txt and container-stderr.txt with timestamps/ANSI formatting. No secret material was supplied; no secret redaction was necessary. INFO startup and SIGTERM shutdown appear. json-file is the logging driver. Absence of private data from these logs is not evidence of safe valid-witness logging.

No mounts or declared volumes; Docker diff output empty. No parameter fetch appears in logs. Embedded parameter/cache paths, filenames, types and sizes could not be established from these observations. No parameter contents were read/copied from the container, no host cache was mounted, and no parameter download was performed. Configuring --no-fetch-params does not establish all-four-circuit parameter availability.

`docker stop --time 10 justproof-phase3e3a1-proof-server` exited 0; Docker emitted a --time deprecation warning. Final inspection records exited, PID0, exit0, OOMKilled=false, no error. Started 2026-09-17T05:15:43.38756536Z; finished 2026-09-17T05:16:35.109705696Z.

Retained stopped container `justproof-phase3e3a1-proof-server`, ID `96c7a7bdb3479175848586f4d6c4583d7f3987c7abfe9a2be45d391c10e4737a`; retained network `justproof-phase3e3a1-internal`. Neither was removed or restarted. No Docker operation was repeated after continuation.

Initial sandbox Docker reads failed with permission denied and succeeded with approved socket access. An image template referencing absent optional Config.User failed; full read-only inspection resolved it. Neither diagnostic caused an additional help/service launch.

## Validation and scope

All new JSON parses; git diff --check passes. Integrity evidence records byte sizes/hashes, preservation discrepancies, exact managed comparison and final status; its own hash is excluded. No builds, tests, typechecking, circuit execution, keys, proofs, verification, wallet, provider, ledger, Preview/Preprod, deployment, package changes, staging or commit occurred. The full Compose stack was not started. No speculative verifier adapter was pursued.

## Created files

Only this report and the following evidence files were created:

- `docs/development/evidence/phase-3e3a1/container-stderr.txt`
- `docs/development/evidence/phase-3e3a1/container-stdout.txt`
- `docs/development/evidence/phase-3e3a1/docker-version.json`
- `docs/development/evidence/phase-3e3a1/endpoints.json`
- `docs/development/evidence/phase-3e3a1/filesystem-diff.txt`
- `docs/development/evidence/phase-3e3a1/final-inspection.json`
- `docs/development/evidence/phase-3e3a1/health-headers.txt`
- `docs/development/evidence/phase-3e3a1/help.txt`
- `docs/development/evidence/phase-3e3a1/image.json`
- `docs/development/evidence/phase-3e3a1/launch.json`
- `docs/development/evidence/phase-3e3a1/network.json`
- `docs/development/evidence/phase-3e3a1/observations.json`
- `docs/development/evidence/phase-3e3a1/preservation-baseline.json`
- `docs/development/evidence/phase-3e3a1/ready-headers.txt`
- `docs/development/evidence/phase-3e3a1/startup-inspection.json`
- `docs/development/evidence/phase-3e3a1/stop.json`
- `docs/development/evidence/phase-3e3a1/version-headers.txt`
- `docs/development/evidence/phase-3e3a1/integrity.json`

Final Git status:

```text
?? docs/development/evidence/phase-3e3a1/
?? docs/development/phase-3e3a1-r61-local-proof-service-preflight-report.md
```


## 2026-09-17 — User-authorized restart adjudication and single loopback recovery

Current classification: **LOCAL_PROOF_SERVICE_RESPONDS_AWAITING_PRIVACY_AND_INTEGRATION_PLAN**. This supersedes the service-response classification above without rewriting its historical findings. The exact original 9,286-byte report prefix remains unchanged.

### Restart and durable checkpoint

The user confirmed a computer restart during the preflight window. Current kernel boot time is 2026-09-17T14:35:31Z. `/tmp` currently resides on ext4 (`/dev/sde[/tmp]`), not a demonstrated tmpfs. Available tmpfiles configuration includes `D /tmp 1777 root root 30d`; relevant policy lines are preserved in restart-adjudication.json. These observations do not prove which cleanup mechanism ran or the exact deletion time.

The missing historical Phase 3E2B temporary output and authorization are consistent with the confirmed restart and their ephemeral location. They were not reconstructed. Their loss does not authorize another attempt or reuse of old authorization. All 262 durable baseline files still match, including committed Phase 3E2B evidence, its durable attempt marker, source and cache. All 20 promoted managed artifacts match promotion.json. The accepted key-generation checkpoint is not invalidated by this loss. Future comparisons distinguish durable evidence from historical /tmp observations.

HEAD remains `28e906388e6558cb037f57ffa2973429fe859a13`, with the accepted subject. Only this report and evidence directory were additions. Every previous evidence hash passed before recovery. Port 6300 was unused and no container was running; the new recovery name was absent. Phase 3E3B paths remained absent.

### Original resources and recovery boundary

The original container remained stopped with exit 0, exact image identity, unchanged complete logs and empty filesystem diff. Its internal network remains Internal=true. HostConfig requested loopback publication, but effective stopped Ports is empty (startup had 6300/tcp with an empty binding list). Logs establish that the original process listened on 0.0.0.0:6300 internally. The failure was in host publication/network reachability, not evidence of failure to start the server.

The user separately authorized ordinary bridge networking for public probes only. This network permits outbound connectivity and is **not approved for future private proving**. No external request was deliberately made. No-fetch was enabled; no mounts or private data were supplied.

Exactly one recovery launch, with Docker's exclusive container-name reservation, no relaunch:

```text
docker run -d --name justproof-phase3e3a1-loopback-recovery --pull never --network bridge --publish 127.0.0.1:6300:6300 --restart no --env RUST_BACKTRACE=0 --entrypoint /nix/store/6naj0x3l5n0b4cx722xwasyp597p6z3h-ledger-8.1.0/bin/midnight-proof-server midnightntwrk/proof-server:8.1.0 --port 6300 --no-fetch-params --num-workers 1
```

After a bounded two-second startup wait, inspection confirmed `127.0.0.1:6300 -> 6300/tcp`. Container ID `c2181a30ee9ae4fc480509473c5d11ecaf1b9ab0645feddf77cf73ebef3b202e`. Exact image and connection metadata are preserved in recovery-startup-inspection.json and recovery-bridge.json. No host cache, project, keys, ZKIR, credentials, wallet or .env was mounted.

### Public endpoint and canary observations

Each GET ran once with retries, redirects and proxies disabled, two-second connection and five-second total timeout. Exact commands, headers and bodies are retained separately.

| Endpoint | HTTP | Curl exit | Elapsed seconds |
| --- | ---: | ---: | ---: |
| /health | 200 | 0 | 0.027715069 |
| /version | 200 | 0 | 0.006849215 |
| /ready | 200 | 0 | 0.007242489 |

Version body was exactly `8.1.0`. Health and readiness returned status ok; readiness reported zero processing/pending jobs and capacity 0. No redirects occurred.

The single malformed POST sent only `JP_PHASE3E3A1_RECOVERY_CANARY_NOT_PRIVATE_20260917` via raw curl. HTTP 400, curl exit 0, with a header-tag parser rejection. The error body **echoed the public canary**. It was absent from the complete container logs, which show only the request-start/access entries. This establishes only that this particular malformed body was not observed in container logs; it does not establish general redaction or private-input safety. Future handling must account for response/error text that can contain input bytes. No valid preimage or proof material was sent. Parser rejection is not proof generation or verification.

### Parameters, connections and retained resources

Logs show requests from Docker bridge gateway 172.17.0.1 and the internal listener, with no fetch, attempted-fetch or missing-parameter message. Docker diff remains empty; mounts are empty. No visible changed parameter/cache path exists to inventory. Embedded parameter filenames/types/sizes and all-circuit availability remain unverified; health/readiness do not establish those facts. No parameter contents were read/copied or downloaded.

Exactly one `docker stop --timeout 10 justproof-phase3e3a1-loopback-recovery` completed successfully. Final state exited, exit 0, PID 0, no OOM or error; finished 2026-09-17T15:16:01.329617981Z. Retained resources: original stopped container, original internal network, and stopped recovery container. Nothing removed, restarted, reconnected or pruned. Complete logs and inspections are preserved.

No proof, circuit, key operation, Compose/node/indexer, wallet/provider, ledger, network deployment, test, typecheck, compile, staging or commit occurred. Phase 3E3B remains unauthorized and R61 remains open.

### New evidence and validation

All original evidence remains unchanged except the explicitly refreshed integrity.json, whose prior identity is retained there. JSON parsing, durable/managed preservation comparisons, report-prefix verification and git diff --check pass. New files:

- `recovery-bridge.json`
- `recovery-canary-body.txt`
- `recovery-canary-headers.txt`
- `recovery-canary.json`
- `recovery-container-stderr.txt`
- `recovery-container-stdout.txt`
- `recovery-endpoints.json`
- `recovery-filesystem-diff.txt`
- `recovery-final-inspection.json`
- `recovery-health-body.txt`
- `recovery-health-headers.txt`
- `recovery-launch.json`
- `recovery-ready-body.txt`
- `recovery-ready-headers.txt`
- `recovery-result.json`
- `recovery-startup-inspection.json`
- `recovery-stop.json`
- `recovery-version-body.txt`
- `recovery-version-headers.txt`
- `restart-adjudication.json`

Final status remains:

```text
?? docs/development/evidence/phase-3e3a1/
?? docs/development/phase-3e3a1-r61-local-proof-service-preflight-report.md
```
