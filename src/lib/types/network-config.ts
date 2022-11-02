interface ArweaveConfig {
  host: string;
  port: number;
  protocol: string;
  timeout: number;
  logging: boolean;
}

export interface NetworkConfig {
  chainId: number;
  networkName: string;
  networkShortName: string;
  sarcoTokenAddress: string;
  diamondDeployAddress: string;
  arweave: ArweaveConfig;
  providerUrl?: string;
  signalServerPort?: number;
}
