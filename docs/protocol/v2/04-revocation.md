# Credential-bound revocation

**Draft — User Review Required.** Retains [V1 revocation](../04-revocation.md) and consolidated §§23–24 except signature removal and explicit V2 domains/index width.

```text
IssuerRevocationRecordV2 {
  issuerId: Bytes<32>
  issuanceNonce: Bytes<32>
  credentialId: Bytes<32>
  credentialCommitment: Bytes<32>
  credentialIndex: Uint<16>
}
RevokedCredentialLeafInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  credentialId: Bytes<32>
  credentialCommitment: Bytes<32>
}
```

The issuer retains this private record from finalized issuance, separately from its secret. No holder secret, statement, credential opening, or issuer signature is required for revocation. Rederive credential ID from the authenticated issuer ID and exact issuance nonce, and assert equality with the retained ID. Authenticating only a learned credential ID/commitment is insufficient to authorize another issuer's credential.

Use the current credential root to authenticate the original credential leaf at the retained credential index, with index<nextCredentialIndex. Use that **same index** for the revocation path. Authenticate exactly the canonical NOT_REVOKED leaf under current revocationRoot. Compute the credential-bound revoked leaf and new root with the same path/index. Atomically change only revocationRoot. Empty→revoked is irreversible; repeated revocation fails because the empty-leaf membership assertion fails.

Never use a global constant revoked leaf: knowing both old empty and constant new leaf lets an observer enumerate candidate changed positions against a known empty tree. Credential binding prevents that particular cheap enumeration when credential ID/commitment remain unknown. It is not a general unlinkability guarantee: issuer/tree-provider knowledge, transaction timing and leaked openings or assignment data may reveal the position.

No timestamp/reason/counter/map, credential-root mutation, scheduled revocation, grace period, unrevocation, batch circuit, registry-authority override, or holder participation. The new state takes effect at authoritative finality. Latest-state qualification proofs must fail for revoked credentials; historical roots cannot rescue them.
