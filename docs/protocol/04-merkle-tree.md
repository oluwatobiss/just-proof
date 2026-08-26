# JustProof Merkle Tree Protocol

- **Status:** Draft
- **Protocol:** JustProof Credential Protocol v1
- **Namespace:** `JP:CREDENTIAL:V1`

## 1. Purpose

This document specifies the Merkle tree used by the JustProof Credential Protocol to maintain a compact, publicly verifiable commitment to a collection of credential commitments.

The Merkle tree allows the protocol to establish that a particular credential commitment belongs to an authorized on-chain set without requiring every credential commitment to be supplied to a verifier.

The tree provides:

- deterministic construction
- compact representation of a credential set
- membership proofs
- efficient verification
- privacy-preserving verification when combined with zero-knowledge proofs

This specification defines:

- the tree structure
- leaf construction
- internal-node construction
- tree depth
- empty-node semantics
- root calculation
- path representation
- membership verification
- domain separation
- update semantics
- protocol invariants

This document does not define the credential schema, credential commitment construction, issuer registry semantics, or zero-knowledge witness implementation.

## 2. Role of the Merkle Tree

The Merkle tree provides a bridge between individual credential commitments and public contract state.

Conceptually:

```text
Credential
    │
    ▼
Credential Commitment
    │
    ▼
Merkle Leaf
    │
    ▼
Merkle Tree
    │
    ▼
Merkle Root
    │
    ▼
Midnight Ledger
```

The ledger stores the Merkle root rather than the complete collection of credential commitments.

A holder can subsequently prove that a private credential corresponds to a credential commitment included in the tree by providing a Merkle membership proof.

## 3. Terminology

| Term                 | Definition                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Leaf**             | A terminal node containing a credential commitment-derived value.                                    |
| **Internal node**    | A non-leaf node derived from two child nodes.                                                        |
| **Root**             | The single value representing the state of the entire tree.                                          |
| **Merkle path**      | The sequence of sibling nodes required to reconstruct a root from a leaf.                            |
| **Sibling**          | The node paired with a node when calculating its parent.                                             |
| **Path index**       | The positional information identifying whether a node is the left or right child at each tree level. |
| **Tree depth**       | The number of hashing levels between a leaf and the root.                                            |
| **Empty node**       | The canonical value representing an unused tree position.                                            |
| **Membership proof** | A proof that a particular leaf belongs to a tree represented by a specific root.                     |

## 4. Tree Model

Version 1 uses a binary Merkle tree.

Every non-leaf node has exactly two children:

```text
                Root
               /    \
              /      \
           Node      Node
           /  \      /  \
          L    R    L    R
```

The tree is represented by a single root value.

The root MUST uniquely commit to the ordered set of leaves under the security assumptions of the selected hash function.

## 5. Merkle Tree Domain Separation

Merkle-tree hashing MUST use explicit domain separation.

Version 1 defines separate domains for:

```text
JP:CREDENTIAL:V1:MERKLE:LEAF
JP:CREDENTIAL:V1:MERKLE:NODE
```

The leaf and internal-node domains MUST remain distinct.

A Merkle leaf MUST NOT be constructed using the internal-node domain.

Likewise, an internal node MUST NOT use the leaf domain.

This prevents a value representing one tree structure from being ambiguously interpreted as another.

## 6. Leaf Construction

A Merkle leaf is derived from a credential commitment.

Conceptually:

```text id="mb0d7u"
leaf =
    H(
        "JP:CREDENTIAL:V1:MERKLE:LEAF" ||
        credentialCommitment
    )
```

The leaf MUST NOT contain the complete credential.

The leaf MUST NOT contain private credential claims.

The leaf SHOULD be derived from the credential commitment rather than directly from the credential.

This produces the following relationship:

```text
credential
    │
    ▼
credential commitment
    │
    ▼
Merkle leaf
```

This separation ensures that the Merkle-tree layer remains independent of the private credential representation.

## 7. Internal Node Construction

Each internal node is derived from its two child nodes.

For a left child `L` and right child `R`:

```text id="j7rj2j"
node =
    H(
        "JP:CREDENTIAL:V1:MERKLE:NODE" ||
        L ||
        R
    )
```

The order of the children is significant.

Therefore:

```text id="i6p0k0"
H(domain || L || R)
```

MUST NOT be considered equivalent to:

```text id="6a7s7u"
H(domain || R || L)
```

except with negligible probability.

The tree therefore represents an ordered structure.

## 8. Tree Depth

Version 1 MUST define a fixed maximum tree depth.

The depth determines the maximum number of credential leaves that can be represented.

For a binary tree of depth `D`:

```text id="y4r5h7"
maximum leaves = 2^D
```

The selected depth MUST be compatible with:

- Compact circuit constraints
- proof size
- expected credential volume
- contract storage requirements
- transaction cost

The initial Version 1 depth is:

```text id="u6c1t5"
TBD
```

The depth MUST be frozen before the Merkle circuit and contract semantics are finalized.

Changing the tree depth changes the Merkle protocol and SHOULD require a new protocol version unless the contract explicitly supports multiple tree configurations.

## 9. Tree Indexing

Leaves occupy deterministic positions in the tree.

Each leaf has an integer index:

```text id="f3t7s5"
0 <= index < 2^D
```

The binary representation of the index determines the leaf's path through the tree.

For example, in a depth-3 tree:

```text id="h1r5dz"
index = 5
binary = 101
```

The path bits determine whether the node is the left or right child at each level.

The implementation MUST define whether path bits are interpreted from the least-significant bit or most-significant bit first.

Version 1 uses:

```text id="c6q8sx"
least-significant bit first
```

unless changed before the protocol is frozen.

## 10. Empty Leaves

A fixed-depth tree contains positions that may not yet contain credentials.

Version 1 therefore defines a canonical empty leaf.

The empty leaf MUST NOT be represented by an arbitrary zero value unless that value is explicitly selected as the protocol's canonical empty-node representation.

The initial value is:

```text id="9r8rpa"
EMPTY_LEAF = TBD
```

The empty value MUST be deterministic and identical across all implementations.

## 11. Empty Internal Nodes

Empty internal nodes are derived recursively.

Conceptually:

```text id="qylb49"
EMPTY_NODE[0] = EMPTY_LEAF

EMPTY_NODE[n + 1] =
    H(
        "JP:CREDENTIAL:V1:MERKLE:NODE" ||
        EMPTY_NODE[n] ||
        EMPTY_NODE[n]
    )
```

Therefore, every tree level has a deterministic empty-node value.

For a tree of depth `D`, the root of an entirely empty tree is:

```text id="x12h7d"
EMPTY_ROOT = EMPTY_NODE[D]
```

The empty-node values MUST be deterministic and MUST NOT depend on runtime state.

## 12. Initial Tree State

When no credentials have been registered, the tree root MUST equal the canonical empty root.

Conceptually:

```text id="50f78q"
tree.root = EMPTY_ROOT
```

The contract MUST NOT use a null, undefined, or implementation-specific representation for the empty tree.

The empty root is a protocol value.

## 13. Root Calculation

The root is calculated recursively from the leaves.

For a pair of leaves:

```text id="ps3r9m"
parent =
    H(
        "JP:CREDENTIAL:V1:MERKLE:NODE" ||
        left ||
        right
    )
```

The calculation continues until one value remains:

```text id="s44v9r"
leaves
   │
   ▼
level 1
   │
   ▼
level 2
   │
   ▼
...
   │
   ▼
root
```

The resulting root represents the complete state of the tree.

## 14. Merkle Membership Proof

A membership proof demonstrates that a particular leaf exists at a specific position in a tree represented by a known root.

A proof consists conceptually of:

```text id="u8o5e7"
MerkleProof {
    leaf
    path
    index
}
```

Where:

- `leaf` is the leaf being proven
- `path` contains sibling nodes
- `index` determines left/right ordering at each level

The path length MUST equal the configured tree depth.

## 15. Membership Verification

Given:

- leaf `L`
- sibling path `P`
- leaf index `I`
- expected root `R`

the verifier reconstructs the root.

At each level:

```text id="u8sg6f"
if current node is left:
    current = H(NODE_DOMAIN || current || sibling)

if current node is right:
    current = H(NODE_DOMAIN || sibling || current)
```

After processing the complete path:

```text id="d6p6cm"
current == expectedRoot
```

MUST hold for a valid membership proof.

If the reconstructed value does not equal the expected root, the proof MUST be rejected.

## 16. Merkle Path Representation

The path MUST contain exactly one sibling value for each tree level.

For a depth-`D` tree:

```text id="4y1z6f"
path.length == D
```

The path MUST be represented in a deterministic order corresponding to the path-index convention.

Version 1 uses the path from the leaf toward the root:

```text id="1w3g0p"
path[0] = sibling at leaf level
path[1] = sibling at next level
...
path[D-1] = sibling immediately below the root
```

This ordering MUST be consistent between:

- TypeScript implementations
- test vectors
- witness construction
- Compact circuits

## 17. Credential-to-Leaf Relationship

A credential is not inserted directly into the tree.

The protocol uses:

```text id="k8f1l3"
Credential
    │
    ▼
Credential Commitment
    │
    ▼
Merkle Leaf
    │
    ▼
Merkle Root
```

Therefore, a Merkle membership proof establishes membership of a credential commitment rather than exposing the credential.

During a zero-knowledge proof, the holder can privately derive:

```text id="3rcgup"
credential
    │
    ▼
credential commitment
    │
    ▼
Merkle leaf
    │
    ▼
Merkle root
```

The resulting proof can demonstrate membership without revealing the private credential.

## 18. Public Root

The Merkle root is public verification state.

The current root MUST be maintained by the Midnight contract.

Conceptually:

```text id="2w3zzh"
Contract State
    │
    └── merkleRoot
```

The root MAY change whenever the authorized tree state changes.

The contract MUST expose sufficient public state for a verifier to determine which root is authoritative for a proof.

## 19. Root Updates

Adding a credential changes the Merkle root.

Conceptually:

```text id="c0p6xr"
Root₀
  │
  │ add credential
  ▼
Root₁
```

The contract MUST update the stored root atomically with the corresponding credential-registration operation.

A state transition MUST NOT result in the contract storing a root that does not correspond to the intended tree state.

## 20. Append-Only Semantics

Version 1 SHOULD use append-only credential registration.

An append-only tree has the following property:

```text id="3u3n6k"
Root₀
  │
  ├── existing credentials
  │
  ▼
Root₁
  │
  ├── existing credentials
  ├── new credential
  │
  ▼
Root₂
```

Existing leaves MUST NOT be modified when a new credential is appended.

This simplifies:

- membership proofs
- contract semantics
- witness generation
- testing
- auditability

If credential deletion or arbitrary replacement is required, it MUST be specified as an explicit protocol extension rather than being implicitly supported.

## 21. Duplicate Leaves

The protocol MUST define how duplicate credential commitments are handled.

Because credential commitments are deterministic, identical credentials produce identical commitments and therefore identical leaves.

Version 1 SHOULD prevent accidental duplicate registration.

The contract SHOULD reject an insertion when the credential commitment is already registered, unless duplicate registration is explicitly part of the protocol semantics.

If duplicate credentials are permitted, the credential's leaf index becomes significant and MUST be included in the registration semantics.

## 22. Leaf Index Allocation

The protocol MUST define how a new credential receives a leaf index.

Version 1 uses sequential allocation:

```text id="k9x2ms"
nextIndex = current number of registered leaves
```

The first credential receives:

```text id="5m4k9c"
index = 0
```

The second receives:

```text id="p0z2nq"
index = 1
```

and so forth.

The next available index MUST be part of the contract's authoritative state or deterministically derivable from it.

The contract MUST NOT allow two credentials to occupy the same index.

## 23. Capacity

For a tree of depth `D`, the maximum number of leaves is:

```text id="az1p7b"
2^D
```

The contract MUST reject credential registration once the tree reaches its maximum capacity.

The capacity MUST be considered when selecting the Version 1 tree depth.

## 24. Empty-Path Optimization

A membership proof MAY omit explicit sibling values for levels containing only empty nodes if the protocol defines deterministic reconstruction of those values.

For example:

```text id="0p2p4s"
sibling == EMPTY_NODE[level]
```

can be reconstructed locally.

However, the proof representation MUST remain deterministic.

Any optimization that changes the witness representation MUST be defined explicitly in the protocol rather than being left to individual implementations.

## 25. Merkle Root and Credential Revocation

The Merkle tree represents credential registration state, not necessarily credential validity.

A credential may remain a member of the tree after being revoked.

Therefore:

```text id="0crvjy"
Merkle membership
        ≠
Credential validity
```

A complete verification operation MUST evaluate both:

```text id="8jjm3f"
membership
+
issuer authorization
+
signature validity
+
revocation state
+
requested credential conditions
```

The Merkle root MUST NOT be interpreted as a validity registry by itself.

## 26. Privacy Properties

The Merkle tree allows public membership state to be represented without publishing credential contents.

The public root does not reveal:

- the complete credential
- private credential claims
- the holder's identity
- the holder's private witness

However, individual credential commitments and leaf values may themselves be observable if they are published directly.

Therefore, when privacy requires the credential commitment to remain undisclosed, the holder SHOULD use zero-knowledge proof inputs rather than exposing the leaf or commitment directly.

The protocol's privacy guarantee comes from the combination of:

```text id="p87zq7"
private credential
+
private witness
+
Merkle membership proof
+
zero-knowledge proof
```

rather than from the Merkle tree alone.

## 27. Domain Separation Summary

Version 1 defines the following Merkle domains:

```text id="i8d8ul"
JP:CREDENTIAL:V1:MERKLE:LEAF
JP:CREDENTIAL:V1:MERKLE:NODE
```

The relationship is:

```text id="2k6n5p"
credential commitment
        │
        │ LEAF domain
        ▼
       leaf
        │
        │ NODE domain
        ▼
   internal node
        │
        ▼
      root
```

The exact domain strings MUST NOT be changed after protocol freeze.

## 28. Security Properties

Assuming the selected hash primitive provides the required collision resistance, the Merkle tree provides:

### Membership binding

A valid membership proof binds a leaf to a particular root.

### Structural binding

The root commits to the ordering and contents of the tree.

### Efficient verification

A verifier requires only `D` sibling values to reconstruct a root for a depth-`D` tree.

### Privacy compatibility

Membership can be demonstrated inside a zero-knowledge proof without revealing the credential or complete tree.

## 29. What the Merkle Root Does Not Prove

A valid Merkle membership proof does **not** by itself establish that:

- the credential was issued by an authorized issuer
- the issuer signature is valid
- the credential has not expired
- the credential has not been revoked
- the holder is the credential subject
- a requested qualification claim is satisfied

The Merkle tree proves only:

> **This leaf belongs to the tree represented by this root.**

The rest of the JustProof protocol establishes the additional conditions required for credential verification.

## 30. Protocol Invariants

Every Version 1 implementation MUST preserve the following invariants:

1. The tree is binary.
2. Every internal node has exactly two children.
3. Leaf hashing uses the leaf domain separator.
4. Internal-node hashing uses the node domain separator.
5. Left and right child ordering is significant.
6. The tree has a fixed protocol-defined maximum depth.
7. Empty nodes are deterministic.
8. The empty root is deterministic.
9. Every membership path has exactly one sibling per tree level.
10. Path ordering is deterministic.
11. A valid membership proof reconstructs the expected root.
12. An invalid path MUST NOT verify against the expected root except with negligible probability.
13. Credential commitments are converted into leaves deterministically.
14. Existing leaves are not modified by append-only registration.
15. Leaf indexes are unique.
16. The tree cannot exceed its configured capacity.
17. The root represents public tree state and MUST be updated atomically.
18. Merkle membership MUST NOT be treated as equivalent to credential validity.
19. Merkle construction MUST NOT depend on frontend implementation details.
20. The hash primitive, domain separators, depth, empty-node semantics, and path representation MUST be frozen before Version 1 implementation is complete.

## 31. Test Vectors

Before the Merkle protocol is frozen, normative test vectors MUST be defined.

Each test vector SHOULD contain:

```text id="i2v3d4"
tree depth
credential commitment
leaf
leaf index
Merkle path
expected root
```

The test suite MUST cover at least:

- an empty tree
- a tree containing one credential
- a tree containing two credentials
- a tree containing multiple credentials
- insertion at different indexes
- left-child membership
- right-child membership
- a complete path
- an incorrect sibling
- an incorrect leaf
- an incorrect index
- an incorrect root
- maximum supported tree capacity
- duplicate credential registration
- independently reconstructed identical trees

The TypeScript implementation and Compact contract tests MUST use the same normative vectors.

## 32. Primitive Freeze

Before implementing the Merkle circuits and contract state, the following values MUST be finalized:

| Parameter                  | Status                         |
| -------------------------- | ------------------------------ |
| Hash primitive             | TBD                            |
| Hash output representation | TBD                            |
| Leaf domain                | `JP:CREDENTIAL:V1:MERKLE:LEAF` |
| Node domain                | `JP:CREDENTIAL:V1:MERKLE:NODE` |
| Tree depth                 | TBD                            |
| Empty leaf                 | TBD                            |
| Empty-node derivation      | Defined                        |
| Leaf indexing              | Sequential                     |
| Path bit ordering          | LSB-first                      |
| Path representation        | Leaf-to-root                   |
| Duplicate registration     | TBD                            |
| Tree update model          | Append-only                    |
| Maximum capacity           | `2^D`                          |
| Test vectors               | TBD                            |

Any change to these parameters after protocol freeze MUST be treated as a protocol change.

## 33. Reference Membership Flow

The complete conceptual membership flow is:

```text
                 PRIVATE
                    │
                    ▼
               Credential
                    │
                    ▼
        Credential Commitment
                    │
                    ▼
               Merkle Leaf
                    │
              +-----+-----+
              │           │
              ▼           ▼
         private path   public root
              │           │
              +-----+-----+
                    │
                    ▼
            Zero-Knowledge Proof
                    │
                    ▼
             Midnight Contract
                    │
                    ▼
            Membership Verified
```

The contract therefore needs only the authoritative public root and the verification logic required to determine whether the private leaf is a member of that root.

## 34. Final Protocol Principle

The Merkle layer exists to make one statement possible:

> **This credential commitment belongs to the authorized set represented by this public root.**

The Merkle tree does not expose the credential.

It does not establish issuer authority.

It does not establish credential validity.

It provides the authenticated set-membership primitive required by the JustProof zero-knowledge verification protocol.
