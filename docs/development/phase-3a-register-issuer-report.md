# Phase 3A — registerIssuerV2

**Date:** 2026-09-14. **Draft — User Review Required.**
**Outcome:** issuer registration implemented and locally simulated; **D5 unsupported, stopped before full key generation**. JustProof V1 / Protocol V2 is not frozen or release-ready.

## Implementation and exact ABI

Production source: [just-proof.compact](../../contracts/just-proof.compact).
Constructor and all nine ledger fields retain Phase 2 semantics. The sole lifecycle endpoint is:

```compact
export circuit registerIssuerV2(issuerControlCommitment: Bytes<32>): []
```

Ordered witness schema and callback:
```compact
export struct IssuerRegistrationWitnessV2 {
  registryAuthoritySecret: Bytes<32>,
  insertionPath: IssuerMerklePathV2
}
witness issuerRegistrationWitnessV2(): IssuerRegistrationWitnessV2;
```
`IssuerMerklePathV2` contains only `siblings: Vector<16, Bytes<32>>`.
The existing constructor callback remains `registryAuthoritySecretWitness(): Bytes<32>`.
Generated callbacks both return `[PS, value]`; registerIssuer has exactly one Bytes<32> argument and unit output.
Generated `circuits`, `impureCircuits`, and `provableCircuits` each contain only `registerIssuerV2`; no pure/diagnostic production endpoint exists.

The circuit reads sealed context/authority, rejects zero control and zero authority secret, calls the operation witness once, authenticates the exact authority hash, checks capacity before narrowing, derives issuer ID/record/leaf internally, checks duplicate Set membership, authenticates the empty slot and computes the replacement root using the same checked index/path. All assertions and the bounded increment precede the three writes. There is no issuer-secret, PoP, caller record/ID/root/direction dependency. Arbitrary nonzero public commitments are accepted with authority knowledge: usability/possession at registration is deliberately not guaranteed.

The test adapter copies byte arrays, returns one detached snapshot and freezes structural containers. Typed-array contents are not claimed to be deeply frozen by JavaScript. Generated execution is synchronous, requests the witness once and does not mutate its input private state. New support/tests contain no unchecked `any` adaptation. Boundary state overrides use the installed immutable StateValue/ChargedState APIs solely for synthetic tests.

## Exact files changed in Phase 3A

| File | Purpose |
|---|---|
| contracts/just-proof.compact | Registration witness and sole lifecycle circuit |
| contracts/managed/just-proof/compiler/contract-info.json | Compiler-generated metadata |
| contracts/managed/just-proof/contract/index.d.ts | Compiler-generated types |
| contracts/managed/just-proof/contract/index.js | Compiler-generated simulation |
| contracts/managed/just-proof/contract/index.js.map | Compiler-generated source map |
| contracts/managed/just-proof/zkir/registerIssuerV2.zkir | Compiler-generated circuit |
| test/contract/v2-constructor.test.ts | Retain six constructor tests; update incremental ABI expectation and provide unused registration witness callback |
| test/contract/v3a-register-issuer.test.ts | 21 focused registration/atomicity/disclosure tests |
| test/support/v3a-register-issuer.ts | Typed simulation harness, synthetic state overrides, partition adapter and structural inspection |
| docs/protocol/v2/07-witnesses-and-disclosures.md | Exact implemented witness/disclosures and D5 finding |
| docs/protocol/v2/10-specification.md | Incremental endpoint status and review stop |
| docs/protocol/v2/requirements.md | Relevant traceability statuses |
| docs/development/phase-3a-register-issuer-report.md | This report |
| docs/development/evidence/phase-3a/d5.json | Non-secret structural findings and complete public/partitioned transcript |
| docs/development/evidence/phase-3a/snapshots.json | Complete nine-field success/failure snapshot pairs |
| docs/development/evidence/phase-3a/artifacts.json | Artifact fingerprints, pinned package versions and frozen V1 hashes |

Generated artifacts were produced exclusively by the pinned WSL compiler, never hand-edited. Existing diagnostic artifacts remain outside production. Core Phase 2 domains, derivations, constants and Merkle helpers were reused without modification. No historical Phase 1/2/2B report was edited.

## Environment, compilation and resources

WSL Linux `5.15.146.1-microsoft-standard-WSL2`; repository `/home/oluwatobiss/projects/midnight/risein/just-proof`.
Verified with `uname -r`, `pwd`, `compact --version`, explicit compiler version/language/runtime queries, `node --version`, and `npm --version`:

| Component | Observed |
|---|---|
| Compact developer CLI | 0.5.2 |
| Explicit compiler/toolchain | 0.31.1 |
| Language | 0.23.0 |
| Compact runtime | 0.16.0 |
| Installed CompactJS | 2.5.1 |
| Installed ledger-v8 | 8.1.0 |
| Installed midnight-js-contracts | 4.1.1 |
| Node / npm | v24.18.0 / 11.16.0 |

Package versions above come from installed package manifests, not assumptions about latest npm releases. No installation/version change or registry configuration occurred.

Compilation command (same source/output selection throughout):
```bash
/usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' compact compile +0.31.1 --skip-zk contracts/just-proof.compact contracts/managed/just-proof
```
The final reproduced run redirected output to `/tmp/justproof-phase3a/skip-reproduced.log`.
It exited **0**, elapsed **1.55 seconds**, GNU time maximum RSS **222672 KiB**.
All generated file hashes matched the already-tested artifacts after this reproduction. This is compilation without key generation; the direct compiler measurement is not a whole-protocol proving-memory estimate.

Prior conversation evidence records one initial compile failure:
```text
Exception: just-proof.compact line 60 char 19:
  expected right-hand side of = to have type Uint<32> but received Uint<0..4294967297>
Command exited with non-zero status 255
elapsed=5.57 exit=255 maxrss_kib=221864
```
The fix casts the increment after the authoritative capacity check; it does not weaken capacity. The first corrected build exited 0 (4.50 s, 222232 KiB). A subsequent successful skip build moved the increment calculation before the writes; its timing log was lost. Four skip invocations occurred across the interrupted work: one failed and three succeeded, including the final reproduction. No full key-generation invocation occurred in Phase 3A.

Earlier `/tmp` logs/baseline disappeared between sessions. The failure/earlier timing above is retained conversation evidence; the final reproduced measurement and current artifact hashes are fresh evidence. This limitation is not concealed as a surviving file audit.

**Full key generation: not attempted because D5 failed.** Therefore no 900-second attempt, process-tree full-build memory measurement, new parameter retrieval, completed keys, proof generation, proof verification or ledger/deployment result exists. No resource retries or synthetic worst-case probe occurred. R61 remains open at whole-protocol/release level, as directed.

The previously downloaded `/home/oluwatobiss/.cache/midnight/zk-params/bls_midnight_2p19` remains present (100663684 bytes). Its Phase 2B hash remains a local fingerprint, not an independently authenticated official checksum. This phase did not write or fetch parameters.

## Tests and validation

All **268 tests passed**: the retained **247** Phase 2 cases plus **21** new cases; zero failures.
The final result and exact duration are recorded below. Tests exercise **compiled contract-logic simulation** and separately assembled conformance paths with a shared runtime. Neither layer constitutes proof generation or cryptographic verification.

```bash
npm run test:local -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/contract/v3a-register-issuer.test.ts
```

| File | Cases |
|---|---:|
| v2-domains.test.ts | 19 |
| v2-derivations.test.ts | 122 |
| v2-merkle.test.ts | 81 |
| v2-vectors.test.ts | 1 |
| v2-generated-types.test.ts | 18 |
| v2-constructor.test.ts | 6 |
| v3a-register-issuer.test.ts | 21 |

New test names/cases:

1. First and consecutive registrations use refreshed paths, unit returns and exactly three writes.
2. Last valid index 65535 increments to full sentinel 65536.
3. Zero authority rejects with all nine fields unchanged.
4. Wrong authority rejects with all nine fields unchanged.
5. Issuer substitution rejects with all nine fields unchanged.
6. Holder substitution rejects with all nine fields unchanged.
7. Zero commitment rejects before invoking the witness.
8. Wrong authority context derivation rejects atomically.
9. Wrong authority version derivation rejects atomically.
10. Wrong authority domain derivation rejects atomically.
11. Duplicate leaf rejects before late path processing.
12. Stale insertion path rejects after an unrelated registration.
13. Corrupted sibling rejects atomically.
14. Path valid only for another index rejects.
15. Occupied insertion position rejects.
16. Full counter rejects before narrowing.
17. Generated witness adapter rejects path length 15.
18. Generated witness adapter rejects path length 17.
19. Exactly one detached witness snapshot without issuer secret or proof of possession.
20. ABI exports only registerIssuerV2 and exactly the approved witness fields.
21. D5 structural partition inspection records unsupported raw public visibility.

The 65535 fixture is a synthetic counter-boundary state, not evidence that 65535 prior registrations were executed. Wrong authority domain/version/context cases replace the sealed hash in a synthetic runtime fixture; no circuit offers that mutation. Successful ordinary consecutive registration uses the actual returned state and refreshed reference-tree path.

An initial new-test run had 11 passes / 10 failures from incorrect test harness use of StateValue where ChargedState was required. Correcting that wrapper—not protocol logic—resolved the failures. The first complete resumed run passed 268/268 in 11.05 seconds. A final run adds positive structural checks that the partition really contains the leaf/root, avoiding vacuous absence evidence. Existing generated sourcemap warnings remain. No unrelated global application diagnostics were repaired.

Focused strict typecheck:
```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts test/support/v3a-register-issuer.ts test/contract/v3a-register-issuer.test.ts
```
Exit 0, no diagnostics. `git diff --check` passed. No unfiltered deployment-bearing suite was run.

## Success and failure ledger snapshots

[Complete snapshot pairs](evidence/phase-3a/snapshots.json) contain all nine field names, hash values, counters and sorted Set contents before and after each recorded call: five success pairs (including repeated setup successes) and sixteen failure pairs.

Every successful registration changes exactly `issuerRoot`, `nextIssuerIndex`, and `registeredIssuerLeaves`. The other six fields remain equal. Every tested early/late failure preserves all nine fields, the full encoded input state, and private-state input. Success also leaves its input state object unchanged and returns the replacement state, consistent with runtime persistence. These are simulation atomicity observations, not tested network transaction atomicity.

## Mandatory D5 location-by-location result

**D5 is unsupported for the required interface.** The raw commitment is intentionally non-secret caller data but is not exposed at the required public transaction boundary.

| Location | Raw commitment observed? | Structural evidence |
|---|---|---|
| Caller-supplied argument | Yes | Exact Bytes<32> value at callerArguments[0] |
| Generated argument descriptor | Yes | proofData.input.value[0], with Bytes<32> alignment |
| CompactJS private material | Yes | Installed ContractExecutable explicitly returns input under private.input |
| Private witness transcript outputs | No | Witness contains authority secret and insertion path only |
| Public transaction inputs | No raw commitment established | Generated input is private; public ledger/query material carries derived values only |
| Public query transcript | No | Exact-value traversal of typed operation arguments, encoded cells and read results |
| Guaranteed partition / effects | No | Actual installed partitionTranscripts execution; derived leaf/root positively found |
| Fallible partition / effects | No partition | Runtime returned undefined |
| Ledger state | No | Encoded nine-field state has derived leaf/root, not raw commitment |
| Circuit output | No | Exactly [] / empty value and alignment |

[Complete non-secret transcript evidence](evidence/phase-3a/d5.json) preserves the public query program, guaranteed partition and exact-match locations. Undefined fallible partition is omitted by JSON serialization. No private witness bytes or authority secret were exported.

The test invokes installed ledger-v8 `partitionTranscripts` with `PreTranscript`, after converting the generated runtime query context by the same StateValue.encode/decode procedure used in CompactJS. It preserves block/effect fields and commitment-index insertion. This mirrors the installed CompactJS partition adapter; it is not a mocked partition result. No wallet/prover/network API is used.

Source evidence: `node_modules/@midnight-ntwrk/compact-js/dist/esm/effect/ContractExecutable.js` separates `public.publicTranscript`/`public.partitionedTranscript` from `private.input`, `private.output`, and `private.privateTranscriptOutputs`. Generated `index.js` populates the Bytes<32> argument descriptor, reads the authority/context/root/counter, and pushes derived leaf/root values into the public query program. An argument descriptor is not proof of raw chain visibility.

Inspection compares whole typed byte values while traversing operation objects, encoded cells, arrays and Maps; it is not a byte-substring search. Positive exact matches for the raw caller input and for derived public leaf/root validate the inspection. No actual cryptographic proof was produced, so no claim is made about experimentally observed proof bytes.

## Disclosures and secret canary

Exactly four explicit disclosures exist in production: two unchanged constructor disclosures and two registration disclosures.

| Disclosure | Reason / public location |
|---|---|
| deploymentRegistryContext | Non-secret constructor configuration written to sealed context |
| authorityControlV2(deploymentRegistryContext, secret) | Final high-entropy typed hash written to sealed authority field |
| issuerLeafV2(record) | Final derived leaf used in public Set duplicate check/insertion |
| newRoot | Final root written to issuerRoot |

The raw issuer commitment is not force-disclosed. No secret, path, independent direction, record output or new ledger field was added. The authority canary is independently random, ephemeral and never persisted/logged. Boolean/structural tests confirm it is present in private witness outputs and absent from generated argument/output material, public operations, partitions/effects and encoded ledger. Persisted evidence contains public derived values only. No claim of independent cryptographic hashing or portable proof verification is made.

## Traceability, remaining limitations and review stop

R16 authority/witness behavior and R17 registration mutation/duplicate/path behavior passed simulation. R58/D5 is **unsupported** and blocks full key generation and continuation. R61 remains open for whole-protocol/release resources. The shared Compact-runtime trust base, approved development roots, and accepted untrusted coordinator model are unchanged.

No workaround or new public boundary is adopted. A user decision is required before further implementation. registerCredentialV2, revokeCredentialV2 and proveQualificationV2 remain unimplemented; no Phase 3B is authorized.

Frozen V1's twelve files match repository HEAD byte-for-byte; hashes are in the artifact evidence. The prior temporary phase baseline was lost, so preservation of untracked historical reports is based on the unchanged work actions and current content, not a claimed surviving pre-phase hash comparison. No frontend, provider, deployment script, package script/dependency, CI, Netlify, coordinator architecture, Preview or Preprod configuration was edited. No proof/proof-server/wallet/ledger/Preview/Preprod action occurred. No files were staged, committed, pushed, published or deployed.


## Final validation and artifact fingerprints

Final Vitest output (exit 0):
```text
     ✓ D5 structural partition inspection records unsupported raw public visibility  322ms

 Test Files  7 passed (7)
      Tests  268 passed (268)
   Start at  20:12:34
   Duration  11.74s (transform 6.22s, setup 0ms, import 13.86s, tests 16.92s, environment 5ms)

```

Final strict typecheck: exit 0, empty diagnostic log.

Production source SHA-256: `f27b2a13e71c68a85f70e6083b2457c3f4273475a15f6e061c39c9ba81e7a6db`.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| contracts/managed/just-proof/compiler/contract-info.json | 3411 | `92d3cae646e709824faa5cfc00cc045766d5c343f7a4c8faccd31cfbd1ebbdcb` |
| contracts/managed/just-proof/contract/index.d.ts | 9455 | `5ba30f01f19a6fd4661e44bf442d8cb5941076925dce1e161217de9aa7605561` |
| contracts/managed/just-proof/contract/index.js | 82685 | `c5166146f78904abe31c345c515d94ca56e77ca5d3e35d64724b54461a4433cc` |
| contracts/managed/just-proof/contract/index.js.map | 4351 | `65da16032cc013316bfd9a8eafbcce1be7b95718600bab9332d46c068bbf9839` |
| contracts/managed/just-proof/zkir/registerIssuerV2.zkir | 37980 | `ce061c319bdbdf15fad9fd53cdfb9f5602f66cc5fd1da745388e0b7ca978b699` |

No prover/verifier key or binary ZKIR was generated by these skip builds. No key-generation memory or proof measurement is available.

Evidence files:

- `docs/development/evidence/phase-3a/artifacts.json`: 3066 bytes; SHA-256 `c746fde0714ee2bd1b01fe9b592b1618193a2991de49b13fc177842d71e2236a`.
- `docs/development/evidence/phase-3a/d5.json`: 20044 bytes; SHA-256 `d3099d13ca6f63874c008eb7b14cca59b0ffda63a13b014c870a5becac401984`.
- `docs/development/evidence/phase-3a/snapshots.json`: 29555 bytes; SHA-256 `22707fac028328b5f612c75f1d08780d9f6da9899192cfc3abc5d5a5b7216a2d`.

## Final git status

```text
 M AGENTS.md
 M contracts/just-proof.compact
?? contracts/protocol-v2/
?? docs/development/
?? docs/protocol/v2/
?? test/conformance/
?? test/contract/
?? test/fixtures/
?? test/support/
```

The status includes pre-existing AGENTS/Phase 1/Phase 2 work and untracked directories; it is not a Phase 3A-only diff. Compiler outputs are ignored by git. The exact Phase 3A file list above includes those generated files.

## Reviewed D5 addendum — 2026-09-14 (Phase 3A2)

The user accepted the implementation and clarified that the non-secret raw commitment need not be chain-observable. The canonical issuer leaf/issuer root are authoritative; off-chain issuer records require canonical recomputation and current membership validation. R58 is resolved by reviewed clarification, while the original D5 finding above and its evidence remain unchanged. R61 stays open for the full protocol. See the [Phase 3A2 resource report](phase-3a2-register-issuer-resource-report.md) for the single authorized actual-circuit key-generation attempt and subsequent validation; no Phase 3B is authorized.
