# Phase 3E3A3 — Private integration harness static implementation

2026-09-17. **BLOCKED_STATIC_PRIVATE_INTEGRATION_HARNESS**.

No executable runner, proxy, monitor or Compose proposal was created. Exact V2 field wiring is traceable, but a privacy-safe funded wallet, reviewed contained runner runtime, parameter supply and verification boundary are not fully established. Creating a runnable harness would violate the explicit fail-closed requirement. This phase creates concrete data-only mappings and gated design artifacts, not an execution authorization.

## Baseline

WSL repository HEAD `49d4bc8bbd7de1affe44827bd293c389b771ef9f`, subject `docs(protocol-v2): Record R61 private integration planning gate`; initial tree clean. All four required Phase 3E3A2 hashes matched: report b803683276b7ce945b85876d0e21b0085f7e4c0b54c1ce4269ba3bdd691488d7; findings f013dc1431ec00c25c72c7a885d183b1afc27dcdfb814a0914ce606c924a2008; design 3bb3ced5b574779fcf9dd1899a8b4e31bb0834a99140797ce5467cc062f1cc41; integrity d9ad9b12fb0dde1b02d92079cf12fec0502fb8349f4da49f86705ea97d130d07.

Durable Phase 3E2B evidence/marker, Phase 3E3A/A1/A2 evidence and all 20 managed artifact identities remain unchanged. No historical deleted /tmp path was reconstructed. Phase 3E3B paths remain absent. Read-only Docker image inventory found local node1.0.0, indexer4.3.3 and proof-server8.1.0 images, but no reviewed Node runner/proxy image. No Docker state was changed; no service or executable proposal was run.

## Exact generated mapping

Generated declarations are authoritative: contracts/managed/just-proof/contract/index.d.ts, with hash in static-evidence.json. Uint types map to bigint, Bytes to Uint8Array, ContractAddress to `{bytes: Uint8Array}`. All private callbacks return the exact `[PS, value]` tuple and receive private WitnessContext. One detached snapshot per operation must copy bytes and freeze structural containers. No unchecked any or vacant witness adapter is selected.

| Operation | Arguments | Witness callback/value | Result/mutation |
| --- | --- | --- | --- |
| Constructor | deploymentRegistryContext: Bytes32, public | registryAuthoritySecretWitness → authority secret | exact nine-field initial state |
| registerIssuerV2 | issuerControlCommitment: Bytes32, intentionally non-secret | issuerRegistrationWitnessV2 → authority secret, insertionPath | unit; issuerRoot,nextIssuerIndex,registeredIssuerLeaves |
| registerCredentialV2 | none | credentialRegistrationWitnessV2 → issuerSecret,credential,issuerMembership,insertionPath | unit; credentialRoot,nextCredentialIndex,registeredCredentialNullifiers |
| proveQualificationV2 | ten-field request | qualificationWitnessV2 → credential,subjectSecret,issuerMembership,credentialMembership,revocationPath | requestDigest,stateDigest; no mutation |
| revokeCredentialV2 | none | credentialRevocationWitnessV2 → issuerSecret,issuerMembership,issuanceNonce,credentialId,credentialCommitment,credentialMembership,revocationPath | unit; revocationRoot only |

Credential package order: statement, issuanceNonce, credentialOpening. Statement order: protocolVersion, credentialId, issuerId, subjectCommitment, qualificationType, qualificationVersion, issuedAt, expiresAt. Issuer record: protocolVersion, issuerId, issuerControlCommitment. Issuer membership: record, issuerIndex, path. Credential membership: credentialIndex, path. Each path is exactly 16 siblings; no directions/root/configuration witness. The JSON field matrix classifies all nested fields as memory-only when used as witness material, even if a field can be public in another context.

Request order: protocolVersion, proofType, registryContract, registryContext, qualificationType, qualificationVersion, verifierContext, challenge, requestIssuedAt, requestExpiresAt. Only the two returned digests are circuit outputs. Public request metadata may be individually allowlisted; do not log generic argument/context objects. The raw issuer commitment being non-secret does not imply chain exposure.

Runtime synthetic values would use SHA-256 of distinct public labels `JP:3E3B:SYNTHETIC:<role>:V1`. These deterministic fixtures are not secure production identities. Separate authority, issuer, subject, nonce, credential-opening, context, verifier and challenge labels; derive IDs/commitments through accepted typed V2 helpers and domains, never invented serialization. Subject secret is the opening used by the subject commitment helper; no additional holder secret field is invented. Credential times need a reviewed local request/block-time fixture rather than stale 2023 simulation timestamps. Request address/context must come from actual deployment. Wallet funding is a separate genesis-fixture issue, not solved by arbitrarily hashing a new seed.

CompiledContract.make + withWitnesses is a supported combinator (compact-js declarations), and generated Contract accepts a complete Witnesses object. withCompiledFileAssets/NodeZkConfigProvider can consume current artifacts without compiling. Existing test support executes simulated circuits and imports diagnostics; do not import its setup as a live deployment adapter. Use its schemas/reference derivations only after audited separation. No production code was changed.

Before every dependent call, query finalized authoritative state and verify the expected nine fields; refresh reference-tree paths against those roots/counters. Sequence is deployment → issuer registration → credential registration → qualification → revocation. Never progress from a submitted identifier or assumed success. Post-revocation negative proof work requires separate authorization.

## Memory provider and wallet audit

providers/inMemoryPrivateStateProvider.ts uses Maps only and no filesystem, network or logger. It supports scoped set/get/remove/clear and maintenance-key lifecycle needed by the SDK. However it returns shared state references, exports plaintext JSON under `encryptedPayload`, ignores encryption options, and import errors can include caller-controlled IDs or JSON parse diagnostics. Bigint/typed-array export round trips are not established. It is not selected unchanged. A future isolated typed provider should support required in-memory lifecycle, disable import/export with fixed errors, never serialize private data, and enforce snapshot ownership. No existing provider is edited here.

Pinned testkit-js 4.1.1 provides FluentWalletBuilder.forEnvironment().withSeed().buildWithoutStarting(), deriving wallet components/keystore in memory. Its withRandomSeed logs the full seed, so is prohibited. Project MidnightWalletProvider logs a seed prefix and is not reused. LocalTestEnvironment.startMidnightWalletProviders uses its genesis mint seed list and starts wallets; that is evidence of a supported local funding convention, not a privacy-reviewed no-side-effect bootstrap. The environment wrapper also manages services and cleanup and is inappropriate here. An arbitrarily derived test seed is not guaranteed funded.

A complete supported, privacy-safe funded wallet path has not been demonstrated: package logger initialization, subordinate wallet persistence/telemetry, genesis match to the pinned dev node, DUST readiness and error paths require review. No seed is embedded or disclosed and no wallet is constructed. No LevelDB/fixed-password provider, retrying deployment loop, or unrestricted error handler is selected.

## Local endpoints and transport containment

Future configuration must be constructed explicitly for Undeployed, not getConfig. Reject VITE_MIDNIGHT_NETWORK/MIDNIGHT_NETWORK selectors, proxy variants, NODE_OPTIONS/preloads and endpoint overrides that can alter reviewed execution. Allowlist parsed scheme, exact fixed host/IP, port and path; reject userinfo, query, fragment and remote/hosted aliases. Environment evidence is a fixed allowlist, never enumeration. Internal endpoints would replace host loopback only after reviewed runtime placement; no exact runnable hostname configuration is claimed yet.

Preferred topology: proof-server only on dedicated internal proof network; transport-only redirect guard on that network and, if necessary, a separate internal runner/ledger network; node/indexer on ledger network. Runner may reach only guard for proof requests. No proof port published, no external route, DNS/proxy/fallback or image pull. A dual-homed guard must not route traffic or become an arbitrary proxy. Service membership/firewall and redirect tests require later public-only review. An internal bridge alone does not prove application-level containment, especially across local services.

Guard requirements: only POST /check and /prove; one fixed upstream; fixed content-type/body limit and deadline; streaming with backpressure and bounded byte counter, abort oversized requests without retaining them; no disk buffering, logs or private headers. Refuse every upstream 3xx, never relay Location or upstream error bodies. Return constant local nonredirect errors; stream successful binary responses only after validated status/headers. Destroy both streams on timeout/error. Size/timeout limits remain unset until pinned payload bounds/resource budget are known; guessing could truncate valid proving requests. No proxy code is created before those invariants and a reviewed local runtime are established.

Official provider initial request + up to three retries, including rejected connections, remains explicit. Guard rejection does not eliminate SDK retries on connection errors or 500/503. A future authorization must accept/reject bounded local repeats; no overall harness retry is allowed. No dependency patch/custom proof-protocol implementation is proposed. Read-only image inventory does not establish a suitable contained Node runtime; absent a reviewed existing runtime, no new image/build/pull is invented.

## Evidence and privacy boundary

Allow only circuit identifier, stage, fixed category, timestamps, duration, byte counts, resource samples and explicitly public artifact hashes. Fixed error categories should include PREFLIGHT_REJECTED, SERVICE_FAILURE, DEADLINE, SUBMISSION_UNKNOWN, FINALITY_REJECTED and STATE_MISMATCH; never derive them by serializing an error. Unknown exceptions are discarded after categorization, not printed as message/stack/cause/URL/request/response/transaction. Raw proofs and their private wrappers remain memory-only; no generic snapshots or complete environment captures.

Require RUST_BACKTRACE=0, no verbose server logging and reviewed Docker logging behavior for runner, guard, prover, node/indexer. The public canary was echoed in an HTTP error response; lack of a container-log echo proves no general privacy property. Do not persist raw HTTP responses or provider exceptions. No real .env, wallet database or credential is read. Synthetic private values remain private for evidence purposes.

## Proposed Phase 3E3A4 gates — blocked, not executable

parameter-resource-preflight-plan.json specifies the ordered stop conditions and resource floors. Exact execution commands cannot be supplied honestly until the runtime and parameter resolver are established. This is an explicit unmet deliverable, not permission to run an approximate preflight.

First obtain authoritative pinned public metadata for parameter resolution and exact names needed for all four contract circuits AND native wallet operations; inspect names/types/sizes/ownership/compatibility only, never contents. Stop on absent, ambiguous, changed or incompatible parameters, fetch attempt or fallback. Compiler cache is not presumed a service cache. No downloads/copies or cache mutation authorized.

Only a later separately authorized witness-free full-stack preflight may start services and measure startup/readiness, logging drivers, per-process/container and aggregate RAM/swap/disk. No wallet, /check or /prove. Apply the reviewed launch floors after the full stack is idle: MemTotal 12,253,256 KiB, SwapTotal 8,388,608 KiB, MemAvailable 8,388,608 KiB, SwapFree 6,291,456 KiB. Runtime floors both 2,097,152 KiB; sample 0.5s, maximum gap2s, TERM→KILL5s, disk10GiB. No invented startup/finality deadlines or compiler-timeout substitution.

Future execution must bind exact baseline, plan, runner, guard, monitor, configuration, source and managed hashes before exclusive durable reservation; fresh paths, concurrency1, no relaunch, marker never removed. Service and local-ledger authorizations remain separate. No attempt state was created.

## Verification evidence limits

A provider result is proof-generation evidence only after verifying the actual success path. Node submit return is not finality. Indexer SucceedEntirely plus authoritative post-state supports ledger execution under the local node's rules. Independent cryptographic verification remains open until pinned verification semantics/strictness and rejection behavior are established. No undocumented modified-proof serialization or bypass is proposed; no supported negative-proof construction has been demonstrated here. Do not relabel state mutation or finality as independent proof verification.

## Artifacts and validation

Created only this report and evidence/phase-3e3a3/{privacy-field-classification.json,proposed-plan.json,parameter-resource-preflight-plan.json,static-evidence.json,integrity.json}. No executable module exists, so AST, TypeScript, syntax and inert-import probes are inapplicable; none was run. JSON parsing, field-mapping assertions, preservation comparisons and git diff --check passed. No tests, compiler, services, providers, proofs, ledger operations or network requests were executed. No product, dependency, historical, managed or configuration file changed.

Phase 3E3B remains unauthorized. R61 remains open. This blocked static checkpoint requires review before any further work.
