import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { addressFromKey, verifySignature } from '@midnight-ntwrk/ledger-v8';
import { MidnightBech32m, UnshieldedAddress, mainnet } from '@midnight-ntwrk/wallet-sdk-address-format';
import { createKeystore } from '../../node_modules/@midnight-ntwrk/wallet-sdk-unshielded-wallet/dist/KeyStore.js';
import { CAPABILITY_DOMAIN, PARTICIPATION_DOMAIN, CAMPAIGN, encodeChallenge, validAt, bytesHex, strictHex, receiptPreimage } from '../../docs/development/evidence/2026-09-25-preprod-mvp-001/capability-challenge';
import type { Challenge } from '../../docs/development/evidence/2026-09-25-preprod-mvp-001/capability-challenge';

// Public deterministic OFFLINE fixture. Never a funded key or participation identity.
const key = createKeystore(Uint8Array.from({ length: 32 }, (_, i) => i + 1), 'preprod');
const other = createKeystore(Uint8Array.from({ length: 32 }, (_, i) => i + 33), 'preprod');
function canonical(s: string): string {
  const decoded = MidnightBech32m.parse(s).decode(UnshieldedAddress, 'preprod');
  return UnshieldedAddress.codec.encode('preprod', decoded).asString();
}
const challenge: Challenge = {
  domain: CAPABILITY_DOMAIN, schema: '1', network: 'preprod', campaign: CAMPAIGN,
  contract: '11'.repeat(32), address: key.getBech32Address().asString(), nonce: '22'.repeat(32),
  issuedAt: 1_800_000_000, expiresAt: 1_800_000_300,
};
const bytes = () => encodeChallenge(challenge, canonical);
const signature = () => key.signData(bytes());
const mutated = (patch: Partial<Challenge>): Challenge => {
  const result = { ...challenge, ...patch };
  expect(result).not.toEqual(challenge);
  return result;
};
// Deliberately synthetic framing; this is NOT a 1AM prefix or a connector compatibility test.
const syntheticFrame = (b: Uint8Array): Uint8Array => new TextEncoder().encode(`OFFLINE-FIXTURE-ONLY\n${bytesHex(b)}\n`);

describe('offline signature/address primitives (not wallet qualification)', () => {
  it('verifies signature, derives payload and round-trips the Preprod address', () => {
    expect(verifySignature(key.getPublicKey(), bytes(), signature())).toBe(true);
    const derived = addressFromKey(key.getPublicKey());
    const decoded = MidnightBech32m.parse(challenge.address).decode(UnshieldedAddress, 'preprod');
    expect(decoded.hexString).toBe(derived);
    expect(canonical(challenge.address)).toBe(challenge.address);
    expect(UnshieldedAddress.codec.encode('preprod', new UnshieldedAddress(Buffer.from(derived, 'hex'))).asString()).toBe(challenge.address);
  });
  it('encodes exact field order independently of object insertion order', () => {
    const reversed: Challenge = { expiresAt: challenge.expiresAt, issuedAt: challenge.issuedAt, nonce: challenge.nonce, address: challenge.address, contract: challenge.contract, campaign: CAMPAIGN, network: 'preprod', schema: '1', domain: CAPABILITY_DOMAIN };
    expect(encodeChallenge(reversed, canonical)).toEqual(bytes());
    expect(new TextDecoder().decode(bytes())).toBe(`domain=${CAPABILITY_DOMAIN}\nschema=1\nnetwork=preprod\ncampaign=${CAMPAIGN}\ncontract=${challenge.contract}\naddress=${challenge.address}\nnonce=${challenge.nonce}\nissuedAt=1800000000\nexpiresAt=1800000300\ncommitmentInputs=campaign,contract,address,nonce\n`);
  });
  it.each(['campaign', 'network', 'contract', 'address', 'nonce', 'expiresAt'] as const)('rejects signed-byte mutation of %s', field => {
    const text = new TextDecoder().decode(bytes());
    const label = `${field === 'expiresAt' ? 'expiresAt' : field}=`;
    const changed = text.split('\n').map(line => line.startsWith(label) ? `${line}X` : line).join('\n');
    expect(changed).not.toBe(text);
    expect(verifySignature(key.getPublicKey(), new TextEncoder().encode(changed), signature())).toBe(false);
  });
  it.each([{ contract: '33'.repeat(32) }, { address: other.getBech32Address().asString() }, { nonce: '44'.repeat(32) }, { expiresAt: challenge.expiresAt - 1 }])('rejects canonical valid-field replacement', patch => {
    expect(verifySignature(key.getPublicKey(), encodeChallenge(mutated(patch), canonical), signature())).toBe(false);
  });
  it('separates capability and participation domains', () => {
    const participation = mutated({ domain: PARTICIPATION_DOMAIN });
    expect(verifySignature(key.getPublicKey(), encodeChallenge(participation, canonical), signature())).toBe(false);
    const hash = (c: Challenge) => createHash('sha256').update(receiptPreimage(c, canonical)).digest('hex');
    expect(hash(participation)).not.toBe(hash(challenge));
  });
  it('checks expiration, future issuance and bounded validity', () => {
    expect(validAt(challenge, challenge.issuedAt)).toBe(true);
    expect(validAt(challenge, challenge.expiresAt)).toBe(false);
    expect(validAt(challenge, challenge.issuedAt - 1)).toBe(false);
    expect(() => encodeChallenge(mutated({ expiresAt: challenge.issuedAt + 301 }), canonical)).toThrow('CHALLENGE_INVALID');
  });
  it('rejects wrong verifying key and malformed signature', () => {
    expect(verifySignature(other.getPublicKey(), bytes(), signature())).toBe(false);
    let rejected = false;
    try { rejected = !verifySignature(key.getPublicKey(), bytes(), '00'.repeat(64)); } catch { rejected = true; }
    expect(rejected).toBe(true);
    expect(addressFromKey(other.getPublicKey())).not.toBe(addressFromKey(key.getPublicKey()));
  });
  it('rejects Mainnet address as Preprod even with the same payload', () => {
    const address = UnshieldedAddress.codec.encode(mainnet, new UnshieldedAddress(Buffer.from(key.getAddress(), 'hex'))).asString();
    expect(() => canonical(address)).toThrow();
    expect(() => encodeChallenge(mutated({ address }), canonical)).toThrow('CHALLENGE_INVALID');
  });
  it('rejects zero, whitespace, mixed case and noncanonical hex', () => {
    for (const nonce of ['0'.repeat(64), 'AA'.repeat(32), ` ${challenge.nonce}`, '1e3']) {
      expect(() => encodeChallenge(mutated({ nonce }), canonical)).toThrow('CHALLENGE_INVALID');
    }
    for (const value of ['aa ', 'AA', '0xaa', 'a', '']) expect(() => strictHex(value)).toThrow('ENCODING_INVALID');
    expect(strictHex(bytesHex(bytes()))).toEqual(bytes());
  });
  it('requires exact framed bytes and does not verify a challenge as a framed message', () => {
    const framed = syntheticFrame(bytes());
    const sig = key.signData(framed);
    expect(verifySignature(key.getPublicKey(), framed, sig)).toBe(true);
    expect(verifySignature(key.getPublicKey(), bytes(), sig)).toBe(false);
    const changed = new Uint8Array(framed); changed[0] ^= 1;
    expect(changed).not.toEqual(framed);
    expect(verifySignature(key.getPublicKey(), changed, sig)).toBe(false);
  });
  it('imports the pure proposal without wallet, network or console activity', async () => {
    const connect = vi.fn(); const signData = vi.fn(); const fetch = vi.fn();
    vi.stubGlobal('window', { midnight: { candidate: { connect, signData } } });
    vi.stubGlobal('fetch', fetch);
    const log = vi.spyOn(console, 'log'); const error = vi.spyOn(console, 'error');
    try {
      vi.resetModules();
      await import('../../docs/development/evidence/2026-09-25-preprod-mvp-001/capability-challenge');
      expect(connect).not.toHaveBeenCalled(); expect(signData).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); log.mockRestore(); error.mockRestore(); }
  });
  it('shared wallet helper contains only a constant build log', () => {
    const source = readFileSync('providers/walletProviders.ts', 'utf8');
    expect(source).toContain('logger.info("Wallet built")');
    expect(source).not.toContain('seeds.masterSeed.slice');
    expect(source).not.toContain('master seed:');
  });
});
