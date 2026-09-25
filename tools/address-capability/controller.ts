import type { ConnectedAPI, SignDataOptions } from '@midnight-ntwrk/dapp-connector-api';
import { CAPABILITY_DOMAIN, CAMPAIGN, encodeChallenge, bytesHex, validAt } from '../../docs/development/evidence/2026-09-25-preprod-mvp-001/capability-challenge';
import type { Challenge } from '../../docs/development/evidence/2026-09-25-preprod-mvp-001/capability-challenge';
import { canonicalAddress, fail, frame, ProbeFailure, verifyReturned } from './verification';
import { validateLocalVerifier, preparationCategory } from './verifier-selftest';
import type { LocalVerifierStatus } from './verifier-selftest';
import type { Encoding, Primitives } from './verification';
import { inspectConnect, reviewedVersion, sameConnect } from './compatibility';
import type { CompatibilityReason, ConnectShape, ConnectInspection } from './compatibility';
export interface Candidate { entry: string; name: string; rdns: string; apiVersion: string; duplicate: boolean; canConnect: boolean; compatibilityReason: CompatibilityReason; connectShape: ConnectShape }
export interface Result {
  localVerifier: LocalVerifierStatus; signingBlocked: boolean; selected: Candidate | null; apiVersionAccepted: boolean; preprodConfirmed: boolean; signDataCallable: boolean;
  signingCompleted: boolean; signedDataMatched: boolean; signatureVerified: boolean; derivedAddressMatched: boolean;
  unexpired: boolean; encodings: {data: Encoding; signature: Encoding; verifyingKey: Encoding} | null;
  overall: 'NOT_TESTED' | 'CONNECTED' | 'PASSED' | 'FAILED'; errorCategory: string | null;
}
export interface Environment { now(): number; random(): Uint8Array; loadPrimitives(): Promise<unknown> }
const empty = (): Result => ({localVerifier:'NOT_PREPARED',signingBlocked:false,selected:null,apiVersionAccepted:false,preprodConfirmed:false,signDataCallable:false,signingCompleted:false,signedDataMatched:false,signatureVerified:false,derivedAddressMatched:false,unexpired:false,encodings:null,overall:'NOT_TESTED',errorCategory:null});
const text = (v: unknown): v is string => typeof v === 'string' && /^[\x20-\x7e]{1,128}$/.test(v);
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
function timeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve,reject) => {
    const timer=setTimeout(()=>reject(new ProbeFailure('WALLET_TIMEOUT')),120000);
    promise.then(v=>{clearTimeout(timer);resolve(v);},()=>{clearTimeout(timer);reject(new ProbeFailure('WALLET_REJECTED_OR_FAILED'));});
  });
}
export function createController(env: Environment) {
  let entries = new Map<string, {candidate: Candidate; api: object; connectInspection: ConnectInspection}>();
  let result = empty(); let blocked=false; const methodIdentities=new Map<string,unknown>();
  function unchanged(connected:object,name:string) { if(Reflect.get(connected,name)!==methodIdentities.get(name)) fail('CONNECTED_API_METHOD_CHANGED'); } let api: Pick<ConnectedAPI,'getConnectionStatus'|'getConfiguration'|'getUnshieldedAddress'|'signData'> | undefined; let address: string | undefined; let primitives: Primitives | undefined; let busy=false;
  function failure(e: unknown) { blocked=true;methodIdentities.clear();result.signingBlocked=true; if(e instanceof ProbeFailure && e.category==='PREPROD_MISMATCH') result.preprodConfirmed=false; result.overall='FAILED'; result.errorCategory=e instanceof ProbeFailure ? e.category : 'CAPABILITY_FAILED'; api=undefined; address=undefined; primitives=undefined; }
  async function request<T>(operation:()=>Promise<T>,category:string):Promise<T> {
    try { return await timeout(operation()); } catch { return fail(category); }
  }
  async function preprod(connected: Pick<ConnectedAPI,'getConnectionStatus'|'getConfiguration'>) {
    unchanged(connected,'getConnectionStatus');unchanged(connected,'getConfiguration');
    const status = await request(()=>connected.getConnectionStatus(),'CONNECTION_STATUS_REQUEST_FAILED');
    unchanged(connected,'getConfiguration');
    const config = await request(()=>connected.getConfiguration(),'CONFIGURATION_REQUEST_FAILED');
    if(status?.status==='disconnected') fail('WALLET_CONNECTION_LOST');
    if (!status || !config || status.status!=='connected' || status.networkId!=='preprod' || config.networkId!=='preprod') fail('PREPROD_MISMATCH');
  }
  async function readAddress(connected: Pick<ConnectedAPI,'getUnshieldedAddress'>) {
    unchanged(connected,'getUnshieldedAddress');
    const response:unknown=await request(()=>connected.getUnshieldedAddress(),'UNSHIELDED_ADDRESS_REQUEST_FAILED');
    let value:unknown;
    try {
      if(!object(response)||Array.isArray(response)||Reflect.ownKeys(response).length!==1) fail('UNSHIELDED_ADDRESS_RESPONSE_INVALID');
      const descriptor=Object.getOwnPropertyDescriptor(response,'unshieldedAddress');
      if(!descriptor||!('value' in descriptor)||typeof descriptor.value!=='string') fail('UNSHIELDED_ADDRESS_RESPONSE_INVALID');
      value=descriptor.value;
    } catch { return fail('UNSHIELDED_ADDRESS_RESPONSE_INVALID'); }
    try { return canonicalAddress(value as string); } catch { return fail('UNSHIELDED_ADDRESS_FORMAT_INVALID'); }
  }
  return {
    async prepare():Promise<void> {
      if(busy||blocked||result.overall==='PASSED'||primitives) return;
      busy=true;
      let loaded:unknown;
      try { loaded=await env.loadPrimitives(); }
      catch(e) { const category=e instanceof ProbeFailure && e.category==='LOCAL_LEDGER_INITIALIZATION_FAILED'?'LOCAL_LEDGER_INITIALIZATION_FAILED':'LOCAL_VERIFIER_IMPORT_FAILED';result.localVerifier=category;failure(new ProbeFailure(category));busy=false;return; }
      try {
        primitives=validateLocalVerifier(loaded);result.localVerifier='LOCAL_VERIFIER_READY';
      } catch(e) { const category=preparationCategory(e);result.localVerifier=category;failure(new ProbeFailure(category)); }
      finally {busy=false;}
    },
    snapshot(): Result { return structuredClone(result); },
    isBusy() { return busy; },
    discover(injected: unknown): Candidate[] {
      if(busy||blocked||result.overall==='PASSED') return [];
      entries=new Map(); result={...empty(),localVerifier:result.localVerifier}; api=undefined;address=undefined;
      try {
        if (!object(injected)) return [];
        const descriptors=Object.entries(Object.getOwnPropertyDescriptors(injected));
        if(descriptors.length>32) fail('DISCOVERY_LIMIT');
        for(const [entry,descriptor] of descriptors) {
          if(!text(entry) || !('value' in descriptor) || !object(descriptor.value)) continue;
          const fields=Object.getOwnPropertyDescriptors(descriptor.value);
          const values: Record<string,unknown>={};
          for(const name of ['name','rdns','apiVersion']) { if(fields[name] && 'value' in fields[name]) values[name]=fields[name].value; }
          if(!text(values.name)||!text(values.rdns)||!text(values.apiVersion)) continue;
          const initial: object = descriptor.value;
          const inspection=inspectConnect(initial);
          const reviewed=reviewedVersion(values.apiVersion);
          const candidate: Candidate={entry,name:values.name,rdns:values.rdns,apiVersion:values.apiVersion,duplicate:false,
            canConnect:reviewed && inspection.eligible,connectShape:inspection.shape,
            compatibilityReason:!reviewed?'API_VERSION_UNREVIEWED':!inspection.eligible?'CONNECT_METHOD_NOT_DISCOVERABLE':inspection.accessor?'CONNECT_REQUIRES_CLICK_RESOLUTION':'READY_FOR_EXPLICIT_CONNECT'};
          // Function/getter descriptors remain internal and are never included in public results.
          entries.set(entry,{candidate,api:initial,connectInspection:inspection});
        }
        for(const row of entries.values()) row.candidate.duplicate=[...entries.values()].some(other=>other!==row && (other.candidate.name.trim().toLowerCase()===row.candidate.name.trim().toLowerCase() || other.candidate.rdns.trim().toLowerCase()===row.candidate.rdns.trim().toLowerCase()));
        for(const row of entries.values()) if(row.candidate.duplicate) { row.candidate.canConnect=false;row.candidate.compatibilityReason='DUPLICATE_IDENTIFIERS'; }
        return [...entries.values()].map(x=>({...x.candidate}));
      } catch { failure(new ProbeFailure('DISCOVERY_FAILED'));return []; }
    },
    select(entry: string): void {
      if(busy||blocked||result.overall==='PASSED') return;
      result={...empty(),localVerifier:result.localVerifier};api=undefined;address=undefined;
      const row=entries.get(entry); if(!row) { failure(new ProbeFailure('SELECTION_REQUIRED'));return; }
      result.selected={...row.candidate};result.apiVersionAccepted=reviewedVersion(row.candidate.apiVersion);
    },
    async connect(): Promise<void> {
      if(busy||blocked||result.overall==='PASSED') return;busy=true;
      try {
        if(!primitives||result.localVerifier!=='LOCAL_VERIFIER_READY') fail('LOCAL_VERIFIER_NOT_READY');
        const row=result.selected && entries.get(result.selected.entry);
        if(!row) fail('SELECTION_REQUIRED');
        if(!reviewedVersion(row.candidate.apiVersion)) fail('API_VERSION_UNREVIEWED');
        if(row.candidate.duplicate) fail('DUPLICATE_IDENTIFIERS');
        if(!row.candidate.canConnect) fail('CONNECT_METHOD_NOT_DISCOVERABLE');
        const current=Object.getOwnPropertyDescriptors(row.api);
        if(current.apiVersion?.value!==row.candidate.apiVersion || current.name?.value!==row.candidate.name || current.rdns?.value!==row.candidate.rdns) fail('IDENTITY_CHANGED');
        const currentConnect=inspectConnect(row.api);
        if(!sameConnect(row.connectInspection,currentConnect)) fail('IDENTITY_CHANGED');
        result={...empty(),localVerifier:'LOCAL_VERIFIER_READY',selected:{...row.candidate},apiVersionAccepted:true};
        // Resolve exactly once, only on this dedicated click. No await before invocation.
        let method: unknown;
        try { method=Reflect.get(row.api,'connect',row.api); } catch { fail('CONNECT_RESOLUTION_FAILED'); }
        if(typeof method!=='function') fail('CONNECT_METHOD_NOT_CALLABLE');
        const pending: unknown=Reflect.apply(method,row.api,['preprod']);
        const resolved: unknown=await timeout(Promise.resolve(pending));
        if(!object(resolved)) fail('METHOD_MISSING');
        for(const method of ['getConnectionStatus','getConfiguration','getUnshieldedAddress','signData'] as const) if(typeof resolved[method]!=='function') fail('METHOD_MISSING');
        // Structural runtime boundary: only these four validated members are ever consumed.
        const connected=resolved as Pick<ConnectedAPI,'getConnectionStatus'|'getConfiguration'|'getUnshieldedAddress'|'signData'>;
        for(const name of ['getConnectionStatus','getConfiguration','getUnshieldedAddress','signData'])methodIdentities.set(name,Reflect.get(connected,name));
        result.signDataCallable=true;
        await preprod(connected);result.preprodConfirmed=true;
        address=await readAddress(connected);
        api=connected;result.overall='CONNECTED';result.errorCategory=null;
      } catch(e) { failure(e instanceof ProbeFailure?e:new ProbeFailure('UNEXPECTED_CONNECT_STAGE_FAILURE')); } finally {busy=false;}
    },
    async sign(): Promise<void> {
      if(busy||blocked||result.overall==='PASSED') return;busy=true;
      try {
        if(!api||!address||!primitives||result.overall!=='CONNECTED') fail('CONNECT_REQUIRED');
        const connected=api;const claimed=address;const crypto=primitives;
        const nonce=env.random();if(nonce.length!==32) fail('NONCE_INVALID');
        const issuedAt=env.now();
        const challenge: Challenge={domain:CAPABILITY_DOMAIN,schema:'1' as const,network:'preprod' as const,campaign:CAMPAIGN,contract:'11'.repeat(32),address:claimed,nonce:bytesHex(nonce),issuedAt,expiresAt:issuedAt+300};
        const bytes=encodeChallenge(challenge,canonicalAddress);const expected=frame(bytes);
        await preprod(connected);
        if(!validAt(challenge,env.now())) fail('CHALLENGE_TIME_INVALID');
        const options: SignDataOptions={encoding:'text',keyType:'unshielded'};
        unchanged(connected,'signData');
        const returned=await timeout(connected.signData(new TextDecoder('utf-8',{fatal:true}).decode(bytes),options));
        result.signingCompleted=true;
        result.encodings=verifyReturned(returned,expected,claimed,crypto,stage=>{result[stage]=true;});
        await preprod(connected);
        const fresh=await readAddress(connected);
        if(fresh!==claimed) fail('ADDRESS_CHANGED');
        result.unexpired=validAt(challenge,env.now());if(!result.unexpired) fail('CHALLENGE_TIME_INVALID');
        result.overall='PASSED';result.errorCategory=null;
      } catch(e) { failure(e); } finally {api=undefined;address=undefined;primitives=undefined;methodIdentities.clear();busy=false;}
    },
  };
}

export function actionAvailability(result: Result,busy: boolean) {
  const reviewed=result.overall!=='PASSED' && result.overall!=='FAILED' && !result.signingBlocked && result.localVerifier==='LOCAL_VERIFIER_READY' && !!result.selected && reviewedVersion(result.selected.apiVersion);
  return {connect:!busy && reviewed && !!result.selected?.canConnect && !result.selected.duplicate && result.overall!=='CONNECTED',
    sign:!busy && reviewed && result.apiVersionAccepted && result.overall==='CONNECTED'};
}
