# Phase 2 — primitives, candidate vectors and constructor

**Date:** 2026-09-14. **Status:** Local Phase 2 implementation and tests complete; resource feasibility blocked; stopped for user review. **Draft — User Review Required.**

Product milestone: **JustProof V1**. Working protocol: **JustProof Protocol V2 — Commitment-Based Authorization**. D1–D8 are conditionally approved working decisions; this report does not freeze the complete specification or authorize Phase 3.

## Outcome

Implemented internal typed derivations for all 18 V2 domains, fixed-depth-16 Merkle direction/root/membership/empty-slot helpers, an untrusted synthetic reference tree, complete candidate vectors, and the constructor with exactly nine ledger fields. Production exports **zero lifecycle circuits** in this phase. None of registerIssuerV2, registerCredentialV2, revokeCredentialV2 or proveQualificationV2 was implemented.

**247/247 focused Vitest tests passed; zero failed.** Focused TypeScript checking passed. Tests use generated Compact JavaScript for compiled contract-logic simulation, plus separately assembled reference descriptors. **No real proof was generated or verified; no deployment or chain integration ran.**

The single full resource attempt failed because zkir attempted to fetch unavailable `bls_midnight_2p19` parameters. No completed key-generation resource result exists. This is a **Phase 3 blocker**, not evidence that the approved hashes/depth are impractical. No retry/download or hash/depth weakening was performed.

## Narrow specification corrections and dated addendum

Before implementation, corrected V2 documentation to define:
- minimum durable indexed leaf/node/update custody, path refresh and recovery limitations, with no production backend choice and no coordinator authority;
- non-secret caller data versus ledger-public state versus actually observed generated input/output/query/effect material; exported arguments are not automatically chain-observable;
- shared-runtime cross-path agreement instead of independent cryptographic implementations;
- exact manifest field/array order, restricted ASCII/UTF-8 compact JSON bytes, no BOM/whitespace/newline/extra or duplicate fields, raw SHA-256 lowercase-hex fingerprint, and separate developer-CLI/compiler/toolchain versions;
- consistent networkId, explicit identityFormatVersion versus envelope schemaVersion, artifactFingerprint in both authenticated header and encrypted plaintext, and future synthetic manifest/AAD/encryption vectors;
- Uint<64> spelling, public requestIssuedAt versus private issuedAt in R35, and missing prose spaces.

The Phase 1 report has a dated 2026-09-14 correction addendum. Its original probe source and numeric measurements are preserved. Full specification status remains draft. R57–R61 record the operational, D5-observability, conformance-review, identity-format and resource gates.

## Exact files changed

Existing production source modified:
- [contracts/just-proof.compact](../../contracts/just-proof.compact) — replaces the placeholder with only the Phase 2 constructor and exact nine-field ledger.

Existing V2/report documents modified:
- [docs/development/phase-1-specification-report.md](../../docs/development/phase-1-specification-report.md)
- [docs/protocol/v2/09-verification.md](../../docs/protocol/v2/09-verification.md)
- [docs/protocol/v2/README.md](../../docs/protocol/v2/README.md)
- [docs/protocol/v2/06-merkle-tree.md](../../docs/protocol/v2/06-merkle-tree.md)
- [docs/protocol/v2/05-ledgers-and-constructor.md](../../docs/protocol/v2/05-ledgers-and-constructor.md)
- [docs/protocol/v2/requirements.md](../../docs/protocol/v2/requirements.md)
- [docs/protocol/v2/12-conformance-vectors.md](../../docs/protocol/v2/12-conformance-vectors.md)
- [docs/protocol/v2/08-proofs.md](../../docs/protocol/v2/08-proofs.md)
- [docs/protocol/v2/11-deployment-and-private-identity.md](../../docs/protocol/v2/11-deployment-and-private-identity.md)
- [docs/protocol/v2/10-specification.md](../../docs/protocol/v2/10-specification.md)
- [docs/protocol/v2/07-witnesses-and-disclosures.md](../../docs/protocol/v2/07-witnesses-and-disclosures.md)

New source, tests, fixtures, vectors and report:
- [contracts/protocol-v2/candidate-roots.compact](../../contracts/protocol-v2/candidate-roots.compact)
- [contracts/protocol-v2/derivations.compact](../../contracts/protocol-v2/derivations.compact)
- [contracts/protocol-v2/domains.compact](../../contracts/protocol-v2/domains.compact)
- [contracts/protocol-v2/merkle.compact](../../contracts/protocol-v2/merkle.compact)
- [contracts/protocol-v2/types.compact](../../contracts/protocol-v2/types.compact)
- [docs/development/phase-2-primitives-constructor-report.md](../../docs/development/phase-2-primitives-constructor-report.md)
- [test/conformance/v2-derivations.test.ts](../../test/conformance/v2-derivations.test.ts)
- [test/conformance/v2-domains.test.ts](../../test/conformance/v2-domains.test.ts)
- [test/conformance/v2-generated-types.test.ts](../../test/conformance/v2-generated-types.test.ts)
- [test/conformance/v2-merkle.test.ts](../../test/conformance/v2-merkle.test.ts)
- [test/conformance/v2-vectors.test.ts](../../test/conformance/v2-vectors.test.ts)
- [test/conformance/vectors/protocol-v2-candidates.json](../../test/conformance/vectors/protocol-v2-candidates.json)
- [test/contract/v2-constructor.test.ts](../../test/contract/v2-constructor.test.ts)
- [test/fixtures/generate-phase2-vectors.ts](../../test/fixtures/generate-phase2-vectors.ts)
- [test/fixtures/phase2-constructor.compact](../../test/fixtures/phase2-constructor.compact)
- [test/fixtures/phase2-primitives.compact](../../test/fixtures/phase2-primitives.compact)
- [test/fixtures/phase2-resource.compact](../../test/fixtures/phase2-resource.compact)
- [test/support/v2-reference.ts](../../test/support/v2-reference.ts)
- [test/support/v2-vectors.ts](../../test/support/v2-vectors.ts)

Purpose by group:
- contracts/protocol-v2: ordered structs, 18 domain constants, typed hash/commitment derivations, fixed Merkle helpers, and explicitly candidate root constants. Top-level const is not accepted by compiler 0.31.1; domain/root constants are internal constant-valued circuits using explicit byte vectors. They add no ledger or lifecycle exports.
- test/fixtures: isolated diagnostic sources, synthetic resource source, and deterministic vector-generation command. No diagnostic source is included by production; the constructor diagnostic includes the production source in the opposite direction.
- test/support: separately assembled pinned-runtime descriptors, synthetic fixtures, vector assembly, and an untrusted hash-only reference tree for tests/path refresh.
- test/conformance and test/contract: focused Vitest checks against generated behavior, generated types and candidate data.
- Compiler-generated files under contracts/managed and test/fixtures/managed are listed below. They are ignored by the existing managed/ rule; no generated file was hand-edited or staged.

No provider, frontend, deployment script, package script/dependency, CI or Netlify file was edited. Existing AGENTS.md changes and the previously saved audit were preserved.

## Pinned environment and commands

Observed in the current repository in WSL:
- Linux 5.15.146.1-microsoft-standard-WSL2; repository /home/oluwatobiss/projects/midnight/risein/just-proof.
- Node 24.18.0; npm 11.16.0; Compact developer CLI 0.5.2.
- Explicit compiler/toolchain 0.31.1; language 0.23.0; runtime 0.16.0; compiler ledger target ledger-8.0.2.
- Installed CompactJS 2.5.1; Midnight.js contracts 4.1.1; Vitest 4.1.11. No dependency/toolchain installation or version change.

Read-only checks included `cat AGENTS.md`, `cat .tome/RULES.md`, `git status --short`, `pwd`, `uname -sr`, `node --version`, `npm --version`, `compact --version`, `compact compile +0.31.1 --version`, `--language-version`, `--runtime-version`, `--ledger-version`, installed package/source reads, `free -m`, `df -h /tmp`, and zkir help/cache-file inspection. No latest-version network checks or dependency commands were run in Phase 2.

Authoritative compilation commands:
```bash
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 --skip-zk test/fixtures/phase2-primitives.compact test/fixtures/managed/phase2-primitives
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 contracts/just-proof.compact contracts/managed/just-proof
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 --skip-zk test/fixtures/phase2-constructor.compact test/fixtures/managed/phase2-constructor
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 --skip-zk test/fixtures/phase2-resource.compact /tmp/justproof-phase2/resource-skip
```

| Command target | Exit | Elapsed | What completed |
|---|---:|---:|---|
| Pure diagnostic primitives | 0 | 1.72 s | Generated JS/declarations/compiler metadata; pure diagnostic exports, no proving keys |
| Production constructor | 0 | 6.20 s | Generated constructor and nine-field ledger; no lifecycle circuits/keys |
| Constructor knowledge diagnostic | 0 | 7.77 s | Generated simulation/bindings and text ZKIR; key generation skipped |
| Resource --skip-zk | 0 | 3.76 s | Generated simulation/bindings/metadata and text ZKIR; not a proof or full key build |

An isolated /tmp byte-literal syntax probe found that top-level const is a parse error; replacing it with an internal constant-valued circuit returning `[byte,...] as Bytes<N>` compiled. The initial multi-command shell did not separately capture that compiler failure's exit status; no unsupported top-level const remains in production.

Vector generation:
```bash
node_modules/.bin/vite-node test/fixtures/generate-phase2-vectors.ts
```
Final run exit 0. Initial sandbox invocation failed with spawnSync compact EPERM while checking versions; the approved retry completed locally. Final vector generation after adding complete empty/populated paths and provenance also completed exit 0. No package installation was needed.

Final focused test command:
```bash
npm run test:local -- test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts
```
Exit 0, **6 files / 247 tests passed**, duration 12.93 s. This uses the unchanged existing local script with explicit file filters; the existing unfiltered suite includes an actual deployment fixture and was intentionally not executed.

Focused type check:
```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --types node --target ES2022 --module ES2022 --moduleResolution bundler test/support/v2-reference.ts test/support/v2-vectors.ts test/fixtures/generate-phase2-vectors.ts test/conformance/v2-domains.test.ts test/conformance/v2-derivations.test.ts test/conformance/v2-merkle.test.ts test/conformance/v2-vectors.test.ts test/conformance/v2-generated-types.test.ts test/contract/v2-constructor.test.ts
```
Exit 0, no diagnostics. Earlier invocation corrections added TypeScript 6's required --ignoreConfig and explicit installed Node types; no dependencies/configuration were changed.

## Test results and interpretation

| File | Final passed / failed | Named coverage |
|---|---:|---|
| v2-domains.test.ts | 19 / 0 | Each exact label/byte order and manifest value; newline/V1-tag differences; exactly 18 distinct domains; retained qualification |
| v2-derivations.test.ts | 122 / 0 | Generated/raw typed agreement and alignment roundtrip; every nested scalar mutation; domain/version/context/nonce/time/request/opening changes; reversed reference order; commitment versus plain hash; separately assembled complete derivation chain |
| v2-merkle.test.ts | 81 / 0 | Three trees, boundary/mixed indices, each of 16 changed direction positions, membership and empty-slot checks, full/invalid counters, wrong index/domain/sibling/length, occupied slot and refreshed paths after unrelated changes |
| v2-vectors.test.ts | 1 / 0 | Complete deterministic candidate data, source/generated provenance hashes, all 17 levels and empty/populated boundary paths |
| v2-generated-types.test.ts | 18 / 0 | Ordered fields for all 16 unique preimage types; nested statement/request/state order; exact Uint widths in generated source; explicit shared-runtime delegation |
| v2-constructor.test.ts | 6 / 0 | Exact nine fields/empty Sets/zero counters/roots; zero rejection; different identity semantics; matching/wrong/cross-role knowledge with unchanged state; ephemeral canary disclosure inspection; exact constructor disclosures and no lifecycle exports |

Negative hash cases demonstrate changed binding/hash output, not lifecycle rejection: the primitive hash function itself may hash a wrong version; Phase 3 must reject invalid semantic records. Counter/membership/constructor diagnostic negatives exercise generated assertions. Cross-role randomness/independence is a generation obligation, not something these primitive tests can prove globally.

Intermediate runs:
- First 5-file run: 122 passed, 107 failed (229 total). Failures were test-harness extra undefined arguments rejected by strict generated functions and Buffer.slice aliasing in synthetic mutation tests. Fixed by preserving exact call arity and copying bytes; no protocol change.
- Corrected 5-file run: 229 passed, 0 failed.
- Added generated-type inspection: 246 passed, 1 failed (247 total). A test string parser stopped at an inline ContractAddress brace; replaced with the already installed TypeScript AST parser.
- Final 6-file run: 247 passed, 0 failed.

Generated source-map warnings about missing source files remain warnings; generated maps were not hand-edited. No proof-server /check, /prove, mocked provider acceptance, cryptographic proof verification or network state test is represented by these counts.

## Candidate constants and vector locations

Candidate roots (not frozen/release-approved):
| Tree | Lowercase Bytes<32> hex |
|---|---|
| issuer | `e9e09e4fa4cbf338a1b9ccef8cf3bfef63a11b7369c9279f902fb5014af0d3ad` |
| credential | `fa151b227368f61e42bbbd5c7d2b0ea295a1fe142dd4e916142745b9ff75d656` |
| revocation | `67cc1987e1b41a3e011478484861b497e304aa0a8a0699297b98be32eef977c8` |

These differ from the earlier untrusted Antigravity values. Source: [contracts/protocol-v2/candidate-roots.compact](../../contracts/protocol-v2/candidate-roots.compact). Complete vectors: [test/conformance/vectors/protocol-v2-candidates.json](../../test/conformance/vectors/protocol-v2-candidates.json) (**140897 bytes**, SHA-256 `58bf0b9edbea2143e7595816b5e33aaa238ab80e2f6d49ee920b5b120ffc91b3`). The JSON records exact fields/alignment/aligned values, synthetic openings, separate generated/reference outputs, empty leaf and all 16 parents per tree, all 18 derivation cases, boundary indices 0/1/32767/32768/65535, populated paths, full-counter sentinel 65536, and two-field output digests. Generator/reference locations are listed above.

All 18 domain constants are exact raw SHA-256 label bytes, byte 0 first; no newline/NUL/BOM and no endian reversal:
| Symbol suffix | Exact label | Lowercase hex |
|---|---|---|
| REGISTRY_AUTHORITY_CONTROL | `JP:REGISTRY-AUTHORITY:CONTROL-COMMITMENT:V2` | `041195cccf3d2478134564cd763f85c43651d07c7162404638dc92556a96739d` |
| ISSUER_CONTROL | `JP:ISSUER:CONTROL-COMMITMENT:V2` | `75789ba30e63431456ef6a210602fdd264f60dae655d7e5c6fb66ebcb0ec30ae` |
| ISSUER_ID | `JP:ISSUER:ID:V2` | `000cff8bf7318394e234a89ec37474047e8878dd54760ea537b701080199a926` |
| ISSUER_LEAF | `JP:ISSUER:LEAF:V2` | `9e9928281d6500cb13eefc68a2016715061b7e4494d9db1dd4bb91721007d544` |
| CREDENTIAL_ID | `JP:CREDENTIAL:ID:V2` | `0ad6d845bc733846f7f6b3917083ba50c122cd127ba98823a7d1dfd002e69e81` |
| SUBJECT_COMMITMENT | `JP:SUBJECT:COMMITMENT:V2` | `8a65d117dc43d15df1382048ad7b3d15060c8577d25d5a59ebe065fe01fa0173` |
| CREDENTIAL_COMMITMENT | `JP:CREDENTIAL:COMMITMENT:V2` | `cd625a02c4b906e325c373f2fe106761689302c59ee770b2dc86920923b68ecd` |
| CREDENTIAL_LEAF | `JP:CREDENTIAL:LEAF:V2` | `8c6ff789c9bf4e5d48dca96ebff8513f61508a69e443bb7cfc79540406ef09f3` |
| CREDENTIAL_REGISTRATION_NULLIFIER | `JP:CREDENTIAL:REGISTRATION-NULLIFIER:V2` | `fe65d324a624715af14244d6c2abb9dfc251b2609c58cdca24c36730f2f60f36` |
| ISSUER_EMPTY | `JP:ISSUER:EMPTY:V2` | `6552a0855810a4ebcad247eba441b99ae0b7361afe3935b11ec527cf402fe8a1` |
| CREDENTIAL_EMPTY | `JP:CREDENTIAL:EMPTY:V2` | `d83db46371879221acdd35291aa00322a17e0441e02886fef1ba78a63ec25b81` |
| REVOCATION_NOT_REVOKED | `JP:REVOCATION:NOT-REVOKED:V2` | `44955b7e44458ef89d309b54a4f08c6663f5ecc6da9c150157650baca95f6f24` |
| REVOCATION_REVOKED | `JP:REVOCATION:REVOKED:V2` | `69709dbf8aeb6534ec5580e86aa330e512f7358e9c733b80d60786d777fc76db` |
| ISSUER_MERKLE_NODE | `JP:ISSUER:MERKLE:NODE:V2` | `31adbe635d437cf017ce4e0dd97275791a12312326ca4f250ec59188959c9ae4` |
| CREDENTIAL_MERKLE_NODE | `JP:CREDENTIAL:MERKLE:NODE:V2` | `c79013b6526d61308d38da060db894afb9ba87f08f6ae57a57f451dff63bfb91` |
| REVOCATION_MERKLE_NODE | `JP:REVOCATION:MERKLE:NODE:V2` | `09785f97ac0de3e1c013ea0eaef955f9e8a74b4f14c4cb78efd31446862a3bea` |
| PROOF_REQUEST | `JP:PROOF:REQUEST:V2` | `6be08866846f0221d03a53174ed029012413faf9db98009296a9dcb64503d071` |
| PROOF_STATE | `JP:PROOF:STATE:V2` | `3be3e3097e1ceecad2e7ecc590e556bb34806abe06ad79f136abe713a04e2eb2` |

The separate preserved qualification identifier is `3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7` (schema version 1); cryptographic protocolVersion is 2. This is not a nineteenth V2 domain.

### Shared-trust limitation

The off-chain path explicitly assembles ordered descriptors using installed Compact runtime primitive descriptors. The compiler-generated path assembles its own descriptors from Compact types. Tests inspect generated metadata, TypeScript AST field order, integer widths and runtime delegation. Both paths call the **same Compact runtime/onchain-runtime hashing and serialization machinery**. Agreement catches assembly/order/domain/index errors but is not an independent cryptographic implementation or proof of runtime correctness. No alternate serialization or separate crypto implementation was invented. Root approval requires this limitation, both paths and generated inspection to be reviewed by the user. Diagnostic source/artifact hashes in vector provenance are not the later complete deployment manifest.

## Constructor and disclosure observations

Production constructor takes the non-secret deployment context, rejects zero context and zero authority secret, obtains the secret through registryAuthoritySecretWitness, derives the typed context/version/domain-bound control hash internally, and stores only the final control commitment. Context and commitment are sealed. Both counters are zero, both Sets empty, and the three candidate roots match complete vector reconstruction.

The actual decoded nine fields, in order, are registryAuthorityControlCommitment, registryContext, issuerRoot, nextIssuerIndex, registeredIssuerLeaves, credentialRoot, nextCredentialIndex, registeredCredentialNullifiers, revocationRoot. No convenience/mirrored state or extra protocolVersion field was added.

The production source has exactly two intended disclose wrappers: deploymentRegistryContext for ledger-public configuration and the **final** authorityControlV2 hash for ledger assignment. No wrapper surrounds the secret. Generated code shows the secret in the witness/private transcript path, not as a ledger value. The diagnostic knowledge check has empty argument/output value arrays, checks the stored hash using a private witness, and exposes no canary in its ledger/query/effect projection. Its private witness transcript does contain the canary as expected. An ephemeral random canary was checked against serialized contract state and public material with Boolean-only assertions to avoid printing it.

A different nonzero secret at construction is not intrinsically invalid: it creates a different authority identity. The test verifies that difference; a separate test-only knowledge check rejects the wrong secret against an already initialized commitment. No issuer-registration circuit was smuggled into Phase 2.

These observations do not establish chain observability of raw exported arguments in future lifecycle calls. D5 raw commitment visibility remains a Phase 3 generated-artifact/integration gate, with exactly nine fields and [] return; inability to meet it requires review, not forced disclose or new state.

## Resource probe and unexpected network-fetch deviation

Source: [test/fixtures/phase2-resource.compact](../../test/fixtures/phase2-resource.compact). This is a synthetic non-production resource shape, not an implemented lifecycle. It contains issuer membership, credential membership, old and new revocation folds (four depth-16 paths), representative control/identifier/leaf hashes and subject/credential commitments. Its extra synthetic subject opening is a cost representative, not a change requiring holder participation in actual revocation.

Before the full attempt, WSL reported 7,862 MiB RAM, about 4,560 MiB available and 937 GiB disk free. Existing public zk-params (up to 2p17) were copied to a writable temporary cache; no package or compiler installation occurred. The single attempt was sandboxed with restricted network access and two Rayon threads:
```bash
mkdir -p /tmp/justproof-phase2/cache/midnight
cp -r /home/oluwatobiss/.cache/midnight/zk-params /tmp/justproof-phase2/cache/midnight/
env XDG_CACHE_HOME=/tmp/justproof-phase2/cache RAYON_NUM_THREADS=2 /usr/bin/time -f 'elapsed=%e exit=%x maxrss_kib=%M' timeout --signal=TERM --kill-after=10s 900 compact compile +0.31.1 test/fixtures/phase2-resource.compact /tmp/justproof-phase2/resource-full > /tmp/justproof-phase2/resource-full.log 2>&1
```

Exact output:
```text
Compiling 1 circuits:
Error: Failed to fetch data from https://midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com/bls_midnight_2p19 after 3 attempts. Giving up.
Exception: zkir returned a non-zero exit status 1
Command exited with non-zero status 255
elapsed=235.05 exit=255 maxrss_kib=245768
```

**One full key-generation attempt only.** It exited 255 after **235.05 s**, before the 900-second timeout; peak reported RSS **245,768 KiB**. Prover and verifier files are **zero-byte incomplete files**, not usable keys. Binary ZKIR was emitted (6,163 bytes); the earlier --skip-zk textual ZKIR is 70,672 bytes. These are artifact sizes, not row counts or real proving performance.

The compiler's internal S3 fetch was unexpected and conflicts with the intended no-network probe. The log records three internal fetch attempts within the one compiler invocation; no download completed. I cannot claim that no network fetch was attempted or infer successful offline feasibility. No manual fetch, permission escalation for downloading, second full build or remote prover fallback was performed. This report explicitly records the deviation rather than claiming an entirely offline full attempt. Missing approved offline parameters and unmeasured successful full resource cost block Phase 3; a future remedy requires review/authorization. No hash/depth/authorization requirement was weakened.

## Separate timing layers

- Compact compilation/key generation: table above; full resource attempt failed and is not a completed build measurement.
- Generated production initialState execution: one local 10-call sample with context creation outside the timer, module imports excluded, synthetic values only. Samples (ms): 1245.194, 849.012, 724.522, 772.815, 602.382, 507.512, 805.855, 224.012, 439.946, 274.095. Mean **644.534 ms**. This was measured while other local validation ran, so it is a descriptive sample, not an isolated performance benchmark.
- Measurement command: `node_modules/.bin/vite-node /tmp/justproof-phase2/measure-constructor.ts`; exit 0. Harness calls only generated initialState and records performance.now deltas; no network/prover/wallet.
- Actual local proof generation: **not run**.
- Actual local proof verification: **not run**.
- Complete local deployment/ledger integration: **not run**.
- Circuit row count: **not established**. Text/binary ZKIR and file sizes are not row counts.

## Global application diagnostics (outside Phase 2 scope)

`npm run typecheck` exited 2 with six diagnostics:
- app/components/DeployRoute.tsx:119 — deployment provider overload versus the partial ABI;
- scripts/deploy.ts:87 — deployment provider overload versus the partial ABI;
- test/just-proof.test.ts:154 — deployment provider overload;
- test/just-proof.test.ts:184 and :199 — obsolete ledger.message;
- test/just-proof.test.ts:190 — obsolete storeMessage circuit.

The accepted audit already recorded six errors from stale/placeholder integration. Current diagnostics include the consequences of the intentionally empty Phase 2 lifecycle ABI; this is not a claim that the exact diagnostic texts are unchanged. These integration files were not repaired merely to make global type checking green. The unchanged unfiltered test:local deployment fixture was not run because Phase 2 prohibits deployments/network calls. The focused local test command above is the completed validation, not a claim that the whole existing app suite passes.

## Generated artifacts (compiler only)

| Exact path | Bytes |
|---|---:|
| contracts/managed/just-proof/compiler/contract-info.json | 2095 |
| contracts/managed/just-proof/contract/index.d.ts | 8635 |
| contracts/managed/just-proof/contract/index.js | 50542 |
| contracts/managed/just-proof/contract/index.js.map | 1905 |
| test/fixtures/managed/phase2-primitives/compiler/contract-info.json | 41943 |
| test/fixtures/managed/phase2-primitives/contract/index.d.ts | 18773 |
| test/fixtures/managed/phase2-primitives/contract/index.js | 118841 |
| test/fixtures/managed/phase2-primitives/contract/index.js.map | 10277 |
| test/fixtures/managed/phase2-constructor/compiler/contract-info.json | 2310 |
| test/fixtures/managed/phase2-constructor/contract/index.d.ts | 8977 |
| test/fixtures/managed/phase2-constructor/contract/index.js | 56269 |
| test/fixtures/managed/phase2-constructor/contract/index.js.map | 2196 |
| test/fixtures/managed/phase2-constructor/zkir/checkAuthorityKnowledge.zkir | 2859 |
| /tmp/justproof-phase2/resource-skip/compiler/contract-info.json | 4957 |
| /tmp/justproof-phase2/resource-skip/contract/index.d.ts | 9502 |
| /tmp/justproof-phase2/resource-skip/contract/index.js | 59693 |
| /tmp/justproof-phase2/resource-skip/contract/index.js.map | 3955 |
| /tmp/justproof-phase2/resource-skip/zkir/resourceProbe.zkir | 70672 |
| /tmp/justproof-phase2/resource-full/keys/resourceProbe.prover | 0 |
| /tmp/justproof-phase2/resource-full/keys/resourceProbe.verifier | 0 |
| /tmp/justproof-phase2/resource-full/zkir/resourceProbe.bzkir | 6163 |

Production has no proving keys because it has no provable lifecycle circuits in Phase 2. The separate pure diagnostic fixture likewise needs no proving keys. Constructor knowledge and resource skip builds explicitly skipped keys. Required runtime assets for the final four-circuit ABI remain later-phase work.

## Remaining Phase 3 blockers and review gates

1. **Resource feasibility:** approved local 2p19 parameters are unavailable; the single full attempt failed. Successful bounded key generation/resource costs remain indeterminate.
2. **Merkle availability decision:** no production custody/distribution/retention/refresh/recovery model is selected. The reference tree is hash-only and untrusted, not a durable service. Roots/counters cannot reconstruct lost unknown leaves or refresh arbitrary paths. Agree on the minimum operational model before Phase 3.
3. **D5 observability:** prove the raw non-secret issuer commitment's required observed boundary from generated artifacts/call integration with nine fields and unit return. An exported argument alone is not evidence; stop for review if unsupported.
4. **Candidate root/spec review:** user approval of candidate constants and the shared-runtime conformance/inspection evidence is pending. Complete V2 documents remain draft.
5. **Future capabilities:** full proof/transcript verification stays gated; browser encryption/durability, one-submission recovery, hosted PNA/CORS and artifact-manifest integration remain Phase 5 work. No full lifecycle/atomicity/security-completeness claim is made from Phase 2 tests.

## Preservation and final status

A pre-phase SHA-256 baseline covered 110 existing files (including ignored existing production bindings). All 12 frozen V1 files are byte-for-byte unchanged:
- `PROPOSAL.md`: `7a94d94ce6aa876ec0823bd48fb22bb23d611098b22a6375e51c1c2e6ae9d4a2`
- `docs/USAGE.md`: `62cd11c18708cec304e4f9796a66f342a31be61c9f5f71bb7a4f2627449807a7`
- `docs/protocol/01-credential.md`: `117fbca7711675b9612eba220d1e8b774b2b7fccda1fb41787981f550c49f539`
- `docs/protocol/02-issuer-registry.md`: `5460dbb9fca37bd68f3215e71da87fed655618a4c72c843def83cc70a45a5a4f`
- `docs/protocol/03-commitments.md`: `2342f8a268294e5af25f03d5d80cc4ae88fa3ef7b4fa66b9f5ac838a9cbaa9f9`
- `docs/protocol/04-revocation.md`: `bc74505866a2d766d92ad1045480703ecd7f78f7f0eb8f0251e55bd03da140ee`
- `docs/protocol/05-ledgers.md`: `9b7a972042babece3752737f5f6b726fd739a88faa2fe69d7ba4fc19cb2e7dd7`
- `docs/protocol/06-merkle-tree.md`: `b4d04677588ee891e7d5af9b61e0a789ff524bad15c895aeb314bdcc3e89a8c9`
- `docs/protocol/07-witnesses.md`: `0c1d1154a535d8be9188e69fdca3ec6af01507cc6d096ccaa984386d2804ed74`
- `docs/protocol/08-proofs.md`: `ec1cd4252b9580e601758f297f2fcd8dc101b7834f1d87245ecb48b9ef5a96c9`
- `docs/protocol/09-verification.md`: `2b3d6f3b92de61fc0ec4b40e26b9ea1f35fbd58eb681dbc5a4ba3c85196848d4`
- `docs/protocol/10-specification.md`: `0fa343641677a5ac9ebf55f656541d54b81f608adc5764887677b0e17d705bb4`

AGENTS.md was already modified by the user at phase start and remains unchanged by this task. No frozen V1, PROPOSAL.md or docs/USAGE.md edits occurred. No staging, commit, push, publication, deployment, Preview or Preprod command occurred. No dependencies, providers, frontend, deployment scripts, CI or Netlify configuration changed. The unexpected compiler S3 attempt is separately disclosed above; do not read these preservation statements as a claim that no external fetch was attempted.

Final `git status --short`:
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

`git diff --check` passed. Ordinary tracked `git diff --stat` excludes untracked/ignored files:
```text
 AGENTS.md                    | 18 ++++++++++++++++++
 contracts/just-proof.compact | 35 +++++++++++++++++++++++++++++++----
 2 files changed, 49 insertions(+), 4 deletions(-)
```

**Stopped for review. Phase 3 is not authorized and has not begun.**

## Compiler artifact SHA-256 inventory

- `contracts/managed/just-proof/compiler/contract-info.json`: `eb9c54237f3bd5f2cb02c1e80784e4217a26cebf96ca12cbd6183254b014ff72`
- `contracts/managed/just-proof/contract/index.d.ts`: `4509c6e599a55a847eefc9cc10dfc053e8528f78e300958eb4edb0c3d0335788`
- `contracts/managed/just-proof/contract/index.js`: `8605688da4fca995fa7f3138f0fa0c7cb703686222ac59df0ee58b068e0fa431`
- `contracts/managed/just-proof/contract/index.js.map`: `83eee46590166d61701622c40979fdfa2e5388b4391b9e021cdffed72342f8e7`
- `test/fixtures/managed/phase2-primitives/compiler/contract-info.json`: `1b4c672c6f677618b8230a736f6ad466af7a06aa3ed7e4eb14a01f85fe170c6e`
- `test/fixtures/managed/phase2-primitives/contract/index.d.ts`: `2e120993f327b30a81ae1762d9fab2202c558bfb435286bbd7dbdc2f8631221a`
- `test/fixtures/managed/phase2-primitives/contract/index.js`: `73a1b90c6b48e108dcfa06af5330f062626d1fd548e382e339dfa7b1a1c43dd9`
- `test/fixtures/managed/phase2-primitives/contract/index.js.map`: `028ee52278643a85fd309245ab412ed73597e6caa87f26dda537ed3757105929`
- `test/fixtures/managed/phase2-constructor/compiler/contract-info.json`: `328428bdd7d78022d4023579804adacb59fa7ada4a21d39a5c5889af20a74c9a`
- `test/fixtures/managed/phase2-constructor/contract/index.d.ts`: `767cb233b4a5e0f7c051bd1bf3e836359031df3b45547de91cb07a11b23d158d`
- `test/fixtures/managed/phase2-constructor/contract/index.js`: `0a1493f97a3c9d2e2c0b375a13e62579236215bb8e460bfe1c2ed12dc1013354`
- `test/fixtures/managed/phase2-constructor/contract/index.js.map`: `707fa24986acefb8ec7944deb6297b28edc94b862ff9772eaa5a2031133c1a42`
- `test/fixtures/managed/phase2-constructor/zkir/checkAuthorityKnowledge.zkir`: `440856042bb66ee0eda118d75ee3e3d60637d9b06f057b12bd8b0c0c4b07fb38`
- `/tmp/justproof-phase2/resource-skip/compiler/contract-info.json`: `dba3c4593609084babaf362460dde935d400a3aa3432388bb2bce2582778fd7c`
- `/tmp/justproof-phase2/resource-skip/contract/index.d.ts`: `20ec4373fdf7135b3a8f582d1256fc0a6d3da522e8d7e23d95171217ef2455ff`
- `/tmp/justproof-phase2/resource-skip/contract/index.js`: `7836469590bacd817fd0fd47ba77a72b9b03c3d047f15713029767a343466e74`
- `/tmp/justproof-phase2/resource-skip/contract/index.js.map`: `28daa373218a451033dc783756d4c827f5cb97411f33eebd3a826e0302bc544e`
- `/tmp/justproof-phase2/resource-skip/zkir/resourceProbe.zkir`: `9274ee2a6e2069d02c1e5a8f709e21352477fb3454ea97776e8a061bd29cb7a0`
- `/tmp/justproof-phase2/resource-full/keys/resourceProbe.prover`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `/tmp/justproof-phase2/resource-full/keys/resourceProbe.verifier`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `/tmp/justproof-phase2/resource-full/zkir/resourceProbe.bzkir`: `334e392e716a9dfe7b01d00b8655c70c74780715ae1f9a3c5c2e36ab022d0a5b`

## Phase 2B status addendum — 2026-09-14

The user approved the development roots and minimum coordinator assumption. The single additionally authorized resource attempt retrieved 2p19 but was stopped under memory pressure; resource feasibility remains indeterminate. Focused tests again passed 247/247 and focused TypeScript checking passed. See the [Phase 2B resource gate report](phase-2b-resource-gate-report.md). Original Phase 2 evidence above is unchanged; Phase 3 is not authorized.
