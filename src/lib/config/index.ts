import { hardhatNetworkConfig } from "./hardhat";
import { goerliNetworkConfig } from "./goerli";
import { mainnetNetworkConfig } from "./mainnet";
import { NetworkConfig } from "../types/network-config";
import { sepoliaNetworkConfig } from "./sepolia";

export const localChainId = hardhatNetworkConfig.chainId;

export const isLocalNetwork = Number(process.env.CHAIN_ID) === localChainId;

export const getNetworkConfigByChainId = (chainId: string | number): NetworkConfig => {
  const networkConfig = [
    hardhatNetworkConfig,
    goerliNetworkConfig,
    sepoliaNetworkConfig,
    mainnetNetworkConfig,
  ].find(config => config.chainId === Number(chainId));

  if (!networkConfig) {
    throw Error(`Unsupported Chain ID: ${chainId}`);
  }

  return networkConfig;
};
