import { describe,it,expect,vi,afterEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { createKeystore } from '../../node_modules/@midnight-ntwrk/wallet-sdk-unshielded-wallet/dist/KeyStore.js';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { validateLocalVerifier } from '../../tools/address-capability/verifier-selftest';
import { ProbeFailure } from '../../tools/address-capability/verification';
import { createController, actionAvailability } from '../../tools/address-capability/controller';
import { Probe, ProbeView } from '../../tools/address-capability/Probe';
import { frame,hex,decodeCanonical,verifyReturned,addressPayload } from '../../tools/address-capability/verification';
import type { Environment } from '../../tools/address-capability/controller';
const key=createKeystore(Uint8Array.from({length:32},(_,i)=>i+1),'preprod');
const other=createKeystore(Uint8Array.from({length:32},(_,i)=>i+33),'preprod');
const utf8=(s:string)=>new TextEncoder().encode(s);
const b64=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
function fixture(version='4.0.1') {
  let now=1800000000;
  const signData=vi.fn(async (data:string,options:unknown)=>{
    expect(options).toEqual({encoding:'text',keyType:'unshielded'});
    const bytes=frame(utf8(data));return {data:new TextDecoder().decode(bytes),signature:key.signData(bytes),verifyingKey:key.getPublicKey()};
  });
  const connected={getConnectionStatus:vi.fn(async()=>({status:'connected',networkId:'preprod'})),getConfiguration:vi.fn(async()=>({networkId:'preprod'})),getUnshieldedAddress:vi.fn(async()=>({unshieldedAddress:key.getBech32Address().asString()})),signData};
  const connect=vi.fn(async()=>connected);
  const injected={a:{name:'1AM candidate',rdns:'example.candidate',apiVersion:version,connect},b:{name:'Other',rdns:'example.other',apiVersion:'4.0.1',connect:vi.fn(async()=>connected)}};
  const random=vi.fn(()=>new Uint8Array(32).fill(9));
  const env:Environment={now:()=>now,random,loadPrimitives:async()=>ledger};
  const controller=createController(env);
  return {controller,env,connected,connect,injected,random,setTime:(v:number)=>{now=v;}};
}
async function connectedFixture(){const f=fixture();f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.controller.snapshot().overall).toBe('CONNECTED');return f;}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
describe('strict capability probe with mocks only',()=>{
  it('is inert on module import and render, including injected getter',async()=>{
    const discover=vi.fn(()=>{throw new Error('NO_AUTOMATIC_DISCOVERY');});
    const fetch=vi.fn();vi.stubGlobal('fetch',fetch);vi.stubGlobal('window',Object.defineProperty({},'midnight',{get:discover}));
    const f=fixture();vi.resetModules();await import('../../tools/address-capability/controller');
    const html=renderToStaticMarkup(createElement(Probe,{env:f.env,injected:discover}));
    expect(discover).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();expect(f.connect).not.toHaveBeenCalled();expect(f.random).not.toHaveBeenCalled();
    expect(html).toContain('No transaction');expect(html).not.toContain(key.getBech32Address().asString());expect(html).not.toContain('checked=""');
  });
  it('has explicit selection and synchronous connect; nonce waits for sign',async()=>{
    const f=fixture();expect(f.controller.discover(f.injected)).toHaveLength(2);expect(f.controller.snapshot().selected).toBeNull();
    expect(f.connect).not.toHaveBeenCalled();
    f.controller.select('b');await f.controller.prepare();const pending=f.controller.connect();expect(f.injected.b.connect).toHaveBeenCalledWith('preprod');expect(f.connect).not.toHaveBeenCalled();await pending;
    expect(f.random).not.toHaveBeenCalled();await f.controller.sign();expect(f.random).toHaveBeenCalledTimes(1);expect(f.controller.snapshot().overall).toBe('PASSED');
  });
  it.each(['4.0.0','4.0.1'])('completes the mock signature/address chain for exact %s',async version=>{
    const f=fixture(version);f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();await f.controller.sign();
    expect(f.controller.snapshot()).toMatchObject({overall:'PASSED',signatureVerified:true,derivedAddressMatched:true});
  });
  it('renders the explicit readiness control with Connect and Sign disabled',()=>{
    const f=fixture();const html=renderToStaticMarkup(createElement(Probe,{env:f.env,injected:()=>{throw new Error('NO_DISCOVERY');}}));
    expect(html).toContain('Prepare local verification runtime');expect(html).toMatch(/disabled=""[^>]*>Connect selected wallet/);expect(html).toMatch(/disabled=""[^>]*>I understand/);expect(f.connect).not.toHaveBeenCalled();expect(f.random).not.toHaveBeenCalled();
  });
  it('maps unexpected synchronous connect failures and prevents reuse',async()=>{
    const f=fixture();f.connect.mockImplementation(()=>{throw new Error('PRIVATE_CANARY');});await f.controller.prepare();f.controller.discover(f.injected);f.controller.select('a');await f.controller.connect();
    expect(f.controller.snapshot().errorCategory).toBe('UNEXPECTED_CONNECT_STAGE_FAILURE');f.controller.select('b');f.controller.discover(f.injected);await f.controller.connect();await f.controller.sign();expect(f.connect).toHaveBeenCalledTimes(1);expect(f.injected.b.connect).not.toHaveBeenCalled();expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it.each(['valid-signature','altered-message','altered-signature','address'])('fails closed on public selftest %s',async stage=>{
    const f=fixture();const verify=vi.fn(ledger.verifySignature);const address=vi.fn(ledger.addressFromKey);
    if(stage==='valid-signature')verify.mockReturnValue(false);
    if(stage==='altered-message')verify.mockReturnValue(true);
    if(stage==='altered-signature')verify.mockImplementationOnce(ledger.verifySignature).mockImplementationOnce(ledger.verifySignature).mockReturnValue(true);
    if(stage==='address')address.mockReturnValue('00'.repeat(32));
    const c=createController({...f.env,loadPrimitives:async()=>({verifySignature:verify,addressFromKey:address})});await c.prepare();
    expect(c.snapshot().localVerifier).toBe(stage==='address'?'LOCAL_ADDRESS_SELFTEST_FAILED':'LOCAL_SIGNATURE_SELFTEST_FAILED');expect(c.snapshot().signingBlocked).toBe(true);expect(f.connect).not.toHaveBeenCalled();
  });
  it('distinguishes ledger initialization from loader import failure',async()=>{
    const f=fixture();const c=createController({...f.env,loadPrimitives:async()=>{throw new ProbeFailure('LOCAL_LEDGER_INITIALIZATION_FAILED');}});await c.prepare();expect(c.snapshot().localVerifier).toBe('LOCAL_LEDGER_INITIALIZATION_FAILED');
  });
  it('accepts the fixed public vector on the pinned implementation',()=>expect(validateLocalVerifier(ledger)).toBe(ledger));
  it('keeps successful signing terminal and preserves the final result for every action',async()=>{
    const f=await connectedFixture();await f.controller.sign();const final=f.controller.snapshot();expect(final.overall).toBe('PASSED');
    expect(actionAvailability(final,false)).toEqual({connect:false,sign:false});
    const touched=vi.fn();const injected=new Proxy({},{ownKeys:touched});expect(f.controller.discover(injected)).toEqual([]);
    f.controller.select('b');await f.controller.prepare();await f.controller.connect();await f.controller.sign();
    expect(f.controller.snapshot()).toEqual(final);expect(touched).not.toHaveBeenCalled();expect(f.connect).toHaveBeenCalledTimes(1);expect(f.connected.signData).toHaveBeenCalledTimes(1);expect(f.random).toHaveBeenCalledTimes(1);
    const html=renderToStaticMarkup(createElement(ProbeView,{result:final,candidates:[final.selected!],operation:null,onPrepare:touched,onDiscover:touched,onSelect:touched,onConnect:touched,onSign:touched}));
    expect(html.match(/<button disabled=""/g)).toHaveLength(4);expect(html).toContain('<fieldset disabled=""');expect(html).toContain('PASSED');expect(html).toContain('This page is terminal');expect(touched).not.toHaveBeenCalled();
  });
  it.each(['ready','failed'] as const)('renders preparation %s safely',async state=>{
    const f=fixture();const c=state==='ready'?f.controller:createController({...f.env,loadPrimitives:async()=>{throw new Error('PRIVATE');}});await c.prepare();
    const callback=vi.fn();const html=renderToStaticMarkup(createElement(ProbeView,{result:c.snapshot(),candidates:[],operation:null,onPrepare:callback,onDiscover:callback,onSelect:callback,onConnect:callback,onSign:callback}));
    expect(html).toContain(state==='ready'?'LOCAL_VERIFIER_READY':'LOCAL_VERIFIER_IMPORT_FAILED');expect(html).toMatch(/<button disabled=""[^>]*>Prepare/);expect(html).toMatch(/<button disabled=""[^>]*>Connect/);expect(html).toMatch(/<button disabled=""[^>]*>I understand/);expect(html).not.toContain('PRIVATE');expect(callback).not.toHaveBeenCalled();
  });
  it.each(['prepare','connect','sign'] as const)('renders accurate busy messaging for %s',operation=>{
    const f=fixture();const callback=vi.fn();const html=renderToStaticMarkup(createElement(ProbeView,{result:f.controller.snapshot(),candidates:[],operation,onPrepare:callback,onDiscover:callback,onSelect:callback,onConnect:callback,onSign:callback}));
    expect(html).toContain(operation==='prepare'?'Preparing local verification runtime. No wallet access.':'Awaiting selected wallet. No automatic retries.');
    if(operation==='prepare')expect(html).not.toContain('Awaiting selected wallet');expect(callback).not.toHaveBeenCalled();
  });
  it('requires preparation before connect and permanently blocks after failure',async()=>{
    const f=fixture();f.controller.discover(f.injected);f.controller.select('a');await f.controller.connect();
    expect(f.controller.snapshot().errorCategory).toBe('LOCAL_VERIFIER_NOT_READY');await f.controller.prepare();await f.controller.connect();await f.controller.sign();
    expect(f.connect).not.toHaveBeenCalled();expect(f.random).not.toHaveBeenCalled();expect(f.controller.snapshot().signingBlocked).toBe(true);
  });
  it('prepares locally once using only the public vector, without discovery or randomness',async()=>{
    const f=fixture();const verifySignature=vi.fn(ledger.verifySignature),addressFromKey=vi.fn(ledger.addressFromKey);const load=vi.fn(async()=>({verifySignature,addressFromKey}));
    const c=createController({...f.env,loadPrimitives:load});await c.prepare();await c.prepare();
    expect(c.snapshot().localVerifier).toBe('LOCAL_VERIFIER_READY');expect(load).toHaveBeenCalledTimes(1);expect(verifySignature).toHaveBeenCalledTimes(3);expect(addressFromKey).toHaveBeenCalledTimes(1);expect(f.connect).not.toHaveBeenCalled();expect(f.random).not.toHaveBeenCalled();
  });
  it.each(['import','interface'])('blocks local preparation %s with no retry',async kind=>{
    const f=fixture();const load=vi.fn(async()=>{if(kind==='import')throw new Error('PRIVATE_CANARY');return Object.create(null);});
    const c=createController({...f.env,loadPrimitives:load});await c.prepare();await c.prepare();expect(load).toHaveBeenCalledTimes(1);
    expect(c.snapshot().localVerifier).toBe(kind==='import'?'LOCAL_VERIFIER_IMPORT_FAILED':'LOCAL_VERIFIER_INTERFACE_INVALID');expect(c.snapshot().signingBlocked).toBe(true);expect(JSON.stringify(c.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it.each([['getConnectionStatus','CONNECTION_STATUS_REQUEST_FAILED'],['getConfiguration','CONFIGURATION_REQUEST_FAILED'],['getUnshieldedAddress','UNSHIELDED_ADDRESS_REQUEST_FAILED']] as const)('categorizes %s rejection',async(method,category)=>{
    const f=fixture();f.connected[method].mockRejectedValue(new Error('PRIVATE_CANARY'));await f.controller.prepare();f.controller.discover(f.injected);f.controller.select('a');await f.controller.connect();await f.controller.sign();
    expect(f.controller.snapshot().errorCategory).toBe(category);expect(f.controller.snapshot().signingBlocked).toBe(true);expect(f.connected.signData).not.toHaveBeenCalled();expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it.each(['array','extra','getter','number','malformed','uppercase','wrong-network','wrong-length'])('rejects address response %s',async kind=>{
    const f=fixture();const getter=vi.fn(()=>key.getBech32Address().asString());const valid=key.getBech32Address().asString();
    const response:unknown=kind==='array'?[]:kind==='extra'?{unshieldedAddress:valid,extra:true}:kind==='getter'?Object.defineProperty({},'unshieldedAddress',{get:getter}):{unshieldedAddress:kind==='number'?42:kind==='uppercase'?valid.toUpperCase():kind==='wrong-network'?valid.replace('preprod','mainnet'):kind==='wrong-length'?valid.slice(0,-2):'PRIVATE_CANARY'};
    Object.defineProperty(f.connected,'getUnshieldedAddress',{value:vi.fn(async()=>response)});await f.controller.prepare();f.controller.discover(f.injected);f.controller.select('a');await f.controller.connect();await f.controller.sign();
    expect(f.controller.snapshot().errorCategory).toBe(['array','extra','getter','number'].includes(kind)?'UNSHIELDED_ADDRESS_RESPONSE_INVALID':'UNSHIELDED_ADDRESS_FORMAT_INVALID');expect(getter).not.toHaveBeenCalled();expect(f.connected.signData).not.toHaveBeenCalled();expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it('detects method replacement after status call',async()=>{
    const f=fixture();f.connected.getConnectionStatus.mockImplementation(async()=>{Object.defineProperty(f.connected,'getUnshieldedAddress',{value:vi.fn()});return {status:'connected',networkId:'preprod'};});await f.controller.prepare();f.controller.discover(f.injected);f.controller.select('a');await f.controller.connect();expect(f.controller.snapshot().errorCategory).toBe('CONNECTED_API_METHOD_CHANGED');expect(f.controller.snapshot().signingBlocked).toBe(true);
  });
  it('fails closed on excess injected entries',()=>{const f=fixture();const many=Object.fromEntries(Array.from({length:33},(_,i)=>[String(i),f.injected.a]));expect(f.controller.discover(many)).toEqual([]);expect(f.connect).not.toHaveBeenCalled();expect(f.controller.snapshot().overall).toBe('FAILED');});
  it('blocks duplicate names or rdns and never invokes icon getters',async()=>{
    const f=fixture();f.injected.b.name=f.injected.a.name;Object.defineProperty(f.injected.a,'icon',{get:()=>{throw new Error('ICON_ACCESSED');}});
    expect(f.controller.discover(f.injected).every(c=>c.duplicate)).toBe(true);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.connect).not.toHaveBeenCalled();expect(f.controller.snapshot().errorCategory).toBe('DUPLICATE_IDENTIFIERS');
  });
  it('does not trust a misleading wallet name as compatibility',async()=>{
    const f=fixture();f.injected.a.name='<script>1AM</script>';f.injected.a.apiVersion='4.0.2';f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.connect).not.toHaveBeenCalled();expect(f.controller.snapshot().errorCategory).toBe('API_VERSION_UNREVIEWED');
  });
  it.each(['getConnectionStatus','getConfiguration','getUnshieldedAddress','signData'])('rejects missing %s',async method=>{
    const f=fixture();Reflect.deleteProperty(f.connected,method);f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.controller.snapshot().errorCategory).toBe('METHOD_MISSING');
  });
  it('sanitizes rejected connection',async()=>{const f=fixture();f.connect.mockRejectedValue(new Error('PRIVATE_CANARY'));f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.controller.snapshot().errorCategory).toBe('WALLET_REJECTED_OR_FAILED');expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');});
  it('sanitizes rejected signing',async()=>{const f=await connectedFixture();f.connected.signData.mockRejectedValue(new Error('PRIVATE_CANARY'));await f.controller.sign();expect(f.controller.snapshot().errorCategory).toBe('WALLET_REJECTED_OR_FAILED');});
  it.each(['getConnectionStatus','getConfiguration'] as const)('rejects network before connect: %s',async method=>{
    const f=fixture();if(method==='getConnectionStatus')f.connected.getConnectionStatus.mockResolvedValue({status:'connected',networkId:'mainnet'});else f.connected.getConfiguration.mockResolvedValue({networkId:'mainnet'});
    f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();expect(f.controller.snapshot().errorCategory).toBe('PREPROD_MISMATCH');expect(f.connected.signData).not.toHaveBeenCalled();
  });
  it.each(['getConnectionStatus','getConfiguration'] as const)('rejects network after signing: %s',async method=>{
    const f=await connectedFixture();const original=f.connected.signData.getMockImplementation()!;
    f.connected.signData.mockImplementation(async(d,o)=>{const value=await original(d,o);if(method==='getConnectionStatus')f.connected.getConnectionStatus.mockResolvedValue({status:'connected',networkId:'mainnet'});else f.connected.getConfiguration.mockResolvedValue({networkId:'mainnet'});return value;});
    await f.controller.sign();expect(f.controller.snapshot().overall).toBe('FAILED');expect(f.controller.snapshot().errorCategory).toBe('PREPROD_MISMATCH');
  });
  it('refuses a changed address after signing',async()=>{const f=await connectedFixture();f.connected.getUnshieldedAddress.mockResolvedValue({unshieldedAddress:other.getBech32Address().asString()});await f.controller.sign();expect(f.controller.snapshot().errorCategory).toBe('ADDRESS_CHANGED');});
  it.each([1800000300,1799999999])('rejects expired or future-issued challenge at %s',async now=>{
    const f=await connectedFixture();const original=f.connected.signData.getMockImplementation()!;f.connected.signData.mockImplementation(async(d,o)=>{const value=await original(d,o);f.setTime(now);return value;});await f.controller.sign();expect(f.controller.snapshot().errorCategory).toBe('CHALLENGE_TIME_INVALID');
  });
  it('uses exact UTF-8 byte length, not UTF-16 length',()=>{const bytes=utf8('é🔒');expect(new TextDecoder().decode(frame(bytes))).toBe('midnight_signed_message:6:é🔒');});
  it.each(['text','hex','base64'] as const)('accepts canonical returned data in %s',async encoding=>{
    const f=await connectedFixture();f.connected.signData.mockImplementation(async data=>{const bytes=frame(utf8(data));return {data:encoding==='text'?new TextDecoder().decode(bytes):encoding==='hex'?hex(bytes):b64(bytes),signature:b64(decodeCanonical(key.signData(bytes),false,64).bytes),verifyingKey:b64(decodeCanonical(key.getPublicKey(),false,32).bytes)};});
    await f.controller.sign();expect(f.controller.snapshot().overall).toBe('PASSED');expect(f.controller.snapshot().encodings?.data).toBe(encoding);
  });
  it.each([' AA','AA','0xaa','YWJ=','YQ','YQ=','YQ===','YQ==\n','_w=='])('rejects noncanonical encoding %s',s=>expect(()=>decodeCanonical(s,false,1)).toThrow());
  it('rejects ambiguous representations instead of guessing',()=>expect(()=>decodeCanonical('6161',true)).toThrow('ENCODING_AMBIGUOUS'));
  it.each(['data','signature','verifyingKey','extra'] as const)('rejects corrupted returned %s',async field=>{
    const f=await connectedFixture();const original=f.connected.signData.getMockImplementation()!;
    f.connected.signData.mockImplementation(async(d,o)=>{const v=await original(d,o);if(field==='extra')return {...v,extra:'PRIVATE_CANARY'};return {...v,[field]:field==='data'?v.data.replace('midnight_signed_message','changed_signed_message!'):field==='signature'?'00'.repeat(64):other.getPublicKey()};});
    await f.controller.sign();expect(f.controller.snapshot().overall).toBe('FAILED');expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it('rejects valid signature associated with another address',()=>{
    const bytes=frame(utf8('public capability canary'));
    expect(()=>verifyReturned({data:new TextDecoder().decode(bytes),signature:other.signData(bytes),verifyingKey:other.getPublicKey()},bytes,key.getBech32Address().asString(),ledger,()=>{})).toThrow('ADDRESS_MISMATCH');
  });
  it('does not accept noncanonical or wrong-network addresses',()=>{expect(()=>addressPayload(key.getBech32Address().asString().toUpperCase())).toThrow('ADDRESS_INVALID');expect(()=>addressPayload('mn_addr1invalid')).toThrow('ADDRESS_INVALID');});
  it('has no persistence, logging, clipboard, network, proof or transaction calls',async()=>{
    const forbidden=vi.fn(()=>{throw new Error('FORBIDDEN');});vi.stubGlobal('fetch',forbidden);vi.stubGlobal('localStorage',{setItem:forbidden});vi.stubGlobal('sessionStorage',{setItem:forbidden});vi.stubGlobal('indexedDB',{open:forbidden});vi.stubGlobal('navigator',{clipboard:{writeText:forbidden}});
    const log=vi.spyOn(console,'log');const error=vi.spyOn(console,'error');const f=fixture();Object.assign(f.connected,{submitTransaction:forbidden,getProvingProvider:forbidden,balanceUnsealedTransaction:forbidden});
    f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();await f.controller.connect();await f.controller.sign();expect(f.controller.snapshot().overall).toBe('PASSED');expect(forbidden).not.toHaveBeenCalled();expect(log).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();
    const output=JSON.stringify(f.controller.snapshot());expect(output).not.toContain(key.getBech32Address().asString());expect(output).not.toContain(key.getPublicKey());
    await f.controller.sign();expect(f.connected.signData).toHaveBeenCalledTimes(1);
  });
  it('refuses disconnected status before signing without invoking signData',async()=>{const f=await connectedFixture();f.connected.getConnectionStatus.mockResolvedValue({status:'disconnected',networkId:'preprod'});await f.controller.sign();expect(f.connected.signData).not.toHaveBeenCalled();expect(f.controller.snapshot().errorCategory).toBe('WALLET_CONNECTION_LOST');});
  it('rejects version mutation after discovery',async()=>{const f=fixture();f.controller.discover(f.injected);f.controller.select('a');f.injected.a.apiVersion='4.1.0';await f.controller.prepare();await f.controller.connect();expect(f.connect).not.toHaveBeenCalled();expect(f.controller.snapshot().errorCategory).toBe('IDENTITY_CHANGED');});
  it('blocks overlapping rdns identifiers',async()=>{const f=fixture();f.injected.b.rdns=f.injected.a.rdns;f.controller.discover(f.injected);f.controller.select('b');await f.controller.prepare();await f.controller.connect();expect(f.injected.b.connect).not.toHaveBeenCalled();});
  it('rejects getters and unexpected symbol fields in signed response',()=>{
    const bytes=frame(utf8('public fixture'));const payload={data:new TextDecoder().decode(bytes),signature:key.signData(bytes),verifyingKey:key.getPublicKey()};
    expect(()=>verifyReturned({...payload,[Symbol('extra')]:true},bytes,key.getBech32Address().asString(),ledger,()=>{})).toThrow('RETURN_SHAPE_INVALID');
    const getter=vi.fn(()=>payload.data);Object.defineProperty(payload,'data',{get:getter});
    expect(()=>verifyReturned(payload,bytes,key.getBech32Address().asString(),ledger,()=>{})).toThrow('RETURN_SHAPE_INVALID');expect(getter).not.toHaveBeenCalled();
  });
  it('bounded connection timeout does not retry',async()=>{vi.useFakeTimers();const f=fixture();f.connect.mockImplementation(()=>new Promise(()=>{}));f.controller.discover(f.injected);f.controller.select('a');await f.controller.prepare();const pending=f.controller.connect();await vi.advanceTimersByTimeAsync(120000);await pending;expect(f.controller.snapshot().errorCategory).toBe('WALLET_TIMEOUT');expect(f.connect).toHaveBeenCalledTimes(1);});
  it('has no public frontend import or built probe symbols',()=>{
    for(const path of ['app/main.tsx','app/PublicApp.tsx','app/demo/Demo.tsx'])expect(readFileSync(path,'utf8')).not.toMatch(/address-capability|capability-probe/);
    for(const file of readdirSync('dist/assets').filter(x=>x.endsWith('.js')))expect(readFileSync(`dist/assets/${file}`,'utf8')).not.toMatch(/midnight_signed_message|ADDRESS-CAPABILITY-TEST|createController|signData/);
  });
});
