import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Contract } from "./managed/just-proof/contract/index.js";

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from "./managed/just-proof/contract/index.js";

export const CompiledJustProofContract = CompiledContract.make(
  "JustProofContract",
  Contract,
).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets("./managed/just-proof"),
);
