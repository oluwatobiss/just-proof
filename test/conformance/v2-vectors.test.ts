import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { buildVectors, serializeVectors } from "../support/v2-vectors.js";

it("reproduces every candidate vector including all 17 levels per tree and boundary paths",()=>{
  const {versions,provenance,...saved}=JSON.parse(readFileSync("test/conformance/vectors/protocol-v2-candidates.json","utf8"));
  for(const file of [...provenance.sourceFiles,...provenance.generatedFiles]) {
    expect(createHash("sha256").update(readFileSync(file.path)).digest("hex")).toBe(file.sha256);
  }
  expect(versions.compiler).toBe("0.31.1");expect(versions.language).toBe("0.23.0");expect(versions.runtime).toBe("0.16.0");
  const actual=JSON.parse(serializeVectors(buildVectors()));
  expect(actual).toEqual(saved);
  expect(actual.derivations).toHaveLength(18);
  for(const tree of actual.trees) {
    expect(tree.levels).toHaveLength(17);expect(tree.boundaryPaths.map((x:{index:number})=>x.index)).toEqual([0,1,32767,32768,65535]);
    for(const level of tree.levels) expect(level.reference).toBe(level.generated);
  }
});
