import * as ledger from '@midnight-ntwrk/ledger-v8';
import {describe,it,expect,vi} from 'vitest';
import {createController,actionAvailability} from '../../tools/address-capability/controller';
import {inspectConnect,reviewedVersion} from '../../tools/address-capability/compatibility';
function setup(version='4.0.1') {
  const env={now:()=>0,random:vi.fn(()=>new Uint8Array(32)),loadPrimitives:vi.fn(async()=>ledger)};
  return {controller:createController(env),wallet:{name:'Public candidate',rdns:'example.public',apiVersion:version},env};
}
describe('reviewed profiles and descriptor-only discovery',()=>{
  it.each(['4.0.0','4.0.1'])('accepts exact %s',v=>expect(reviewedVersion(v)).toBe(true));
  it.each(['4.0.2','4.1.0','4.x','v4.0.1','4.0.1 ',''])('rejects %s',v=>expect(reviewedVersion(v)).toBe(false));
  it.each([false,true])('resolves data function synchronously, inherited=%s',async inherited=>{
    const f=setup();const method=vi.fn(function(this:unknown,network:string){expect(this).toBe(f.wallet);expect(network).toBe('preprod');return Promise.resolve({});});
    if(inherited)Object.setPrototypeOf(f.wallet,{connect:method});else Object.defineProperty(f.wallet,'connect',{value:method});
    const [row]=f.controller.discover({entry:f.wallet});expect(row.connectShape).toBe(inherited?'INHERITED_DATA_FUNCTION':'OWN_DATA_FUNCTION');
    expect(f.controller.snapshot().selected).toBeNull();expect(method).not.toHaveBeenCalled();f.controller.select('entry');
    await f.controller.prepare();const pending=f.controller.connect();expect(method).toHaveBeenCalledTimes(1);await pending;
  });
  it.each([false,true])('never invokes accessor until Connect click, inherited=%s',async inherited=>{
    const f=setup();
    const method=vi.fn(function(this:unknown){expect(this).toBe(f.wallet);return Promise.resolve({});});
    const getter=vi.fn(function(this:unknown){expect(this).toBe(f.wallet);return method;});
    const owner=inherited?{}:f.wallet;Object.defineProperty(owner,'connect',{get:getter});if(inherited)Object.setPrototypeOf(f.wallet,owner);
    const [row]=f.controller.discover({entry:f.wallet});expect(row.compatibilityReason).toBe('CONNECT_REQUIRES_CLICK_RESOLUTION');
    f.controller.select('entry');await f.controller.prepare();expect(getter).not.toHaveBeenCalled();expect(method).not.toHaveBeenCalled();expect(actionAvailability(f.controller.snapshot(),false).connect).toBe(true);
    await f.controller.prepare();const pending=f.controller.connect();expect(getter).toHaveBeenCalledTimes(1);expect(method).toHaveBeenCalledTimes(1);await pending;
  });
  it.each(['absent','noncallable','setter','shadow'])('fails closed for %s',async shape=>{
    const f=setup();const call=vi.fn();
    if(shape==='noncallable')Object.defineProperty(f.wallet,'connect',{value:42});
    if(shape==='setter')Object.defineProperty(f.wallet,'connect',{set:call});
    if(shape==='shadow'){Object.setPrototypeOf(f.wallet,{connect:call});Object.defineProperty(f.wallet,'connect',{value:undefined});}
    const [row]=f.controller.discover({entry:f.wallet});expect(row.compatibilityReason).toBe('CONNECT_METHOD_NOT_DISCOVERABLE');
    f.controller.select('entry');expect(actionAvailability(f.controller.snapshot(),false)).toEqual({connect:false,sign:false});await f.controller.prepare();await f.controller.connect();expect(call).not.toHaveBeenCalled();
  });
  it.each(['throw','noncallable'])('sanitizes deferred accessor %s',async kind=>{
    const f=setup();const getter=vi.fn(()=>{if(kind==='throw')throw new Error('PRIVATE_CANARY');return 42;});Object.defineProperty(f.wallet,'connect',{get:getter});
    f.controller.discover({entry:f.wallet});f.controller.select('entry');expect(getter).not.toHaveBeenCalled();await f.controller.prepare();await f.controller.connect();
    expect(f.controller.snapshot().errorCategory).toBe(kind==='throw'?'CONNECT_RESOLUTION_FAILED':'CONNECT_METHOD_NOT_CALLABLE');expect(JSON.stringify(f.controller.snapshot())).not.toContain('PRIVATE_CANARY');
  });
  it('never resolves an unreviewed accessor and disables both actions',async()=>{
    const f=setup('4.0.2');const getter=vi.fn();Object.defineProperty(f.wallet,'connect',{get:getter});f.controller.discover({entry:f.wallet});f.controller.select('entry');
    expect(actionAvailability(f.controller.snapshot(),false)).toEqual({connect:false,sign:false});expect(actionAvailability({...f.controller.snapshot(),overall:'CONNECTED',apiVersionAccepted:true},false).sign).toBe(false);
    await f.controller.prepare();await f.controller.connect();await f.controller.sign();expect(getter).not.toHaveBeenCalled();expect(f.env.random).not.toHaveBeenCalled();
  });
  it('rejects descriptor replacement before resolving',async()=>{
    const f=setup();const first=vi.fn();const second=vi.fn();Object.defineProperty(f.wallet,'connect',{value:first,configurable:true});f.controller.discover({entry:f.wallet});f.controller.select('entry');Object.defineProperty(f.wallet,'connect',{value:second});
    await f.controller.prepare();await f.controller.connect();expect(f.controller.snapshot().errorCategory).toBe('IDENTITY_CHANGED');expect(first).not.toHaveBeenCalled();expect(second).not.toHaveBeenCalled();
  });
  it('does not infer a callable through a proxy get fallback',()=>{
    const get=vi.fn();expect(inspectConnect(new Proxy({},{get})).shape).toBe('ABSENT');expect(get).not.toHaveBeenCalled();
    expect(inspectConnect(new Proxy({},{getOwnPropertyDescriptor(){throw new Error('PRIVATE');}})).shape).toBe('UNINSPECTABLE');
  });
});
