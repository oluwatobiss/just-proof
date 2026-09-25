// This lightweight loader is itself imported only after explicit preparation.
// No ledger evaluation, wallet, provider or service operation on loader import.
import { ProbeFailure } from './verification';
export async function initializeLocalLedger(): Promise<unknown> {
  try {return await import('@midnight-ntwrk/ledger-v8');}
  catch {throw new ProbeFailure('LOCAL_LEDGER_INITIALIZATION_FAILED');}
}
