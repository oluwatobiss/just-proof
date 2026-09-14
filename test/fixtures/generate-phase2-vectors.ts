// Run locally with the installed vite-node. No network, secrets or dependency installation.
import { writeFileSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { buildVectors, serializeVectors } from "../support/v2-vectors.js";
const versions={
  node:process.version,
  npm:execFileSync("npm",["--version"],{encoding:"utf8"}).trim(),
  compactDeveloperCli:execFileSync("compact",["--version"],{encoding:"utf8"}).trim(),
  compiler:execFileSync("compact",["compile","+0.31.1","--version"],{encoding:"utf8"}).trim(),
  language:execFileSync("compact",["compile","+0.31.1","--language-version"],{encoding:"utf8"}).trim(),
  runtime:JSON.parse(readFileSync("node_modules/@midnight-ntwrk/compact-runtime/package.json","utf8")).version as string,
  compactJS:JSON.parse(readFileSync("node_modules/@midnight-ntwrk/compact-js/package.json","utf8")).version as string,
  midnightJS:JSON.parse(readFileSync("node_modules/@midnight-ntwrk/midnight-js-contracts/package.json","utf8")).version as string,
};
if(versions.compiler!=="0.31.1" || versions.language!=="0.23.0" || versions.runtime!=="0.16.0") throw new Error("wrong vector toolchain");
const sourceFiles=[...readdirSync("contracts/protocol-v2").filter(x=>x!=="candidate-roots.compact").map(x=>`contracts/protocol-v2/${x}`),"test/fixtures/phase2-primitives.compact","test/support/v2-reference.ts","test/support/v2-vectors.ts"].sort();
const generatedFiles=["test/fixtures/managed/phase2-primitives/contract/index.js","test/fixtures/managed/phase2-primitives/contract/index.d.ts","test/fixtures/managed/phase2-primitives/compiler/contract-info.json"];
const hashes=(paths:string[])=>paths.map(path=>({path,sha256:createHash("sha256").update(readFileSync(path)).digest("hex")}));
// Diagnostic provenance only, not a complete release/deployment manifest.
const provenance={sourceFiles:hashes(sourceFiles),generatedFiles:hashes(generatedFiles)};
const result={versions,provenance,...buildVectors()};
const content=serializeVectors(result);
writeFileSync("test/conformance/vectors/protocol-v2-candidates.json",content);
console.log(`Candidate vectors SHA-256: ${createHash("sha256").update(content).digest("hex")}`);
