import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { schemas, statementType, requestType, stateType } from "../support/v2-reference.js";

type TypeInfo={"type-name":string;name?:string;elements?:{name:string;type:TypeInfo}[]};
type CircuitInfo={name:string;arguments:{name:string;type:TypeInfo}[]};
const meta=JSON.parse(readFileSync("test/fixtures/managed/phase2-primitives/compiler/contract-info.json","utf8")) as {circuits:CircuitInfo[]};
for(const [name,schema] of Object.entries(schemas)) {
  it(`generated metadata and declarations preserve ordered type ${name}`,()=>{
    const circuit=meta.circuits.find(c=>c.name===`raw_${name}`)!;
    const type=circuit.arguments[0].type;
    expect(type.name).toBe(name);
    expect(type.elements!.map(x=>x.name)).toEqual(schema.fieldOrder);
    const declarations=readFileSync("test/fixtures/managed/phase2-primitives/contract/index.d.ts","utf8");
    const file=ts.createSourceFile("generated.d.ts",declarations,ts.ScriptTarget.Latest,true);
    const alias=file.statements.find((node):node is ts.TypeAliasDeclaration=>ts.isTypeAliasDeclaration(node) && node.name.text===name);
    expect(alias).toBeDefined();
    if(!alias || !ts.isTypeLiteralNode(alias.type)) throw new Error("expected generated struct type");
    expect(alias.type.members.map(member=>member.name?.getText(file))).toEqual(schema.fieldOrder);
  });
}
it("preserves nested statement/request/state order and exact Uint widths in generated source",()=>{
  const nested=[
    ["raw_CredentialCommitmentValueV2","statement",statementType.fieldOrder],
    ["raw_QualificationRequestDigestInputV2","request",requestType.fieldOrder],
    ["raw_QualificationVerificationStateDigestInputV2","state",stateType.fieldOrder],
  ] as const;
  for(const [name,field,order] of nested) {
    const type=meta.circuits.find(c=>c.name===name)!.arguments[0].type.elements!.find(x=>x.name===field)!.type;
    expect(type.elements!.map(x=>x.name)).toEqual(order);
  }
  const source=readFileSync("test/fixtures/managed/phase2-primitives/contract/index.js","utf8");
  for(const [bound,width] of [["255",1],["65535",2],["4294967295",4],["18446744073709551615",8]]) {
    expect(source).toContain(`CompactTypeUnsignedInteger(${bound}n, ${width})`);
  }
});
it("records the shared runtime trust base instead of claiming independent cryptography",()=>{
  const generated=readFileSync("test/fixtures/managed/phase2-primitives/contract/index.js","utf8");
  const runtime=readFileSync("node_modules/@midnight-ntwrk/compact-runtime/dist/built-ins.js","utf8");
  expect(generated).toContain("__compactRuntime.persistentHash");
  expect(generated).toContain("__compactRuntime.persistentCommit");
  expect(runtime).toContain("ocrt.persistentHash(rtType.alignment(), rtType.toValue(value))");
  expect(runtime).toContain("ocrt.persistentCommit(rtType.alignment(), rtType.toValue(value), [opening])");
});
