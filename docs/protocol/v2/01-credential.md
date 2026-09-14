# Credential schema and private issuance

**Draft — User Review Required.** Retains V1 [credential](../01-credential.md), [commitment](../03-commitments.md), and consolidated §§18–20 semantics except the explicit changes below.

## Exact schemas

Fields occur in this order; unsigned integers are range-constrained Compact integers and times are Unix seconds.

```text
CredentialStatementV2 {
  protocolVersion: Uint<16>
  credentialId: Bytes<32>
  issuerId: Bytes<32>
  subjectCommitment: Bytes<32>
  qualificationType: Bytes<32>
  qualificationVersion: Uint<16>
  issuedAt: Uint<64>
  expiresAt: Uint<64>
}
PrivateCredentialPackageV2 {
  statement: CredentialStatementV2
  issuanceNonce: Bytes<32>
  credentialOpening: Bytes<32>
}
```

Statement constraints: protocolVersion=2; qualificationVersion=1; qualificationType is exactly `3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7`, the SHA-256 of exact UTF-8 `JP:QUALIFICATION:MIDNIGHT-BUILDER-DEMO:V1`; issuedAt>0; expiresAt=0 or expiresAt>issuedAt. Zero expiry means no expiry; nonzero expiry is exclusive. All derived fields must match [03](03-domains-and-commitments.md). Reject zero subject commitment and zero credential opening/issuance nonce. Subject control is checked by opening the subject commitment only in qualification proving.

The statement and package contain no name, certificate number, birth date, organization, course details, grade, photo, signature, wallet, Merkle index/path, request, revocation state, PDF or unrelated metadata. Human-readable display metadata is outside the proof statement and cannot expand its claim. Issuer ID/credential ID/statement fields are private in qualification proofs; protocol and qualification constants are public fixed policy. The package is sensitive and has no portable issuer-signature authenticity.

## Issuance order and ownership

1. Authenticate the registered issuer record against current state. Issuer samples a fresh nonzero random 32-byte issuance nonce and derives credential ID.
2. Holder locally samples fresh nonzero random `subjectSecret`, derives `subjectCommitment` from credential ID, and supplies only that commitment to issuer.
3. Issuer constructs the exact statement, samples a fresh independent nonzero credential opening, derives credential commitment, and privately delivers the package to holder.
4. Issuer proves knowledge of issuer secret in `registerCredentialV2`. It does not obtain or witness the holder's subject secret. Its supplied subject commitment is an opaque binding until the holder later opens it.
5. After authoritative finalization, retain the assigned index and private tree coordination data; issuer retains [minimal revocation data](04-revocation.md). Holder checks the package's typed derivations and authenticated registration, not a removed signature.

Authority secret, issuer secret, holder/subject opening, issuance nonce and credential opening are independent CSPRNG draws. Never derive from a wallet seed, another role, credential data or a passphrase. No reuse across roles/credentials/opening purposes; subjectSecret is a single value with two synonymous descriptions (holder control secret and subject opening). The circuit enforces nonzero values where available, but cannot prove off-chain entropy, independence, non-reuse or retention. No recovery/rotation feature is added. Keep the holder secret off issuer/backend/verifier systems and every secret off logs and remote provers.
