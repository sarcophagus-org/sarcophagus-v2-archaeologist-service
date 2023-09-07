import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import {
  IERC20,
  ArchaeologistFacet__factory,
  ViewStateFacet__factory,
  ViewStateFacet,
  IERC20__factory,
  ThirdPartyFacet,
  ThirdPartyFacet__factory,
  EmbalmerFacet,
  EmbalmerFacet__factory,
} from "@sarcophagus-org/sarcophagus-v2-contracts";
import { BAD_ENV } from "../utils/exit-codes";
import { getNetworkConfigByChainId, localChainId } from "../lib/config";
import { NetworkConfig } from "../lib/types/network-config";
import { KeyFinder } from "../models/key-finder";
import { ArchaeologistFacetX } from "./web3-interface/archaeologist-facet-x";

export interface Web3Interface {
  networkName: string;
  ethWallet: ethers.Wallet;
  encryptionHdWallet: ethers.utils.HDNode;
  keyFinder: KeyFinder;
  sarcoToken: IERC20;
  archaeologistFacet: ArchaeologistFacetX;
  embalmerFacet: EmbalmerFacet;
  thirdPartyFacet: ThirdPartyFacet;
  viewStateFacet: ViewStateFacet;
  networkConfig: NetworkConfig;
}

let web3Interface: Web3Interface | undefined;

export const destroyWeb3Interface = async (): Promise<void> => {
  if (!!web3Interface) {
    web3Interface.ethWallet.provider.removeAllListeners();
    (web3Interface.ethWallet.provider as ethers.providers.WebSocketProvider)._websocket.terminate();
    web3Interface = undefined;
  }
};

export const getWeb3Interface = async (isTest?: boolean): Promise<Web3Interface> => {
  if (!!web3Interface) {
    return web3Interface;
  }

  try {
    const networkConfig = getNetworkConfigByChainId(process.env.CHAIN_ID || localChainId);
    // PROVIDER_URL should be "wss://<network>.infura.io/ws/v3/<api-key>"
    const rpcProvider = new ethers.providers.WebSocketProvider(process.env.PROVIDER_URL!);

    const ethWallet = isTest
      ? ethers.Wallet.createRandom()
      : new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);

    const encryptionHdWallet = ethers.utils.HDNode.fromMnemonic(process.env.ENCRYPTION_MNEMONIC!);

    const network = await rpcProvider.detectNetwork();

    const sarcoToken = IERC20__factory.connect(networkConfig.sarcoTokenAddress, ethWallet);

    const diamondDeployAddress =
      process.env.DIAMOND_DEPLOY_ADDRESS ?? networkConfig.diamondDeployAddress;

    const archaeologistFacet = ArchaeologistFacet__factory.connect(diamondDeployAddress, ethWallet);
    const viewStateFacet = ViewStateFacet__factory.connect(diamondDeployAddress, ethWallet);
    const thirdPartyFacet = ThirdPartyFacet__factory.connect(diamondDeployAddress, ethWallet);
    const embalmerFacet = EmbalmerFacet__factory.connect(diamondDeployAddress, ethWallet);

    const keyFinder = new KeyFinder(encryptionHdWallet);

    // Cannot confirm rpcProvider is valid until an actual network call is attempted
    sarcoToken.balanceOf(ethWallet.address);

    web3Interface = {
      networkName: network.name,
      encryptionHdWallet,
      keyFinder,
      ethWallet,
      sarcoToken,
      archaeologistFacet: new ArchaeologistFacetX(archaeologistFacet),
      embalmerFacet,
      viewStateFacet,
      thirdPartyFacet,
      networkConfig,
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
