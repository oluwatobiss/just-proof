# Phase 3E3A2 — R61 private local integration planning

2026-09-17. **BLOCKED_PRIVATE_LOCAL_INTEGRATION_PLAN**.

No execution-ready plan or runner is justified. A supported SDK submission path exists, but the project's placeholder integration, outbound containment, logging, parameter availability and verification-evidence requirements remain unresolved. Phase 3E3B is unauthorized. R61 remains open.

## Baseline

WSL repository HEAD `45ee03b446756e542c96d246293ff5c63e8312eb`, subject `docs(protocol-v2): Record R61 local proof-service preflight`; initial working tree clean. Required Phase 3E3A1 report hash `14aacabcf38bf9ad02a1d4f529c84446bddf065ee89a620d66614817b1e3aef7` and integrity hash `e56b758265419ba1e079d7feda93862925728862c9a89f1abba1f10582317cef` matched. All 37 manifest evidence entries matched, including empty streams, canary responses, logs, bridge and restart evidence. Durable Phase 3E2B records/marker and the 20 promoted managed files match the accepted baseline. Historical missing /tmp build output/authorization are not required or reconstructed.

Read-only Docker inspection: original proof-server container exited 0; recovery container exited 0; retained internal network exists with Internal=true. No Docker mutation or Compose invocation occurred. No Phase 3E3B evidence, marker, proposed output or authorization exists.

## Installed supported path and current blockers

Package versions from installed manifests: Midnight.js contracts/proof provider/testkit 4.1.1; wallet-sdk 1.2.0; compact-runtime 0.16.0; ledger-v8 8.1.0. These are installed identities, not claims about latest releases. Source hashes are in capability-findings.json. No registry/network lookup was performed.

| Stage | Pinned local evidence | Meaning and limitation |
| --- | --- | --- |
| Local configuration | utils/config.ts LOCAL_CONFIG | Undeployed, node HTTP/WS 9944, indexer 8088 /api/v4/graphql and /ws, prover 6300; remote configs also exist and must be excluded explicitly. |
| Services | compose.yml | node 1.0.0 dev preset, indexer-standalone 4.3.3 Undeployed, proof-server 8.1.0; normal bridge/default network and published loopback ports do not deny outbound payloads. |
| Compiled assets | NodeZkConfigProvider dist/index.mjs:60–86 | Reads keys/*.prover, keys/*.verifier, zkir/*.bzkir; no compiler invocation in this loader. Existing generated bindings can be used without regeneration. |
| Deployment assembly | midnight-js-contracts dist/index.mjs createUnprovenDeployTx / submitDeployTx around 1000–1075 | Uses verifier keys and constructor execution; submits unproven transaction through the common path; stores private state/signing key after SucceedEntirely. Returned objects are explicitly privacy-sensitive. |
| Circuit assembly | same file submitCallTx around 1520 | Validates circuit ID, creates unproven call through scoped transaction context; uses supplied compiled contract/witnesses and public-data provider. |
| Proving/submission | same file submitTxCore:26–29, submitTx:69–71 | proofProvider.proveTx → walletProvider.balanceTx → midnightProvider.submitTx → publicDataProvider.watchForTxData. These are separate stages, not interchangeable evidence. |
| Wallet | providers/walletProviders.ts:52–68 | balanceUnboundTransaction → finalizeRecipe → submitTransaction. Future use necessarily exercises wallet/ledger capabilities and requires separate authorization. |
| Finality observation | indexer provider dist/index.mjs:965 onward | Polls transaction query, maps result status, block hash/height/timestamp and segments. Submission ID alone is insufficient. |
| State observation | indexer provider queryContractState:828 | Query authoritative indexed contract state and decode generated ledger only after successful finalized status. Compare exactly documented mutations. |

The supported local route avoids the unresolved synthetic LedgerState/ChargedState adapter. However, **the existing project route is not ready for V2**: contracts/index.ts uses withVacantWitnesses; test/just-proof.test.ts deploys with empty private state and no V2 constructor arguments and still calls storeMessage/checks ledger.message. It is not an all-four-circuit runner.

`test:local` sets MIDNIGHT_NETWORK=local then runs the unfiltered Vitest suite. It does not itself compile or start Compose. Its integration beforeAll constructs/starts/syncs a wallet, builds providers, attempts deployment and may repeat deployment for local DUST errors (five-second intervals, three-minute window). Its test submits the placeholder circuit. Therefore it cannot be used as a privacy-safe one-shot gate. `validate` starts Compose, runs test:local, then stops Compose. `build` compiles and copies artifacts; none of these commands is approved here. Network selection must also exclude VITE_MIDNIGHT_NETWORK overrides: getConfig checks that before process.env.

## Retry, redirect and containment adjudication

HTTP provider dist/index.mjs:21–58 fixes three retries after the initial request, exponential waits 1/2/4 seconds, status 500/503; fetch-retry/index.js also retries fetch rejection. The serialized payload is reused. proveTx delegates to Transaction.prove with the same low-level check/prove provider; it is not a retry-free alternative. Config exposes timeout/headers, not retry/redirect policy. getKeyMaterial catches load errors and returns undefined: future preflight must fail before this missing-artifact fallback can be used.

The accepted earlier static adjudication established cross-fetch redirect following without a provider disable control. No new transport or monkey patch is selected. Retries may repeat expensive computation; one logical run is not one HTTP request. Neither bounded retries nor redirects are approved for private inputs.

Host loopback with the ordinary bridge proved reachability only. It does not prevent redirected requests leaving a host runner. An egress-denied network containing the runner and every required service is a possible design direction, but no reviewed runner image, DNS/proxy controls, cross-service redirect policy, node genesis/connectivity setup or memory budget has been established. The internal-network host-publication failure cannot be bypassed by claiming loopback implies isolation. Merely blocking external routes would also require reviewing whether redirects could leak bodies to other local services/logs. No installed, completely established in-process proving/verifier/parameter route resolves these gaps. This is a blocking containment decision, not an instruction to create a network.

## Privacy design requirements (not implemented)

Use only deterministic, non-production synthetic role identities with separate domains/secrets; no actual credential or production wallet data. Keep all role secrets, witness snapshots, statements, openings, paths, private transcripts, serialized preimages and proof/SDK result objects memory-only. Do not persist raw inputs even though synthetic. Do not place them in argv, environment captures, snapshots, /tmp, logs or telemetry.

An in-memory adapter must catch every SDK/service exception before any logger/test reporter sees it and emit only an allowlisted circuit name, stage, bounded status/category, timestamp, duration and byte count. Never stringify the exception, message, cause, stack, response, URL or transaction object. The recovery canary was echoed in an HTTP error response; the lack of a log echo does not establish privacy. The provider's own error includes URL/statusText and SDK transaction errors carry private data, so their strings are not safe evidence.

Require RUST_BACKTRACE=0, no verbose flag, no request/body diagnostic logging, no remote fallback, fixed endpoints and reviewed logging drivers for every service. Ordinary Compose currently violates the proposed configuration (`-v`, full backtraces). The existing test has unrestricted unhandled-rejection/exception console output; wallet construction logs a seed prefix; buildNodeProviders persists private state through LevelDB with a fixed test password. These paths must not be reused unchanged. An audited in-memory private-state provider and exception boundary are needed before execution. Docker logging suppression alone would not establish safety of stderr/runner/error persistence.

Safe evidence: public artifact hashes, reviewed circuit IDs, bounded status/duration/resource metrics, finalized public transaction identifiers and explicitly reviewed ledger roots/counters. Do not retain proofs/preimages or private-value hashes by default. Public transaction objects must not be dumped wholesale. All public-output retention needs field allowlisting; controlled proof output hash retention requires separate review of the exact object being hashed.

## Parameters

The existing seven host compiler-cache files and generated keys are not proof-server parameter-availability evidence. The service had no mounts, no visible filesystem changes and no reported fetch; /ready merely reported capacity. Help exposes no parameter path. The available local evidence does not establish every server parameter name/location/ownership, embedded inventory, or native wallet proving parameters needed by the full transaction.

A later separately authorized service-only gate must establish the pinned server's exact parameter resolution path and all required names, sizes and compatibility using public metadata only, without witnesses. It must forbid any missing-key fallback or fetch, stop if any parameter is absent/unknown, and not borrow compiler cache assumptions. No download, copy, parameter-content inspection or cache mutation is authorized. Current evidence is insufficient to give an exact safe mount or ownership command.

## Required evidence layers and conditional sequence

R61's key-generation/resource and local managed-artifact portions are accepted. All-four-circuit actual proving, cryptographic verification, ledger execution and artifact-profile/release obligations remain. The current requirement documents contain historical open statuses; later accepted reports refine key-generation acceptance without closing the rest.

A future full local sequence would deploy with public context/private authority constructor witness, then registerIssuerV2 → registerCredentialV2 → proveQualificationV2 → revokeCredentialV2. Every call uses a fresh finalized authoritative state; reference-tree paths are checked against those roots. Qualification must occur before revocation for a positive proof, with valid request/block-time bounds. Registration mutates its three fields; qualification changes none; revocation changes only revocationRoot. A post-revocation rejection would be a separate negative case, not an additional success proof.

Proof-provider success would evidence returned proof construction, not automatically cryptographic validity. Wallet submission return is an identifier, not finality. Indexer SucceedEntirely plus authoritative post-state provides ledger execution/mutation evidence under the pinned node's validation rules. The local installed JS call path alone does not establish exact node cryptographic strictness, all-call verification or negative-proof rejection semantics; these need pinned authoritative evidence before labelling node acceptance as full cryptographic verification. No standalone verifier adapter is invented. No LedgerState.apply bypass is proposed.

## No executable plan yet

No runner/monitor or exact launch command was created because required invariants are unresolved. conditional-design.json records coverage and minimum proposals, not execution authority. Retain the reviewed minimum MemTotal 12,253,256 KiB, SwapTotal 8,388,608 KiB, launch available RAM 8,388,608 KiB/free swap 6,291,456 KiB; runtime floors both 2,097,152 KiB; 0.5-second sampling, maximum gap 2 seconds, five-second TERM→KILL and 10 GiB disk. These must pass **after all stack containers start**, with aggregate process/container usage monitored; idle host capacity is not a full-stack budget.

Future plan must bind baseline/configuration/runner/monitor hashes before durable exclusive reservation, use concurrency one, no logical relaunch, fresh output/evidence, retain markers and failed evidence, and obtain separate explicit local ledger-submission authorization. Startup, circuit, finality and hard-stop timeouts remain unassigned pending supported stack budgeting; compiler timeouts are not silently reused. No exact commands/names beyond historical proposed attempt paths are claimed ready.

Blocking decisions: V2 witness/constructor wiring; privacy-safe wallet/private-state/error handling; retry authorization and redirect containment; pinned parameter supply; full-stack resource/time budget; exact cryptographic-verification versus node-finality acceptance evidence. Resolve these through a separately authorized design/implementation review, not by running the current tests.

## Files and validation

Created only this report and evidence/phase-3e3a2/{capability-findings.json,conditional-design.json,integrity.json}. Evidence records inspected source hashes, installed versions, full preservation inventory and current read-only Docker status. JSON parsing and git diff --check passed; historical reports, source, dependencies, Compose, caches and managed artifacts remain unchanged. No services or execution workloads were invoked.

Final status:

```text
?? docs/development/evidence/phase-3e3a2/
?? docs/development/phase-3e3a2-r61-private-local-integration-plan-report.md
```
