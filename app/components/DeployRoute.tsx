import { useState } from "react";
import type {
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { WalletPicker } from "./WalletPicker";
import { CompiledJustProofContract } from "../../contracts/index";
import { buildBrowserProviders } from "../../providers/buildBrowserProviders";
import { getConfig, PRIVATE_STATE_ID } from "../../utils/config";
import { connectBrowserWallet, listWallets } from "../../utils/wallet";

type TxState = "idle" | "proving" | "submitting" | "success" | "error";

interface DeployedContractData {
  version: number;
  contractAddress: string;
  network: string;
  createdAt: string;
}

function buildDeployedContractData(
  contractAddress: string,
  network: string,
): DeployedContractData {
  return {
    version: 1,
    contractAddress,
    network,
    createdAt: new Date().toISOString(),
  };
}

function serializeDeployedContractData(data: DeployedContractData): string {
  return JSON.stringify(data, null, 2);
}

export function DeployRoute() {
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<InitialAPI[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [txState, setTxState] = useState<TxState>("idle");
  const [deploymentResult, setDeploymentResult] = useState<{
    contractAddress: string;
    contractDataBlob: Blob;
  } | null>(null);

  const config = getConfig();

  function openWalletPicker() {
    const wallets = listWallets();
    setAvailableWallets(wallets);
    setIsWalletPickerOpen(true);
  }

  async function connectWallet(selectedWallet: InitialAPI) {
    try {
      setIsWalletPickerOpen(false);
      setIsConnecting(true);
      setErrorMessage(null);

      const connectedWallet = await connectBrowserWallet(selectedWallet);
      setWallet(connectedWallet);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        "Couldn't connect to your wallet. Please unlock it and try again.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function performDeployment() {
    if (!wallet) return;

    try {
      setTxState("proving");
      setErrorMessage(null);

      // Network ID validation
      const walletConfig = await wallet.getConfiguration();
      if (walletConfig.networkId !== config.networkId) {
        throw new Error(
          `Wallet is connected to '${walletConfig.networkId}', but this dApp expects '${config.networkId}'. Please switch networks in your wallet.`,
        );
      }

      // Local proof server availability check
      try {
        await fetch(config.proofServer, { method: "OPTIONS" });
      } catch {
        throw new Error(
          "Local proof server unavailable. Start the Midnight proof server on 127.0.0.1:6300 and try again.",
        );
      }

      const { providers } = await buildBrowserProviders(wallet);

      // Deploy Contract (calls proveTx, balanceTx, submitTx)
      const deployed = await deployContract(providers, {
        compiledContract: CompiledJustProofContract,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {}, // Empty initial private state; the contract will initialize it
      });

      const contractAddress = deployed.deployTxData.public.contractAddress;

      const deployedContractData = buildDeployedContractData(
        contractAddress,
        config.networkId,
      );

      const contractDataJson =
        serializeDeployedContractData(deployedContractData);
      const blob = new Blob([contractDataJson], { type: "application/json" });

      setDeploymentResult({
        contractAddress,
        contractDataBlob: blob,
      });
      setTxState("success");
    } catch (err: unknown) {
      console.error("Deployment failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setTxState("error");
    }
  }

  function downloadContractData() {
    if (!deploymentResult) return;
    const url = URL.createObjectURL(deploymentResult.contractDataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-data.${config.networkId}.justproof`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card max-w-lg mx-auto">
      <h2 className="mb-4">Admin Deployment</h2>
      <p className="mb-6 opacity-80 text-sm">
        This is a local operational route for deploying the Just Proof contract
        to the {config.networkId} Midnight network. The deployment process will
        generate a new contract address, which will be stored in a downloadable
        file. You can use this file to interact with your deployed contract.
        Your private inputs will only be sent to the local proof server at{" "}
        {config.proofServer}.
      </p>

      {errorMessage && (
        <div className="bg-error-bg text-error p-4 rounded mb-6">
          <p>{errorMessage}</p>
        </div>
      )}

      {!wallet ? (
        <button
          onClick={openWalletPicker}
          disabled={isConnecting}
          className="btn btn-primary w-full"
        >
          {isConnecting ? "Connecting..." : "Connect 1AM Wallet"}
        </button>
      ) : deploymentResult ? (
        <div className="flex-col gap-4 text-center">
          <div className="text-success font-bold text-xl mb-2">
            ✅ Contract Deployed
          </div>
          <p className="font-mono text-xs opacity-70 bg-base-200 p-2 rounded">
            {deploymentResult.contractAddress}
          </p>
          <div className="bg-warning-bg text-warning p-4 rounded text-left mt-4 mb-4 text-sm">
            <strong>🚨 IMPORTANT:</strong> Store your Contract Data securely! It
            represents ownership of your contract.
          </div>
          <button
            onClick={downloadContractData}
            className="btn btn-primary w-full"
          >
            Download Contract Data
          </button>
        </div>
      ) : (
        <div className="flex-col gap-4 text-center">
          <button
            onClick={performDeployment}
            disabled={txState === "proving" || txState === "submitting"}
            className="btn btn-primary w-full"
          >
            {txState === "proving" || txState === "submitting"
              ? "Deploying..."
              : "Deploy Contract"}
          </button>

          {(txState === "proving" || txState === "submitting") && (
            <p className="opacity-70 text-sm mt-2">
              {txState === "proving"
                ? "Generating ZK Proof locally..."
                : "Balancing & Submitting..."}
            </p>
          )}
        </div>
      )}

      <WalletPicker
        isOpen={isWalletPickerOpen}
        wallets={availableWallets}
        onSelect={connectWallet}
        onClose={() => setIsWalletPickerOpen(false)}
      />
    </div>
  );
}
