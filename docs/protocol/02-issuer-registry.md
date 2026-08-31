# JustProof Issuer Registry Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.0`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the JustProof V1 issuer registry: issuer identity, issuer verification keys, registry authority, issuer registration, issuer-leaf construction, issuer-tree state, membership, and credential-to-issuer binding.

The issuer registry answers one question:

> Is this exact issuer identity and verification key authorized by the current JustProof deployment?

It does not establish that a credential exists, that a credential is unrevoked, that a holder controls a subject secret, or that a credential satisfies a requested qualification.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- issuer identifiers are derived from immutable secp256k1 verification keys
- issuer records contain no mutable status or metadata
- registry authority uses a distinct immutable secp256k1 verification key
- registration approvals are bound to a unique immutable deployment context
- registration requires both issuer proof of possession and registry-authority approval
- the issuer registry is permissioned, append-only, fixed-depth, and current-state only
- the issuer tree has depth 16 and capacity 65,536
- issuer indices and the next-index counter use `Uint<32>`
- duplicate issuer leaves are rejected using a public Compact `Set`
- issuer membership against the current root is the V1 authorization condition; and
- V1 has no issuer suspension, deactivation, deletion, key rotation, or historical authorization policy

Changing a field, field type, field order, domain tag, signature scheme, tree depth, leaf or node construction, authority model, state transition, or authorization meaning defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Baseline

The V1 contract implementation MUST begin with:

```compact
pragma language_version 0.23;
```

The implementation MUST import the required native types and circuits from `CompactStandardLibrary`.

V1 uses:

- `persistentHash<T>` for issuer identifiers, Merkle leaves, Merkle nodes, and signed-message digests
- `Secp256k1Point` for registry-authority and issuer verification keys
- `Secp256k1EcdsaSignature` for registry-authority, issuer-possession, and credential signatures
- `secp256k1EcdsaVerify` for in-circuit signature verification
- a sealed ledger field for the immutable registry-authority verification key; and
- `Set<Bytes<32>>` as the public duplicate-registration guard

Every call to `secp256k1EcdsaVerify` MUST receive a message digest derived and constrained in the same circuit. A caller-supplied digest is not sufficient.

Witness results and circuit arguments are untrusted inputs. Every private value that affects authorization MUST be constrained to authoritative ledger state or to a verified cryptographic construction.

## 5. Roles and Terms

| Term                        | Definition                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Registry authority**      | The operator whose sealed verification key authorizes new issuer registrations.                                                    |
| **Issuer**                  | An entity controlling a registered credential-signing key.                                                                         |
| **Issuer verification key** | The immutable secp256k1 public key bound to an issuer ID.                                                                          |
| **Issuer ID**               | The persistent typed hash of the issuer verification key under the V1 issuer-ID domain.                                            |
| **Issuer record**           | The fixed typed pair of issuer ID and verification key, plus the protocol version.                                                 |
| **Issuer leaf**             | The persistent typed hash of an issuer record under the V1 issuer-leaf domain.                                                     |
| **Issuer index**            | The immutable sequential position of an issuer leaf in the issuer tree.                                                            |
| **Issuer root**             | The authoritative current root of the V1 issuer tree.                                                                              |
| **Registration artifact**   | Off-chain availability data containing the issuer record, index, and transaction reference. It is not independently authoritative. |

The registry authority and an issuer are different protocol roles. Possession of the registry-authority key does not make that key a credential-issuance key, and possession of an issuer key does not permit registry updates.

## 6. Primitive Types and Constants

| Value                               | Compact type or value     |
| ----------------------------------- | ------------------------- |
| Protocol version                    | `Uint<16>`                |
| Protocol version value              | `1`                       |
| Issuer ID                           | `Bytes<32>`               |
| Issuer leaf                         | `Bytes<32>`               |
| Issuer root                         | `Bytes<32>`               |
| Merkle sibling or node              | `Bytes<32>`               |
| Issuer index                        | `Uint<32>`                |
| Next issuer index                   | `Uint<32>`                |
| Tree depth                          | `16`                      |
| Tree capacity                       | `65,536`                  |
| Issuer verification key             | `Secp256k1Point`          |
| Registry-authority verification key | `Secp256k1Point`          |
| Registry deployment context         | `Bytes<32>`               |
| Signature                           | `Secp256k1EcdsaSignature` |
| Registry deployment address         | `ContractAddress`         |
| Issuer authentication path          | `Vector<16, Bytes<32>>`   |

`nextIssuerIndex` MUST use `Uint<32>`, not `Uint<16>`. A depth-16 tree needs the full-tree sentinel value `65,536`, which does not fit in 16 bits.

All byte strings in application storage or transport MUST use a documented encoding. Lowercase hexadecimal without a `0x` prefix is RECOMMENDED. Transport encoding MUST NOT change the Compact value entering a typed construction.

## 7. Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose                     | UTF-8 label                 | `Bytes<32>` hexadecimal                                            |
| --------------------------- | --------------------------- | ------------------------------------------------------------------ |
| Issuer ID                   | `JP:ISSUER:ID:V1`           | `70b86c0aff6bc0b2a063e412ec2b436e404733c59436f1668abacec1edd031fd` |
| Issuer leaf                 | `JP:ISSUER:LEAF:V1`         | `03c97931b086ec930ada16f1a78acf56a1b8b93b54f530cea82fdc8754c8e660` |
| Empty issuer leaf           | `JP:ISSUER:EMPTY:V1`        | `dd1d80d66678bf2ae0791da8a964f49968c38ac362a60419cc0e920083a7df74` |
| Shared Merkle node          | `JP:MERKLE:NODE:V1`         | `ac80b146f1c63367493a75e4184b1125ebcb768858d1cbf71d9b0adb9a171e86` |
| Registry-authority approval | `JP:ISSUER:REGISTRATION:V1` | `03e60131de45805e5768a1f48c7c889425ff4d7a14a7ba5341a88af5a07975bc` |
| Issuer proof of possession  | `JP:ISSUER:POSSESSION:V1`   | `cabe659040ca5f9ae918a10a2086d76f853a14bdf70ccf349060119c3e465f97` |

Implementations MUST embed or deterministically reproduce the exact 32-byte values. They MUST NOT pass the variable-length labels directly where a `Bytes<32>` domain field is required.

The table defines domain constants only. A typed `persistentHash` is not equivalent to hashing a delimiter-based concatenation of the displayed fields.

## 8. Issuer Verification Key

Each V1 issuer has exactly one immutable secp256k1 verification key:

```text
verificationKey: Secp256k1Point
```

The corresponding signing key MUST remain under the issuer's control and MUST NOT be stored in contract ledger state, application logs, registration artifacts, or public metadata.

The verification key MUST NOT equal `default<Secp256k1Point>`. Registration MUST also verify a valid issuer-possession signature under the key. The contract MUST NOT rely on an off-chain claim that a point or signature is valid.

V1 credential signatures use this same registered verification key and the exact issuer-authentication construction frozen in `01-credential.md`. Ed25519 is not a JustProof V1 signature scheme and MUST NOT be substituted.

## 9. Issuer ID

The normative input is:

```text
IssuerIdInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    verificationKey: Secp256k1Point
}
```

The field order is normative. Construction is:

```text
issuerId =
    persistentHash<IssuerIdInputV1>({
        domain: DOMAIN_ISSUER_ID_V1,
        protocolVersion: 1,
        verificationKey
    })
```

An implementation MUST derive `issuerId` inside the circuit from the verification key. It MUST NOT accept an unconstrained caller-supplied issuer ID as authoritative.

The issuer ID MUST NOT depend on:

- a display name, organization name, URL, email address, logo, or metadata URI
- the registry authority
- the registry contract address
- an issuer index, root, transaction, or registration time; or
- credential, revocation, or presentation data

Because the issuer ID is key-derived, a different verification key produces a different issuer identity. Registering a new key is not V1 key rotation.

## 10. Issuer Record and Leaf

The authoritative record is:

```text
IssuerRecordV1 {
    protocolVersion: Uint<16>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

The field order is normative. It MUST satisfy:

```text
protocolVersion == 1
issuerId == persistentHash<IssuerIdInputV1>(...verificationKey...)
verificationKey != default<Secp256k1Point>
```

The normative leaf input is:

```text
IssuerLeafInputV1 {
    domain: Bytes<32>
    record: IssuerRecordV1
}
```

Construction is:

```text
issuerLeaf =
    persistentHash<IssuerLeafInputV1>({
        domain: DOMAIN_ISSUER_LEAF_V1,
        record
    })
```

No display name, metadata, registration timestamp, status, suspension flag, credential scope, revocation state, or Merkle position is part of the issuer record or issuer leaf.

## 11. Issuer-Tree Construction

The issuer registry uses a fixed-depth binary Merkle tree with:

```text
depth    = 16
capacity = 2^16 = 65,536 leaves
```

### 11.1 Empty issuer leaf

The normative input is:

```text
IssuerEmptyLeafInputV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
}
```

Construction is:

```text
emptyIssuerLeaf =
    persistentHash<IssuerEmptyLeafInputV1>({
        domain: DOMAIN_EMPTY_ISSUER_LEAF_V1,
        protocolVersion: 1
    })
```

An unused issuer position MUST contain `emptyIssuerLeaf`. It MUST NOT use an arbitrary all-zero value.

### 11.2 Internal node

The shared V1 internal-node input is:

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

Left and right order is significant. Children MUST NOT be sorted before hashing.

### 11.3 Empty-tree root

Define:

```text
emptyNode[0] = emptyIssuerLeaf

for level in 0..15:
    emptyNode[level + 1] =
        merkleNodeV1(emptyNode[level], emptyNode[level])

initialIssuerRoot = emptyNode[16]
```

Every conforming V1 deployment MUST initialize `issuerRoot` to `initialIssuerRoot`.

### 11.4 Authentication path

An issuer authentication path is:

```text
IssuerMerklePathV1 {
    siblings: Vector<16, Bytes<32>>
}
```

Siblings are ordered from leaf level to root level. Direction bits are not supplied; they are derived from the issuer index.

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

The Merkle-tree specification owns the reusable V1 path and internal-node definition. It MUST reproduce the exact definition frozen here for the issuer tree.

## 12. Authoritative Contract State

The V1 issuer-registry state is conceptually:

```compact
export sealed ledger registryAuthorityVerificationKey: Secp256k1Point;
export sealed ledger registryContext: Bytes<32>;
export ledger issuerRoot: Bytes<32>;
export ledger nextIssuerIndex: Uint<32>;
export ledger registeredIssuerLeaves: Set<Bytes<32>>;
```

The constructor MUST:

1. reject `default<Secp256k1Point>` as the registry-authority verification key
2. reject an all-zero `registryContext`
3. set the sealed authority key and sealed registry context exactly once
4. set `issuerRoot` to `initialIssuerRoot`
5. set `nextIssuerIndex` to `0`; and
6. leave `registeredIssuerLeaves` empty

`registryContext` MUST be a fresh 32-byte deployment identifier generated with a cryptographically secure random source before deployment. It is public configuration, not a secret. Reusing it across deployments is non-conforming.

`issuerRoot` is the authorization trust anchor. `registeredIssuerLeaves` is a public duplicate-registration guard; membership in that set alone MUST NOT be treated as issuer authorization.

The set contains issuer-leaf hashes, not issuer records or private keys. Insertion of an issuer leaf into this public state is an intentional disclosure boundary. An implementation MUST disclose only the leaf value required by the ledger operation, not a compound private registration object.

All state initialization and registration writes MUST follow Compact's normal atomic contract-call semantics. The implementation MUST NOT introduce a checkpoint that permits a partial registration to commit.

## 13. Registry Authority

V1 issuer registration is permissioned. Only an approval that verifies under the sealed `registryAuthorityVerificationKey` can authorize a registration.

The authority key MUST be distinct from every credential-issuer key controlled by the same deployment operator. This preserves separation between the power to admit issuers and the power to sign credentials.

The authority key is immutable in V1. There is no authority-key rotation, recovery, delegation, threshold approval, or governance mechanism. A deployment whose authority signing key is lost can no longer register issuers. A deployment whose authority signing key is compromised cannot safely continue as a V1 trust anchor.

The authority signature is a transferable authorization for one exact state transition; it is not caller-identity authentication. Any transaction submitter MAY relay a valid approved registration.

## 14. Issuer Proof of Possession

Before registration, the proposed issuer MUST prove control of the private signing key corresponding to `verificationKey`.

The normative message input is:

```text
IssuerPossessionMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

The field order is normative. Construction is:

```text
issuerPossessionMessage =
    persistentHash<IssuerPossessionMessageV1>({
        domain: DOMAIN_ISSUER_POSSESSION_V1,
        protocolVersion: 1,
        registryContract: kernel.self(),
        registryContext,
        issuerId,
        verificationKey
    })
```

The issuer signs this `Bytes<32>` digest with its proposed issuer signing key. Registration MUST assert:

```text
secp256k1EcdsaVerify(
    issuerPossessionMessage,
    issuerPossessionSignature,
    verificationKey
) == true
```

This signature proves key possession for this registry deployment. It is not a credential signature, registry-authority approval, or authorization to modify a registered issuer.

## 15. Registry-Authority Approval

The registry authority approves an issuer registration against one exact current registry state.

The normative message input is:

```text
IssuerRegistrationMessageV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    currentIssuerRoot: Bytes<32>
    issuerIndex: Uint<32>
    issuerId: Bytes<32>
    verificationKey: Secp256k1Point
}
```

The field order is normative. Construction is:

```text
issuerRegistrationMessage =
    persistentHash<IssuerRegistrationMessageV1>({
        domain: DOMAIN_ISSUER_REGISTRATION_V1,
        protocolVersion: 1,
        registryContract: kernel.self(),
        registryContext,
        currentIssuerRoot: issuerRoot,
        issuerIndex: nextIssuerIndex,
        issuerId,
        verificationKey
    })
```

The authority signs this `Bytes<32>` digest with the private key corresponding to `registryAuthorityVerificationKey`. Registration MUST assert:

```text
secp256k1EcdsaVerify(
    issuerRegistrationMessage,
    registryAuthoritySignature,
    registryAuthorityVerificationKey
) == true
```

Binding the approval to the contract address, unique registry context, current root, and next index prevents the approval from authorizing a different deployment or a later registry state. Once any successful registration advances the root and counter, a stale approval MUST fail.

## 16. Registration Circuit and State Transition

The normative exported operation is conceptually:

```text
registerIssuerV1(
    verificationKey: Secp256k1Point,
    issuerPossessionSignature: Secp256k1EcdsaSignature,
    registryAuthoritySignature: Secp256k1EcdsaSignature,
    insertionPath: Vector<16, Bytes<32>>
) -> Uint<32>
```

The implementation MAY use a structurally equivalent Compact interface, but it MUST preserve every input constraint and state effect below.

For a current state with `i = nextIssuerIndex`, the circuit MUST:

1. assert `i < 65,536`
2. assert `verificationKey != default<Secp256k1Point>`
3. derive `issuerId`, `IssuerRecordV1`, and `issuerLeaf` in-circuit
4. intentionally disclose `issuerLeaf` for the duplicate guard and assert that `registeredIssuerLeaves` does not contain it
5. reconstruct a root from `emptyIssuerLeaf`, `i`, and `insertionPath`, then assert that it equals the current `issuerRoot`
6. derive and verify the issuer-possession message and signature
7. derive and verify the registry-authority message and signature against the sealed authority key
8. reconstruct `newIssuerRoot` from `issuerLeaf`, `i`, and the same insertion path
9. atomically write `issuerRoot = newIssuerRoot`
10. atomically insert `issuerLeaf` into `registeredIssuerLeaves`
11. atomically write `nextIssuerIndex = i + 1`; and
12. return `i` as the immutable issuer index

No state write may occur if any assertion fails.

Verifying the path for `emptyIssuerLeaf` before replacement proves that the circuit updates the next empty position rather than overwriting a registered leaf. Reusing the same path for the new leaf proves that the new root differs only at that position.

The registration request MUST NOT accept status, metadata, a caller-selected issuer ID, a caller-selected index, a caller-selected current root, or a replacement leaf.

## 17. Uniqueness and Capacity

The first issuer is registered at index `0`. Every successful registration consumes exactly one index. Issuer indices are immutable, sequential, never reused, and are not issuer identities.

The invariant is:

```text
0 <= nextIssuerIndex <= 65,536
```

Registration is allowed only when:

```text
nextIssuerIndex < 65,536
```

After the final available position, index `65,535`, is registered:

```text
nextIssuerIndex == 65,536
```

and every later registration MUST fail.

`registeredIssuerLeaves` MUST reject a second insertion of the same issuer leaf, even if a new authority signature is supplied. Because `issuerId` and `issuerLeaf` are both deterministically bound to the verification key, the same V1 issuer identity cannot be conformingly registered twice.

The duplicate set and issuer tree MUST be updated together. A state in which one contains a successfully registered leaf and the other does not is invalid.

## 18. Authorization State and Lifecycle

The only V1 issuer transition is:

```text
UNREGISTERED -> REGISTERED
```

There is no `ACTIVE` field. In V1, an issuer is authorized exactly when its canonical issuer leaf is a member of the current issuer root.

V1 does not support:

```text
REGISTERED -> SUSPENDED
REGISTERED -> DEACTIVATED
REGISTERED -> UNREGISTERED
REGISTERED(key1) -> REGISTERED(key2)
```

Registered leaves MUST NOT be modified or deleted. Append-only registration means a registered issuer remains authorized for the life of that V1 deployment.

If an issuer key is lost or compromised, V1 cannot deactivate it. Credential-level revocation MAY invalidate individual credentials, but it does not remove issuer authorization. Production use requiring issuer incident response needs a later protocol version or a controlled migration to a new deployment.

V1 verification uses the current issuer root only. Historical roots, authorization-at-issuance rules, and arbitrary historical-state verification are outside scope.

## 19. Issuer Membership

The private issuer-membership witness is conceptually:

```text
IssuerMembershipWitnessV1 {
    record: IssuerRecordV1
    issuerIndex: Uint<32>
    path: IssuerMerklePathV1
}
```

To establish current issuer authorization, a proof circuit MUST:

1. assert `record.protocolVersion == 1`
2. rederive `record.issuerId` from `record.verificationKey`
3. derive the canonical issuer leaf from the record
4. assert `issuerIndex < nextIssuerIndex` and `issuerIndex < 65,536`
5. reconstruct the root from the leaf, index, and path; and
6. assert that the reconstructed root equals the authoritative current `issuerRoot`

The issuer record, index, and path MAY remain private in a qualification proof. The verifier need not receive them when the public proof statement does not disclose issuer identity.

Membership in `registeredIssuerLeaves` alone is insufficient. A prover MUST authenticate the issuer record against `issuerRoot`.

Because the root changes after later registrations, clients MAY need to refresh an issuer path. The issuer record, issuer ID, verification key, leaf, and index do not change.

## 20. Credential-to-Issuer Binding

A credential's `issuerId` identifies an issuer but is not proof that the issuer is registered.

The qualification-proof circuit defined across the JustProof V1 specifications MUST jointly constrain:

```text
credential.statement.issuerId == issuerRecord.issuerId

issuerRecord.issuerId ==
    deriveIssuerId(issuerRecord.verificationKey)

deriveIssuerLeaf(issuerRecord) is a member of current issuerRoot

secp256k1EcdsaVerify(
    credentialSignatureMessage,
    issuerSignature,
    issuerRecord.verificationKey
) == true
```

The credential signature message and signature verification MUST use the exact construction frozen in `01-credential.md`.

The protocol MUST reject attempts to combine:

- one issuer's ID with another issuer's verification key
- one issuer's leaf with another issuer's Merkle path
- an authority signature with no issuer proof of possession
- a valid signature under an unregistered key; or
- a registered issuer with an unrelated credential signature

Issuer authorization and credential registration remain separate. An authorized issuer record does not establish that any particular credential is present in the credential registry.

## 21. Registry Availability and Metadata

The contract root is authoritative, but clients need availability data to construct membership paths. After registration, the registry operator MUST publish a registration artifact containing at least:

```text
IssuerRegistrationArtifactV1 {
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerIndex: Uint<32>
    record: IssuerRecordV1
    issuerLeaf: Bytes<32>
}
```

The transport artifact SHOULD also identify the registration transaction using the canonical reference exposed by the applicable Midnight SDK. That operational reference is not a cryptographic field and does not enter an issuer ID, leaf, root, or signed message.

The artifact is not authoritative by itself. A client MUST rederive the issuer ID and leaf and authenticate the leaf against the current issuer root.

Registry mirrors, indexers, proof servers, and path providers are untrusted availability services. Incorrect data from them MUST cause proof construction or verification to fail, not produce false authorization.

Human-readable metadata MAY include:

- display name
- description
- website
- logo; and
- contact or metadata URI

Metadata MUST remain outside `IssuerRecordV1`, issuer-ID derivation, issuer-leaf derivation, registry-authority approval, and credential verification. A logo, domain name, display name, or external metadata signature MUST NOT substitute for issuer membership.

## 22. Public and Private Boundary

The following values are authoritative public contract state:

- registry-authority verification key
- registry context
- issuer root
- next issuer index; and
- the public set of registered issuer-leaf hashes

The following values are public protocol information but need not be stored as standalone ledger fields:

- registered issuer IDs
- registered issuer verification keys
- issuer records and immutable indices
- registration artifacts; and
- display metadata

The following MUST remain private:

- registry-authority private signing key
- issuer private signing keys; and
- any unpublished registration signatures or operational key-management material

An issuer record being public does not reveal which issuer signed a holder's credential when the qualification proof keeps the credential issuer ID and issuer-membership witness private.

Transaction arguments, disclosed values, circuit returns, emitted events, and public ledger fields are public. Implementations MUST use `disclose` only for intentionally public derived values and MUST NOT disclose a private signing key, compound credential, or Merkle authentication path.

## 23. Failure Conditions

Registration MUST fail closed if any of the following holds:

- the tree is full
- the proposed verification key is the default secp256k1 point
- issuer proof of possession is invalid
- registry-authority approval is invalid
- a signature is bound to another contract deployment
- a signature is bound to another registry context
- the authority approval names a stale root or index
- the insertion path does not authenticate an empty leaf at `nextIssuerIndex`
- the issuer leaf is already present in the duplicate set
- a typed field, protocol version, or domain tag differs from V1; or
- any state update cannot complete atomically

Issuer authorization MUST fail closed if any of the following holds:

- the issuer ID is not correctly derived from the verification key
- the issuer record or leaf is malformed
- the issuer index is outside the registered range
- the Merkle path does not reconstruct the current issuer root
- a stale root is supplied where current authorization is required
- the credential issuer ID differs from the registered issuer ID; or
- the credential signature does not verify under the registry-authenticated key

An unknown issuer is unauthorized. A valid signature under an unknown key remains an arbitrary signed artifact, not an authorized JustProof credential.

## 24. Security Properties and Limitations

Assuming the security of the Compact primitives and correct key management, V1 provides:

- **Key-bound identity:** an issuer ID is deterministically bound to one verification key
- **Issuer key possession:** registration proves control of the proposed issuer key
- **Permissioned admission:** registration requires approval under the sealed authority key
- **Deployment and state binding:** approvals cannot be replayed into another contract, registry context, or later root/index state
- **Append-only integrity:** registration replaces only the next authenticated empty position
- **Duplicate rejection:** the same canonical issuer leaf cannot be registered twice
- **Root-authenticated authorization:** a private issuer record can be verified against public current state; and
- **Role separation:** issuer signatures, authority approvals, credential membership, and credential revocation establish different properties

V1 assumes:

- the registry authority validates the real-world organization before approving it
- the registry authority and issuers protect their private keys
- issuer and authority signatures are produced over the exact Compact-derived digests
- registration artifacts and fresh paths remain available; and
- Compact and TypeScript implementations match through cross-runtime vectors

V1 does not prove that a registered issuer is honest or that its real-world claims are true. The registry authority can authorize any key, and a compromised authority key can authorize malicious issuers.

V1 intentionally has no issuer incident-response transition. This limitation is acceptable only for the frozen demonstration scope. A production governance design SHOULD introduce separately specified authority recovery, issuer deactivation, key rotation, and historical-policy semantics in a new protocol version.

## 25. Non-Goals

V1 does not provide:

- permissionless or decentralized issuer admission
- on-chain governance or multisignature authority
- registry-authority key rotation or recovery
- issuer status, suspension, deactivation, deletion, or key rotation
- per-issuer qualification scopes or schemas
- issuer-level revocation as a substitute for credential revocation
- historical issuer-authorization proofs
- legal identity validation of an issuer
- trust in human-readable metadata
- storage of issuer private keys; or
- proof that a credential exists merely because its issuer is registered

## 26. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. The Compact language, toolchain, and runtime baseline matches the frozen header.
2. Every issuer verification key and registry-authority verification key uses `Secp256k1Point`.
3. Every issuer ID, leaf, empty leaf, node, and signed digest uses the exact frozen typed input and domain tag.
4. An issuer ID is rederived in-circuit from its verification key.
5. The default secp256k1 point cannot be registered or installed as the authority key.
6. Registration verifies issuer proof of possession under the proposed issuer key.
7. Registration verifies authority approval under the sealed registry-authority key.
8. Issuer proof of possession binds the contract address, registry context, issuer ID, and issuer key.
9. Authority approval binds the contract address, registry context, current root, next index, issuer ID, and issuer key.
10. Registry-authority and issuer signing keys are distinct protocol keys.
11. `registryContext` is nonzero, unique to the deployment, public, and immutable.
12. The issuer tree has depth 16 and a capacity of 65,536 leaves.
13. Issuer indices and `nextIssuerIndex` use `Uint<32>`.
14. The initial root is derived from the domain-separated empty issuer leaf, not an arbitrary zero value.
15. Merkle siblings are ordered leaf-to-root, and direction derives from least-significant index bits.
16. Registration authenticates an empty leaf at `nextIssuerIndex` before replacing it.
17. Every successful registration appends exactly one leaf and increments the counter exactly once.
18. No registered leaf is modified, deleted, or reused.
19. Duplicate issuer leaves are rejected by public supporting state.
20. Root, counter, and duplicate-set updates are atomic.
21. Current issuer-root membership, not a status field or duplicate-set lookup, establishes V1 authorization.
22. A qualification proof uses the same issuer ID and verification key for issuer membership and credential-signature verification.
23. An issuer signature alone does not establish issuer authorization.
24. Issuer authorization alone does not establish credential registration or validity.
25. Issuer metadata does not affect cryptographic authorization.
26. Private signing keys never enter public ledger state, logs, events, or registration artifacts.
27. Verification fails closed on malformed, stale, unknown, mismatched, or unauthenticated issuer data.

## 27. Required Test Vectors and Tests

Before a V1 implementation is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- all six domain-tag constants
- issuer-ID derivation from a fixed secp256k1 point
- issuer-record and issuer-leaf derivation
- empty issuer leaf
- all 16 empty-node levels and `initialIssuerRoot`
- internal-node left/right ordering
- issuer-possession message derivation and verification
- registry-authority message derivation and verification
- a registration root transition at index `0`
- a registration root transition whose index contains both zero and one bits; and
- current issuer-membership verification

The contract suite MUST test:

- constructor initialization and rejection of the default authority point or zero registry context
- successful founding-issuer registration at index `0`
- sequential registration and exact counter increments
- rejection of unauthorized authority signatures
- rejection of issuer-possession signatures from another key
- rejection of mismatched issuer IDs and keys
- rejection of another contract's signatures
- rejection of another registry context's signatures
- rejection of stale-root and stale-index authority approvals
- rejection of an incorrect empty-leaf insertion path
- rejection of duplicate issuer leaves
- rejection when `nextIssuerIndex == 65,536`
- preservation of all earlier leaves after an append
- membership success under the current root
- failure for a wrong record, key, index, sibling, direction, or root
- failure for an unregistered issuer with a valid credential signature
- failure when a credential issuer ID and membership record differ
- failure when a credential signature uses another issuer key
- path refresh after later issuer registrations
- atomic rollback of root, counter, and duplicate-set state on every failure path; and
- absence of private signing keys and authentication paths from public outputs, ledger fields, logs, events, and analytics

A changed cryptographic vector is a protocol change, not an ordinary regression update.

## 28. Specification Ownership and Dependencies

This document is authoritative for:

- issuer verification-key type
- issuer-ID construction
- `IssuerRecordV1` and issuer-leaf construction
- registry-authority key and approval message
- registry-context construction and binding
- issuer proof-of-possession message
- issuer tree depth, capacity, empty leaf, root, index, and registration transition
- duplicate-registration handling
- issuer lifecycle and authorization semantics; and
- issuer membership requirements

`01-credential.md` is authoritative for the credential statement, credential commitment, issuer credential-signature message, and credential validity rules.

`06-merkle-tree.md` is authoritative for the reusable V1 internal-node and path algorithms, but MUST match the exact issuer-tree dependency frozen here.

`07-witnesses.md` is authoritative for witness-provider interfaces and path retrieval, but witness data MUST remain untrusted and constrained by this specification.

`08-proofs.md` and `09-verification.md` are authoritative for proof statements and verifier results, but MUST require the issuer binding defined here whenever issuer authorization is part of a V1 qualification proof.

The revocation specification MUST use the same registered secp256k1 issuer key for any issuer-authorized V1 revocation message. It MUST NOT retain the draft Ed25519 key type.

## 29. Founding Issuer

The JustProof V1 demonstration deployment MUST register its founding issuer as the first successful registration at index `0`.

The recommended presentation name is:

```text
JustProof Demonstration Certification Authority
```

It issues the demonstration qualification frozen in `01-credential.md`:

```text
JustProof Midnight Builder Demonstration Credential
```

The display name is metadata, not the cryptographic issuer identity. The deployment-specific issuer verification key determines the founding `issuerId`.

The founding issuer key MUST be distinct from the registry-authority key. A deployment manifest MUST publish the network, registry contract address, registry context, registry-authority verification key, founding issuer verification key, derived issuer ID, issuer index, issuer leaf, post-registration root, protocol revision, and Compact toolchain versions.

The project MUST NOT present this founding issuer or demonstration qualification as Midnight Academy, as an official Midnight certification, or as evidence that JustProof represents Midnight Academy.

## 30. Final Protocol Principle

The V1 trust chain is:

```text
sealed registry-authority key
    -> approves one issuer registration

issuer proof of possession
    -> proves control of the proposed issuer key

current issuer root
    -> authenticates the issuer record and key

issuer credential signature
    -> authenticates one credential ID and commitment

credential and revocation roots
    -> establish registration and current non-revocation

qualification proof
    -> establishes the verifier's requested statement
```

No arrow may be skipped or treated as equivalent to another.
