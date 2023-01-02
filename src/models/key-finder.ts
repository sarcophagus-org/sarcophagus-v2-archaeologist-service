import { ethers } from "ethers";
import { ViewStateFacet } from "@sarcophagus-org/sarcophagus-v2-contracts";

// TODO -- update to more appropriate derivation path that isn't BIP44
const PATH_WITHOUT_INDEX = "m/44'/60'/0'/0/";

export class KeyFinder {
  public wallet: ethers.utils.HDNode;
  private viewStateFacet: ViewStateFacet;

  constructor(encryptionHdWallet: ethers.utils.HDNode, viewStateFacet: ViewStateFacet) {
    this.wallet = encryptionHdWallet;
    this.viewStateFacet = viewStateFacet;
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
    const mySarcoIds = await this.viewStateFacet.getArchaeologistSarcophagi(
      this.viewStateFacet.signer.address
    );

    const privateKey = this.getHdNodeAtIndex(mySarcoIds.length + 1).privateKey;

    return ethers.utils.computePublicKey(privateKey);
  }

  getHdNodeAtIndex(index: number): ethers.utils.HDNode {
    return this.wallet.derivePath(PATH_WITHOUT_INDEX + index);
  }
}
