# Phase 3E3A3C — Public contained runtime and wallet scaffolding

2026-09-17. **BLOCKED_PUBLIC_RUNTIME_OR_A4_PLAN**.

The single offline runtime image built and passed public-only validation. The memory proposal passed 30 assertions and the redirect guard passed six loopback-mock checks. No Midnight service, wallet, provider, contract or proof operation ran. A4 remains blocked by missing parameter metadata and incomplete full-stack configuration/monitoring; no runnable A4 command is claimed. Phase 3E3B remains unauthorized and R61 remains open.

## Baseline

WSL HEAD `b572f189d36d2d306709004afccf47a1647c21b3`, subject `docs(protocol-v2): Record R61 static privacy adjudication`; tree initially clean. All seven specified Phase 3E3A3B identities matched, including its manifest entries. Historical repository evidence and durable marker remain unchanged. The accepted 20 managed files retain their sizes/hashes. No A4/B evidence, marker or authorization was created. The runtime-build marker below belongs only to this authorized prototype.

## Memory-state shape and validation

Generated V2 private packages/witnesses are plain records containing bigint, Uint8Array, arrays of 16 siblings and optional values. PrivateState may retain Maps as coordinator state; nested Maps are preserved. ContractAddress and SigningKey are string representations in the pinned runtime declarations (`onchain-runtime-v3` SigningKey declaration line143). No sampleSigningKey/key operation was run: a public invalid-key string tested representation cloning only, not validity.

The unchanged restricted provider was copied into this phase. structuredClone preserved required plain data, BigInts, byte arrays, nested Maps and undefined presence. It deliberately does not preserve arbitrary class prototypes. No ContractState, ChargedState, wallet facade or other SDK class is approved for this private-state store. A later need for such classes requires a reviewed type-specific clone, not JSON or reference sharing.

Public assertions covered detached set/get bytes, scope isolation, remove/clear, key removal/clear, permanent disposal, constant errors and all four prohibited capabilities both before/after disposal: 30 passed. Values never entered error output. JavaScript cannot guarantee physical memory zeroization. One direct local assertion run and the same assertions inside the prototype container passed; neither invoked SDK services. Imports use type-only SDK references. Import checks with the guard authorization flag already in argv showed unchanged active handles/resources and read-only proposal file inventory. The library has no executable main.

## Wallet scaffold and accepted funding design

`proposed-wallet-boundary.ts` supplies a typed constant stage/status boundary only. It does not construct, start, synchronize or fund a wallet and is not a substitute for an audited constructor. Its operation callback is future supervisor-owned; it cannot suppress internal logging inside an unsafe operation.

Prior pinned audit still applies: testkit WalletFactory uses in-memory transaction history; withRandomSeed and MidnightWalletProvider.build leak seeds; module-level loggers are not suppressed by injecting a wrapper logger; optional WalletSaveStateProvider persists serialized wallet data. No such helper is called. Full lower-level logger/shutdown/native proving audit remains open, so a complete wallet adapter was not invented.

The user now permits a transparent future Undeployed genesis-fixture funder to transfer local funding to a fresh ephemeral transaction wallet. The funder is a development fixture, not an issuer, holder, verifier, witness, backend relayer or registry authority. Funding material must be supplied only in memory by a later authorized supervisor, never embedded in changed source, argv, environment, evidence or logs. No faucet or remote network; no funding retry. Funding and DUST registration require explicit later transaction authorization. Protocol identity secrets remain separate. No funding seed or wallet material was generated or accessed here.

## Runtime adjudication and exactly one offline build

Host Node v24.18.0 at `/home/oluwatobiss/.nvm/versions/node/v24.18.0/bin/node`, x86_64. Node help exposes filesystem permission options but no inspected --allow-net policy; no Node permission guarantee is substituted for OS containment. unshare/nsenter/readelf/ldd are present; bwrap/firejail were not found. A public `unshare --user --map-root-user --net --mount --fork /usr/bin/true` succeeded. This proves namespace creation, not a reviewed usable read-only filesystem plus full-stack network sandbox, so it was not selected.

Network-none, read-only, cap-drop-ALL, no-new-privileges probes overrode entrypoints in the three local images and invoked only command lookup/id. No Node executable appeared on their configured paths. Node image had stat/id/sh; indexer had find/stat/id/sh and user10001. Proof image PATH had none of those commands; its Nix bash was used directly. Exact commands/results are retained. One optional Config.Cmd inspection template failed on absent fields; full inspect succeeded without mutation.

Native addon ELF NEEDED metadata was inventoried in native-addon-metadata.json. The prototype does not establish all SDK addon compatibility; it establishes Node builtins and proposal modules only. No dependency tree was copied into the image.

Exclusive context `/tmp/justproof-3e3a3c-runtime-b572f189`; every path/size/hash and source is in build-context-manifest.json. It contains host Node, its ldd-resolved public libraries at matching paths, and the inventoried Dockerfile. No repository, node_modules, cache, .env, wallet or private evidence was copied. FROM scratch, no RUN/network/package action; fixed USER65532:65532, workdir/work, Node entrypoint. COPY includes the inventoried Dockerfile as a harmless build-context file; no secret content exists in this context.

Exactly one command, after confirming tag absent and creating/fsyncing the durable exclusive `offline-build-started` marker:

```text
docker build --network none --pull=false --tag justproof-r61-runner:b572f189-3e3a3c /tmp/justproof-3e3a3c-runtime-b572f189
```

Exit0. Image ID `sha256:e2833f0160c095894cfccd33cd48980cd524ed96e553bebb1bc388c9702354ec`, size48,118,339 bytes. Configuration/platform/layers are recorded in runner-image.json. The image and context are retained, not tagged latest, pushed, exported or removed. No second build occurred.

Validation used a single ephemeral --network none, --read-only, --cap-drop ALL, --security-opt no-new-privileges container, with only this proposal directory bind-mounted read-only. No project secrets, cache or managed artifact mount. Node reported v24.18.0 and UID65532. No tmpfs was needed. Module imports created no handles/timers/sockets/files; the subsequently explicit public self-test opened loopback mock sockets inside the disconnected namespace, then closed them. Exact command/stdout/stderr/exit0 are preserved. The validation entry script is intentionally executable only as this public test; it is not a lifecycle runner.

## Parameter metadata-only probe

Exactly one further ephemeral proof-image metadata probe ran under the same network-none/read-only/dropped-capability constraints, no mounts and no proof-server process. Nix bash pathname globbing and file-type tests found a coreutils stat symlink at `/nix/store/8kymgya7h4nv1h6pa7vrr1vdry02smp9-coreutils-x86_64-unknown-linux-musl-9.10/bin/stat`. The searched Nix paths yielded no bls_midnight candidates; /root/.cache and /tmp were not established as files/directories by these tests. This limited search is not a complete parameter inventory or proof of absence.

No content read, hash, strings, copy, export, fetch or mutation occurred. Sizes, ownership, permissions, link target and compatibility were not established for parameters; no second metadata probe was made. Required names for all contract/native wallet circuits, resolver paths and completeness remain explicit A4 stop gates. Health from the earlier phase does not fill this gap.

## Redirect guard and topology proposal

`proposed-redirect-guard.mjs` uses Node HTTP directly as a transport proxy, not a proof protocol implementation. Production upstream is fixed numeric 172.28.61.10:6300; listen address172.28.61.11:6301. Only POST /check and /prove with application/octet-stream accepted. No forwarding of client headers except fixed content-type; no redirect following or Location response. Non-200 upstream responses become constant LOCAL_GUARD_REJECTED; request/error objects are never logged. Stream/backpressure bounds:128MiB request,32MiB response; deadline2700s; concurrency1; ten-second headers timeout. These are explicit conservative proposal bounds, not demonstrated all-circuit payload/resource suitability. Oversize/timeout abort closes the upstream; successful proof bytes would be streamed memory-only in a separately authorized run.

Constructor opens no socket/timer; direct entry requires exact authorization flag. The future supervisor must validate authorization hashes before launch; the flag alone is not authorization. Public self-test uses explicit test-only loopback options with much smaller bounds. Six checks passed: upstream redirect, upstream error, forbidden path, forbidden method, oversize and timeout. All returned constant bodies, no Location or canary echo. Six mock transmissions are reported individually as count6; no proof provider/server used. Test coverage is bounded and not a full adversarial audit (e.g. every streaming/disconnect edge is not claimed).

The official provider may still make initial+three local requests after qualifying errors. Conditional user acceptance depends on future evidence of containment for every transmission. Guard counts requests in memory; it does not silently claim one HTTP request or implement an overall retry.

`proposed-compose.yml` pins exact image IDs and pull_policy never. Internal proof network: runner/guard/prover; separate internal ledger network: runner/node/indexer. Guard/prover absent from ledger network; no published ports. Fixed numeric addresses; DNS directed to loopback with no external resolver configured, but Docker embedded-DNS behavior and host routes still require authorized public containment validation. No claim of actual topology enforcement from parsing YAML.

Read-only filesystems, capability drops, no-new-privileges, no restart, logging driver none, bounded PIDs/memory/tmpfs are proposed. Node/indexer native user/write-path compatibility and indexer storage setup remain unresolved. The Compose file explicitly warns not to launch; it is not an operational complete-stack recipe. The node/image default user is not falsely declared nonroot. Prover uses nonroot proposal; compatibility remains untested. Caps total7,936MiB excluding overhead and tmpfs implications, not guaranteed idle consumption or reserved RAM. Logging none avoids Docker log persistence but also requires a separate sanitized fetch/failure observation design; that monitor is not yet established.

## A4 plan completion status and authorization

proposed-a4-plan.json and proposed-a4-authorization.json bind known configuration/image identity and specify unresolved hard-stop gates. Authorization template has authorized=false and validForExecution=false. There is no complete monitor or parameter allowlist hash and therefore **no honest exact full-stack execution command**. This requested deliverable remains unmet; no superficially executable launcher is substituted. The only exact commands above are this completed public runtime work, not A4.

A4 may later allow isolated autonomous empty development blocks, explicitly infrastructure activity, not JustProof/user transaction execution. It must start the full required idle stack to make a full-stack resource claim, after separately reviewed configuration/authorization. No wallet, funding, /check, /prove, input, deployment or call. Stop on ambiguous parameter metadata, any fetch/external connection/cache mutation, incompatible write paths, logging ambiguity or monitor failure. Preserve exclusive durable attempt evidence, no relaunch or deletion.

Retained minimums: MemTotal12,253,256KiB, SwapTotal8,388,608KiB, post-ready MemAvailable8,388,608KiB and SwapFree6,291,456KiB; runtime available/free floors2,097,152KiB each; sample0.5s, gap2s, TERM→KILL5s, disk10GiB. Observe all containers/process trees, startup/readiness/disk/filesystem/network metadata; resource headroom must be rechecked after all services ready. No startup/hard-timeout value is silently invented. Parameter and config gaps block A4 independently of wallet/verification limitations.

Independent cryptographic verification remains open and was not pursued. Proof-provider completion, node acceptance, indexer finality and authoritative state mutation remain separate evidence layers.

## Validation and preservation

Targeted proposal-only tsc --noEmit exit0; JavaScript syntax checks and YAML/JSON parsing passed. Public memory assertions30/30, mock guard6/6, inert imports passed. No full tests, compiler/key operation, services, wallet/provider, generated contract or network request outside isolated public probes ran. Source, dependencies, managed artifacts and historical evidence remain unchanged. git diff --check passed. Original retained containers/network were not modified; only authorized ephemeral probes auto-removed themselves. The offline image and build context/marker are retained.

Created-file inventory and exact SHA-256 values follow; integrity.json excludes its own hash. A4 and B remain unauthorized, R61 open, nothing staged or committed.

| Evidence file | Bytes | SHA-256 |
| --- | ---: | --- |
| Dockerfile.proposed-runtime | 88 | `df5e2355ed2838ef1aa84b399af7a269c08295ff4b8b039f55b7eb48506b0d04` |
| build-context-manifest.json | 2483 | `1816c7e2ccc8b5e084249c790566be797626a23bcca599578cf8ba6bd6d84069` |
| existing-images.json | 3018 | `d5e39115527af1dd9782754d71ec9c02147968ebd3ec9964c059336fb018c468` |
| existing-runtime-probes.json | 2024 | `1ae377cd5fa45839730bd5233062580724c7ca0a3c0a5a8730cfbb4922c60472` |
| native-addon-metadata.json | 4001 | `1bd86e041b40b28e8acaa29f5f41def225e279b6d386f5dc220e1585797e221e` |
| offline-build-started | 111 | `34ee7ed49e8fba9f00f81c96804e3dde18391260a893bb1778738aac8f0fd55b` |
| offline-build.json | 1643 | `5ba225c47a5765dd46ac2dc578344c5a64ba13d7746ae380f8ef970857342a70` |
| parameter-metadata-probe.json | 1051 | `340e60c212995e330f6d485f09f8198b153cd7a8219a80d47cc5e740629a4f28` |
| preservation-baseline.json | 50457 | `44f32d058517d5133f8d9f9f921ea8fdf480e97e3f1509a910176f9aae7ae166` |
| proposed-a4-authorization.json | 502 | `2d7ad91a461bdd0cb06a3df8e6a64d0912bbd834ad2500a35a95884c72ac0b03` |
| proposed-a4-plan.json | 2356 | `001b9b861eb76ac68bc74365498f8e94fe94f502714d57cfbeb9e824888c72cd` |
| proposed-compose.yml | 2749 | `241edf805d89dbbdd024a333102e774cc278b4b72780b81fe68a4dbd52b68837` |
| proposed-idle-runtime.mjs | 414 | `28606ce9b7ddf7a0ae5263e5a368ccb20235f79217f4329b80c3ca9242f1cfdf` |
| proposed-memory-provider.ts | 2628 | `477639cdf7f12a22c825b8422607419d7ba4d975f24a53f0cefde791b45eb921` |
| proposed-redirect-guard.mjs | 3107 | `d4c6bfa9714e4de90a1a0106ab1fe7c229f94404511262e6a6c870314c067ee9` |
| proposed-wallet-boundary.ts | 630 | `022d9920c54d12ee3ecf361cae1bba40c02497be7783e1166f6f72980cefbe0b` |
| public-guard-selftest.mjs | 2214 | `126742cbae9de00499043206f670f99ec21da76da5943b9cb865cb368cb85128` |
| public-memory-assertions.mjs | 3135 | `f9b89af9e526eced66e36da3d40e6a749f80bc9282ab138329dd1cdd6e9e1e26` |
| public-runtime-validation.json | 1037 | `e035cb9dae69f93e660c05e7094d5d56df8e96335e15132005932682eaa08071` |
| public-runtime-validation.mjs | 997 | `59d903b6722ca9e9c0e9140e0939c0125f809f10d35bd784c512b4a40e541678` |
| results.json | 1458 | `04ee79f0ebd0ed854aeb72d63ff24876b67073dfb239c9923a2dc0f25dcbf79e` |
| runner-image.json | 1637 | `37c8fe858fe79f015f46fdc5107180cc29e485b8d758a7cd44037a8ebb87ec0d` |
| tsconfig.proposal.json | 225 | `442e89040f1aa840733bce902e176a830aacbb30e507182d3fe6a291148fa0ca` |

`integrity.json` is also created and hashes this report and all listed files.
