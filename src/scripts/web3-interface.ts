import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "../utils/exit-codes";
import { NetworkContext, getNetworkContextsByChainIds } from "../network-config";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";

export interface Web3Interface {
  networkContexts: NetworkContext[];
  getNetworkContext: (network: SarcoSupportedNetwork | undefined) => NetworkContext;
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
    const chainIds = process.env.CHAIN_IDS!.split(",").map(chainIdStr => Number(chainIdStr.trim()))
    const networkContexts = getNetworkContextsByChainIds(chainIds, isTest);

    web3Interface = {
      networkContexts,
      getNetworkContext: networkOrChainId => {
        const networkContext =
          networkOrChainId === undefined
            ? web3Interface?.networkContexts[0]
            : web3Interface!.networkContexts.find(
                n => (typeof networkOrChainId === "number" && n.chainId === networkOrChainId) || 
                (typeof networkOrChainId === "string" && n.networkName.toLowerCase() === networkOrChainId.toLowerCase())
              );

        if (!networkContext) {
          throw Error(`No Network Context found for Chain ID or Network Name: ${networkOrChainId}`);
        }

        return networkContext;
      },
    };

    return web3Interface;
  } catch (e) {
    await archLogger.error(e, { logTimestamp: true, sendNotification: true });
    archLogger.error("Confirm PROVIDER_URL in .env is a valid RPC Provider URL", {
      logTimestamp: true,
    });
    exit(BAD_ENV);
  }
};
