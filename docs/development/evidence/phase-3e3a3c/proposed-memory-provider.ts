/** Static library proposal. Type-only imports; no executable entry point or import effects.
 * Creation requires an explicit capability flag from a future authorized harness.
 * No persistence/export. JS garbage collection cannot guarantee zeroization.
 */
import type { PrivateStateId, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export function createRestrictedMemoryProvider<PSI extends PrivateStateId, PS>(
  capability: '--separately-authorized-memory-provider',
): { provider: PrivateStateProvider<PSI, PS>; dispose: () => void } {
  if (capability !== '--separately-authorized-memory-provider') throw new Error('CAPABILITY_REQUIRED');
  const states = new Map<ContractAddress, Map<PSI, PS>>();
  const keys = new Map<ContractAddress, SigningKey>();
  let address: ContractAddress | null = null;
  let disposed = false;
  const active = (): void => { if (disposed) throw new Error('PROVIDER_UNAVAILABLE'); };
  const scopedAddress = (): ContractAddress => {
    active();
    if (address === null) throw new Error('SCOPE_REQUIRED');
    return address;
  };
  const copy = <T>(value: T): T => {
    try { return structuredClone(value); }
    catch { throw new Error('VALUE_UNSUPPORTED'); }
  };
  const prohibited = async (): Promise<never> => { throw new Error('CAPABILITY_PROHIBITED'); };
  const provider: PrivateStateProvider<PSI, PS> = {
    setContractAddress(value) { active(); address = value; },
    async set(id, value) {
      const scope = scopedAddress();
      const detached = copy(value);
      let map = states.get(scope);
      if (!map) { map = new Map(); states.set(scope, map); }
      map.set(id, detached);
    },
    async get(id) {
      const map = states.get(scopedAddress());
      return map?.has(id) ? copy(map.get(id)!) : null;
    },
    async remove(id) { states.get(scopedAddress())?.delete(id); },
    async clear() { states.delete(scopedAddress()); },
    async setSigningKey(scope, key) { active(); keys.set(scope, copy(key)); },
    async getSigningKey(scope) { active(); return keys.has(scope) ? copy(keys.get(scope)!) : null; },
    async removeSigningKey(scope) { active(); keys.delete(scope); },
    async clearSigningKeys() { active(); keys.clear(); },
    exportPrivateStates: prohibited,
    importPrivateStates: prohibited,
    exportSigningKeys: prohibited,
    importSigningKeys: prohibited,
  };
  return Object.freeze({ provider: Object.freeze(provider), dispose() {
    states.clear(); keys.clear(); address = null; disposed = true;
  } });
}
