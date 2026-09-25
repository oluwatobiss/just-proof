# Preprod MVP 002 — Operator and review guide

Classification: `BLOCKED_TRANSACTION_NATIVE_ADDRESS_BINDING`.
Campaign reserved for this design: `2026-09-25-preprod-mvp-002`.

There is no participation contract, deployment, verifier command, live browser action or onboarding flow to run. Continue using the browser-local simulation only. No capability retry is authorized. Do not collect real user information or count users from simulated success, an address submission, DUST payment or receipt ownership.

## Review required before implementation

- Establish a supported 1AM API 4.0.0 construction that forces and exposes an authorized unshielded spend from the claimed canonical address, with safe failure for insufficient funds/capability.
- Establish the exact signed intent/action relationship to the same unique receipt and campaign. Account for merging, partial transaction success and replay; co-occurrence is insufficient.
- Establish the version-matched indexer finality guarantee, query/identifier semantics and approved endpoint identity. Do not invent a confirmation-depth constant.
- Specify independently verifiable public receipt bytes and duplicate key `(canonical address, campaign)`. Form assertions cannot authenticate the owner.

The exact installed public transaction query is retained for static review only. It accepts a transaction identifier; no private wallet data is required for that query. Its existence is not an authorized network command or a completed verification algorithm.

## Future Sheet boundary (not implemented or collecting data)

A separately approved form/Sheet would require participant number, public Preprod wallet address, transaction ID, campaign ID, receipt ID, finalized block/ledger position, independent verification status, duplicate status, consent timestamp and feedback response reference. Use only VERIFIED, DUPLICATE, INVALID, PENDING or COULD_NOT_VERIFY as eventual verifier outcomes. VERIFIED must depend on demonstrated owner authorization, signed receipt linkage, successful finalized execution and uniqueness, never a frontend/form assertion. No current row can be classified VERIFIED under this blocked design.

Explain that public wallet address and transaction history are linkable; obtain explicit consent before any future collection. Never request seeds, private keys, wallet passwords, witnesses or credentials. Never commit response sheets, addresses or user records. A future receipt would prove demo participation only—not a qualification credential, proveQualificationV2, R61 completion or release readiness.

Read `2026-09-25-preprod-mvp-002-report.md` and `evidence/2026-09-25-preprod-mvp-002/binding-gate.json` for the exact unresolved gates. No execution or deployment authorization is granted by this guide.
