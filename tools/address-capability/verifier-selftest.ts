import type { Primitives } from './verification';
import { ProbeFailure } from './verification';
import { PUBLIC_VERIFIER_VECTOR as vector } from './public-verifier-vector';
export type LocalVerifierStatus = 'NOT_PREPARED'|'LOCAL_VERIFIER_READY'|'LOCAL_VERIFIER_IMPORT_FAILED'|'LOCAL_LEDGER_INITIALIZATION_FAILED'|'LOCAL_VERIFIER_INTERFACE_INVALID'|'LOCAL_SIGNATURE_SELFTEST_FAILED'|'LOCAL_ADDRESS_SELFTEST_FAILED';
/** Public deterministic inputs only; never wallet data. No work on import. */
export function validateLocalVerifier(loaded: unknown): Primitives {
  if(typeof loaded!=='object'||loaded===null)throw new ProbeFailure('LOCAL_VERIFIER_INTERFACE_INVALID');
  const fields=Object.getOwnPropertyDescriptors(loaded);
  if(typeof fields.verifySignature?.value!=='function'||typeof fields.addressFromKey?.value!=='function')throw new ProbeFailure('LOCAL_VERIFIER_INTERFACE_INVALID');
  const verifier=loaded as Primitives;
  const bytes=new TextEncoder().encode(vector.message);
  const changed=bytes.slice();changed[0]^=1;
  try {
    if(verifier.verifySignature(vector.verifyingKey,bytes,vector.signature)!==true)throw new Error();
    let rejected=false;
    try {rejected=verifier.verifySignature(vector.verifyingKey,changed,vector.signature)===false;}catch{rejected=true;}
    if(!rejected)throw new Error();
    const signature=(vector.signature[0]==='0'?'1':'0')+vector.signature.slice(1);
    rejected=false;
    try{rejected=verifier.verifySignature(vector.verifyingKey,bytes,signature)===false;}catch{rejected=true;}
    if(!rejected)throw new Error();
  }catch{throw new ProbeFailure('LOCAL_SIGNATURE_SELFTEST_FAILED');}
  try{if(verifier.addressFromKey(vector.verifyingKey)!==vector.expectedAddressPayload)throw new Error();}
  catch{throw new ProbeFailure('LOCAL_ADDRESS_SELFTEST_FAILED');}
  return verifier;
}
export function preparationCategory(error:unknown): LocalVerifierStatus {
  if(error instanceof ProbeFailure && ['LOCAL_LEDGER_INITIALIZATION_FAILED','LOCAL_VERIFIER_INTERFACE_INVALID','LOCAL_SIGNATURE_SELFTEST_FAILED','LOCAL_ADDRESS_SELFTEST_FAILED'].includes(error.category))return error.category as LocalVerifierStatus;
  return 'LOCAL_VERIFIER_INTERFACE_INVALID';
}
