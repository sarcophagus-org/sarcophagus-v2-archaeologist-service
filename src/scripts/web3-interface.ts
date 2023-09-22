import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "../utils/exit-codes";
import { NetworkContext, getNetworkContextsByChainIds } from "../network-config";
import { KeyFinder } from "../models/key-finder";

export interface Web3Interface {
  encryptionHdWallet: ethers.utils.HDNode;
  keyFinder: KeyFinder;
  networkContexts: NetworkContext[];
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
    const chainIds = process.env.CHAIN_IDS
      ? process.env.CHAIN_IDS.split(",").map(chaidIdStr => Number(chaidIdStr.trim()))
      : [];
    const networkContexts = getNetworkContextsByChainIds(chainIds, isTest);

    const encryptionHdWallet = ethers.utils.HDNode.fromMnemonic(process.env.ENCRYPTION_MNEMONIC!);

    const keyFinder = new KeyFinder(encryptionHdWallet);

    web3Interface = {
      encryptionHdWallet,
      keyFinder,
      networkContexts,
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
