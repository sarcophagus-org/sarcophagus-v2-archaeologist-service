import { NetworkConfig } from "../types/network-config";

export const sepoliaNetworkConfig: NetworkConfig = {
  chainId: 5,
  networkName: "Sepolia Testnet",
  networkShortName: "Sepolia",
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
