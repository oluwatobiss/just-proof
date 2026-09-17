/** Inert error boundary only. Does not construct or start any wallet.
 * It cannot make an operation that internally logs safe; such operations remain excluded.
 */
export type WalletStage = 'construct' | 'synchronize' | 'fund' | 'dust' | 'shutdown';
export type PublicWalletResult = Readonly<{stage: WalletStage; status: 'COMPLETED' | 'FAILED'}>;
export async function sanitizedWalletOperation(
  stage: WalletStage,
  operation: () => Promise<void>,
): Promise<PublicWalletResult> {
  try { await operation(); return Object.freeze({stage, status: 'COMPLETED'}); }
  catch { return Object.freeze({stage, status: 'FAILED'}); }
}
