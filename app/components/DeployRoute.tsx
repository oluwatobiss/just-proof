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

type TxState =
  | "idle"
  | "preparing"
  | "proving"
  | "balancing"
  | "signing"
  | "submitting"
  | "success"
  | "error";

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

export function DeployRoute() {
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [isWalletPickerOpen, setIsWalletPickerOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<InitialAPI[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard for concurrent deployments
  const [isDeploying, setIsDeploying] = useState(false);

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
      // Reset stale state on new wallet connection
      setDeploymentResult(null);
      setTxState("idle");

      const connectedWallet = await connectBrowserWallet(selectedWallet);
      setWallet(connectedWallet);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        "Couldn't connect to your wallet. Please unlock it and try again.",
      );
      setWallet(null);
    } finally {
      setIsConnecting(false);
    }
  }

  async function performDeployment() {
    if (!wallet || isDeploying) return;

    setIsDeploying(true);
    setErrorMessage(null);

    try {
      setTxState("preparing");

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
          "Local proof server unavailable. Start the Midnight proof server on 127.0.0.1:6300 (e.g. via Docker) and try again.",
        );
      }

      const { providers } = await buildBrowserProviders(wallet);

      setTxState("proving");

      // Deploy Contract (calls proveTx, balanceTx, submitTx under the hood)
      const deployed = await deployContract(providers, {
        compiledContract: CompiledJustProofContract,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {}, // Empty initial private state; the contract will initialize it
      });

      setTxState("submitting");
      const contractAddress = deployed.deployTxData.public.contractAddress;

      const deployedContractData = buildDeployedContractData(
        contractAddress,
        config.networkId,
      );

      const contractDataJson = JSON.stringify(deployedContractData, null, 2);
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
    } finally {
      setIsDeploying(false);
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
    <section className="deploy-section">
      <div className="deploy-container">
        <div className="deploy-card">
          <h2 className="deploy-eyebrow">Contract Deployment</h2>
          <h1 className="deploy-title">Admin Deployment</h1>
          <p className="deploy-description">
            This is a local operational route for deploying the JustProof
            placeholder contract to the {config.networkId} Midnight network.
          </p>
          <div className="deploy-notice">
            <p>
              <strong>Proving:</strong> Deployment proofs are generated using
              the proof server running locally on your computer at{" "}
              {config.proofServer}.
            </p>
            <p>
              <strong>Transactions:</strong> The connected wallet handles
              transaction balancing, signing, DUST sponsorship where available,
              and submission to Midnight {config.networkId}.
            </p>
          </div>
          {errorMessage && (
            <div className="deploy-status--error">
              <p>{errorMessage}</p>
            </div>
          )}
          {!wallet ? (
            <button
              onClick={openWalletPicker}
              disabled={isConnecting}
              className="btn btn-primary btn-full"
            >
              {isConnecting ? "Connecting..." : "Connect 1AM Wallet"}
            </button>
          ) : deploymentResult ? (
            <div className="deploy-result">
              <div className="status-valid">
                <span>Contract Deployed</span>
              </div>
              <div className="deploy-address-box mono">
                {deploymentResult.contractAddress}
              </div>
              <div className="deploy-info-banner">
                <strong>Important:</strong> Download your deployment record. It
                contains your contract address and network ID.
                <br />
                <br />
                <em>
                  Note: This placeholder contract does not export a private
                  Creator Identity.
                </em>
              </div>
              <button
                onClick={downloadContractData}
                className="btn btn-primary btn-full"
              >
                Download Contract Data
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={performDeployment}
                disabled={isDeploying}
                className="btn btn-primary btn-full"
              >
                {isDeploying ? "Deploying..." : "Deploy Contract"}
              </button>
              {isDeploying && (
                <div className="deploy-status">
                  {txState === "preparing" && "Validating environment..."}
                  {txState === "proving" && "Generating ZK Proof locally..."}
                  {txState === "submitting" && "Balancing & Submitting..."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <WalletPicker
        isOpen={isWalletPickerOpen}
        wallets={availableWallets}
        onSelect={connectWallet}
        onClose={() => setIsWalletPickerOpen(false)}
      />
    </section>
  );
}
