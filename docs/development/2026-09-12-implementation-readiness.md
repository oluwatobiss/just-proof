# JustProof implementation-readiness audit

**Date:** 2026-09-12  
**Status:** Read-only audit; awaiting approval for Phase 1

## Repository state

The frozen V1 reference is in `PROPOSAL.md`, `docs/protocol/01-credential.md` through `10-specification.md`, and `docs/USAGE.md`. The contract source is still a placeholder (`message` and `storeMessage`). Generated bindings instead describe `dummy` and `test3`, so they are stale. No generated `keys/` or `zkir/` files are present. Providers, CLI deployment, browser `/deploy`, and Vitest tests are under `providers/`, `scripts/deploy.ts`, `app/components/DeployRoute.tsx`, and `test/`.

The working tree was clean before and after the audit. No implementation files, dependencies, generated artifacts, tests, deployment scripts, or specifications were changed during the audit.

## Verified environment

| Component | Actual value |
|---|---|
| Environment | WSL2 Linux x86-64 |
| Node / npm | `24.18.0` / `11.16.0` |
| Compact CLI | `0.5.2` |
| Installed toolchains | `0.31.0`, `0.31.1` |
| Active compiler | `0.31.1` |
| Compact language / runtime | `0.23.0` / `0.16.0` |
| CompactJS / Midnight.js | `2.5.1` / `4.1.1` |
| Ledger / Wallet SDK | `8.1.0` / top-level `1.2.0` |
| Proof server | `8.1.0`, `http://127.0.0.1:6300` |
| Supported proof versions | `V2` |

The CLI reports compiler `0.34.0` available, but nothing was upgraded. CI and Netlify currently select compiler `0.31.0`, requiring an explicit reproducibility decision.

## Scripts and validation

The actual scripts are `compile`, `test:local`, `test:preview`, `test:preprod`, `deploy:preview`, and `deploy:preprod` as defined in `package.json`. `test:local` discovers `test/**/*.test.ts`, but currently deploys and tests the placeholder contract. `npm run typecheck` failed with six diagnostics caused by stale generated bindings and placeholder references. Vitest, real ZK proving, local deployment, Preview, and Preprod commands were not run.

## V1 and V2 matrix

V1 defines one fixed demonstration qualification, three depth-16 root-only Merkle trees, secp256k1 application signatures, persistent subject and credential commitments, issuer/credential registration, issuer-authorized revocation, and a request-bound current qualification proof. The credential statement has eight fixed fields; `issuedAt` is inclusive, nonzero `expiresAt` is exclusive, and validity extends through the request deadline.

V2 replaces unavailable application signatures with knowledge proofs for independent authority and issuer secrets. It retains the holder subject secret, nine-field ledger shape, depth-16 trees, same credential/revocation index, current-state binding, and four lifecycle operations. V2 removes application-level signature fields and explicitly does not claim issuer proof of possession during registration.

| Area | V1 | Required V2 treatment |
|---|---|---|
| Authority | Sealed verification key | Sealed typed commitment to private authority secret |
| Issuer | Key-derived ID and possession signature | Independent secret, control commitment, derived ID |
| Authenticity | Portable issuer signature | Authorized transition plus credential-root membership |
| Ledger | Nine fields | Exactly nine fields; authority commitment replaces authority key |
| Trees | Shared node domain | Separate issuer, credential, and revocation node domains |
| Revocation | Credential-bound revoked leaf | Preserve binding unless explicitly changed |
| ABI | V1 circuit names | Exactly four V2 lifecycle circuits |
| Proving | Local recommended | Exact loopback endpoint; no remote fallback |

## Reproduced compiler findings

With compiler `0.31.1`, language `0.23`, minimal probes report `unbound identifier` (exit 255) for `Secp256k1Point`, `Secp256k1EcdsaSignature`, `secp256k1EcdsaVerify`, `JubjubScalar`, `JubjubSchnorrSignature`, and `jubjubSchnorrVerify`. `JubjubPoint` compiles (exit 0). Probe sources and complete logs are in `/tmp/justproof-readiness-8auqnltt/`.

The constructor probe compiled with a private authority witness and executed successfully in generated Compact JavaScript: matching secret accepted, wrong secret rejected, zero context rejected, and zero secret rejected. This was compiled-logic simulation only.

The compiler rejects `blockTimeGte(privateIssuedAt)` and `blockTimeLt(privateExpiresAt)` because the standard-library time circuit may disclose the witness time bound. No disclosure was added and no timestamp was made public. This is a V2 privacy/compiler blocker requiring a decision.

## Unresolved decisions and risks

1. Resolve private timestamp checks with the pinned compiler, or explicitly revise the protocol.
2. Decide whether V2 retains V1 `persistentCommit` for subject and credential commitments; role-control commitments separately require typed `persistentHash`.
3. Decide whether the V2 revoked leaf remains credential-bound; a constant leaf leaks the changed finite position from a known empty tree.
4. Decide whether the fixed qualification identifier remains the V1 schema identifier while protocol domains rotate.
5. Define durable browser storage for the private pending authority identity; the current browser provider is in-memory and its export is plain JSON.
6. Reconcile compiler versions used by WSL, CI, and Netlify.
7. Test one-submission transaction-ID interception around the installed deployment pipeline.
8. Hosted proof-server preflight allowed the hosted origin but omitted `Access-Control-Allow-Private-Network`; browser behavior remains untested.

## Proposed V2 documentation layout

`docs/protocol/v2/` should contain `README.md`, `00-decisions.md`, `01-credential.md`, `02-issuer-registry.md`, `03-domains-and-commitments.md`, `04-revocation.md`, `05-ledgers-and-constructor.md`, `06-merkle-tree.md`, `07-witnesses-and-disclosures.md`, `08-proofs.md`, `09-verification.md`, `10-specification.md`, `11-deployment-and-private-identity.md`, `12-conformance-vectors.md`, and `requirements.md`. The frozen V1 documents remain unchanged.

## Proposed plan

Phase 1 creates and reconciles V2 specifications, decision record, domain manifest, and requirement traceability, then stops for review. Phase 2 implements typed primitives, Merkle helpers, independent vectors, canonical roots, and the constructor, then stops for review. Phase 3 implements `registerIssuerV2`, `registerCredentialV2`, `revokeCredentialV2`, and `proveQualificationV2` one at a time with focused compilation and local tests. Phase 4 runs complete local contract, integration, conformance, ABI, atomicity, and disclosure tests. Phase 5 preserves both CLI deployment paths and adapts the additive browser route with exact loopback proving, durable pending identity, single-submission recovery, and finalized-state verification.

Tests remain in the existing Vitest setup under `test/contract/`, `test/integration/`, and `test/conformance/`; `npm run test:local` remains authoritative. No Preview or Preprod command runs without explicit approval.

## Deployment compatibility

The installed SDK pipeline is `deployContract` → prove → wallet balance → submit → finality watch → private-state/key storage. A future wrapper can capture the actual submission boundary, but one-submission/ID/address correspondence remains untested. The browser route currently lacks durable identity, finalized-ledger verification, artifact fingerprints, exact Preprod enforcement, outcome-unknown recovery, and durable concurrency protection.

Post-finality verification must check network, address, registry context, derived authority commitment, canonical issuer/credential/revocation roots, zero counters, and empty duplicate sets. Hosted loopback CORS/PNA limitations remain separate from local Vite behavior; no remote prover fallback is acceptable.

## Evidence and traceability

Temporary evidence is retained in `/tmp/justproof-readiness-8auqnltt/`, including exact probe sources/logs, installed package inventory, proposed domain manifest, and a 464-row audit traceability inventory. These are audit evidence, not approved V2 artifacts.

**Next step:** review the unresolved decisions and approve Phase 1 specification work when ready.
