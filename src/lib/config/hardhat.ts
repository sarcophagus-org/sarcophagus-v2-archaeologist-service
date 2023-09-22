import { SarcoNetworkConfig } from "@sarcophagus-org/sarcophagus-v2-sdk";

export const hardhatNetworkConfig: SarcoNetworkConfig = {
  chainId: 31337,
  networkName: "Hardhat Local Network",
  networkShortName: "HardHat",
  sarcoTokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  diamondDeployAddress: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  subgraphUrl: "",
  signalServerPort: 15555,
  apiUrlBase: "",
  arweaveConfig: {},
  bundlr: {
    currencyName: "",
    nodeUrl: "",
  },
  etherscanApiUrl: "",
  etherscanApiKey: "",
  explorerUrl: "",
};
