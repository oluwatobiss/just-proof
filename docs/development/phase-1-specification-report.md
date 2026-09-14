# Phase 1 specification and feasibility report

**Status: Draft — User Review Required. Phase 1 complete; stopped before Phase 2.**
Date: 2026-09-13 (WSL session). Product **JustProof V1**; protocol **JustProof Protocol V2 — Commitment-Based Authorization**.

## Scope and exact files created

This phase created only these Markdown documents:
- [docs/protocol/v2/README.md](../protocol/v2/README.md)
- [docs/protocol/v2/00-decisions.md](../protocol/v2/00-decisions.md)
- [docs/protocol/v2/01-credential.md](../protocol/v2/01-credential.md)
- [docs/protocol/v2/02-issuer-registry.md](../protocol/v2/02-issuer-registry.md)
- [docs/protocol/v2/03-domains-and-commitments.md](../protocol/v2/03-domains-and-commitments.md)
- [docs/protocol/v2/04-revocation.md](../protocol/v2/04-revocation.md)
- [docs/protocol/v2/05-ledgers-and-constructor.md](../protocol/v2/05-ledgers-and-constructor.md)
- [docs/protocol/v2/06-merkle-tree.md](../protocol/v2/06-merkle-tree.md)
- [docs/protocol/v2/07-witnesses-and-disclosures.md](../protocol/v2/07-witnesses-and-disclosures.md)
- [docs/protocol/v2/08-proofs.md](../protocol/v2/08-proofs.md)
- [docs/protocol/v2/09-verification.md](../protocol/v2/09-verification.md)
- [docs/protocol/v2/10-specification.md](../protocol/v2/10-specification.md)
- [docs/protocol/v2/11-deployment-and-private-identity.md](../protocol/v2/11-deployment-and-private-identity.md)
- [docs/protocol/v2/12-conformance-vectors.md](../protocol/v2/12-conformance-vectors.md)
- [docs/protocol/v2/requirements.md](../protocol/v2/requirements.md)
- `docs/development/phase-1-specification-report.md` (this complete report and durable probe evidence).

The15 specification documents are marked **Draft — User Review Required**. No existing document was edited. The user's existing AGENTS.md modification and saved audit remain intact. AGENTS.md requires substantial reports in docs/development, which is why this report is here in addition to the V2 package.

## D1–D8 decisions

| Decision | Result |
|---|---|
| D1 | Adopted in draft after pinned compilation,16 boundary cases and public-effect/transcript inspection. Ten-field request; private credential times never enter time queries. Public lifecycle result remains requestDigest/stateDigest. The diagnostic time circuit deliberately returns unit to isolate time effects; it is not a V2 ABI implementation. |
| D2 | persistentCommit retained for subject/credential commitments with independent 32-byte openings. subjectSecret is the subject opening, as in V1. Control commitments are separate typed persistentHash constructions; only final control hash may be disclosed. No Poseidon claim. |
| D3 | Revoked leaf remains bound to credential ID and commitment. Same private credential index across current credential/revocation roots; no global constant revoked leaf. |
| D4 | Exact demo qualification identifier and qualificationVersion1 retained; protocol 2. No official Midnight Academy claim. |
| D5 | Public issuer-control commitment registration argument; private authority/path witnesses; no issuer-secret witness or registration PoP guarantee. |
| D6 | Versioned encrypted pending identity with PBKDF2-HMAC-SHA-256600000/AES-256-GCM, fresh salt/96-bitIV, authenticated header, durable ciphertext/readback/roundtrip/download before submission; finalized encrypted export. Implementation and browser performance tests deferred. |
| D7 | Only explicit WSL compiler 0.31.1; approved generated artifacts plus source/version/artifact manifest for later cloud consumption. No package/CI/Netlify changes. |
| D8 | Full proof and transcript verification capability-gated; unavailable means COULD_NOT_VERIFY. Simulation, generation, verification and ledger integration separately reported. |

Authenticated index width is explicitly Uint16, while counters remain Uint32 to represent full capacity 65536. The D1 time design preserves the original validity guarantee but narrows which requests can be satisfied: credentials issued after request creation require a new request.

## Environment and version evidence

All commands ran in the current WSL repository, not PowerShell, Windows Command Prompt or a cloud environment.

| Item | Observed |
|---|---|
| Repository | /home/oluwatobiss/projects/midnight/risein/just-proof |
| Kernel | Linux5.15.146.1-microsoft-standard-WSL2 |
| Node/npm |24.18.0 /11.16.0 |
| Developer CLI |0.5.2 |
| Selected compiler |0.31.1 |
| Language/runtime reported by compiler |0.23.0 /0.16.0 |
| Compiler ledger target |ledger-8.0.2 |
| Installed compact-runtime / CompactJS |0.16.0 /2.5.1 |
| Installed midnight-js-contracts / HTTP proof provider |4.1.1 /4.1.1 |
| Installed ledger-v8 / onchain-runtime-v3 |8.1.0 /3.0.0 |

Commands: `pwd`, `uname -sr`, `node --version`, `npm --version`, `compact --version`, `compact list`, `compact compile +0.31.1 --version`, `--language-version`, `--runtime-version`, `--ledger-version`, `--help`; installed versions read directly from package.json files. Read-only release checks `compact check`, `compact self check`, `npm view @midnight-ntwrk/compact-runtime version`, `npm view @midnight-ntwrk/midnight-js-contracts version` reported compiler 0.34.0 available, CLI0.5.2 current, latest runtime 0.19.0 and contracts4.1.1. No version was changed. Initial sandbox release lookup/self-check failed from DNS restrictions; retried with permission. An offline npm lookup returned ENOTCACHED before the successful online read-only check. No Preview/Preprod service was contacted; version checks used release/npm endpoints only.

## Timestamp feasibility gate

Source: `/tmp/justproof-phase1/time.compact`; exact source is preserved below. Synthetic numeric test fixtures are not real credential data.

Exact source-compilation command:

```bash
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 --skip-zk /tmp/justproof-phase1/time.compact /tmp/justproof-phase1/time-out
```

Result: **exit0**, elapsed **0.85 s**, empty compiler diagnostics. All eight requested constraints compile, including private-to-private Uint64 comparisons.

Full artifact attempt (sandbox):

```bash
/usr/bin/time -f 'elapsed=%e exit=%x' timeout 55 compact compile +0.31.1 /tmp/justproof-phase1/time.compact /tmp/justproof-phase1/time-zk-out
```

Result exit255,1.18 s:
```text
Compiling 1 circuits:
Error: Read-only file system (os error 30)
Exception: zkir returned a non-zero exit status 1
Command exited with non-zero status 255
elapsed=1.18 exit=255
```

Retry with approved compiler cache access:
```bash
/usr/bin/time -f 'elapsed=%e exit=%x' timeout 180 compact compile +0.31.1 /tmp/justproof-phase1/time.compact /tmp/justproof-phase1/time-zk-out
```
Completed **exit0**, **1.86 s**, output `Compiling 1 circuits:` and time result. This generated keys/ZKIR; it did not generate a proof.

Simulation command: `node /tmp/justproof-phase1/run-time.mjs` (also run with output redirected to `/tmp/justproof-phase1/time-results.json`). **16/16 boundary cases pass,0 fail**, plus public-effect invariance assertions. Cases: issuance equality, last valid second, expiry equality rejection, before request rejection, unbounded expiry, zero request issuance, equal/reversed request interval, zero credential issuance, equal/reversed credential interval, credential issued after request rejection, credential expiry before/equal/after request deadline, maximum Uint64 private expiry.

### Public-effect inspection

Generated `time-out/contract/index.js` and `.d.ts` have exactly two circuit arguments (the request timestamps), an empty result, and no ledger fields. Private timestamps enter only through credentialTimes witness and privateTranscriptOutputs. Generated time-query calls pass requestIssuedAt/requestExpiresAt only. The public query program has two comparisons against block-context time: one pushes request issuance and proves blockTime is not less; one pushes request expiry and proves blockTime is less.

The harness reproduces the installed CompactJS partitioning boundary using ledger-v8 PreTranscript/partitionTranscripts with a converted initial QueryContext. Public input, result/output, public query transcript, guaranteed/fallible partition data, external effects and ledger are deeply equal for private time pairs (91,211), (92,222), and (93,0), with fixed request(100,200) and block time150. Private witness transcript differs. The only timestamp constants pushed publicly are100 and 200; neither private credential time appears there. No external mint/spend/call effects or ledger writes arise.

Installed sources inspected: compact-runtime/dist/circuit-context.js; generated probe bindings; compact-js/dist/esm/effect/ContractExecutable.js (partitionTranscript and circuit result separation); midnight-js-contracts/dist/index.mjs (createUnprovenCallTxFromInitialStates); ledger-v8/onchain-runtime declarations. Partitioned transcript inspection is **not** a signed/submitted transaction or full proof verification. No assertion is made about an unbuilt production ABI.

## Merkle feasibility gate

Primary source: `/tmp/justproof-phase1/merkle.compact`, fixed 16-step index-decomposition fold plus fixed 16-node hashing fold. Probe-only domain is padded `PHASE1:MERKLE:PROBE`, not a normative V2 domain/vector. It is intentionally independent of production contract state.

```bash
/usr/bin/time -f 'elapsed=%e exit=%x' timeout 55 compact compile +0.31.1 --skip-zk /tmp/justproof-phase1/merkle.compact /tmp/justproof-phase1/merkle-out
node /tmp/justproof-phase1/run-merkle.mjs
```

Final source compiles **exit0**, **1.28 s**. Simulation: **20 positive +22 expected-rejection cases =42 pass,0 fail**. Covers mixed/boundary indices 0,1,2,3,32767,32768,65534,65535,0xaaaa,0x5555; each of 16 wrong direction-bit positions against a correct other-index root; counter mismatch; capacity 65536; original-index mismatch;15/17 siblings; corrupted sibling. Expected roots use separately assembled off-chain descriptors and JavaScript bit extraction; generated Compact uses generated descriptors and threshold/subtraction folds. Both share Compact runtime hashing/serialization: this is cross-path agreement, not independent cryptographic implementation.

An initial diagnostic source assigned its public constructor fixture root/counter without acknowledging disclosure; compiler exit255 at 0.98 s. Exact diagnostic:
```text
Exception: merkle.compact line 10 char 7:
  potential witness-value disclosure must be declared but is not:
    witness value potentially disclosed:
      the value of parameter initialRoot of the constructor at line 9 char 13
    nature of the disclosure:
      ledger operation might disclose the witness value
    via this path through the program:
      the right-hand side of = at line 10 char 7
Exception: merkle.compact line 11 char 12:
  potential witness-value disclosure must be declared but is not:
    witness value potentially disclosed:
      the value of parameter initialNext of the constructor at line 9 char 37
    nature of the disclosure:
      ledger operation might disclose the witness value
    via this path through the program:
      the right-hand side of = at line 11 char 12
```
Only these intentionally public **probe fixture arguments** were wrapped in disclose. No private path/index/secret was disclosed. This is not permission for production constructor root arguments.

Full build:
```bash
/usr/bin/time -f 'elapsed=%e exit=%x' timeout 55 compact compile +0.31.1 /tmp/justproof-phase1/merkle.compact /tmp/justproof-phase1/merkle-zk-out
/usr/bin/time -f 'elapsed=%e exit=%x' timeout 240 compact compile +0.31.1 /tmp/justproof-phase1/merkle.compact /tmp/justproof-phase1/merkle-zk-out
```
First command: sandbox cache write failure, exit255 at 48.24 s, same read-only-filesystem/zkir diagnostic as above. Second command with approved cache access: timed out exit124 (time reported 238.37 s) without completing. The **same240-second command retried once completed exit0 in 231.68 s**, producing both circuits' bindings/keys/ZKIR. Do not confuse this key-generation cost with 0.0x-second off-chain Merkle evaluation or with real proving time. Roughly37 MiB proving key per diagnostic path circuit; production multi-path sizes and proving costs remain unmeasured.

### Paired-tree check with one private original index

The second Merkle source `/tmp/justproof-phase1/merkle-pair.compact` authenticates a credential root and a separate revocation root using **the same private index**, constrained below the public allocated counter. It has no independent direction or revocation-index witness.

```bash
/usr/bin/time -f 'elapsed=%e exit=%x' compact compile +0.31.1 --skip-zk /tmp/justproof-phase1/merkle-pair.compact /tmp/justproof-phase1/merkle-pair-out
node /tmp/justproof-phase1/run-merkle-pair.mjs
```

Compile **exit0,0.80 s**; **2 positive +5 rejection cases =7 pass,0 fail**. Rejects a revocation root correct only at another index, a credential root correct at another index, both roots for another index, unallocated index and corrupted revocation sibling. Pair probe was not run through full key generation. Its fixture leaves/domain are diagnostic, not canonical V2 leaf vectors.

## Domain and document validation

Complete cryptographic domain count: **18**, all distinct. Each exact UTF-8 label was independently hashed with Python hashlib.sha256 and GNU `sha256sum` reading identical bytes from stdin; **18/18 match,0 mismatches**. No newline or NUL. The retained qualification identifier was separately recomputed and matches the frozen 64-hex value. Exact manifest/preimage/schema mapping is in 03-domains-and-commitments.md.

The464-row audit inventory and old probe files referenced by the saved audit were absent from /tmp at phase start. The56-row actionable matrix was reconstructed from available frozen source documents and current user requirements; it is not represented as a mechanical conversion of missing data.

## Validation summary and remaining limitations

- **65 named simulation cases pass,0 fail**:16 timestamp +42 Merkle +7 paired-tree. Additional public-effect equality/no-output/no-ledger assertions pass.
- All3 probe sources compile with explicit0.31.1. Full artifact builds completed for timestamp and the 2-circuit Merkle probe. Compiler key generation is not real proof generation.
- Real ZK proofs generated: **0**. Full proof verifications: **0**. Local ledger deployments/integration: **0**. No proof-server call or browser deployment was made.
- Canonical numeric V2 roots, exact V2 constructor, production ABI, four lifecycle circuits, complete local test suite, failed-transition atomicity and production disclosure analysis remain Phase 2–4 work.
- Full Merkle key generation takes minutes and sizable artifacts; measure production circuit size/proving/deployment separately before claiming performance. No row count was established.
- Portable verification capability remains unproven and gated. Hosted CORS/PNA browser behavior and submission interception/recovery/durable encryption remain Phase 5 acceptance work.
- Existing CI/Netlify compiler mismatch and placeholder integrations are untouched, deliberately deferred. D6's exact envelope/performance details remain draft for review.
- No intended protocol requirement was weakened to achieve compilation. The full specification is not frozen. No remaining **observed** syntax/index/time blocker; this is not a guarantee that all later circuits will compile or meet resource budgets.

## Preservation and final repository checks

A SHA-256 baseline of 90 existing tracked/saved-report files was captured before any repository write. Every baseline file remained byte-for-byte unchanged, including the user's already modified AGENTS.md. Frozen-reference hashes:
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

`git diff --check` completed exit0. Draft-marker and local-link checks passed. Final `git status --short`:
```text
 M AGENTS.md
?? docs/development/
?? docs/protocol/v2/
```
Final `git diff --stat`:
```text
 AGENTS.md | 18 ++++++++++++++++++
 1 file changed, 18 insertions(+)
```
That tracked diff is the **pre-existing user change**, not work from this phase. New Markdown files remain untracked, so ordinary diff --stat does not list them. No staging/commit/push/publish occurred.

**No existing V1, contract, generated repository artifact, dependency, frontend, provider, deployment workflow, npm script, CI or Netlify file was changed. No Preview/Preprod test/deploy command or browser submission ran.** Generated diagnostic artifacts exist only under /tmp. Next action is user review/explicit Phase 2 approval; no automatic continuation.

## Generated diagnostic artifacts (temporary only)

| Path under /tmp/justproof-phase1 | Bytes |
|---|---:|
| time-zk-out/keys/checkTime.prover | 149069 |
| time-zk-out/keys/checkTime.verifier | 1351 |
| time-zk-out/zkir/checkTime.bzkir | 237 |
| merkle-zk-out/keys/appendCheck.verifier | 2119 |
| merkle-zk-out/keys/sameIndexCheck.verifier | 2119 |
| merkle-zk-out/keys/sameIndexCheck.prover | 38462313 |
| merkle-zk-out/keys/appendCheck.prover | 38462573 |
| merkle-zk-out/zkir/appendCheck.bzkir | 1996 |
| merkle-zk-out/zkir/sameIndexCheck.bzkir | 1914 |

No generated file was hand-edited. The compiler also emitted JS/declarations/source maps and compiler metadata. Sources/harnesses below preserve reproducibility if /tmp is later cleared. Recreate the paths and link /tmp/justproof-phase1/node_modules to this repository's installed node_modules; do not install alternate packages. Scripts use only synthetic fixtures and public diagnostic outputs.

## Durable exact probe source and harnesses

### time.compact

SHA-256: `c42a2e7f10f223ae98e41035551cf458039d12f07ecee4ba0bf1ddcd99c337f1`.

```compact
pragma language_version 0.23;
import CompactStandardLibrary;
witness credentialTimes(): Vector<2, Uint<64>>;
export circuit checkTime(requestIssuedAt: Uint<64>, requestExpiresAt: Uint<64>): [] {
  const times = credentialTimes();
  const issuedAt = times[0];
  const expiresAt = times[1];
  assert(requestIssuedAt > 0, "request issuance zero");
  assert(requestIssuedAt < requestExpiresAt, "request interval");
  assert(blockTimeGte(disclose(requestIssuedAt)), "request not started");
  assert(blockTimeLt(disclose(requestExpiresAt)), "request expired");
  assert(issuedAt > 0, "credential issuance zero");
  assert(expiresAt == 0 || expiresAt > issuedAt, "credential interval");
  assert(issuedAt <= requestIssuedAt, "credential not issued at request");
  assert(expiresAt == 0 || requestExpiresAt <= expiresAt, "credential expires before request");
}
```

### run-time.mjs

SHA-256: `71256199c560d69dc3211b10f7d879be7179713275f0c539a7e9931d39b0351c`.

```javascript
import assert from 'node:assert/strict';
import * as rt from '@midnight-ntwrk/compact-runtime';
import * as l from '@midnight-ntwrk/ledger-v8';
import { Contract, ledger } from './time-out/contract/index.js';
const c = new Contract({credentialTimes: ({privateState}) => [privateState, privateState]});
function run(i,e,ri,re,now) {
  const ps=[BigInt(i),BigInt(e)];
  const init=c.initialState(rt.createConstructorContext(ps,'00'.repeat(32)));
  const ctx=rt.createCircuitContext(rt.dummyContractAddress(),init.currentZswapLocalState,init.currentContractState,ps,undefined,undefined,now);
  const initial = ctx.currentQueryContext;
  const result = c.circuits.checkTime(ctx,BigInt(ri),BigInt(re));
  const query = new l.QueryContext(new l.ChargedState(l.StateValue.decode(initial.state.state.encode())),initial.address);
  query.block=initial.block; query.effects=initial.effects;
  result.partition=l.partitionTranscripts([new l.PreTranscript(query,result.proofData.publicTranscript)],l.LedgerParameters.initialParameters());
  return result;
}
const cases=[
 ['inclusive issuance',100,200,100,200,100,true],
 ['last valid second',100,200,100,200,199,true],
 ['exclusive expiry',100,200,100,200,200,false],
 ['before request',90,220,100,200,99,false],
 ['unbounded credential',90,0,100,200,150,true],
 ['zero request issuance',1,200,0,200,100,false],
 ['equal request ends',90,220,100,100,100,false],
 ['reversed request ends',90,220,200,100,150,false],
 ['zero credential issuance',0,200,100,200,150,false],
 ['equal credential ends',90,90,100,200,150,false],
 ['reversed credential ends',90,80,100,200,150,false],
 ['credential issued after request',101,220,100,200,150,false],
 ['credential expires before deadline',90,199,100,200,150,false],
 ['credential expires at deadline',90,200,100,200,150,true],
 ['credential expires after deadline',90,201,100,200,150,true],
 ['max Uint64 private expiry',90,18446744073709551615n,100,200,150,true]
];
for (const [name,i,e,ri,re,t,want] of cases) {
 let ok=true; try{run(i,e,ri,re,t)}catch{ok=false}
 assert.equal(ok,want,name);
}
const a=run(91,211,100,200,150),b=run(92,222,100,200,150);
const publicPart=r=>({input:r.proofData.input,output:r.proofData.output,transcript:r.proofData.publicTranscript,partition:r.partition,result:r.result,ledger:ledger(r.context.currentQueryContext.state),effects:r.context.currentQueryContext.effects});
assert.deepEqual(publicPart(a),publicPart(b));
assert.deepEqual(publicPart(a),publicPart(run(93,0,100,200,150)));
assert.notDeepEqual(a.proofData.privateTranscriptOutputs,b.proofData.privateTranscriptOutputs);
assert.deepEqual(a.proofData.output,{value:[],alignment:[]});
assert.deepEqual(ledger(a.context.currentQueryContext.state),{});
console.log(JSON.stringify({boundaryCases:cases.length,passed:cases.length,failed:0,publicEffectsEqualForDifferentPrivateTimes:true,public:publicPart(a)},(_,v)=>typeof v==='bigint'?v.toString():v,2));
```

### merkle.compact

SHA-256: `4615a0df0e3a902a0ead9722a13a7b5d55d6b976c717de14fd4113105338660b`.

```compact
pragma language_version 0.23;
import CompactStandardLibrary;
struct BitsState { remaining: Uint<16>, bits: Vector<16, Boolean> }
struct NodeInput { domain: Bytes<32>, protocolVersion: Uint<16>, left: Bytes<32>, right: Bytes<32> }
witness path(): Vector<16, Bytes<32>>;
witness claimedIndex(): Uint<16>;
export ledger root: Bytes<32>;
export ledger nextIndex: Uint<32>;
constructor(initialRoot: Bytes<32>, initialNext: Uint<32>) {
 root = disclose(initialRoot);
 nextIndex = disclose(initialNext);
}
circuit directions(index: Uint<16>): Vector<16, Boolean> {
 const s = fold((s: BitsState, power: Uint<16>): BitsState => {
   const bit = s.remaining >= power;
   return BitsState { remaining: (s.remaining - (bit ? power : 0)) as Uint<16>, bits: [bit, s.bits[0], s.bits[1], s.bits[2], s.bits[3], s.bits[4], s.bits[5], s.bits[6], s.bits[7], s.bits[8], s.bits[9], s.bits[10], s.bits[11], s.bits[12], s.bits[13], s.bits[14]] };
 }, BitsState {remaining: index, bits: default<Vector<16, Boolean>>},
 [32768,16384,8192,4096,2048,1024,512,256,128,64,32,16,8,4,2,1] as Vector<16, Uint<16>>);
 assert(s.remaining == 0, "index remainder");
 return s.bits;
}
circuit rootFrom(leaf: Bytes<32>, index: Uint<16>, siblings: Vector<16, Bytes<32>>): Bytes<32> {
 const entries = map((bit: Boolean, sibling: Bytes<32>): [Boolean, Bytes<32>] => [bit,sibling], directions(index), siblings);
 return fold((h: Bytes<32>, entry: [Boolean, Bytes<32>]): Bytes<32> => {
  return persistentHash<NodeInput>(NodeInput {domain: pad(32,"PHASE1:MERKLE:PROBE"), protocolVersion: 2,
   left: entry[0] ? entry[1] : h, right: entry[0] ? h : entry[1]});
 }, leaf, entries);
}
export circuit appendCheck(leaf: Bytes<32>): [] {
 const index = claimedIndex();
 assert(nextIndex < 65536, "capacity");
 assert(index == nextIndex, "append index");
 assert(disclose(rootFrom(leaf,index,path())) == root, "append root");
}
export circuit sameIndexCheck(leaf: Bytes<32>, originalIndex: Uint<16>): [] {
 const index = claimedIndex();
 assert(index == originalIndex, "same credential index");
 assert(disclose(rootFrom(leaf,index,path())) == root, "membership root");
}
```

### run-merkle.mjs

SHA-256: `94a1ad762828295d2d0c466290286fd32b691463ae1cbd495322fe4335d36af7`.

```javascript
import assert from 'node:assert/strict';
import * as rt from '@midnight-ntwrk/compact-runtime';
import {Contract} from './merkle-out/contract/index.js';
const bytes=new rt.CompactTypeBytes(32),u16=new rt.CompactTypeUnsignedInteger(65535n,2);
const descriptor={
 alignment:()=>[...bytes.alignment(),...u16.alignment(),...bytes.alignment(),...bytes.alignment()],
 toValue:v=>[...bytes.toValue(v.domain),...u16.toValue(v.protocolVersion),...bytes.toValue(v.left),...bytes.toValue(v.right)],
 fromValue:v=>({domain:bytes.fromValue(v),protocolVersion:u16.fromValue(v),left:bytes.fromValue(v),right:bytes.fromValue(v)})
};
const domain=new Uint8Array(32);domain.set(new TextEncoder().encode('PHASE1:MERKLE:PROBE'));
const leaf=new Uint8Array(32).fill(17);
const siblings=Array.from({length:16},(_,i)=>new Uint8Array(32).fill(i+33));
function root(index,path=siblings){let h=leaf;for(let l=0;l<16;l++){const bit=(index>>>l)&1;h=rt.persistentHash(descriptor,{domain,protocolVersion:2n,left:bit?path[l]:h,right:bit?h:path[l]});}return h;}
function call(index,counter,expected,original=index,path=siblings,append=true){
 const ps={index:BigInt(index),path};
 const c=new Contract({path:({privateState:p})=>[p,p.path],claimedIndex:({privateState:p})=>[p,p.index]});
 const s=c.initialState(rt.createConstructorContext(ps,'00'.repeat(32)),expected,BigInt(counter));
 const ctx=rt.createCircuitContext(rt.dummyContractAddress(),s.currentZswapLocalState,s.currentContractState,ps);
 return append?c.circuits.appendCheck(ctx,leaf):c.circuits.sameIndexCheck(ctx,leaf,BigInt(original));
}
let positive=0,negative=0;
for(const index of [0,1,2,3,32767,32768,65534,65535,0xaaaa,0x5555]){call(index,index,root(index));positive++;call(index,index,root(index),index,siblings,false);positive++;}
function reject(fn){assert.throws(fn);negative++;}
for(let bit=0;bit<16;bit++){const correct=0x5a5a,claimed=correct^(1<<bit);reject(()=>call(claimed,claimed,root(correct)));}
reject(()=>call(7,8,root(7)));
reject(()=>call(65535,65536,root(65535)));
reject(()=>call(7,7,root(7),8,siblings,false));
reject(()=>call(7,7,root(7),7,siblings.slice(0,15)));
reject(()=>call(7,7,root(7),7,[...siblings,siblings[0]]));
const changed=siblings.map(x=>x.slice());changed[9][0]^=1;
reject(()=>call(7,7,root(7),7,changed));
console.log(JSON.stringify({positive,negative,passed:positive+negative,failed:0,directionBitPositionsRejected:16,layer:'compiled contract-logic simulation'}));
```

### merkle-pair.compact

SHA-256: `9b3e3a8049c76684520b7bd5c26a901073d129aa9e2c4b8144711639a73be81a`.

```compact
pragma language_version 0.23;
import CompactStandardLibrary;
struct BitsState { remaining: Uint<16>, bits: Vector<16, Boolean> }
struct NodeInput { domain: Bytes<32>, protocolVersion: Uint<16>, left: Bytes<32>, right: Bytes<32> }
witness path(): Vector<16, Bytes<32>>;
witness claimedIndex(): Uint<16>;
export ledger root: Bytes<32>;
export ledger revocationRoot: Bytes<32>;
witness revocationPath(): Vector<16, Bytes<32>>;
export ledger nextIndex: Uint<32>;
constructor(initialRoot: Bytes<32>, initialNext: Uint<32>, initialRevocationRoot: Bytes<32>) {
 root = disclose(initialRoot);
 nextIndex = disclose(initialNext);
 revocationRoot = disclose(initialRevocationRoot);
}
circuit directions(index: Uint<16>): Vector<16, Boolean> {
 const s = fold((s: BitsState, power: Uint<16>): BitsState => {
   const bit = s.remaining >= power;
   return BitsState { remaining: (s.remaining - (bit ? power : 0)) as Uint<16>, bits: [bit, s.bits[0], s.bits[1], s.bits[2], s.bits[3], s.bits[4], s.bits[5], s.bits[6], s.bits[7], s.bits[8], s.bits[9], s.bits[10], s.bits[11], s.bits[12], s.bits[13], s.bits[14]] };
 }, BitsState {remaining: index, bits: default<Vector<16, Boolean>>},
 [32768,16384,8192,4096,2048,1024,512,256,128,64,32,16,8,4,2,1] as Vector<16, Uint<16>>);
 assert(s.remaining == 0, "index remainder");
 return s.bits;
}
circuit rootFrom(leaf: Bytes<32>, index: Uint<16>, siblings: Vector<16, Bytes<32>>): Bytes<32> {
 const entries = map((bit: Boolean, sibling: Bytes<32>): [Boolean, Bytes<32>] => [bit,sibling], directions(index), siblings);
 return fold((h: Bytes<32>, entry: [Boolean, Bytes<32>]): Bytes<32> => {
  return persistentHash<NodeInput>(NodeInput {domain: pad(32,"PHASE1:MERKLE:PROBE"), protocolVersion: 2,
   left: entry[0] ? entry[1] : h, right: entry[0] ? h : entry[1]});
 }, leaf, entries);
}
export circuit pairCheck(credentialLeaf: Bytes<32>, notRevokedLeaf: Bytes<32>): [] {
 const index = claimedIndex();
 assert(index < nextIndex, "credential allocation");
 assert(disclose(rootFrom(credentialLeaf,index,path())) == root, "credential membership");
 assert(disclose(rootFrom(notRevokedLeaf,index,revocationPath())) == revocationRoot, "same-index revocation membership");
}
```

### run-merkle-pair.mjs

SHA-256: `5eaaa60457e64f6deb8399099534ec8877d6078f634612ea24198a0d916e25ec`.

```javascript
import assert from 'node:assert/strict';
import * as rt from '@midnight-ntwrk/compact-runtime';
import {Contract} from './merkle-pair-out/contract/index.js';
const bytes=new rt.CompactTypeBytes(32),u16=new rt.CompactTypeUnsignedInteger(65535n,2);
const descriptor={
 alignment:()=>[...bytes.alignment(),...u16.alignment(),...bytes.alignment(),...bytes.alignment()],
 toValue:v=>[...bytes.toValue(v.domain),...u16.toValue(v.protocolVersion),...bytes.toValue(v.left),...bytes.toValue(v.right)],
 fromValue:v=>({domain:bytes.fromValue(v),protocolVersion:u16.fromValue(v),left:bytes.fromValue(v),right:bytes.fromValue(v)})
};
const domain=new Uint8Array(32);domain.set(new TextEncoder().encode('PHASE1:MERKLE:PROBE'));
const leaf=new Uint8Array(32).fill(17);
const siblings=Array.from({length:16},(_,i)=>new Uint8Array(32).fill(i+33));
function root(index,path=siblings){let h=leaf;for(let l=0;l<16;l++){const bit=(index>>>l)&1;h=rt.persistentHash(descriptor,{domain,protocolVersion:2n,left:bit?path[l]:h,right:bit?h:path[l]});}return h;}
const revSiblings=siblings.map(x=>new Uint8Array(32).fill(x[0]+32));
function pair(index,credIndex=index,revIndex=index,counter=index+1,revPath=revSiblings){
 const ps={index:BigInt(index),path:siblings,revPath};
 const c=new Contract({path:({privateState:p})=>[p,p.path],claimedIndex:({privateState:p})=>[p,p.index],revocationPath:({privateState:p})=>[p,p.revPath]});
 const s=c.initialState(rt.createConstructorContext(ps,'00'.repeat(32)),root(credIndex),BigInt(counter),root(revIndex,revSiblings));
 return c.circuits.pairCheck(rt.createCircuitContext(rt.dummyContractAddress(),s.currentZswapLocalState,s.currentContractState,ps),leaf,leaf);
}
pair(7);pair(65535);
assert.throws(()=>pair(7,7,8));
assert.throws(()=>pair(7,8,7));
assert.throws(()=>pair(7,8,8));
assert.throws(()=>pair(7,7,7,7));
const bad=revSiblings.map(x=>x.slice());bad[0][0]^=1;
assert.throws(()=>pair(7,7,7,8,bad));
console.log(JSON.stringify({positive:2,negative:5,passed:7,failed:0,samePrivateIndexAcrossTwoAuthenticatedRoots:true,layer:'compiled contract-logic simulation'}));
```


## Conditional-review addendum — 2026-09-14

D1–D8 are approved working decisions; the complete specification remains draft. Phase 2 alone is authorized. The original Phase 1 numeric measurements and probe sources above are unchanged. Raw SHA-256 domain checks used separate hashlib/coreutils paths; typed TypeScript/generated-JavaScript conformance instead shares Compact runtime hashing and serialization and must not be called independent cryptographic verification. Candidate roots require separately assembled paths, generated type/source inspection and user review. Generated input descriptors do not establish chain observability of exported arguments. D5 raw-commitment observability and operational Merkle custody/refresh/recovery are Phase 3 entry gates. V2 documents now define those boundaries and exact manifest/AAD/fingerprint/version/network naming; no backend or encryption workflow was implemented by these corrections.
