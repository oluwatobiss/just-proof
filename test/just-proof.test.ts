import pino from "pino";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import {
  deployContract,
  submitCallTx,
  type DeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import {
  type EnvironmentConfiguration,
  waitForFunds,
} from "@midnight-ntwrk/testkit-js";
import {
  CompiledJustProofContract,
  Contract,
  ledger,
} from "../contracts/index";
import {
  buildNodeProviders,
  type JustProofProviders,
} from "../providers/buildNodeProviders";
import { MidnightWalletProvider } from "../providers/walletProviders";
import { getConfig, network, PRIVATE_STATE_ID } from "../utils/config";
import { resolveSecret } from "../utils/resolveSecret";
import { syncWallet } from "../utils/wallet";

// Required for GraphQL subscriptions in Node.js
// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION:", reason);
  console.error("Promise:", promise);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  transport: { target: "pino-pretty" },
});

describe(`Just Proof Contract (${network})`, () => {
  let wallet: MidnightWalletProvider;
  let providers: JustProofProviders;
  let contractAddress: ContractAddress;

  const config = getConfig();
  const secret = resolveSecret(network);
  const isRemote = network !== "local";
  const syncTimeoutMs = Number(
    process.env["MIDNIGHT_SYNC_TIMEOUT_MS"] ??
      (isRemote ? 60 * 60_000 : 10 * 60_000),
  );

  async function queryLedger(p: JustProofProviders) {
    const state =
      await p.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);

    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, syncTimeoutMs);

    if (isRemote) {
      // NIGHT→DUST registration. Seed is pre-funded via the faucet page; idempotent.
      const nightBalance = await waitForFunds(
        wallet.wallet,
        envConfig,
        true,
        wallet.unshieldedKeystore,
      );
      logger.info(`Wallet NIGHT balance on '${network}': ${nightBalance}`);
    }

    providers = buildNodeProviders(
      wallet,
      "contracts/managed/just-proof",
      config,
    );
    logger.info(`Providers initialized on '${network}'. Ready to test!`);
  });

  afterAll(async () => {
    if (wallet) {
      logger.info("Stopping wallet...");
      await wallet.stop();
    }
  });

  it("Deploys the contract", async () => {
    logger.info(`Creating private state...`);

    const deployed: DeployedContract<Contract> = await deployContract<Contract>(
      providers,
      {
        compiledContract: CompiledJustProofContract,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {},
      },
    );

    logger.info(`Setting the contract address...`);
    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`Contract deployed at: ${contractAddress}`);

    expect(contractAddress).toBeDefined();
    expect(contractAddress.length).toBeGreaterThan(0);

    const ledgerState = await queryLedger(providers);
    expect(ledgerState.message).toEqual("");
  });

  it("Stores Message!", async () => {
    const message = "Hello from CodeSweetly!";

    await submitCallTx<Contract, "storeMessage">(providers, {
      compiledContract: CompiledJustProofContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: "storeMessage",
      args: [message],
    });

    const ledgerState = await queryLedger(providers);
    expect(ledgerState.message).toEqual(message);
  });
});
