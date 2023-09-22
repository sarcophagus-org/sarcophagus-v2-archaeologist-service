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
import { hardhatNetworkConfig } from "@sarcophagus-org/sarcophagus-v2-sdk/dist/networkConfig";
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

type NetworkConfigReturningFunction = (providerUrl: string) => SarcoNetworkConfig;

const chainIdsToProviderUrl = new Map([
  [1, process.env.ETH_PROVIDER_URL!],
  [5, process.env.GOERLI_PROVIDER_URL!],
  [11155111, process.env.SEPOLIA_PROVIDER_URL!],
  [84531, process.env.BASE_GOERLI_PROVIDER_URL!],
  [80001, process.env.POLYGON_MUMBAI_PROVIDER_URL!],
  [31337, process.env.HARDHAT_PROVIDER_URL!],
]);

const getNetworkContextByChainId = (chainId: number, isTest: boolean): NetworkContext => {
  const chainIdsToNetworkConfigReturningFunction = new Map<number, NetworkConfigReturningFunction>([
    [1, (providerUrl: string) => mainnetNetworkConfig(providerUrl)],
    [5, (providerUrl: string) => goerliNetworkConfig(providerUrl)],
    [11155111, (providerUrl: string) => sepoliaNetworkConfig(providerUrl)],
    [80001, (providerUrl: string) => polygonMumbaiNetworkConfig(providerUrl)],
    [84531, (providerUrl: string) => baseGoerliNetworkConfig(providerUrl)],
    [31337, _ => hardhatNetworkConfig()],
  ]);

  if (!chainIdsToNetworkConfigReturningFunction.has(chainId)) {
    throw Error(`Unsupported Chain ID: ${chainId}`);
  }

  const getNetworkConfig: NetworkConfigReturningFunction =
    chainIdsToNetworkConfigReturningFunction[chainId];
  const providerUrl = chainIdsToProviderUrl[chainId];
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
