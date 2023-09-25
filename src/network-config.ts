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
} from "@sarcophagus-org/sarcophagus-v2-sdk";
import {
  BASE_GOERLI_CHAIN_ID,
  GOERLI_CHAIN_ID,
  HARDHAT_CHAIN_ID,
  MAINNET_CHAIN_ID,
  POLYGON_MUMBAI_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  hardhatNetworkConfig,
} from "@sarcophagus-org/sarcophagus-v2-sdk/dist/networkConfig";
import { ethers } from "ethers";
import { ArchaeologistFacetX } from "scripts/web3-interface/archaeologist-facet-x";

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
}

const chainIdsToProviderUrl = new Map([
  [MAINNET_CHAIN_ID, process.env.MAINNET_PROVIDER_URL],
  [GOERLI_CHAIN_ID, process.env.GOERLI_PROVIDER_URL],
  [SEPOLIA_CHAIN_ID, process.env.SEPOLIA_PROVIDER_URL],
  [BASE_GOERLI_CHAIN_ID, process.env.BASE_GOERLI_PROVIDER_URL],
  [POLYGON_MUMBAI_CHAIN_ID, process.env.POLYGON_MUMBAI_PROVIDER_URL],
  [HARDHAT_CHAIN_ID, process.env.HARDHAT_PROVIDER_URL],
]);

type NetworkConfigReturningFunction = (providerUrl: string) => SarcoNetworkConfig;

const getNetworkContextByChainId = (chainId: number, isTest: boolean): NetworkContext => {
  const chainIdsToNetworkConfigReturningFunction = new Map<number, NetworkConfigReturningFunction>([
    [MAINNET_CHAIN_ID, providerUrl => mainnetNetworkConfig(providerUrl)],
    [GOERLI_CHAIN_ID, providerUrl => goerliNetworkConfig(providerUrl)],
    [SEPOLIA_CHAIN_ID, providerUrl => sepoliaNetworkConfig(providerUrl)],
    [POLYGON_MUMBAI_CHAIN_ID, providerUrl => polygonMumbaiNetworkConfig(providerUrl)],
    [BASE_GOERLI_CHAIN_ID, providerUrl => baseGoerliNetworkConfig(providerUrl)],
    [HARDHAT_CHAIN_ID, _ => hardhatNetworkConfig()],
  ]);

  if (!chainIdsToNetworkConfigReturningFunction.has(chainId)) {
    throw Error(`Unsupported Chain ID: ${chainId}`);
  }

  const providerUrl: string | undefined = chainIdsToProviderUrl[chainId];

  if (!providerUrl) {
    throw Error(`No Provider URL for Chain ID: ${chainId}`);
  }

  const networkConfig: SarcoNetworkConfig =
    chainIdsToNetworkConfigReturningFunction[chainId](providerUrl);

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

  return {
    archaeologistFacet: new ArchaeologistFacetX(archaeologistFacet),
    chainId,
    ethWallet,
    embalmerFacet,
    networkConfig,
    networkName: networkConfig.networkName,
    thirdPartyFacet,
    viewStateFacet,
    sarcoToken,
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
