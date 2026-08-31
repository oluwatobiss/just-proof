# JustProof Commitment Protocol

- **Status:** Frozen
- **Protocol:** JustProof Credential Protocol V1
- **Specification revision:** `1.0.0`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Purpose

This document defines the security, randomness, privacy, opening, implementation, and testing requirements for the two persistent commitments used by JustProof V1:

1. the holder-binding `subjectCommitment`; and
2. the statement-hiding `credentialCommitment`

The exact committed values and field order are frozen in `01-credential.md` and reproduced here without modification.

A JustProof commitment establishes a binding between a typed private value, a private 32-byte opening, and a 32-byte commitment output. It does not by itself establish issuer authorization, issuer signature validity, credential-registry membership, holder control, current non-revocation, expiration validity, or satisfaction of a proof request.

## 2. Normative Language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

Where a conceptual record is shown, its field names, field order, and Compact types are normative unless the text explicitly says otherwise.

## 3. Freeze Scope

This specification freezes the following V1 decisions:

- V1 uses `persistentCommit<T>`, not a plain hash, for both commitment constructions
- the `subjectSecret` is the mandatory opening of the subject commitment
- the `credentialOpening` is the mandatory opening of the credential commitment
- both openings are fresh, independently generated, unpredictable, nonzero `Bytes<32>` values
- commitment openings are never reused across credentials or commitment purposes
- Compact typed values, not manually serialized bytes or JSON, enter the commitment primitive
- the two commitment purposes use distinct frozen domain tags
- neither commitment is required to be a standalone public ledger field
- commitment verification is performed by rederivation and equality constraints inside the proof circuit; and
- credential registration, signature, revocation, and presentation operations do not mutate either commitment

Changing the primitive, committed type, field name, field order, domain tag, opening type, opening ownership, freshness rule, privacy boundary, or semantic meaning defined here requires a new protocol version. Editorial clarification that does not change behavior MAY retain V1.

## 4. Compact V1 Baseline

The V1 contract implementation MUST begin with:

```compact
pragma language_version 0.23;
```

The implementation MUST import `persistentCommit` and any required types from `CompactStandardLibrary`.

The normative primitive is:

```compact
circuit persistentCommit<T>(value: T, rand: Bytes<32>): Bytes<32>;
```

JustProof calls the `rand` argument the **commitment opening**. For the two V1 constructions, the concrete openings are `subjectSecret` and `credentialOpening`.

`persistentCommit` is selected because its `Bytes<32>` result is persistent across upgrades and its sufficiently random opening provides hiding protection for private committed inputs. `transientCommit` MUST NOT replace it because transient outputs are not guaranteed to remain stable across upgrades.

`persistentHash` MUST NOT replace either V1 commitment. A hash is appropriate for persistent identifiers and authentication digests, but it does not supply the same hiding treatment or disclosure behavior as a commitment with a secret random opening.

## 5. Terminology

| Term                   | Definition                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Committed value**    | The typed first argument to `persistentCommit<T>`.                                                                        |
| **Opening**            | The private `Bytes<32>` second argument to `persistentCommit<T>`.                                                         |
| **Commitment output**  | The resulting `Bytes<32>` value.                                                                                          |
| **Open a commitment**  | Rederive it from the exact typed value and opening and assert equality with the expected commitment.                      |
| **Subject secret**     | The holder-generated opening of the subject commitment and the secret whose knowledge establishes credential control.     |
| **Credential opening** | The issuer-generated opening of the credential commitment.                                                                |
| **Binding**            | The property preventing a commitment from being opened to a different committed value except with negligible probability. |
| **Hiding**             | The property preventing observers from learning or testing the committed value without the unpredictable opening.         |
| **Domain tag**         | A frozen public `Bytes<32>` value included in the typed committed value to separate protocol purposes.                    |
| **Opening reuse**      | Using the same opening for more than one commitment. It is forbidden in V1.                                               |

The term **salt** is not used normatively in JustProof. A salt is often public, while a V1 commitment opening MUST remain private. The domain tag is public and is not a salt, blinding secret, or substitute for randomness.

## 6. Primitive Types

| Value                 | Compact type            |
| --------------------- | ----------------------- |
| Protocol version      | `Uint<16>`              |
| Domain tag            | `Bytes<32>`             |
| Credential ID         | `Bytes<32>`             |
| Subject secret        | `Bytes<32>`             |
| Subject commitment    | `Bytes<32>`             |
| Credential opening    | `Bytes<32>`             |
| Credential commitment | `Bytes<32>`             |
| Credential statement  | `CredentialStatementV1` |

The V1 protocol version value is:

```text
1
```

All byte strings in application storage or transport MUST use a documented encoding. Lowercase hexadecimal without a `0x` prefix is RECOMMENDED. Transport encoding MUST NOT change the Compact value entering `persistentCommit`.

## 7. Commitment Domain Tags

Each domain tag is the 32-byte SHA-256 digest of the exact UTF-8 label shown below.

| Purpose               | UTF-8 label                   | `Bytes<32>` hexadecimal                                            |
| --------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Subject commitment    | `JP:SUBJECT:COMMITMENT:V1`    | `d0f8ef87f028847a80da0f254686e455ee2548625ca7d6f0fc030246c12cb5b2` |
| Credential commitment | `JP:CREDENTIAL:COMMITMENT:V1` | `c1d6eaac074956c51c0cd0c751db4f42a100c8040e73c45cbe8f50fe4a34ae82` |

Implementations MUST embed or deterministically reproduce the exact 32-byte values. They MUST NOT pass the variable-length labels directly where a `Bytes<32>` domain field is required.

The domain is included as a field of the committed typed value. It is not prepended through string concatenation and is not passed as the commitment opening.

The two domains MUST NOT be interchanged or reused for identifiers, signatures, Merkle leaves, Merkle nodes, registry approvals, revocation messages, or future commitment purposes.

## 8. Compact Typed Representation

V1 commits directly to typed Compact values. It does not define or require a separate canonical byte-serialization format.

Field names, field order, nested record structure, and Compact types are part of each construction. Implementations MUST NOT replace the typed input with:

- JSON or canonical JSON
- JavaScript object serialization or property insertion order
- delimiter-based strings
- UTF-8 concatenation of displayed field values
- hexadecimal text
- database rows
- CBOR, MessagePack, or protocol buffers
- a PDF, image, QR code, or human-readable certificate; or
- a hash of any of those representations

TypeScript code MUST use Compact-compatible generated bindings or runtime behavior that reproduces the exact typed Compact result. A frontend-computed value is not conformant merely because its displayed hexadecimal length is correct.

## 9. Commitment Semantics

For a typed value `v` and opening `r`, define:

```text
CommitV1<T>(v, r) = persistentCommit<T>(v, r)
```

Opening verification is:

```text
OpenV1<T>(expected, v, r) =
    (persistentCommit<T>(v, r) == expected)
```

There is no separate decommitment token or reveal operation. The opening relation is proved by rederivation and equality.

The primitive is deterministic for the complete pair `(v, r)`:

```text
CommitV1(v, r) == CommitV1(v, r)
```

It is not deterministic for `v` alone. With independently sampled openings `r1` and `r2`:

```text
r1 != r2

CommitV1(v, r1) != CommitV1(v, r2)
```

except with negligible probability.

The draft rule that identical credentials always produce identical commitments is not part of V1. Fresh openings are mandatory.

## 10. Required Security Properties

### 10.1 Binding

A prover MUST NOT be able to open one commitment to two different committed values except with negligible probability under the security assumptions of `persistentCommit`.

Binding depends on the complete typed input. Changing a field value, type, order, nested structure, protocol version, domain tag, or opening MUST change the resulting commitment except with negligible probability.

### 10.2 Hiding

An observer who does not know the opening SHOULD NOT be able to determine or enumerate the committed value from the commitment output.

Hiding requires an unpredictable opening. Domain separation alone does not hide low-entropy values. A timestamp, counter, UUID, name, email address, credential ID, issuer ID, wallet address, or public hash is not an acceptable substitute for a fresh random opening.

### 10.3 Purpose separation

A value committed for holder binding MUST NOT be accepted as a credential-statement commitment, or vice versa. The distinct typed values and domain tags enforce this separation.

### 10.4 Persistence

The same typed value and opening MUST reproduce the same `Bytes<32>` commitment across conforming V1 implementations and supported upgrades. This persistence is why `persistentCommit` is required for protocol state derivation.

## 11. Randomness Requirements

Every `subjectSecret` and `credentialOpening` MUST:

- contain 32 bytes sampled from a cryptographically secure random source
- be freshly generated for exactly one credential and one commitment purpose
- be unpredictable to every party that is not intended to know it
- be nonzero
- remain private; and
- be stored and transported without truncation, normalization, or text-to-byte ambiguity

If a CSPRNG returns 32 zero bytes, the implementation MUST discard the value and resample.

The implementation MUST NOT generate an opening from:

- `Math.random()` or another non-cryptographic pseudorandom generator
- the current time, block height, transaction ID, or sequential counter
- a UUID without an explicit 256-bit CSPRNG guarantee
- a holder or issuer name, email, password, PIN, wallet address, or device identifier
- a wallet seed or wallet private key
- an issuance nonce, credential ID, issuer ID, or another protocol secret; or
- a deterministic application default

`issuanceNonce`, `subjectSecret`, and `credentialOpening` MUST be independently sampled values. They MUST NOT be equal, copied, or derived from one another. Sampling them from the same correctly seeded operating-system CSPRNG is permitted; protocol-level reuse or derivation is not.

## 12. Opening Ownership and Delivery

| Opening             | Generator | Required recipients                                                         | Forbidden recipients by default                             |
| ------------------- | --------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `subjectSecret`     | Holder    | Holder only                                                                 | Issuer, verifier, registry provider, analytics, logs        |
| `credentialOpening` | Issuer    | Issuer during creation; holder through a confidential authenticated channel | Verifier, public ledger, registry provider, analytics, logs |

The holder MUST generate `subjectSecret` locally before sending `subjectCommitment` to the issuer. The holder sends the commitment output, not the opening.

The issuer MUST generate `credentialOpening` while creating the credential and MUST deliver it as part of the private credential package. If the holder does not receive the exact opening, the credential cannot be opened in a proof and is unusable.

The issuer MAY retain the credential opening according to its private issuance and recovery policy, but retention MUST NOT make it public. V1 does not provide issuer recovery of a lost holder subject secret.

## 13. Subject Commitment

The subject commitment provides credential-specific holder binding.

The normative committed value is:

```text
SubjectCommitmentValueV1 {
    domain: Bytes<32>
    protocolVersion: Uint<16>
    credentialId: Bytes<32>
}
```

The field order is normative. Construction is:

```text
subjectCommitment =
    persistentCommit<SubjectCommitmentValueV1>(
        {
            domain: DOMAIN_SUBJECT_COMMITMENT_V1,
            protocolVersion: 1,
            credentialId
        },
        subjectSecret
    )
```

The circuit MUST assert:

```text
subjectSecret != default<Bytes<32>>
```

`subjectSecret` is the opening, not a field inside `SubjectCommitmentValueV1`. The phrase “commitment to the subject secret” means a holder-binding commitment opened by that secret; it does not mean that the secret is redundantly included as both value and opening.

Including `credentialId` in the committed value makes the binding credential-specific. Even if an implementation violated the no-reuse rule, the committed value would still differ across credentials with different IDs. This defense in depth does not permit opening reuse.

The subject commitment does not contain a holder name, email, wallet address, decentralized identifier, government identifier, or reusable subject identifier.

## 14. Subject-Commitment Verification

A holder-control proof MUST privately supply the exact `subjectSecret` and credential ID and constrain:

```text
expectedSubjectCommitment ==
    persistentCommit<SubjectCommitmentValueV1>(
        {
            domain: DOMAIN_SUBJECT_COMMITMENT_V1,
            protocolVersion: 1,
            credentialId
        },
        subjectSecret
    )
```

The `expectedSubjectCommitment` MUST be the value contained in the same private `CredentialStatementV1` used by the proof. A caller-supplied commitment not bound to that statement is insufficient.

Successful opening proves knowledge of the credential-specific subject secret. It does not prove the holder's civil identity, legal ownership, non-transferability, physical presence, or exclusive knowledge of the secret.

## 15. Credential Commitment

The credential commitment hides and binds the complete V1 credential statement.

The normative committed value is:

```text
CredentialCommitmentValueV1 {
    domain: Bytes<32>
    statement: CredentialStatementV1
}
```

The field order is normative. Construction is:

```text
credentialCommitment =
    persistentCommit<CredentialCommitmentValueV1>(
        {
            domain: DOMAIN_CREDENTIAL_COMMITMENT_V1,
            statement
        },
        credentialOpening
    )
```

The circuit MUST assert:

```text
credentialOpening != default<Bytes<32>>
```

`CredentialStatementV1`, including its exact field order, types, qualification constants, and timestamp semantics, is frozen in `01-credential.md`.

The credential commitment binds:

- protocol version
- credential ID
- issuer ID
- subject commitment
- qualification type
- qualification schema version
- issuance time; and
- expiration time

It does not directly contain the issuance nonce, subject secret, credential opening, issuer signature, issuer verification key, Merkle position, Merkle path, registry root, revocation state, revocation time, presentation request, or human-readable certificate metadata.

## 16. Credential-Commitment Verification

A credential proof MUST privately supply the exact statement and credential opening and constrain:

```text
expectedCredentialCommitment ==
    persistentCommit<CredentialCommitmentValueV1>(
        {
            domain: DOMAIN_CREDENTIAL_COMMITMENT_V1,
            statement
        },
        credentialOpening
    )
```

The expected commitment MUST be the same value used by both:

- the credential-registry leaf authenticated against the current credential root; and
- the issuer signature message authenticated under the registered issuer key.

A prover MUST NOT combine one statement's opening, another credential's registry leaf, and a third credential's issuer signature.

## 17. Nested Binding and Construction Order

V1 uses the following dependency order:

```text
issuerId
    -> credentialId
    -> subjectCommitment
    -> CredentialStatementV1
    -> credentialCommitment
    -> issuerSignatureMessage
    -> issuerSignature
```

The dependencies are deliberate:

1. `credentialId` binds the issuer ID and private issuance nonce.
2. `subjectCommitment` binds the credential ID and is opened by the holder's subject secret.
3. `CredentialStatementV1` includes the credential ID, issuer ID, and subject commitment.
4. `credentialCommitment` binds and hides the complete statement.
5. the issuer signature message binds the credential ID and credential commitment.

This order prevents circular construction. Neither commitment contains its own output, and the issuer signature is not inside the credential statement or credential commitment.

## 18. Hashes Are Not Commitments

V1 uses `persistentHash` and `persistentCommit` for different purposes.

| Protocol object           | Primitive          | Reason                                                                |
| ------------------------- | ------------------ | --------------------------------------------------------------------- |
| Credential ID             | `persistentHash`   | Stable issuance identifier derived with a private high-entropy nonce. |
| Subject commitment        | `persistentCommit` | Credential-specific holder binding with a private opening.            |
| Credential commitment     | `persistentCommit` | Long-term hiding and binding of the private statement.                |
| Issuer signature message  | `persistentHash`   | Stable digest authenticated by the issuer signature.                  |
| Issuer ID and issuer leaf | `persistentHash`   | Persistent registry identity and authenticated-tree state.            |
| Merkle leaves and nodes   | `persistentHash`   | Persistent authenticated-state derivation.                            |

Domain separation does not convert `persistentHash` into a hiding commitment. Adding a secret as an ordinary hash field is not the frozen V1 commitment construction.

An implementation MUST NOT use:

```text
persistentHash(statement)
persistentHash(statement, credentialOpening)
persistentHash(subjectSecret)
persistentHash(credentialId, subjectSecret)
```

as a substitute for either exact `persistentCommit` construction.

## 19. Privacy and Disclosure Boundary

The following values are private by default:

- subject secret
- subject commitment
- credential statement
- credential opening
- credential commitment; and
- the Merkle leaves and authentication paths that contain or authenticate commitment-derived values

The issuer necessarily receives the subject commitment during issuance and creates the credential commitment. This protocol sharing does not make either value public ledger state.

The public credential root authenticates the credential registry. V1 does not require individual credential IDs, subject commitments, credential commitments, or credential leaves to appear as standalone ledger fields or exported circuit outputs.

`persistentCommit` permits its result to cross a Compact disclosure boundary without revealing the private value when the opening is sufficiently random. That cryptographic property does not require the application to publish the result. Keeping commitment outputs private by default prevents them from becoming stable correlation handles across requests, logs, or presentations.

A proof request MAY explicitly disclose a commitment only when its verification semantics require that exact value. Such disclosure MUST be documented in the proof statement and MUST NOT also disclose its opening.

Implementations MUST NOT place openings or private commitments in:

- ledger fields or events not required by a frozen specification
- circuit return values
- URLs, query strings, QR codes, or browser history
- application, proof-server, analytics, or crash logs
- screenshots or human-readable certificates
- unencrypted local storage or backups; or
- verifier responses

## 20. Commitment Linkability

A commitment output is stable for one exact value/opening pair. If the same commitment is disclosed more than once, observers can link those disclosures even though they cannot open the commitment.

Fresh openings prevent two independently issued credentials with otherwise identical statements from receiving the same credential commitment. The credential ID and subject commitment also differ because each issuance uses fresh independent secret material.

V1 does not rerandomize a credential commitment for each presentation. Presentation unlinkability therefore depends on keeping the credential commitment private inside the zero-knowledge proof unless a proof statement intentionally exposes it.

Creating a presentation-specific hash of the credential commitment does not automatically prevent correlation and is not part of V1.

## 21. Opening Reuse and Compromise

An opening MUST NOT be reused:

- for two subject commitments
- for two credential commitments
- once as a subject secret and once as a credential opening
- between JustProof and another protocol; or
- after a failed, abandoned, corrected, or reissued credential flow

Reusing an opening can link otherwise unrelated commitments and increases the impact of an opening compromise.

If `subjectSecret` is disclosed, the recipient can satisfy the holder-control relation for that credential when it also has the remaining private credential package and witness data. The holder SHOULD treat the credential as compromised.

If `credentialOpening` is disclosed, an observer who also obtains the credential commitment can test candidate statements. Disclosure of the credential opening alone does not prove holder control because `subjectSecret` remains separate.

If either opening is lost, V1 provides no cryptographic recovery. The affected credential cannot satisfy every required proof constraint. Recovery requires a new issuance with a fresh issuance nonce, subject secret, credential opening, credential ID, and commitment outputs.

## 22. Commitment Immutability and Reissuance

After issuance, `subjectCommitment` and `credentialCommitment` are immutable.

Credential registration MUST NOT change either value. Revocation MUST NOT change or delete either value. Expiration is derived from the immutable statement and current block time; it does not mutate a commitment.

A correction, replacement, recovery, or reissuance MUST create a new credential instance with:

- a fresh issuance nonce
- a new credential ID
- a fresh subject secret
- a new subject commitment
- a fresh credential opening; and
- a new credential commitment

The prior credential remains immutable and MAY be revoked according to the revocation specification.

An implementation MUST NOT reuse the prior subject secret or credential opening merely because some semantic statement fields remain unchanged.

## 23. Commitment Relationship to Registry State

The credential registry authenticates the pair:

```text
credentialId
credentialCommitment
```

using the credential-leaf construction frozen by the Merkle-tree specification.

The credential commitment is not itself the registry root, credential ID, leaf, index, or path. A matching commitment does not prove registration; the proof must also authenticate the corresponding credential leaf against the authoritative current credential root.

The issuer registry uses persistent hashes and Merkle membership to authenticate issuer records. It does not use either commitment defined here and MUST NOT treat a commitment as issuer authorization.

## 24. Signature and Revocation Relationships

The issuer signs a domain-separated `persistentHash` message containing exactly:

```text
protocolVersion
credentialId
credentialCommitment
```

plus the signature-message domain frozen in `01-credential.md`.

The signature authenticates the commitment output; it does not open the commitment. The credential commitment authenticates the statement when correctly opened; it does not authenticate the issuer. A V1 proof requires both relations.

Credential revocation is keyed to credential-specific registry state defined by the revocation specification. Revocation does not alter the statement or commitment, and an unrevoked result does not prove that a commitment is correctly opened.

## 25. Failure Conditions

Commitment verification MUST fail closed if any of the following holds:

- the protocol version is not `1`
- a domain tag differs from the frozen value
- a field name, field order, Compact type, or nested structure differs from V1
- the subject secret or credential opening is all zero
- the supplied opening is incorrect
- the credential ID used for holder binding differs from the statement's credential ID
- the expected subject commitment differs from the statement's subject commitment
- the expected credential commitment differs from the registry and signature value
- any credential-statement field is changed
- a hash or transient commitment substitutes for `persistentCommit`
- JSON, strings, presentation media, or application serialization substitutes for the typed input; or
- private material from different credentials is mixed

Randomness generation MUST fail closed if a CSPRNG is unavailable or returns an invalid-length value. An implementation MUST NOT silently fall back to a weaker source.

## 26. Security Properties and Limitations

Assuming secure independent openings and the security of `persistentCommit`, V1 provides:

- **Statement binding:** the credential commitment binds every frozen statement field
- **Statement hiding:** the credential opening prevents enumeration of a private statement from its commitment
- **Credential-specific holder binding:** the subject commitment binds the credential ID to the holder's subject secret
- **Purpose separation:** distinct domains and types prevent commitment substitution
- **Issuance unlinkability at the commitment layer:** fresh openings prevent equal semantic values from producing equal commitments; and
- **Persistent verification:** commitments can be rederived consistently across conforming implementations and upgrades

The commitment layer does not prevent:

- an authorized issuer from committing to a false statement
- the issuer from knowing the statement or credential opening it created
- a holder from transferring its subject secret and private credential package
- linkability when a stable commitment is intentionally disclosed repeatedly
- compromise through logs, storage, backups, remote proof services, or application metadata
- loss of use when an opening is lost; or
- a malicious implementation from using weak randomness outside the proof relation

Randomness quality cannot generally be proven from a commitment output. Conformance therefore depends on secure application-side generation, code review, testing, and operational controls.

## 27. Normative Invariants

Every conforming V1 implementation MUST preserve these invariants:

1. Both V1 commitments use `persistentCommit<T>` and return `Bytes<32>`.
2. The subject commitment uses exactly `SubjectCommitmentValueV1` and `subjectSecret`.
3. The credential commitment uses exactly `CredentialCommitmentValueV1` and `credentialOpening`.
4. The committed records preserve their frozen field names, order, nested types, domains, and protocol version.
5. The subject commitment uses the subject-commitment domain and no other domain.
6. The credential commitment uses the credential-commitment domain and no other domain.
7. Both openings are fresh, independently sampled, unpredictable, nonzero 32-byte values.
8. An opening is never reused across credentials, purposes, or protocols.
9. The subject secret is generated and retained by the holder and is not sent to the issuer.
10. The credential opening is generated by the issuer and confidentially delivered to the holder.
11. `issuanceNonce`, `subjectSecret`, and `credentialOpening` remain distinct.
12. Commitment inputs use Compact typed representation, not application serialization.
13. The subject commitment in the statement is opened using the same statement credential ID.
14. The credential commitment binds the complete same statement used by every other proof constraint.
15. The same credential commitment is bound into both the credential leaf and issuer signature message.
16. A commitment output is not treated as proof of issuer authorization, signature validity, registration, holder control, non-revocation, expiration validity, or qualification satisfaction.
17. Registration, revocation, expiration, and presentation do not mutate commitments.
18. Reissuance uses fresh values for all three private randomness roles and produces new commitment outputs.
19. Openings never enter public ledger state, events, exported outputs, logs, analytics, URLs, or presentation artifacts.
20. Commitment outputs remain private unless a frozen proof statement explicitly discloses them.
21. Verification fails closed on an incorrect opening, typed value, domain, version, or cross-credential mix.

## 28. Required Test Vectors and Tests

Before a V1 implementation is considered conformant, it MUST include Compact/TypeScript cross-runtime vectors for:

- both domain-tag constants
- `SubjectCommitmentValueV1` with a fixed credential ID and subject secret
- `CredentialCommitmentValueV1` with a complete fixed `CredentialStatementV1` and credential opening
- repeated derivation using the same typed value and opening
- the same typed value with two different openings
- every credential-statement field changed independently
- subject and credential commitment domain substitution
- wrong protocol versions
- all-zero and one-bit-different openings; and
- the complete dependency chain from credential ID through issuer signature message

The suite MUST also test:

- generation of 32-byte subject secrets and credential openings from the selected CSPRNG
- rejection or resampling of all-zero openings
- application prevention of intentional opening reuse
- correct holder-only handling of the subject secret
- confidential delivery and exact recovery of the credential opening
- failure with an incorrect subject secret
- failure with an incorrect credential opening
- failure when subject secret and credential opening are swapped
- failure when the subject commitment comes from another statement
- failure when the credential commitment comes from another registry leaf
- failure when the issuer signature authenticates another commitment
- failure for JSON, field-order, byte-order, and string-concatenation substitutes
- immutability through registration and revocation
- complete regeneration during reissuance; and
- absence of openings and private commitments from ledger state, events, outputs, logs, analytics, URLs, browser history, and presentation artifacts

A changed cryptographic vector is a protocol change, not an ordinary regression update.

## 29. Specification Ownership and Dependencies

`01-credential.md` is authoritative for:

- `CredentialStatementV1`
- `SubjectCommitmentValueV1` and subject-commitment construction
- `CredentialCommitmentValueV1` and credential-commitment construction
- ownership of `subjectSecret` and `credentialOpening`; and
- the credential ID and issuer signature message surrounding the commitments

This document is authoritative for:

- commitment security interpretation
- randomness quality, independence, nonzero, and non-reuse requirements
- opening handling, compromise, loss, and delivery rules
- typed-representation implementation constraints
- commitment privacy and disclosure boundaries
- commitment linkability analysis; and
- commitment-specific conformance tests

`06-merkle-tree.md` MUST bind the exact credential ID and credential commitment into the credential leaf without changing either value.

`07-witnesses.md` MUST deliver openings and private statement data without treating witness results as trusted. Proof circuits MUST constrain them using the exact equality relations defined here.

`08-proofs.md` and `09-verification.md` MUST keep commitments private unless an explicit frozen proof statement requires disclosure, and MUST distinguish a correctly opened commitment from issuer authorization, registry membership, and current validity.

The revocation specification MUST NOT mutate a credential commitment or infer non-revocation from successful commitment opening.

## 30. Final Protocol Principle

The commitment layer establishes two narrow statements:

> The prover knows the credential-specific subject secret that opens the subject commitment in this credential statement.

> This private credential statement and credential opening reproduce the credential commitment authenticated by the registry and issuer signature.

Neither statement is sufficient alone. JustProof V1 combines them with issuer membership, issuer-signature verification, credential membership, current non-revocation, time validity, qualification constraints, and request binding to produce a valid qualification proof.
