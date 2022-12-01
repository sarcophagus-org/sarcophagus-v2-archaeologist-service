import { NetworkConfig } from "../types/network-config";

export const goerliNetworkConfig: NetworkConfig = {
  chainId: 5,
  networkName: "Goerli Testnet",
  networkShortName: "Goerli",
  sarcoTokenAddress: "0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436",
  diamondDeployAddress: "0xB7c129B3A4717A50b6693b8D831851D41BD18a7c",
  arweave: {
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: false,
  },
};
