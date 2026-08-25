import { type Ledger } from "../contracts/managed/just-proof/contract/index.js";
import { type WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type JustProofPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createJustProofPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  creatorIdentity: ({
    privateState,
  }: WitnessContext<Ledger, JustProofPrivateState>): [
    JustProofPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
