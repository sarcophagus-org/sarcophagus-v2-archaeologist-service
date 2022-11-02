import { NetworkConfig } from "../types/network-config";

export const chainId = 5;

export const goerliNetworkConfig: NetworkConfig = {
  chainId,
  networkName: 'Goerli Testnet',
  networkShortName: 'Goerli',
  sarcoTokenAddress: '0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436',
  diamondDeployAddress: '0x814De2Db5D12E7e10B79D128Fca70Baba53d8394',
  arweave: {
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: false
  }
};