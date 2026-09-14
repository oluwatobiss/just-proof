# Witnesses, private state and disclosures

## Reviewed D5 clarification — 2026-09-14 (Phase 3A2)

`issuerControlCommitment` is caller-supplied, intentionally non-secret protocol data. This does **not** require its raw bytes in public transaction inputs, query/effect transcripts, ledger state or output. The authoritative public representation is the canonical `issuerLeaf` stored in `registeredIssuerLeaves` and committed by `issuerRoot`. The authority, issuer or accepted untrusted registry coordinator may publish and retain `IssuerRecordV2` off-chain. Consumers must recompute its canonical leaf and validate membership/path against current authoritative contract state; publication provides availability, never authorization. Later issuer-controlled transitions must prove that the private issuer secret maps to the control commitment in that authenticated record.

R58/D5 is resolved by this reviewed specification clarification, not by implementing raw chain exposure. The prior Phase 3A observation and “D5 unsupported” conclusion remain correct historical evidence under the former interpretation. No ledger field, event, result, circuit argument, cross-call or forced disclosure is added. The exact accepted contract/witness ABI is unchanged. The complete V2 package remains draft and R61 remains open for the complete protocol. Only the bounded Phase 3A2 resource attempt is authorized; no Phase 3B authorization is implied.


## Accepted Phase 2B review decision — 2026-09-14

The [accepted coordinator availability model](06-merkle-tree.md#accepted-phase-2b-review-decision--2026-09-14) supplies untrusted leaf/index/path and tree-refresh data only. It must never receive or store authority/issuer/subject secrets, issuance nonces, commitment openings, complete private credential packages or private credential statements. Roles retain their own private packages and recovery records. Clients and circuits check every supplied index/path against finalized authoritative roots/counters; confidentiality, durable backup and recovery of operational tree history are required. No production backend is implemented in Phase 2B or Phase 3. This decision does not discharge D5's generated-artifact observability gate.

**Draft — User Review Required.** Incorporates [V1 witnesses](../07-witnesses.md) adapter/snapshot/privacy obligations, replacing signature members with the following exact V2 records.

## Ordered semantic witness schemas

```text
IssuerMembershipWitnessV2 {
  record: IssuerRecordV2
  issuerIndex: Uint<16>
  path: IssuerMerklePathV2
}
CredentialMembershipWitnessV2 {
  credentialIndex: Uint<16>
  path: CredentialMerklePathV2
}
IssuerRegistrationWitnessV2 {
  registryAuthoritySecret: Bytes<32>
  insertionPath: IssuerMerklePathV2
}
CredentialRegistrationWitnessV2 {
  issuerSecret: Bytes<32>
  credential: PrivateCredentialPackageV2
  issuerMembership: IssuerMembershipWitnessV2
  insertionPath: CredentialMerklePathV2
}
CredentialRevocationWitnessV2 {
  issuerSecret: Bytes<32>
  issuerMembership: IssuerMembershipWitnessV2
  issuanceNonce: Bytes<32>
  credentialId: Bytes<32>
  credentialCommitment: Bytes<32>
  credentialMembership: CredentialMembershipWitnessV2
  revocationPath: RevocationMerklePathV2
}
QualificationWitnessV2 {
  credential: PrivateCredentialPackageV2
  subjectSecret: Bytes<32>
  issuerMembership: IssuerMembershipWitnessV2
  credentialMembership: CredentialMembershipWitnessV2
  revocationPath: RevocationMerklePathV2
}
```

Private declarations: `registryAuthoritySecretWitness(): Bytes<32>` for construction; `issuerRegistrationWitnessV2(): IssuerRegistrationWitnessV2`; `credentialRegistrationWitnessV2(): CredentialRegistrationWitnessV2`; `credentialRevocationWitnessV2(): CredentialRevocationWitnessV2`; `qualificationWitnessV2(): QualificationWitnessV2`. All are witness callbacks, not exported lifecycle circuits. Generated TypeScript signatures and exact private-state/value return tuple must be used; adapters may not reinterpret positional data unchecked or use `any` to evade type mismatch.

Each callback supplies one immutable operation-scoped snapshot, validates lengths/ranges/presence locally, does not mutate shared state in place, and propagates safe diagnostic codes without secret-bearing values. Circuit checks remain authoritative even when adapters validate. Root/counter/configuration values in a witness or backend snapshot are never trusted substitutes for ledger reads. Paths may be stale or malicious and must be constrained. A missing secret/path fails safely, without remote fallback or fake data.

## Knowledge boundaries

Authority registration uses no issuer secret. Credential registration/revocation use no subject secret. Qualification uses no authority/issuer secret. Revocation uses no credential opening or full statement. The holder's private package includes credential opening and issuance nonce; its subject opening stays holder-controlled. Confidential coordination may carry required private tree/assignment data, but no role secret goes to a backend, verifier, wallet-selected prover, analytics or remote service. Do not hardcode secrets or real credentials in fixtures.

## Public-value terminology (review correction, 2026-09-14)

**Protocol-public/non-secret caller data** is intentionally shareable application data. **Ledger-public state** is actually stored in the public ledger. **Observed generated material** is what input/output descriptors, public query transcripts, partitioned transcripts and effects actually contain. These are not interchangeable: an exported Compact argument is not automatically chain-observable; it may be carried privately or bound through a communication commitment. A disclose acknowledgment alone does not prove raw chain exposure.

D5's issuer control commitment remains intentionally non-secret. Phase 3 must inspect generated artifacts and the call integration boundary to prove whether the raw commitment has the required observable boundary with exactly nine ledger fields and a unit return. Do not add disclose merely to force exposure. If the boundary cannot be met, stop for review; do not add ledger fields/outputs or silently reinterpret D5. The Phase 1 time probe input descriptor is evidence about that descriptor, not a general exported-argument observability guarantee.

### Phase 3A observation — 2026-09-14

**D5 unsupported with the implemented interface.** The pinned generated `registerIssuerV2` argument is represented in `proofData.input.value[0]`, which installed CompactJS classifies as `private.input`. It is absent as a raw value from the public query program, guaranteed partition, ledger cells/Set, and unit output; there is no fallible partition. The derived issuer leaf and new root are observable, but do not satisfy raw-commitment visibility. Structural runtime/ledger partition inspection and source evidence are preserved in the [Phase 3A report](../../development/phase-3a-register-issuer-report.md). No forced disclosure, extra field, event or return value was introduced; work stopped before full key generation for user review.

The implemented registration witness contains exactly `registryAuthoritySecret` then `insertionPath`, whose only member is the 16-entry `siblings` vector. The circuit requests it once into a local constant. The test adapter returns a detached snapshot, freezes object/array containers and does not mutate input private state. Byte arrays are copied, not claimed to be JavaScript deeply immutable. Synchronous generated execution consumes the snapshot without a second callback. Authority secret bytes occur only in private witness material in the canary test. Registration discloses only the final issuer leaf for the duplicate Set and final new root for the root write. Constructor disclosures remain unchanged.

## Intended exposure inventory (verify generated material)

| Value | Where and why public | Permitted disclosure boundary |
|---|---|---|
| deployment registry context | Constructor configuration, sealed state, public deployment record | Checked public argument only |
| authority control commitment | Sealed authority state and public record | Final typed high-entropy control hash only |
| supplied issuer control commitment | Non-secret caller data; raw observable boundary is a Phase 3 gate | Secret is absent; no forced disclosure or presumed chain exposure |
| canonical issuer leaf | registeredIssuerLeaves public Set | Final derived leaf; includes no private role secret |
| registration nullifier | registeredCredentialNullifiers Set | Final context/address-bound duplicate guard; no presentation reuse |
| new issuer/credential/revocation roots | Respective public root writes | Final computed root only |
| reconstructed current roots/control hashes | Equality against public state where compiler requires acknowledgment | Final value matching existing public state on success; never a path or secret |
| next counters | Public ledger increments/checks | Derived only from public counters |
| request fields | All ten are protocol-public verifier metadata; inspect actual generated boundary | Digest binding and time-query effects are separately checked |
| requestIssuedAt/requestExpiresAt | Public block-time transcript bounds | Exactly `disclose(requestIssuedAt)` and `disclose(requestExpiresAt)` in time APIs |
| requestDigest/stateDigest | Exactly two proof result fields | Final typed digests only |

Inspect ledger queries for sealed configuration, roots and counters in the generated transcript. Successful proof verification establishes constraints, but not every assertion or input is raw public transcript material. No credential statement, credential ID, subject/credential commitment, issuance nonce, opening, secret, credential timestamp, membership index/path or issuer membership record may be intentionally emitted as a protocol-public argument/result/log/extra ledger field. Issuer-leaf and nullifier disclosures are intentional V1-style public guards; metadata timing and counts remain visible. Check generated input/output descriptors, query programs, partitioned transcripts and ledger effects separately, not just `disclose` spelling. Do not disclose private data to silence a compiler diagnostic. Unexpected public effects block implementation pending review.

The local proof server receives witnesses and belongs to the trusted local boundary. Witness-bearing browser proof requests must use exactly `http://127.0.0.1:6300`. Reject redirects/substitution to other origins, remote fallback, wallet `proverServerUri`, `connectedAPI.getProvingProvider(...)`, and unverified providers. Wallet balancing/signing/DUST/submission does not authorize application roles. Local endpoint use alone does not establish trust in a compromised host or prover process.
