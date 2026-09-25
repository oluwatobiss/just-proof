import { it,expect,vi,afterEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { Probe } from '../../tools/address-capability/Probe';
import { bootstrap,STARTUP_FAILURE } from '../../tools/address-capability/bootstrap';
import { StartupBoundary,StartupFailure } from '../../tools/address-capability/StartupBoundary';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('renders disclosures and controls with no extension, storage, randomness or network',()=>{
  const forbidden=vi.fn(()=>{throw new Error('FORBIDDEN');});vi.stubGlobal('window',{});
  vi.stubGlobal('fetch',forbidden);vi.stubGlobal('WebSocket',forbidden);vi.stubGlobal('crypto',{getRandomValues:forbidden});
  vi.stubGlobal('localStorage',{setItem:forbidden});vi.stubGlobal('sessionStorage',{setItem:forbidden});vi.stubGlobal('indexedDB',{open:forbidden});
  const html=renderToStaticMarkup(createElement(Probe));
  for(const text of ['Development-only address capability probe','No transaction. No funds spent. No verified participant.','Discover injected wallets','Redacted result'])expect(html).toContain(text);
  expect(forbidden).not.toHaveBeenCalled();
});
it('retains a visible HTML fallback even if the entry module cannot load',()=>{
  const html=readFileSync('tools/address-capability/index.html','utf8');
  expect(html).toContain('module startup failed');expect(html).toMatch(/<div id="root"[^>]*><main>/);expect(html).toContain('src="/entry.ts"');
});
it.each(['module','mount'])('converts %s failure to a constant visible diagnostic',async()=>{
  const root={textContent:'initial fallback'};const log=vi.spyOn(console,'error');
  await bootstrap(root,async()=>{throw new Error('PRIVATE_FAILURE_CONTENT');});
  expect(root.textContent).toBe(STARTUP_FAILURE);expect(root.textContent).not.toContain('PRIVATE_FAILURE_CONTENT');expect(log).not.toHaveBeenCalled();
});
it('allows a successful mount to replace the fallback',async()=>{
  const root={textContent:'initial fallback'};await bootstrap(root,async()=>{root.textContent='rendered probe';});expect(root.textContent).toBe('rendered probe');
});
it('render boundary exposes only a constant diagnostic',()=>{
  expect(StartupBoundary.getDerivedStateFromError()).toEqual({failed:true});
  const boundary=new StartupBoundary({children:createElement('p',null,'normal')});boundary.state={failed:true};
  expect(renderToStaticMarkup(boundary.render())).toBe(renderToStaticMarkup(createElement(StartupFailure)));
  expect(renderToStaticMarkup(boundary.render())).toContain(STARTUP_FAILURE);
});
it('mount module import does not mount, discover wallets or initialize ledger primitives',async()=>{
  const access=vi.fn(()=>{throw new Error('NO_ACCESS');});vi.stubGlobal('document',{getElementById:access});vi.stubGlobal('window',Object.defineProperty({},'midnight',{get:access}));
  vi.resetModules();await import('../../tools/address-capability/main');expect(access).not.toHaveBeenCalled();
  const source=readFileSync('tools/address-capability/main.tsx','utf8');expect(source).not.toMatch(/ledger-v8|primitives|window\.midnight/);
});
it('optimizes the exact development JSX runtime and preserves CSP',()=>{
  const source=readFileSync('tools/address-capability/vite.config.ts','utf8');expect(source).toContain("'react/jsx-dev-runtime'");expect(source).toContain("connect-src 'none'");expect(source).toContain("host:'127.0.0.1'");
});
