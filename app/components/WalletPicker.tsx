import { useEffect, useRef } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";

interface WalletPickerProps {
  isOpen: boolean;
  wallets: InitialAPI[];
  onSelect: (wallet: InitialAPI) => void;
  onClose: () => void;
}

export function WalletPicker({
  isOpen,
  wallets,
  onSelect,
  onClose,
}: WalletPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby="wallet-picker-title"
      className="wallet-dialog"
    >
      <div className="wallet-dialog-content">
        <h2 id="wallet-picker-title" className="wallet-dialog-title">
          Connect Wallet
        </h2>
        <p className="wallet-dialog-desc">
          Select a wallet to securely connect to JustProof.
        </p>

        {wallets.length === 0 ? (
          <div className="wallet-empty">
            <p className="wallet-empty-title">No Midnight wallets detected.</p>
            <p className="wallet-empty-desc">
              Please install a Midnight compatible extension (e.g. 1AM) to
              continue.
            </p>
          </div>
        ) : (
          <div className="wallet-options">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                className="wallet-option"
                onClick={() => onSelect(wallet)}
                aria-label={`Connect with ${wallet.name}`}
              >
                <div className="wallet-icon">
                  {wallet.icon ? (
                    <img src={wallet.icon} alt="" />
                  ) : (
                    <span className="mono">W</span>
                  )}
                </div>
                <div className="wallet-info">
                  <span className="wallet-name">{wallet.name}</span>
                  <span className="wallet-status">Installed</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="wallet-dialog-actions">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
