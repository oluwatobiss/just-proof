# Ledger and constructor

**Draft — User Review Required.** Replaces [V1 ledger](../05-ledgers.md) authority configuration; retains all exclusions and atomicity semantics.

## Exactly nine authoritative public fields

```compact
export sealed ledger registryAuthorityControlCommitment: Bytes<32>;
export sealed ledger registryContext: Bytes<32>;
export ledger issuerRoot: Bytes<32>;
export ledger nextIssuerIndex: Uint<32>;
export ledger registeredIssuerLeaves: Set<Bytes<32>>;
export ledger credentialRoot: Bytes<32>;
export ledger nextCredentialIndex: Uint<32>;
export ledger registeredCredentialNullifiers: Set<Bytes<32>>;
export ledger revocationRoot: Bytes<32>;
```

No extra protocolVersion field: version is constant 2 in typed structures, circuit identity and authenticated artifact metadata. No mirrored roots, history, frontiers, convenience counters/configuration, credential metadata, challenge state, backend-authoritative cache, setters or additional contracts holding authoritative roots.

## Constructor interface

Semantic interface: `constructor(deploymentRegistryContext: Bytes<32>)`; witness `registryAuthoritySecretWitness(): Bytes<32>`. Context is a public deployment value sampled uniquely, nonzero and randomly; witness returns the private independently sampled nonzero authority secret. Constructor derives the authority-control hash using version 2 and this context. A final hash disclosure for assignment is allowed; disclosure of the secret is forbidden. Public precomputed authority commitment as constructor argument is not an approved fallback.

Initialize sealed context and derived authority commitment; set both counters to zero; both Sets empty; issuer and credential roots to the canonical depth-16 empty roots; revocation root to the all-NOT_REVOKED root in [06](06-merkle-tree.md). Reject zero context/secret. Global context uniqueness is a deployment obligation, not something this contract can inspect globally. No caller-provided roots, counters, records or initial credentials.

Phase 2 implements candidate root constants after separately assembled TypeScript and generated-Compact paths agree and generated types/source are inspected. These paths share runtime hashing/serialization; the constants remain subject to user review. They are not Antigravity's candidate constants. See [candidate vectors](../../../test/conformance/vectors/protocol-v2-candidates.json) for every level and the [Phase 2 report](../../development/phase-2-primitives-constructor-report.md) for exact values and measurements. The actual V2 constructor witness, control preimage, generated interface and nine-field ledger decoding are covered by local compiled-logic tests. No deployment or proof verification is implied.

## Writes and failure semantics

| Circuit | Allowed changed fields |
|---|---|
| registerIssuerV2 | issuerRoot, nextIssuerIndex, registeredIssuerLeaves |
| registerCredentialV2 | credentialRoot, nextCredentialIndex, registeredCredentialNullifiers |
| revokeCredentialV2 | revocationRoot |
| proveQualificationV2 | none |

All assertions for a transition must hold before accepting its state. Failed simulation must leave the caller's original state/private-state snapshot intact; failed ledger calls must not partially publish contract mutations. Tests must compare all nine fields and encoded state after failures, including failures late in a transition. Wallet fees/transaction-layer behavior are separate from contract-state atomicity and must not be inferred from a simulation.
