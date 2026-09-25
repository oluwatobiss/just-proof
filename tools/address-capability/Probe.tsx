import React, { useState } from 'react';
import { createController, actionAvailability } from './controller';
import type { Candidate, Environment, Result } from './controller';
const environment: Environment = {
  now: () => Math.floor(Date.now()/1000),
  random: () => crypto.getRandomValues(new Uint8Array(32)),
  loadPrimitives: () => import('./primitives').then(module=>module.initializeLocalLedger()),
};
export function Probe({ env = environment, injected = () => window.midnight }: { env?: Environment; injected?: () => unknown }) {
  const [controller] = useState(() => createController(env));
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [result,setResult]=useState(controller.snapshot());
  const [operation,setOperation]=useState<'prepare'|'connect'|'sign'|null>(null);
  const locked=()=>controller.isBusy()||controller.snapshot().signingBlocked||controller.snapshot().overall==='PASSED';
  const run = (operation: 'prepare'|'connect'|'sign') => {
    if(locked()) return;
    // Controller invokes connect synchronously before its first await.
    const pending=controller[operation]();setOperation(operation);
    void pending.then(()=>{setResult(controller.snapshot());setOperation(null);});
  };
  return <ProbeView result={result} candidates={candidates} operation={operation}
    onPrepare={()=>run('prepare')} onConnect={()=>run('connect')} onSign={()=>run('sign')}
    onDiscover={()=>{if(locked())return;try { setCandidates(controller.discover(injected()));setResult(controller.snapshot()); } catch { controller.discover(null);setCandidates([]);setResult({...controller.snapshot(),overall:'FAILED',errorCategory:'DISCOVERY_FAILED'}); }}}
    onSelect={entry=>{if(locked())return;controller.select(entry);setResult(controller.snapshot());}} />;
}
export function ProbeView({result,candidates,operation,onPrepare,onDiscover,onSelect,onConnect,onSign}: {
  result:Result;candidates:Candidate[];operation:'prepare'|'connect'|'sign'|null;
  onPrepare:()=>void;onDiscover:()=>void;onSelect:(entry:string)=>void;onConnect:()=>void;onSign:()=>void;
}) {
  const busy=operation!==null;
  const terminal=result.signingBlocked||result.overall==='PASSED'||result.overall==='FAILED';
  const actions=actionAvailability(result,busy);
  return <main>
    <h1>Development-only address capability probe</h1>
    <p><strong>No transaction. No funds spent. No verified participant.</strong> This is not the required app-specific Preprod transaction.</p>
    <p>Tests only whether the explicitly selected wallet binds its unshielded address to a signed public capability challenge. No qualification, proof, credential or contract operation.</p>
    <p>The challenge uses a synthetic nonzero contract value (32 bytes of 0x11), never a deployed companion contract. Capability signatures cannot count as participation.</p>
    <p>Identifiers may be misleading: names, rdns, entry keys and API versions are not proof of wallet authenticity. No icons are loaded. Record the installed extension version separately.</p>
    <p>No address, nonce, challenge, key or signature is displayed or saved. Never enter a secret. Never screenshot wallet extension prompts or raw wallet payloads. The Redacted result section may be captured only after confirming it contains no address, challenge, nonce, signature, key, or raw returned object.</p>
    <button disabled={busy||terminal||result.localVerifier==='LOCAL_VERIFIER_READY'} onClick={onPrepare}>Prepare local verification runtime</button>
    <p>{result.localVerifier}. A failure requires a page reset and separately reviewed retry authorization; do not retry this wallet attempt.</p>
    <button disabled={busy||terminal} onClick={onDiscover}>Discover injected wallets</button>
    <fieldset disabled={busy||terminal}><legend>Explicit wallet selection (none selected automatically)</legend>
      {candidates.map((candidate,index)=><label key={candidate.entry}>
        <input type="radio" name="wallet" value={index} checked={result.selected?.entry===candidate.entry} onChange={()=>onSelect(candidate.entry)} />
        {candidate.name} — entry: {candidate.entry}; rdns: {candidate.rdns}; API: {candidate.apiVersion}
        {' — '}{candidate.compatibilityReason}{' — connect shape: '}{candidate.connectShape}
      </label>)}
    </fieldset>
    <button disabled={!actions.connect} onClick={onConnect}>Connect selected wallet to Preprod</button>
    <p>Signing requests public, non-transactional test data with the unshielded key. It does not submit anything. Approve only this capability test; reject any transaction or secret request.</p>
    <button disabled={!actions.sign} onClick={onSign}>I understand — sign capability test</button>
    <section aria-live="polite"><h2>Redacted result</h2>{busy ? <p>{operation==='prepare'?'Preparing local verification runtime. No wallet access.':'Awaiting selected wallet. No automatic retries.'}</p> : <pre>{JSON.stringify(result,null,2)}</pre>}</section>
    {result.overall==='PASSED' && <p>Completed. This page is terminal. A further attempt requires a fresh page and separate authorization.</p>}
    <p>A passing result does not satisfy the 70-user requirement. A finalized app-specific transaction and independent transaction verification remain necessary.</p>
  </main>;
}
