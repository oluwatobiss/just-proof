import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
const dir=new URL('.',import.meta.url);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const printer=ts.createPrinter({removeComments:true});
const types=['InitialAPI','Configuration','ConnectionStatus','SignDataOptions','Signature'];
const methods=['getConnectionStatus','getConfiguration','getUnshieldedAddress','signData'];
function aliases(text) {
  const source=ts.createSourceFile('api.ts',text,ts.ScriptTarget.Latest,true);
  return {source,map:new Map(source.statements.filter(ts.isTypeAliasDeclaration).map(n=>[n.name.text,n]))};
}
function subset(text) {
  const {source,map}=aliases(text);const result={};
  for(const name of types){assert(map.has(name));result[name]=printer.printNode(ts.EmitHint.Unspecified,map.get(name),source);}
  const wallet=map.get('WalletConnectedAPI');assert(ts.isTypeLiteralNode(wallet.type));
  for(const name of methods){const member=wallet.type.members.find(n=>n.name?.getText(source)===name);assert(member);result[name]=printer.printNode(ts.EmitHint.Unspecified,member,source);}
  return result;
}
export function compare() {
  const source0=fs.readFileSync(new URL('v4.0.0-src-api.ts.txt',dir),'utf8');
  const source1=fs.readFileSync(new URL('v4.0.1-src-api.ts.txt',dir),'utf8');
  const used0=subset(source0),used1=subset(source1);assert.deepEqual(used0,used1);
  const installed=fs.readFileSync('node_modules/@midnight-ntwrk/dapp-connector-api/dist/api.d.ts','utf8');assert.deepEqual(used1,subset(installed));
  const a=aliases(source0),b=aliases(source1);const changed=[];
  assert.deepEqual([...a.map.keys()],[...b.map.keys()]);
  for(const [name,node] of a.map){if(name==='WalletConnectedAPI')continue;assert.equal(printer.printNode(ts.EmitHint.Unspecified,node,a.source),printer.printNode(ts.EmitHint.Unspecified,b.map.get(name),b.source));}
  const m0=a.map.get('WalletConnectedAPI').type.members,m1=b.map.get('WalletConnectedAPI').type.members;assert.equal(m0.length,m1.length);
  for(let i=0;i<m0.length;i++)if(printer.printNode(ts.EmitHint.Unspecified,m0[i],a.source)!==printer.printNode(ts.EmitHint.Unspecified,m1[i],b.source))changed.push(m0[i].name.getText(a.source));
  assert.deepEqual(changed,['balanceUnsealedTransaction','balanceSealedTransaction','makeTransfer']);
  const spec0=fs.readFileSync(new URL('v4.0.0-SPECIFICATION.md.txt',dir),'utf8'),spec1=fs.readFileSync(new URL('v4.0.1-SPECIFICATION.md.txt',dir),'utf8');
  const ranges=[['### Initial API','### Connected API'],['type UnshieldedAddress','type DustAddress'],['  signData(data:','type DelegateProving'],['type SignDataOptions','export type KeyMaterialProvider'],['#### Permissions','#### Preparing and handling transactions'],['#### Signing','#### Proving']];
  const specChecks=ranges.map(([start,end])=>{const extract=s=>{const i=s.indexOf(start),j=s.indexOf(end,i+start.length);assert(i>=0&&j>i);return s.slice(i,j);};const x=extract(spec0);assert.equal(x,extract(spec1));return {start,end,identical:true,sha256:hash(x)};});
  const diff=JSON.parse(fs.readFileSync(new URL('compare.json',dir),'utf8'));
  assert.equal(diff.base_commit.sha,'91044d7ba8e50bb1f2d67f95c8c3d1f8642727b8');assert.equal(diff.commits.at(-1).sha,'e1ac4e746ced0b60d26ef23e379476c5db9ea2bc');
  return {usedSubsetIdentical:true,installed401DeclarationSubsetMatches:true,profiles:['4.0.0','4.0.1'],tags:{'v4.0.0':diff.base_commit.sha,'v4.0.1':diff.commits.at(-1).sha},usedDeclarations:used0,usedDeclarationHashes:Object.fromEntries(Object.entries(used0).map(([k,v])=>[k,hash(v)])),changedApiMethods:changed,specChecks,qualification:'Only functional API changes are optional payFees additions to three transaction methods. Ancillary version/generated-doc/grammar/newline updates also exist; not every byte outside payFees is unchanged.',connectShape:'InitialAPI defines a callable property without an own-data-descriptor constraint. Initial object freezing does not forbid inherited methods or get-only accessors. Runtime callability remains a dedicated-click check.'};
}
if(process.argv[1] && pathToFileURL(fs.realpathSync(process.argv[1])).href===import.meta.url){const result=compare();fs.writeFileSync(fileURLToPath(new URL('comparison-result.json',dir)),JSON.stringify(result,null,2)+'\n');console.log('Exact used subset and installed declarations: PASS');}
