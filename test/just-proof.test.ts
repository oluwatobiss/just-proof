/** Local-only V2 SDK integration. Public synthetic identities; never use for production. */
import pino from 'pino';
import type { ClientRequestArgs } from 'node:http';
import { describe, it, expect } from 'vitest';
import WebSocket, { createWebSocketStream, WebSocketServer } from 'ws';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { persistentHash } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { Contract, ledger, type Witnesses } from '../contracts/managed/just-proof/contract/index.js';
import { MidnightWalletProvider } from '../providers/walletProviders';
import { LOCAL_CONFIG, OWNER_LOCAL_SEED } from '../utils/config';
import { syncWallet } from '../utils/wallet';
import { createRestrictedMemoryProvider } from './support/local-v2-memory';
import { syntheticInputs } from './support/v2-vectors';
import { ReferenceTree, domain, schemas, hex } from './support/v2-reference';
import { p, snapshot, leaf } from './support/v3a-register-issuer';

type PS = { readonly authority: Uint8Array; readonly insertionPath: readonly Uint8Array[] };
type C = Contract<PS>;
type Circuits = keyof C['provableCircuits'];
const witnesses: Witnesses<PS> = {
  registryAuthoritySecretWitness: ({privateState}) => [privateState, Uint8Array.from(privateState.authority)],
  issuerRegistrationWitnessV2: ({privateState}) => {
    const witness = { registryAuthoritySecret: Uint8Array.from(privateState.authority), insertionPath: {siblings: privateState.insertionPath.map(x => Uint8Array.from(x))} };
    Object.freeze(witness.insertionPath.siblings);Object.freeze(witness.insertionPath);Object.freeze(witness);
    return [privateState, witness];
  },
  credentialRegistrationWitnessV2: () => {throw new Error('UNSUPPORTED_TEST_OPERATION');},
  credentialRevocationWitnessV2: () => {throw new Error('UNSUPPORTED_TEST_OPERATION');},
  qualificationWitnessV2: () => {throw new Error('UNSUPPORTED_TEST_OPERATION');},
};
const compiled = CompiledContract.make<C>('JustProofV2Local', Contract<PS>).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('contracts/managed/just-proof'),
);
const silent = pino({level:'silent'});
// Convert SDK exceptions before Vitest can stringify a private request/transaction.
async function safe<T>(stage: string, operation: () => Promise<T>): Promise<T> {
  try {return await operation();} catch {throw new Error(`LOCAL_V2_${stage}_FAILED`);}
}
async function withDeployment(operation: (providers: MidnightProviders<Circuits,'LocalV2',PS>, address: string, initial: ReturnType<typeof snapshot>) => Promise<void>) {
  if (process.env.MIDNIGHT_NETWORK !== 'local') throw new Error('LOCAL_ONLY');
  if (['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy'].some(k => process.env[k])) throw new Error('PROXY_NOT_ALLOWED');
  const sockets = new Set<WebSocket>();
  class ScopedWebSocket extends WebSocket {
    static createWebSocketStream = createWebSocketStream;
    static Server = WebSocketServer;
    static WebSocketServer = WebSocketServer;
    static WebSocket = ScopedWebSocket;
    constructor(address: null);
    constructor(address: string | URL, options?: WebSocket.ClientOptions | ClientRequestArgs);
    constructor(address: string | URL, protocols?: string | string[], options?: WebSocket.ClientOptions | ClientRequestArgs);
    constructor(address: string | URL | null, protocols?: string | string[] | WebSocket.ClientOptions | ClientRequestArgs, options?: WebSocket.ClientOptions | ClientRequestArgs) {
      if(address === null) super(null);
      else if(typeof protocols === 'string' || Array.isArray(protocols)) super(address,protocols,options);
      else super(address,protocols);
      sockets.add(this);this.once('close',()=>sockets.delete(this));
    }
  }
  const priorSocket = globalThis.WebSocket;
  // The installed SDK's Node transport requires the ws implementation.
  Object.defineProperty(globalThis,'WebSocket',{value:ScopedWebSocket,writable:true,configurable:true});
  const memory = createRestrictedMemoryProvider<'LocalV2',PS>('--separately-authorized-memory-provider');
  let wallet: MidnightWalletProvider | undefined;
  try {
    setNetworkId('undeployed');
    wallet = await safe('WALLET_BUILD',()=>MidnightWalletProvider.build(silent,{...LOCAL_CONFIG,walletNetworkId:'undeployed'}, {kind:'seed',value:OWNER_LOCAL_SEED}));
    const currentWallet = wallet;
    await safe('WALLET_START',()=>currentWallet.start());
    await safe('SYNC',()=>syncWallet(silent,currentWallet.wallet,180_000));
    const zk = new NodeZkConfigProvider<Circuits>('contracts/managed/just-proof');
    const providers: MidnightProviders<Circuits,'LocalV2',PS> = {
      privateStateProvider:memory.provider,
      publicDataProvider:indexerPublicDataProvider(LOCAL_CONFIG.indexer,LOCAL_CONFIG.indexerWS,ScopedWebSocket),
      zkConfigProvider:zk, proofProvider:httpClientProofProvider(LOCAL_CONFIG.proofServer,zk),
      walletProvider:currentWallet,midnightProvider:currentWallet,
    };
    const f=syntheticInputs(), issuers=new ReferenceTree('issuer');
    const expected = {
      registryAuthorityControlCommitment:hex(persistentHash(schemas.RegistryAuthorityControlInputV2,{domain:domain('REGISTRY_AUTHORITY_CONTROL'),protocolVersion:2n,registryContext:f.context,registryAuthoritySecret:f.authority})),
      registryContext:hex(f.context),issuerRoot:hex(issuers.root()),nextIssuerIndex:'0',registeredIssuerLeaves:[],
      credentialRoot:hex(new ReferenceTree('credential').root()),nextCredentialIndex:'0',registeredCredentialNullifiers:[],revocationRoot:hex(new ReferenceTree('revocation').root()),
    };
    const deployment = await safe('DEPLOY',()=>deployContract<C>(providers,{compiledContract:compiled,privateStateId:'LocalV2',initialPrivateState:{authority:Uint8Array.from(f.authority),insertionPath:issuers.path(0)},args:[f.context]}));
    const address=deployment.deployTxData.public.contractAddress;
    await operation(providers,address,expected);
  } finally {
    try {if(wallet) await safe('STOP',()=>wallet!.stop());}
    finally {for(const socket of sockets) socket.terminate();memory.dispose();Object.defineProperty(globalThis,'WebSocket',{value:priorSocket,writable:true,configurable:true});}
  }
}
async function publicSnapshot(providers: MidnightProviders<Circuits,'LocalV2',PS>,address:string) {
  const state=await safe('QUERY',()=>providers.publicDataProvider.queryContractState(address));
  if(!state) throw new Error('LOCAL_V2_STATE_MISSING');
  return snapshot(ledger(state.data));
}
describe('Local V2 finalized SDK integration',()=>{
  it('deploys with the exact nine-field initial ledger',async()=>{
    await withDeployment(async(providers,address,initial)=>{
      const actual=await publicSnapshot(providers,address);expect(Object.keys(actual)).toHaveLength(9);expect(actual).toEqual(initial);
    });
  },600_000);
  it('finalizes registerIssuerV2 and changes only its root, counter and leaf set',async()=>{
    await withDeployment(async(providers,address,initial)=>{
      expect(await publicSnapshot(providers,address)).toEqual(initial);
      const f=syntheticInputs(),control=p.diagnose_issuerControlV2(f.context,f.issuer),issuerLeaf=leaf(f.context,control),tree=new ReferenceTree('issuer');tree.setSyntheticLeaf(0,issuerLeaf);
      await safe('REGISTER_ISSUER',()=>submitCallTx<C,'registerIssuerV2'>(providers,{compiledContract:compiled,contractAddress:address,privateStateId:'LocalV2',circuitId:'registerIssuerV2',args:[control]}));
      expect(await publicSnapshot(providers,address)).toEqual({...initial,issuerRoot:hex(tree.root()),nextIssuerIndex:'1',registeredIssuerLeaves:[hex(issuerLeaf)]});
    });
  },600_000);
});
