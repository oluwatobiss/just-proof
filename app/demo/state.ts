export type DemoState = { mode: 'simulation'; stage: 'start' | 'issuer' | 'credential' | 'presented' | 'revoked'; outcome: 'none' | 'simulated-qualified' | 'simulated-rejected' };
export type DemoAction = 'register' | 'issue' | 'present' | 'revoke' | 'reset';
export const initialDemo: DemoState = { mode: 'simulation', stage: 'start', outcome: 'none' };
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action === 'reset') return { ...initialDemo };
  if (action === 'register' && state.stage === 'start') return { ...state, stage: 'issuer' };
  if (action === 'issue' && state.stage === 'issuer') return { ...state, stage: 'credential' };
  if (action === 'present' && ['credential', 'presented', 'revoked'].includes(state.stage)) return { ...state, stage: state.stage === 'revoked' ? 'revoked' : 'presented', outcome: state.stage === 'revoked' ? 'simulated-rejected' : 'simulated-qualified' };
  if (action === 'revoke' && state.stage === 'presented') return { ...state, stage: 'revoked', outcome: 'simulated-rejected' };
  return state;
}
export type LiveStatus = { mode: 'configuration-only'; status: 'unavailable' | 'configured-unverified'; address: string | null };
export function liveStatus(network?: string, address?: string): LiveStatus {
  const valid = network === 'preprod' && !!address && /^[a-fA-F0-9]{64}$/.test(address);
  return { mode: 'configuration-only', status: valid ? 'configured-unverified' : 'unavailable', address: valid ? address : null };
}
export function feedbackUrl(value?: string): string | null {
  try { const url = new URL(value ?? ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export const feedbackPrompts = ['Ease of understanding', 'Privacy clarity', 'Confusing steps', 'Most valuable capability', 'Missing features', 'General comments'] as const;
// Only fixed-choice answers are exported: no free text, identity, browser, or lifecycle data.
export function feedbackRecord(answers: Record<string, string>) {
  const allowed = ['Clear', 'Needs explanation', 'Issuer registration', 'Credential issuance', 'Private presentation', 'Revocation', 'Live integration', 'More examples', 'None', 'Useful', 'Not sure'];
  return { version: 1, mode: 'simulation', answers: Object.fromEntries(feedbackPrompts.map(key => [key, allowed.includes(answers[key]) ? answers[key] : 'Not sure'])) };
}

export function resetMessage(externalLink: string | null): string {
  return externalLink ? "Demonstration reset." : "Demo and feedback reset.";
}
