import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

// Polyfill window for the node test environment
global.window = {
  location: { origin: "http://localhost:5173" },
  navigator: { userAgent: "node.js" },
} as any;
global.fetch = vi.fn();

import { buildBrowserProviders, DappConnectorWalletProvider } from "../providers/buildBrowserProviders";
import { getConfig } from "../utils/config";

// Mock the getConfig so we can manipulate the configured proofServer
vi.mock("../utils/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/config")>();
  return {
    ...actual,
    getConfig: vi.fn(() => ({
      ...actual.LOCAL_CONFIG,
      proofServer: "http://127.0.0.1:6300",
    })),
  };
});

const mockHttpClientProofProvider = vi.fn();
vi.mock("@midnight-ntwrk/midnight-js-http-client-proof-provider", () => {
  return {
    httpClientProofProvider: (...args: any[]) => mockHttpClientProofProvider(...args)
  };
});

describe("Browser Providers Privacy Invariants", () => {
  let mockConnectedAPI: ConnectedAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectedAPI = {
      getProvingProvider: vi.fn(() => ({})),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({ tx: "00" }),
      getConfiguration: vi.fn().mockResolvedValue({ networkId: "undeployed", indexerUri: "http://127.0.0.1:8088/api/v4/graphql", indexerWsUri: "ws://127.0.0.1:8088/api/v4/graphql/ws" }),
      submitTransaction: vi.fn(),
    } as unknown as ConnectedAPI;
  });

  it("never calls getProvingProvider on the wallet API", async () => {
    await buildBrowserProviders(mockConnectedAPI);
    expect(mockConnectedAPI.getProvingProvider).not.toHaveBeenCalled();
  });

  it("httpClientProofProvider receives the configured local endpoint exactly", async () => {
    await buildBrowserProviders(mockConnectedAPI);
    expect(mockHttpClientProofProvider).toHaveBeenCalledWith(
      "http://127.0.0.1:6300",
      expect.any(Object)
    );
  });

  it("ignores wallet proverServerUri configuration and always uses loopback", async () => {
    mockConnectedAPI.getConfiguration = vi.fn().mockResolvedValue({ 
      networkId: "undeployed", 
      indexerUri: "http://127.0.0.1:8088/api/v4/graphql", 
      indexerWsUri: "ws://127.0.0.1:8088/api/v4/graphql/ws",
      proverServerUri: "https://api-preprod.1am.xyz" 
    });

    await buildBrowserProviders(mockConnectedAPI);
    expect(mockHttpClientProofProvider).toHaveBeenCalledWith(
      "http://127.0.0.1:6300",
      expect.any(Object)
    );
  });

  it("rejects a remote or unauthorized proof-server URL", async () => {
    vi.mocked(getConfig).mockReturnValueOnce({
      networkId: "undeployed",
      indexer: "http://127.0.0.1:8088/api/v4/graphql",
      indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws",
      node: "",
      nodeWS: "",
      faucet: "",
      proofServer: "https://remote-prover.example.com",
    });

    await expect(buildBrowserProviders(mockConnectedAPI)).rejects.toThrow(
      /Privacy violation: Proof server must be a local loopback address/
    );
    expect(mockHttpClientProofProvider).not.toHaveBeenCalled();
  });
});

describe("DappConnectorWalletProvider Invariants", () => {
  let mockConnectedAPI: ConnectedAPI;
  let provider: DappConnectorWalletProvider;

  beforeEach(() => {
    mockConnectedAPI = {
      getProvingProvider: vi.fn(() => ({})),
      balanceUnsealedTransaction: vi.fn().mockResolvedValue({ tx: "00" }),
    } as unknown as ConnectedAPI;

    provider = new DappConnectorWalletProvider(mockConnectedAPI);
  });

  it("calls balanceUnsealedTransaction with { payFees: true }", async () => {
    const mockUnboundTx = {
      serialize: () => new Uint8Array([1, 2, 3]),
    } as any;

    try {
      await provider.balanceTx(mockUnboundTx);
    } catch (e) {
      // Ignore deserialize error
    }

    expect(mockConnectedAPI.balanceUnsealedTransaction).toHaveBeenCalledWith(
      expect.any(String),
      { payFees: true },
    );
  });
});
