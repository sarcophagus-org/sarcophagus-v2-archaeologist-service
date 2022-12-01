import { NetworkConfig } from "../types/network-config";

export const mainnetNetworkConfig: NetworkConfig = {
  chainId: 1,
  networkName: "Mainnet",
  networkShortName: "Mainnet",
  sarcoTokenAddress: "",
  diamondDeployAddress: "",
  arweave: {
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: false,
  },
};
