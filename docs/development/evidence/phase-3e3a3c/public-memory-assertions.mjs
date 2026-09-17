import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
export async function main() {
  if (process.argv[2] !== '--public-memory-assertions') throw new Error('FLAG_REQUIRED');
  const { default: assert } = await import('node:assert/strict');
  const { createRestrictedMemoryProvider } = await import('./proposed-memory-provider.ts');
  let count = 0;
  const ok = value => { assert.ok(value); count++; };
  const {provider:p,dispose} = createRestrictedMemoryProvider('--separately-authorized-memory-provider');
  const source = { bigint:2n, bytes:new Uint8Array([1,2]), optional:undefined, map:new Map([['a',new Map([['b',3n]])]]), record:{protocolVersion:2n, path:{siblings:Array.from({length:16},()=>new Uint8Array(32))}} };
  p.setContractAddress('PUBLIC_SCOPE_A'); await p.set('PUBLIC_ID',source);
  source.bytes[0]=9; const first=await p.get('PUBLIC_ID');ok(first.bytes[0]===1);ok(first.bigint===2n);ok(first.map.get('a').get('b')===3n);ok(Object.hasOwn(first,'optional'));ok(first.record.path.siblings.length===16);
  first.bytes[0]=7;ok((await p.get('PUBLIC_ID')).bytes[0]===1);
  p.setContractAddress('PUBLIC_SCOPE_B');ok(await p.get('PUBLIC_ID')===null);
  await p.set('PUBLIC_ID',{value:1n});await p.remove('PUBLIC_ID');ok(await p.get('PUBLIC_ID')===null);
  await p.set('PUBLIC_ID',{value:1n});await p.clear();ok(await p.get('PUBLIC_ID')===null);
  // Public string tests representation only; not a valid sampled signing key.
  await p.setSigningKey('PUBLIC_SCOPE_A','PUBLIC_NOT_A_KEY');ok(await p.getSigningKey('PUBLIC_SCOPE_A')==='PUBLIC_NOT_A_KEY');await p.removeSigningKey('PUBLIC_SCOPE_A');ok(await p.getSigningKey('PUBLIC_SCOPE_A')===null);
  await p.setSigningKey('PUBLIC_SCOPE_A','PUBLIC_NOT_A_KEY');await p.clearSigningKeys();ok(await p.getSigningKey('PUBLIC_SCOPE_A')===null);
  for (const method of ['exportPrivateStates','importPrivateStates','exportSigningKeys','importSigningKeys']) {await assert.rejects(()=>p[method]({publicCanary:'NOT_PRIVATE'}),{message:'CAPABILITY_PROHIBITED'});count++;}
  p.setContractAddress('PUBLIC_SCOPE_A');await p.set('PUBLIC_ID',source);dispose();
  for (const method of ['get','set','remove','clear','getSigningKey','setSigningKey','removeSigningKey','clearSigningKeys']) {await assert.rejects(()=>p[method]('PUBLIC_ID',source),{message:'PROVIDER_UNAVAILABLE'});count++;}
  assert.throws(()=>p.setContractAddress('PUBLIC_SCOPE_A'),{message:'PROVIDER_UNAVAILABLE'});count++;
  for (const method of ['exportPrivateStates','importPrivateStates','exportSigningKeys','importSigningKeys']) {await assert.rejects(()=>p[method]({}),{message:'CAPABILITY_PROHIBITED'});count++;}
  class PublicExample { method(){return 1;} };
  ok(!(structuredClone(new PublicExample()) instanceof PublicExample));
  console.log(JSON.stringify({passed:count,requiredShapes:'plain generated records, bigint, bytes, arrays, maps, undefined; SigningKey:string',classPrototypePreservation:false,classValuesPermittedInPlannedPrivateState:false,signingKeyValidationPerformed:false}));
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) await main();
