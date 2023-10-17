import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "../utils/exit-codes";
import { NetworkContext, getNetworkContextsByChainIds } from "../network-config";
import { SARCO_SUPPORTED_NETWORKS } from "@sarcophagus-org/sarcophagus-v2-sdk";

export interface Web3Interface {
  networkContexts: NetworkContext[];
  getNetworkContext: (networkOrChainId: number | string | undefined) => NetworkContext;
}

let web3Interface: Web3Interface | undefined;

export const destroyWeb3Interface = async (): Promise<void> => {
  if (!!web3Interface) {
    web3Interface.networkContexts.forEach(networkContext => {
      networkContext.ethWallet.provider.removeAllListeners();
      (
        networkContext.ethWallet.provider as ethers.providers.WebSocketProvider
      )._websocket.terminate();
    });
    web3Interface = undefined;
  }
};

export const getWeb3Interface = async (isTest: boolean = false): Promise<Web3Interface> => {
  if (!!web3Interface) {
    return web3Interface;
  }

  try {
    const chainIds = process.env
      .CHAIN_IDS!.split(",")
      .map(chainIdStr => Number.parseInt(chainIdStr.trim()));
    const networkContexts = getNetworkContextsByChainIds(chainIds, isTest);

    web3Interface = {
      networkContexts,
      getNetworkContext: networkOrChainId => {
        let networkContext: NetworkContext | undefined; 

        if (networkOrChainId === undefined) {
          return networkContexts[0];
        }

        if (typeof networkOrChainId === "string") {
          const networkNames = Array.from(SARCO_SUPPORTED_NETWORKS.values());
          networkContext = networkNames.includes(networkOrChainId) ? 
            web3Interface!.networkContexts.find(n => n.networkName.toLowerCase() === networkOrChainId.toLowerCase()) : 
            undefined;
        }

        if (typeof networkOrChainId === "number") {
          const chainIds = Array.from(SARCO_SUPPORTED_NETWORKS.keys());
          networkContext = chainIds.includes(networkOrChainId) ? 
            web3Interface!.networkContexts.find(n => n.chainId === networkOrChainId) : 
            undefined;
        }

        if (!networkContext) {
          throw Error(`No Network Context found for Chain ID or Network Name: ${networkOrChainId}`);
        }

        return networkContext;
      },
    };

    return web3Interface;
  } catch (e) {
    await archLogger.error(e, { logTimestamp: true, sendNotification: true });
    exit(BAD_ENV);
  }
};
