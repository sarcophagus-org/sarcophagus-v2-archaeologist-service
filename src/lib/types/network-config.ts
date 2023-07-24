export interface NetworkConfig {
  chainId: number;
  networkName: string;
  networkShortName: string;
  sarcoTokenAddress: string;
  diamondDeployAddress: string;
  subgraphUrl?: string;
  signalServerPort?: number;
}
