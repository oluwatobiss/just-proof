# JustProof Credential Revocation Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines JustProof V1 credential revocation: the revocation authority, authorization message, authenticated state, Merkle leaves and root, irreversible state transition, private non-revocation proof, current-state semantics, and privacy boundary.

The revocation registry answers one narrow question:

> Is the credential registered at this immutable credential index unrevoked in the current authoritative JustProof state?

Revocation does not modify or delete the credential, credential commitment, credential signature, or credential-registry membership.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- revocation is credential-level, current-state, monotonic, and irreversible
- the credential's registered issuer is the sole revocation authority
- revocation uses the same registered secp256k1 key that authenticated the credential
- the circuit rederives the credential ID from that authenticated issuer ID and the issuer-retained private issuance nonce
- authorization requires both the original credential signature and a new revocation signature
- the revocation tree has depth 16 and shares indices with the credential tree
- an empty revocation leaf means `NOT_REVOKED`
- a credential-bound revoked leaf means `REVOKED`
- the only transition is empty leaf to revoked leaf at the same credential index
- the public contract stores the current revocation root, not a public revoked-ID set
- private non-revocation is proved by authenticating the empty leaf at the credential's index
- V1 records no protocol revocation timestamp or reason; and
- V1 has no unrevocation, scheduled revocation, historical root verification, delegated authority, or batch revocation

Changing the authority, signature scheme, authorization message, leaf construction, tree depth, index relationship, node construction, transition, timestamp policy, privacy boundary, or validity semantics defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Baseline

The V1 contract implementation MUST begin with:

```compact
pragma language_version 0.23;
```

The implementation MUST import the required native types and circuits from `CompactStandardLibrary`.

V1 uses:

- `persistentHash<T>` for revocation leaves, Merkle nodes, and signed-message digests;
- `Secp256k1Point` for issuer verification keys;
- `Secp256k1EcdsaSignature` for original credential and revocation-authorization signatures; and
- `secp256k1EcdsaVerify` for in-circuit verification of both signatures.

Every signature digest MUST be derived and constrained from its exact typed message in the same circuit that verifies the signature. A caller-supplied digest is not authoritative.

Witness results, authentication paths, signatures, indices, credential identifiers, and commitments are untrusted circuit inputs until the circuit constrains them to authoritative ledger roots and frozen cryptographic constructions.

## 5. Terms and Roles

| Term | Definition |
| --- | --- |
| **Revocation authority** | The registered issuer whose key originally authenticated the credential. |
| **Credential index** | The immutable position assigned when the credential is appended to the credential registry. |
| **Revocation position** | The revocation-tree position equal to the credential index. |
| **Empty revocation leaf** | The canonical V1 leaf representing `NOT_REVOKED`. |
| **Revoked credential leaf** | The canonical V1 leaf binding the revoked credential ID and commitment. |
| **Revocation root** | The authoritative current root of the V1 revocation tree. |
| **Revocation authorization** | The issuer's secp256k1 signature approving the irreversible transition for one exact credential and deployment. |
| **Non-revocation proof** | A proof that the empty revocation leaf occupies the same current index as an authenticated registered credential. |
| **Revocation-state provider** | An off-chain service maintaining private revocation-tree data and paths. It is an availability service, not an authority. |

Issuer authorization and credential revocation are separate. A registered issuer may have both revoked and unrevoked credentials. Revoking one credential does not modify issuer-registry state or another credential.

## 6. Primitive Types and Constants

| Value | Compact type or value |
| --- | --- |
| Protocol version | `Uint<16>` |
| Protocol version value | `1` |
| Issuance nonce | `Bytes<32>` |
| Credential ID | `Bytes<32>` |
| Credential commitment | `Bytes<32>` |
| Issuer ID | `Bytes<32>` |
| Issuer verification key | `Secp256k1Point` |
| Credential signature | `Secp256k1EcdsaSignature` |
| Revocation signature | `Secp256k1EcdsaSignature` |
| Credential and revocation index | `Uint<32>` |
| Revocation root, leaf, node, or sibling | `Bytes<32>` |
| Revocation authentication path | `Vector<16, Bytes<32>>` |
| Tree depth | `16` |
| Tree capacity | `65,536` |
| Registry contract | `ContractAddress` |
| Registry context | `Bytes<32>` |

Indices use `Uint<32>` so the surrounding registry can represent both valid indices `0..65,535` and the full-tree counter sentinel `65,536`.

All byte strings in application storage or transport MUST use a documented encoding. Lowercase hexadecimal without a `0x` prefix is RECOMMENDED. Transport encoding MUST NOT change the Compact value entering a hash or signature circuit.

## 7. Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose | UTF-8 label | `Bytes<32>` hexadecimal |
| --- | --- | --- |
| Empty revocation leaf | `JP:REVOCATION:EMPTY:V1` | `ab6b939fe6f80e9b6fdf836cbd14becb49e1c743b739597ec3d89e8abfff0d66` |
| Revoked credential leaf | `JP:REVOCATION:REVOKED:V1` | `e8619ec6bc693ad50f00e5dacc6b7b32f58d343b78609c27caf3774504bf6371` |
| Revocation authorization | `JP:REVOCATION:AUTHORIZATION:V1` | `df04900884c49e6c7917d37ddb0b163fba730acce4119bd3efa9885819bb8f6a` |
| Shared Merkle node | `JP:MERKLE:NODE:V1` | `ac80b146f1c63367493a75e4184b1125ebcb768858d1cbf71d9b0adb9a171e86` |

Implementations MUST embed or deterministically reproduce the exact 32-byte values. They MUST NOT pass the variable-length labels directly where a `Bytes<32>` domain field is required.

The displayed labels define domain constants only. A typed `persistentHash` is not equivalent to hashing a delimiter-based concatenation of the displayed fields.

## 8. Revocation Semantics

The only V1 revocation transition is:

```text
NOT_REVOKED -> REVOKED
```

The transition is:

- credential-specific
- issuer-authorized
- effective in current state
- irreversible
- non-repeatable; and
- independent of credential expiration and issuer registration

The contract MUST reject:

```text
REVOKED -> NOT_REVOKED
REVOKED -> REVOKED
```

The second revocation attempt is rejected rather than treated as an idempotent success. No exported circuit may reset or overwrite a revoked position.

## 9. Current-State Effect and No Timestamp

V1 does not include `revokedAt` in a credential, revoked leaf, authorization message, public input, or validity rule.

A revocation becomes effective when the state transition containing the new `revocationRoot` becomes authoritative ledger state. Every later current-state verification MUST use that root or a later current root and reject the revoked credential.

Transaction ordering, block metadata, indexer timestamps, and application timestamps MAY be retained as operational metadata. They are not V1 cryptographic fields and MUST NOT support claims such as:

> The credential was valid at historical time T.

V1 does not support future-effective or scheduled revocation, backdated revocation, grace periods, historical validity, or arbitrary verifier-supplied revocation time.

Credential issuance and expiration continue to use the current block-time semantics frozen in `01-credential.md`. Revocation itself requires no block-time circuit.

## 10. Credential and Revocation Index Relationship

The revocation tree has the same depth and capacity as the V1 credential registry:

```text
depth    = 16
capacity = 2^16 = 65,536 positions
```

For every registered credential:

```text
revocationIndex == credentialIndex
```

There is no separate revocation identifier, insertion order, next-revocation counter, or revocation index assignment.

Credential registration at index `i` does not update the revocation root. Every unused or newly allocated position already contains the canonical empty revocation leaf.

A revocation or non-revocation proof MUST establish:

```text
credentialIndex < nextCredentialIndex
credentialIndex < 65,536
```

and MUST use the same index for credential membership and revocation state.

## 11. Empty Revocation Leaf

The normative input is:

```text
RevocationEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}
```

The field order is normative. Construction is:

```text
emptyRevocationLeaf =
    persistentHash<RevocationEmptyLeafInputV1>({
        domain: DOMAIN_REVOCATION_EMPTY_V1,
        protocolVersion: 1
    })
```

`emptyRevocationLeaf` represents `NOT_REVOKED`. It MUST NOT be replaced by `default<Bytes<32>>`, an all-zero leaf, a missing map entry, or an application Boolean.

An empty leaf at an unregistered index has no validity meaning. Non-revocation is established only when credential membership proves that the same index contains a registered credential.

## 12. Revoked Credential Leaf

The normative input is:

```text
RevokedCredentialLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

The field order is normative. Construction is:

```text
revokedCredentialLeaf =
    persistentHash<RevokedCredentialLeafInputV1>({
        domain: DOMAIN_REVOCATION_REVOKED_V1,
        protocolVersion: 1,
        credentialId,
        credentialCommitment
    })
```

The revoked leaf binds the same credential ID and commitment authenticated by the credential registry and original issuer signature.

The leaf contains no issuer ID, credential index, timestamp, reason, status enum, issuer signature, revocation signature, holder secret, credential opening, or private statement.

Binding the high-entropy credential ID and hiding commitment into the leaf avoids a globally constant revoked leaf and reduces trivial enumeration of the changed position from public root transitions. It does not make `persistentHash` a general-purpose hiding commitment.

## 13. Merkle Node and Empty Root

Revocation internal nodes use the shared V1 construction frozen in `02-issuer-registry.md`:

```text
MerkleNodeInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    left: Bytes<32>
    right: Bytes<32>
}
```

```text
merkleNodeV1(left, right) =
    persistentHash<MerkleNodeInputV1>({
        domain: DOMAIN_MERKLE_NODE_V1,
        protocolVersion: 1,
        left,
        right
    })
```

Left and right order is significant. Children MUST NOT be sorted.

The initial empty-tree values are:

```text
emptyRevocationNode[0] = emptyRevocationLeaf

for level in 0..15:
    emptyRevocationNode[level + 1] =
        merkleNodeV1(
            emptyRevocationNode[level],
            emptyRevocationNode[level]
        )

initialRevocationRoot = emptyRevocationNode[16]
```

Every V1 deployment MUST initialize the revocation root to `initialRevocationRoot`, not an arbitrary zero value.

## 14. Revocation Authentication Path

The path type is:

```text
RevocationMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}
```

Siblings are ordered from leaf level to root level. Direction bits are derived from the credential index and MUST NOT be separately supplied.

For `index < 65,536`, root reconstruction is:

```text
node = leaf

for level in 0..15:
    sibling = siblings[level]
    bit = (index >> level) & 1

    if bit == 0:
        node = merkleNodeV1(node, sibling)
    else:
        node = merkleNodeV1(sibling, node)

return node
```

The least-significant index bit is used at the leaf level.

## 15. Authoritative Contract State

The V1 revocation ledger state is conceptually:

```compact
export ledger revocationRoot: Bytes<32>;
```

The constructor MUST set:

```text
revocationRoot = initialRevocationRoot
```

The contract MUST NOT expose a generic revocation-root setter, leaf deletion operation, reset operation, public revoked-ID set, mutable revocation record, or independent frontend revocation flag.

The current ledger `revocationRoot` is the sole revocation trust anchor. Off-chain tree data, cached roots, indexer state, frontend state, and API responses are not authoritative.

## 16. Revocation Authority

The revocation authority for a credential is the exact V1 issuer key that originally authenticated that credential.

The circuit MUST obtain the issuer ID and `Secp256k1Point` from an `IssuerRecordV1` authenticated against the current issuer root under `02-issuer-registry.md`.

No separate revocation key, registry-authority key, contract administrator, holder key, wallet address, frontend session, API credential, or path provider may authorize revocation.

The same entity may operationally control multiple issuer keys, but each revocation is authorized only under the key bound to the affected credential.

Because V1 issuer registration is append-only and has no deactivation, a registered issuer key remains a revocation authority for the life of the deployment. This is a deliberate V1 limitation.

## 17. Issuer Revocation Record

To revoke without holder cooperation, the issuer MUST retain a private operational record containing:

```text
IssuerRevocationRecordV1 {
    issuerId: Bytes<32>
    issuanceNonce: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialIndex: Uint<32>
    issuerSignature: Secp256k1EcdsaSignature
}
```

This record contains the minimum immutable values needed to bind the registered credential to its original issuer and authorize revocation without holder cooperation.

The issuer MUST retain the exact private `issuanceNonce` used to derive the credential ID. The revocation operation does not require the holder's `subjectSecret`, the credential opening, the complete credential statement, credential Merkle leaf preimage beyond its frozen ID/commitment fields, or holder participation.

The operational record and signing key MUST be stored securely. Loss of the record can prevent the issuer from constructing a revocation proof even while the credential remains provable by the holder.

## 18. Credential-ID and Original-Signature Binding

The revocation circuit MUST first rederive the credential ID using the exact construction frozen in `01-credential.md`:

```text
expectedCredentialId =
    persistentHash<CredentialIdInputV1>({
        domain: DOMAIN_CREDENTIAL_ID_V1,
        protocolVersion: 1,
        issuerId: issuerRecord.issuerId,
        issuanceNonce
    })
```

It MUST assert `expectedCredentialId == credentialId` before using that ID in a signature, leaf, authorization message, or root transition.

The revocation circuit MUST rederive the exact original issuer-signature message frozen in `01-credential.md`:

```text
IssuerSignatureMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
}
```

It MUST verify the retained `issuerSignature` under the verification key from the current authenticated issuer record:

```text
secp256k1EcdsaVerify(
    issuerSignatureMessage,
    issuerSignature,
    issuerRecord.verificationKey
) == true
```

Together, the nonce derivation and signature check prove that the credential ID belongs to the authenticated issuer's namespace and that the same registered issuer key authenticated the exact credential ID and commitment being revoked. The original signature alone is insufficient because a different registered issuer could sign a learned ID/commitment pair. Credential membership alone also does not identify the issuer. Both constraints are REQUIRED.

## 19. Revocation Authorization Message

The normative message input is:

```text
RevocationAuthorizationMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerId: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialIndex: Uint<32>
}
```

The field order is normative. Construction is:

```text
revocationAuthorizationMessage =
    persistentHash<RevocationAuthorizationMessageV1>({
        domain: DOMAIN_REVOCATION_AUTHORIZATION_V1,
        protocolVersion: 1,
        registryContract: kernel.self(),
        registryContext,
        issuerId: issuerRecord.issuerId,
        credentialId,
        credentialCommitment,
        credentialIndex
    })
```

The issuer signs this `Bytes<32>` digest with the private key corresponding to `issuerRecord.verificationKey`. The circuit MUST assert:

```text
secp256k1EcdsaVerify(
    revocationAuthorizationMessage,
    revocationAuthorizationSignature,
    issuerRecord.verificationKey
) == true
```

The contract address and unique `registryContext` bind authorization to one deployment. The credential ID, commitment, and index bind it to one registered credential position.

The message intentionally omits current roots. Monotonic empty-leaf verification makes replay against an already revoked position fail, while omitting roots prevents unrelated concurrent registry updates from invalidating a valid authorization.

The signature is a transferable authorization for this exact transition; any relayer MAY submit it with the required private witness data.

## 20. Revocation Circuit Inputs

The exported operation is conceptually:

```text
revokeCredentialV1(
    issuerRecord: IssuerRecordV1,
    issuerIndex: Uint<32>,
    issuerPath: Vector<16, Bytes<32>>,
    issuanceNonce: Bytes<32>,
    credentialId: Bytes<32>,
    credentialCommitment: Bytes<32>,
    credentialIndex: Uint<32>,
    issuerSignature: Secp256k1EcdsaSignature,
    credentialPath: Vector<16, Bytes<32>>,
    revocationPath: Vector<16, Bytes<32>>,
    revocationAuthorizationSignature: Secp256k1EcdsaSignature
) -> []
```

The implementation MAY use a structurally equivalent Compact interface, including witness-returned compound records, but MUST preserve every input constraint and state effect defined below.

All listed inputs are private by default. The circuit MUST NOT return or emit an issuance nonce, credential ID, commitment, index, issuer signature, revocation signature, or authentication path.

## 21. Revocation Checks and State Transition

For a revocation request, the circuit MUST:

1. assert `credentialIndex < nextCredentialIndex` and `credentialIndex < 65,536`
2. validate `issuerRecord` and authenticate its canonical issuer leaf at `issuerIndex` against the current issuer root
3. rederive `credentialId` from `issuerRecord.issuerId` and `issuanceNonce`, and require exact equality with the retained credential ID
4. derive the original issuer-signature message from that credential ID and `credentialCommitment`
5. verify `issuerSignature` under `issuerRecord.verificationKey`
6. derive the canonical credential leaf from the same `credentialId` and `credentialCommitment`
7. authenticate that credential leaf at `credentialIndex` against the current credential root
8. derive and verify the revocation-authorization message under the same issuer key
9. reconstruct a root from `emptyRevocationLeaf`, `credentialIndex`, and `revocationPath`
10. assert that the reconstructed root equals the current `revocationRoot`
11. derive `revokedCredentialLeaf` from the same credential ID and commitment
12. reconstruct `newRevocationRoot` from the revoked leaf, the same index, and the same path; and
13. atomically write `revocationRoot = newRevocationRoot`

No ledger write may occur if any assertion fails.

The transaction MUST leave unchanged:

- issuer root and next issuer index
- credential root and next credential index
- every issuer and credential leaf
- credential ID and commitment
- subject commitment and subject secret
- credential statement and opening
- original issuer signature; and
- every other revocation position

The implementation MUST NOT introduce a checkpoint that permits partial revocation state to commit.

## 22. Monotonicity and Duplicate Revocation

The old-root check begins from `emptyRevocationLeaf`. Therefore, a request can succeed only if the target position is currently unrevoked.

After success, the position contains `revokedCredentialLeaf`. A repeated request beginning from the empty leaf cannot reconstruct the current root and MUST fail.

V1 rejects duplicate revocation. It MUST NOT silently report a second request as a newly successful transition, replace the revoked leaf, modify a reason or timestamp, or reset the leaf to empty.

The only recovery from erroneous revocation is a new credential issuance with a new credential ID and index.

## 23. Private Non-Revocation Proof

A current V1 qualification proof MUST establish non-revocation by proving membership of `emptyRevocationLeaf` at the same private index used for credential membership.

The proof MUST constrain:

```text
credentialIndex < nextCredentialIndex

credentialRootFrom(
    credentialLeafV1(credentialId, credentialCommitment),
    credentialIndex,
    credentialPath
) == currentCredentialRoot

revocationRootFrom(
    emptyRevocationLeaf,
    credentialIndex,
    revocationPath
) == currentRevocationRoot
```

The credential ID, commitment, index, credential path, and revocation path MAY remain private. The two membership relations MUST use the exact same index and credential instance.

An empty revocation leaf without credential membership proves nothing about a credential. An unregistered position is empty by construction.

A revoked credential cannot authenticate the empty leaf against the current revocation root at its credential index.

## 24. Current Root and Proof Freshness

V1 accepts only the current authoritative revocation root.

A proof generated before a revocation may remain mathematically valid against the old root, but it MUST NOT satisfy a verification that requires current validity after the ledger root changes.

On-chain verification MUST constrain the proof to the contract's current `revocationRoot`. Off-chain verification MUST obtain the current root from authoritative contract state and reject a proof bound only to a stale or caller-supplied root.

If current revocation state cannot be obtained or safely interpreted, verification MUST fail closed. Unavailable or stale state MUST NOT be treated as `NOT_REVOKED`.

V1 defines no root-age tolerance, cached-root grace period, historical root allowlist, or proof lifetime independent of current state.

## 25. Privacy Boundary

The following values are authoritative public contract state:

- current revocation root;
- current credential root and next credential index; and
- current issuer root and the issuer-registry configuration required by other frozen specifications.

The following revocation values are private by default:

- issuance nonce
- credential ID and commitment
- credential and issuer indices
- issuer record within the proof
- original issuer signature
- revocation authorization signature
- credential, issuer, and revocation authentication paths
- revoked credential leaf; and
- the mapping from a revocation-root transition to a credential or holder

The root transition publicly reveals that revocation state changed and may reveal transaction-level timing or submitter metadata. It MUST NOT intentionally reveal the credential ID, commitment, index, issuer, holder, qualification, reason, or private statement.

V1 MUST NOT emit a credential-specific public revocation event. An implementation MAY emit a payload-free state-change event only if it adds operational value and does not disclose or index private data.

Because `persistentHash` is not a hiding commitment, privacy depends on the high-entropy credential ID and hiding credential commitment, the zero-knowledge proof boundary, and avoidance of auxiliary metadata leaks.

## 26. Revocation-State Availability

The root-only design requires an off-chain revocation-state provider to maintain the private revoked leaves and tree paths needed by issuers and holders.

The provider MUST:

- apply every successful root transition to its canonical tree replica
- retain the credential-bound revoked leaf privately
- serve current 16-sibling paths for credential indices
- verify that its reconstructed root equals the on-chain root
- maintain encrypted, tested backups sufficient to recover the tree; and
- avoid logging unnecessary credential or holder metadata

An incorrect path cannot create a false proof because the circuit checks the current root. The provider is therefore trusted for availability and privacy, not correctness.

If the provider loses the private tree data or fails to supply a current path, affected proofs MUST fail closed until the state is recovered. Public roots alone are not sufficient to reconstruct private leaves and paths.

Path requests can reveal a credential index to the provider. Production clients SHOULD use authenticated confidential transport, minimize retention, and keep proof generation within a holder-controlled or explicitly trusted environment.

## 27. Relationship to Credential and Commitment State

Revocation MUST NOT modify:

- `CredentialStatementV1`
- issuance nonce or credential ID
- subject secret or subject commitment
- credential opening or credential commitment
- issuer signature or signature message
- credential leaf, credential root, or credential index; or
- any human-readable presentation artifact

The credential commitment is opened and authenticated independently. The revocation tree adds current validity state at the corresponding index.

A credential may simultaneously satisfy:

```text
credential membership == true
issuer signature valid == true
revoked == true
```

Such a credential is authentic and registered but not currently valid.

## 28. Relationship to Issuer State

The issuer registry proves which verification key is authoritative for both the original credential signature and revocation authorization.

The same authenticated issuer record and key MUST verify both signatures. A registered issuer MUST NOT revoke a credential originally signed by another issuer key.

The registry-authority key defined in `02-issuer-registry.md` admits issuers but does not revoke credentials. Likewise, a frontend administrator or contract deployer has no implicit revocation power.

Issuer registration is not credential revocation, and credential revocation does not suspend or remove an issuer.

## 29. Expiration and Revocation

Expiration and revocation are independent current-validity conditions.

For current block time `T`, a credential must satisfy both:

```text
issuedAt <= T
AND
(expiresAt == 0 OR T < expiresAt)
```

and:

```text
emptyRevocationLeaf is authenticated at credentialIndex
against currentRevocationRoot
```

Expiration does not update the revocation tree. Revocation does not modify `issuedAt` or `expiresAt`.

An issuer MAY revoke an expired credential. The operation remains an irreversible current-state update, but the credential was already invalid under the expiration rule.

## 30. Reissuance After Revocation

If a credential is revoked in error or needs replacement, the issuer MUST issue a new credential instance.

The new issuance MUST use:

- a fresh issuance nonce and new credential ID
- a fresh subject secret and subject commitment
- a fresh credential opening and credential commitment
- a new issuer signature
- a new credential-registry index; and
- a new initially empty revocation position at that index

The revoked credential remains immutable and revoked. Its index and revoked leaf MUST NOT be reused.

## 31. Failure Conditions and Errors

Revocation MUST fail closed if any of the following holds:

- the credential index is outside `0..nextCredentialIndex - 1` or tree capacity
- the issuer record, issuer ID, key, index, path, or current issuer root is invalid
- the issuance nonce and authenticated issuer ID do not rederive the retained credential ID
- the original issuer signature does not verify under the registry-authenticated key
- the credential ID or commitment differs between the signature, leaf, and authorization message
- credential membership does not authenticate at the supplied index and current credential root
- the revocation authorization signature is invalid or belongs to another issuer
- the authorization names another contract or registry context
- the revocation path does not authenticate the empty leaf at the same index
- the credential is already revoked
- a domain, type, field order, or protocol version differs from V1
- state is stale or unavailable; or
- the root update cannot complete atomically

Qualification verification MUST fail if current non-revocation cannot be proved.

Applications MAY map failures to machine-readable categories such as:

```text
UNKNOWN_CREDENTIAL
UNAUTHORIZED_REVOCATION
INVALID_ORIGINAL_ISSUER_SIGNATURE
INVALID_CREDENTIAL_ID_BINDING
INVALID_REVOCATION_AUTHORIZATION
ALREADY_REVOKED
STALE_REGISTRY_STATE
REVOCATION_STATE_UNAVAILABLE
REVOKED_CREDENTIAL
```

Error messages MUST NOT reveal private credential values, paths, signatures, or whether a guessed private identifier was close to a valid value.

## 32. Security Properties and Limitations

Assuming the security of the frozen hashes, signatures, roots, and private-state handling, V1 provides:

- **Issuer-controlled invalidation:** only the original registered issuer key can authorize revocation
- **Original-issuer binding:** the authenticated issuer ID and retained issuance nonce must rederive the credential ID before either issuer signature can authorize the transition
- **Credential binding:** both signatures, credential membership, and the revoked leaf use the same credential ID and commitment
- **Position binding:** credential and revocation proofs use the same immutable index
- **Monotonicity:** the current root can transition only from the authenticated empty leaf to the credential-bound revoked leaf
- **Private non-revocation:** a holder can prove the current empty state without revealing the credential or index
- **Current-state invalidation:** a root update invalidates proofs that depend on the old non-revoked state; and
- **Credential immutability:** revocation leaves the original credential, commitment, signature, and membership unchanged

V1 assumes:

- issuers protect their signing keys and private revocation records
- the revocation-state provider preserves current private tree data and paths
- credential registration assigned the canonical immutable index
- verifiers use authoritative current roots; and
- Compact and TypeScript implementations match through cross-runtime vectors

V1 does not prevent:

- a dishonest issuer from revoking a legitimately earned credential
- a compromised issuer key from authorizing malicious revocations
- revocation timing or transaction metadata leakage
- denial of service by a path provider
- proof failure after loss of private tree state
- holder-to-issuer or holder-to-path-provider correlation outside the circuit; or
- a holder from retaining the immutable revoked credential as a historical artifact

Because V1 cannot deactivate an issuer key, issuer-key compromise requires deployment migration and operational response beyond this revocation protocol.

## 33. Non-Goals

V1 does not provide:

- holder-initiated, registry-authority, administrator, or third-party revocation
- issuer suspension or key rotation
- unrevocation, reinstatement, or leaf replacement
- scheduled, delayed, expiring, or backdated revocation
- revocation timestamps, reasons, evidence, or reason codes in cryptographic state
- historical revocation roots or verification at an arbitrary past time
- batch revocation or issuer-wide mass invalidation
- a public revoked-ID list or public credential-specific revocation event
- revocation by credential commitment alone without credential and issuer authentication
- removal from the credential registry; or
- recovery of lost issuer records, holder secrets, openings, or private path state

## 34. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. Revocation is credential-level, current-state, monotonic, and irreversible.
2. The revocation tree has depth 16 and exactly shares credential-registry indices.
3. Credential and revocation indices use `Uint<32>`.
4. The empty and revoked leaves use the exact frozen typed inputs and distinct domains.
5. Internal nodes use the exact shared ordered V1 node construction.
6. The initial root is derived from 65,536 canonical empty positions and is not arbitrary zero.
7. The current public `revocationRoot` is the sole revocation trust anchor.
8. V1 stores no protocol revocation timestamp, reason, or mutable status record.
9. The revocation authority is the registered issuer key that authenticated the original credential.
10. The authenticated issuer ID and retained private issuance nonce rederive the exact credential ID.
11. The original credential signature and new revocation authorization verify under the same authenticated key.
12. Revocation authorization binds the deployment, issuer ID, credential ID, credential commitment, and credential index.
13. The credential leaf authenticates the same credential ID and commitment at the same index.
14. The old revocation root authenticates the empty leaf at that index before update.
15. A successful operation replaces exactly that empty leaf with the credential-bound revoked leaf.
16. Revocation changes only the revocation root and commits atomically.
17. Duplicate revocation and every revoked-to-empty or revoked-to-revoked transition fail.
18. Non-revocation proves the empty leaf at the same index as a registered credential.
19. Qualification verification accepts only current authoritative revocation state.
20. Stale or unavailable revocation state never produces a valid current result.
21. Revocation does not require the holder's subject secret, credential opening, complete statement, or participation.
22. Revocation never mutates the issuance nonce, credential, commitment, issuer signature, or credential membership.
23. Credential-specific revocation values and paths remain private unless a later protocol version explicitly changes the boundary.
24. Reissuance uses a new credential ID, commitment, signature, and index.
25. Verification fails closed on every mismatched credential, issuer, nonce, index, path, root, signature, domain, or version.

## 35. Required Test Vectors and Tests

Before a V1 implementation is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- all four domain-tag constants
- empty revocation leaf
- revoked credential leaf for fixed credential ID and commitment values
- all 16 empty-node levels and `initialRevocationRoot`
- internal-node left/right ordering
- root reconstruction at index `0`
- root reconstruction at an index containing both zero and one bits
- credential ID rederivation from a fixed authenticated issuer ID and issuance nonce
- original issuer-signature message derivation and verification
- revocation-authorization message derivation and verification; and
- a complete empty-to-revoked root transition

The contract suite MUST test:

- constructor initialization to the exact empty root
- successful revocation of a registered unrevoked credential
- root change with issuer and credential roots and counters unchanged
- rejection of an out-of-range or unregistered credential index
- rejection of a wrong issuance nonce or issuer/nonce/credential-ID combination
- rejection of a wrong credential ID, commitment, leaf, index, path, or root
- rejection of a credential signature from another issuer
- rejection of revocation authorization from another issuer
- rejection of signatures for another contract or registry context
- rejection when the issuer-membership path is invalid or stale
- rejection when the credential-membership path is invalid or stale
- rejection when the revocation path is invalid or stale
- rejection of duplicate revocation
- rejection of every attempt to restore or replace a revoked leaf
- current non-revocation success before revocation
- current non-revocation failure after revocation
- continued non-revocation of unrelated credentials after path refresh
- failure of a proof generated against a stale pre-revocation root
- failure closed when current revocation state or paths are unavailable
- reissuance at a new credential index while the prior index remains revoked
- atomic rollback on every failed revocation path
- operation without the holder's subject secret, statement, credential opening, or participation; and
- absence of credential IDs, commitments, indices, signatures, paths, reasons, timestamps, and private statements from ledger fields, events, exported outputs, logs, analytics, URLs, and presentation artifacts

A changed cryptographic vector is a protocol change, not an ordinary regression update.

## 36. Specification Ownership and Dependencies

This document is authoritative for:

- revocation authority and authorization message
- revocation leaf and empty-tree construction
- revocation-tree depth, root, path, index binding, and state transition
- current-state non-revocation semantics
- duplicate revocation and reissuance behavior
- revocation privacy and availability boundaries; and
- revocation-specific conformance tests

`01-credential.md` is authoritative for credential identity, the credential statement, original issuer-signature message, current expiration semantics, and credential immutability.

`02-issuer-registry.md` is authoritative for issuer records, issuer-ID and leaf construction, registry context, issuer membership, and the registered secp256k1 key.

`03-commitments.md` is authoritative for credential-commitment opening, hiding, binding, privacy, and immutability. The revocation circuit does not need to open the commitment because the original issuer signature and credential leaf authenticate the exact commitment value.

`05-ledgers.md` MUST expose the exact current roots and counters required here and MUST NOT add an independent revocation authority or mutable revoked-ID store.

`06-merkle-tree.md` is authoritative for the credential-leaf construction and reusable path algorithm. It MUST use the same depth, index type, and internal-node construction frozen here and in `02-issuer-registry.md`.

`07-witnesses.md` MUST provide private issuer, credential, and revocation paths without treating provider output as authoritative.

`08-proofs.md` and `09-verification.md` MUST constrain qualification proofs to the current revocation root and fail closed on a stale, unavailable, or revoked state.

## 37. Final Protocol Principle

JustProof V1 revocation establishes:

> The registered issuer that originally authenticated this registered credential has irreversibly changed its current revocation position from unrevoked to revoked.

A current qualification proof must establish the opposite state for the same credential index:

> The canonical unrevoked leaf remains authenticated at this registered credential's position under the current revocation root.

Issuer membership, issuer signatures, credential membership, commitment opening, holder control, expiration, non-revocation, qualification constraints, and request binding remain separate proof obligations. Current validity requires all of them.
