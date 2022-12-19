import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import {
  IERC20,
  ArchaeologistFacet__factory,
  EmbalmerFacet__factory,
  ViewStateFacet__factory,
  ArchaeologistFacet,
  EmbalmerFacet,
  ViewStateFacet,
  IERC20__factory,
  ThirdPartyFacet,
  ThirdPartyFacet__factory,
} from "@sarcophagus-org/sarcophagus-v2-contracts";
import { BAD_ENV } from "../utils/exit-codes";
import { getNetworkConfigByChainId, localChainId } from "../lib/config";
import { NetworkConfig } from "../lib/types/network-config";
import { KeyFinder } from "../models/key-finder";

export interface Web3Interface {
  networkName: string;
  ethWallet: ethers.Wallet;
  encryptionHdWallet: ethers.utils.HDNode;
  keyFinder: KeyFinder;
  sarcoToken: IERC20;
  archaeologistFacet: ArchaeologistFacet;
  embalmerFacet: EmbalmerFacet;
  thirdPartyFacet: ThirdPartyFacet;
  viewStateFacet: ViewStateFacet;
  networkConfig: NetworkConfig;
}

// TODO -- consider instantiating this once per session, or memo-izing with cache timeout
export const getWeb3Interface = async (isTest?: boolean): Promise<Web3Interface> => {
  try {
    const networkConfig = getNetworkConfigByChainId(process.env.CHAIN_ID || localChainId);

    const rpcProvider = new ethers.providers.JsonRpcProvider(
      networkConfig.providerUrl || process.env.PROVIDER_URL
    );

    // TODO -- if the mnemonic needs to gen the wallet for signing key
    // this will need updated
    const ethWallet = isTest
      ? ethers.Wallet.createRandom()
      : new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);
    const signer = ethWallet;

    const encryptionHdWallet = ethers.utils.HDNode.fromMnemonic(process.env.ENCRYPTION_MNEMONIC!);

    const network = await rpcProvider.detectNetwork();

    const sarcoToken = IERC20__factory.connect(networkConfig.sarcoTokenAddress, signer);

    const embalmerFacet = EmbalmerFacet__factory.connect(
      networkConfig.diamondDeployAddress,
      signer
    );
    const archaeologistFacet = ArchaeologistFacet__factory.connect(
      networkConfig.diamondDeployAddress,
      signer
    );
    const viewStateFacet = ViewStateFacet__factory.connect(
      networkConfig.diamondDeployAddress,
      signer
    );
    const thirdPartyFacet = ThirdPartyFacet__factory.connect(
      networkConfig.diamondDeployAddress,
      signer
    );

    const keyFinder = new KeyFinder(encryptionHdWallet, viewStateFacet);

    // Cannot confirm rpcProvider is valid until an actual network call is attempted
    sarcoToken.balanceOf(ethWallet.address);

    return {
      networkName: network.name,
      encryptionHdWallet,
      keyFinder,
      ethWallet,
      sarcoToken,
      archaeologistFacet,
      embalmerFacet,
      viewStateFacet,
      thirdPartyFacet,
      networkConfig,
    } as Web3Interface;
  } catch (e) {
    archLogger.error(e);
    archLogger.error("Confirm PROVIDER_URL in .env is a valid RPC Provider URL");
    exit(BAD_ENV);
  }
};
