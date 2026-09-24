# 2026-09-25 demo implementation and local-CI recovery

Classification: `2026-09-25_DEMO_READY_FOR_USER_COMMIT_AND_REMOTE_CI`

Baseline: `8af94a2794fde1a6e09105734621bfe10d65134e`, `docs(protocol-v2): Harden R61 public component characterization plan`. WSL, unstaged demo-only scope, historical evidence and managed-artifact preservation passed before this recovery. Nothing was staged, committed or deployed.

## Frontend and feedback

`/` retains the public landing view; `/demo` provides the guided issuer → holder → verifier → revocation simulation, reset, persistent disclosures and disabled live controls. Public Preprod configuration is display-only and unavailable when missing; it never becomes simulated live success. Absolute header/hero links reach `/demo`; `/demo#demo-progress` exists. The original `/deploy` source and operational scripts are preserved. The frontend build excludes the deployment SDK graph and managed keys.

Valid credential-free HTTPS `VITE_FEEDBACK_URL` completely replaces local feedback, including the sticky link, and opens only on explicit action. The form may collect a public Midnight Preprod address with consent to activity checks and program address-list inclusion. The UI explains linkability, control of the submitted address, and that public addresses confer no wallet access. Seed/recovery phrases, private/spending/viewing keys, passwords, signing material and credential secrets are prohibited. Feedback submission is explicit. A submitted address after simulation is not proof of on-chain participation.

Absent/invalid URLs show only fixed-choice copy/download fallback, with no rejected URL exposed. It prohibits addresses/secrets and does not satisfy mandatory Google Sheet or verified-user requirements. The guide specifies consent, deduplication, verification status/evidence references and separate counts for simulation users, respondents, address suppliers and independently verified Preprod participants. No form URL or tester data was added.

## Historical failure record — corrected

The supplied historical transcript is authoritative but is not a fresh run: **15 passed, 2 failed, 17 total files; 486 passed, 1 failed, 2 skipped, 489 total tests**. Suite setup failed in `test/just-proof.test.ts`; the structural failure was `test/contract/v3c-public-surface.test.ts`, not the uploaded v3d test. These figures explicitly supersede the previously recorded 16/1-file and 487-passing-test figures.

## Structural oracle repair and evidence writes

The first service-free v3c run passed 2/2. Inspection of installed `CompactTypeBytes.toValue` in `node_modules/@midnight-ntwrk/compact-runtime/dist/compact-types.js` showed that trailing zero bytes are trimmed. The old randomly generated 32-byte canaries were compared byte-for-byte with the canonical private transcript, so a trailing-zero canary intermittently failed a positive control. A deterministic trailing-zero fixture reproduced that exact assertion failure (1 passed, 1 failed). This is an oracle representation defect, not evidence of a contract disclosure regression or a newly changed runtime.

The final fixture uses deterministic SHA-256-labeled, trailing-zero canaries and asserts uniqueness of canonical atoms. Public-surface checks inspect both raw and canonical forms; private positive controls inspect canonical forms. Every existing ABI, transcript, effect, disclosure and ledger privacy assertion remains; diagnostics identify atom category and surface. Repaired v3c passed 2/2, followed by a combined v3c/v3d run passing 4/4. No contract or generated artifact changed.

The recurring historical-file modifications were caused by tests: v3c/v3d surface tests and snapshot tests wrote directly into `docs/development/evidence/phase-3d`. Their output now goes into unique `mkdtemp` directories under the OS temporary directory. Assertions and snapshot collection remain intact. Historical evidence is never rewritten by these tests. The v3d test received only this output-path change; it was not relabeled as the historical failing test.

## V2 integration harness repair — later validated by the user

The old suite imported `CompiledJustProofContract` with vacant witnesses, supplied empty private state/no V2 constructor context, and called removed `storeMessage`/`ledger.message` APIs. `test/just-proof.test.ts` now builds the generated `Contract<PS>` with all five exact typed callbacks. Authority and issuer callbacks return detached bytes/paths; the other three fail closed with constant errors, as permitted for this focused case. The constructor receives the synthetic registry context and authority state.

Two ordinary, non-skipped tests each use a fresh local deployment. One compares the exact nine-field initial public state; the other calls the SDK’s finalized `submitCallTx(registerIssuerV2)` and compares the expected issuer root/counter/leaf-set change with every unrelated field unchanged. No `any`, vacant witnesses, obsolete Message APIs or permissive success catches were introduced. The reviewed restricted memory provider was copied into `test/support/local-v2-memory.ts`; no LevelDB database is used. Private values are not logged. The existing wallet wrapper receives a silent logger; no unrestricted process-level exception/rejection handlers are installed. SDK errors are converted to stage-only constants. Wallet stop, scoped WebSocket termination, global transport restoration and memory disposal are in finalization paths.

There is no overall deployment/application retry loop. The pinned HTTP provider’s internal bounded retries remain a runtime limitation; they have not been exercised in this recovery. The targeted TypeScript check passed after correcting three iterative scoped-WebSocket type errors. A subsequent user-executed full-suite run passed both integration cases, as recorded below. That result does not independently establish every cleanup/privacy/containment property.

## Earlier Codex local environment decision (retained history)

All three exact local image IDs were inspected and recorded in `recovery-service-inspection.json`. Two network-disabled, read-only, capability-dropped ephemeral shell probes inspected parameter path presence only, without running the proof-server binary or reading parameter contents. `HOME=/`; candidate `/.cache/midnight/zk-params`, `/.cache/midnight`, `/root/.cache/midnight/zk-params` were absent, and `/nix/store/**/*bls_midnight*` had no matches. These observations do not identify an exact missing required parameter name or disprove embedded material. The exact service/native-wallet resolver, filename set and compatibility remain unestablished; the seven host compiler parameters cannot silently substitute for them.

No service topology was launched. No internal-network/host-loopback containment claim was made from static configuration alone, and no temporary override was represented as validated. This leaves the no-download service gate unresolved. No parameter was downloaded, copied or mounted. The only Docker executions were the two public metadata shells; they exited 0 and were automatically removed. Retained Phase 3E3A1 containers remain stopped, and no project service is running.

At the earlier Codex stopping point, the focused SDK integration and full `npm run test:local` had **zero Codex invocations**, no captured exit code and no fresh counts. `test-local-preflight.txt` is explicitly a preflight/diagnosis record, not a fabricated full-suite transcript. That earlier unexecuted status is superseded by the later user-executed successful run; its provenance is distinct.

## Validation and CI

- Four structural invocations: original pass 2/2; diagnostic fail 1/2; repaired pass 2/2; combined pass 4/4. Exact commands/durations/exits are in `recovery-invocations.json`.
- Targeted integration TypeScript: final exit 0; earlier iterative diagnostics retained in invocation evidence.
- `npm run test:frontend`: 19/19 passed, one file, 1.30s.
- `npm run typecheck:frontend`, `npm run lint`, `npm run build:frontend`: exit 0. Frontend build: 27 modules, JavaScript 207.60 kB (65.01 kB gzip), CSS 15.21 kB.
- JSON/YAML parsing, preservation/cache comparisons and final `git diff --check` passed.

The workflow now pins setup to Compact **0.31.1**, and the directly required `compile` script explicitly uses `compact compile +0.31.1`. Existing `npm run ci` retains lint, full Compact compilation, full TypeScript and Preview frontend-build gates. The workflow additionally requires frontend tests, focused frontend typecheck/build, targeted V2 integration TypeScript, and the existing `npm run test:local`. Required gates were not removed, skipped or made optional. Protected Preview/Preprod test/deploy scripts and `/deploy` are unchanged.

Unrestricted `docker compose logs` and raw `compose ps` failure dumps were replaced by `scripts/ci-service-status.py`. It requests only IDs internally and four public status scalars, suppresses subprocess stderr, validates every emitted value, imposes five-second command timeouts, and emits at most three fixed-schema JSON records. It never requests logs, environment, mounts, requests, transactions or private state. A one-minute workflow timeout bounds the diagnostic step. Cleanup remains an `always()` step after a started/attempted environment, covering ordinary success, failure and cancellation; abrupt runner loss cannot be guaranteed by a workflow. No parameter-download command or runtime no-egress claim was added.

Hosted GitHub Actions remains unobserved until the user commits and pushes. Its compiler-bearing job may reveal existing repository-wide integration/type diagnostics; local frontend and targeted integration checks are not a claim that the complete hosted compiler/build job has passed. No Compact build or managed-artifact regeneration ran in this acceptance pass.

## User-executed post-response full-suite validation

The user supplied successful Vitest/npm completion for `npm run test:local` against this working tree: **17/17 test files passed; 489/489 tests passed; zero skipped; 310.01 seconds**. Both `test/just-proof.test.ts` cases passed: exact nine-field deployment and finalized `registerIssuerV2` transition. Codex did not run this command or capture its direct shell `$?`. The supplied completion summary is recorded as user evidence, not a reconstructed raw transcript or Codex shell-exit observation.

Current integration, structural and support test hashes match the preceding 31-file manifest. The user identifies those working-tree files as the executed version; no separate test-time manifest was supplied. The passing run therefore reconciles with current files without a protocol rerun. The original historical failing run, all four Codex structural invocations and iterative static typechecks remain separately recorded.

Post-run read-only Docker inspection found no repository Compose containers. Only the two retained, stopped Phase 3E3A1 containers remain; neither was changed. No stop was needed. Project mounts, writable layers and logs are unavailable because those containers are absent. The seven host parameter-cache files match their saved pre-run names, sizes and hashes with no additions or mutations. Contract/source/managed/historical preservation also passes. This is **no observed host-cache mutation**, not proof that the manual run performed no container-side download; origin/download evidence cannot be recovered from absent logs. No-egress containment was not retroactively proven and remains separate infrastructure hardening.

## Outstanding acceptance requirements

The local full-suite gate is satisfied by the user-executed run and CI is statically aligned. Hosted CI execution remains pending commit/push; stronger runtime containment and parameter-download provenance remain separate hardening. Separately outstanding: a Google-Sheet-backed public feedback URL, manual mobile/keyboard/clipboard/download/public-form/deep-link checks, static HTTPS hosting, and live Preprod integration with independently verifiable participation. A desktop screenshot and simulation use do not establish those conditions or the 70 verified Preprod users.

See [operator guide](2026-09-25-demo-guide.md). No client secrets or new dependencies were introduced. Frontend hosting is distinct from Midnight contract deployment. No proof, ledger, wallet, Preprod or compiler operation ran by Codex in this acceptance pass. The separately recorded user run exercised the authorized local integration. R61, A4A, A4 and Phase 3E3B remain open; Preprod MVP 001 has not begun.

## Inventory and hashes

The final integrity manifest under `evidence/2026-09-25-demo/` records exact sizes/hashes, final Git status and preservation results, excluding its own recursive hash. The source/managed/cache/historical inputs remain unchanged; test code changes are confined to the files listed below.

Suggested manual commit (not created): `feat(demo): Add guided simulation and restore local V2 CI`

Exact final changed-file inventory:

- `.github/workflows/ci.yaml`
- `app/PublicApp.tsx`
- `app/components/Header.tsx`
- `app/components/Hero.tsx`
- `app/demo/Demo.tsx`
- `app/demo/demo.css`
- `app/demo/state.ts`
- `app/index.css`
- `app/main.tsx`
- `docs/development/2026-09-25-demo-guide.md`
- `docs/development/2026-09-25-demo-implementation-report.md`
- `docs/development/evidence/2026-09-25-demo/cache-after.json`
- `docs/development/evidence/2026-09-25-demo/cache-before.json`
- `docs/development/evidence/2026-09-25-demo/integrity.json`
- `docs/development/evidence/2026-09-25-demo/local-ci-investigation.json`
- `docs/development/evidence/2026-09-25-demo/post-run-service-cache-review.json`
- `docs/development/evidence/2026-09-25-demo/preservation-baseline.json`
- `docs/development/evidence/2026-09-25-demo/recovery-invocations.json`
- `docs/development/evidence/2026-09-25-demo/recovery-service-inspection.json`
- `docs/development/evidence/2026-09-25-demo/test-local-preflight.txt`
- `docs/development/evidence/2026-09-25-demo/tsconfig.integration.json`
- `docs/development/evidence/2026-09-25-demo/validation.json`
- `package.json`
- `scripts/ci-service-status.py`
- `test/contract/v3c-public-surface.test.ts`
- `test/contract/v3c-revoke-credential.test.ts`
- `test/contract/v3d-prove-qualification.test.ts`
- `test/contract/v3d-public-surface.test.ts`
- `test/frontend/demo.test.ts`
- `test/just-proof.test.ts`
- `test/support/local-v2-memory.ts`
- `tsconfig.frontend.json`
- `vite.frontend.config.ts`
- `vitest.frontend.config.ts`
