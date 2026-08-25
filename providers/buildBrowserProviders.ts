import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type {
  MidnightProviders,
  PrivateStateProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { inMemoryPrivateStateProvider } from "./inMemoryPrivateStateProvider";
import { getConfig, PRIVATE_STATE_ID } from "../utils/config";
import type {
  CreatorIdentity,
  JustProofCircuits,
} from "../utils/just-proof.types";
import {
  createJustProofPrivateState,
  type JustProofPrivateState,
} from "../utils/witnesses";

export async function buildBrowserProviders(
  wallet?: ConnectedAPI,
  creatorId?: CreatorIdentity | null,
): Promise<{
  providers: MidnightProviders<any>;
  stateProvider?: PrivateStateProvider<string, JustProofPrivateState>;
}> {
  const createPrivateState = (creatorId: CreatorIdentity) =>
    createJustProofPrivateState(new Uint8Array(creatorId.secretKey));

  const privateStateProvider = inMemoryPrivateStateProvider<
    string,
    JustProofPrivateState
  >();

  if (creatorId) {
    privateStateProvider.setContractAddress(creatorId.contractAddress);
    privateStateProvider.set(PRIVATE_STATE_ID, createPrivateState(creatorId));
  }

  // Dummy wallet for read-only
  const dummyWallet: any = {
    balanceTx: async () => {
      throw new Error("Read-only");
    },
    submitTx: async () => {
      throw new Error("Read-only");
    },
    getCoinPublicKey: () =>
      "0000000000000000000000000000000000000000000000000000000000000000",
    getEncryptionPublicKey: () =>
      "0000000000000000000000000000000000000000000000000000000000000000",
  };
  const walletConfig = await wallet?.getConfiguration();
  // @ts-ignore
  const basePath = import.meta.env?.DEV ? "/contracts/managed/just-proof" : "";
  const zkConfigProvider = new FetchZkConfigProvider<JustProofCircuits>(
    window.location.origin + basePath,
    fetch.bind(window),
  );
  const config = getConfig();

  setNetworkId(config.networkId);
  return {
    providers: {
      privateStateProvider: privateStateProvider as any,
      publicDataProvider: indexerPublicDataProvider(
        walletConfig ? walletConfig.indexerUri : config.indexer,
        walletConfig ? walletConfig.indexerWsUri : config.indexerWS,
      ),
      zkConfigProvider: zkConfigProvider as any,
      proofProvider: httpClientProofProvider(
        config.proofServer,
        zkConfigProvider as any,
      ),
      walletProvider: wallet ? (wallet as any) : (dummyWallet as any),
      midnightProvider: wallet ? (wallet as any) : (dummyWallet as any),
    },
    ...(privateStateProvider && { stateProvider: privateStateProvider }),
  };
}
