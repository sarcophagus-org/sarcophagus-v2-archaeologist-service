import { ethers } from "ethers";
import { getSarcophagiIds } from "../utils/onchain-data";
import { getWeb3Interface } from "../scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";

// TODO -- update to more appropriate derivation path that isn't BIP44
const PATH_WITHOUT_INDEX = "m/44'/60'/0'/0/";

export class KeyFinder {
  public wallet: ethers.utils.HDNode;
  private chainId: number;

  constructor(encryptionHdWallet: ethers.utils.HDNode, chainId: number) {
    this.wallet = encryptionHdWallet;
    this.chainId = chainId;
  }

  deriveHdWalletFromPublicKey(publicKey: string, index: number = 0): ethers.utils.HDNode {
    let walletAtCurrentIndex = this.getHdNodeAtIndex(index);

    const uncompressedPublicKey = ethers.utils.computePublicKey(walletAtCurrentIndex.privateKey);

    if (uncompressedPublicKey === publicKey) {
      return walletAtCurrentIndex;
    } else {
      return this.deriveHdWalletFromPublicKey(publicKey, index + 1);
    }
  }

  derivePrivateKeyFromPublicKey(publicKey: string, index: number = 0): string {
    const currentWallet = this.deriveHdWalletFromPublicKey(publicKey);
    return currentWallet.privateKey;
  }

  // runs during sarcophagus negotiation to determine current public key
  async getNextPublicKey() {
    const web3interface = await getWeb3Interface();
    archLogger.debug(`looking up next public key on chainID: ${this.chainId}`);
    const networkContext = web3interface.getNetworkContext(this.chainId);

    const mySarcoIds = await getSarcophagiIds(networkContext);
    archLogger.debug(`current sarcophagi count: ${mySarcoIds.length}`);
    archLogger.debug(`current sarcophagi IDs: ${mySarcoIds}`);
    const privateKey = this.getHdNodeAtIndex(mySarcoIds.length + 1).privateKey;

    return ethers.utils.computePublicKey(privateKey);
  }

  getHdNodeAtIndex(index: number): ethers.utils.HDNode {
    return this.wallet.derivePath(PATH_WITHOUT_INDEX + index);
  }
}
