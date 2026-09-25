import { bech32m } from '@scure/base';
export type Encoding = 'text' | 'hex' | 'base64';
export class ProbeFailure extends Error {
  constructor(readonly category: string) { super(category); }
}
export function fail(category: string): never { throw new ProbeFailure(category); }
export function hex(b: Uint8Array): string { return Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); }
export function equal(a: Uint8Array, b: Uint8Array): boolean { return a.length === b.length && a.every((x, i) => x === b[i]); }
export function frame(data: Uint8Array): Uint8Array {
  const prefix = new TextEncoder().encode(`midnight_signed_message:${data.length}:`);
  const result = new Uint8Array(prefix.length + data.length); result.set(prefix); result.set(data, prefix.length); return result;
}
export function decodeCanonical(value: unknown, textAllowed: boolean, length?: number): { bytes: Uint8Array; encoding: Encoding } {
  if (typeof value !== 'string' || value.length === 0 || value.length > 16384) return fail('ENCODING_INVALID');
  const candidates: { bytes: Uint8Array; encoding: Encoding }[] = [];
  const add = (bytes: Uint8Array, encoding: Encoding) => { if (length === undefined || bytes.length === length) candidates.push({ bytes, encoding }); };
  if (textAllowed) {
    const bytes = new TextEncoder().encode(value);
    if (new TextDecoder('utf-8', { fatal: true }).decode(bytes) === value) add(bytes, 'text');
  }
  if (/^(?:[0-9a-f]{2})+$/.test(value)) add(Uint8Array.from(value.match(/../g) ?? [], x => parseInt(x, 16)), 'hex');
  if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    try { const binary = atob(value); if (btoa(binary) === value) add(Uint8Array.from(binary, x => x.charCodeAt(0)), 'base64'); } catch { /* not canonical */ }
  }
  if (candidates.length !== 1) return fail(candidates.length > 1 ? 'ENCODING_AMBIGUOUS' : 'ENCODING_INVALID');
  return candidates[0];
}
export function addressPayload(value: unknown): Uint8Array {
  try {
    if (typeof value !== 'string' || value.length > 160 || value !== value.toLowerCase()) return fail('ADDRESS_INVALID');
    const decoded = bech32m.decodeToBytes(value);
    if (decoded.prefix !== 'mn_addr_preprod' || decoded.bytes.length !== 32
      || bech32m.encode(decoded.prefix, bech32m.toWords(decoded.bytes), false) !== value) return fail('ADDRESS_INVALID');
    return decoded.bytes;
  } catch { return fail('ADDRESS_INVALID'); }
}
export function canonicalAddress(value: string): string { addressPayload(value); return value; }
export interface Primitives {
  verifySignature(key: string, data: Uint8Array, signature: string): boolean;
  addressFromKey(key: string): string;
}
export function verifyReturned(value: unknown, expected: Uint8Array, address: string, primitives: Primitives,
  progress: (stage: 'signedDataMatched' | 'signatureVerified' | 'derivedAddressMatched') => void) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || Reflect.ownKeys(value).some(key => typeof key !== 'string')
    || Reflect.ownKeys(value).map(key => typeof key === 'string' ? key : '').sort().join(',') !== 'data,signature,verifyingKey') return fail('RETURN_SHAPE_INVALID');
  const fields = Object.getOwnPropertyDescriptors(value);
  for (const key of ['data', 'signature', 'verifyingKey']) if (!('value' in fields[key])) return fail('RETURN_SHAPE_INVALID');
  const data = decodeCanonical(fields.data.value, true, expected.length);
  if (!equal(data.bytes, expected)) return fail('SIGNED_DATA_MISMATCH');
  progress('signedDataMatched');
  const signature = decodeCanonical(fields.signature.value, false, 64);
  const key = decodeCanonical(fields.verifyingKey.value, false, 32);
  try { if (!primitives.verifySignature(hex(key.bytes), expected, hex(signature.bytes))) return fail('SIGNATURE_INVALID'); }
  catch { return fail('SIGNATURE_INVALID'); }
  progress('signatureVerified');
  let derived: string;
  try { derived = primitives.addressFromKey(hex(key.bytes)); } catch { return fail('ADDRESS_DERIVATION_FAILED'); }
  if (derived !== hex(addressPayload(address))) return fail('ADDRESS_MISMATCH');
  progress('derivedAddressMatched');
  return { data: data.encoding, signature: signature.encoding, verifyingKey: key.encoding };
}
