import {
  ArchaeologistFacet__factory,
  EmbalmerFacet,
  EmbalmerFacet__factory,
  IERC20,
  IERC20__factory,
  ThirdPartyFacet,
  ThirdPartyFacet__factory,
  ViewStateFacet,
  ViewStateFacet__factory,
} from "@sarcophagus-org/sarcophagus-v2-contracts";
import {
  SarcoNetworkConfig,
  goerliNetworkConfig,
  sepoliaNetworkConfig,
  mainnetNetworkConfig,
  baseGoerliNetworkConfig,
  polygonMumbaiNetworkConfig,
  polygonMainnetNetworkConfig,
} from "@sarcophagus-org/sarcophagus-v2-sdk";
import {
  BASE_GOERLI_CHAIN_ID,
  GOERLI_CHAIN_ID,
  HARDHAT_CHAIN_ID,
  MAINNET_CHAIN_ID,
  POLYGON_MUMBAI_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  hardhatNetworkConfig,
} from "@sarcophagus-org/sarcophagus-v2-sdk";
import { ethers } from "ethers";
import { KeyFinder } from "./models/key-finder";
import { ArchaeologistFacetX } from "./scripts/web3-interface/archaeologist-facet-x";

export interface NetworkContext {
  chainId: number;
  networkName: string;
  networkConfig: SarcoNetworkConfig;
  sarcoToken: IERC20;
  ethWallet: ethers.Wallet;
  archaeologistFacet: ArchaeologistFacetX;
  embalmerFacet: EmbalmerFacet;
  thirdPartyFacet: ThirdPartyFacet;
  viewStateFacet: ViewStateFacet;
  keyFinder: KeyFinder;
  encryptionHdWallet: ethers.utils.HDNode;
}

type NetworkConfigReturningFunction = (providerUrl: string) => SarcoNetworkConfig;
const chainIdsToNetworkConfigReturningFunction = new Map<number, NetworkConfigReturningFunction>([
  [MAINNET_CHAIN_ID, providerUrl => mainnetNetworkConfig(providerUrl)],
  [GOERLI_CHAIN_ID, providerUrl => goerliNetworkConfig(providerUrl)],
  [SEPOLIA_CHAIN_ID, providerUrl => sepoliaNetworkConfig(providerUrl)],
  [POLYGON_MUMBAI_CHAIN_ID, providerUrl => polygonMumbaiNetworkConfig(providerUrl)],
  [POLYGON_MAINNET_CHAIN_ID, providerUrl => polygonMainnetNetworkConfig(providerUrl)],
  [BASE_GOERLI_CHAIN_ID, providerUrl => baseGoerliNetworkConfig(providerUrl)],
  [HARDHAT_CHAIN_ID, _ => hardhatNetworkConfig()],
]);

const getNetworkContextByChainId = (chainId: number, isTest: boolean): NetworkContext => {
  if (!chainIdsToNetworkConfigReturningFunction.has(chainId)) {
    throw Error(`Unsupported Chain ID: ${chainId}`);
  }

  const chainIdsToProviderUrl = new Map([
    [MAINNET_CHAIN_ID, process.env.MAINNET_PROVIDER_URL],
    [GOERLI_CHAIN_ID, process.env.GOERLI_PROVIDER_URL],
    [SEPOLIA_CHAIN_ID, process.env.SEPOLIA_PROVIDER_URL],
    [BASE_GOERLI_CHAIN_ID, process.env.BASE_GOERLI_PROVIDER_URL],
    [POLYGON_MUMBAI_CHAIN_ID, process.env.POLYGON_MUMBAI_PROVIDER_URL],
    [POLYGON_MAINNET_CHAIN_ID, process.env.POLYGON_MAINNET_PROVIDER_URL],
    [HARDHAT_CHAIN_ID, process.env.HARDHAT_PROVIDER_URL],
  ]);
  const providerUrl: string | undefined = chainIdsToProviderUrl.get(chainId);

  if (!providerUrl) {
    throw Error(`No Provider URL for Chain ID: ${chainId}`);
  }

  const getNetworkConfig = chainIdsToNetworkConfigReturningFunction.get(chainId)!;
  const networkConfig = getNetworkConfig(providerUrl);

  const rpcProvider = new ethers.providers.WebSocketProvider(providerUrl);
  const ethWallet = isTest
    ? ethers.Wallet.createRandom()
    : new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);

  const archaeologistFacet = ArchaeologistFacet__factory.connect(
    networkConfig.diamondDeployAddress,
    ethWallet
  );
  const viewStateFacet = ViewStateFacet__factory.connect(
    networkConfig.diamondDeployAddress,
    ethWallet
  );
  const thirdPartyFacet = ThirdPartyFacet__factory.connect(
    networkConfig.diamondDeployAddress,
    ethWallet
  );
  const embalmerFacet = EmbalmerFacet__factory.connect(
    networkConfig.diamondDeployAddress,
    ethWallet
  );
  const sarcoToken = IERC20__factory.connect(networkConfig.sarcoTokenAddress, ethWallet);

  // Cannot confirm rpcProvider is valid until an actual network call is attempted
  sarcoToken.balanceOf(ethWallet.address);

  const chainIdsToEncryptionMnemonic = new Map([
    [MAINNET_CHAIN_ID, process.env.MAINNET_ENCRYPTION_MNEMONIC],
    [GOERLI_CHAIN_ID, process.env.GOERLI_ENCRYPTION_MNEMONIC],
    [SEPOLIA_CHAIN_ID, process.env.SEPOLIA_ENCRYPTION_MNEMONIC],
    [BASE_GOERLI_CHAIN_ID, process.env.BASE_GOERLI_ENCRYPTION_MNEMONIC],
    [POLYGON_MUMBAI_CHAIN_ID, process.env.POLYGON_MUMBAI_ENCRYPTION_MNEMONIC],
    [POLYGON_MAINNET_CHAIN_ID, process.env.POLYGON_MAINNET_ENCRYPTION_MNEMONIC],
    [HARDHAT_CHAIN_ID, process.env.HARDHAT_ENCRYPTION_MNEMONIC],
  ]);
  const encryptionMnemonic: string | undefined = chainIdsToEncryptionMnemonic.get(chainId);

  if (!encryptionMnemonic) {
    throw Error(`No Encryption Mnemonic for Chain ID: ${chainId}`);
  }

  const encryptionHdWallet = ethers.utils.HDNode.fromMnemonic(encryptionMnemonic);
  const keyFinder = new KeyFinder(encryptionHdWallet, chainId);

  return {
    archaeologistFacet: new ArchaeologistFacetX(archaeologistFacet, chainId),
    chainId,
    ethWallet,
    embalmerFacet,
    networkConfig,
    networkName: networkConfig.networkShortName,
    thirdPartyFacet,
    viewStateFacet,
    sarcoToken,
    keyFinder,
    encryptionHdWallet,
  };
};

export const getNetworkContextsByChainIds = (
  chainIds: number[],
  isTest: boolean
): NetworkContext[] => {
  if (!chainIds.length) {
    throw Error("No chain IDs provided");
  }

  const networkContexts: NetworkContext[] = [];
  chainIds.forEach(chainId => networkContexts.push(getNetworkContextByChainId(chainId, isTest)));

  return networkContexts;
};
