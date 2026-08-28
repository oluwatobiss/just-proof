# JustProof

Prove your qualification. Keep your certificate private.

## What Is the Product?

### The problem

Today, proving a professional or educational qualification usually requires revealing the qualification itself.

A person applying for a job, joining a course, entering a professional community, accessing a benefit, or attending an exclusive event may be asked to submit a certificate, diploma, badge, or other credential.

This creates an unnecessary privacy problem.

A certificate may contain much more information than the verifier actually needs:

- the holder's full name
- certificate number
- date of birth
- institution or organization
- course details
- grades or scores
- photograph
- signature
- certificate metadata
- other personally identifying information

In many situations, the verifier only needs to know one thing:

> **Does this person possess a valid qualification issued by a recognized issuer?**

JustProof allows the holder to answer that question **without handing over the underlying certificate**.

### The product

JustProof is a privacy-preserving credential verification platform built on Midnight.

A trusted organization — such as a university, professional body, training provider, certification authority, or employer — can register as an issuer and issue digital qualification credentials to recipients.

The recipient retains the credential privately.

When the recipient needs to prove a qualification, they generate a zero-knowledge proof demonstrating that their private credential satisfies the verifier's requirements.

The verifier receives the proof rather than the certificate.

### Example

Alice is applying for a position requiring a Certified Midnight Builder qualification. Instead of uploading her certificate, Alice generates a proof:

> **“I possess a valid Certified Midnight Builder credential issued by an approved issuer.”**

The verifier can verify the proof without learning Alice's certificate contents.

The system therefore separates:

**possessing a qualification** from **revealing the qualification document**.

## Who Uses It?

JustProof has three primary participants.

### Credential Issuers

Organizations that issue qualifications.

Examples include:

- universities
- professional certification bodies
- training providers
- bootcamps
- employers
- conference organizers
- membership organizations

Issuers register with JustProof, establish an issuer identity and verification key, create structured credentials, cryptographically sign them, register issued credentials, and can revoke credentials they have issued.

### Credential Holders

People who have received qualifications.

The holder keeps their credential and associated private information under their control.

They can generate proofs whenever they need to demonstrate a qualification.

### Credential Verifiers

Organizations or individuals who need to establish that somebody possesses a qualification.

Examples include:

- employers
- recruiters
- universities
- course providers
- event organizers
- professional organizations
- gated communities
- grant or benefit providers

The verifier does not need access to the holder's underlying certificate.

## Why Midnight Specifically?

JustProof is fundamentally a **privacy problem**, not merely a credential-storage problem.

A transparent blockchain is excellent at proving that publicly visible state exists and has not been tampered with.

It is much less suitable when the fact being verified depends on private information.

Consider the statement:

> “This person possesses a valid qualification issued by Organization X.”

The underlying evidence could contain the person's name, certificate identifier, date, course information, or other sensitive information.

On a transparent chain, making that evidence directly verifiable often means making some representation of that information observable.

Midnight allows the application to express the verification rules as zero-knowledge circuits.

The holder can prove that:

- they possess a valid credential
- the credential was issued by an authorized issuer
- the credential has not been revoked at the relevant verification time
- the credential satisfies a required qualification
- particular conditions are satisfied

without necessarily revealing the private inputs used to establish those facts.

This is precisely the type of application for which Midnight's programmable privacy and selective disclosure model is designed.

### Why not a transparent chain?

A transparent chain could store:

```text
credentialId
issuer
holder
qualification
issuedAt
expiry
status
```

But this makes the credential ecosystem itself observable.

JustProof instead separates authenticated public verification state from private credential data:

```text
Public:
    issuer registry
    issuer authorization/status
    credential commitment
    credential registry root
    revocation registry root
    verification rules

Private:
    credential contents
    holder identity
    certificate metadata
    holder secret
    credential authentication material
```

The proof establishes the relationship between the two without publishing the private information.

That is the central Midnight value proposition.

## V1 Protocol Architecture

JustProof V1 uses separate authenticated registries for issuer, credential, and revocation state.

### Issuer registry

Every issuer receives a distinct registered issuer identifier.

The issuer registry associates that identifier with the issuer's verification key and authorization status.

Issuer verification keys are immutable after registration in V1. Key rotation and key-history management are intentionally outside the V1 scope.

### Credential registry

Each credential issuance receives a unique credential identifier, even when two credentials contain identical semantic information.

The credential commits to the semantic fields that determine its meaning and validity.

The issuer cryptographically signs the credential statement.

A credential is then registered in an append-only credential registry. The registry uses a Merkle root to authenticate credential membership without requiring the private credential itself to be stored on-chain.

The credential registry is historical and append-only:

> **A registered credential remains registered even after it is revoked.**

### Revocation registry

Revocation is maintained separately from credential registration.

A revocation record associates a credential identifier with the time at which the credential became revoked.

The revocation registry has its own authenticated root.

This separation allows the credential registry to remain immutable while credential validity can change over time.

A credential can therefore be evaluated against a particular verification time to determine whether it had expired or had already been revoked.

## Data Model

The system deliberately separates **public verification state** from **private credential data**.

| Data Point                  | Location / Type                 | Disclosure                                                                  |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| Issuer identifier           | Public issuer registry          | Everyone                                                                    |
| Issuer verification key     | Public issuer registry          | Everyone                                                                    |
| Issuer authorization/status | Public issuer registry          | Everyone                                                                    |
| Credential identifier       | Credential protocol / registry  | Publicly available when disclosed; not required to be revealed by the proof |
| Credential commitment       | Public credential registry      | Everyone                                                                    |
| Credential registry root    | Public ledger                   | Everyone                                                                    |
| Revocation registry root    | Public ledger                   | Everyone                                                                    |
| Revocation timestamp        | Authenticated revocation state  | Used for verification; underlying record need not be disclosed              |
| Qualification claim         | Proof input/output              | Only what the proof requires                                                |
| Credential contents         | Private credential state        | Holder only                                                                 |
| Holder identity             | Private credential/witness      | Holder only                                                                 |
| Certificate metadata        | Private credential/presentation | Holder only                                                                 |
| Issuer signature            | Private proof input             | Not required to be disclosed                                                |
| Holder secret               | Private witness                 | Never disclosed                                                             |
| Merkle authentication paths | Private witness                 | Not disclosed                                                               |
| ZK proof                    | Verification artifact           | Verifier                                                                    |
| Verification result         | Verifiable result               | Verifier / parties involved                                                 |

The ledger stores authenticated state required to establish trust and verification.

The holder retains the credential data required to prove claims about that state without revealing the underlying credential.

> **The ledger stores what needs to be trusted and verified; the holder retains what needs to remain private.**

## V1 Verification Model

A JustProof V1 verification proof establishes, without revealing the underlying credential, that the holder possesses a credential satisfying the verifier's requirements.

At a minimum, the proof establishes that:

1. the credential was issued by a registered issuer
2. the issuer's signature is valid
3. the credential is registered
4. the credential satisfies the requested qualification
5. the holder controls the credential
6. the credential was valid at the relevant verification time; and
7. the credential had not been revoked at that time

Credential validity is temporal.

A credential may have an expiration time, and a separate revocation record may establish the time at which an issuer revoked it.

The verification proof therefore evaluates credential validity relative to a specific verification time rather than treating validity as a permanent boolean.

The underlying credential remains private throughout the proof process.

## Founding Qualification

The **Midnight Academy Builder Certification** serves as the founding qualification for the JustProof V1 implementation.

It provides a concrete credential type through which the complete protocol can be exercised:

```text
issuer registration
        ↓
credential issuance
        ↓
credential registration
        ↓
private credential possession
        ↓
zero-knowledge verification
        ↓
credential revocation
        ↓
temporal verification failure
```

The founding qualification is used as a demonstration credential for the JustProof project.

JustProof does not represent itself as an authorized issuer or representative of Midnight Academy.

## V1 Scope

JustProof V1 is intentionally constrained.

The MVP targets:

- one founding credential type
- one issuer workflow
- one credential issuance workflow
- one revocation workflow
- one proof-generation workflow
- one verifier workflow
- issuer registration and authorization
- credential registration
- temporal credential validity
- zero-knowledge qualification verification
- Midnight Wallet integration
- deployment to Midnight Preprod
- security and privacy testing
- polished end-to-end UX

The architecture is designed to support additional credential types, issuers, qualification predicates, and verification workflows in future versions.

However:

> **The V1 implementation is not intended to be a generalized credential infrastructure.**

Features deliberately excluded from V1 include issuer key rotation, credential modification or deletion, credential unrevocation, nullifiers, and complex issuer lifecycle management.

This constrained scope keeps the MVP implementable while preserving the core product vision.

## Mainnet Feasibility

JustProof is intentionally designed to be achievable as a production-oriented MVP rather than an attempt to build an entire global credential infrastructure before launch.

The project can therefore target by Level 6:

- finalize the V1 protocol specification
- implement the core Compact contracts
- implement credential issuance and registration
- implement issuer registration and authorization
- implement credential revocation
- implement proof generation
- implement verification flow
- complete the end-to-end issuer → holder → verifier workflow
- integrate Midnight Wallet
- deploy to Midnight Preprod
- conduct security and privacy testing
- polish UX
- conduct real-user testing

The project will target Midnight Mainnet deployment when the implementation, security review, and network requirements establish that the system is ready.

The scope is deliberately constrained:

> **One credential type. One issuer workflow. One proof workflow. One verifier workflow.**

The architecture is extensible, but the MVP is not.
