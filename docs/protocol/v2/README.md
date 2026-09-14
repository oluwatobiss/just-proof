# JustProof Protocol V2 — Commitment-Based Authorization

**Draft — User Review Required.** Product milestone: **JustProof V1**. Protocol: **2**. This package is not frozen and does not authorize implementation or deployment.

## Authority and scope

The user's protocol requirements and approved D1–D8 decisions govern this draft. The immutable [V1 consolidated specification](../10-specification.md) and its companion documents remain a superseded reference; unchanged semantics are incorporated by explicit references below. A V1 signature, domain, type name, protocol discriminator, or circuit name is never imported implicitly into V2. Diagnostic findings are evidence only. Local compiler/package behavior controls implementation feasibility, not intended protocol semantics.

MUST/MUST NOT are normative; SHOULD admits a documented reason. Ordered schema lists in this package are normative typed field sequences, not raw concatenation or a promise that pseudocode is compiled source. Any implementation conflict requires review rather than a silent semantic change.

| Document | Owns |
|---|---|
| [00-decisions](00-decisions.md) | D1–D8, migration, exclusions |
| [01-credential](01-credential.md) | Statement, private package, issuance |
| [02-issuer-registry](02-issuer-registry.md) | Authority and issuer control |
| [03-domains-and-commitments](03-domains-and-commitments.md) | All 18 domains, exact typed derivations |
| [04-revocation](04-revocation.md) | Credential-bound irreversible revocation |
| [05-ledgers-and-constructor](05-ledgers-and-constructor.md) | Exact nine fields and initialization |
| [06-merkle-tree](06-merkle-tree.md) | Depth, indices, paths, root formulas |
| [07-witnesses-and-disclosures](07-witnesses-and-disclosures.md) | Private interfaces and public exposure |
| [08-proofs](08-proofs.md) | Request, state, output, time constraints |
| [09-verification](09-verification.md) | Acceptance and challenge lifecycle |
| [10-specification](10-specification.md) | Four lifecycle transitions |
| [11-deployment-and-private-identity](11-deployment-and-private-identity.md) | Deployment, encryption, recovery, artifacts |
| [12-conformance-vectors](12-conformance-vectors.md) | Independent vectors and validation layers |
| [requirements](requirements.md) | Consolidated implementation/test traceability |

The [Phase 1 report](../../development/phase-1-specification-report.md) preserves the original feasibility measurements and the dated conditional-review addendum. D1–D8 are approved working decisions; this complete package remains draft. Phase 2 adds internal primitives, candidate roots and the constructor, with no lifecycle exports. The [Phase 2 report](../../development/phase-2-primitives-constructor-report.md) records validation and blockers. No automatic transition to Phase 3; later lifecycle, complete-local-verification and deployment reviews remain required.

## Security model

Authority and issuers prove knowledge of independent random secrets in their authorized transitions. Credential authenticity is the combination of an issuer-authorized transition and membership under authenticated finalized contract state. The portable private package has no independently verifiable issuer signature. Holders prove knowledge of their subject opening. Wallet transaction authorization supplies neither authority nor issuer authorization.

Assumptions include CSPRNG quality, secrecy and independence of openings/control secrets, binding/hiding of persistent commitments, collision/preimage resistance of typed hashes, ZK soundness/privacy, pinned artifact integrity, authenticated current finalized state, trusted verifier time, atomic challenge storage, and a trusted local prover. Circuit assertions cannot prove randomness, secret uniqueness across separate machines, globally unique registry contexts, fresh challenges, or off-chain retention.

No rotation, recovery of lost role secrets, delegated control, multi-issuer policy, generic claims, issuer removal/suspension, unrevocation, historical proof acceptance, backend authorization, or additional ledger configuration is introduced. Encrypted identity recovery restores an existing identity; it is not protocol secret recovery or rotation. Maintenance keys can authorize contract maintenance outside the four circuits: verifier artifact pinning remains essential against changed code.
