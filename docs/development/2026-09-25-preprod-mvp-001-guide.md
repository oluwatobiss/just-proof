# Preprod MVP 001: decision guide

Status: `BLOCKED_ADDRESS_TRANSACTION_BINDING`.

There is no receipt contract or live participation workflow to run. Keep using the browser-local simulation with its disclosures. Do not count a supplied address, a client wallet-history entry, or an address hash in a transaction as independently verified participation.

Before implementation can resume, choose a route for further adjudication:

1. A signed, domain-separated participation challenge. Establish exact supported wallet versions, Preprod IDs, signing prefixes, signature verification and public-key/address derivation. Review an expanded Sheet schema carrying the public signature evidence. Do not silently restrict users to a particular wallet.
2. A guaranteed authenticated unshielded spend in the same app transaction. Establish a supported wallet construction path, independently reviewable ownership association and local funding prerequisites. Do not assume fee payment creates this association.

These are investigation options, not working implementations. Neither authorizes a network request, deployment, onboarding or data collection.

The future Sheet must distinguish form assertions from reviewer-computed checks. Outcomes remain `VERIFIED`, `DUPLICATE`, `INVALID`, `PENDING`, and `COULD_NOT_VERIFY`. No row can be VERIFIED until address control/association, finalized expected contract/circuit, campaign and recomputed receipt are independently established. Keep the Sheet and all real addresses, signatures, receipts and responses outside the repository. Do not publish the form yet.

The companion would evidence demonstration participation only, not a qualification credential, `proveQualificationV2`, or R61 completion. See the report for the pinned-source findings and missing evidence.

## MVP 001A update — selected route and manual-test hold

Current classification: `COULD_NOT_VERIFY`. The signed-challenge route has been selected; the earlier choice list is historical, not a renewed decision request.

The deterministic offline signature/address chain passes, but the wallet-added signing prefix and return encodings remain unestablished. There is **no probe route or enablement command** yet. Do not use `/deploy`, developer-console snippets or an improvised signing request to fill this gap. Do not connect or sign for this checkpoint.

The next required input is public, version-matched 1AM signing documentation/source and the relevant extension/API identifiers. Do not provide an address, signature, verifying key, seed, challenge, or screenshots containing them. An implementation profile must establish exact bytes and encodings before a browser result can be meaningful.

After that profile is implemented and reviewed, the manual procedure must be:

1. Open the separately reviewed development-only route; confirm capability-test disclosure and absence from the public build.
2. Explicitly enumerate and select the intended 1AM entry; record only wallet/extension/API identifiers. No first-wallet default.
3. Click Connect once. Both connection status and configuration must report exactly `preprod`. An unsupported method/version/network stops the probe.
4. Read the public, non-transactional capability notice, then use a separate Sign confirmation. It spends nothing and must not request secrets.
5. The probe must compare exact approved framing, verify the signature locally, derive and compare the address payload and check expiration. An unknown framing profile must stop, not be learned permissively from a response.
6. Report only wallet name, implementation/API versions, API acceptance, Preprod confirmation, method-present, signing-completed, returned-data-match, signature-verification, derived-address-match, overall result and a fixed redacted error category. Never copy payloads or screenshots containing them.

These are acceptance requirements for a future reviewed probe, **not executable instructions for the current repository**. Offline passing tests do not qualify 1AM or any other wallet. A capability signature must never be accepted as participation evidence. No user counts, receipt transactions, Google Sheet collection or onboarding is authorized.

## Strict probe now prepared — 2026-09-25

Current classification: `ADDRESS_BINDING_PROBE_READY_AWAITING_MANUAL_1AM_RESULT`. The prior manual-test hold was caused by missing framing evidence; the tagged connector specification now supplies that rule. Historical text above is preserved, not a current instruction to investigate another route.

The development-only entry point is separate from `/demo` and from the normal production build. To run the manual probe later, from the WSL repository root:

```sh
node_modules/.bin/vite --config tools/address-capability/vite.config.ts --mode capability-probe
```

Then open `http://127.0.0.1:5174/` manually in the browser with the intended extension. The command has not been run by Codex. It binds loopback only, loads no `.env`, and refuses build mode. Do not host or deploy this development root. `npm run build:frontend` remains the normal public build and excludes it.

1. In the browser's extension-management page, record the installed 1AM product version separately. Connector `apiVersion` is not that version. Use an extension you independently trust; displayed identifiers are not authenticity evidence.
2. Read the visible disclosure: no transaction, no funds spent, no verified participant, no qualification or proof. The synthetic contract value is 32 bytes of 0x11, not a deployed companion contract.
3. Click **Discover injected wallets**. Nothing is discovered on load. Inspect entry/name/rdns/API labels. Icons are not fetched. Resolve duplicate or suspicious entries outside the probe; they are blocked.
4. Explicitly select the intended entry. Only exact API `4.0.1` can be invoked. Unsupported versions remain unqualified and may continue using the simulation.
5. Click **Connect selected wallet to Preprod** and approve the connection if desired. Both connection status and configuration must confirm `preprod`; required methods and the canonical unshielded address are checked without displaying the address.
6. Read the signing notice, then separately click **I understand — sign capability test**. Approve only a non-transactional signing request. Reject any transaction or secret request. Never provide recovery words, passwords, private/viewing/spending keys or credentials.
7. Wait for the redacted result. The probe checks exact standard framing, signature, derived address, refreshed network/address and expiry. It performs no automatic retry. If a prompt times out, close/reject that old prompt before any deliberate retry; refresh clears the page's in-memory state.
8. Record only entry identifier, name, rdns, connector API version, separately observed extension version, Preprod/method/signing booleans, returned encoding categories, data-match, signature-verification, derived-address-match, expiry, overall result and fixed error category. The UI has no clipboard/export operation. Do not send an address, signature, key, challenge, nonce, wallet-returned object, or screenshot containing those values. Do not put actual runtime reports or user data into Git.
9. Close the page and stop the development server with Ctrl+C. No wallet, service or contract cleanup operation is required from this app.

A green result qualifies only the exact tested wallet implementation/API for this capability. A failed or unsupported result is not participation. No production form or receipt workflow is enabled. All qualifying participants still require their own separately implemented, finalized app-specific Preprod transaction and independent transaction verification before counting toward 70 verified addresses.

The dev server may compile already installed runtime code into `/tmp/justproof-capability-vite-cache`. That cache is for public code only; the probe never writes wallet payloads there. No package installation, production build, contract compilation or Midnight service is needed for the manual capability test.

## Rendering correction and current hold — 2026-09-25

Current classification: **`BLOCKED_MANUAL_PROBE_RENDER`**. The previous ready status was not supported by an actual browser rendering check. The reported blank page occurred before any wallet operation.

The development JSX runtime was missing from the explicit optimizer list. The served module was CommonJS where the React entry required an ESM `jsxDEV` export. That configuration is corrected. Static fallback content now explains startup failure, and controlled bootstrap/render errors show only a constant diagnostic.

The server was stopped after public-module inspection. No installed WSL browser automation was available, so manual browser rendering is still required; successful HTML/module requests and 94 passing mock/offline tests do not replace it.

For a **render-only** check, stop any old instance, run the same documented loopback command, and open `http://127.0.0.1:5174/`. Do not click discovery, Connect or Sign yet. Confirm the heading, no-transaction/no-funds/no-verified-participant notice, **Discover injected wallets**, and **Redacted result** section are visible. No wallet extension, Docker or Midnight service is necessary. If startup fails, the constant fallback should remain visible rather than an empty body. Record only the public rendering result; do not include wallet values or payloads.

Use normal, non-Incognito Chrome for the later separately reviewed wallet test; Incognito may disable the extension. This is not a workaround for a rendering defect: initial rendering must also work without an extension. The reported **1AM 6.3.11** is the extension product version, not its connector `apiVersion`. Runtime connector discovery and qualification are still outstanding. No participant can be counted from this rendering check or from a capability signature alone.


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
