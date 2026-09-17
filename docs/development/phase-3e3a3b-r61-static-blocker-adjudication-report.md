# Phase 3E3A3B — Static privacy-adapter and containment adjudication

2026-09-17. **BLOCKED_STATIC_PRIVACY_ADAPTER_OR_CONTAINMENT**.

Baseline: `931a862fd1b8ba85079e201f5f67d9c53f21b3e8`, subject `docs(protocol-v2): Record R61 static integration harness blockers`; WSL, initially clean tree. Every Phase 3E3A3 JSON parsed; all manifest sizes/hashes matched and the manifest excludes itself. Earlier evidence, durable Phase 3E2B marker and all 20 managed artifacts matched. Phase 3E3B paths remain absent. Historical ephemeral /tmp output is not reconstructed.

## Decisions (one result per blocker)

| Blocker | Adjudication | Concrete disposition |
| --- | --- | --- |
| Memory-provider export capability | RESOLVED_BY_STATIC_PROPOSAL | New restricted provider meets pinned interface; import/export always reject constant errors. SDK path does not require exporting. |
| Fresh wallet funding | REQUIRES_EXPLICIT_USER_DECISION | Choose a separately reviewed local-only funder/genesis exception design or keep funding blocked. No fixed seed/faucet selected. |
| Full wallet privacy/shutdown audit | COULD_NOT_VERIFY | In-memory history exists, but helpers log sensitive values and complete subordinate logger/persistence coverage is unestablished. |
| Contained runner runtime | REQUIRES_EXPLICIT_USER_DECISION | Host Node is available; no reviewed contained image. Offline packaging investigation requires separate permission. |
| Redirect/retry containment | REQUIRES_EXPLICIT_USER_DECISION | Runtime placement and bounded retry acceptance must be decided before guard/config creation. |
| Parameters and idle resources | REQUIRES_PHASE_3E3A4_SERVICE_PREFLIGHT | Metadata-only gate is required, but prerequisite resolver/runtime and no-ledger interpretation must first be resolved. |
| Independent verification | COULD_NOT_VERIFY | Public wellFormed API exists; full reference-state/verification adapter and supported malformed-proof construction remain unestablished. |

adjudication.json binds each disposition to exact pinned source paths and SHA-256 values. No item is called fundamentally impossible merely because it is not yet established.

## Memory-provider capability versus actual use

Complete project provider inspected: providers/inMemoryPrivateStateProvider.ts. Map storage has no filesystem/logging calls. Export methods serialize to returned in-memory strings, misleadingly named encryptedPayload; this capability alone does **not** show automatic exfiltration or persistence. Import JSON errors/conflict IDs are potentially data-dependent. get/set retain caller references. Individual remove and scoped clear exist; signing keys have individual and global removal.

Relevant project caller is providers/buildBrowserProviders.ts (factory import/construction); no project import/export invocation was found in providers/app/scripts/tests. The Node provider instead selects LevelDB and is excluded. Contract SDK 4.1.1 dist/index.mjs calls:

- submitDeployTx around 1063–1067: setContractAddress, set initial state, setSigningKey.
- TransactionContext finalization around 1160: set next private state after success.
- call setup around 1295 and 1531: get private state and set scope.
- maintenance operations around 397/469/546/555: get/set signing keys.
- find/deployed contract paths around 1707–1876: scope, get/set initial state and maintenance keys.

No exportPrivateStates/importPrivateStates/exportSigningKeys/importSigningKeys invocation occurs in this inspected module. Wallet interface handles transactions; it is not passed the private-state provider by this call chain. The export functions are structurally required by midnight-js-types/dist/index.d.ts:626–818, but not needed by the proposed lifecycle path. This corrects the previous overbroad export concern.

`proposed-memory-provider.ts` is an inert library proposal with only type imports. All Maps are allocated inside an explicit capability-gated factory. It implements scoped get/set/remove/clear and key methods; copies values with structuredClone and replaces cloning failures with VALUE_UNSUPPORTED. It has no enumeration/dump/export implementation; structurally required import/export stubs reject CAPABILITY_PROHIBITED without inspecting inputs. Factory returns provider plus disposal, not its storage. Disposal clears maps and permanently blocks subsequent lifecycle operations. No identifiers/values enter errors or logs. Snapshot ownership remains a future harness responsibility beyond these copies. JavaScript cannot guarantee physical zeroization of garbage-collected memory or copies held by SDK callers. Process exit ends accessibility, not proof of secure erasure.

The module has no executable entry, main, service or authorization-reservation path. The factory flag is a capability boundary, not standalone execution authorization. A future hash-authorized runner must invoke it only after its own preflight. No import was executed here.

## Wallet and funding decision

Pinned testkit-js4.1.1 dist/index.mjs evidence:

- WalletFactory:1555 onward uses Shielded.startWithSeed, Unshielded.startWithPublicKey with InMemoryTransactionHistoryStorage, Dust.startWithSeed and WalletFacade.init. No LevelDB requirement is shown in these constructors.
- FluentWalletBuilder:1687 onward accepts withSeed/buildWithoutStarting; withRandomSeed logs the generated master seed. forEnvironment and factory methods use module-level logger, not per-call logger injection.
- MidnightWalletProvider.build around1990 logs complete seed and address through its injected logger. Project providers/walletProviders.ts around109 logs a seed prefix. Neither helper is selected unchanged.
- syncWallet around1862–1888 logs synchronization and balances; waitForFunds/registerNightUtxosForDust around1890–1933 log addresses/IDs and may call configured faucet. DUST registration requires existing NIGHT UTXOs and submits a transaction; it is not minting funds for an arbitrary new wallet.
- WalletSaveStateProvider around2028–2088 serializes wallet state, writes plain temporary data, compresses, deletes original and logs paths/errors. This is an optional separate facility, not proof every wallet persists. It must not be constructed.
- LocalTestEnvironment.startMidnightWalletProviders around2440 ignores supplied seeds and uses genesis mint seeds. Its environment manager also manages services and cleanup; excluded.
- Provider stop delegates to wallet.stop; no file-write call in that wrapper. Complete subordinate SDK shutdown, error and logger coverage is not established by this wrapper inspection.

These are exact inspected logging/persistence sites, not a claim to have exhaustively audited every transitive wallet package. Supplying a no-op logger to the wrapper would not suppress module-global helper loggers. No monkey patch/global logger replacement is proposed. No complete privacy-safe wallet implementation is justified yet.

Fresh runtime generation alone does not fund a wallet. No documented local mint-to-fresh-wallet mechanism was established in inspected testkit/node configuration. A local genesis-funded sender could potentially transfer NIGHT then register DUST, but that involves a funding secret and extra ledger transactions. Minimum decision: authorize investigation of a local-only funder with a tightly scoped genesis-fixture exception, or continue without wallet execution. No faucet, fixed seed, environment secret, password, LevelDB or deployment retry is silently adopted. No wallet was instantiated.

## Exact runtime candidates

runtime-inventory.json records:

| Candidate | Exact identity | Decision |
| --- | --- | --- |
| Host Node | /home/oluwatobiss/.nvm/versions/node/v24.18.0/bin/node; v24.18.0; x86_64 | Runs installed dependencies, but host process is not in reviewed egress-denied Docker networks. |
| proof-server8.1.0 | sha256:801bbc0340e9e96f16735f77b523f23c7459e3359842f7c79c2c53f4e994d531; linux/amd64 | No established Node runtime. |
| node1.0.0 | sha256:ede01da35e982b6a4b85461ad8492ae2753ef14246fba33c8039b782aa8e39fb; linux/amd64 | Blockchain-node image is not evidence of JavaScript Node. |
| indexer4.3.3 | sha256:03afd079b00bcd229df29a24771439c5e7695c339cd89216d0763ce40731cc4b; linux/amd64 | No established Node runtime. |

Docker supports read-only bind mounts, numeric users and tmpfs, but compatibility of these specific images with the host Node binary/native dependencies and an unprivileged runner is unverified. No image execution/export/build occurred. An offline build from a present base could potentially package host runtime/libraries, but libc/native ABI and permissions must be adjudicated first. It is not an approved or proven solution. No image was invented or pulled.

## Redirect/retry decision

Preferred topology is concretely limited to two internal networks: prover and guard and runner on proof network; runner/node/indexer on ledger network; guard and prover not on ledger network; no published proof ports. Guard has exactly one fixed upstream and only POST /check or /prove. Runner cannot use arbitrary endpoints. Even local redirects must be refused before forwarding bodies to another service. Egress routes, Docker DNS forwarding, proxy variables and unexpected service membership require later public-only validation; internal=true is not a complete application policy.

Pinned HTTP provider4.1.1 fixes initial+three retry requests; fetch-retry also retries connection failures. Guard cannot truthfully promise one HTTP request. Its constant errors could avoid status-based retry on some categories, but connection failures still permit repeats. Future user decision must explicitly accept/reject those bounded local transmissions. No automatic harness relaunch.

No guard/Compose artifact created because no suitable contained runtime and reviewed size/deadline limits exist. A future guard is transport-only: fixed origin/method/path; streamed bounded bytes/backpressure; no disk buffer; abort on timeout/oversize; refuse every 3xx and never return Location; constant empty/bounded errors, never upstream bodies; no logger; inert import and explicit authorized direct entry. No proof protocol or dependency modifications. This is conditional design, not execution-ready containment.

## Phase 3E3A4 plan audit

The prior JSON prohibits witnesses, wallet, /check and /prove, downloads, copies and mutations; its gates distinguish parameter metadata from contents and require ready-stack resource measurement. It is incomplete: no concrete resolver/names, no implementable launch command, no explicit durable exclusive reservation implementation or full authorization schema. preflight-review.json records these defects and required corrections; no unsafe command is fabricated.

There is also a scope ambiguity: the Compose dev node's healthcheck requires block1, so starting the complete dev stack implies autonomous ledger block production. Literal “starts no ledger execution” cannot be promised while requiring a ready dev node. A4 authorization must distinguish empty/dev-chain operation from user transaction execution, or exclude node startup and forgo a full-stack claim. This is not silently resolved here.

After prerequisites, a metadata-only gate must inspect parameter names/paths/types/sizes/permissions/ownership and authoritative compatibility metadata, never contents; detect fetch attempts/cache changes and stop on ambiguity; no private/synthetic input; no downloads/pulls; aggregate idle memory only after all required components ready; record per-container/process usage, timing, disk and logging drivers. Health alone proves no parameter availability. Require fail-if-exists evidence and durable marker bound to baseline/plan/monitor/runtime/config/source/managed inventory before future operations. No A4 state created, no exact command or authorization schema advertised ready.

## Verification limits

ledger-v8/ledger-v8.d.ts exposes Transaction.wellFormed(ref_state, strictness, tblock) and verifyNativeProofs/verifyContractProofs flags. That is not an established full JustProof reference-state adapter or a supported modified-proof construction path. No undocumented byte mutation, fake LedgerState or validation disablement is selected. Proof-provider completion, submit return, indexed finality, state mutation and independent cryptographic verification remain separate. Independent verification stays an open R61 limitation; it need not block a genuinely metadata-only service preflight once its other prerequisites are resolved.

## Validation and files

Created only this report and phase-3e3a3b evidence: proposed-memory-provider.ts, tsconfig.proposal.json, adjudication.json, runtime-inventory.json, preflight-review.json, integrity.json. Exact file hashes are in integrity.json. Targeted command:

```text
node_modules/.bin/tsc --project docs/development/evidence/phase-3e3a3b/tsconfig.proposal.json --noEmit
```

Exit0. Strict new proposal checking; skipLibCheck applies only to dependency declarations. No runtime import, wallet/service construction, test or full-project typecheck occurred. JSON parsing, static caller/forbidden-operation checks, complete preservation comparison and git diff --check passed. No emitter, dependency install or network operation. Historical files unchanged.

Phase 3E3A4 and Phase 3E3B remain unauthorized. R61 remains open. Nothing staged or committed.
