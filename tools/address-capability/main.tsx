import React from 'react';
import { createRoot } from 'react-dom/client';
import { Probe } from './Probe';
import { StartupBoundary } from './StartupBoundary';
import { showStartupFailure } from './bootstrap';
/** Called only by the dependency-free bootstrap; no mount or wallet activity on import. */
export function mountProbe(target: HTMLElement): void {
  const root=createRoot(target,{
    onCaughtError:()=>{},
    onUncaughtError:()=>showStartupFailure(target),
    onRecoverableError:()=>{},
  });
  root.render(<React.StrictMode><StartupBoundary><Probe /></StartupBoundary></React.StrictMode>);
}
