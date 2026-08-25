import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import type { MidnightWalletProvider } from "./walletProviders";
import type { NetworkConfig } from "../utils/config";
import type { JustProofCircuits } from "../utils/just-proof.types";

export type JustProofProviders = MidnightProviders<any>;

export function buildNodeProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
): JustProofProviders {
  const zkConfigProvider = new NodeZkConfigProvider<JustProofCircuits>(
    zkConfigPath,
  );

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `just-proof-${Date.now()}`,
      privateStoragePasswordProvider: () => "JustProof-Test-Password",
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proofServer,
      zkConfigProvider,
    ),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
