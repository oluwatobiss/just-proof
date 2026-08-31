# JustProof Witness Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the JustProof V1 private-state and witness boundary used to supply credential, issuer, signature, commitment-opening, Merkle-path, and revocation material to Compact circuits.

It freezes:

- the semantic witness records for issuer registration, credential registration, credential revocation, and current qualification proof
- the separation between immutable private credential material and refreshable registry paths
- the relationship between Compact witness callbacks, private exported-circuit arguments, and authoritative ledger state
- the required binding and validation of all witness-returned data
- TypeScript witness-provider behavior under Compact runtime `0.16.0`; and
- witness privacy, lifecycle, failure, and conformance requirements

A witness provides private candidate data. It is never proof of correctness or authority by itself.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

JustProof V1 freezes the following witness decisions:

- Compact witnesses are untrusted callbacks implemented by the DApp's TypeScript driver
- private circuit arguments and witness results are private in Compact unless intentionally disclosed
- persistent holder or issuer state SHOULD be read through witnesses, while operation-supplied private data MAY be passed as private circuit arguments
- the semantic operation records in this document are normative even when an implementation partitions them across several callbacks or private arguments
- all credential-proof material binds to one exact credential instance
- the revocation witness includes the issuer-retained private issuance nonce needed to bind the credential ID to the authenticated issuer
- `subjectSecret` and `credentialOpening` are mandatory private openings, not optional salts
- qualification V1 has no independent claim witness, temporal witness, request-binding witness, direction witness, root witness, or counter witness
- all three Merkle paths contain exactly 16 `Bytes<32>` siblings ordered leaf-to-root
- issuer, credential, and revocation path directions derive in-circuit from range-constrained indices
- current roots, counters, registry configuration, and block time come from authoritative ledger or protocol state rather than witnesses
- no issuer, registry-authority, wallet, or holder signing key enters a proof witness merely to verify a signature; and
- witness-provider checks improve reliability but never replace circuit constraints

Changing the semantic content of an operation witness, its credential-binding rules, its public/private classification, or its authority relationship requires a new protocol version. Splitting one normative record into multiple typed callbacks or private circuit arguments does not change the protocol when every field and constraint remains equivalent.

## 4. Compact V1 Baseline

The contract implementation MUST begin with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

Under the pinned runtime, a Compact witness declaration has no Compact body. Its implementation is provided by TypeScript.

Conceptually:

```compact
witness qualificationWitness(): QualificationWitnessV1;
```

The generated TypeScript implementation receives a `WitnessContext<Ledger, PS>` and returns:

```text
[updatedPrivateState, witnessValue]
```

where `PS` is the DApp's local private-state type.

The compiler-generated `Witnesses<PS>` type is authoritative for the concrete JavaScript and TypeScript ABI. Implementations MUST compile against the generated type rather than maintaining a handwritten incompatible copy.

## 5. Witness Trust Model

Any prover can instantiate the generated contract with any function-valued witness implementation matching the ABI. A witness callback may therefore return malformed, stale, inconsistent, adversarial, or fabricated values.

A circuit MUST treat every witness result exactly like untrusted prover input.

The circuit, not the witness provider, MUST enforce every security-critical relation, including:

- protocol-version and schema constants
- credential-ID derivation
- subject-commitment opening
- credential-commitment opening
- issuer-record derivation and key validity
- issuer-signature verification
- registry-authority or revocation-authorization signature verification
- credential, issuer, empty, and revoked leaf derivation
- index ranges and index equality
- path length, order, and index-derived directions
- current-root equality
- qualification and temporal conditions; and
- request or challenge binding defined by the proof specification

An honest TypeScript implementation is an availability and usability component, not part of the cryptographic trust base.

## 6. Witnesses Versus Private Circuit Arguments

Compact permits private data to enter a circuit either through:

1. a declared witness callback; or
2. an argument of an internal or exported circuit.

Both are private by default in Compact's circuit model. Their operational roles differ:

| Source | V1 use |
| --- | --- |
| Witness callback | Read or update contract-scoped local private state, select a stored credential, or obtain a coherent private-state snapshot. |
| Private circuit argument | Supply transient operation data already held by the caller, such as a newly received signature or path. |
| Ledger read | Obtain authoritative current roots, counters, duplicate sets, registry context, and registry-authority key. |
| Standard-library time circuit | Enforce current block-time conditions. |

The semantic records in Sections 16–19 are normative. A conforming implementation MAY:

- return one complete record from one witness callback
- return typed subrecords from several witness callbacks
- accept some or all fields as private circuit arguments; or
- combine those approaches

It MUST NOT omit a field, duplicate a value without proving equality, weaken a constraint, turn a current ledger value into a witness, or expose private data while changing the partition.

## 7. Primitive Types and Shared Records

The witness layer uses the frozen types from Specifications 01–06:

| Value | Compact type |
| --- | --- |
| Protocol version | `Uint<16>` |
| Credential, issuer, commitment, leaf, root, or sibling digest | `Bytes<32>` |
| Issuer or credential index | `Uint<32>` |
| Timestamp | `Uint<64>` |
| Issuer verification key | `Secp256k1Point` |
| Protocol signature | `Secp256k1EcdsaSignature` |
| Authentication or insertion path | `Vector<16, Bytes<32>>` |

The witness layer reuses without alteration:

- `CredentialStatementV1`
- `PrivateCredentialPackageV1`
- `IssuerRecordV1`
- `IssuerMerklePathV1`
- `CredentialMerklePathV1`; and
- `RevocationMerklePathV1`

It MUST NOT create parallel versions with different field order, widths, optionality, or encoding.

## 8. Canonical Private Credential Package

The immutable issuer-delivered package is reproduced from `01-credential.md`:

```text
PrivateCredentialPackageV1 {
    statement: CredentialStatementV1
    issuanceNonce: Bytes<32>
    credentialOpening: Bytes<32>
    issuerSignature: Secp256k1EcdsaSignature
}
```

The package MUST remain immutable after issuance. It MUST NOT contain:

- `subjectSecret`
- issuer, credential, or revocation indices
- Merkle paths or roots
- registry counters or duplicate-set entries
- a revocation flag, timestamp, or reason
- a verifier request or challenge; or
- human-readable certificate metadata

The credential ID and credential commitment MUST be rederived from this package and its owning records. Independently cached copies are non-authoritative and MUST be compared with the canonical derivations before use.

## 9. Holder Secret State

The holder stores the issuer-delivered package with the independently generated subject secret:

```text
HolderCredentialSecretStateV1 {
    credentialPackage: PrivateCredentialPackageV1
    subjectSecret: Bytes<32>
}
```

The holder MUST assert operationally and the proof circuit MUST constrain where applicable:

```text
subjectSecret != default<Bytes<32>>
credentialOpening != default<Bytes<32>>
```

`subjectSecret` is mandatory in every current qualification proof. It is not an optional generic holder secret and MUST NOT be generated, replaced, or rerandomized during proof construction.

The issuer does not normally know `subjectSecret`. The registry provider, proof requester, verifier, analytics system, and public ledger MUST NOT receive it.

## 10. Merkle Membership Records

The issuer-membership record is reproduced from `02-issuer-registry.md`:

```text
IssuerMembershipWitnessV1 {
    record: IssuerRecordV1
    issuerIndex: Uint<32>
    path: IssuerMerklePathV1
}
```

The credential-membership record is reproduced from `06-merkle-tree.md`:

```text
CredentialMembershipWitnessV1 {
    credentialIndex: Uint<32>
    path: CredentialMerklePathV1
}
```

A qualification or revocation record contains one `RevocationMerklePathV1` and reuses `credentialIndex` from `CredentialMembershipWitnessV1`. It MUST NOT contain an independent revocation index.

None of these records contains:

- direction bits
- an expected root
- an expected counter
- a leaf supplied as authoritative data; or
- a shortened or variable-length path

## 11. Holder Registry Witness State

The holder's refreshable registry material is conceptually:

```text
HolderRegistryWitnessStateV1 {
    issuerMembership: IssuerMembershipWitnessV1
    credentialMembership: CredentialMembershipWitnessV1
    revocationPath: RevocationMerklePathV1
}
```

The complete holder state used for current qualification proof is:

```text
HolderCredentialStateV1 {
    secretState: HolderCredentialSecretStateV1
    registryState: HolderRegistryWitnessStateV1
}
```

The credential package, subject secret, issuer record, issuer index, and credential index are immutable for one credential instance. The three paths are refreshable snapshots that may change whenever their applicable current root changes.

An implementation MAY cache the roots and counters against which paths were fetched, but those cache values are off-circuit freshness metadata. They MUST NOT enter a proof as substitutes for current ledger values.

## 12. Contract and Network Scoping

Local private state MUST be scoped at least by:

```text
network identifier
contract address
local credential selector
```

The implementation MUST also compare the locally associated registry context with the sealed current `registryContext` before returning operation data that depends on deployment binding.

The local credential selector MAY be an application-generated opaque handle. It is not a protocol credential ID, is not hashed or signed by V1, and MUST NOT be disclosed as a credential identifier.

Private state from one network, contract, registry context, wallet account, browser profile, issuer tenant, or credential selection MUST NOT be silently returned for another.

## 13. Issuer Operational State

Issuer-side storage may contain:

- the issuer signing key in a dedicated signer or key-management boundary
- public `IssuerRecordV1` and immutable issuer index
- current or refreshable issuer paths
- issued `PrivateCredentialPackageV1` records according to issuer policy
- `IssuerRevocationRecordV1` records frozen in `04-revocation.md`; and
- unpublished registry-authority or revocation-authorization signatures

The issuer signing key and registry-authority signing key MUST NOT be returned to a Compact circuit for signature verification. The circuit receives signatures and verifies them under authenticated public verification keys.

If an issuer implementation signs messages during an operation, signing MUST occur in a separate, purpose-restricted component over the exact circuit-rederived message. The private key MUST NOT be placed in a generic witness record, browser state, proof-server request, or log.

## 14. Tree-Provider State

The credential and revocation providers maintain private tree replicas as frozen in `05-ledgers.md` and `06-merkle-tree.md. Their state may include leaves, indices, nodes, paths, finalized transition order, and encrypted recovery data.

The provider SHOULD return only the minimum requested path and required index or leaf data over authenticated confidential transport.

Provider state is not protocol authority. The client and circuit MUST reject it unless it reconstructs the applicable authoritative current root.

The provider MUST NOT receive a credential statement, issuance nonce, subject secret, credential opening, or issuer signature merely to compute a path. A credential provider may receive the already derived credential leaf and index; a revocation provider may receive the already derived revoked leaf and index.

## 15. Operation Witness Overview

V1 defines four semantic operation records:

| Operation | Normative circuit-input record | State effect |
| --- | --- | --- |
| Issuer registration | `IssuerRegistrationWitnessV1` | Appends issuer root, leaf duplicate guard, and counter. |
| Credential registration | `CredentialRegistrationWitnessV1` | Appends credential root, ID nullifier, and counter. |
| Credential revocation | `CredentialRevocationWitnessV1` | Replaces one empty revocation leaf and updates only the revocation root. |
| Current qualification proof | `QualificationWitnessV1` | Read-only ledger verification. |

These records describe circuit-private semantic data. They are not public transport schemas, ledger records, human-readable credentials, or proof outputs.

## 16. Issuer Registration Witness

The normative semantic record is:

```text
IssuerRegistrationWitnessV1 {
    verificationKey: Secp256k1Point
    issuerPossessionSignature: Secp256k1EcdsaSignature
    registryAuthoritySignature: Secp256k1EcdsaSignature
    insertionPath: IssuerMerklePathV1
}
```

It MUST NOT contain a caller-selected:

- issuer ID or issuer leaf
- issuer index or next issuer index
- current or new issuer root
- registry-authority verification key or registry context
- path directions; or
- issuer or registry-authority private key

The circuit MUST obtain the current index, root, duplicate set, registry context, contract address, and sealed authority verification key from authoritative execution state. It MUST rederive the issuer ID, issuer record, issuer leaf, possession message, authority message, empty-root relation, and new root.

Because the authority message binds current state under `02-issuer-registry.md`, a stale registration signature or insertion path MUST fail after a conflicting transition.

## 17. Credential Registration Witness

The normative semantic record is:

```text
CredentialRegistrationWitnessV1 {
    credentialPackage: PrivateCredentialPackageV1
    issuerMembership: IssuerMembershipWitnessV1
    insertionPath: CredentialMerklePathV1
}
```

It intentionally does not contain `subjectSecret`. Credential registration authenticates the subject commitment stored in the issuer-signed credential statement; holder-control knowledge is proved later by the holder.

It MUST NOT contain a caller-selected:

- credential ID, credential commitment, or credential leaf
- credential registration nullifier
- credential index or next credential index
- current or new credential root
- issuer root or next issuer index
- direction vector; or
- issuer signing key

The circuit MUST:

1. validate the statement constants and timestamps
2. rederive the credential ID from the statement's issuer ID and private issuance nonce
3. rederive the credential commitment from the statement and private credential opening
4. assert that the statement issuer ID equals the issuer-record ID and authenticate that exact issuer record against current issuer state
5. verify the package's issuer signature under that record's verification key
6. derive the credential leaf and deployment-scoped registration nullifier
7. authenticate the empty credential leaf at current `nextCredentialIndex`
8. derive the new credential root; and
9. perform only the atomic write set frozen in `05-ledgers.md`

The assigned index comes from current `nextCredentialIndex`, not from this record. The issuer, holder, and authorized provider record the private finalized assignment data they require through confidential off-chain coordination.

## 18. Credential Revocation Witness

The normative semantic record is:

```text
CredentialRevocationWitnessV1 {
    issuerMembership: IssuerMembershipWitnessV1
    issuanceNonce: Bytes<32>
    credentialId: Bytes<32>
    credentialCommitment: Bytes<32>
    credentialMembership: CredentialMembershipWitnessV1
    issuerSignature: Secp256k1EcdsaSignature
    revocationPath: RevocationMerklePathV1
    revocationAuthorizationSignature: Secp256k1EcdsaSignature
}
```

This is the proof-facing form of the issuer's operational `IssuerRevocationRecordV1` plus current issuer, credential, and revocation paths.

It MUST NOT contain:

- a subject secret, credential opening, or complete statement
- a second revocation index
- an issuer, credential, or revocation root
- an issuer or credential counter
- an empty or revoked leaf supplied as authoritative data
- a revocation reason, timestamp, status, or replacement leaf; or
- an issuer private key

The circuit MUST first rederive `credentialId` from `issuerMembership.record.issuerId` and `issuanceNonce` using `CredentialIdInputV1`, then require exact equality with the retained ID. It MUST bind that same credential ID and commitment to the original issuer signature, credential leaf, revocation-authorization message, and revoked leaf. It MUST authenticate issuer and credential membership under current roots and prove the canonical empty revocation leaf at the same `credentialIndex` before the irreversible update.

## 19. Qualification Witness

The normative current-qualification record is:

```text
QualificationWitnessV1 {
    credentialPackage: PrivateCredentialPackageV1
    subjectSecret: Bytes<32>
    issuerMembership: IssuerMembershipWitnessV1
    credentialMembership: CredentialMembershipWitnessV1
    revocationPath: RevocationMerklePathV1
}
```

It MUST NOT contain:

- an independently supplied credential ID, subject commitment, credential commitment, issuer message, or credential leaf
- a second credential or revocation index
- issuer, credential, or revocation roots
- issuer or credential counters
- direction bits
- a prover-selected verification time
- a free-form claim map, score, grade, identity attribute, or predicate
- a private copy of the public qualification request or challenge; or
- a holder, wallet, or issuer signing key

The current qualification circuit MUST jointly constrain every requirement in `01-credential.md`, including credential construction, both commitment relations, issuer authorization and signature, credential membership, holder control, non-revocation at the same index, the fixed qualification type and version, current block-time validity, and the public request binding frozen later by `08-proofs.md`.

## 20. No Independent Claim or Temporal Witness

JustProof V1 has one fixed qualification schema and no arbitrary claims map. Therefore it defines no standalone `ClaimWitnessV1`.

The private qualification type, qualification version, `issuedAt`, and `expiresAt` are fields of the exact `CredentialStatementV1` inside the credential package. A witness provider MUST NOT retrieve or override them independently.

The proof compares those private statement fields with:

- the exact public qualification request defined by `08-proofs.md`; and
- authoritative current block time through the standard-library time circuits.

A prover-supplied `verificationTime`, `currentTime`, expiration result, or boolean validity flag is invalid.

## 21. No Request-Binding Witness

A proof request, verifier challenge, proof type, qualification requirement, and other request-binding values are public proof-statement inputs owned by `08-proofs.md` and `09-verification.md`.

They MUST NOT be returned from private state as authoritative witness values.

The witness provider MAY use public request metadata to select a local credential that appears eligible. That preselection is only a usability optimization. The circuit MUST prove equality or the exact predicate against the public request.

If no stored credential appears eligible, the provider SHOULD fail before proof generation without exposing which private field failed.

## 22. No Root, Counter, Direction, or Time Witness

V1 prohibits witnesses for:

```text
issuerRoot
nextIssuerIndex
credentialRoot
nextCredentialIndex
revocationRoot
registeredIssuerLeaves
registeredCredentialNullifiers
registryAuthorityVerificationKey
registryContext
path direction bits
verification time
```

These values are read or derived from authoritative contract execution state and Compact standard-library facilities.

A TypeScript witness MAY inspect `WitnessContext.ledger` to choose matching private material or fail early. The returned witness record MUST still exclude alternative expected roots and counters, and the circuit MUST read and constrain current ledger state directly.

## 23. WitnessContext Use

Every TypeScript witness receives a runtime context containing:

```text
WitnessContext {
    contractAddress
    ledger
    privateState
}
```

A conforming witness implementation SHOULD use:

- `contractAddress` to enforce contract-scoped private-state selection
- `ledger.registryContext` to reject deployment mismatches
- current ledger roots and counters to select or refresh applicable path snapshots; and
- `privateState` to load the selected credential or issuer operation record

The context is a local projected view available during transaction construction. Reading it in TypeScript does not turn returned data into trusted state. The Compact circuit's ledger reads and assertions remain authoritative.

The implementation MUST NOT use `ownPublicKey()` or another witness-returned wallet identity as authentication of an issuer, holder, registry authority, or revocation authority.

## 24. Reference Compact ABI

A conforming implementation SHOULD prefer one aggregate witness call per semantic operation to reduce accidental mixing:

```compact
witness issuerRegistrationWitness(): IssuerRegistrationWitnessV1;

witness credentialRegistrationWitness(): CredentialRegistrationWitnessV1;

witness credentialRevocationWitness(): CredentialRevocationWitnessV1;

witness qualificationWitness(): QualificationWitnessV1;
```

These symbol names and the one-callback partition are reference ABI guidance, not V1 wire identifiers. The semantic records and circuit constraints are normative.

When a record is split, all subrecords MUST be selected from one operation-scoped snapshot. Repeated callbacks MUST NOT observe different selected credentials or silently refreshed paths during one circuit evaluation.

An implementation SHOULD avoid a generic witness such as:

```text
witnessData(): Vector<..., Field>
```

or an untyped JavaScript object whose positional interpretation is maintained separately from generated bindings.

## 25. TypeScript Witness Contract

For a read-only witness, the generated TypeScript shape is conceptually:

```ts
qualificationWitness: (
  context: WitnessContext<Ledger, JustProofPrivateStateV1>,
): [JustProofPrivateStateV1, QualificationWitnessV1] => [
  context.privateState,
  selectedQualificationWitness,
]
```

The implementation MUST:

- implement every witness declared by the compiled contract
- use the compiler-generated `Ledger`, witness-record, and `Witnesses<PS>` types
- return exactly `[updatedPrivateState, value]`
- avoid `any`, unchecked casts, positional tuple reinterpretation, and partial objects at the protocol boundary
- copy mutable byte arrays when ownership or later mutation is uncertain
- reject invalid byte lengths, integer ranges, enum variants, and missing fields before circuit invocation
- avoid mutating shared private-state objects in place; and
- keep operation selection explicit and race-free

Generated bindings determine whether a Compact value is represented in TypeScript as `bigint`, `Uint8Array`, a generated record, or another runtime type. Handwritten JSON schemas MUST NOT override the generated representation entering the circuit.

## 26. Read-Only and Updating Witnesses

The four proof-facing operation records are read-only snapshots. A callback returning one of them SHOULD return the existing `privateState` unchanged.

Private-state updates MAY be performed through separate purpose-specific witnesses when the application needs to:

- install a newly received private credential package
- associate the holder-generated subject secret
- record a finalized credential index
- replace cached paths after validation against current roots; or
- record finalized issuer or revocation operational data

An updating witness MUST validate the update, construct a new typed private-state value, and return it explicitly. It MUST NOT treat a local update as evidence that a ledger transaction succeeded.

Proof-facing callbacks MUST NOT generate fresh issuance nonces, subject secrets, credential openings, signatures, IDs, commitments, or leaves as fallback replacements for missing state.

## 27. Credential Selection

An application supporting multiple credentials MUST select one local credential before invoking the proof-facing circuit.

Selection MUST be scoped to the current operation and MUST NOT rely on a process-global mutable `activeCredential` shared across concurrent calls.

The selected state MUST remain stable for the complete circuit evaluation. If the credential selection changes, the operation MUST restart with a new snapshot.

Selection MAY consider the public requested qualification, but it MUST NOT claim success until the circuit constrains the selected private credential to that request.

A local selector MUST NOT enter cryptographic derivations, proof outputs, logs, URLs, analytics, or human-readable certificates.

## 28. Path Acquisition and Refresh

Before a state-changing operation or current qualification proof, the client MUST obtain paths compatible with the latest authoritative state it intends to use.

The client MUST validate, or rely on the circuit to validate before any state effect:

- exactly 16 siblings
- `Bytes<32>` sibling width
- leaf-to-root ordering
- the correct tree type
- the correct immutable index
- reconstruction to the current applicable root; and
- range below the applicable current counter for membership

Path providers MUST NOT supply direction bits. Direction derives in-circuit from the index under `06-merkle-tree.md`.

After another issuer registration, credential registration, or revocation changes an applicable root, cached paths may become stale. The client MUST refresh every affected path and retry against the new current state. It MUST NOT weaken a root check or substitute a cached root.

## 29. Derived Values and Duplication

The following values MUST be derived inside the circuit when their preimages are present:

- issuer ID and issuer leaf
- credential ID
- subject commitment
- credential commitment
- issuer signature message
- credential leaf
- credential registration nullifier
- revocation authorization message
- revoked credential leaf; and
- every reconstructed Merkle root

An implementation MAY cache derived values for indexing or diagnostics inside protected local state. A cached value is non-authoritative and MUST be rederived or compared with the in-circuit derivation.

Qualification and credential-registration witnesses MUST NOT contain independent copies of credential ID or credential commitment because both are derivable from `PrivateCredentialPackageV1`. Revocation is the deliberate exception: its minimal issuer record contains the issuance nonce, ID, and commitment without the complete credential package. The circuit rederives the ID from the authenticated issuer ID and nonce, then binds the ID and commitment to the original issuer signature and current credential leaf.

## 30. Encoding and Representation

Witness values MUST enter Compact using the compiler-generated typed bindings.

The implementation MUST NOT use any of the following as the cryptographic witness representation:

- JSON or canonical JSON bytes
- property insertion order
- delimiter-based strings
- hexadecimal text in place of `Bytes<32>`
- JavaScript `number` for values represented as `bigint` by generated bindings
- database-row order
- CBOR, MessagePack, or protocol-buffer bytes
- a PDF, image, QR code, or OCR result; or
- a frontend form object with unchecked optional fields

Serialization MAY be used for encrypted storage or transport. It MUST be decoded, length-checked, range-checked, and converted into the exact generated Compact types before witness return.

Lowercase hexadecimal without a `0x` prefix is RECOMMENDED for diagnostic and test-vector display only. Display encoding never replaces the underlying typed byte value.

## 31. Provider Validation Versus Circuit Validation

The TypeScript provider SHOULD fail early when it detects:

- an unsupported protocol version
- a missing or malformed credential package
- an all-zero opening or secret
- a contract, network, registry-context, or local-account mismatch
- an absent issuer record, signature, index, or path
- an invalid vector length or byte width
- a stale path tagged to another root
- a qualification that cannot match the public request; or
- an operation record assembled from different credentials

Every corresponding cryptographic or state relation MUST still be constrained in Compact.

Application validation and circuit validation are complementary:

```text
provider validation -> early failure and safer UX
circuit constraints  -> proof soundness and state-transition authority
```

No provider-side signature verification, hash comparison, schema check, or root reconstruction may replace the circuit check.

## 32. Privacy and Disclosure Boundary

Witness results and private circuit arguments MUST remain private unless a frozen operation requires a derived public state update or public proof input.

Implementations MUST NOT place private witness data in:

- public ledger fields other than the narrowly derived values frozen in `05-ledgers.md`
- exported-circuit return values
- events or transaction metadata
- application, proof-server, path-provider, analytics, telemetry, or crash logs
- exception messages or serialized stack context
- URLs, query strings, browser history, clipboard contents, or QR codes
- DOM attributes, rendered markup, client hydration payloads, or development panels
- screenshots or human-readable credential artifacts; or
- unencrypted local storage, caches, or backups

When a new Merkle root, issuer leaf, or credential nullifier crosses into public ledger state, the circuit MUST complete its full derivation and constraints before applying `disclose` only to the final required value.

Compact's private-by-default behavior does not protect a secret that the surrounding application separately sends to a remote service or public transaction payload.

## 33. Browser and Local-Proving Boundary

Holder qualification proofs SHOULD be generated in a holder-controlled browser or other explicitly trusted local environment.

The UI SHOULD receive only:

- a local opaque credential label or display-safe metadata
- proof-generation progress
- non-sensitive success or failure status; and
- the final proof and public statement defined by `08-proofs.md`

The UI does not need direct access to the private credential package, openings, subject secret, indices, or paths merely to render a “Generate proof” action.

Browser worker messages, state-management tools, developer extensions, error overlays, and source-map telemetry are part of the privacy boundary. Production builds MUST prevent them from serializing witness state.

## 34. Remote Services

A remote path provider MAY supply untrusted authentication paths over authenticated confidential transport.

A remote proof service creates a materially larger trust boundary because it can observe private proof inputs unless the proving architecture cryptographically prevents that access. JustProof V1 SHOULD keep proof generation local.

If remote proving is used, the application MUST explicitly disclose that trust model to the holder, encrypt transport, minimize retention, prohibit private-input logging, isolate tenants, and document deletion and compromise procedures. Remote proving does not change circuit soundness, but it can eliminate the intended privacy against the service.

A verifier MUST never receive the witness merely because it receives the final proof.

## 35. Witness Lifetime and Memory Hygiene

Witness values SHOULD have the shortest practical lifetime:

```text
select protected private state
    -> acquire current paths
    -> construct one operation snapshot
    -> execute and prove the circuit
    -> discard transient copies
```

Long-lived encrypted holder and issuer records are private state, not transient witness objects. The implementation SHOULD decrypt only the selected record and avoid loading an entire credential collection when one credential is required.

JavaScript does not guarantee immediate secure memory erasure. Implementations SHOULD still:

- minimize copies
- avoid immutable string encodings of secrets
- release references promptly
- terminate dedicated proof workers after use when practical; and
- clear buffers when supported without claiming guaranteed erasure

## 36. Finalization, Concurrency, and Recovery

A locally executed circuit or witness update does not prove that a transaction was finalized on-chain.

For issuer registration, credential registration, or revocation, the application MUST:

1. construct the operation against one current ledger snapshot
2. keep any private-state update provisional
3. submit the transaction
4. wait for the application's required finalization signal
5. reconcile the finalized root and counter transition; and
6. only then mark the assigned index, new leaf, or revocation state as finalized locally

Concurrent transitions may invalidate paths, counters, and state-bound signatures. A stale failure MUST trigger a fresh ledger read and path refresh. It MUST NOT trigger default substitution, forced local state mutation, or acceptance of an earlier root.

Encrypted backups MUST preserve immutable credential material and sufficient provider state for recovery. Restoration MUST recheck network, contract, registry context, and current roots before any recovered record is used.

## 37. Failure Conditions

Witness construction or circuit execution MUST fail closed if any required condition is unavailable, malformed, inconsistent, stale, or unauthorized, including:

- missing private credential, subject secret, credential opening, or signature
- missing or incorrect issuer-retained issuance nonce for revocation
- unsupported protocol version or qualification schema
- wrong contract, network, registry context, account, or credential selection
- invalid generated-binding type, byte length, integer range, point, signature, or vector length
- a credential ID, commitment, issuer record, leaf, or message that fails rederivation
- a signature that fails under the authenticated key
- an index outside its range or inconsistent across credential and revocation proofs
- a wrong, stale, shortened, reordered, or unavailable path
- a path that reconstructs another root
- a witness-supplied direction, root, counter, verification time, or validity flag
- mixed values from different credentials or deployments
- a missing public request or request mismatch
- a provider or proof service whose privacy requirements cannot be met; or
- inability to complete an atomic ledger write

The implementation MUST NOT replace missing data with zero values, empty paths, default records, the first stored credential, cached authoritative state, or newly generated cryptographic material.

Failure messages MUST NOT reveal which private credential field, sibling, signature component, opening, or secret was close to a valid value.

## 38. Security Properties and Limitations

When combined with the frozen circuit constraints, this witness model provides:

- **Credential coherence:** all proof components are constrained to one credential instance
- **Private-state separation:** immutable credential secrets are separated from refreshable registry material
- **Authority separation:** witness callbacks supply data but cannot choose authoritative roots, counters, keys, or time
- **Path integrity:** exact paths and indices are checked against current roots
- **Deployment isolation:** local state is scoped to the intended network, contract, and registry context
- **Minimal operation records:** each operation omits secrets it does not require; and
- **Implementation substitutability:** browser and Node drivers may differ without changing witness semantics

The witness layer does not prevent:

- compromise of the device, private-state password, browser profile, issuer signer, backup, path provider, or remote prover;
- deliberate credential or subject-secret transfer by the holder
- denial of service or privacy correlation by a path provider
- stale-state failures caused by concurrent valid transitions
- loss of use after unrecoverable secret or private-tree loss; or
- a malicious implementation from exfiltrating private state before the circuit runs

Zero-knowledge proof soundness does not compensate for application-layer exfiltration.

## 39. Non-Goals

V1 does not define:

- a generalized claims or predicate witness system
- optional holder binding
- wallet-address, decentralized-identity, biometric, or civil-identity witnesses
- witness-based roots, counters, block time, or authorization keys
- caller-supplied direction bits
- historical-root or arbitrary-time witnesses
- witness-based credential recovery
- automatic secret or opening regeneration
- public credential import from PDF, image, QR code, or OCR
- remote-prover confidentiality guarantees
- an application database schema, encryption format, key-management product, or UI state library; or
- protocol authority for a path provider, indexer, API, frontend, or witness callback

## 40. Normative Invariants

Every conforming JustProof V1 witness implementation MUST preserve these invariants:

1. Witness callbacks and private circuit arguments are untrusted prover inputs.
2. Every security-critical relation is independently constrained in Compact.
3. The generated witness ABI and Compact types are used without handwritten reinterpretation.
4. Immutable credential material uses the exact `PrivateCredentialPackageV1`.
5. The holder's fresh nonzero `subjectSecret` is mandatory for qualification proof.
6. No proof-facing witness generates a replacement nonce, secret, opening, signature, ID, commitment, or leaf.
7. Qualification witnesses contain exactly one credential package and subject secret.
8. Credential registration does not require or receive the holder's subject secret.
9. Revocation uses the minimum issuer record, including the retained issuance nonce, and does not require holder cooperation or commitment openings.
10. Revocation rederives the credential ID from the authenticated issuer ID and retained issuance nonce.
11. Issuer, credential, and revocation records bind to one exact credential instance.
12. Credential and revocation membership reuse one exact private `credentialIndex`.
13. Issuer and credential indices use `Uint<32>` and are range-constrained in-circuit.
14. Every Merkle path contains exactly 16 `Bytes<32>` siblings ordered leaf-to-root.
15. Direction bits derive in-circuit from the index and are never witness values.
16. Current roots, counters, duplicate sets, registry configuration, and block time never come from witnesses.
17. Credential ID, commitments, leaves, messages, nullifiers, and reconstructed roots are derived in-circuit.
18. No free-form claim, temporal, request, validity-result, or current-state witness exists in V1.
19. Request parameters and challenges are public proof-statement inputs.
20. Issuer and registry-authority private signing keys never enter proof-facing witnesses.
21. Provider checks never replace circuit validation.
22. Private state is scoped to the correct network, contract, registry context, account, and credential selection.
23. One circuit evaluation observes one stable operation snapshot.
24. Refreshable paths never mutate immutable credential data or indices.
25. Local private-state updates never substitute for finalized ledger state.
26. Stale or unavailable paths and state fail closed.
27. Witness data is not logged, rendered, emitted, returned, or stored publicly.
28. Only the exact derived public values authorized by frozen ledger or proof semantics cross `disclose` boundaries.
29. Browser, Node, and test implementations preserve identical protocol semantics.

## 41. Required Tests

Before a V1 implementation is considered conformant, the generated contract and TypeScript witness layer MUST test:

### 41.1 ABI and type tests

- the complete generated `Witnesses<PS>` object instantiates successfully
- a missing, non-function, or incorrectly typed witness implementation is rejected
- every aggregate and split ABI produces semantically identical circuit inputs
- Compact records, `Uint<32>`, `Uint<64>`, `Bytes<32>`, points, signatures, and exact vectors cross the TypeScript boundary correctly; and
- invalid byte lengths, numeric widths, path lengths, and record variants fail before proving

### 41.2 Issuer-registration tests

- valid possession and authority signatures with the current insertion path succeed
- wrong keys, signatures, current state, or path fail
- witness-supplied issuer IDs, leaves, indices, roots, or directions cannot override derivation; and
- neither signing private key enters the witness record, proof output, ledger, or logs

### 41.3 Credential-registration tests

- a valid credential package, current issuer membership, and empty insertion path succeed
- the circuit rederives ID, commitment, signature message, leaf, and nullifier
- credential registration succeeds without `subjectSecret`
- another statement, nonce, opening, issuer signature, issuer path, or insertion path fails
- a caller-selected credential index, root, leaf, commitment, or nullifier is rejected; and
- failure atomically preserves root, counter, and nullifier state

### 41.4 Revocation tests

- the minimal issuer revocation record plus current paths succeeds without holder state
- the authenticated issuer ID and retained issuance nonce rederive the exact credential ID
- the same credential index is used for credential and revocation membership
- a missing or wrong issuance nonce and every mixed credential ID, commitment, original signature, issuer record, or authorization signature fail
- a nonempty revocation position, stale path, or second revocation fails; and
- no statement, subject secret, or credential opening is required or exposed, and the issuance nonce remains private

### 41.5 Qualification tests

- one coherent holder state satisfies all credential, holder, issuer, membership, non-revocation, qualification, time, and request constraints
- an all-zero or wrong subject secret fails
- an all-zero or wrong credential opening fails
- `Credential A + signature B`, `Credential A + issuer path B`, `Credential A + credential path B`, and `Credential A + revocation path B` all fail
- a separate claim, time, direction, root, counter, validity, or request witness cannot influence the statement
- refreshed current paths succeed while stale paths fail; and
- the selected credential remains stable throughout one operation

### 41.6 Adversarial witness tests

- replace each honest witness callback with a malicious implementation and prove that circuit constraints reject every forged relation
- return private state scoped to another network, contract, registry context, account, or credential and require failure
- return a different credential from two split callbacks in one operation and require failure
- mutate returned byte arrays after snapshot creation and prove the operation uses an immutable copy or fails safely
- make provider validation incorrectly return success and prove the circuit still rejects invalid data; and
- verify that `ownPublicKey()` cannot authorize any protocol role

### 41.7 Privacy and lifecycle tests

- no private field appears in ledger state, exported outputs, events, transaction metadata, logs, analytics, URLs, DOM markup, crash reports, or presentation artifacts
- only authorized final roots, issuer leaves, credential nullifiers, and proof-statement values cross disclosure boundaries
- proof-facing witnesses return unchanged private state
- provisional local updates are not marked finalized after rejected, stale, or dropped transactions
- concurrent operations cannot swap an active credential or path snapshot; and
- encrypted backup restoration rechecks deployment and current-root consistency

## 42. Specification Ownership and Dependencies

This document is authoritative for:

- witness and local private-state trust boundaries
- the four semantic operation witness records
- the separation of immutable holder material from refreshable registry material
- prohibited witness values
- TypeScript witness-provider behavior
- witness selection, path refresh, lifecycle, privacy, and failure requirements; and
- witness-specific conformance tests

`01-credential.md` is authoritative for the credential statement, private credential package, subject secret, issuance nonce, credential opening, issuer signature, holder state, and full current-qualification obligations.

`02-issuer-registry.md` is authoritative for issuer records, membership, registration signatures, issuer paths, and issuer-registration effects.

`03-commitments.md` is authoritative for both commitment openings, their generation and ownership, and exact opening relations.

`04-revocation.md` is authoritative for issuer revocation records, revocation authorization, current non-revocation, and the irreversible revocation transition.

`05-ledgers.md` is authoritative for current public state, duplicate guards, operation write sets, disclosure, atomicity, concurrency, and final state meaning.

`06-merkle-tree.md` is authoritative for credential and empty leaves, exact path structure, index decomposition, root reconstruction, provider state, and shared Merkle behavior.

`08-proofs.md` MUST freeze the exact public qualification request and proof statement. It MUST consume `QualificationWitnessV1` without adding private claims, prover-selected time, witness roots, or an optional holder secret.

`09-verification.md` MUST verify only the public statement and authoritative current state. It MUST NOT request, receive, reconstruct, or log a private witness.

`10-specification.md` MUST consolidate these exact witness records and reject the earlier draft's optional holder secret, generic claim witnesses, temporal witnesses, request witnesses, caller-selected commitment or root, and undefined path shapes.

## 43. Implementation References

The implementation should be checked against the official Midnight documentation for the pinned toolchain:

- [Compact language reference — witness declarations](https://docs.midnight.network/compact/reference/compact-reference)
- [Using the Compact JavaScript implementation](https://docs.midnight.network/guides/use-compact-javascript-implementation)
- [Compact smart-contract security](https://docs.midnight.network/compact/smart-contract-security)
- [Compact security and best practices](https://docs.midnight.network/guides/security-best-practices)
- [Compact runtime `WitnessContext`](https://docs.midnight.network/api-reference/compact-runtime/interfaces/WitnessContext)
- [Compact toolchain `0.31.0`](https://docs.midnight.network/relnotes/compact/toolchain-0.31.0)

## 44. Final Protocol Principle

The JustProof V1 witness layer supplies one private candidate state to a circuit:

> This exact private operation record contains the values from which the circuit can prove or reject the frozen protocol statement against authoritative current state.

The witness provider does not certify the credential, authorize the issuer, choose the current root, establish time, or make a claim true.

The circuit constrains those facts. The ledger supplies current authority. The proof reveals only the public statement deliberately frozen by the protocol.
