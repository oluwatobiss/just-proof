export const STARTUP_FAILURE = 'Probe could not render. Close or reload this page. No wallet action occurs automatically.';
export interface MountTarget { textContent: string | null }
export function showStartupFailure(target: MountTarget): void {
  target.textContent = STARTUP_FAILURE;
}
/** Dependency-free startup shell: catch module-load and synchronous mounting failures. */
export async function bootstrap(target: MountTarget, mount: () => Promise<void>): Promise<void> {
  try { await mount(); } catch { showStartupFailure(target); }
}
