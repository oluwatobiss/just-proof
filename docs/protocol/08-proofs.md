# JustProof Zero-Knowledge Proof Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.0`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the single JustProof V1 zero-knowledge qualification proof, its public request, its current-state binding, its private witness, its public output, and the exact statement established by successful verification.

The proof allows a holder to establish that one private credential is correctly constructed, holder-controlled, issuer-authenticated, registered, currently unrevoked, unexpired through the request deadline, and equal to the fixed V1 qualification—without revealing the credential, issuer, identifiers, commitments, signatures, indices, paths, openings, or holder secret.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

JustProof V1 freezes the following proof decisions:

- V1 has exactly one proof type: current qualification proof
- the only qualification is the JustProof Midnight Builder Demonstration Credential frozen in `01-credential.md`
- the proof request is public, deployment-bound, verifier-bound, challenge-bound, and deadline-bound
- every request uses a fresh nonzero 32-byte verifier challenge
- every accepted proof is single-use for the issuing verifier
- the proof reads the current issuer, credential, and revocation roots and counters from ledger state
- the public proof output contains exact typed digests of the request and verification-state snapshot
- off-chain acceptance requires those state values to equal the deployed contract's current authoritative state at verification time
- current non-revocation, current issuer authorization, current credential membership, holder control, and temporal validity are mandatory rather than verifier-selectable policies
- the credential MUST remain unexpired through the public request deadline
- no issuer constraint, arbitrary claim, score, grade, threshold, optional validity policy, historical root, presentation nullifier, or reusable proof exists in V1
- the private input is exactly `QualificationWitnessV1` from `07-witnesses.md`; and
- successful proof generation performs no ledger write

Changing the proof type, request fields, request or state digest construction, public output, private witness, qualification semantics, replay model, time boundary, state freshness rule, or guaranteed statement requires a new protocol version.

## 4. Compact V1 Baseline

The implementation MUST begin with:

```compact
pragma language_version 0.23;

import CompactStandardLibrary;
```

V1 uses:

- `persistentHash<T>` for request and state digests
- `kernel.self()` for the executing contract address
- direct reads of the frozen ledger fields
- `blockTimeGte` and `blockTimeLt` for current temporal constraints
- the generated proving and verifier keys for the exact qualification circuit; and
- `disclose` only for the final public proof output

The proof circuit is impure because it invokes a witness, reads ledger state, and evaluates block-time predicates. It nevertheless performs no ledger mutation.

## 5. Proof Type and Qualification Constants

V1 defines:

| Value | Compact type | Exact value |
| --- | --- | --- |
| Protocol version | `Uint<16>` | `1` |
| Proof type | `Uint<8>` | `1` (`QUALIFICATION`) |
| Qualification type | `Bytes<32>` | `3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7` |
| Qualification version | `Uint<16>` | `1` |

The qualification-type value is the SHA-256 digest of the exact UTF-8 label:

```text
JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1
```

The proof type is encoded as `Uint<8>` value `1`; it is not a free-form string, frontend label, or implementation-selected enum value.

V1 does not define `EXPIRATION`, `ISSUER`, `ATTRIBUTE`, `AGE`, `MEMBERSHIP`, or another standalone proof type.

## 6. Primitive Types

| Value | Compact type |
| --- | --- |
| Protocol version | `Uint<16>` |
| Proof type | `Uint<8>` |
| Qualification version | `Uint<16>` |
| Request deadline or credential timestamp | `Uint<64>` |
| Qualification, verifier context, challenge, root, or digest | `Bytes<32>` |
| Registry contract | `ContractAddress` |
| Issuer or credential counter | `Uint<32>` |

All application transport encodings MUST decode into these exact types. Transport serialization does not enter a typed hash in place of the Compact record.

## 7. Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose | UTF-8 label | `Bytes<32>` hexadecimal |
| --- | --- | --- |
| Qualification request digest | `JP:PROOF:REQUEST:V1` | `23a6c2cd0cb3f45e30e6e6a4f91ba1c8b8479d96d965fa49e85879f1299c30f9` |
| Verification-state digest | `JP:PROOF:STATE:V1` | `4431ba5e9ed187abe8c1358c62926c343de0fb0336d857d7c2cf3dea4e78f4ea` |

Implementations MUST embed or deterministically reproduce the exact values. They MUST NOT pass variable-length labels where `Bytes<32>` is required.

The draft labels `JP:CREDENTIAL:V1:PROOF`, `JP:CREDENTIAL:V1:PROOF:REQUEST`, and `JP:CREDENTIAL:V1:PROOF:NULLIFIER` are not JustProof V1 domain tags and MUST NOT be used.

## 8. Qualification Proof Request

The normative public request is:

```text
QualificationProofRequestV1 {
    protocolVersion: Uint<16>
    proofType: Uint<8>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    qualificationType: Bytes<32>
    qualificationVersion: Uint<16>
    verifierContext: Bytes<32>
    challenge: Bytes<32>
    requestExpiresAt: Uint<64>
}
```

The field order is normative.

The request MUST satisfy:

```text
protocolVersion == 1
proofType == 1
registryContract == kernel.self()
registryContext == current sealed ledger registryContext
qualificationType == QUALIFICATION_MIDNIGHT_BUILDER_DEMO_V1
qualificationVersion == 1
verifierContext != default<Bytes<32>>
challenge != default<Bytes<32>>
requestExpiresAt > 0
blockTimeLt(requestExpiresAt)
```

The request contains no issuer constraint, holder identity, credential identifier, credential commitment, expected root, requested claim map, validity-policy switch, revocation override, or prover-selected verification time.

## 9. Verifier Context

`verifierContext` is a nonzero public 32-byte identifier for the verifier application, tenant, or relying-party context that issued the request.

The verifier MUST provision and compare its own exact value. It MUST NOT accept a caller-selected context as equivalent merely because the proof is cryptographically valid.

The mechanism used to provision the verifier context is application configuration outside the Compact credential statement. It MAY be a securely generated identifier or an unambiguous digest of a verifier-controlled canonical identifier. It MUST NOT be derived from a holder, credential ID, credential commitment, subject secret, wallet address, or challenge.

Two verifier contexts MAY request the same V1 qualification, but a response bound to one context MUST NOT be accepted as a response issued by another.

## 10. Verifier Challenge

The verifier MUST generate `challenge` as exactly 32 bytes from a cryptographically secure random source.

The challenge MUST be:

- nonzero
- unpredictable before request issuance
- unique within that verifier context
- generated independently of every credential and holder value
- stored with its request until consumed or expired; and
- bound to exactly one request and never assigned to another request, including after that request is cancelled, expires, or succeeds

`Math.random()`, timestamps, sequential counters, UUIDs without an explicit 256-bit CSPRNG guarantee, credential data, wallet data, and deterministic defaults MUST NOT generate the challenge.

The challenge is public. Its security property is freshness and request uniqueness, not secrecy.

## 11. Request Deadline

`requestExpiresAt` is an exclusive Unix timestamp in seconds represented by `Uint<64>`.

The proof circuit MUST establish:

```text
current block time < requestExpiresAt
```

The verifier MUST also reject the response when its authoritative verification time is at or after `requestExpiresAt`.

The verifier SHOULD choose the shortest deadline compatible with path retrieval and proof generation. A production default of 15 minutes or less is RECOMMENDED, but V1 does not freeze a universal maximum because proving and network conditions vary.

The request deadline is not a historical verification time. It limits when a current proof response may be generated and accepted.

## 12. Request Digest

The normative digest input is:

```text
QualificationProofRequestDigestInputV1 {
    domain: Bytes<32>
    request: QualificationProofRequestV1
}
```

Construction is:

```text
qualificationRequestDigestV1(request) =
    persistentHash<QualificationProofRequestDigestInputV1>({
        domain: DOMAIN_PROOF_REQUEST_V1,
        request
    })
```

The complete typed request is public. The digest is the compact value bound into the proof output.

The verifier MUST independently reconstruct the exact typed request and recompute the digest using generated Compact-compatible behavior. Hashing JSON, query parameters, a QR payload, concatenated fields, or display text is non-conforming.

## 13. Current Verification State

The normative state snapshot is:

```text
QualificationVerificationStateV1 {
    protocolVersion: Uint<16>
    registryContract: ContractAddress
    registryContext: Bytes<32>
    issuerRoot: Bytes<32>
    nextIssuerIndex: Uint<32>
    credentialRoot: Bytes<32>
    nextCredentialIndex: Uint<32>
    revocationRoot: Bytes<32>
}
```

The field order is normative.

The proof circuit MUST construct this record itself from:

```text
protocolVersion = 1
registryContract = kernel.self()
registryContext = sealed ledger registryContext
issuerRoot = current ledger issuerRoot
nextIssuerIndex = current ledger nextIssuerIndex
credentialRoot = current ledger credentialRoot
nextCredentialIndex = current ledger nextCredentialIndex
revocationRoot = current ledger revocationRoot
```

No root, counter, contract, or registry context may come from `QualificationWitnessV1` or another prover-controlled witness.

The circuit MUST assert:

```text
nextIssuerIndex <= 65,536
nextCredentialIndex <= 65,536
```

The issuer and credential duplicate sets are transition guards and are not qualification-proof state inputs. The sealed registry-authority verification key is not read by qualification proof because current issuer membership is authenticated by `issuerRoot`.

## 14. Verification-State Digest

The normative digest input is:

```text
QualificationVerificationStateDigestInputV1 {
    domain: Bytes<32>
    state: QualificationVerificationStateV1
}
```

Construction is:

```text
qualificationStateDigestV1(state) =
    persistentHash<QualificationVerificationStateDigestInputV1>({
        domain: DOMAIN_PROOF_STATE_V1,
        state
    })
```

The state digest is derived from public ledger data. It does not hide the state or turn a stale state into an acceptable one.

At verification time, an off-chain verifier MUST independently fetch the exact current contract state, reconstruct `QualificationVerificationStateV1`, recompute the digest, and require equality with the proof output.

Any change to an included root or counter changes the digest except with negligible probability and makes the earlier proof stale.

## 15. Public Proof Output

The normative public output is:

```text
QualificationProofPublicOutputV1 {
    requestDigest: Bytes<32>
    stateDigest: Bytes<32>
}
```

The field order is normative.

The circuit derives:

```text
requestDigest = qualificationRequestDigestV1(request)
stateDigest = qualificationStateDigestV1(currentState)
```

and returns only:

```text
disclose(QualificationProofPublicOutputV1 {
    requestDigest,
    stateDigest
})
```

No success Boolean is required. A valid proof for this exact circuit and public output establishes that all circuit assertions succeeded. A public output without its cryptographically valid proof establishes nothing.

## 16. Proof Artifact Envelope

The application-level response is conceptually:

```text
QualificationProofArtifactV1 {
    networkId
    circuitId
    request: QualificationProofRequestV1
    verificationState: QualificationVerificationStateV1
    publicOutput: QualificationProofPublicOutputV1
    proof
}
```

The exact raw proof representation and transport serialization are generated or selected by the pinned Midnight toolchain and SDK. They are not manually serialized cryptographic inputs.

The `proof` field denotes the runtime proof bundle, including or accompanied by every public transcript value required by the supported verifier. An application MUST NOT strip ledger-query or block-time-query data merely because the two JustProof output digests are present.

The envelope MUST identify:

```text
circuitId = proveQualificationV1
```

`networkId` is public routing metadata. It MUST match verifier configuration but does not replace the cryptographic binding to `registryContract` and `registryContext`.

The verifier MUST NOT trust a verifier key, state digest, request digest, circuit ID, or network selected only by the received envelope. It resolves the supported circuit and verifier key from its trusted JustProof deployment configuration and recomputes both digests.

## 17. Private Proof Input

The private proof input is exactly:

```text
QualificationWitnessV1 {
    credentialPackage: PrivateCredentialPackageV1
    subjectSecret: Bytes<32>
    issuerMembership: IssuerMembershipWitnessV1
    credentialMembership: CredentialMembershipWitnessV1
    revocationPath: RevocationMerklePathV1
}
```

Its complete definition, sourcing, selection, encoding, privacy, and lifecycle are frozen in `07-witnesses.md`.

The proof MUST NOT accept an independent credential ID, subject commitment, credential commitment, issuer message, credential leaf, revocation index, root, counter, direction vector, verification time, claim map, validity flag, or private request copy.

## 18. Reference Exported Circuit

The normative exported operation is conceptually:

```text
proveQualificationV1(
    request: QualificationProofRequestV1
) -> QualificationProofPublicOutputV1
```

The private qualification material is obtained according to `07-witnesses.md`, preferably through one coherent `qualificationWitness()` snapshot.

The implementation MAY use a structurally equivalent private-argument or split-witness ABI, but it MUST preserve the exact request, private record, output, constraints, and absence of ledger writes defined here.

The circuit MUST NOT accept caller-supplied current roots, counters, state digest, request digest, credential-derived values, or verification time as authoritative.

## 19. Exact Qualification Statement

For public request `R`, current state `S`, public output `O`, and private witness `W`, a valid proof establishes:

```text
O.requestDigest == qualificationRequestDigestV1(R)
O.stateDigest == qualificationStateDigestV1(S)

AND

R is the exact valid V1 request for this contract and registry context

AND

W contains one exact private credential instance satisfying
every obligation in Sections 20–27
```

All private relations MUST be constrained in one proof. A prover MUST NOT satisfy separate obligations with unrelated credentials, issuers, signatures, openings, indices, or paths.

## 20. Credential Construction Binding

The circuit MUST:

1. assert the credential statement protocol version is `1`
2. assert the fixed qualification type and version
3. validate `issuedAt` and `expiresAt` schema conditions
4. rederive `credentialId` from the statement issuer ID and private issuance nonce
5. require equality with the statement credential ID
6. rederive the subject commitment from that credential ID and private subject secret
7. require equality with the statement subject commitment
8. rederive the credential commitment from the complete statement and private credential opening; and
9. reuse that exact credential ID and commitment in every later signature, leaf, and revocation relation

The circuit MUST reject all-zero `subjectSecret` or `credentialOpening` and any changed field, type, domain, field order, opening, or protocol constant.

## 21. Holder-Control Binding

Holder control is mandatory and is established by knowledge of the credential-specific `subjectSecret` that opens the statement's subject commitment under `03-commitments.md`.

The proof establishes secret knowledge, not civil identity, wallet ownership, physical presence, exclusive knowledge, or non-transferability.

`ownPublicKey()`, a wallet address, a frontend session, a signature made by the transaction wallet, or possession of the private credential package without the subject secret MUST NOT substitute for this relation.

## 22. Issuer Authentication and Authorization

The circuit MUST:

1. validate `IssuerRecordV1` and rederive its issuer ID from its nondefault secp256k1 verification key
2. require the statement issuer ID to equal the issuer-record ID
3. derive the canonical issuer leaf
4. assert `issuerIndex < nextIssuerIndex` and `issuerIndex < 65,536`
5. authenticate the issuer leaf against current `issuerRoot` using the exact 16-sibling path and index-derived directions
6. derive the credential issuer-signature message from the same credential ID and commitment; and
7. verify the issuer signature under that authenticated issuer verification key

Issuer membership and signature validity are separate mandatory relations. A registered issuer with an unrelated signature, or a valid signature from an unregistered key, MUST fail.

The issuer identity remains private in V1 proof output. V1 does not support a public or request-selected issuer constraint.

## 23. Credential Membership

The circuit MUST:

1. derive `credentialLeafV1` from the exact credential ID and credential commitment already constrained
2. assert `credentialIndex < nextCredentialIndex` and `credentialIndex < 65,536`
3. derive all 16 directions in-circuit from `credentialIndex`
4. reconstruct the credential root from the exact 16-sibling credential path; and
5. require equality with current `credentialRoot`

The credential path, index, ID, commitment, and leaf remain private.

Membership alone does not establish issuer authorization, signature validity, holder control, qualification, time validity, or non-revocation. All are required in the same proof.

## 24. Current Non-Revocation

The circuit MUST prove the canonical empty revocation leaf at exactly the same private `credentialIndex` used for credential membership.

It MUST:

1. use no independent revocation index
2. derive all path directions from the shared credential index
3. reconstruct the revocation root from `emptyRevocationLeaf` and the exact 16-sibling revocation path; and
4. require equality with current `revocationRoot`

V1 does not permit a verifier to disable revocation checking or accept a revoked credential through a request policy.

An empty revocation position proves non-revocation only when the same proof authenticates a registered credential at that index.

## 25. Qualification Equality

The private statement and public request MUST both contain:

```text
qualificationType ==
    3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7

qualificationVersion == 1
```

The circuit MUST require equality between the private statement fields and public request fields in addition to checking the fixed constants.

V1 has no generalized claim predicate. It does not prove scores, grades, age, employer, holder name, address, course result, or arbitrary attribute equality or thresholds.

## 26. Current Time and Credential Expiration

The circuit MUST enforce the timestamp rules frozen in `01-credential.md`:

```text
issuedAt > 0
expiresAt == 0 OR expiresAt > issuedAt
blockTimeGte(issuedAt)
expiresAt == 0 OR blockTimeLt(expiresAt)
```

`issuedAt` is inclusive. `expiresAt` is exclusive. `expiresAt == 0` means no expiration.

There is no raw current-time witness or prover-selected verification time. Compact's block-time predicates evaluate the protocol-recognized block time.

## 27. Validity Through the Request Deadline

To ensure a credential cannot expire between proof generation and timely verifier acceptance, the circuit MUST additionally constrain:

```text
expiresAt == 0 OR request.requestExpiresAt <= expiresAt
```

Combined with verifier acceptance only while:

```text
current verification time < requestExpiresAt
```

this proves the credential remains unexpired throughout the entire request window.

A credential expiring before the request deadline cannot satisfy that request. The verifier MAY issue a new request with an earlier deadline if operationally appropriate, but it MUST NOT weaken the credential-expiration constraint.

## 28. Request Binding

The circuit MUST bind all public request fields through the exact request digest and validate every frozen constant, deployment field, challenge, verifier context, and deadline.

The verifier MUST require:

```text
proofOutput.requestDigest ==
    qualificationRequestDigestV1(exactIssuedRequest)
```

A holder, intermediary, or verifier implementation MUST NOT:

- change the qualification, contract, registry context, verifier context, challenge, or deadline after proof generation
- accept a request digest without retaining or reconstructing the complete request
- interpret a proof for one request as satisfying a stricter, broader, or different request; or
- infer any property absent from the frozen statement

## 29. Current-State Binding

The proof output binds the exact current-state snapshot used during generation.

At acceptance time, the verifier MUST fetch current authoritative state from the request's configured contract and require:

```text
proofOutput.stateDigest ==
    qualificationStateDigestV1(currentVerificationState)
```

The verifier MUST NOT accept:

- a state supplied only by the holder
- an archived, cached, historical, or verifier-selected earlier root
- a root-age grace period
- an issuer or credential set entry in place of Merkle membership; or
- a state digest that matches generation state but not current state

This strict rule means an unrelated issuer registration, credential registration, or revocation can stale an outstanding proof because it changes an included root or counter. V1 accepts that cost to preserve exact current-state semantics.

## 30. No Historical Proof Mode

V1 proves current validity only.

It does not prove:

- validity at issuance
- validity at an arbitrary past timestamp
- membership under an archived root
- non-revocation before a later revocation
- issuer authorization under an earlier registry state; or
- a verifier-selected snapshot

Archived roots and proof artifacts MAY support operational audit, but they MUST NOT be labeled valid current qualification proofs.

## 31. Replay Resistance and Challenge Consumption

Qualification proof is request-specific and not reusable.

The verifier maintains challenge state conceptually as:

```text
ISSUED -> CONSUMED
       -> EXPIRED
       -> CANCELLED
```

The verifier MUST accept only an `ISSUED`, unexpired challenge under its own `verifierContext` and exact request.

After all cryptographic, request, state, deadline, and policy checks succeed, it MUST atomically mark the challenge `CONSUMED` before reporting acceptance. Concurrent submissions for the same challenge MUST produce at most one accepted result.

A failed, expired, cancelled, or consumed challenge MUST NOT be reissued. The verifier generates a new challenge and the holder generates a new proof.

An invalid or stale response does not by itself consume the challenge. The holder MAY retry against the same still-`ISSUED`, unexpired request, but the verifier MUST accept at most one response. A verifier MAY cancel the request after failures according to a documented abuse policy.

Challenge storage is verifier state, not JustProof contract ledger state.

## 32. No Presentation Nullifier

V1 defines no credential-derived presentation nullifier.

Replay protection uses the public verifier context, fresh challenge, deadline, and verifier-side single-use state. This avoids intentionally publishing a stable or scoped credential-derived identifier that could increase cross-request linkability.

The credential-registration nullifier in `05-ledgers.md` serves only deployment-scoped credential-ID uniqueness during registration. It MUST NOT be used as a proof nullifier, proof input, holder identifier, verifier identifier, or presentation handle.

An application requiring publicly enforceable one-use credentials or one-proof-per-scope semantics requires a separately designed protocol extension and ledger decision.

## 33. Proof Generation

The holder application MUST:

1. validate the public request structure and deployment binding
2. verify that the challenge is nonzero and the deadline has not passed
3. select one contract-scoped private credential record
4. obtain current issuer, credential, and revocation paths
5. construct one stable `QualificationWitnessV1` snapshot
6. read the current ledger state used by the circuit context
7. execute `proveQualificationV1` and satisfy every constraint
8. generate the proof using the pinned circuit artifacts
9. package the exact request, state snapshot, public output, circuit identity, network, and proof; and
10. discard transient witness copies after completion

Proof generation SHOULD occur in a holder-controlled environment. The frontend MUST treat it as an explicit asynchronous operation and MUST NOT render or log private proof material.

## 34. Off-Chain and Network Verification

Two execution environments may validate the circuit proof:

### 34.1 Network-submitted execution

When the qualification circuit is submitted as a transaction, the Midnight network verifies its proof and public transcript against the contract's execution context. The circuit still performs no JustProof ledger write.

### 34.2 Portable off-chain response

When a verifier receives a proof artifact directly, it MUST use a supported Midnight verification interface and the exact verifier key for `proveQualificationV1` to verify the proof and its complete public transcript, including the ledger-read and block-time-query commitments. It MUST then recompute the request digest, independently fetch and digest current contract state, enforce the request deadline and challenge state, and consume the challenge only after every check succeeds.

Proof-byte verification alone is insufficient in both modes. The verifier also applies every protocol check owned by `09-verification.md`.

An implementation MUST NOT claim portable off-chain verification support until the selected Midnight SDK exposes and tests the required proof, transcript, ledger-query, block-time-query, and public-output verification behavior for the pinned circuit artifacts. Manually checking the two output digests is not a substitute.

## 35. Public and Private Boundary

The public proof material is:

- network and circuit identity
- complete `QualificationProofRequestV1`
- complete public `QualificationVerificationStateV1` snapshot
- `QualificationProofPublicOutputV1`
- raw proof artifact
- proof submission and verification timing; and
- verifier challenge lifecycle metadata

The following remain private:

- complete credential statement and package
- issuance nonce, subject secret, and credential opening
- credential ID, subject commitment, and credential commitment
- issuer record and verification key within the proof
- issuer signature
- issuer and credential indices
- issuer, credential, and revocation paths
- credential, issuer, and revocation leaves; and
- the mapping from a proof to a holder, credential, or issuer

The qualification type and version are intentionally public because they are the statement requested and proven.

## 36. Disclosure Discipline

The circuit MUST complete all private derivations and assertions before disclosing only `QualificationProofPublicOutputV1`.

It MUST NOT return, emit, log, or store a private intermediate merely to aid debugging or verification.

The request and verification state are already public protocol values, but the implementation SHOULD disclose their frozen digests as the Compact output rather than returning redundant compound objects.

Test-only helper circuits MAY expose deterministic digest vectors in a dedicated test build. Production helper circuits SHOULD remain internal or pure and MUST NOT expose credential-derived values.

## 37. Privacy and Linkability

The proof reveals that someone produced a valid response for one public verifier context, challenge, deadline, qualification, deployment, and current-state digest.

It does not reveal which credential, issuer, index, or holder satisfied the statement.

Each request has a unique challenge, so request digests differ across presentations. The state digest is shared by every proof generated against the same public state and is not credential-specific.

The proof artifact and request are intentionally linkable to that verification interaction. V1 does not promise that network metadata, verifier accounts, IP addresses, browser fingerprints, path requests, wallet activity, or proof-server logs cannot link the holder.

The application MUST NOT add a credential-derived analytics ID, QR parameter, event, cookie, or presentation identifier that defeats the protocol boundary.

## 38. Proof-Server Trust Boundary

The machine that generates a zero-knowledge proof processes private witness values. The final proof may be zero knowledge while the proof server still sees the witness in clear form.

JustProof SHOULD use a local or holder-controlled proof server.

If a remote proof server is used, the holder MUST be informed of that trust decision. The implementation MUST use authenticated encrypted transport, isolate tenants, minimize retention, disable private-input logs and traces, and document deletion and incident response.

A remote verifier never needs the private witness. It receives only the public proof artifact.

## 39. Staleness and Concurrency

Proof generation begins against one current ledger snapshot. Another valid transition may change a root or counter before verification.

If the state digest no longer matches current state, the proof MUST be rejected as stale even when its cryptographic proof remains valid for the earlier snapshot.

The holder then MUST:

1. fetch current ledger state
2. refresh every affected private path
3. obtain a new request if the original challenge is no longer `ISSUED` or has expired; and
4. generate a new proof

The verifier MUST NOT consume a challenge for a proof rejected solely as stale unless its request policy intentionally cancels that attempt. It MUST nevertheless never accept two responses for one challenge.

## 40. Proof Acceptance and Outcomes

The cryptographic proof layer has two basic results:

```text
proof verifies
proof does not verify
```

The application-level verifier SHOULD distinguish at least:

```text
VALID
INVALID
COULD_NOT_VERIFY
```

`VALID` requires every cryptographic, request, state, deadline, challenge, deployment, and protocol check.

`INVALID` means a required check conclusively failed.

`COULD_NOT_VERIFY` means required authoritative state, verifier artifacts, network data, or verification infrastructure was unavailable or indeterminate. It MUST NOT be presented as `VALID`.

The exact external result object and safe diagnostic taxonomy are owned by `09-verification.md`.

## 41. What a Valid Proof Means

After complete protocol verification against current state, `VALID` means:

> The prover knew the secret state of one JustProof V1 credential for the fixed Midnight Builder demonstration qualification; the credential was correctly constructed and holder-bound, signed by the key in a currently registered issuer record, registered under the current credential root, unrevoked at the same index under the current revocation root, issued by the current block time, and unexpired through this verifier's request deadline; and the proof is bound to this exact deployment, verifier context, challenge, request, and current state.

This is an existential privacy statement. It does not reveal which credential or issuer satisfied it.

## 42. What a Valid Proof Does Not Mean

A valid V1 proof does not establish:

- the holder's legal or civil identity
- that a wallet address belongs to the holder
- that the holder has exclusive control of the subject secret
- that the credential cannot be transferred voluntarily
- an official Midnight Academy certification
- that JustProof represents Midnight Academy
- an issuer-specific constraint or public issuer identity
- a score, grade, age, identity attribute, employment status, or arbitrary claim
- validity before proof generation or after the request deadline
- validity under a later changed ledger state
- quality or truth beyond what the authorized issuer attested
- authenticity of a PDF, image, logo, QR code, or other presentation artifact; or
- anonymity against network, verifier, provider, browser, or proof-server metadata

Applications MUST communicate only the exact frozen guarantee.

## 43. Failure Conditions

Proof generation or verification MUST fail closed if any required condition fails, including:

- malformed or unsupported protocol, proof type, request, output, envelope, proof, or generated type
- wrong network, circuit, contract, registry context, verifier context, challenge, qualification, version, or deadline
- zero, reused, consumed, cancelled, unknown, or expired challenge
- request deadline reached or passed
- request digest mismatch
- current-state digest mismatch or unavailable authoritative state
- stale, caller-supplied, archived, or historical roots or counters
- malformed, mixed, missing, or inconsistent `QualificationWitnessV1` data
- invalid credential ID, subject commitment, credential commitment, issuer record, issuer signature, or leaf derivation
- invalid index, path, direction derivation, membership, or non-revocation
- revoked or unregistered credential
- unregistered issuer or invalid issuer signature
- wrong fixed qualification
- credential not yet issued, already expired, or expiring before the request deadline
- disclosure of a required private value
- wrong or untrusted verifier key; or
- unavailable proof-verification capability

Errors returned to the verifier MUST NOT reveal private credential, issuer, path, signature, opening, secret, or near-match information.

## 44. Security Properties and Limitations

Assuming the soundness and zero-knowledge properties of the generated proof system and the security of the frozen primitives, V1 provides:

- **Completeness:** a conforming holder with valid current private state can satisfy a valid request
- **Soundness:** an accepted proof implies all frozen circuit constraints held except with negligible probability
- **Zero knowledge:** private witness values are not exposed by the proof beyond the public statement
- **Credential coherence:** construction, commitments, signature, membership, holder control, and revocation bind to one credential
- **Request binding:** the proof binds every public request field through its typed digest
- **Deployment binding:** the request and state bind the contract and registry context
- **Current-state binding:** any included root or counter change stales the proof
- **Temporal horizon:** a timely accepted proof establishes non-expiration through the request deadline
- **Replay resistance:** fresh single-use challenges prevent verifier acceptance of the same response twice; and
- **Issuer privacy:** the currently authorized issuer remains private within the proof

V1 does not prevent:

- witness or private-state exfiltration before proving
- compromise or malicious operation of a remote proof server
- correlation through public request, network, timing, wallet, browser, path-provider, or verifier metadata
- voluntary credential and subject-secret sharing
- denial of service or loss of private credential or tree-provider state
- a verifier from deliberately sharing a proof it received
- state churn from causing frequent proof regeneration; or
- an authorized issuer from issuing a misleading credential

## 45. Non-Goals

V1 does not provide:

- multiple proof types
- arbitrary claims, dynamic predicates, thresholds, or selective field disclosure
- issuer-constrained or issuer-disclosing proof requests
- optional expiration, revocation, membership, authorization, or holder-control policies
- reusable, bearer, offline-indefinite, or historical qualification proofs
- public credential-derived presentation nullifiers
- one-use credential consumption
- verifier anonymity
- proof of legal identity, personhood, or non-transferability
- proof generation without trusted handling of the private witness
- protocol-defined raw proof serialization independent of the pinned Midnight toolchain; or
- acceptance without current authoritative state and the exact verifier key

## 46. Normative Invariants

Every conforming V1 proof implementation MUST preserve these invariants:

1. V1 has exactly one proof type with `proofType == 1`.
2. The public qualification type and version equal the frozen demonstration qualification.
3. Every request uses the exact normative record and field order.
4. Every request binds the executing contract and sealed registry context.
5. Every request binds a nonzero verifier context and fresh nonzero 32-byte challenge.
6. Every request has an exclusive nonzero deadline enforced with `blockTimeLt`.
7. The exact typed request produces the exact request digest.
8. Current contract state produces the exact state record and state digest.
9. Roots, counters, contract, registry context, time, and digests never come from witnesses as authority.
10. The public output contains exactly the request digest and state digest.
11. The private input is semantically exactly `QualificationWitnessV1`.
12. Credential ID, both commitments, issuer message, leaves, and roots are rederived in-circuit.
13. The statement issuer ID equals the authenticated issuer-record ID.
14. Issuer membership and signature validity are both mandatory.
15. Credential membership uses the current credential root and counter.
16. Non-revocation uses the current revocation root at the same credential index.
17. All paths contain exactly 16 siblings and all directions derive from indices.
18. Holder control requires the exact nonzero subject secret.
19. Current block time is at or after `issuedAt` and before any nonzero `expiresAt`.
20. A nonzero `expiresAt` is at or after the public request deadline.
21. No arbitrary claim, issuer constraint, validity option, historical state, or private request exists.
22. Qualification proof performs no ledger write or credential-specific event emission.
23. The proof discloses only `QualificationProofPublicOutputV1` from private computation.
24. Off-chain verification recomputes the request digest and current-state digest independently.
25. State changes invalidate earlier proofs without a grace period.
26. The verifier accepts a challenge at most once and consumes it only after full success.
27. No credential-derived presentation nullifier exists in V1.
28. Proof bytes alone never establish protocol validity.
29. Unavailable current state or verifier artifacts produce failure, never acceptance.
30. Browser, Node, network-submitted, and portable verification preserve the same statement.

## 47. Required Test Vectors and Tests

Before V1 is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- both domain-tag constants
- request digest with every request field set to fixed values
- request digest changes for each individually changed field
- verification-state digest with fixed contract, context, roots, and counters
- state digest changes for each individually changed root or counter; and
- the exact two-field public output

### 47.1 Request tests

- accept the exact supported protocol, proof type, qualification, deployment, verifier context, challenge, and future deadline
- reject wrong versions, proof type, qualification, contract, registry context, or verifier context
- reject zero, reused, unknown, consumed, cancelled, or expired challenges
- reject zero or reached deadlines
- reject request mutation after proof generation
- require a fresh CSPRNG challenge for every newly issued request while permitting retries only against the same still-issued request; and
- atomically accept at most one concurrent response for a challenge

### 47.2 Credential and holder tests

- accept a correctly derived credential ID and both commitment openings
- reject a changed statement, issuance nonce, subject secret, credential opening, domain, or field order
- reject mixed material from different credentials; and
- reject `ownPublicKey()`, wallet identity, or package possession as a holder-control substitute

### 47.3 Issuer tests

- accept the exact issuer record, current membership path, and valid credential signature
- reject another issuer ID, verification key, index, path, root, signature, or message
- reject a valid signature from an unregistered key
- reject a registered issuer paired with another issuer's signature; and
- confirm issuer identity and key remain absent from the public output

### 47.4 Credential and revocation tree tests

- accept exact current credential membership and empty revocation membership at one shared index
- reject wrong, shortened, reordered, stale, or cross-tree paths
- reject a second index or witness-supplied direction vector
- reject an unregistered credential, out-of-range index, or revoked position; and
- reject caller-supplied roots or counters even when internally self-consistent

### 47.5 Qualification and time tests

- accept the exact fixed qualification and reject every other type or version
- accept `issuedAt` exactly at current block time
- reject `issuedAt` after current block time
- accept `expiresAt == 0`
- accept a nonzero `expiresAt` strictly after current block time and at or after request deadline
- reject at exactly `expiresAt`
- reject a credential valid at proof generation but expiring before request deadline
- accept `expiresAt == requestExpiresAt` while verification occurs before the deadline; and
- reject proof generation or verification at exactly `requestExpiresAt`

### 47.6 State freshness tests

- verify against the exact current issuer root, issuer counter, credential root, credential counter, and revocation root
- reject after any included field changes, including an unrelated append
- reject a stale proof even when the raw cryptographic proof verifies for its old state
- reject archived or holder-supplied state; and
- regenerate successfully after current paths and state are refreshed

### 47.7 Proof and privacy tests

- verify with the exact `proveQualificationV1` verifier key and reject another key or circuit
- reject malformed proof bytes, public output, request digest, or state digest
- confirm that proof verification needs no private credential or witness
- confirm that the public artifact contains no issuer, credential ID, commitment, leaf, index, path, signature, opening, secret, or private timestamp
- confirm that no JustProof ledger field changes during qualification proof
- confirm that no credential-specific event is emitted; and
- audit proof-server, application, telemetry, error, and presentation paths for private-data leakage

## 48. Specification Ownership and Dependencies

This document is authoritative for:

- the single V1 proof type
- `QualificationProofRequestV1` and its digest
- `QualificationVerificationStateV1` and its digest
- `QualificationProofPublicOutputV1`
- the exported qualification-proof statement and circuit semantics
- challenge, deadline, replay, state-freshness, and temporal-horizon rules
- the absence of a presentation nullifier and historical proof mode
- proof generation, artifact, privacy, staleness, and outcome semantics; and
- proof-specific test vectors and tests

`01-credential.md` is authoritative for credential structure, construction, issuer signature, holder binding, qualification constants, timestamps, and the complete current-validity obligations.

`02-issuer-registry.md` is authoritative for issuer records, signatures, membership, and authorization state.

`03-commitments.md` is authoritative for both private openings and exact commitment relations.

`04-revocation.md` is authoritative for current non-revocation at the credential index.

`05-ledgers.md` is authoritative for current public state, read-only verification, no-history semantics, and disclosure boundaries.

`06-merkle-tree.md` is authoritative for credential leaves, paths, indices, node construction, and current-root reconstruction.

`07-witnesses.md` is authoritative for `QualificationWitnessV1`, private-state sourcing, witness trust, and proof-generation privacy.

`09-verification.md` MUST freeze verifier-key resolution, artifact parsing, current-state acquisition, digest recomputation, challenge-state transitions, outcomes, and safe result communication without weakening this proof statement.

`10-specification.md` MUST consolidate this exact request, state, output, and statement. It MUST reject the earlier draft's generic claims, optional revocation, issuer constraints, historical roots, reusable proofs, optional challenge binding, and speculative presentation nullifier.

## 49. Implementation References

Implementations should be checked against the official Midnight documentation for the pinned toolchain:

- [Compact language reference](https://docs.midnight.network/compact/reference/compact-reference)
- [Compact standard-library exports](https://docs.midnight.network/compact/standard-library/exports)
- [Compact smart-contract security](https://docs.midnight.network/compact/smart-contract-security)
- [Midnight security and best practices](https://docs.midnight.network/guides/security-best-practices)
- [Smart contracts on Midnight](https://docs.midnight.network/concepts/how-midnight-works/smart-contracts)
- [Using the Compact JavaScript implementation](https://docs.midnight.network/guides/use-compact-javascript-implementation)
- [Compact toolchain `0.31.0`](https://docs.midnight.network/relnotes/compact/toolchain-0.31.0)

## 50. Final Protocol Principle

The JustProof V1 proof establishes one deliberately narrow statement:

> A holder-controlled private credential for the fixed JustProof Midnight Builder demonstration qualification satisfies every frozen authenticity and current-validity rule for this exact deployment, verifier, challenge, request deadline, and current ledger state—without revealing the credential or issuer.

The proof is not reusable, is not historical, does not establish identity, and does not expose a generalized credential framework.

Its privacy comes from proving one exact statement and revealing only the request and state digests needed to verify that statement.
