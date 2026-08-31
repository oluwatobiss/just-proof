# JustProof Ledger State Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the complete authoritative public ledger state for a JustProof V1 deployment: field names, Compact types, mutability, initialization, trust-anchor roles, permitted write sets, duplicate guards, atomicity, disclosure boundaries, and current-state semantics.

The contract maintains three logically separate authenticated registries:

1. an issuer registry proving which issuer keys are currently authorized
2. a credential registry proving which immutable credential instances are registered; and
3. a revocation registry proving whether each registered credential is currently unrevoked

This specification integrates the state decisions frozen in `01-credential.md` through `04-revocation.md`. It does not store a plaintext credential, holder identity, signing key, commitment opening, signature, Merkle path, or human-readable certificate.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record or state transition is shown, its field names, field order, Compact types, and write effects are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- the contract has exactly nine protocol ledger fields
- the registry-authority verification key and registry context are public constructor-only sealed fields
- issuer, credential, and revocation Merkle trees are represented on-chain by current roots only
- issuer and credential indices are sequential `Uint<32>` counters with a depth-16 capacity of 65,536
- a public set of issuer-leaf hashes rejects duplicate issuer registration
- a public set of deployment-scoped credential registration nullifiers rejects reuse of a credential ID
- no credential ID, credential commitment, credential leaf, revoked leaf, or Merkle path is stored as a standalone ledger field
- credential registration updates only credential-registry state
- revocation updates only the revocation root
- every state transition is atomic and current-state constrained; and
- V1 stores no historical roots, mutable credential records, status flags, revocation timestamps, or administrator state

Changing a ledger field name, type, modifier, initialization rule, nullifier construction, permitted write set, disclosure boundary, capacity, or state-transition meaning defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Ledger Model

The implementation MUST begin with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

In Compact, every `ledger` field is public contract state. The `sealed` modifier makes a field writable only during contract initialization; it does not make the field private.

All exported ledger fields are directly inspectable through the generated TypeScript ledger interface. A verifier or application MAY read them, but a caller-supplied copy is not authoritative when the circuit can read current ledger state directly.

Circuit parameters and witness results are private by default. If a value derived from private input must enter public ledger state, the implementation MUST place `disclose(...)` at the narrowest intentional write boundary. `disclose` MUST NOT wrap an entire credential, issuer record, signature, path, or compound witness merely because one derived value is public.

Witnesses and off-chain providers MUST be treated as untrusted inputs. Every root, index, leaf, path, signature, identifier, commitment, and nullifier entering through them MUST be constrained by the applicable frozen construction and current ledger state.

## 5. Authoritative V1 Ledger Declarations

The complete V1 protocol state is:

```compact
export sealed ledger registryAuthorityVerificationKey: Secp256k1Point;
export sealed ledger registryContext: Bytes<32>;

export ledger issuerRoot: Bytes<32>;
export ledger nextIssuerIndex: Uint<32>;
export ledger registeredIssuerLeaves: Set<Bytes<32>>;

export ledger credentialRoot: Bytes<32>;
export ledger nextCredentialIndex: Uint<32>;
export ledger registeredCredentialNullifiers: Set<Bytes<32>>;

export ledger revocationRoot: Bytes<32>;
```

The field names, `export` and `sealed` modifiers, Compact types, and grouping above are normative for the V1 contract interface.

The protocol contract MUST NOT add another field that changes V1 authorization, credential registration, uniqueness, revocation, or validity semantics. Non-protocol ledger state is out of scope and SHOULD be deployed in a separate contract rather than mixed into the JustProof V1 trust anchor.

## 6. Ledger Field Roles

| Field | Role | Mutability | Authoritative use |
| --- | --- | --- | --- |
| `registryAuthorityVerificationKey` | Verifies issuer-registration approvals | Constructor-only | Issuer admission authority |
| `registryContext` | Unique deployment context | Constructor-only | Cross-deployment domain binding |
| `issuerRoot` | Current issuer-tree root | Append transition only | Issuer membership and authorization |
| `nextIssuerIndex` | Next unused issuer position | Increment only | Issuer allocation and capacity |
| `registeredIssuerLeaves` | Duplicate issuer-leaf guard | Insert only | Duplicate rejection only |
| `credentialRoot` | Current credential-tree root | Append transition only | Credential membership |
| `nextCredentialIndex` | Next unused credential position | Increment only | Credential allocation, existence, and capacity |
| `registeredCredentialNullifiers` | Duplicate credential-ID guard | Insert only | Registry-local credential-ID uniqueness only |
| `revocationRoot` | Current revocation-tree root | Empty-to-revoked transition only | Current non-revocation or revocation state |

Only the three roots are Merkle membership trust anchors. A duplicate-guard set is supporting state and MUST NOT substitute for a membership proof against the applicable root.

## 7. Sealed Deployment Configuration

`registryAuthorityVerificationKey` is the immutable public secp256k1 point frozen in `02-issuer-registry.md`. It verifies registry-authority approval of issuer registrations. Its corresponding private key MUST never enter ledger state, circuit output, event data, logs, analytics, or deployment metadata.

`registryContext` is a fresh, nonzero 32-byte public deployment identifier. It MUST be generated with a cryptographically secure random source before deployment and MUST NOT be reused by another JustProof deployment.

The contract address and registry context jointly distinguish deployments in messages and nullifiers that require deployment binding.

Neither sealed field may be updated, cleared, rotated, or recovered after construction. V1 has no contract owner, administrator ledger field, authority-key rotation, governance field, or emergency override.

## 8. Issuer-Registry State

The issuer-registry state is exactly:

```text
issuerRoot: Bytes<32>
nextIssuerIndex: Uint<32>
registeredIssuerLeaves: Set<Bytes<32>>
```

`issuerRoot` authenticates the ordered append-only issuer tree defined in `02-issuer-registry.md`.

`nextIssuerIndex` is both the next insertion position and the number of successfully registered issuer positions. The valid invariant is:

```text
0 <= nextIssuerIndex <= 65,536
```

`registeredIssuerLeaves` contains intentionally disclosed canonical issuer-leaf hashes. It rejects a second registration of the same immutable issuer identity. The set does not authorize an issuer; current membership under `issuerRoot` does.

Issuer records, issuer verification keys, issuer IDs, issuer indices, and display metadata need not be standalone ledger fields. Their authenticity is established by rederivation and current-root membership.

## 9. Credential Registration Nullifier

V1 requires one credential-registry position per credential ID. A public deployment-scoped nullifier enforces this without storing the credential ID itself.

The domain label and exact 32-byte value are:

| Purpose | UTF-8 label | `Bytes<32>` hexadecimal |
| --- | --- | --- |
| Credential registration nullifier | `JP:CREDENTIAL:REGISTRATION-NULLIFIER:V1` | `0958ae03b94f43b8081063b1c7ec630ca774a3bead673562cf984c19454efef9` |

The value is the SHA-256 digest of the exact UTF-8 label. Implementations MUST embed or deterministically reproduce it and MUST NOT pass the variable-length label where `Bytes<32>` is required.

The displayed label defines a domain constant only. A typed `persistentHash` is not equivalent to hashing a delimiter-based concatenation of the displayed fields.

The normative input is:

```text
CredentialRegistrationNullifierInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    credentialId: Bytes<32>
}
```

The field order is normative. Construction is:

```text
credentialRegistrationNullifier =
    persistentHash<CredentialRegistrationNullifierInputV1>({
        domain: DOMAIN_CREDENTIAL_REGISTRATION_NULLIFIER_V1,
        protocolVersion: 1,
        registryContract: kernel.self(),
        registryContext,
        credentialId
    })
```

The circuit MUST derive the nullifier from the same private credential ID used in credential-ID validation, the issuer signature, and the credential leaf. A caller-supplied nullifier is not authoritative.

Before registration, the circuit MUST assert:

```text
registeredCredentialNullifiers.member(
    credentialRegistrationNullifier
) == false
```

After every other registration assertion succeeds, it MUST insert exactly that nullifier atomically with the credential root and counter updates.

The nullifier is intentionally public. Its deployment binding prevents the same credential ID from producing a cross-deployment correlation token. Because credential IDs contain issuer-generated 256-bit randomness, publishing the derived nullifier does not enable practical preimage enumeration under the V1 assumptions.

Observers can associate the disclosed nullifier with its registration transaction, root transition, and sequential counter position. They cannot derive which private credential, issuer, holder, or qualification it represents from the nullifier alone under the V1 assumptions. If a credential ID or correlating application metadata is later disclosed, the corresponding deployment nullifier becomes linkable; implementations MUST document that limitation.

The set MUST contain nullifiers—not credential IDs, commitments, credential leaves, statements, signatures, or indices.

## 10. Credential-Registry State

The credential-registry state is exactly:

```text
credentialRoot: Bytes<32>
nextCredentialIndex: Uint<32>
registeredCredentialNullifiers: Set<Bytes<32>>
```

`credentialRoot` authenticates the ordered append-only credential tree defined by `06-merkle-tree.md`. Each canonical credential leaf binds exactly the credential ID and credential commitment frozen in `01-credential.md`.

`nextCredentialIndex` is both the next insertion position and the number of successfully registered credential positions. The valid invariant is:

```text
0 <= nextCredentialIndex <= 65,536
```

The first credential is registered at index `0`. Every successful registration consumes exactly one position. Indices are immutable, sequential, and never reused.

`registeredCredentialNullifiers` rejects credential-ID reuse in this deployment. It does not establish credential membership or current validity.

The ledger MUST NOT store a standalone credential ID, credential commitment, credential leaf, issuer signature, credential statement, subject commitment, holder secret, issuance nonce, or credential opening.

## 11. Revocation-Registry State

The revocation-registry state is exactly:

```text
revocationRoot: Bytes<32>
```

The V1 revocation tree has depth 16 and exactly shares credential indices:

```text
revocationIndex == credentialIndex
```

There is no next revocation index, revocation counter, public revoked-ID set, revocation-nullifier set, status map, reason map, or timestamp map.

The current `revocationRoot` authenticates either the canonical empty revocation leaf or the credential-bound revoked leaf at each position under `04-revocation.md`. An empty revocation position has credential meaning only when a canonical credential leaf is authenticated at the same index and that index is below `nextCredentialIndex`.

Credential registration does not update `revocationRoot`; every possible position is already represented by the canonical empty revocation leaf in the initial depth-16 tree.

## 12. Tree Parameters and Root-Only Representation

All three V1 trees use:

```text
depth    = 16
capacity = 2^16 = 65,536
index    = Uint<32>
```

All internal nodes use the shared ordered `MerkleNodeInputV1` construction and `JP:MERKLE:NODE:V1` domain frozen in `02-issuer-registry.md` and `04-revocation.md`.

The ledger stores roots rather than `MerkleTree` ledger ADTs, complete leaf collections, authentication paths, or frontiers. This root-only representation preserves the private credential and revocation leaf boundary.

Every insertion or update MUST authenticate the old leaf at the target index against the current root, then derive the new root from the new leaf, the same index, and the same 16-sibling path.

Direction bits derive from the least-significant index bit first. They MUST NOT be supplied as independent witness data.

## 13. Constructor and Initial State

The constructor accepts exactly the registry-authority verification key and fresh registry context as protocol configuration:

```text
constructor(
    authorityVerificationKey: Secp256k1Point,
    deploymentRegistryContext: Bytes<32>
)
```

It MUST:

1. reject `default<Secp256k1Point>` as the authority key
2. reject an all-zero registry context
3. intentionally disclose and seal the authority key and registry context
4. set `issuerRoot = initialIssuerRoot` under `02-issuer-registry.md`
5. set `nextIssuerIndex = 0`
6. leave `registeredIssuerLeaves` empty
7. set `credentialRoot = initialCredentialRoot` under `06-merkle-tree.md`
8. set `nextCredentialIndex = 0`
9. leave `registeredCredentialNullifiers` empty; and
10. set `revocationRoot = initialRevocationRoot` under `04-revocation.md`

Compact initializes `Set` values as empty sets, but the constructor outcome MUST still be tested explicitly.

None of the three initial roots may be an arbitrary all-zero value. Each is the level-16 root derived from its frozen canonical empty leaf and the shared internal-node construction.

The constructor MUST NOT accept a caller-selected initial root, counter, duplicate set, administrator, founding issuer record, credential, or revocation entry.

The founding issuer is registered after deployment through the ordinary issuer-registration circuit and all its frozen authorization checks.

## 14. Index and Capacity Rules

`nextIssuerIndex` and `nextCredentialIndex` use `Uint<32>`, not `Uint<16>` and not `Counter`. The type must represent both valid positions `0..65,535` and the full-tree sentinel `65,536`.

For either append-only registry, registration is allowed only when:

```text
nextIndex < 65,536
```

After a successful insertion at `i = nextIndex`:

```text
nextIndex = i + 1
```

After position `65,535` is filled, the counter equals `65,536` and every later registration MUST fail.

No circuit may decrement, reset, skip, reserve, reuse, or accept a caller-selected next index. A failed transaction consumes no index.

The revocation registry has no allocation counter because its position is always the already allocated credential index.

## 15. Issuer Registration Write Set

Issuer registration is governed cryptographically by `02-issuer-registry.md`.

For `i = nextIssuerIndex`, a successful operation authenticates the canonical empty issuer leaf at `i`, verifies issuer proof of possession and registry-authority approval, rejects a duplicate issuer leaf, and then writes exactly:

```text
issuerRoot = newIssuerRoot
registeredIssuerLeaves.insert(issuerLeaf)
nextIssuerIndex = i + 1
```

The three updates MUST be atomic.

Issuer registration MUST leave unchanged:

- both sealed configuration fields
- `credentialRoot` and `nextCredentialIndex`
- `registeredCredentialNullifiers`
- `revocationRoot`; and
- every previously registered issuer leaf

The issuer leaf is intentionally disclosed only for insertion into the public duplicate guard and the root transition required by the frozen issuer protocol. The authority and possession signatures, authentication path, and private signing keys MUST NOT be returned, emitted, or stored.

## 16. Credential Registration Write Set

Credential registration is an append-only state transition. Its cryptographic checks are distributed across `01-credential.md`, `02-issuer-registry.md`, `03-commitments.md`, and `06-merkle-tree.md`.

For `i = nextCredentialIndex`, a successful operation MUST:

1. assert `i < 65,536`
2. validate the frozen credential ID and credential commitment constructions applicable to registration
3. authenticate the exact issuer record and verification key against the current `issuerRoot` and `nextIssuerIndex` range
4. verify the frozen issuer signature over the same credential ID and commitment
5. derive the canonical credential leaf from those same values
6. derive the deployment-scoped credential registration nullifier
7. assert that the nullifier is absent from `registeredCredentialNullifiers`
8. authenticate the canonical empty credential leaf at `i` against the current `credentialRoot` using a 16-sibling insertion path
9. derive `newCredentialRoot` by replacing only that empty leaf with the canonical credential leaf; and
10. atomically write exactly:

```text
credentialRoot = newCredentialRoot
registeredCredentialNullifiers.insert(
    credentialRegistrationNullifier
)
nextCredentialIndex = i + 1
```

No write may occur if any assertion fails.

Credential registration MUST leave unchanged:

- both sealed configuration fields
- all issuer-registry fields
- `revocationRoot`
- every previously registered credential leaf; and
- the credential statement, ID, commitment, issuer signature, and private opening material

The exported circuit MUST NOT return or emit the credential ID, commitment, leaf, assigned index, nullifier preimage, signature, issuer record, or Merkle path. The proving client knows the attempted current index, and successful finalization establishes that it was consumed; the issuer, holder, and authorized state provider receive the private assignment data they require through confidential off-chain coordination.

## 17. Revocation Write Set

Revocation is governed cryptographically by `04-revocation.md`.

For an existing private `credentialIndex`, a successful operation authenticates the issuer within the current `nextIssuerIndex` range, rederives the credential ID from that issuer ID and the issuer-retained private issuance nonce, verifies the original credential signature, authenticates credential membership within the current `nextCredentialIndex` range, verifies issuer revocation authorization, and authenticates the canonical empty revocation leaf under all three current roots. It then derives the credential-bound revoked leaf and writes exactly:

```text
revocationRoot = newRevocationRoot
```

Revocation MUST leave unchanged:

- both sealed configuration fields
- every issuer-registry field
- every credential-registry field, including the credential nullifier set
- every credential leaf, ID, commitment, and signature
- every other revocation position; and
- every credential or revocation counter, because no revocation counter exists

No revocation timestamp, reason, status record, or public credential-specific event is added. A duplicate revocation fails because the old-root proof must authenticate the canonical empty revocation leaf.

## 18. Read-Only Verification

A qualification-verification circuit reads authoritative current state but MUST NOT mutate it.

Current V1 verification uses at least:

```text
issuerRoot
nextIssuerIndex
credentialRoot
nextCredentialIndex
revocationRoot
```

The proof MUST authenticate the applicable issuer and credential leaves against the current roots, assert registered index ranges using the current counters, and authenticate the empty revocation leaf at the same credential index against the current revocation root.

`registeredIssuerLeaves` and `registeredCredentialNullifiers` are not proof inputs for qualification verification. They are transition guards, not validity trust anchors.

The verification circuit MUST NOT accept a caller-supplied root or counter in place of current ledger state. An off-chain verifier MUST independently obtain the exact current state from the deployed contract and fail closed when that state is unavailable or stale.

## 19. State Isolation Matrix

| Operation | Reads authoritative state | Writes authoritative state |
| --- | --- | --- |
| Constructor | Default ledger values and constructor inputs | Both sealed fields, all three initial roots, both counters |
| Register issuer | Sealed configuration, `issuerRoot`, `nextIssuerIndex`, `registeredIssuerLeaves` | `issuerRoot`, `nextIssuerIndex`, `registeredIssuerLeaves` |
| Register credential | `registryContext`, `issuerRoot`, `nextIssuerIndex`, `credentialRoot`, `nextCredentialIndex`, `registeredCredentialNullifiers` | `credentialRoot`, `nextCredentialIndex`, `registeredCredentialNullifiers` |
| Revoke credential | `registryContext`, `issuerRoot`, `nextIssuerIndex`, `credentialRoot`, `nextCredentialIndex`, `revocationRoot` | `revocationRoot` |
| Verify qualification | Current roots and applicable counters | None |

Reading a field does not authorize writing it. Each exported state-changing circuit MUST have the exact write set shown above.

## 20. Atomicity and Checkpoints

Every state transition MUST either satisfy all assertions and commit its entire permitted write set, or fail with no protocol state change.

The implementation MUST NOT call `kernel.checkpoint()` or introduce an equivalent partial-commit boundary inside issuer registration, credential registration, or revocation. A checkpoint that allows one root, counter, or duplicate guard to commit without the others violates V1.

The following partial states are invalid:

- a new issuer root without the matching counter and issuer-set insertion
- an issuer-set insertion without the matching root append
- a new credential root without the matching counter and credential-nullifier insertion
- a credential-nullifier insertion without the matching credential leaf append
- a consumed index after a failed registration
- a new revocation root after any authorization or membership failure; or
- any state in which an unrelated registry changed during an operation

Application retries MUST submit a new transaction against current state rather than treating a partially simulated state as committed.

## 21. Disclosure Boundary

Ledger writes are intentional public disclosures. The V1 write boundary permits only:

- the registry-authority verification key
- the registry context
- current Merkle roots
- sequential counters
- canonical issuer-leaf hashes in the issuer duplicate set; and
- deployment-scoped credential registration nullifiers in the credential duplicate set

When a root or nullifier is derived from private witness data, the circuit MUST constrain the complete derivation before disclosing only the final public value at the ledger operation.

The implementation MUST NOT disclose an intermediate credential ID, commitment, leaf, revoked leaf, issuer or credential index, statement, qualification, signature, opening, secret, or authentication path merely to make a final root or nullifier writable.

Transaction arguments, exported-circuit returns, events, public ledger fields, and intentionally disclosed intermediates must all be treated as public. A frontend omission is not a privacy control.

## 22. Public and Private State Inventory

| Classification | Values |
| --- | --- |
| Authoritative public ledger state | The nine fields in Section 5 |
| Public network/deployment information | Contract address, network, compiled circuit metadata, verifier keys, transaction ordering |
| Intentionally public supporting values | Issuer-leaf duplicate entries and credential registration nullifiers |
| Private credential state | Statement, issuance nonce, subject secret, credential opening, credential ID, commitment, issuer signature, credential index, credential and revocation paths |
| Private issuer/authority state | Registry-authority private key, issuer private keys, unpublished authorization signatures, issuer revocation records |
| Private tree-service state | Credential leaves, revoked leaves, indices, paths, tree replicas, correlation metadata |
| Non-authoritative presentation data | PDFs, images, display metadata, API responses, caches, indexer records, application status labels |

An issuer record or credential leaf may be shared with an explicitly trusted provider for availability, but sharing does not convert it into authoritative ledger state.

## 23. Duplicate Guards Versus Membership

The duplicate sets answer only:

```text
Has this canonical issuer leaf already been inserted?
Has this deployment-scoped credential ID nullifier already been inserted?
```

They do not answer:

```text
Is this issuer currently authenticated at this index?
Is this credential registered at this index?
Is this credential currently unrevoked?
```

Those questions require current-root Merkle authentication.

Neither set may expose or support a `remove`, `reset`, replacement, or generic write circuit. A later application must not treat set membership alone as an authorization or verification result.

The revocation tree requires no duplicate set because its old-root proof of the empty leaf enforces a single irreversible transition at each already allocated credential index.

## 24. Off-Chain Tree State and Availability

The root-only ledger model requires one or more off-chain state providers to maintain sufficient private data to construct current authentication paths.

For each successful credential registration, the authorized provider MUST securely obtain and retain at least the assigned index and canonical credential leaf. For each successful revocation, it MUST securely obtain and retain the target index and canonical revoked leaf. Issuer-tree data may be reconstructed from intentionally public issuer registration artifacts, but it SHOULD use the same integrity and backup discipline.

A provider MUST:

- apply finalized transitions in authoritative ledger order
- reconstruct and compare its root with the current on-chain root after each update
- provide exactly 16 siblings ordered leaf-to-root
- refresh paths after unrelated tree updates
- preserve encrypted, tested backups sufficient to recover each private tree
- use authenticated confidential transport for private path and leaf data
- minimize credential, issuer, holder, transaction, and request correlation logs; and
- fail closed rather than invent an empty leaf or path when data is missing

An incorrect path cannot create a valid proof because the circuit constrains it to the current root. The provider is trusted for availability and privacy, not cryptographic correctness.

Public roots and duplicate sets are not sufficient to reconstruct the private credential and revocation trees. Loss of provider state can therefore make registration, revocation, or proof construction unavailable until recovered.

## 25. Current-State Semantics and No History

The three ledger roots represent current authoritative state only.

V1 has no ledger field for:

- historical issuer, credential, or revocation roots
- root versions or root timestamps
- validity at an arbitrary historical time
- cached-root grace periods
- proof expiry independent of current state; or
- a verifier-selected state snapshot

Off-chain systems MAY archive roots and transactions for audit or operations, but archived values are not V1 current-validity trust anchors.

A proof built against an earlier root may remain mathematically valid for that root. It MUST fail current verification after the authoritative ledger state changes unless regenerated or refreshed against the new current roots.

## 26. Concurrency and Stale State

Every state-changing proof is constructed against one exact current public state. Concurrent successful transitions may make another pending transaction stale.

A stale issuer registration fails through its root, index, path, set, and authority-message constraints. A stale credential registration fails through its current index, insertion path, root, or nullifier constraints. A stale revocation path fails against the current revocation root, while the issuer's root-independent authorization signature may be reused with refreshed current paths if every authorization field remains identical.

After a stale-state failure, the client MUST refresh authoritative ledger state and every affected authentication or insertion path. It MUST obtain a new registry-authority signature when the issuer-registration message's current root or index changed.

The application MUST NOT weaken a current-root equality, accept an old root, bypass a duplicate guard, or force a root setter to make a stale transaction succeed.

## 27. Prohibited Ledger State and Operations

V1 MUST NOT add or expose:

- plaintext credential, holder, issuer-display, or qualification fields
- a credential ID, commitment, signature, subject commitment, or credential leaf map
- a public list or set of credential IDs or credential commitments
- a public revoked-ID set, revocation record map, revocation reason, or `revokedAt` field
- mutable `ACTIVE`, `EXPIRED`, `REVOKED`, issuer-status, or credential-status fields
- a next revocation index or revocation counter
- on-chain Merkle paths, frontiers, complete private trees, or caller-selected roots
- historical-root registries or arbitrary verification-time state
- a contract owner, administrator, revocation administrator, or emergency bypass
- generic root, counter, set, leaf, or status setters
- set removal, counter decrement, reset-to-default, credential deletion, unrevocation, or leaf replacement circuits; or
- a circuit that mutates more than one logical registry except the constructor

Derived UI labels and off-chain metadata MAY exist, but they MUST NOT be represented as authoritative protocol state.

## 28. Failure Conditions

An initialization MUST fail if the registry-authority point is default, the registry context is zero, or any caller-selected root or initial record is supplied.

An append MUST fail closed if:

- the applicable counter equals `65,536`
- the proposed index differs from the current counter
- the old leaf is not the canonical empty leaf at that index
- the path does not reconstruct the current root
- the issuer or credential duplicate guard already contains its canonical value
- any identifier, commitment, signature, authorization, leaf, domain, type, field order, or protocol version is invalid
- required current issuer membership is invalid or stale; or
- the complete permitted write set cannot commit atomically

Revocation MUST fail under every condition frozen in `04-revocation.md`, including an unregistered index, mismatched credential, invalid issuer/nonce/credential-ID binding, invalid authorization, stale path, or already revoked leaf.

Verification MUST fail closed when any current root or required counter is unavailable, malformed, stale, unauthenticated, or inconsistent with the proof.

Errors MUST NOT reveal a private credential ID, commitment, leaf, index, signature, statement, path, secret, or opening.

## 29. Security Properties and Limitations

Assuming the security of the frozen cryptographic constructions and correct private-state handling, this ledger model provides:

- **Explicit trust anchors:** current issuer, credential, and revocation roots have distinct meanings
- **Immutable deployment authority:** the issuer-admission key and registry context cannot change after construction
- **Append-only allocation:** issuer and credential positions are sequential and never reused
- **Credential-ID uniqueness:** a deployment-scoped nullifier prevents one credential ID from occupying multiple credential positions
- **Credential privacy:** roots and a nullifier are public while credential IDs, commitments, leaves, and paths need not be
- **State isolation:** registration and revocation cannot mutate unrelated registries
- **Monotonic revocation:** only the revocation root changes for a successful empty-to-revoked transition
- **Atomic consistency:** roots, counters, and duplicate guards cannot conformingly diverge; and
- **Current-state verification:** callers cannot substitute a stale root for authoritative current ledger state

V1 still exposes:

- the public authority key and deployment context
- registry sizes through both counters
- issuer-leaf hashes through the issuer duplicate set
- one pseudonymous credential nullifier per registration, linkable to that public registration transition and sequential position
- root changes, transaction ordering, timing, and submitter/network metadata; and
- whether a registry transition occurred

If a credential ID is disclosed later, its registration nullifier becomes linkable to that deployment and its original registration transition. Root-only privacy also creates availability and correlation risk at any provider that receives private leaves, indices, or path requests.

## 30. Non-Goals

V1 ledger state does not provide:

- issuer deactivation, suspension, key rotation, or authority-key recovery
- credential mutation, correction, deletion, transfer, or unregistration
- unrevocation, scheduled revocation, revocation reason, or revocation time
- holder identity, real-world identity, or wallet-identity binding
- public discovery of credential or revocation records
- historical validity proofs or arbitrary state snapshots
- decentralized recovery of lost private tree state
- multiple qualification schemas or protocol versions in one state layout
- upgradeable ledger layout; or
- governance and administrator controls

These features require a later protocol version or a separate explicitly scoped contract.

## 31. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. The contract has exactly the nine protocol ledger fields and types in Section 5.
2. Every ledger field is public; `sealed` means constructor-only and never means private.
3. The authority verification key and registry context are nondefault, public, immutable, and set exactly once.
4. The issuer, credential, and revocation roots initialize to their exact canonical depth-16 empty roots.
5. Both next-index counters initialize to zero and use `Uint<32>`.
6. Both duplicate sets initialize empty and are insert-only.
7. All three trees have depth 16, capacity 65,536, and use the shared ordered node construction.
8. Issuer and credential indices are sequential, immutable, never reused, and allocated only from their current counters.
9. Revocation positions exactly equal credential indices and have no independent allocator.
10. `issuerRoot` alone authenticates issuer membership.
11. `credentialRoot` alone authenticates credential membership.
12. `revocationRoot` alone authenticates current revocation state.
13. Duplicate-set membership alone never establishes authorization, registration, or validity.
14. Issuer registration updates exactly the issuer root, issuer counter, and issuer duplicate set.
15. Credential registration updates exactly the credential root, credential counter, and credential nullifier set.
16. Revocation updates exactly the revocation root.
17. Read-only qualification verification changes no ledger field.
18. Every write set commits atomically without a partial-commit checkpoint.
19. The credential nullifier uses the exact deployment-scoped typed construction and domain constant.
20. A credential nullifier is derived in-circuit from the same credential ID used everywhere else in registration.
21. Credential IDs, commitments, credential leaves, revoked leaves, signatures, statements, indices, secrets, openings, and paths are not standalone ledger fields.
22. No registered issuer or credential leaf is modified, deleted, or replaced.
23. No revoked position becomes empty or receives a second revoked value.
24. Credential registration never changes revocation state.
25. Revocation never changes credential registration state.
26. Verification uses current authoritative roots and applicable counters.
27. No historical-root, timestamp, status, owner, administrator, or generic-setter state exists.
28. Every malformed, stale, duplicated, unauthorized, full-capacity, unavailable, or non-atomic operation fails closed.
29. Revocation rederives the credential ID from the authenticated issuer ID and private issuance nonce before changing `revocationRoot`.

## 32. Required Test Vectors and Tests

Before a V1 implementation is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- `DOMAIN_CREDENTIAL_REGISTRATION_NULLIFIER_V1`
- the credential registration nullifier for fixed contract address, registry context, and credential ID values
- different nullifiers for the same credential ID under different contract addresses or registry contexts
- identical nullifiers for the same credential ID and deployment regardless of unrelated root changes
- all three canonical initial roots imported from their owning specifications; and
- each root transition from an authenticated old leaf and fixed 16-sibling path

The contract suite MUST test:

- generated ledger shape, field names, types, exported visibility, and sealed modifiers
- constructor rejection of a default authority point and zero registry context
- exact constructor initialization of all roots, counters, and empty sets;
- impossibility of changing either sealed field after construction
- successful issuer registration changing exactly three issuer fields
- successful credential registration changing exactly three credential fields
- successful revocation changing only `revocationRoot`
- rejection of a wrong revocation issuance nonce or issuer/nonce/credential-ID binding
- read-only verification changing no field
- exact counter increments and capacity failure at `65,536`
- rejection of skipped, reused, decremented, reset, or caller-selected indices
- rejection of duplicate issuer leaves
- rejection of a duplicate credential ID even if another commitment or index is proposed
- successful registration of distinct credential IDs with otherwise equal statements
- rejection of wrong or caller-supplied credential nullifiers
- rejection of stale issuer, credential, and revocation roots or paths
- preservation of unrelated registry fields on every success and failure path
- atomic rollback when a final assertion fails after all proposed values are derived
- absence of `checkpoint()` or equivalent partial-commit behavior
- absence of generic setters, removals, resets, historical roots, revocation counters, status fields, and administrator fields
- absence of private credential and witness values from ledger fields, circuit returns, events, logs, analytics, URLs, and presentation artifacts
- private insertion and membership path handling
- provider recovery from encrypted backup and fail-closed behavior when private tree state is unavailable; and
- reconciliation of off-chain tree replicas with every finalized on-chain root

A changed field layout, nullifier vector, initial root, or transition write set is a protocol change, not an ordinary regression update.

## 33. Specification Ownership and Dependencies

This document is authoritative for:

- the complete V1 ledger field set, names, types, modifiers, and initialization
- the credential registration nullifier construction and duplicate set
- root-only on-chain tree representation
- index-counter types, meanings, capacities, and allocation rules
- state-transition write sets and registry isolation
- atomicity and checkpoint prohibition
- public ledger disclosure boundaries; and
- ledger-specific invariants and conformance tests

`01-credential.md` is authoritative for credential identity, statement, issuer-signature message, lifecycle, and the private/public credential boundary.

`02-issuer-registry.md` is authoritative for issuer records, leaves, authority and possession messages, issuer-tree construction, registration checks, and issuer membership. Its sealed configuration, root, counter, and duplicate-set state are reproduced here without modification.

`03-commitments.md` is authoritative for subject and credential commitment constructions, openings, hiding, binding, and commitment privacy.

`04-revocation.md` is authoritative for the revocation tree, leaves, authority, authorization message, transition, current-state semantics, and privacy boundary. Its sole revocation ledger field is reproduced here without modification.

`06-merkle-tree.md` is authoritative for the credential leaf, canonical empty credential leaf, initial credential root, reusable ordered path algorithm, and credential-membership proof. It MUST preserve the depth, index type, shared node construction, root-only ledger model, empty-position append proof, and write effects frozen here.

`07-witnesses.md` is authoritative for private-state and path-provider interfaces. Witness outputs MUST remain untrusted and MUST NOT become additional ledger authority.

`08-proofs.md` and `09-verification.md` MUST read or authenticate the exact current roots and counters defined here and MUST NOT use the duplicate sets as validity trust anchors.

`10-specification.md` MUST consolidate this exact state layout and resolve any older draft field, timestamp, duplicate, historical-root, frontier, or administrator alternative in favor of this frozen specification.

## 34. Final Protocol Principle

JustProof V1 ledger state establishes three separate current facts:

> The current issuer root authenticates which issuer keys are authorized.

> The current credential root authenticates which immutable credential instances are registered.

> The current revocation root authenticates whether each registered credential position remains unrevoked.

Sequential counters allocate issuer and credential positions. Public duplicate guards prevent issuer re-registration and credential-ID reuse. They do not replace Merkle membership.

Everything else—credential contents, holder control, signatures, commitment openings, issuer and credential paths, qualification constraints, expiration, and request binding—remains a separate proof obligation outside public ledger state.
