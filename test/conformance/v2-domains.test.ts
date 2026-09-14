import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pureCircuits } from "../fixtures/managed/phase2-primitives/contract/index.js";
import { labels, domain, hex, qualification } from "../support/v2-reference.js";

describe("V2 domain constants (raw SHA-256 and generated Compact bytes)",()=>{
  it.each(Object.keys(labels) as (keyof typeof labels)[])("matches exact manifest label and byte order: %s",name=>{
    const index=Object.keys(labels).indexOf(name);
    expect(hex(pureCircuits.domains()[index])).toBe(hex(domain(name)));
    const text=readFileSync("docs/protocol/v2/03-domains-and-commitments.md","utf8");
    expect(text).toContain(`\`${labels[name]}\` | \`${hex(domain(name))}\``);
    expect(hex(domain(name))).not.toBe(createHash("sha256").update(labels[name]+"\n").digest("hex"));
    expect(hex(domain(name))).not.toBe(createHash("sha256").update(labels[name].replace(":V2",":V1")).digest("hex"));
  });
  it("has exactly 18 distinct domains and retains the separate demo qualification",()=>{
    expect(pureCircuits.domains()).toHaveLength(18);
    expect(new Set(pureCircuits.domains().map(hex)).size).toBe(18);
    expect(hex(qualification)).toBe("3216c2bb7727244e256fe3a7f6e89d148b3636d31b525dbd436d97ca922a3db7");
  });
});
