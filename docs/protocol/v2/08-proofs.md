# Qualification request, time and public output

**Draft — User Review Required.** Replaces the V1 request/time formulation; retains fixed-claim and current-state semantics from [V1 proofs](../08-proofs.md).

## Exact ten-field public request

```text
QualificationRequestV2 {
  protocolVersion: Uint<16>
  proofType: Uint<8>
  registryContract: ContractAddress
  registryContext: Bytes<32>
  qualificationType: Bytes<32>
  qualificationVersion: Uint<16>
  verifierContext: Bytes<32>
  challenge: Bytes<32>
  requestIssuedAt: Uint<64>
  requestExpiresAt: Uint<64>
}
QualificationRequestDigestInputV2 {
  domain: Bytes<32>
  request: QualificationRequestV2
}
```

Require protocolVersion=2, proofType=1, registryContract=kernel.self(), registryContext=sealed context, fixed demo qualificationType and qualificationVersion=1, verifierContext≠zero, challenge≠zero. Verifier context comes from trusted verifier configuration; challenge is a fresh independent CSPRNG draw retained in verifier state. No expected roots, credential/holder/issuer identifiers, optional policy switches or issuer constraint enter the request. The circuit proves challenge nonzero and binding, not freshness or single use.

## Exact time constraints (D1)

Request times are public Unix seconds; verifier supplies and stores its trusted issuance time. Credential times come exclusively from the private authenticated statement. Assert all of:

```compact
assert(requestIssuedAt > 0, "request issuance zero");
assert(requestIssuedAt < requestExpiresAt, "request interval");
assert(blockTimeGte(disclose(requestIssuedAt)), "request not started");
assert(blockTimeLt(disclose(requestExpiresAt)), "request expired");
assert(issuedAt > 0, "credential issuance zero");
assert(expiresAt == 0 || expiresAt > issuedAt, "credential interval");
assert(issuedAt <= requestIssuedAt, "credential not issued at request");
assert(expiresAt == 0 || requestExpiresAt <= expiresAt, "credential expires before request");
```

Private-to-private Uint<64> comparisons compile. Never call a time API with issuedAt/expiresAt or disclose either. Only the two request timestamps create transaction-time bounds. Proof acceptance additionally verifies those complete time-query transcripts; a local JavaScript assertion result alone is insufficient.

This implies issuedAt≤requestIssuedAt≤blockTime and, for expiring credentials, blockTime<requestExpiresAt≤expiresAt. Equality at issuance is allowed; equality at expiry is rejected; request deadline equal to credential expiry is allowed; expiry zero remains unbounded. A credential issued after request creation fails even if issued before proof time. A verifier clock ahead of chain time can delay a valid proof; do not weaken the lower bound. Trusted verifier time must independently satisfy requestIssuedAt≤trustedNow<requestExpiresAt at acceptance, including atomic consumption.

## State and exact two-field output

```text
QualificationVerificationStateV2 {
  protocolVersion: Uint<16>
  registryContract: ContractAddress
  registryContext: Bytes<32>
  issuerRoot: Bytes<32>
  nextIssuerIndex: Uint<32>
  credentialRoot: Bytes<32>
  nextCredentialIndex: Uint<32>
  revocationRoot: Bytes<32>
}
QualificationVerificationStateDigestInputV2 {
  domain: Bytes<32>
  state: QualificationVerificationStateV2
}
QualificationProofPublicOutputV2 {
  requestDigest: Bytes<32>
  stateDigest: Bytes<32>
}
```

Build the state exclusively from constant protocol 2, kernel.self(), sealed context and current ledger roots/counters. No witness-authoritative state. Request/state digests use their complete ordered typed wrappers and V2 domains in [03](03-domains-and-commitments.md). Return only the two-field output: no timestamps, success Boolean, nullifier, credential data, issuer, index or path. `proveQualificationV2(request: QualificationRequestV2): QualificationProofPublicOutputV2` is read-only.

The conceptual proof artifact retains networkId, exact circuit identity `proveQualificationV2`, complete request, eight-field verificationState, two-field publicOutput, and proof with all required public/transcript material. This is a semantic envelope, not an approved portable wire format; exact proof-system bytes/encoding must be capability-validated in later phases. Untrusted artifact metadata never selects verifier keys or authoritative state. No private witness belongs in an artifact sent to a verifier.
