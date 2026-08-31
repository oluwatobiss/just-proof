# JustProof Merkle Tree Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.0`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the JustProof V1 credential Merkle tree and the reusable ordered Merkle-node, index, path, and root-reconstruction rules shared by the issuer, credential, and revocation trees.

The credential tree answers one narrow current-state question:

> Is the canonical leaf for this exact credential ID and credential commitment authenticated at this index under the current authoritative credential root?

Merkle membership does not independently establish issuer authorization, signature validity, commitment opening, holder control, expiration validity, current non-revocation, qualification satisfaction, or proof-request binding.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- all three protocol trees are fixed-depth ordered binary trees with depth 16
- all leaves, siblings, internal nodes, and roots use `Bytes<32>`
- every index uses `Uint<32>` and is constrained to `0..65,535` before path interpretation
- the credential leaf binds exactly the credential ID and credential commitment
- the credential empty leaf is a distinct domain-separated typed hash
- all internal nodes use the shared `JP:MERKLE:NODE:V1` typed construction
- every path contains exactly 16 siblings ordered from leaf to root
- path directions are derived in-circuit from the index, least-significant bit first
- no direction-bit vector is accepted from a witness or caller
- the credential tree is append-only, sequential, root-only on-chain, and current-state only
- insertion proves the canonical empty leaf at `nextCredentialIndex` before replacement
- credential-ID uniqueness is enforced by the deployment-scoped nullifier set frozen in `05-ledgers.md`, not by credential-commitment or leaf equality; and
- V1 does not use Compact's native `MerkleTree` representation or native Merkle root circuits as a substitute for these typed persistent constructions

Changing a leaf input, domain, node input, node ordering, tree depth, index type, direction convention, path length, empty-root construction, append rule, on-chain representation, or current-state meaning defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Baseline

The implementation MUST begin with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

V1 uses:

- `persistentHash<T>` for credential leaves, empty leaves, and internal nodes
- `Bytes<32>` for every persisted tree value
- `Uint<32>` for indices and next-index counters
- `Vector<16, Bytes<32>>` for authentication and insertion paths; and
- compile-time fixed iteration over 16 levels

`persistentHash` is required because these values enter persistent ledger roots and must remain stable across upgrades. `transientHash`, `persistentCommit`, `keccak256`, delimiter-based byte concatenation, JSON hashing, and Compact's native Merkle hashing MUST NOT replace the frozen constructions.

Witness-returned leaves, indices, paths, and roots are untrusted. A circuit MUST rederive every applicable leaf, constrain the index and path, reconstruct the root, and compare it with current authoritative ledger state.

## 5. Tree Roles and Separation

JustProof V1 uses three logical trees:

| Tree       | Occupied leaf meaning                   | Empty leaf meaning              | Authoritative specification |
| ---------- | --------------------------------------- | ------------------------------- | --------------------------- |
| Issuer     | Registered immutable issuer record      | Unallocated issuer position     | `02-issuer-registry.md`     |
| Credential | Registered credential ID and commitment | Unallocated credential position | This document               |
| Revocation | Credential-bound revoked state          | `NOT_REVOKED`                   | `04-revocation.md`          |

The trees share the internal-node construction, depth, capacity, index type, path length, sibling ordering, direction convention, and root-reconstruction algorithm. They do not share leaf domains or leaf semantics.

The public roots are separate trust anchors:

```text
issuerRoot     -> current issuer authorization membership
credentialRoot -> current credential registration membership
revocationRoot -> current credential revocation state
```

No root may substitute for another.

## 6. Primitive Types and Parameters

| Value                           | Compact type or value   |
| ------------------------------- | ----------------------- |
| Protocol version                | `Uint<16>`              |
| Protocol version value          | `1`                     |
| Credential ID                   | `Bytes<32>`             |
| Credential commitment           | `Bytes<32>`             |
| Credential leaf                 | `Bytes<32>`             |
| Empty credential leaf           | `Bytes<32>`             |
| Merkle sibling or internal node | `Bytes<32>`             |
| Credential root                 | `Bytes<32>`             |
| Credential index                | `Uint<32>`              |
| Next credential index           | `Uint<32>`              |
| Authentication path             | `Vector<16, Bytes<32>>` |
| Tree depth                      | `16`                    |
| Tree capacity                   | `65,536`                |

The counter sentinel `65,536` fits in `Uint<32>` but is not a valid leaf index.

All byte strings in application storage or transport MUST use a documented encoding. Lowercase hexadecimal without a `0x` prefix is RECOMMENDED. Transport encoding MUST NOT change the Compact value entering a typed hash.

## 7. Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose               | UTF-8 label              | `Bytes<32>` hexadecimal                                            |
| --------------------- | ------------------------ | ------------------------------------------------------------------ |
| Credential leaf       | `JP:CREDENTIAL:LEAF:V1`  | `c34338b6aeb2fe5777695157246c9ac554ca39e8d06f19f20a9664b0dbe7b4c6` |
| Empty credential leaf | `JP:CREDENTIAL:EMPTY:V1` | `70bf51ebea524e89f95bc090768d934243226b73e4e23a0bd556973076ac8770` |
| Shared Merkle node    | `JP:MERKLE:NODE:V1`      | `ac80b146f1c63367493a75e4184b1125ebcb768858d1cbf71d9b0adb9a171e86` |

Implementations MUST embed or deterministically reproduce the exact 32-byte values. They MUST NOT pass the variable-length labels where `Bytes<32>` is required.

The displayed labels define domain constants only. A typed `persistentHash` is not equivalent to hashing a delimiter-based concatenation of the displayed fields.

The draft labels `JP:CREDENTIAL:V1:MERKLE:LEAF` and `JP:CREDENTIAL:V1:MERKLE:NODE` are not V1 domain tags and MUST NOT be used.

## 8. Credential Leaf

The normative input is:

```text
CredentialLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

The field order is normative. Construction is:

```text
credentialLeafV1(credentialId, credentialCommitment) =
    persistentHash<CredentialLeafInputV1>({
        domain: DOMAIN_CREDENTIAL_LEAF_V1,
        protocolVersion: 1,
        credentialId,
        credentialCommitment
    })
```

The credential ID identifies the issuance instance. The credential commitment hides and binds the complete typed credential statement. The leaf binds those two immutable values without containing the statement or commitment opening.

The leaf MUST NOT contain or depend on:

- the credential index or any root
- issuer or credential authentication paths
- the issuer signature or verification key
- subject secret or issuance nonce
- credential opening or plaintext statement
- revocation state, timestamp, or reason
- verification time or proof request; or
- PDF, image, JSON, transaction, or frontend metadata

The circuit MUST derive the leaf from the same credential ID and commitment used in the credential construction, issuer signature, registration nullifier, revocation binding, and qualification proof. A caller-supplied leaf is not authoritative.

## 9. Empty Credential Leaf

The normative input is:

```text
CredentialEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}
```

The field order is normative. Construction is:

```text
emptyCredentialLeaf =
    persistentHash<CredentialEmptyLeafInputV1>({
        domain: DOMAIN_EMPTY_CREDENTIAL_LEAF_V1,
        protocolVersion: 1
    })
```

An unallocated credential-tree position contains `emptyCredentialLeaf`.

The empty leaf MUST NOT be an all-zero value, `default<Bytes<32>>`, a missing map entry, an empty credential commitment, an issuer empty leaf, or a revocation empty leaf.

An empty credential leaf is not a registered credential and cannot satisfy credential membership.

## 10. Shared Internal Node

The normative shared input, reproduced exactly from `02-issuer-registry.md` and `04-revocation.md`, is:

```text
MerkleNodeInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    left: Bytes<32>
    right: Bytes<32>
}
```

Construction is:

```text
merkleNodeV1(left, right) =
    persistentHash<MerkleNodeInputV1>({
        domain: DOMAIN_MERKLE_NODE_V1,
        protocolVersion: 1,
        left,
        right
    })
```

Left and right child positions are ordered. Implementations MUST NOT sort children, use a commutative hash, omit the version, reverse the field order, or substitute a tree-specific internal-node domain.

In general:

```text
merkleNodeV1(left, right) != merkleNodeV1(right, left)
```

## 11. Credential Tree Model

The credential tree is a fixed-depth ordered binary tree:

```text
depth    = 16
leaves   = 65,536
indices  = 0..65,535
```

Every non-leaf node has exactly two children. The root commits to the value and position of every leaf under the collision-resistance assumptions of `persistentHash`.

The tree is append-only. Positions below `nextCredentialIndex` contain immutable credential leaves. Positions at or above `nextCredentialIndex` contain the canonical empty credential leaf.

No credential leaf may be deleted, replaced, moved, or overwritten.

## 12. Empty Nodes and Initial Credential Root

Define the empty credential subtree values:

```text
emptyCredentialNode[0] = emptyCredentialLeaf

for level in 0..15 inclusive:
    emptyCredentialNode[level + 1] =
        merkleNodeV1(
            emptyCredentialNode[level],
            emptyCredentialNode[level]
        )

initialCredentialRoot = emptyCredentialNode[16]
```

Exactly 16 ordered internal-node applications separate the empty leaf from the root.

The constructor defined by `05-ledgers.md` MUST initialize:

```text
credentialRoot = initialCredentialRoot
nextCredentialIndex = 0
```

The initial root MUST NOT be arbitrary zero, a native Merkle digest, a deployment-selected value, or a root derived from another tree's empty leaf.

The 17 values from `emptyCredentialNode[0]` through `emptyCredentialNode[16]` MUST be fixed Compact/TypeScript cross-runtime test vectors.

## 13. Sequential Index Allocation

Credential registration allocates:

```text
credentialIndex = nextCredentialIndex
```

The first credential receives index `0`. Every successful registration increments the counter exactly once. Indices are sequential, immutable, and never reused.

Registration is permitted only when:

```text
nextCredentialIndex < 65,536
```

After index `65,535` is filled:

```text
nextCredentialIndex == 65,536
```

and every later registration MUST fail.

The index is position metadata and is not part of `CredentialLeafInputV1`. The leaf is position-bound by the ordered path and current root.

## 14. In-Circuit Index Decomposition

Every root-reconstruction circuit MUST first assert:

```text
index < 65,536
```

Without this assertion, examining only 16 path levels could make values differing in higher bits select the same path.

The circuit then derives exactly 16 Boolean index bits satisfying:

```text
index = sum(bit[level] * 2^level, level = 0..15)
```

where each `bit[level]` is Boolean and `bit[0]` is the least-significant bit.

Compact language version `0.23` does not provide ordinary shift, division, or remainder expressions. A conforming implementation MUST derive the bits in-circuit using fixed threshold comparisons and conditional subtraction, or another algebraically equivalent in-circuit construction supported by `0.23`.

Conceptually:

```text
remainder = index

for level from 15 down to 0:
    threshold = 2^level
    bit[level] = remainder >= threshold
    remainder =
        bit[level]
            ? remainder - threshold
            : remainder

assert remainder == 0
```

The production witness and exported-circuit interface MUST NOT accept path-direction bits. An implementation MAY create an internal vector of the derived Boolean values, but it MUST constrain them to the index and MUST NOT trust caller or witness directions.

## 15. Path Type and Ordering

The reusable V1 path is structurally:

```text
MerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}
```

A credential path is:

```text
CredentialMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}
```

`IssuerMerklePathV1` and `RevocationMerklePathV1` are semantically distinct aliases with the same sibling structure.

Siblings are ordered from leaf to root:

```text
siblings[0]  = sibling at the leaf level
siblings[1]  = sibling one level higher
...
siblings[15] = sibling immediately below the root
```

The path contains exactly 16 siblings. No shortened path, omitted empty sibling, variable-length list, sparse proof, separate direction vector, or most-significant-bit-first ordering is valid at the Compact protocol boundary.

An application transport MAY compress repeated deterministic empty siblings, but it MUST expand and validate them into the exact 16-element vector before the values enter a V1 witness or circuit.

## 16. Reusable Root Reconstruction

For `index < 65,536`, derive `bit[0..15]` as specified above and compute:

```text
node = leaf

for level in 0..15 inclusive:
    sibling = siblings[level]

    if bit[level] == false:
        node = merkleNodeV1(node, sibling)
    else:
        node = merkleNodeV1(sibling, node)

return node
```

In Compact source, a fixed loop over `0..16` uses an exclusive upper bound and therefore executes exactly 16 times.

The algorithm is normative for issuer membership, issuer insertion, credential membership, credential insertion, non-revocation, and revocation.

The implementation MUST NOT:

- reverse sibling order
- derive direction from sibling values
- sort children
- skip a level
- use a caller-supplied direction
- truncate the index to 16 bits without a range assertion; or
- accept the reconstructed value without comparing it to the applicable authoritative current root

## 17. Credential Membership Witness

The private credential-membership witness is conceptually:

```text
CredentialMembershipWitnessV1 {
    credentialIndex: Uint<32>
    path: CredentialMerklePathV1
}
```

The witness contains no direction bits. The credential ID, commitment, statement, openings, issuer signature, and holder secret are supplied through their owning private-state structures rather than duplicated inside the Merkle path.

The witness is untrusted until the proof circuit rederives the credential leaf, checks the index range, reconstructs the root, and compares it with current ledger state.

## 18. Current Credential Membership Verification

To establish current credential membership, a proof circuit MUST:

1. derive and constrain the credential ID under `01-credential.md`
2. open and constrain the credential commitment under `01-credential.md` and `03-commitments.md`
3. derive `credentialLeafV1` from that same ID and commitment
4. assert `credentialIndex < nextCredentialIndex`
5. assert `credentialIndex < 65,536`
6. derive the 16 direction bits from `credentialIndex` in-circuit
7. reconstruct the root from the leaf, index, and exact 16-sibling path; and
8. assert that the result equals the current authoritative `credentialRoot`

Conceptually:

```text
credentialRootFrom(
    credentialLeafV1(credentialId, credentialCommitment),
    credentialIndex,
    credentialPath
) == credentialRoot
```

A match proves only that this exact canonical leaf is registered at this position under the current root.

## 19. Credential Insertion Proof

For a current state with:

```text
i = nextCredentialIndex
```

credential registration MUST:

1. assert `i < 65,536`
2. derive and validate the canonical credential ID, commitment, issuer signature, and issuer membership under their owning specifications
3. derive the canonical credential leaf
4. derive and reject any duplicate deployment-scoped credential registration nullifier under `05-ledgers.md`
5. reconstruct `oldRoot` from `emptyCredentialLeaf`, `i`, and the insertion path
6. assert `oldRoot == credentialRoot`
7. reconstruct `newCredentialRoot` from `credentialLeafV1`, `i`, and the same path; and
8. atomically perform the exact credential-registry write set frozen in `05-ledgers.md`

The old-root proof establishes that the next sequential position is empty. Reusing the same index and siblings for the new leaf establishes that only this leaf-to-root path changes.

The insertion request MUST NOT accept a caller-selected current root, new root, index, leaf, direction vector, frontier, or replacement position as authoritative.

## 20. Credential Root State Transition

A successful insertion changes:

```text
credentialRoot -> newCredentialRoot
nextCredentialIndex -> nextCredentialIndex + 1
registeredCredentialNullifiers -> insert canonical nullifier
```

It MUST NOT change:

- `issuerRoot`, `nextIssuerIndex`, or registered issuer leaves
- `revocationRoot`
- either sealed deployment field
- any previously registered credential leaf
- the credential ID, commitment, statement, or issuer signature; or
- any credential or revocation path stored off-chain except through later refresh

The three credential-registry writes are atomic. No `checkpoint()` or partial-commit boundary may allow a root, counter, or nullifier update to commit alone.

The newly derived root is the only credential-tree value intentionally disclosed to ledger state. The credential leaf, credential ID, commitment, index, and insertion path MUST NOT be returned, emitted, or stored as standalone public values.

## 21. Credential-ID and Duplicate Semantics

The credential registry's uniqueness key is the credential ID, enforced through `registeredCredentialNullifiers` under `05-ledgers.md`.

The tree MUST NOT attempt global duplicate detection by scanning private leaves or treating the root as a membership set searchable by value.

Credential commitments are randomized `persistentCommit` outputs. Two credentials with semantically equal statements are expected to have different commitments because each issuance uses a fresh credential opening. They also have different credential IDs because each issuance uses a fresh issuance nonce.

A distinct credential ID with an equal commitment value would produce a distinct credential leaf because the ID is part of `CredentialLeafInputV1`. Commitment equality is not the V1 registry uniqueness key.

Reusing a credential ID is rejected even if another commitment or index is proposed. Re-registering the exact same leaf is therefore also rejected.

## 22. Leaf and Position Immutability

Once registered, a credential leaf remains at its assigned index for the life of the deployment.

The tree has no transition for:

```text
registered leaf -> empty leaf
registered leaf -> replacement leaf
registered leaf at index i -> same leaf at index j
```

Expiration does not mutate the tree. Revocation does not mutate the credential tree or leaf. A credential may remain a valid credential-tree member while being expired or revoked under separate current-validity checks.

A corrected, renewed, or reissued credential uses a fresh credential ID, commitment, leaf, and new sequential index.

## 23. Current Root and No Historical Registry

The authoritative public credential-tree state is:

```compact
export ledger credentialRoot: Bytes<32>;
export ledger nextCredentialIndex: Uint<32>;
```

The complete ledger layout and credential nullifier set are frozen in `05-ledgers.md`.

V1 verifies only the current credential root. It has no on-chain historical-root set, root timestamp, root version, root-age allowance, or verifier-selected snapshot.

An archived root may be useful for operational audit but is not a V1 current-membership trust anchor.

## 24. Path Refresh and Stale Roots

Appending a later credential changes the root and can change authentication siblings for earlier leaves. The earlier leaf and index remain immutable, but its current path may need refresh.

A proof constructed against an earlier credential root may remain mathematically valid for that root. It MUST fail a current-state verification after the authoritative root changes unless rebuilt with a path for the current root.

Clients MUST obtain the current `credentialRoot`, `nextCredentialIndex`, and path state before proof generation or registration. A stale, unavailable, malformed, or inconsistent path MUST fail closed.

A caller-supplied or cached root MUST NOT override current contract state.

## 25. Shared Algorithm Across Trees

The same `merkleNodeV1` and root-reconstruction algorithm apply to:

- issuer insertion from the canonical empty issuer leaf
- issuer membership from the canonical issuer leaf
- credential insertion from `emptyCredentialLeaf`
- credential membership from `credentialLeafV1`
- non-revocation from the canonical empty revocation leaf; and
- revocation from the credential-bound revoked leaf

Each operation MUST use the correct tree-specific leaf and current root. Leaf domain separation prevents an issuer leaf, credential leaf, empty leaf, or revoked leaf from being interpreted as another leaf type under conforming construction.

The credential and revocation operations MUST use exactly the same private `credentialIndex` for one credential instance. Equal depth and path conventions do not imply equal sibling vectors or roots.

## 26. Root-Only Ledger Representation

The contract stores only the current roots and counters defined by `05-ledgers.md`. It does not store complete tree leaves, nodes, paths, frontiers, or tree objects.

The root is authoritative. An off-chain frontier, database, cache, indexer, sparse-tree object, or reconstructed tree is an availability mechanism and MUST NOT become a second trust anchor.

An implementation MAY use a frontier or other tree data structure internally off-chain for efficient updates, provided it produces the exact 16-sibling path and root required here. No frontier enters a V1 witness as an alternative to the path.

## 27. Off-Chain Tree Provider

The root-only privacy design requires an off-chain provider to maintain the private credential leaves and tree structure needed for insertion and current membership paths.

For every finalized registration, the provider MUST securely obtain the assigned index and canonical credential leaf. It need not receive the credential statement, opening, issuer signature, or credential leaf preimage if the proving client supplies the already derived leaf through a confidential authenticated channel.

The provider MUST:

- apply finalized insertions in authoritative counter order
- retain the exact leaf at each registered position
- represent every unallocated position with `emptyCredentialLeaf`
- derive nodes with the exact shared ordered construction
- serve exact 16-sibling paths ordered leaf-to-root
- reconstruct and compare its current root with the on-chain `credentialRoot`
- preserve encrypted, tested backups sufficient to recover the private tree
- refresh paths after later insertions
- minimize index, credential, holder, issuer, transaction, and request correlation; and
- fail closed rather than fabricate a leaf, sibling, or root

Incorrect provider data cannot create false membership because the circuit compares the reconstructed root with current ledger state. The provider is trusted for availability and privacy, not correctness.

## 28. Privacy and Disclosure Boundary

The public credential-tree values are:

- current `credentialRoot`
- current `nextCredentialIndex`
- the deployment-scoped credential nullifiers frozen in `05-ledgers.md`; and
- transaction ordering and metadata visible through the network

The following are private by default:

- credential ID and commitment
- credential leaf and assigned credential index
- insertion and membership paths
- the mapping from a public root transition or nullifier to a credential, issuer, holder, or qualification; and
- provider correlation metadata

Because `persistentHash` is not a general-purpose hiding commitment, a credential leaf is private safely only under the entropy and hiding assumptions of its credential ID and credential commitment and the absence of auxiliary metadata leaks.

The Compact compiler requires intentional disclosure when a root derived from private values enters public ledger state. The implementation MUST place `disclose(newCredentialRoot)` at the narrowest write boundary and MUST NOT disclose the credential leaf, its preimage, index, or path as an intermediate shortcut.

Production code SHOULD keep leaf and root helper circuits internal. If exported wrappers are needed for test vectors, they SHOULD exist only in a dedicated test contract or test build so a production endpoint cannot be misused to disclose private intermediate values.

## 29. Native Merkle APIs Are Not V1-Compatible

Compact's standard library provides native `MerkleTree`, `MerkleTreeDigest`, `MerkleTreePath`, `merkleTreePathRoot`, and `merkleTreePathRootNoLeafHash` facilities.

Those facilities are not wire-compatible substitutes for JustProof V1 because the frozen protocol requires:

- `Bytes<32>` roots and nodes
- typed `persistentHash` leaf and node inputs
- the exact shared node domain
- direction derived from a separately constrained `Uint<32>` index; and
- the root-only ledger layout in `05-ledgers.md`

A conforming implementation MUST NOT declare a native `MerkleTree<16, T>` ledger field, store a `MerkleTreeDigest`, or use a native Merkle root result in place of `credentialRoot`, `issuerRoot`, or `revocationRoot`.

Utility code MAY use native or third-party trees for unrelated application data, but such data is outside the JustProof V1 protocol and cannot satisfy its membership checks.

## 30. Performance and Implementation Discipline

`persistentHash` is intentionally persistent but is not the circuit-optimized transient hash. A depth-16 membership proof therefore has a material circuit cost.

Implementations SHOULD:

- keep the fixed depth at 16
- derive each canonical leaf once per circuit and reuse the result
- reuse the shared node helper rather than duplicate tree-specific node code
- use compile-time fixed 16-level loops
- avoid redundant root reconstructions when one constrained result can be reused
- benchmark registration, revocation, and qualification proving with the pinned toolchain; and
- record circuit-size and proving-time regressions in continuous integration

An implementation MUST NOT reduce cost by switching V1 roots to `transientHash`, weakening a path, omitting a leaf derivation, shortening the tree, trusting a provider-computed root, or changing the domain construction.

## 31. Failure Conditions

Credential insertion or membership MUST fail closed if any of the following holds:

- `index >= 65,536`
- membership uses `index >= nextCredentialIndex`
- insertion uses an index other than current `nextCredentialIndex`
- a supplied direction vector exists or path direction is not derived from the index
- path length or sibling order differs from V1
- a sibling, leaf, credential ID, commitment, domain, version, or field order differs
- an old insertion path does not authenticate `emptyCredentialLeaf` against current `credentialRoot`
- a membership path does not authenticate `credentialLeafV1` against current `credentialRoot`
- a path or root is stale
- the credential registration nullifier is duplicated or mismatched
- the tree is full
- a registration attempts deletion, replacement, overwrite, or index reuse
- a native or alternative Merkle construction is substituted; or
- the complete ledger update cannot commit atomically

Errors MUST NOT reveal a private credential ID, commitment, leaf, index, sibling, path, statement, signature, opening, or secret.

## 32. Security Properties and Limitations

Assuming collision resistance of the frozen hash constructions and correct constraint implementation, V1 provides:

- **Value binding:** the credential leaf binds one credential ID and commitment
- **Position binding:** ordered hashing and index-derived directions bind that leaf to one position
- **Structural binding:** the root commits to the complete ordered tree state
- **Append integrity:** insertion proves the next position was empty before replacing it
- **Immutable membership:** later insertions do not change earlier leaves or indices
- **Cross-tree separation:** distinct leaf domains prevent semantic substitution across trees
- **Private membership:** a proof can authenticate a private leaf, index, and path against a public root; and
- **Current-state binding:** verification constrains membership to the authoritative current root

V1 does not prevent:

- loss or denial of private path data
- correlation by a provider that sees indices, leaves, or requests
- transaction timing and counter-position leakage
- later linkage if a credential ID, commitment, leaf, or correlated metadata is disclosed
- an authorized issuer from issuing misleading credentials
- a holder from transferring private credential state; or
- hash or implementation failures outside the stated assumptions

Merkle membership is not a hiding scheme by itself and is not equivalent to credential validity.

## 33. Non-Goals

V1 does not provide:

- dynamic tree depth or capacity
- arbitrary keyed insertion or sparse-map semantics
- deletion, replacement, compaction, index reuse, or tree rebalancing
- variable-length or shortened Compact paths
- caller- or witness-supplied direction bits
- native Compact Merkle-tree compatibility
- public credential discovery or enumeration
- historical-root verification
- a public credential-leaf or commitment list
- commitment or leaf equality as the credential uniqueness rule
- credential validity from membership alone; or
- recovery of lost private provider state from the public root

## 34. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. Every protocol tree is an ordered binary tree of depth 16 and capacity 65,536.
2. Leaves, siblings, nodes, and roots use `Bytes<32>`.
3. Indices use `Uint<32>` and are constrained below 65,536 before path interpretation.
4. Credential leaves use the exact typed input, field order, domain, and protocol version.
5. Credential leaves bind exactly the credential ID and credential commitment.
6. Empty credential leaves use their exact distinct typed input and domain.
7. Every internal node uses the exact shared typed input and node domain.
8. Left and right child order is significant and children are never sorted.
9. The initial credential root is derived through exactly 16 shared-node levels from `emptyCredentialLeaf`.
10. Every path contains exactly 16 `Bytes<32>` siblings ordered leaf-to-root.
11. Direction bits are derived in-circuit from the range-constrained index and are never witness inputs.
12. `bit[0]` determines direction at the leaf level.
13. Root reconstruction processes every level exactly once.
14. Credential membership derives the leaf from the same credential ID and commitment constrained elsewhere in the proof.
15. Current credential membership compares only with current authoritative `credentialRoot`.
16. Membership requires `credentialIndex < nextCredentialIndex`.
17. Insertion occurs only at current `nextCredentialIndex` and proves the empty leaf before replacement.
18. A successful insertion changes exactly the credential root, counter, and credential nullifier set.
19. Credential leaves and indices are immutable, sequential, and never reused.
20. Credential-ID uniqueness is enforced by the exact nullifier construction in `05-ledgers.md`.
21. Commitment or leaf equality is not a substitute uniqueness rule.
22. Expiration and revocation never mutate the credential tree.
23. Credential and revocation proofs use the same credential index.
24. The ledger stores only the current root and counter for the credential tree, plus the separate nullifier set.
25. Off-chain tree state is untrusted and cannot override a root.
26. A stale, malformed, unavailable, or inconsistent path fails closed.
27. Native or alternative Merkle constructions never substitute for V1.
28. Private credential leaves, indices, and paths are not returned, emitted, or stored as standalone public protocol values.

## 35. Required Test Vectors and Tests

Before a V1 implementation is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- all three domain-tag constants
- credential-leaf derivation for fixed credential ID and commitment values
- empty credential leaf
- every `emptyCredentialNode[0..16]` value and `initialCredentialRoot`
- internal-node left/right ordering
- index-bit decomposition for `0`, `1`, `2`, `5`, `32,768`, and `65,535`
- root reconstruction at index `0`
- root reconstruction at index `65,535`
- root reconstruction at an index containing mixed zero and one bits
- a complete insertion transition at index `0`
- a later insertion transition with mixed index bits; and
- current credential-membership verification

The contract and pure-circuit suite MUST test:

- constructor initialization to the exact initial credential root
- rejection of index `65,536` and every larger representable index
- exact 16-sibling path enforcement
- rejection of reversed, shortened, extended, or reordered paths
- rejection of separately supplied or incorrectly derived directions
- rejection when the same path is paired with another index
- rejection of a wrong credential ID, commitment, leaf, sibling, domain, or protocol version
- rejection of a native or alternative Merkle root
- successful sequential append and exact counter increment
- rejection of skipped, caller-selected, reused, occupied, or full-tree positions
- preservation of every earlier leaf after insertion
- atomic rollback of root, counter, and nullifier state on every failure path
- duplicate credential-ID rejection through the ledger nullifier even when another commitment is proposed
- registration of distinct credential IDs with otherwise equal credential statements
- current membership success immediately after insertion
- current membership after later insertions with a refreshed path
- failure with a stale path or stale root
- credential membership remaining true after expiration or revocation while full validity fails elsewhere
- revocation and credential membership using the same private credential index
- failure closed when the provider path or private tree is unavailable
- absence of credential IDs, commitments, leaves, indices, paths, statements, openings, signatures, and secrets from ledger fields, exported outputs, events, logs, analytics, URLs, and presentation artifacts; and
- pinned circuit-size and proving-time regression measurements

A changed domain constant, typed hash vector, empty root, path convention, depth, or transition vector is a protocol change, not an ordinary regression update.

## 36. Specification Ownership and Dependencies

This document is authoritative for:

- `CredentialLeafInputV1` and credential-leaf derivation
- the canonical empty credential leaf and initial credential root
- the shared V1 internal-node construction
- the reusable path type, sibling order, index decomposition, direction convention, and root-reconstruction algorithm
- credential-tree depth, capacity, indexing, insertion, membership, and immutability
- root-only credential-tree privacy and provider requirements; and
- Merkle-specific conformance tests

`01-credential.md` is authoritative for credential ID, credential commitment, credential immutability, current validity, and the requirement that the credential leaf bind exactly the ID and commitment.

`02-issuer-registry.md` is authoritative for issuer occupied and empty leaves, issuer registration, and issuer membership. Its node, depth, index, and path dependencies are reproduced here without modification.

`03-commitments.md` is authoritative for the randomized credential commitment and its hiding, binding, opening, and freshness requirements.

`04-revocation.md` is authoritative for empty and revoked leaves, initial revocation root, shared credential-index relationship, and revocation transition. Its path algorithm dependency is reproduced here without modification.

`05-ledgers.md` is authoritative for the root-only ledger layout, counters, deployment-scoped credential nullifier, operation write sets, disclosure boundary, atomicity, and current-state semantics.

`07-witnesses.md` MUST provide the exact private indices and 16-sibling paths defined here without supplying authoritative direction bits or roots.

`08-proofs.md` and `09-verification.md` MUST constrain the exact credential leaf, index, path, current root, and current counter relationship defined here.

`10-specification.md` MUST consolidate these exact constructions and reject the earlier draft's alternative domains, deterministic-commitment assumption, optional append behavior, variable path optimization, or native Merkle substitution.

## 37. Final Protocol Principle

The JustProof V1 credential Merkle tree establishes:

> The canonical leaf binding this private credential ID and credential commitment occupies this private sequential index under the current authoritative credential root.

It does not establish that the issuer is registered, the signature is valid, the commitment is correctly opened, the holder controls the subject secret, the credential is unexpired or unrevoked, or the requested qualification is satisfied.

Those remain separate proof obligations that must be constrained to the same credential instance and current authoritative state.
