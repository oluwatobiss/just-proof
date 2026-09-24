import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Demo } from '../../app/demo/Demo';
import { demoReducer, initialDemo, liveStatus, feedbackUrl, feedbackRecord, resetMessage } from '../../app/demo/state';
import type { DemoAction } from '../../app/demo/state';
vi.mock('../../app/demo/state', async importOriginal => {
  const original = await importOriginal<typeof import('../../app/demo/state')>();
  return { ...original, feedbackRecord: vi.fn(original.feedbackRecord) };
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const run = (...actions: DemoAction[]) => actions.reduce(demoReducer, initialDemo);
describe('offline demo', () => {
  it('walks the full lifecycle and rejects a revoked presentation', () => {
    expect(run('register').stage).toBe('issuer');
    expect(run('register', 'issue').stage).toBe('credential');
    expect(run('register', 'issue', 'present').outcome).toBe('simulated-qualified');
    expect(run('register', 'issue', 'present', 'revoke', 'present').outcome).toBe('simulated-rejected');
  });
  it.each(['issue', 'present', 'revoke'] as const)('rejects out-of-order %s', action => expect(run(action)).toEqual(initialDemo));
  it('resets all lifecycle state', () => expect(run('register', 'issue', 'present', 'revoke', 'reset')).toEqual(initialDemo));
  it('does not reuse a revoked credential without reset', () => expect(run('register', 'issue', 'present', 'revoke', 'issue').stage).toBe('revoked'));
  it('keeps configuration distinct from simulated success', () => {
    expect(liveStatus().status).toBe('unavailable');
    expect(liveStatus('preview', 'a'.repeat(64)).status).toBe('unavailable');
    expect(liveStatus('preprod', 'a'.repeat(64))).toMatchObject({ mode: 'configuration-only', status: 'configured-unverified' });
    expect(run('register', 'issue', 'present').mode).toBe('simulation');
  });
  it('rejects malformed addresses', () => expect(liveStatus('preprod', '<script>').address).toBeNull());
  it('exports only fixed-choice feedback without arbitrary data', () => {
    const text = JSON.stringify(feedbackRecord({ secret: 'SEED', 'General comments': 'PRIVATE', 'Privacy clarity': 'Clear' }));
    expect(text).not.toMatch(/SEED|PRIVATE|secret/); expect(text).toContain('Clear');
  });
  it('allows only explicit secure feedback links', () => {
    expect(feedbackUrl()).toBeNull(); expect(feedbackUrl('javascript:alert(1)')).toBeNull();
    expect(feedbackUrl('https://user:secret@example.com')).toBeNull(); expect(feedbackUrl('https://example.com/form')).toBe('https://example.com/form');
  });
  it('renders disclosures, disabled live controls, feedback, and all four circuits', () => {
    const html = renderToStaticMarkup(createElement(Demo));
    for (const text of ['Interactive demonstration', 'No cryptographic proof was generated', 'No cryptographic verification occurred', 'No ledger transaction was submitted', 'registerIssuerV2', 'registerCredentialV2', 'proveQualificationV2', 'revokeCredentialV2', 'Download feedback', 'Reset demonstration']) expect(html).toContain(text);
    expect(html).toMatch(/disabled=""[^>]*>Generate live proof/);
    expect(html).toMatch(/disabled=""[^>]*>Submit transaction/);
    expect(html).toContain('Unavailable — no valid Preprod configuration provided');
  });
});

describe('exclusive feedback modes', () => {
  it('uses only the safe external actions and never builds or requests feedback on render', () => {
    vi.stubEnv('VITE_FEEDBACK_URL', 'https://example.com/feedback');
    const fetch = vi.fn(() => { throw new Error('Network forbidden'); }); vi.stubGlobal('fetch', fetch);
    const html = renderToStaticMarkup(createElement(Demo));
    expect(html.match(/href="https:\/\/example.com\/feedback" target="_blank" rel="noopener noreferrer"/g)).toHaveLength(2);
    expect(html).toContain('own privacy policy');
    for (const phrase of ['public Midnight Preprod wallet address', 'linkable information', 'consent', 'seed or recovery phrase', 'spending or viewing key', 'does not prove an on-chain MVP interaction']) expect(html).toContain(phrase);
    expect(html).not.toMatch(/<select|Copy feedback|Download feedback|<form|<link|<iframe/);
    expect(feedbackRecord).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    expect(html).toContain('No cryptographic proof was generated');
    expect(html).toMatch(/disabled=""[^>]*>Submit transaction/);
  });
  it.each(['', 'not-a-url', 'https://user:secret@example.com', 'http://example.com', 'javascript:alert(1)'])('falls back without exposing rejected URL %s', value => {
    vi.stubEnv('VITE_FEEDBACK_URL', value);
    const html = renderToStaticMarkup(createElement(Demo));
    expect(html).toContain('href="#demo-feedback"'); expect(html).toContain('<select');
    expect(html).toContain('Copy feedback'); expect(html).toContain('Download feedback');
    expect(html).toContain('mandatory Google Sheet'); expect(html).toContain('Do not enter wallet addresses');
    expect(html).not.toContain('Open feedback and participation form');
    if (value) expect(html).not.toContain(value);
    expect(feedbackRecord).not.toHaveBeenCalled();
  });
  it.each([null, 'https://example.com'])('resets lifecycle with mode-appropriate messaging: %s', link => {
    expect(run('register', 'issue', 'present', 'revoke', 'reset')).toEqual(initialDemo);
    expect(resetMessage(link)).toBe(link ? 'Demonstration reset.' : 'Demo and feedback reset.');
  });
});
