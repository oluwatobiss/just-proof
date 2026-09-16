// REVIEW ONLY. Only the controlled inert-import probe is authorized in Phase 3E2A.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as rt from '@midnight-ntwrk/compact-runtime';

export function main() {
  if (process.argv[2] !== '--separately-authorized-phase-3e2b-postcheck') {
    throw new Error('Requires future Phase 3E2B authorization and completed resource attempt');
  }
  const dir = '/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1';
  const evidence = 'docs/development/evidence/phase-3e2b';
  const result = JSON.parse(readFileSync(`${evidence}/result.json`, 'utf8'));
  const marker = JSON.parse(readFileSync(`${evidence}/attempt-started`, 'utf8'));
  const preflight = JSON.parse(readFileSync(`${evidence}/preflight.json`, 'utf8'));
  const proposalBase = new URL('./', import.meta.url);
  const hashFile = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  for (const [field, name] of [['planSha256', 'proposed-plan.json'],
    ['monitorSha256', 'proposed-monitor.py'], ['postcheckSha256', 'proposed-key-format-check.mjs']]) {
    if (result.provenance?.[field] !== hashFile(new URL(name, proposalBase))) {
      throw new Error(`Execution provenance mismatch: ${field}`);
    }
  }
  if (!/^[0-9a-f]{64}$/.test(result.provenance?.authorizationSha256 ?? '')
      || !isDeepStrictEqual(marker, result.provenance)
      || !isDeepStrictEqual(preflight.provenance, result.provenance)
      || preflight.preflightComplete !== true
      || hashFile('contracts/just-proof.compact') !== result.provenance.sourceSha256) {
    throw new Error('Durable marker/preflight/result provenance mismatch');
  }
  const comparison = JSON.parse(readFileSync(`${evidence}/cache-comparison.json`, 'utf8'));
  const requested = result.requestedMissingParameters;
  const added = comparison.newNames;
  const validNames = names => Array.isArray(names) && names.length <= 1
    && names.every(n => typeof n === 'string' && /^bls_midnight_2p[0-9]+$/.test(n));
  if (result.compilerLaunched !== true || result.compilerExit !== 0 || result.stopReason !== null
      || result.finalizationComplete !== true || result.successPermanentlyBlocked !== false
      || !Array.isArray(result.finalizationErrors) || result.finalizationErrors.length !== 0
      || existsSync(`${evidence}/finalization-errors.json`)
      || !Array.isArray(comparison.changedExisting) || comparison.changedExisting.length !== 0
      || !validNames(requested) || !validNames(added) || added.some(n => !requested.includes(n))) {
    throw new Error('Compiler/monitor/cache gate failed');
  }
  const circuits = ['registerIssuerV2', 'registerCredentialV2', 'revokeCredentialV2', 'proveQualificationV2'];
  const required = ['compiler/contract-info.json', 'contract/index.js', 'contract/index.d.ts', 'contract/index.js.map'];
  for (const name of circuits) {
    required.push(`keys/${name}.prover`, `keys/${name}.verifier`, `zkir/${name}.zkir`, `zkir/${name}.bzkir`);
  }
  for (const file of required) {
    const stat = statSync(`${dir}/${file}`);
    if (!stat.isFile() || stat.size === 0) throw new Error(`Missing/nonregular/empty artifact: ${file}`);
  }
  const entries = [];
  function walk(path, relative = '') {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${rel}`);
      if (entry.isDirectory()) walk(`${path}/${entry.name}`, rel);
      else if (entry.isFile()) {
        const bytes = readFileSync(`${path}/${entry.name}`);
        entries.push([rel, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }]);
      } else throw new Error(`Nonregular artifact: ${rel}`);
    }
  }
  walk(dir);
  const artifacts = Object.fromEntries(entries);
  const savedManifest = JSON.parse(readFileSync(`${evidence}/artifact-manifest.json`, 'utf8'));
  if (!isDeepStrictEqual(artifacts, savedManifest)) {
    throw new Error('Artifact inventory differs from monitor manifest (paths, sizes or hashes)');
  }
  // Key operations occur only after all provenance, result, cache and complete-manifest gates.
  const checks = circuits.map(name => {
    const key = readFileSync(`${dir}/keys/${name}.verifier`);
    const operation = new rt.ContractOperation();
    operation.verifierKey = key;
    const restored = rt.ContractOperation.deserialize(operation.serialize());
    if (!Buffer.from(restored.verifierKey).equals(key)) throw new Error(`Verifier key format mismatch: ${name}`);
    return { circuit: name, verifierKeyFormatRoundTrip: true };
  });
  console.log(JSON.stringify({ checks, artifacts, proofGeneration: false, cryptographicProofVerification: false,
    note: 'Key artifact presence, integrity and format only; aggregate build performance requires separate review.' }, null, 2));
}

// Lexical path/URL comparison has no filesystem side effects. An argument flag alone never runs main on import.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main();
}
