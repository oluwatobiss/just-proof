# Registry authority and issuer control

## Reviewed D5 clarification — 2026-09-14 (Phase 3A2)

`issuerControlCommitment` is caller-supplied, intentionally non-secret protocol data. This does **not** require its raw bytes in public transaction inputs, query/effect transcripts, ledger state or output. The authoritative public representation is the canonical `issuerLeaf` stored in `registeredIssuerLeaves` and committed by `issuerRoot`. The authority, issuer or accepted untrusted registry coordinator may publish and retain `IssuerRecordV2` off-chain. Consumers must recompute its canonical leaf and validate membership/path against current authoritative contract state; publication provides availability, never authorization. Later issuer-controlled transitions must prove that the private issuer secret maps to the control commitment in that authenticated record.

R58/D5 is resolved by this reviewed specification clarification, not by implementing raw chain exposure. The prior Phase 3A observation and “D5 unsupported” conclusion remain correct historical evidence under the former interpretation. No ledger field, event, result, circuit argument, cross-call or forced disclosure is added. The exact accepted contract/witness ABI is unchanged. The complete V2 package remains draft and R61 remains open for the complete protocol. Only the bounded Phase 3A2 resource attempt is authorized; no Phase 3B authorization is implied.


**Draft — User Review Required.** Replaces signature authorization in [V1 issuer registry](../02-issuer-registry.md). Retains append-only registration, current membership and duplicate/capacity rules.

```text
RegistryAuthorityControlInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  registryContext: Bytes<32>
  registryAuthoritySecret: Bytes<32>
}
IssuerControlInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  registryContext: Bytes<32>
  issuerSecret: Bytes<32>
}
IssuerIdInputV2 {
  domain: Bytes<32>
  protocolVersion: Uint<16>
  registryContext: Bytes<32>
  issuerControlCommitment: Bytes<32>
}
IssuerRecordV2 {
  protocolVersion: Uint<16>
  issuerId: Bytes<32>
  issuerControlCommitment: Bytes<32>
}
IssuerLeafInputV2 {
  domain: Bytes<32>
  record: IssuerRecordV2
}
```

All fields have normative order. Formulas are in [03](03-domains-and-commitments.md). Authority and issuer secrets are private nonzero independently sampled random Bytes<32>. Authority controls issuer registration only. Issuers control their own credential registration and revocation only. Holder control is separate.

`registerIssuerV2(issuerControlCommitment: Bytes<32>): []` has exactly that public argument. Reject its default zero value. Read sealed configuration and current issuer root/counter from the ledger. Authenticate authority knowledge, then derive ID/record/leaf from supplied commitment and sealed context; do not accept an ID/record from the caller as authoritative. Reject duplicate leaves; authenticate the empty insertion slot at nextIssuerIndex; update root, counter and set atomically.

The issuer secret is never provided to this circuit. No proof of possession at registration is claimed. The authority can waste capacity by registering an unusable commitment or a commitment controlled by a third party. Only knowledge of the corresponding issuer secret permits later credential registration/revocation. Off-chain onboarding may prevent mistakes, but is not an on-chain guarantee or substitute for circuit checks.

For later issuer membership: require record.protocolVersion=2, nonzero control commitment, canonical issuer ID rederived with current context, index<nextIssuerIndex, and root reconstruction equal to current issuerRoot. Issuer-authorized transitions additionally recompute the issuer-control hash using the private secret and compare to this authenticated record. Qualification proving authenticates the record but needs no issuer secret. No issuer removal, key history, suspension, expiry, recovery or rotation is added.
