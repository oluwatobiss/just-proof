# Deployment compatibility and encrypted private identity

**Draft — User Review Required.** Phase 5 design only; no provider, workflow, frontend, script, CI or Netlify change is authorized by this document. The existing browser `/deploy` path is additive to CLI deployment.

## Build and provider invariants

Only WSL `compact compile +0.31.1 ...` produces authoritative generated bindings, keys, ZKIR and compiler metadata for language 0.23.0/runtime 0.16.0. Keep the installed Midnight.js4.1.1 dependency family. No installs, version changes, custom npm registries or cloud regeneration with 0.31.0/0.34.0. Later compilation-script changes must explicitly select0.31.1; do not silently redefine network command semantics.

### Exact release manifest bytes (review correction, 2026-09-14)

Allowed fields, in exact object order: `formatVersion` (integer 1), `product` ("JustProof V1"), `protocolVersion` (integer 2), `compactDeveloperCliVersion` ("0.5.2"), `compilerVersion` ("0.31.1"), `toolchainVersion` ("0.31.1"), `languageVersion` ("0.23.0"), `runtimeVersion` ("0.16.0"), `buildPlatform` ("WSL"), `sourceFiles`, `generatedFiles`, `lifecycleCircuits`. No additional, missing or duplicate fields; reject unsupported values/versions, rather than dropping fields.

Each file array entry has exactly ordered fields `path` (string), `sha256` (64 lowercase hex characters). Paths are repository-relative POSIX paths restricted to ASCII letters, digits, ".", "_", "-", "/" with nonempty components; reject leading/trailing slash, backslash, "."/".." components and duplicates. Sort each file array by ascending ASCII path bytes. Include all source includes, generated bindings, compiler metadata and required keys/ZKIR; exclude the manifest itself. Source and generated lists must not overlap.

For a complete release, lifecycleCircuits is exactly the lexically ASCII-sorted string array ["proveQualificationV2","registerCredentialV2","registerIssuerV2","revokeCredentialV2"]. Phase 2 is not a complete release manifest and must not claim that ABI.

Canonical bytes are UTF-8 (no BOM) of a compact JSON object in the stated order, using double-quoted strings, literal unescaped allowed ASCII characters (no slash escaping), decimal integer tokens 1 and 2 (no sign, leading zero, exponent or fraction), and ":"/","/"{"/"}"/"["/"]" with **no whitespace or trailing newline**. JSON strings in this schema require no escapes because allowed values/path alphabet exclude control characters, quotes and backslashes. Emit file-entry keys in path,sha256 order; emit arrays in stated order. Reject noncanonical byte encodings when accepting a serialized manifest; do not silently normalize extra fields or duplicate keys.

Fingerprint = raw SHA-256(canonical manifest bytes), encoded as exactly 64 lowercase hexadecimal characters without 0x, digest byte 0 first; no endian reversal or second hash. File hashes use SHA-256 of exact file bytes. A trusted release profile must pin this fingerprint: replaced files plus a self-consistent replaced manifest are not authenticity. The developer CLI version is distinct from the compiler/toolchain identifiers.

Runtime assets must match all four V2 circuit names and generated formats; current SDK providers resolve `keys/<circuit>.prover`, `keys/<circuit>.verifier`, `zkir/<circuit>.bzkir`. Preserve compiler-emitted `.zkir` if produced and include it in hashes. Verify required files, sizes/content types/bytes and source/compiler identifiers before deployment; reject HTML asset responses, missing files, stale placeholder ABI and hash mismatch. Never edit generated files manually. CI/Netlify consume and validate approved WSL-generated artifacts rather than silently regenerating them. These workflow changes await Phase 5.

Preserve `test:local`, `test:preview`, `test:preprod`, `deploy:preview`, `deploy:preprod` as distinct meaningful commands. Only local commands run autonomously in later development. CLI uses Node-capable providers; browser uses browser-capable providers. Share narrowly scoped configuration where safe, not a browser→Node deployment dependency. Wallet handles balancing, signing/transaction authorization, DUST or supported sponsorship, and submission. Application secrets remain independent.

Browser target is explicitly Preprod, user-triggered, with exact local prover `http://127.0.0.1:6300`. Reject wallet-selected/remote prover replacement, silent fallback, cross-origin redirects and unverified witness handling. Local Vite/browser testing and hosted Netlify→loopback PNA/CORS are separate acceptance cases. Do not claim hosted reliability without successful actual proof-server preflight and actual browser evidence; report exact browser failure if blocked, never route witnesses to a remote prover.

## Minimum encrypted identity format (D6)

Generate/import a valid runtime maintenance SigningKey independently from a locally CSPRNG-generated nonzero authority secret and public nonzero random registry context. Maintenance key is the installed runtime's versioned BIP-340 representation, not Ed25519 or arbitrary32-byte hex. Use supported runtime sampling/import APIs, validate round trip and a fixed nonsecret sign/verify self-check, and pass **the same key** to the single deployment. Do not derive from wallet seed, role secrets, nonce, opening or context.

The version 1 envelope is JSON with exact top-level members `{header,ciphertext}`. `ciphertext` is unpadded base64url of Web Crypto AES-GCM ciphertext followed by its 128-bit tag. Header fields in canonical order:

```text
schemaVersion: 1
product: "JustProof V1"
protocolVersion: 2
networkId: "preprod"
registryContext: lowercase 64-character hex
artifactFingerprint: lowercase 64-character manifest SHA-256 hex
kdf: "PBKDF2-HMAC-SHA-256"
kdfVersion: 1
iterations: 600000
salt: unpadded base64url of 16 fresh random bytes
cipher: "AES-256-GCM"
iv: unpadded base64url of 12 fresh random bytes
tagLength: 128
```

AAD is UTF-8 of compact JSON serialization of **that exact ordered header**, no whitespace or BOM. Validate types, allowed members, encodings and supported algorithms/work factor before derivation; reject unknown versions/extra members instead of guessing. Passphrase bytes are exact UTF-8, without trimming or normalization; do not log or persist them. PBKDF2 derives a 256-bit AES key using the random per-envelope salt and 600000 iterations. Use browser-native Web Crypto; no new crypto dependency. Validate browser performance in Phase 5 before any approved work-factor revision. Encryption security depends on passphrase strength and an uncompromised browser/origin; it does not defeat active XSS or host compromise.

Encrypted plaintext is a versioned private authority identity with ordered members: identityFormatVersion=1, product, protocolVersion, networkId, registryContext, artifactFingerprint, registryAuthoritySecret (32-byte lowercase hex), maintenanceSigningKey (exact runtime string), deploymentStatus (`PENDING`, `SUBMISSION_OUTCOME_UNKNOWN` or `FINALIZED`), transactionId (string or null), contractAddress (string or null). The private format-version field is exactly identityFormatVersion; schemaVersion names the envelope header format, and both are integer 1. No artifactFormatVersion alias is accepted. Header-bound product, protocolVersion, networkId, registryContext and artifactFingerprint must match decrypted fields and the trusted release profile. Use networkId everywhere; browser deployment requires the literal "preprod" without aliases or case folding. Other later CLI network IDs must match their trusted profile exactly, never inferred from a URL. Address/ID strings use verified installed SDK encodings, validated before finalization. Do not invent transaction identity from an independent transaction. AES-GCM authenticates integrity; any optional checksum is for corruption detection, never a replacement for authenticated encryption.

Every encryption/re-encryption samples fresh salt and 96-bit IV; never reuse a key/IV pair. Header and ciphertext must be version-bound and authenticated. Store only the envelope plus nonsecret recovery metadata in durable browser storage; read it back and decrypt/validate an exact round trip **before** submission. Hold plaintext and passphrase in memory only, clear references when done, and never persist/export plaintext. JavaScript cannot guarantee physical memory erasure; do not claim otherwise. Errors/logs must not serialize SDK key-containing objects.

Trigger an encrypted pending-identity download before submission; verify durable storage first. Browser download triggering alone cannot prove the user saved the file. UI must clearly state that losing the encrypted identity or passphrase can prevent issuer registration and maintenance. Import/reload decrypts locally and validates header, network, context, key and derived authority commitment. No backend storage or backend dependency for recovery.

## One submission and recovery

Before any wallet submission, lock deployment across double clicks/concurrent tabs or disable deployment if durable locking is unavailable; durably record pending identity and artifact fingerprint. Never generate a second maintenance key inside the deployment operation. Trace installed deployment API and provider behavior, especially current privateStateProvider durability; an SDK storage capability does not make an in-memory Map persistent.

The installed pipeline is prove→balance→submission→finality. Phase 5 must test a supported wrapper at the **actual single submission boundary**, capturing the transaction identifier of the same balanced transaction before/at submission and recording it durably when available. Assert exactly one submission and correspondence of captured ID, finalized transaction and contract address. Do not separately precompute a transaction then call deployContract to construct another.

UI states distinguish preparation/encryption, proving, wallet action, submitting, waiting for finality, verifying deployed state, finalized, known pre-submission failure, and submission-outcome-unknown. Once submission may have occurred, errors/timeouts/reload preserve pending encrypted identity and forbid automatic redeploy. Do not label a wallet/provider exception as definitely unsubmitted without evidence. If interception cannot reliably expose an ID, preserve pending identity and direct reconciliation via wallet history/indexer/explorer. Never claim recovery without polling absent an actually tested subscription. A pending identity's unknown address/ID remain null until authoritative reconciliation.

After finality, query authoritative state and verify trusted network and actual address; manifest/circuit protocol 2; sealed context and locally derived authority commitment; all three canonical roots; both zero counters; both empty duplicate Sets; exactly nine fields. Protocol version is not an extra ledger field. A wallet success notification alone is insufficient. If state advanced before the initial-state check, do not silently declare an exact initial-state match; reconcile authoritative deployment-state evidence or report verification failure/unknown.

Only then finalize and re-encrypt identity with confirmed transaction ID/address and trigger updated encrypted export. Public deployment record is separate: formatVersion/product/protocolVersion/networkId, address/context/public authority commitment, transactionId, deployment time, artifactFingerprint and public toolchain metadata. It contains no authority secret, signing key, passphrase or encrypted-plaintext dump. A backend may later mirror this finalized public record but cannot become authoritative or necessary for recovery.

Phase 5 tests cover wrong passphrase, header/ciphertext tampering, unsafe KDF params, key round trip, independent key generation, write/readback failure, interrupted submission, reload recovery, concurrency, outcome unknown without resubmission, finalized-state mismatch, and encrypted finalization/export. Reuse existing CSS variables/classes/components; no inline style objects, landing-page redesign or unrelated frontend work.

## Future manual acceptance (not executed in Phase 1)

After local tests and review, user separately runs `npm run test:preview`, `npm run test:preprod`, `npm run deploy:preview`, `npm run deploy:preprod`. Test browser Preprod `/deploy` separately with intended wallet, local prover, pending encrypted export, one user-triggered submission and authoritative post-finality verification. Validate local Vite first; hosted-origin preflight/browser behavior separately. Infrastructure failures are reported separately from contract assertions. No network deployment is authorized by this draft.

## Future synthetic serialization/encryption vectors

Phase 5 must publish synthetic vectors containing canonical manifest bytes and SHA-256, exact ordered header/AAD bytes, exact synthetic identity plaintext bytes, test passphrase encoding, fixed test-only salt/IV, PBKDF2-derived key and AES-GCM ciphertext/tag. Test field reorder/extra/missing/duplicate fields, newline/BOM/escaping variations, changed fingerprint/networkId, and AAD/ciphertext tampering. These vectors must never use live secrets; production entropy and no-plaintext-persistence rules remain unchanged.
