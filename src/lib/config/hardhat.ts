import { NetworkConfig } from "../types/network-config";

export const hardhatNetworkConfig: NetworkConfig = {
  chainId: 31337,
  networkName: 'Hardhat Local Network',
  networkShortName: 'HardHat',
  sarcoTokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  diamondDeployAddress: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
  arweave: {
    host: "127.0.0.1",
    port: 1984,
    protocol: "http",
    timeout: 20000,
    logging: true
  },
  providerUrl: "http://127.0.0.1:8545",
  signalServerPort: 3001
};