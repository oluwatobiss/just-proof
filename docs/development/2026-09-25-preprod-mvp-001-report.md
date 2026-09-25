# Preprod MVP 001: address-binding gate

Classification: `BLOCKED_ADDRESS_TRANSACTION_BINDING`.

Baseline: `f6f9692af1616065a688c95983329d266e0ea466`, subject `feat(demo): Add guided simulation and restore local V2 CI`. WSL, repository root, clean working tree and empty index were confirmed before evidence creation. The committed checkpoint records a user-executed full local run with 17 files and 489 tests passed, zero skipped, including both V2 integration cases. It was not rerun for this static gate.

The prerequisite is not established across the intended wallet set. No companion contract, browser live flow, CSV verifier, keys or transaction was created. This is not a finding that Midnight lacks signing capability; it is a failure to establish the complete requested independent verification path from the locally pinned evidence.

## Pinned call path and limits

File hashes and installed package versions are in [address-binding-gate.json](evidence/2026-09-25-preprod-mvp-001/address-binding-gate.json). These are installed versions, not claims about latest releases.

- `@midnight-ntwrk/dapp-connector-api` 4.0.1, `dist/api.d.ts`: `InitialAPI` is injected under `window.midnight`, declares `apiVersion` and `connect(networkId)`. `getConnectionStatus()` returns connected/networkId or disconnected. `getUnshieldedAddress()` returns a Bech32m string. The interface does not establish a vendor/version support matrix or each wallet's Preprod identifier. Project `utils/config.ts` uses `preprod`.
- `WalletConnectedAPI.getDustBalance()` reports balance/cap. `balanceUnsealedTransaction` balances a proved transaction and may pay fees; `getProvingProvider` accepts key-material resolution; `submitTransaction` accepts a sealed transaction and returns void. Neither the declarations nor `providers/buildBrowserProviders.ts` binds a claimed unshielded address merely through paying fees. The browser provider returns a transaction identifier, which is not evidence of address control.
- `getTxHistory(pageNumber,pageSize)` is documented as recording relevance to the wallet. A client history response is not independent proof that an address authorized the contract call.
- `SignDataOptions` permits text/hex/base64 and `keyType: 'unshielded'`. `signData` returns data, signature and verifyingKey strings and is documented to prepend a prefix. The inspected connector distribution does not establish the exact wallet implementations and prefix/encoding interoperability needed for a complete challenge verifier.
- Ledger 8.1.0 declares `verifySignature(vk,data,signature)` and `addressFromKey(key)`. Unshielded wallet 3.1.0 `dist/KeyStore.js:createKeystore` signs through ledger `signData`, derives its public key through `signatureVerifyingKey`, and derives its address through `addressFromKey`. Thus public primitives exist for a potential signature/address chain. This lower-level implementation is not evidence that every injected wallet implements the connector signing operation with the same framing.
- Address-format 3.1.2 declares `MidnightBech32m.parse`, network-aware codec decoding, and `UnshieldedAddress` with a 32-byte payload. Address format/network validation alone does not establish ownership.
- Indexer public-data provider 4.1.1 `dist/index.d.ts` exposes `RegularTransaction.contractActions`, result status, identifiers, and unshielded created/spent outputs. `UnshieldedUtxo.owner` is a Bech32m address. `ContractAction.address` identifies the contract, not the submitting wallet. A created output can be sent to another party. A spent output is a promising association only if an authenticated spend from the claimed address is guaranteed within the same transaction and independently validated. The proposed hash-only receipt operation does not guarantee such a spend.

Existing `utils/wallet.ts:selectWallet` chooses the first wallet. Its connection helper and browser provider are not a reviewed multi-wallet address-authentication flow. No changes were made to these helpers.

## Why implementation stops

Anyone can hash a public address, public campaign identifier and chosen nonce. An on-chain match of those hashes authenticates the submitted data, not control of that address. Fee payment must not be substituted for that missing link.

A signed challenge is a candidate additional control check, not necessarily the only possible design. It would need a reviewed domain-separated challenge binding campaign, contract, receipt and transaction, exact wallet framing verification, public-key-to-address derivation, replay handling and an added signature evidence schema. The currently requested Sheet fields contain no signature or verifying key. No supported/unsupported wallet brands are asserted without implementation evidence.

Alternatively, a guaranteed signed unshielded spend in the same receipt transaction could be investigated through the public intent API. That requires exact construction/merging/ownership evidence and funded token prerequisites beyond assuming DUST payment. It is not silently adopted here.

The next decision is whether to investigate a signature-capability-qualified wallet set and an expanded receipt/Sheet schema, or a guaranteed unshielded-spend design. Neither option is implemented or authorized for Preprod. A named-wallet restriction requires explicit user choice; API declarations alone do not qualify a wallet.

## Preservation and validation

All 20 managed files exactly match the accepted promotion inventory, including sizes and SHA-256 values. The seven parameter files match the committed pre-run inventory. The historical preservation baseline was checked. Existing contracts, protocol evidence, `/deploy`, scripts, dependencies and workflows remain unchanged; no tracked file was edited.

New JSON is parsed and its file identities independently recomputed; `git diff --check` is required before handoff. No compilation, key generation, tests, services, wallet connection, signing, proof, ledger operation or external network request was performed. There are no companion artifacts or verified users. R61 and all separately gated runtime phases remain open.

Only this report, the decision guide and the new evidence directory are additions. See the new integrity manifest for exact hashes and final Git status.

## MVP 001A — capability-qualified signed-challenge adjudication (2026-09-25)

Current classification: `COULD_NOT_VERIFY`. The original `BLOCKED_ADDRESS_TRANSACTION_BINDING` decision above is preserved as historical evidence. The user has now selected the signed-challenge route, with unsupported wallets limited to simulation. No unshielded-spend route or wallet brand is silently substituted.

The baseline identity checks passed at `f6f9692af1616065a688c95983329d266e0ea466`. The original report, guide, gate and integrity hashes matched the requested values; nothing was staged. This addendum preserves the original report's 6,302 bytes exactly as a prefix. The original guide's 1,806 bytes are likewise preserved.

### Completed offline work

The pure, import-inert `capability-challenge.ts` proposal defines explicit ordered UTF-8 lines, terminal LF, fixed domain/schema/network/campaign, canonical Preprod unshielded address, contract, nonce, integer timestamps and exact receipt inputs. It does not serialize ordinary objects to construct signed bytes. Lowercase hex is strict; base64 is not accepted. The maximum validity is 300 seconds. Capability and participation domains, and their proposed SHA-256 receipt-preimage domains, are distinct. The future participation challenge must use the final companion contract; the offline fixture is explicitly synthetic. No companion ABI or hash-circuit compatibility is claimed.

The installed lower-level unshielded keystore, ledger signature verifier and address codec establish the offline primitive chain:

`canonical bytes → KeyStore.signData → ledger.verifySignature → ledger.addressFromKey → UnshieldedAddress.codec → MidnightBech32m.parse/decode(preprod) → exact address payload equality`.

Twenty focused tests passed. They cover field-order stability; changed campaign/network/contract/address/nonce/expiry; valid canonical field replacements; expiry and future issuance; wrong key; invalid signature; Mainnet/Preprod mismatch; malformed hex; capability/participation separation; and changed framing. The framing fixture is explicitly `OFFLINE-FIXTURE-ONLY`, not a claimed 1AM prefix. The test uses public deterministic test-only material and never emits a signature, key or address in evidence. Successful signature verification here is not proof generation or proof verification and is not wallet runtime qualification.

### Remaining blocker: exact wallet framing

Connector 4.0.1 `dist/api.d.ts:159–161` says signing prepends a prefix, but does not define its bytes. `SignDataOptions` specifies input encoding and unshielded key selection; `Signature` supplies data/signature/verifyingKey strings without establishing the complete version-matched wallet framing/encoding profile. Lower-level KeyStore signs the supplied bytes directly and therefore cannot establish the connector-added framing.

A valid signature over wallet-returned bytes is insufficient if the verifier cannot prove those bytes encode exactly the intended challenge. A suffix match, guessed prefix, assumed hex encoding, or accepting any signed returned string would weaken the requested gate. No such fallback was implemented.

A public, version-matched 1AM signing specification or implementation is needed to finish this binding, including its exact prefix, length framing if any, output encodings and extension/API identifiers. Connector 4.0.1 is the sole candidate API profile for review, not an assertion that a 1AM version implements it. No wallet is qualified. No browser probe route or enablement flag was created, and there are no executable manual signing instructions yet. This intentionally prevents a misleading green probe. The operator must not send an address, signature, key, challenge, or screenshot containing them to resolve this blocker.

The remaining browser requirements are recorded in `wallet-capability-requirements.json`: explicit discovery/selection, separate connect and signing gestures, both network checks, method detection, exact framed-byte comparison, signature/address verification, expiry, constant failures and memory-only values. Those runtime requirements remain unimplemented and untested; they are not represented as completed by the offline tests.

### Security correction

`providers/walletProviders.ts` now emits only the constant `Wallet built` instead of an interpolated master-seed prefix. Wallet construction and deployment control flow are unchanged. A focused source assertion and targeted TypeScript check cover this narrow edit; no wallet or deployment was run.

The new pure proposal imports no private-state provider, wallet helper or operational provider. Existing plaintext export/import, first-wallet selection, address logging and runtime patching are not reused or certified safe. Their migration remains a separate review item. No real wallet was instantiated; no global logger was patched for production.

### Validation and limits

- Focused offline command: `node_modules/.bin/vitest run --config vitest.frontend.config.ts test/frontend/address-capability-offline.test.ts` — 1 file, 20 tests passed, exit 0.
- `npm run test:frontend` — 2 files, 39 tests passed; includes import inactivity and existing simulation render/privacy checks.
- `npm run typecheck:frontend` — passed, exit 0.
- `npm run lint` — passed, exit 0 (existing scope: `app`).
- `npm run build:frontend` — passed; 27 modules. Static output search found no capability domain, `signData`, or ledger-v8 reference. No new probe is included in the public build.
- Targeted shared-helper check: `node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types node providers/walletProviders.ts` — exit 0. An initial invocation without `--ignoreConfig` exited 1 with TypeScript TS5112; adding the required CLI option resolved the invocation error without source changes.
- JSON/schema consistency, integrity recomputation, historical/managed/cache comparisons and `git diff --check` are recorded in refreshed evidence.

No browser wallet, Preprod connection, real signing request, service, transaction, proof, contract compilation, deployment or onboarding occurred. No manual 1AM result exists. The existing `/deploy` and operational commands are unchanged. R61 remains open. Exact changed-file identities and preservation outcomes are in `integrity.json` and `offline-verification.json`.

## Strict connector-standard capability probe — 2026-09-25

Current classification: `ADDRESS_BINDING_PROBE_READY_AWAITING_MANUAL_1AM_RESULT`. This supersedes the preceding framing blocker while preserving both historical report bodies. Baseline remains `f6f9692af1616065a688c95983329d266e0ea466`; the empty index, exact prior integrity hash and every recorded file identity passed before changes.

### Authoritative evidence correction

The [tagged v4.0.1 specification](https://github.com/midnightntwrk/midnight-dapp-connector-api/blob/v4.0.1/SPECIFICATION.md) establishes the frame `midnight_signed_message:<data_size>:` followed immediately by application bytes, with size measured before prefixing. The [v4.0.1 release](https://github.com/midnightntwrk/midnight-dapp-connector-api/releases/tag/v4.0.1) lists the transaction `payFees` change; the tagged signing rule remains applicable. No current-main signature scheme was adopted. The [wallet reference](https://docs.midnight.network/sdks/community/wallets/community-wallets-reference) leaves 1AM signing support undocumented. A connector standard is not evidence of a particular wallet's runtime conformance.

`connector-public-references.json` records retrieval time, requested/final URLs and the exact extracted web-tool response. Its SHA-256 is in the integrity inventory. This is an extracted-response identity, not a raw-page hash: direct HTTP retrieval encountered sandbox DNS failure and then HTTP 429. No other public reference, registry, wallet service or Preprod endpoint was queried.

### Implemented isolation and flow

`tools/address-capability/` is a separate development root, with no import or link from `/demo` or the public application. Its Vite configuration requires the explicit `capability-probe` mode, binds only loopback port 5174, disables environment-file loading/public-directory copying/HMR, and refuses a production build. The ordinary production frontend cannot enable this probe through an environment flag. No package script, dependency, lockfile, `/deploy` flow or workflow was changed.

The component/controller imports and initial render perform no discovery, wallet call, randomness generation or service request. Discover explicitly enumerates own injected entries (bounded to 32); names, keys, rdns and versions are bounded plain text. Icons are not read or fetched. Duplicate name/rdns candidates are flagged and blocked. No first-wallet default exists. The operator selects a unique entry; only exact connector API `4.0.1` is callable. Reported identifiers are not proof of authenticity or the wallet product version.

The dedicated Connect click calls `connect('preprod')` synchronously before any await. Required methods are checked; connection status and configuration must both report Preprod. The address is canonical decoded Preprod Bech32m with a 32-byte payload. It remains in a private closure, never React state or DOM. No service URI is replaced or contacted: the probe has no provider/indexer/prover workflow.

A second Sign click generates 32 random bytes through browser crypto, constructs a capability-domain challenge with a clearly synthetic nonzero 32-byte contract value (0x11 repeated), and uses `{ encoding: 'text', keyType: 'unshielded' }`. The challenge lifetime is at most 300 seconds. The controller computes the standard frame before receiving wallet data. It rechecks Preprod before signing, and checks status, configuration, address and time again afterward. A successful test discards the connected handle/address; a further signing action requires explicit reconnection. There are no automatic retries. Wallet-call timeout is 120 seconds; timeout does not imply cancellation of an extension prompt.

Returned data admits exact UTF-8 text, canonical lowercase hex, or canonical padded standard base64. Signatures/keys admit hex/base64 decoding to exactly 64/32 bytes. Any unsupported encoding, extra field, accessor response field, wrong length, or multiple valid decodings at the required byte length fails closed. The decoded signed bytes must equal the locally expected frame. Pinned ledger 8.1.0 verifies the signature and derives the address payload. The same pinned Bech32m codec primitive used by address-format validates checksum, prefix, payload length and canonical representation. No response supplies the framing rule.

### Privacy and runtime boundaries

Only allowlisted identifiers, booleans, encoding categories, stage/result enums and fixed error categories reach the UI. No payload, address, key, nonce or signature reaches console, storage, attributes, URLs, clipboard, downloads or repository evidence. Unknown exceptions are converted to constant failures. JavaScript memory is not claimed to be physically zeroized. The inherited shared seed-prefix-log correction remains; this probe does not import that wallet helper or the private-state provider.

The local development runtime loads ledger primitives only after explicit connection. A narrowly scoped Vite transform inlines the existing ledger WASM and resolves its local imports; it does not download a runtime or parameter. CSP blocks fetch/WebSocket destinations (`connect-src 'none'`), images and forms. This constrains the page, not the selected browser extension's own network behavior. Static module delivery from the local development server is necessary and is not a private-payload service request.

### Validation and remaining manual boundary

Focused mock tests cover explicit selection, synchronous connection, API/method refusal, duplicates and identity changes, both network checks before/after signing, connection/signature rejection, exact UTF-8 framing, all supported encodings, ambiguous/noncanonical data, altered returned fields, wrong key/signature/address, expired/future challenges, timeout/no retry, import/render inactivity and absence of persistence/proof/transaction calls. Configuration tests inspect the local WASM import/export inventory and explicit mode restrictions without starting a server. Prior deterministic lower-level tests remain intact.

Final command results and counts are in `strict-probe-validation.json`. The normal frontend build remains 27 modules with no capability/signing/ledger symbols, probe assets or managed keys. Browser extension behavior, local browser/WASM delivery and manual 1AM conformance have not been exercised. The manual operator must record the installed extension version separately from connector `apiVersion`.

Even a passing capability probe creates **no verified participant** and does not satisfy the 70-user requirement. The separately implemented app-specific Preprod participation transaction must still be finalized and independently verified. No receipt contract, wallet connection, real signature, proof, transaction, deployment, onboarding or participant record was created. R61 remains open. Nothing is staged or committed.

Final validation: **4 frontend files, 86 tests passed, zero skips** (45 strict mocked-probe cases, 20 offline primitive cases, 2 development-configuration cases and 19 existing demo cases). Frontend and targeted probe TypeScript checks, normal app lint plus explicit probe/test lint, and the normal production build passed. The production output contains only the existing index, JavaScript/CSS, favicon and hero image: five public files, no probe or managed keys. A first inventory assertion incorrectly expected three files and was corrected to include the two existing public images; no output was removed to satisfy that assertion. The initial strict-probe typecheck's widened challenge literal was corrected with an explicit generated proposal type before final validation.

The future dev command may create only Vite's public-code compilation cache at `/tmp/justproof-capability-vite-cache`; it has not been executed. The configuration explicitly prebundles already installed React runtime dependencies locally and inlines the installed ledger WASM without an external fetch. No package installation is needed. The separately served browser runtime still requires the manual validation described above; mock passes do not certify an extension.

## Development rendering correction — 2026-09-25

Current classification: **`BLOCKED_MANUAL_PROBE_RENDER`**. The earlier ready classification is not demonstrated by a served-browser rendering result. All preceding report bytes remain preserved as a prefix.

The operator reported that the specified loopback command loaded the title but left a blank body in Chrome Incognito. No disclosure or control appeared and no wallet operation occurred. The observed 1AM **product version is 6.3.11**; its injected connector `apiVersion` remains unknown. No sensitive value was supplied.

### Diagnosis and correction

The baseline hashes, empty index, prior inventory and exact HEAD passed. A loopback-only Vite server was started for public startup-module inspection. The actual `main.tsx` and `Probe.tsx` responses imported named `jsxDEV` from the unoptimized `react/jsx-dev-runtime.js`. That response was CommonJS (`module.exports`/`require`), not an ESM module exporting `jsxDEV`. The explicit optimizer list contained the production JSX runtime but omitted the development JSX runtime. This is a concrete module-linkage defect capable of preventing React mounting, independent of any extension. The empty HTML root left no visible explanation when the module graph failed. No browser console stack was captured; this diagnosis comes from served module responses, not a fabricated browser trace.

The correction explicitly includes `react/jsx-dev-runtime` in dependency optimization. Fresh served modules now point to its optimized ESM wrapper. The root HTML contains visible startup/disclosure content even if JavaScript cannot load. A dependency-free entry/bootstrap dynamically loads the React mount and converts loading or synchronous mounting failures to constant text. A React boundary and constant root error callbacks handle render failures without exposing exception details. Successful mounting replaces the initial HTML fallback.

CSS contains no content-hiding rule. The startup component graph contains no eager ledger/WASM initialization. The controller still waits for explicit discovery, connection and signing actions; initial rendering needs neither `window.midnight` nor a wallet. No CSP, loopback restriction, explicit mode, production refusal, version rule, framing check or wallet-selection requirement was weakened. Normal frontend routes and operational workflows are unchanged.

### Validation and limitation

`npm run test:frontend`: **5 files, 94 tests passed, zero skips**, exit 0. Eight new startup tests cover absent extensions, visible disclosures/discovery/results, inert mounting-module import, static fallback, module/mount failure, successful fallback replacement, render-boundary output and JSX optimizer/CSP rules. These are mock/server-render/static tests, not browser confirmation.

Frontend typechecking, targeted probe TypeScript checking, app and targeted probe/startup-test lint, and `npm run build:frontend` passed. The normal build remains 27 modules with the original five public output files and no probe assets or symbols. JSON, exact inventory verification, historical-prefix checks, managed/cache preservation and `git diff --check` are recorded in refreshed integrity evidence.

No installed WSL Chromium/Chrome/Firefox/headless browser, Playwright/Puppeteer package or browser automation tool was found in the inspected locations. Nothing was installed. **No actual served-page browser smoke check or screenshot ran.** HTTP 200 and corrected module responses do not establish that browser rendering succeeds. Manual rendering remains outstanding, which is why classification stays blocked.

Both diagnostic Vite sessions were stopped with SIGINT (exit 130); no matching probe server remains in visible WSL `/proc`. The initial sandbox launch failed before listening; authorized loopback inspection then used the approved outside-sandbox command. Docker and Midnight services are unnecessary and were not used. Only local public HTML/CSS/JS responses were read, never a wallet or service endpoint.

For the later wallet test, normal non-Incognito Chrome is recommended because extension availability in Incognito is separate from page startup. The page must first render correctly with no extension at all. 1AM 6.3.11 remains unqualified and its connector API version must still be discovered independently after the rendering gate is accepted. No signing, proof, transaction, onboarding or participant record occurred. R61 remains open.


## 2026-09-25 — Accepted manual rendering and exact connector compatibility

Classification: `ADDRESS_BINDING_PROBE_READY_AWAITING_MANUAL_1AM_RESULT`.
The prior `BLOCKED_MANUAL_PROBE_RENDER` is superseded by the user's accepted normal-Chrome rendering observation. The heading, disclosures, discovery button, selection, disabled action buttons and Redacted result rendered. No raw wallet value was displayed or recorded; no Connect or Sign occurred. This is user-executed evidence, not a Codex browser run. No server was started in this correction pass.

Observed 1AM product version is `6.3.11`, injection entry `1am`, rdns `com.midnight.1am`, connector API `4.0.0`. Lace reported rdns `io.lace.wallet`, connector API `4.0.1`. Both were previously marked unsupported with Connect disabled; Sign remained disabled without connection. Product and connector versions are distinct. Chrome DevTools' `/.well-known/appspecific/com.chrome.devtools.json` warning is an unrelated, harmless automatic workspace probe. `connect-src 'none'` remains unchanged.

The official v4.0.0 tag resolves to `91044d7ba8e50bb1f2d67f95c8c3d1f8642727b8`; v4.0.1 resolves to `e1ac4e746ced0b60d26ef23e379476c5db9ea2bc`. Retrieved specifications and `src/api.ts`, timestamps, final URLs, byte identities and reproducible comparison are in `evidence/2026-09-25-preprod-mvp-001/connector-tags/`. InitialAPI, configuration/status, unshielded-address access, signData/options/response and signing-frame sections are identical for this subset, and match the installed 4.0.1 declarations. Only functional API changes are optional `payFees` additions to three transaction methods; ancillary version, generated documentation, grammar and newline changes also exist. No current-main signature changes were adopted. The identical response-encoding ambiguity is handled by the existing strict canonical decoding rules, not wallet-response inference.

Exact `4.0.0` and `4.0.1` profiles are now reviewed; no broader version range is accepted. This establishes connector-standard compatibility, not 1AM or Lace runtime conformance. 1AM's prior rejection is explained by the exact-4.0.1 filter. Lace's actual descriptor is unknown: an own accessor, inherited function/accessor, absent or noncallable member can fail the old own-function-data filter. No getter or wallet method was invoked to infer its shape.

The API defines a callable structural property, not an own-data-only descriptor. Discovery now reports fixed compatibility reasons and descriptor shapes without invoking getters. Selection remains explicit. Only the dedicated Connect click resolves the reviewed member once and invokes it synchronously with the original object as receiver. Missing, noncallable, unreadable, changed, duplicate and unreviewed entries fail closed. Accessors are labelled `CONNECT_REQUIRES_CLICK_RESOLUTION`; this is permission to attempt resolution, not proof of working capability. Reflection can trigger hostile Proxy introspection traps; no Proxy fallback or authenticity claim is made.

Never screenshot wallet extension prompts or raw wallet payloads. Capture the Redacted result only after confirming it contains no address, challenge, nonce, signature, key or raw returned object. Nothing sensitive belongs in repository evidence. No wallet implementation is qualified yet.

For the separate manual test, use normal Chrome and start only the development probe with:

```sh
node_modules/.bin/vite --config tools/address-capability/vite.config.ts --mode capability-probe
```

Open `http://127.0.0.1:5174/`, explicitly discover and select the intended 1AM entry. Confirm the exact reviewed API and fixed discovery reason. Only then use Connect; only after Preprod checks pass use the separate capability Sign action. Reject any transaction or secret request. Report only the allowlisted identifiers, versions, booleans, encoding categories and fixed outcome/error category; record extension product version separately. Stop the development server afterward. These manual wallet actions were not performed by Codex.

Even a passing capability test creates no participant and does not satisfy the 70-user requirement. A separately implemented, finalized app-specific Preprod transaction and independent transaction verification remain necessary. R61 remains open. No contract, wallet service, Docker, proof or transaction operation occurred in this pass.

Validation and exact changed-file identities are recorded in `evidence/2026-09-25-preprod-mvp-001/compatibility-validation.json` and `integrity.json`. Historical report/guide bytes remain exact prefixes. The normal production frontend excludes the probe. All 20 managed artifacts, seven parameter-cache files and prior protected evidence remain preserved.


## 2026-09-25 — One manual connection; local readiness and post-connect diagnostics

Classification: `LOCAL_VERIFIER_PREFLIGHT_READY_AWAITING_MANUAL_RESULT`.
The operator approved exactly one connection request from `http://127.0.0.1:5174`. 1AM displayed Preprod and synced status. The accepted redacted result is recorded exactly in `evidence/2026-09-25-preprod-mvp-001/manual-first-connection-result.json`. API `4.0.0` was accepted, `signData` was callable and both Preprod checks passed. The flow failed before `CONNECTED`, with `CAPABILITY_FAILED`. Sign never became available and `signData` was not called. No signing prompt, transaction, proof, fee, transfer, contract call or submission occurred. No raw wallet value, response, exception or popup screenshot was retained.

The old generic category cannot establish whether address retrieval/validation or verifier initialization failed. No root cause is inferred from that result. The probe now separates **Prepare local verification runtime** from wallet access. This explicit click imports the existing local primitives/WASM and checks callable function shapes only; it performs no cryptographic operation. It retains the module privately in memory. Initial render remains inert, and Connect stays disabled until `LOCAL_VERIFIER_READY`. Import/interface failures expose only `LOCAL_VERIFIER_IMPORT_FAILED` or `LOCAL_VERIFIER_INTERFACE_INVALID`, never exception details. Repeated readiness clicks do not reload a prepared runtime or retry a failed one.

Connect now distinguishes `CONNECTION_STATUS_REQUEST_FAILED`, `CONFIGURATION_REQUEST_FAILED`, `PREPROD_MISMATCH`, `UNSHIELDED_ADDRESS_REQUEST_FAILED`, `UNSHIELDED_ADDRESS_RESPONSE_INVALID`, `UNSHIELDED_ADDRESS_FORMAT_INVALID`, `LOCAL_VERIFIER_NOT_READY`, `CONNECTED_API_METHOD_CHANGED`, `WALLET_CONNECTION_LOST`, and `UNEXPECTED_CONNECT_STAGE_FAILURE`. The connected methods are identity-bound; failures clear connected API, address, verifier and method references. Every failure permanently blocks signing and further controller operations for that page state. Reset means a fresh page state; **no wallet retry is authorized by this task**. A future connection requires separately reviewed retry authorization, even after local readiness succeeds.

Address processing admits one own data field named `unshieldedAddress`, with a string value. Arrays, getters, symbols/extra fields and nonstrings are rejected without reading accessors. This is a conservative probe acceptance policy for the tagged response type, not a claim that TypeScript forbids structural supersets. Canonical lowercase Preprod Bech32m, exact 32-byte payload and re-encoding equality remain mandatory. Signature framing, the exact `4.0.0`/`4.0.1` profiles, address-to-key comparison and expiry checks are unchanged. The verifier is no longer loaded during Connect.

For the next separately reviewed **local-only** manual observation, open the development probe and use only Prepare local verification runtime. Record its constant status. Do not discover/connect/sign or retry the failed wallet attempt in this task. No server or browser-wallet action was run by Codex during this correction. Prior accepted rendering remains historical; the new control is covered by mock/render tests, not a fresh manual browser observation.

Validation commands and final counts are in `evidence/2026-09-25-preprod-mvp-001/post-connect-validation.json`; exact changed-file hashes are in `integrity.json`. The original report and guide remain exact prefixes. Production excludes the probe; protected source, historical evidence, 20 managed artifacts and seven cache files remain unchanged. A passing local readiness check does not qualify 1AM, create a participant or satisfy the 70-user requirement. R61 remains open.


## 2026-09-25 — Local verifier import blocker and public self-test hardening

Classification: `BLOCKED_LOCAL_VERIFIER_IMPORT`.
The user clicked only **Prepare local verification runtime** and obtained the exact result saved in `evidence/2026-09-25-preprod-mvp-001/manual-local-verifier-result.json`: `LOCAL_VERIFIER_IMPORT_FAILED`, signing blocked, no selected wallet. Discovery, Connect and Sign were not used. No wallet prompt/API, Preprod, proof, transaction, Midnight service or Docker operation occurred. No address, challenge, nonce, signature, key, raw wallet response, exception or screenshot was retained. The user's Vite server was stopped afterward. This local failure does **not** establish the cause of the preceding wallet-connection failure.

The installed ledger package is `8.1.0`. Its browser export loads generated JS glue, local snippets with `#self` references and a 10,143,782-byte WASM module. Loopback inspection confirmed that the inline transform covers the dynamically reached graph; the module URLs returned JavaScript, with no remote or separate WASM fetch. The original served graph evaluates in an isolated JavaScript VM and exposes both expected functions. It emitted synchronous WASM compilation/instantiation in browser code. The loader now uses asynchronous `WebAssembly.instantiate` over the same inline bytes, retaining `connect-src 'none'` and `wasm-unsafe-eval`. Server-side WASM inspection remains unchanged. Synchronous large-module compilation is a compatibility concern; it is not a proven diagnosis of the Chrome failure.

The development loader is now lightweight and inert on import; its explicit initializer isolates ledger/WASM evaluation. Local preparation distinguishes `LOCAL_VERIFIER_IMPORT_FAILED`, `LOCAL_LEDGER_INITIALIZATION_FAILED`, `LOCAL_VERIFIER_INTERFACE_INVALID`, `LOCAL_SIGNATURE_SELFTEST_FAILED` and `LOCAL_ADDRESS_SELFTEST_FAILED`. It retains only fixed categories on failure and permanently blocks the page state. Initial rendering does not initialize the ledger. A successful preparation now verifies a fixed **public test-vector** signature, rejects altered message and signature data, and compares the derived address payload with the fixed expected payload. This vector is unrelated to participation; only public message/key/signature/payload constants enter the browser, never private test key material. No wallet data is used.

The corrected served graph passes signature and address checks in an isolated Node VM. This checks ESM evaluation and WASM functions but is **not a Chrome/CSP/browser confirmation**. No installed browser runner was available, and no browser was installed. The exact manual browser failure therefore remains unproven; readiness is not claimed. The graph-check utility initially mistook a dependency documentation example for an import; the scanner was corrected to use the installed module lexer, and the successful rerun is retained without raw exception text. The separate loopback server used for public module inspection was stopped.

No wallet retry is authorized. The next review must address only the fixed local readiness/self-test result; do not Discover, Connect or Sign. The previous manual connection and this local import blocker remain separate observations. Neither a successful local self-test nor a later capability signature would create a verified participant or satisfy the 70-user requirement. R61 remains open.

Exact validation commands/results, package and source identities, public module-response hashes and changes are recorded in `local-verifier-validation.json`, `local-verifier-diagnosis.json`, `local-verifier-served-graph.json` and the refreshed `integrity.json` in the same evidence directory. This addendum preserves the prior report/guide bytes exactly. No dependencies, contract/generated/managed artifacts, cache, historical phase evidence, operational workflow or production configuration were modified.


## 2026-09-25 — Accepted Chrome public self-test; terminal page correction

Classification: `LOCAL_VERIFIER_BROWSER_SELFTEST_PASSED_AWAITING_WALLET_RETRY_AUTHORIZATION`.
The user-executed Chrome retest used only **Prepare local verification runtime**, returning exactly `LOCAL_VERIFIER_READY`, `overall: NOT_TESTED`, no selected wallet and all wallet/signature-result booleans false. The exact allowlisted result and observations are saved separately as `manual-local-verifier-success-result.json` and `manual-local-verifier-success-observations.json`. The earlier failed result remains unchanged. The successful local public-vector self-test confirms asynchronous ledger/WASM initialization, the reviewed interface, valid-signature acceptance, altered-message/signature rejection and expected public-address derivation. The result's wallet-signature booleans correctly remain false: no wallet data was verified.

No discovery, connection, signing, proof, transaction, Docker, Midnight service or Preprod operation occurred. No sensitive values, raw response, exception or wallet screenshot were retained. The user's server was stopped afterward. This is user browser evidence, not a Codex browser execution. It supersedes the local import blocker without asserting the cause of the earlier wallet-connection failure. It does not qualify 1AM, create a verified participant, submit the required app transaction or satisfy the 70-user requirement.

`PASSED` is now terminal. Controller and UI guards reject preparation, discovery, selection, connection and signing after success; the final redacted result remains visible. Failure remains permanently blocked. Private references are cleared after signing. Any further attempt requires a fresh page and separate authorization. Local-preparation busy text now says “Preparing local verification runtime. No wallet access.” Wallet-wait text is reserved for Connect/Sign. The rendered view is shared with focused UI assertions; initial rendering remains inert.

### Proposed one-shot 1AM retry — not authorized or executed

1. After separate authorization only, start the development-only server from the repository root with node_modules/.bin/vite --config tools/address-capability/vite.config.ts --mode capability-probe. Open a fresh normal-Chrome page at http://127.0.0.1:5174/. Do not reuse a completed or failed page.
2. Click Prepare local verification runtime once. Require LOCAL_VERIFIER_READY; otherwise stop and report only the fixed result.
3. Click Discover injected wallets once and explicitly select the intended 1AM entry. Do not select another wallet or the first entry by default.
4. Check product version 6.3.11 in extension management separately. Require entry 1am, rdns com.midnight.1am and connector API 4.0.0. Identifiers alone do not prove authenticity. Stop on any mismatch.
5. Click Connect selected wallet to Preprod once and approve only the single expected connection request from http://127.0.0.1:5174. Both connected status and configuration must say preprod.
6. Immediately stop on any fixed connection, address, method or network failure. Do not reconnect, reload to retry, switch wallets, or bypass an error.
7. Only if overall is CONNECTED, read the nontransactional capability disclosure and use the separate Sign click once. This is the public capability-test domain with a synthetic contract value, never participation evidence.
8. Reject and stop on any transaction, fee, transfer, contract-call, secret or unexpected request. No automatic or overall retry is permitted.
9. Report only the allowlisted Redacted result and separately observed product version. Never retain an address, challenge, nonce, signature, key, raw response, exception or wallet-popup screenshot.
10. After the result, close the page and stop the server. PASSED is terminal, as is failure. A further attempt requires a fresh page and separate authorization.

The machine-readable proposal is `evidence/2026-09-25-preprod-mvp-001/proposed-manual-1am-retry.json`, with `authorized: false` and `validForExecution: false`. This task does not grant permission to follow it. The prior exact API profiles, signature framing, address comparison, expiry and privacy checks are unchanged. R61 remains open.

Validation commands/counts and file identities are in `browser-selftest-validation.json` and the refreshed `integrity.json`. Report and guide prior bytes remain exact prefixes; historical failures, dependencies/configuration, 20 managed artifacts and seven cache files remain unchanged. No server or wallet was started by Codex in this pass.


## 2026-09-25 — Explicit one-shot user authorization

Classification: `MANUAL_1AM_CAPABILITY_ATTEMPT_AUTHORIZED_AWAITING_USER_RESULT`.
The user explicitly authorizes exactly one user-executed manual 1AM capability attempt under the unchanged proposal SHA-256 `cbda06a4f06e17ea15bfe6599f9fbbe3546f124270b1be15e91d19e094072494`. The separate record is `evidence/2026-09-25-preprod-mvp-001/manual-1am-retry-authorization.json`, SHA-256 `2b5c1cd333ede54a32d07bb8b7b52e7495f513925cf5f73c5709b2f7f46ae357`. The proposal itself remains disabled and byte-identical; this record does not authorize Codex execution.

Require a fresh page, successful local preparation, explicit selection, 1AM product `6.3.11`, entry `1am`, rdns `com.midnight.1am`, connector API `4.0.0`, and exactly `preprod`. At most one explicit connection request is permitted, followed by at most one separate nontransactional `signData` gesture only after `CONNECTED`. Follow the ten-step proposal above; stop on any mismatch, failure or unexpected request. Authorization is consumed by the first Connect invocation, wallet prompt, or terminal failure after discovery, whichever occurs first. Consumption reserves this one attempt: a successful connection may proceed to its single authorized Sign gesture, but cannot authorize another connection or retry. No automatic or manual retry is allowed.

No transaction, fee, transfer, contract call, proof, deployment, Docker/Midnight service operation, participant creation or app-specific Preprod receipt is authorized. Report only the allowlisted Redacted result; retain no sensitive payload or wallet-popup screenshot. Close the page and stop the server after the result. Runtime consumption and outcome await the user's report. Nothing was started or invoked by Codex. The correct prior classification remains `LOCAL_VERIFIER_BROWSER_SELFTEST_PASSED_AWAITING_WALLET_RETRY_AUTHORIZATION`; no historical evidence was rewritten for a response spelling issue. R61 remains open.


## 2026-09-25 — Authorized attempt consumed; pre-sign status revalidation blocked

Classification: `BLOCKED_1AM_PRE_SIGN_STATUS_REVALIDATION`.
The user performed the authorized one-shot attempt using 1AM product `6.3.11`, connector `4.0.0`, at the authorized localhost origin. The exact pre-sign `CONNECTED` and terminal `FAILED` results are separately saved as `manual-authorized-attempt-pre-sign.json` and `manual-authorized-attempt-terminal.json`. Authorization is **consumed**, with no retry authorized. The disabled proposal, authorization record and earlier manual results remain byte-identical. No screenshot or raw wallet data was saved.

Static order after Sign: validate CONNECTED/private references → generate an in-memory nonce and encode/frame the challenge → check method identities → first pre-sign `getConnectionStatus()` request → only on success fetch configuration and check Preprod → check expiry and `signData` identity → invoke `signData` → verify returned data → post-sign status/address/expiry checks. The reported category plus `signingCompleted: false` locates failure at the first pre-sign status request boundary (second status call overall), before `signData`. On this reviewed path the probe neither requested nor received a wallet signature. A signing prompt was not explicitly reported, so none is claimed. The retained `preprodConfirmed: true` describes the earlier successful connection check, not successful fresh revalidation.

`request()` collapses synchronous invocation/thenable failure, promise rejection and the 120-second timeout into `CONNECTION_STATUS_REQUEST_FAILED`. No elapsed time or raw exception was supplied; timeout versus rejection cannot be determined. Tagged `4.0.0`/`4.0.1` source describes querying whether an existing connection remains valid and imposes no single-call restriction. Intended reuse is supported by that API contract, but vendor runtime conformance is unknown. The controller preserves the original receiver via `connected.getConnectionStatus()` and retains the same instance until failure. A detected method-identity change has a different category. No premature client disposal, detached receiver or deterministic client defect was established. The installed connector package is not the 1AM extension implementation. Source locations and hashes are in `manual-authorized-attempt-adjudication.json`.

No code, network checks or retry policy was changed. Repeated capability retries should not remain the critical path. A finalized app-specific transaction could establish participation, but it does not inherently authenticate a claimed address: hashing an address, receiving an output or paying DUST is insufficient. A separately reviewed design could potentially require an authorized unshielded spend from the claimed address within the same finalized receipt transaction, with verified ownership and campaign/receipt linkage. Pinned indexer types expose spent-output owners and contract actions, but the existing path does not guarantee such a spend or establish a complete independently verifiable construction. That alternative needs a separate address-binding design gate; it is not implemented or authorized here.

Read-only WSL process/socket observation found no probe process and no listener on port 5174. This confirms current server absence in WSL, not browser page closure or the exact shutdown event. Closing the page and stopping the server remain user-instructed; page closure was not independently verified. No Vite/browser/wallet/Preprod operation was performed by Codex. No unrelated suite was rerun: this pass is documentation/evidence-only. JSON, hash/prefix preservation, protected source/dependency/managed/cache comparisons and diff validation are recorded in the refreshed integrity manifest. R61 remains open.
