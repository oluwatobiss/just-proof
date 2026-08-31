# How to Use JustProof

JustProof is a privacy-preserving qualification verification application built on Midnight.

It allows a credential holder to prove that they have a valid qualification from a recognized issuer without revealing the underlying certificate or unnecessary personal information.

> **Development status:** JustProof is currently under active development. The V1 protocol and core privacy architecture have been defined, while the smart contracts and end-to-end application flows are being implemented. The steps below describe the intended V1 experience.

## What You Need

To use the complete JustProof V1 flow, you will need:

* A web browser.
* A compatible Midnight wallet.
* A credential issued through a JustProof-recognized issuer.
* Enough network resources to perform any required Midnight transactions.

You do **not** need to publish your certificate or its private contents for a verifier to check your qualification.

## Step-by-Step Guide

### 1. Receive your credential

A recognized issuer first issues you a digital credential.

For the initial JustProof demonstration, the application will use a demo certification issuer so that the complete credential lifecycle can be demonstrated without representing an unaffiliated organization as an official issuer.

Your credential contains the information necessary to establish your qualification, but its private contents are not intended to be published on-chain.

### 2. Keep your credential private

Your credential belongs to you.

JustProof uses a cryptographic representation of the credential to establish its authenticity without requiring the underlying certificate data to be publicly stored on the Midnight blockchain.

This means information contained in the credential can remain private instead of becoming part of a permanent public record.

### 3. Receive a request to prove your qualification

A verifier—such as an employer, organization, course provider, or event organizer—can ask you to prove a particular qualification.

Instead of sending them your complete certificate, you use JustProof to prove the required fact.

For example, a verifier could ask you to prove that you hold a valid Midnight Builder qualification from a recognized issuer.

### 4. Open JustProof and connect your wallet

Open the JustProof application and connect a compatible Midnight wallet.

The application prepares the information required to generate your proof while keeping the underlying private credential data under your control.

### 5. Generate your qualification proof

Choose the qualification you want to prove and approve the proof request.

JustProof uses Midnight's zero-knowledge technology to demonstrate that your credential satisfies the required conditions without exposing the credential itself.

The verifier receives the proof—not your private certificate data.

### 6. Verify the proof

The verifier checks the submitted proof through JustProof.

The verification process establishes that the proof corresponds to a credential recognized by the protocol and that the relevant qualification claim is valid, while also accounting for the credential's revocation status.

The verifier can therefore obtain cryptographic evidence of the qualification without needing access to the underlying certificate.

### 7. Get the verification result

If all required checks succeed, JustProof reports that the qualification proof is valid.

The verifier learns the fact that was intentionally proved, rather than receiving all of the information contained in the original credential.

## What Gets Proved (and What Stays Private)

JustProof follows a **minimal disclosure** principle: prove what is necessary for a verification decision without unnecessarily exposing the source credential.

For example, a holder may prove:

* that they possess a valid credential;
* that the credential was issued by a recognized issuer;
* that it represents the requested qualification; and
* that the credential has not been revoked.

The underlying credential can contain considerably more information than the verifier needs. Depending on the credential and proof being requested, information such as the holder's personal details, credential identifiers, grades, certificate metadata, signatures, or other unrelated fields does not need to be disclosed simply to establish the requested qualification.

The goal is simple:

**The verifier gets evidence of the qualification. The holder keeps the underlying credential private.**

## Troubleshooting

Because JustProof is currently under development, some of the user-facing flows described above may not yet be available in the progress-report build.

### My wallet will not connect

Make sure you are using a Midnight-compatible wallet and that it is unlocked. Confirm that the wallet is connected to the network supported by the current JustProof build, then refresh the application and try again.

### My credential cannot be found

Make sure you are using the wallet and private credential information associated with the credential you are trying to prove.

If the credential has not yet been issued or registered through the supported JustProof flow, it cannot be used to generate a valid proof.

### My proof cannot be generated

Check that your wallet is connected and that the required credential information is available locally.

A proof may also fail if the credential does not satisfy the conditions requested by the verifier.

### My proof is not accepted

A proof must satisfy the protocol's verification requirements. Verification can fail if, for example, the credential is not recognized, the proof does not satisfy the requested qualification, or the credential has been revoked.

### A feature described here is not available yet

That may be expected during the current development stage.

JustProof is being implemented progressively, beginning with the protocol specification and Midnight smart-contract layer before completing the full issuer, holder, and verifier interfaces.

The current build should therefore be evaluated as a **work in progress toward the complete V1 flow described in this guide**.
