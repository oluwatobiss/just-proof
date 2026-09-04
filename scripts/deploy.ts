import pino from "pino";
import { loadEnv } from "vite";
import {
  deployContract,
  type DeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  waitForFunds,
  type EnvironmentConfiguration,
} from "@midnight-ntwrk/testkit-js";
import { CompiledJustProofContract, Contract } from "../contracts/index";
import {
  buildNodeProviders,
  type JustProofProviders,
} from "../providers/buildNodeProviders";
import { MidnightWalletProvider } from "../providers/walletProviders";
import { getConfig, network, PRIVATE_STATE_ID } from "../utils/config";
import { resolveSecret } from "../utils/resolveSecret";
import { syncWallet } from "../utils/wallet";

// Load .env.<network> file into process.env before anything reads it.
// Unlike vitest, vite-node does not auto-load .env files, so we do it manually.
const isRemote = network !== "local";
if (isRemote) {
  const envFromFile = loadEnv(network, process.cwd(), "");
  for (const [key, value] of Object.entries(envFromFile)) {
    // Shell env takes priority: only set if not already defined
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  let wallet: MidnightWalletProvider;
  let providers: JustProofProviders;

  const logger = pino({
    level: process.env["LOG_LEVEL"] ?? "info",
    transport: { target: "pino-pretty" },
  });

  const config = getConfig();
  const secret = resolveSecret(network);
  const syncTimeoutMs = Number(
    process.env["MIDNIGHT_SYNC_TIMEOUT_MS"] ??
      (isRemote ? 60 * 60_000 : 10 * 60_000),
  );

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

  logger.info("Deploying Just Proof contract...");
  logger.info(`Network: ${network}`);

  wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
  await wallet.start();
  await syncWallet(logger, wallet.wallet, syncTimeoutMs);

  if (isRemote) {
    // NIGHT→DUST registration. Seed is pre-funded via the faucet page; idempotent.
    const nightBalance = await waitForFunds(
      wallet.wallet,
      envConfig,
      false,
      wallet.unshieldedKeystore,
    );
    logger.info(`Wallet NIGHT balance on '${network}': ${nightBalance}`);
  }

  providers = buildNodeProviders(
    wallet,
    "contracts/managed/just-proof",
    config,
  );

  const deployed: DeployedContract<Contract> = await deployContract<Contract>(
    providers,
    {
      compiledContract: CompiledJustProofContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    },
  );

  logger.info("✅ Contract deployed successfully!");

  const contractAddress = deployed.deployTxData.public.contractAddress;

  logger.info(`Contract Address: ${contractAddress}`);

  logger.info(
    "─── Deployment Complete! ───────────────────────────────────────",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
