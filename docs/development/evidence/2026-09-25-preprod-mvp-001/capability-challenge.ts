/** Pure proposal; no wallet, provider, state store, logging, or I/O. */
export const CAPABILITY_DOMAIN = 'JUSTPROOF:ADDRESS-CAPABILITY-TEST';
export const PARTICIPATION_DOMAIN = 'JUSTPROOF:PARTICIPATION';
export const CAMPAIGN = '2026-09-25-preprod-mvp-001';
export const MAX_VALIDITY_SECONDS = 300;
export interface Challenge {
  domain: typeof CAPABILITY_DOMAIN | typeof PARTICIPATION_DOMAIN;
  schema: '1';
  network: 'preprod';
  campaign: typeof CAMPAIGN;
  contract: string;
  address: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}
export type CanonicalAddress = (value: string) => string;
const fail = (): never => { throw new Error('CHALLENGE_INVALID'); };
const hex32 = (s: string) => /^[0-9a-f]{64}$/.test(s) && s !== '0'.repeat(64);
/** Fixed labels and order, ASCII subset of UTF-8, LF separators and terminal LF. */
export function encodeChallenge(c: Challenge, canonicalAddress: CanonicalAddress): Uint8Array {
  try {
    if (![CAPABILITY_DOMAIN, PARTICIPATION_DOMAIN].includes(c.domain)
        || c.schema !== '1' || c.network !== 'preprod' || c.campaign !== CAMPAIGN
        || !hex32(c.contract) || !hex32(c.nonce)
        || !/^mn_addr_preprod1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(c.address)
        || canonicalAddress(c.address) !== c.address
        || !Number.isSafeInteger(c.issuedAt) || c.issuedAt < 0
        || !Number.isSafeInteger(c.expiresAt) || c.expiresAt <= c.issuedAt
        || c.expiresAt - c.issuedAt > MAX_VALIDITY_SECONDS) return fail();
    return new TextEncoder().encode([
      `domain=${c.domain}`, 'schema=1', 'network=preprod', `campaign=${c.campaign}`,
      `contract=${c.contract}`, `address=${c.address}`, `nonce=${c.nonce}`,
      `issuedAt=${c.issuedAt}`, `expiresAt=${c.expiresAt}`,
      'commitmentInputs=campaign,contract,address,nonce', '',
    ].join('\n'));
  } catch { return fail(); }
}
export function validAt(c: Challenge, nowSeconds: number): boolean {
  return Number.isSafeInteger(nowSeconds) && nowSeconds >= c.issuedAt && nowSeconds < c.expiresAt;
}
export function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}
export function strictHex(text: string, length?: number): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/.test(text) || (length !== undefined && text.length !== length * 2)) {
    throw new Error('ENCODING_INVALID');
  }
  return Uint8Array.from(text.match(/../g) ?? [], n => Number.parseInt(n, 16));
}
/** Candidate SHA-256 preimage only. Hashing is performed by the caller, never on import. */
export function receiptPreimage(c: Challenge, canonicalAddress: CanonicalAddress): Uint8Array {
  encodeChallenge(c, canonicalAddress);
  return new TextEncoder().encode([
    c.domain === CAPABILITY_DOMAIN ? 'JUSTPROOF:CAPABILITY-RECEIPT-TEST:1' : 'JUSTPROOF:PARTICIPATION-RECEIPT:1',
    c.campaign, c.contract, c.address, c.nonce, '',
  ].join('\n'));
}
