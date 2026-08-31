# JustProof

> **Prove your qualification. Keep your certificate private.**

- **Status:** Frozen for V1 implementation
- **Proposal revision:** `1.0.0`
- **Protocol:** JustProof Credential Protocol V1
- **Protocol baseline:** `10-specification.md` revision `1.0.1`
- **Frozen on:** `2026-08-31`
- **Compact language:** `0.23`
- **Compact toolchain:** `0.31.0`
- **Compact runtime:** `0.16.0`

## 1. Executive Summary

JustProof is a privacy-preserving qualification-verification application built on Midnight.

It allows a person to prove that they control a currently valid qualification credential issued by an approved issuer without giving the verifier the underlying certificate or revealing which credential, issuer, or holder satisfied the request.

The verifier receives a request-specific zero-knowledge proof instead of a copy of the certificate. JustProof checks the proof against the deployment's current issuer, credential, and revocation state and returns a clear verification outcome.

JustProof V1 deliberately proves one narrow statement:

> A holder-controlled private credential for the fixed JustProof Midnight Builder demonstration qualification was correctly constructed, authenticated by a currently registered issuer, registered under current credential state, unrevoked at the same index under current revocation state, and unexpired through this verifier's exact request deadline.

This narrow scope makes the first implementation realistic, auditable, and suitable for demonstrating why programmable privacy is valuable for credential verification.

## 2. The Problem

Proving a professional or educational qualification commonly requires revealing the qualification document itself.

A job applicant, course participant, event attendee, professional-community member, or benefit applicant may be asked to upload a certificate, diploma, badge, transcript, or related record.

That document can reveal far more information than the verifier needs, including:

- the holder's full name
- certificate or student number
- date of birth
- issuing institution
- course details
- grades or scores
- photograph or signature
- dates and document metadata; and
- other personally identifying information

In many cases, the verifier needs only a limited answer:

> Does this person control a currently valid credential for the required qualification from an issuer approved by this JustProof deployment?

Conventional document sharing creates unnecessary collection, retention, breach, profiling, and reuse risks. A verifier that never receives the certificate cannot accidentally expose it later.

## 3. The Product

JustProof separates qualification verification from certificate disclosure.

An approved organization registers an issuer key, issues a structured private credential, signs it, and registers a commitment-derived leaf in the credential registry. The recipient stores the credential package and a holder-controlled secret privately.

When a verifier requests proof of the supported qualification:

1. the verifier creates a request bound to its application context, the JustProof deployment, a fresh challenge, and an expiration deadline
2. the holder selects the private credential and generates a zero-knowledge proof
3. the proof establishes all required credential, issuer, membership, holder-control, non-revocation, qualification, time, and request relations together
4. the verifier validates the complete proof artifact against the latest finalized JustProof state; and
5. the verifier returns `VALID`, `INVALID`, or `COULD_NOT_VERIFY`

The verifier does not receive the certificate, credential identifier, credential commitment, issuer signature, issuer identity, Merkle index, authentication paths, issuance nonce, credential opening, or holder secret.

## 4. Intended Users

### 4.1 Credential issuers

Credential issuers are organizations authorized by a JustProof deployment to issue the supported qualification.

Examples for future versions may include universities, professional bodies, training providers, bootcamps, employers, conference organizers, and membership organizations.

In V1, an issuer:

- proves possession of its signing key
- obtains approval from the deployment's registry authority
- registers an immutable issuer identity derived from its verification key
- creates and signs structured credential packages
- registers issued credentials; and
- may irreversibly revoke credentials it originally issued

The V1 issuer registry is append-only. It has no issuer status flag, deactivation, suspension, deletion, or key rotation. Current membership of the canonical issuer leaf under the current issuer root is the protocol authorization fact.

### 4.2 Credential holders

Credential holders are people who receive private qualification credentials.

A holder:

- generates and protects a credential-specific subject secret
- stores the immutable private credential package
- retains the private registry index and refreshable authentication paths required for proof generation
- responds only to an exact verifier request; and
- generates proofs in a holder-controlled environment wherever practical

Holder control is established by knowledge of the subject secret. It is not based on a wallet address and does not prove legal identity, personhood, or non-transferability.

### 4.3 Credential verifiers

Credential verifiers are organizations or applications that need to confirm the supported qualification.

Examples include employers, recruiters, universities, course providers, event organizers, professional communities, grant providers, and gated services.

A verifier:

- issues a fresh request-specific challenge
- retains the exact request and challenge state
- selects trusted deployment and verifier artifacts
- verifies the proof and its complete public transcript
- compares it with the latest finalized contract state
- consumes an accepted challenge atomically; and
- does not request the underlying credential as part of the JustProof flow

## 5. Founding Demonstration

JustProof V1 supports exactly one proof type and one qualification:

```text
JustProof Midnight Builder Demonstration Credential
```

The first deployment uses a project-operated founding issuer with the recommended display name:

```text
JustProof Demonstration Certification Authority
```

The name is application metadata; the cryptographic issuer identity is derived from the registered secp256k1 verification key.

The demonstration application may allow users to complete a small set of Midnight-concept quizzes before the founding issuer awards a credential. Quiz results are an application-side issuance policy. The protocol proves that the registered issuer made the attestation; it does not independently prove that the quiz was fairly graded or that an issuer's statement is factually true.

The demonstration credential is not an official Midnight Academy credential. JustProof does not represent itself as Midnight Academy, an authorized Midnight Academy issuer, or an official representative of the Midnight organization.

## 6. Why Midnight

JustProof is fundamentally a privacy problem, not a public credential-storage problem.

A transparent blockchain can make credential records tamper-evident, but it can also make the credential ecosystem observable. Publishing a holder, issuer, qualification, credential identifier, commitment, expiration time, and status may create a durable graph of personal and professional activity.

Midnight allows JustProof to combine:

- authoritative shared contract state
- private credential and witness inputs
- in-circuit cryptographic and state constraints; and
- selective public proof outputs

The holder can therefore prove the required fact without publishing the evidence from which it was derived.

Midnight is particularly suitable because the protocol must jointly establish private credential construction, holder control, issuer authentication, registry membership, current non-revocation, qualification equality, temporal validity, and request binding. These are programmable relationships, not merely a signed document lookup.

## 7. V1 Protocol Architecture

JustProof V1 separates issuer authorization, credential registration, and revocation into three authenticated registries.

Each registry uses an ordered binary Merkle tree with depth `16` and capacity `65,536`. The contract stores only current roots and the two append counters, not complete trees, frontiers, paths, historical roots, or public credential records.

### 7.1 Deployment authority

The contract is deployed with:

- an immutable registry-authority verification key; and
- a fresh immutable 32-byte registry context unique to that deployment

The registry authority approves issuer registration only. It does not issue credentials, revoke credentials, or verify holder qualifications.

### 7.2 Issuer registry

Every issuer has one immutable nondefault secp256k1 verification key. Its issuer ID is derived from that key rather than assigned by an administrator.

Registration requires both proof that the issuer controls the key and current-state approval from the registry authority. Approved issuer leaves are appended sequentially to the issuer tree.

The issuer record contains no name, URL, status, registration timestamp, scope, or mutable metadata. Human-readable issuer information may exist outside the protocol but cannot determine a `VALID` result.

### 7.3 Private credential and credential registry

Each issuance receives a fresh credential ID derived from:

- the registered issuer ID; and
- a fresh issuer-generated issuance nonce.

The holder creates a fresh subject secret. A subject commitment binds that secret to the credential ID without disclosing the secret.

The credential statement contains exactly the V1 protocol version, credential ID, issuer ID, subject commitment, fixed qualification type and version, issuance time, and optional expiration time. It contains no name, email, wallet address, certificate image, issuer display name, Merkle path, or verifier request.

The issuer creates a hiding commitment to the complete statement and signs a typed digest binding the credential ID and credential commitment. The holder receives the private package; the public ledger does not receive the statement or package.

Credential registration appends a leaf derived from the credential ID and commitment to the credential tree. A deployment-scoped registration nullifier prevents the same credential ID from being registered twice. This nullifier is a registration duplicate guard, not a presentation identifier and not a proof-replay mechanism.

### 7.4 Revocation registry

Revocation is a separate irreversible transition:

```text
NOT_REVOKED -> REVOKED
```

The revocation tree uses the credential's immutable registry index. It has no separate counter.

Only the issuer that originally issued the credential can authorize revocation. The revocation circuit:

- authenticates the issuer under the current issuer root
- rederives the credential ID from that issuer ID and the retained private issuance nonce
- verifies the original credential signature
- authenticates the credential under the current credential root
- verifies a deployment-bound revocation authorization under the same issuer key
- proves that the current revocation leaf is empty at the credential index; and
- replaces only that leaf with the credential-bound revoked leaf

A successful revocation changes only `revocationRoot`.

V1 has no revocation timestamp, public reason, scheduled revocation, batch revocation, unrevocation, historical revocation state, or public credential-specific revocation event. Revocation becomes effective when the new root becomes authoritative current state.

### 7.5 Current qualification proof

The qualification proof consumes one coherent private witness containing the credential package, holder secret, authenticated issuer record and path, credential index and path, and revocation path.

The circuit rederives every security-critical identifier, commitment, signature message, leaf, digest, and root relation. Witnesses and off-chain providers supply candidate data; they do not become protocol authorities.

The circuit returns only:

```text
requestDigest
stateDigest
```

These values bind the proof to the exact public request and the exact current verification state. A verifier's `VALID` result comes from complete proof and transcript verification, current-state comparison, deadline enforcement, and atomic challenge consumption—not from a caller-supplied Boolean.

## 8. What a Valid Proof Establishes

A successful JustProof V1 verification jointly establishes that:

1. the proof uses the exact supported protocol, proof type, deployment, qualification, verifier context, challenge, and deadline
2. the credential ID, subject commitment, and credential commitment were correctly constructed
3. the holder knows the private subject secret bound to the credential
4. the credential statement was authenticated by the issuer key associated with that credential
5. that issuer is a member of the current issuer registry
6. the credential is a member of the current credential registry
7. the canonical unrevoked leaf exists at the same credential index under the current revocation root
8. the credential is already issued and not expired at current Compact block time
9. a credential with a nonzero expiration remains unexpired through the verifier's complete request window and
10. the proof operation changes no JustProof ledger state

The proof does not establish:

- the holder's civil or legal identity
- wallet ownership
- personhood or non-transferability
- a holder's name, employer, score, grade, or other unsupported claim
- that the issuer's real-world attestation is factually true
- historical validity at an arbitrary past time; or
- validity outside the exact request and current-state context

## 9. Current-State and Replay Semantics

JustProof V1 verifies current validity only.

The proof is bound to the current issuer root and counter, credential root and counter, and revocation root. If any included value changes before acceptance—even because an unrelated issuer or credential was appended—the unaccepted proof becomes stale and must be regenerated against refreshed paths and state.

The verifier creates a fresh nonzero 32-byte challenge for exactly one request. A challenge moves from `ISSUED` to `CONSUMED`, `EXPIRED`, or `CANCELLED`. At most one concurrent submission can obtain `VALID` for the same challenge.

V1 has no presentation nullifier or reusable bearer proof. Invalid or stale attempts do not automatically consume an otherwise active request, so the holder may refresh state and retry before the request expires.

## 10. Public and Private Data Boundary

JustProof minimizes the public surface while retaining enough shared state to verify the protocol.

| Category | Public or deliberately disclosed | Private by default |
| --- | --- | --- |
| Deployment | Network, contract address, registry-authority key, registry context, approved circuit and verifier-artifact identity | Authority signing key and operational recovery material |
| Registry state | Current issuer, credential, and revocation roots; issuer and credential counters | Complete trees, leaf-to-credential mappings, indices, paths, and provider records |
| Transition guards | Registered issuer-leaf entries and deployment-scoped credential registration nullifiers | Their private credential associations beyond what transaction metadata reveals |
| Credential | No standalone credential statement, ID, commitment, signature, index, or status ledger field | Complete private package, issuance nonce, credential opening, subject secret, credential ID, commitment, signature, and index |
| Revocation | Current revocation root and transition timing | Credential association, issuer association, authorization signature, revoked leaf, index, path, reason, and private operational record |
| Verification | Exact request, current verification state, request digest, state digest, proof transcript, and challenge lifecycle metadata | Which credential, issuer, or holder satisfied the request and every private witness value |
| Presentation | Only metadata the holder intentionally shares outside the protocol | PDF, image, name, certificate number, visual metadata, and other document contents |

Public roots and hashes are not automatically hiding commitments to low-entropy data. Privacy also depends on high-entropy nonces, secrets, and openings; zero-knowledge proof boundaries; confidential path delivery; careful logging; and avoidance of auxiliary metadata leaks.

## 11. Human-Readable Certificates

An issuer may also give the holder an attractive PDF, image, badge, or web-based certificate for human use.

That presentation artifact is separate from the structured JustProof credential. It is not a Merkle leaf, issuer signature message, zero-knowledge proof, or source of protocol validity.

A QR code may initiate a verification request or carry non-sensitive routing information. It must not expose the private package, issuance nonce, subject secret, credential opening, issuer signature, credential ID, or private authentication paths.

OCR is not an authoritative credential-import path. Generating a JustProof proof requires the exact structured private package and holder secret.

## 12. Technical Stack and Maintainability

JustProof keeps the privacy-critical protocol boundary distinct from conventional application infrastructure.

- **Smart contract:** Compact contract code implements the frozen typed constructions, three registry transitions, ledger schema, witness constraints, qualification circuit, and read-only current-state proof logic.
- **Frontend:** React and TypeScript provide issuer, holder, and verifier experiences. The holder experience should generate proofs locally in the browser or another explicitly trusted environment whenever supported.
- **Wallet integration:** A supported Midnight wallet provides network connection, transaction authorization, and fee payment. Wallet identity is not the credential-holder binding.
- **Off-chain application service:** A lightweight Node.js and Express.js service may coordinate issuer workflows, verifier requests and challenges, deployment metadata, and non-authoritative APIs.
- **Private tree providers:** Off-chain providers maintain the private issuer, credential, and revocation leaves and paths needed by registry operations and proofs. They are trusted for availability and privacy, not correctness; every supplied path is checked against an authoritative root.
- **Storage:** Encrypted holder, issuer, verifier, and provider state preserves private credential packages, subject secrets, issuer revocation records, tree data, and challenge lifecycle state.
- **Protocol artifacts:** Generated Compact, TypeScript, prover, verifier, ZKIR, and runtime artifacts remain tied to the exact compiled circuits and authenticated deployment manifest.

V1 pins Compact language `0.23`, Compact toolchain `0.31.0`, and Compact runtime `0.16.0`. Generated files are not edited manually.

The project follows these maintainability principles:

1. **Protocol-first implementation:** cryptographic constructions and state effects are specified before interface behavior.
2. **Minimal authoritative state:** the contract stores only the frozen configuration, roots, counters, and duplicate guards.
3. **Clear trust boundaries:** off-chain services improve availability and usability but cannot override circuit or ledger authority.
4. **Generated type compatibility:** Compact and TypeScript use generated bindings and shared cross-runtime vectors instead of assumed JSON serialization.
5. **Atomic state transitions:** failed issuer registration, credential registration, or revocation commits no partial state.
6. **Fail-closed verification:** unavailable state, time, finality, artifacts, or proof capability never produces `VALID`.
7. **Explicit versioning:** protocol, source, compiler, runtime, circuit, verifier artifacts, and deployment metadata remain traceable.
8. **Dependency restraint:** infrastructure is introduced only when it provides a clear protocol or product benefit.

## 13. Trust, Security, and Operational Limits

JustProof reduces disclosure; it does not eliminate every trust or operational risk.

V1 assumes:

- secure randomness for all keys, contexts, nonces, openings, secrets, and challenges
- secure registry-authority, issuer, holder, verifier, and provider storage
- correct Compact compiler, runtime, proof-system, and network behavior
- authenticated current network state and finality
- exact agreement between Compact and TypeScript constructions; and
- protected local or remote environments wherever private witnesses are processed

Important limitations include:

- a dishonest approved issuer can issue a false credential or revoke a legitimate one
- a compromised issuer key cannot be deactivated within V1 and may require deployment migration
- loss of an issuer revocation record can prevent revocation
- loss of holder private state can prevent proof generation
- loss of private tree-provider state can prevent path production
- a path provider or remote prover may observe correlating metadata or deny service
- proof generation is only as private as the machine and services that process the witness; and
- current-state binding may require path refresh and proof regeneration after unrelated registry changes

These limits are stated explicitly so the MVP demonstrates a credible privacy boundary rather than implying guarantees the protocol does not provide.

## 14. V1 Scope

The V1 MVP includes:

- one JustProof deployment
- one registry authority
- one founding demonstration issuer workflow
- one fixed Midnight Builder demonstration qualification
- issuer proof of possession and authority-approved registration
- structured private credential issuance
- holder-controlled subject binding
- credential registration and duplicate prevention
- irreversible issuer-authorized revocation
- request-specific current qualification proof
- verifier challenge lifecycle and replay prevention
- current finalized-state verification
- human-readable demonstration certificate support
- Midnight wallet and transaction integration
- private off-chain tree and path coordination
- complete Compact/TypeScript vectors and positive, negative, privacy, state-isolation, concurrency, and recovery tests
- an authenticated deployment manifest; and
- deployment to Midnight Preprod before any Mainnet consideration

V1 intentionally excludes:

- arbitrary credential schemas, claims, or proof types
- multiple qualification types
- name, age, score, grade, threshold, employer, or free-form attribute proofs
- issuer deactivation, suspension, deletion, key rotation, or key history
- registry-authority rotation, governance, or recovery
- credential modification, deletion, transfer, or replacement in place
- unrevocation, scheduled revocation, revocation timestamps, reasons, batches, or history
- historical-root or arbitrary-time verification
- presentation nullifiers or reusable bearer proofs
- public issuer selection or issuer disclosure in the qualification proof
- holder legal identity, wallet identity, personhood, or non-transferability
- OCR- or PDF-derived authoritative proof generation
- cryptographic recovery of lost secrets or private tree state; and
- generalized credential interoperability

The V1 architecture may inform later versions, but excluded features must not be implemented as undocumented extensions to the frozen protocol.

## 15. MVP Delivery Plan

Implementation should proceed in this order:

1. encode the frozen protocol constants, records, and typed cryptographic helpers
2. implement and test the shared Merkle construction
3. declare the exact ledger and canonical constructor state
4. implement issuer registration and its negative tests
5. implement credential construction, issuance, and registration
6. implement issuer-authorized revocation with original-issuer nonce binding
7. implement private-state and witness adapters
8. implement `proveQualificationV1`
9. implement verifier requests, challenge storage, and current-state verification
10. build issuer, holder, and verifier application experiences
11. add the demonstration quiz and human-readable certificate workflow
12. audit storage, logs, analytics, errors, remote services, and metadata boundaries
13. run the complete cross-runtime and conformance suite
14. deploy and validate on Midnight Preprod
15. conduct end-to-end and real-user testing; and
16. publish the authenticated deployment manifest and demonstration documentation

Mainnet deployment is a later readiness decision. It depends on successful implementation, security review, operational recovery testing, supported verification capabilities, network readiness, and a deployment-specific risk assessment.

## 16. MVP Success Criteria

The MVP is successful when it demonstrates that:

1. a registry-authority-approved issuer can register through the frozen issuer protocol
2. the demonstration issuer can issue and register a private credential without publishing the credential statement
3. the holder can generate a request-specific proof without sending the certificate to the verifier
4. the verifier can return `VALID` only after complete proof, current-state, deadline, and challenge verification
5. replay, stale state, mixed credentials, invalid signatures, wrong paths, expiration, and unavailable authority fail safely
6. issuer-authorized revocation changes only the revocation root and prevents later current-validity proofs
7. unrelated private credential values do not appear in ledger fields, events, outputs, logs, analytics, URLs, QR codes, or presentation artifacts
8. every frozen Compact construction matches its TypeScript test vectors
9. private tree data can be backed up, restored, and reconciled with current roots; and
10. a user can complete the issuer-to-holder-to-verifier journey through a polished, understandable interface

## 17. Protocol Documents and Change Control

This proposal explains the product, motivation, scope, experience, and implementation direction. It is not the source of truth for exact cryptographic fields, byte values, circuit interfaces, ledger declarations, or verification algorithms.

The frozen normative protocol set is:

| Document | Responsibility |
| --- | --- |
| `01-credential.md` | Credential statement, construction, issuer signature, time semantics, and private package |
| `02-issuer-registry.md` | Issuer identity, authority, registration, tree, and membership |
| `03-commitments.md` | Subject and credential commitments, openings, and security requirements |
| `04-revocation.md` | Revocation authority, original-issuer binding, transition, and non-revocation |
| `05-ledgers.md` | Exact public ledger schema, initialization, write isolation, and current-state rules |
| `06-merkle-tree.md` | Credential tree and shared Merkle paths, nodes, indices, and membership |
| `07-witnesses.md` | Exact private semantic records and witness trust boundaries |
| `08-proofs.md` | Qualification request, state, output, circuit statement, and proof artifact |
| `09-verification.md` | Verifier configuration, challenge lifecycle, proof acceptance, and outcomes |
| `10-specification.md` | Cross-component integration, conformance, lifecycle, and change control |

If this proposal conflicts with the frozen protocol documents, implementation must follow the owning protocol document and the proposal must be corrected.

Any change to a frozen protocol record, construction, domain, tree rule, ledger field, witness, proof statement, verification rule, public/private boundary, or required vector must go through protocol versioning, cross-document reconciliation, regenerated artifacts and tests, and formal re-freezing.

Product copy, visual design, and non-authoritative metadata may evolve without a protocol revision only when they do not change protocol meaning or security expectations.

## 18. Conclusion

JustProof addresses a simple but consequential problem: people should not have to surrender an entire certificate merely to prove one qualification fact.

Midnight makes it possible to combine private evidence with shared, verifiable current state. JustProof applies that capability to a focused credential workflow in which the holder keeps the credential, the issuer's authority and registration are cryptographically checked, revocation remains effective, verifier requests cannot be replayed, and the verifier learns only that the exact supported statement is true.

The V1 proposal is intentionally constrained:

> **One fixed demonstration qualification. One issuer workflow. One current-state proof workflow. One verifier workflow.**

That constraint is the basis for an implementation that can be tested, explained, audited, and demonstrated credibly before JustProof expands beyond its founding use case.
