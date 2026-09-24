# 2026-09-25 demo: operator and tester guide

Classification: `2026-09-25_DEMO_READY_FOR_USER_COMMIT_AND_REMOTE_CI`.

This is a browser-local simulation. No wallet, proof server, Docker, tokens, proof or ledger connection is required. State lives only in the current React page and resets on reload or Reset demonstration. Do not enter real credentials or secrets.

## Start and build

Use the existing installed dependencies and Node 24:

```sh
npm run dev -- --host 127.0.0.1
# Open /demo on the displayed local address.
npm run test:frontend
npm run typecheck:frontend
npm run lint
npm run build:frontend
```

`build:frontend` writes static assets to `dist/` and always disables the operational deployment route. It does not compile Compact or copy keys. Do not use `npm run build`, `netlify:build`, or the existing Netlify build workflow for this demo: those are separate compiler/deployment workflows. Existing operational scripts and `/deploy` source are unchanged. Local operators may still use their existing explicitly enabled deployment workflow; this sprint does not authorize it.

## Public configuration

No variables are required. Demo mode is always simulation and cannot turn into live success.

Optional build-time public variables:

| Variable                     | Meaning                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FEEDBACK_URL`          | HTTPS public feedback form, without URL credentials. An explicit click opens it; no record is sent automatically. Leave unset for copy/download only. |
| `VITE_DEMO_STATUS_NETWORK`   | Set to `preprod` only for configuration display.                                                                                                      |
| `VITE_DEMO_CONTRACT_ADDRESS` | 64 hexadecimal characters, displayed only with the above setting. It is not contacted or validated against a ledger.                                  |

All Vite client variables are public. Never put seeds, passwords, credential data or private keys in them. Invalid/missing status configuration says unavailable. Wallet connection, live proof and transaction controls remain unavailable. No remote fallback exists.

A valid credential-free HTTPS `VITE_FEEDBACK_URL` takes precedence: only a privacy notice and external-form action are shown in the feedback section. No local record is constructed, fetched or submitted in that mode. The form is opened only by explicit user action, never preloaded. If the URL is absent or invalid, only the local fixed-choice fallback appears; the invalid URL is not exposed. Reset clears local answers only in fallback mode and never claims to reset an external form.

## Five-minute judge walkthrough

1. **0:00–0:45:** Open `/demo`. Explain the problem: sharing a whole certificate to answer one qualification question exposes unnecessary information. Point out the simulation banner and three disclosures.
2. **0:45–1:30:** Register the fictional Demo Academy. Issue the sample Builder credential to Sample Holder.
3. **1:30–2:30:** Simulate presentation. Explain the qualified outcome is a UI rule, not a cryptographic verification. Discuss private certificate/secret/path information versus public registry roots, request and digests.
4. **2:30–3:15:** Revoke, then try presentation again. Observe the rejected result. Reset in one action.
5. **3:15–4:15:** Read “What is real today?” Four implemented circuits and accepted key generation/serialization checks exist. Actual proof, verification, ledger and release integration remain unfinished.
6. **4:15–5:00:** If a public form is configured, open it explicitly. Otherwise choose local feedback and download or copy it.

## Tester guide

Try all steps in order, revocation, repeated presentation and reset. Reload and confirm no state survives. Test mobile and desktop, keyboard Tab/Enter/Space, visible focus, and the skip link. Check the simulation banner throughout and confirm disabled live buttons cannot act. Copy may require HTTPS/clipboard permission; download remains available. Feedback is fixed-choice only and contains no lifecycle, credential, wallet or browser data. General comments in fallback mode use predefined choices. A valid public form completely replaces every local field and copy/download control. The sticky feedback action opens that form too. The external form has its own privacy policy and may collect a public Midnight Preprod address with explicit consent. It must never collect wallet authentication material or credential secrets. A public address grants no wallet access but is linkable to public activity and feedback.

Check `/demo` directly and after refresh on the actual host. Confirm missing configuration shows unavailable. Check browser console for errors and ensure no application API requests occur. Assets must be loaded initially; this is not an installable offline/PWA application.

## Manual frontend hosting and rollback

No hosting action was performed. A human may separately upload the contents of `dist/` to a static HTTPS host after review. Set the host's SPA fallback so `/demo` serves `/index.html` (status 200), without rewriting existing asset files. Use the safe frontend build command above, not this repository's existing `netlify.toml` build command. For a manual artifact upload no backend, keys, `.env`, repository evidence or `node_modules` should be uploaded. Inspect `dist/` for frontend assets only.

Before switching traffic, retain the previous frontend artifact/deployment ID. Validate root, `/demo`, refresh, feedback, mobile and keyboard behavior on a preview URL. Promote manually only after review. Roll back by selecting the previous static deployment or restoring its saved files and fallback settings. Frontend hosting is not Midnight Preprod contract deployment.

## Limits

Approximately 70 users each have independent browser state; there is no shared server session. This is not a load-test or blockchain/proof-server capacity claim. Mobile, keyboard, clipboard/download, public-form and hosted deep-link validation remain manual until actually checked in a browser. A desktop screenshot is not proof of those behaviors. Focused typechecking covers the public frontend graph and demo tests; the existing operational deployment integration is excluded. R61 remains open. A4A, A4 and Phase 3E3B remain unauthorized.


## Mandatory participation and feedback workflow

No production form URL has been supplied. Before public use, the operator must configure a credential-free HTTPS `VITE_FEEDBACK_URL` for a form that:

- Writes every response into the mandatory Google Sheet.
- Obtains explicit consent to collect and check an address the respondent controls, associate it with feedback, and include it in the program submission’s user-address list.
- Collects the public Midnight Preprod wallet address, demo/version identifier (`2026-09-25-demo`), tasks attempted and meaningful feedback.
- Offers optional free text with a warning against secrets, credentials and unnecessary personal information. Optional contact details must be separate and optional.
- Never requests a seed/recovery phrase, private key, spending/viewing key, wallet password, signing material, credential secret or other authentication secret.
- Deduplicates addresses before counting users and records an internal verification status and evidence reference per address.
- Counts an address toward the 70-user requirement only after the applicable Preprod/on-chain participation rule has actually been satisfied and independently checked.

Keep four counts separate: static-hosted simulation users, feedback respondents, respondents supplying a Preprod address, and independently verified Preprod participants. An address submitted after simulation is not evidence of an on-chain MVP interaction. The current simulation does not satisfy the 70 verified Preprod-user requirement. Define the applicable program verification rule before counting anyone; do not infer it from a form response.

Do not commit the response sheet, address list or other tester data to the public repository. Keep access limited to the authorized program operators. The public address and public activity may be checked, but the address is linkable information and must be submitted with consent. Opening the external link is explicit; feedback is transmitted when the user submits that form. No local answers are sent automatically.

Without a valid external URL, the fixed-choice JSON is a development fallback only. It does not satisfy the Google Sheet or verified-user requirements and must never contain wallet addresses or secrets.

## Local-CI validation and remaining deployment requirements

The repaired V2 deployment/issuer-registration tests passed in a later user-executed `npm run test:local`: 17/17 files, 489/489 tests, zero skips, 310.01 seconds. Codex reconciled the current test hashes with the preceding manifest but did not capture that run’s shell exit code. The earlier historical failures and Codex-only static/structural work remain documented separately. The current frontend and targeted integration checks also pass.

Hosted CI is now pinned to Compact 0.31.1, retains compiler/integration gates, includes demo checks, emits bounded sanitized service status instead of raw failure logs, and always cleans up an attempted local stack. Hosted execution cannot be observed until commit/push. Stronger no-egress proof is not claimed. No project service currently remains; absent project containers mean their historical logs and writable layers cannot be inspected. The seven host cache files remain identical; container-side download history is unavailable.

Before public deployment acceptance, review the hosted CI result after commit/push and the remaining deployment requirements. Separately outstanding: actual Google-Sheet-backed public form URL, manual mobile/keyboard/clipboard/download/public-form/deep-link checks, static HTTPS hosting, and live Preprod integration with independently verifiable participation. Frontend hosting does not deploy a Midnight contract. No deployment, form publication or Preprod activity is authorized by this guide.
