# Depth-16 Merkle trees and index binding

**Draft — User Review Required.** Retains [V1 Merkle semantics](../06-merkle-tree.md), except tree-specific V2 node domains and explicitly narrowed authenticated indices.

Each of issuer, credential, revocation is a separate ordered binary tree: depth **16**, capacity **65536**, indices **0…65535**. No sorted child pairs, dynamic depths, native Merkle ledger ADTs, historical roots, public frontiers or complete public leaf collections.

```text
IssuerMerklePathV2 { siblings: Vector<16, Bytes<32>> }
CredentialMerklePathV2 { siblings: Vector<16, Bytes<32>> }
RevocationMerklePathV2 { siblings: Vector<16, Bytes<32>> }
MerkleNodeInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  left: Bytes<32>
  right: Bytes<32>
}
IssuerEmptyLeafInputV2 { domain: Bytes<32>, protocolVersion: Uint<16> }
CredentialEmptyLeafInputV2 { domain: Bytes<32>, protocolVersion: Uint<16> }
RevocationNotRevokedLeafInputV2 { domain: Bytes<32>, protocolVersion: Uint<16> }
```

Sibling 0 is adjacent to the leaf; sibling 15 is adjacent to the root. For each tree t, `N_t(l,r)=persistentHash<MerkleNodeInputV2>({domain:D_t,protocolVersion:2,left:l,right:r})`. Empty leaf `E_t` is the typed hash of its dedicated empty record with its domain and version 2, not zero bytes. Define `E_t[0]=E_t`, `E_t[k+1]=N_t(E_t[k],E_t[k])` for k=0…15. Canonical root is E_t[16]. For revocation, E_t means NOT_REVOKED.

For `rootFrom_t(leaf,index,path)`, derive bits b0…b15 **inside the circuit** from the authenticated Uint<16> index. Start h0=leaf. For k=0…15, `h[k+1]=b[k] ? N_t(path[k],h[k]) : N_t(h[k],path[k])`. Return h16. Assert equality to the current authoritative root; witnesses never choose an authoritative root or independent directions.

## Practical pinned-compiler formulation

The tested fixed fold starts with remainder=index and 16 false bits. Process powers 32768,16384,…,1. At each step bit=(remainder>=power); subtract `(bit ? power : 0)`; prepend bit to the bits vector, dropping its last entry. Assert final remainder=0. The resulting vector is LSB-first. A second fixed fold zips those derived bits with 16 siblings and computes typed nodes. No division, modulo, shifts, unbounded recursion, supplied bit witnesses or explosive recursive expression construction is needed. Full probe/evidence is in the Phase 1 report. This formulation is an implementation candidate, not an already implemented production helper.

## Append and membership rules

Counters are Uint<32>, invariant 0≤counter≤65536. Before append require counter<65536; authenticate canonical empty leaf at index=counter; only then narrow to Uint<16>. Reconstruct new root using new leaf and the same path/index; increment counter by exactly one with Uint<32> arithmetic. Counter 65535 is the last valid insertion; resulting 65536 is a full-tree sentinel, never an index. Never wrap or truncate before checking capacity.

Issuer membership requires index<nextIssuerIndex. Credential membership requires index<nextCredentialIndex. Revocation takes exactly the credential's authenticated index and no independent revocation index; qualification and revocation authenticate both trees at that same index. Credential insertion leaves revocationRoot unchanged because all unallocated positions are already NOT_REVOKED. No arbitrary overwrite is permitted.

Reject wrong length, sibling, bit/index relationship, leaf, domain, version, capacity, original index, empty insertion path, stale root or cross-tree path. Malformed length fails adapter/generated interface validation; the circuit's fixed vector has no alternate length to accept. TypeScript adapters are not the soundness boundary. A correct root computed for another index is insufficient. Append-only counters leak issuance counts; private membership paths do not erase timing or off-chain coordination leakage. A root-only ledger does not itself provide private path availability; confidential tree reconstruction/coordination is required and remains an availability assumption.

## Review addendum — 2026-09-14: minimum data availability

The root-only ledger authenticates a tree but does not supply its contents. Before Phase 3, agree on a durable, confidential tree-state exchange and witness-refresh procedure. No production backend is selected here. A reference store/coordinator is **untrusted for authorization**: current contract roots, counters and circuit constraints remain authoritative.

| Data | Minimum recipients and purpose |
|---|---|
| Issuer leaves/indices | Registering authority and tree-state holder need them for append/path updates. Leaves are also in the public duplicate Set, but index associations and finalized order/checkpoints must be retained. Issuers need their own record/index/path. |
| Credential leaves/indices | Registering issuer and its tree-state holder need the final leaf/index; holder needs its own assignment/path and updates. Credential roots/nullifiers do not publish or reconstruct these leaf hashes. |
| Revoked leaves/indices | Revoking issuer and tree-state holder need the credential-bound new leaf/index; participants need updated same-index revocation paths. NOT_REVOKED leaves/empty subtrees are deterministic. Other participants need not receive credential IDs/openings. |

The registering party can compute its leaf using its allowed private inputs. Complete indexed leaf hashes, or an equivalent complete node store, permit construction of the next insertion path. A root/counter and one membership path generally do not. Send sufficient leaf/index or node updates with finalized transition/state references confidentially to tree-state holders. Reconstruct and compare each resulting root against finalized ledger state before committing an update; pending/conflicting operations must not overwrite the last finalized snapshot.

Holders and issuers obtain refreshed paths from a store or apply a sufficient authenticated sequence of node updates locally. Validate every path against the current root and exact assigned index. Unrelated transitions can change siblings; cached paths may become stale. Malicious stores can withhold or return invalid paths (denial of service), but cannot authorize invalid transitions.

Durably retain protocol/network/address/context and artifact identity; finalized root/counter checkpoints and references; indexed leaf hashes or sufficient nodes plus ordered finalized update history; pending-update reconciliation data; each participant's private package/retained revocation record and original index; and secrets in separate private custody. Role secrets, subject secrets and commitment openings are not coordinator tree-state requirements. Roots/counters alone cannot recover unknown leaves, their private preimages, lost package/opening/nonce data or arbitrary refreshed paths. Loss of every sufficient tree-state copy/update log can block future insertion/proving/revocation; no protocol recovery feature repairs it.

A complete store learns positions/update timing; path queries can link holders and revoked positions. Broadcasting all updates improves availability but broadens linkability. Hashes are not anonymous metadata. Specify confidential transport, access policy and durable encrypted backups without making a store authoritative. The following review decision resolves the minimum operational-model entry gate; production details remain future work.

## Accepted Phase 2B review decision — 2026-09-14

A native Node.js/Express.js registry coordinator may maintain issuer, credential and revocation leaf hashes, internal nodes/frontiers, assigned indices, finalized root/counter checkpoints and finalized transaction references. Credential leaf hashes and index/path metadata are confidential operational data where applicable. This accepts the minimum model above; it does not select or implement a production backend. No production backend is to be implemented in Phase 2B or Phase 3; contract tests continue using the deterministic reference tree.

The coordinator must never receive or store authority, issuer or subject secrets, issuance nonces, commitment openings, complete private credential packages or private credential statements. Authority, issuers and holders retain their respective private packages and role-specific recovery records. Coordinator indices and paths are untrusted: clients and circuits validate them against authoritative finalized on-chain roots and counters. The coordinator can deny service or leak metadata, but cannot authorize an invalid transition or proof. Durable backup and recovery of sufficient leaf/node history are availability requirements: roots and counters cannot reconstruct unknown private history or guarantee refreshed paths after its loss.

The user approved the following root constants for continued development, not production/release freeze: issuer `e9e09e4fa4cbf338a1b9ccef8cf3bfef63a11b7369c9279f902fb5014af0d3ad`, credential `fa151b227368f61e42bbbd5c7d2b0ea295a1fe142dd4e916142745b9ff75d656`, revocation `67cc1987e1b41a3e011478484861b497e304aa0a8a0699297b98be32eef977c8`. The shared-runtime conformance trust limitation remains.
