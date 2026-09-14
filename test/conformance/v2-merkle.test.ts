import { describe, it, expect } from "vitest";
import { pureCircuits as c } from "../fixtures/managed/phase2-primitives/contract/index.js";
import { ReferenceTree, emptyLeaf, nodeDomains, domain, rootFrom, hex } from "../support/v2-reference.js";
import { fixture } from "../support/v2-vectors.js";

describe.each(["issuer","credential","revocation"] as const)("%s depth-16 compiled Merkle helpers",tree=>{
  const tag=domain(nodeDomains[tree]);
  it.each([0,1,2,32767,32768,65534,65535,0xaaaa,0x5555])("binds directions and membership at %i",index=>{
    const store=new ReferenceTree(tree);const leaf=fixture(`leaf-${index}`);
    store.setSyntheticLeaf(index,leaf);const path=store.path(index);
    expect(c.bits(BigInt(index))).toEqual(Array.from({length:16},(_,bit)=>Boolean((index>>>bit)&1)));
    expect(hex(c.root(tag,leaf,BigInt(index),path))).toBe(hex(store.root()));
    expect(hex(rootFrom(tree,leaf,index,path))).toBe(hex(store.root()));
    c.member(tag,leaf,BigInt(index),65536n,path,store.root());
  });
  it.each(Array.from({length:16},(_,i)=>i))("rejects correct other-index root: changed direction %i",bit=>{
    const index=0x5a5a, store=new ReferenceTree(tree), leaf=fixture("direction-leaf");
    store.setSyntheticLeaf(index,leaf);
    expect(()=>c.member(tag,leaf,BigInt(index^(1<<bit)),65536n,store.path(index),store.root())).toThrow();
  });
  it("binds empty append slot to counter, permits last slot, rejects full/invalid counters",()=>{
    const store=new ReferenceTree(tree),empty=emptyLeaf(tree);
    c.emptySlot(tag,empty,0n,0n,store.path(0),store.root());
    c.emptySlot(tag,empty,65535n,65535n,store.path(65535),store.root());
    expect(()=>c.emptySlot(tag,empty,65535n,65536n,store.path(65535),store.root())).toThrow("tree full");
    expect(()=>c.emptySlot(tag,empty,7n,8n,store.path(7),store.root())).toThrow("append index");
    expect(()=>c.member(tag,empty,0n,65537n,store.path(0),store.root())).toThrow("invalid allocation counter");
    expect(()=>c.member(tag,empty,0n,0n,store.path(0),store.root())).toThrow("unallocated index");
    expect(()=>c.bits(65536n)).toThrow();
    expect(()=>c.bits(-1n)).toThrow();
  });
  it("rejects occupied slot, bad sibling/length/domain and stale path; refreshes after unrelated updates",()=>{
    const store=new ReferenceTree(tree),leaf=fixture("owned-leaf");store.setSyntheticLeaf(3,leaf);
    const oldPath=store.path(3),oldRoot=store.root();
    expect(()=>c.emptySlot(tag,emptyLeaf(tree),3n,3n,oldPath,oldRoot)).toThrow();
    store.setSyntheticLeaf(200,fixture("unrelated-leaf"));
    expect(()=>c.member(tag,leaf,3n,201n,oldPath,store.root())).toThrow();
    c.member(tag,leaf,3n,201n,store.path(3),store.root());
    const corrupt=store.path(3);corrupt[8][0]^=1;
    expect(()=>c.member(tag,leaf,3n,201n,corrupt,store.root())).toThrow();
    expect(()=>c.root(tag,leaf,3n,oldPath.slice(1))).toThrow();
    expect(()=>c.root(tag,leaf,3n,[...oldPath,oldPath[0]])).toThrow();
    expect(()=>c.member(domain("PROOF_STATE"),leaf,3n,201n,store.path(3),store.root())).toThrow();
  });
});
