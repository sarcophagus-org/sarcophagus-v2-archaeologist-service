import { ethers } from "ethers";

const PATH_WITHOUT_INDEX = "m/44'/60'/0'/0/"

export class EncryptionWallet {
  public wallet: ethers.utils.HDNode;
  public index: number;

  constructor(encryptionHdWallet: ethers.utils.HDNode) {
    this.wallet = encryptionHdWallet;
    const index1000 = this.getHdNodeAtIndex(1000);
    this.derivePrivateKeyFromPublicKey(index1000.publicKey);
  }

  derivePrivateKeyFromPublicKey(publicKey: string, index: number = 0): string {
    let walletAtCurrentIndex = this.getHdNodeAtIndex(index);

    if (walletAtCurrentIndex.publicKey === publicKey) {
      return walletAtCurrentIndex.privateKey;
    } else {
      return this.derivePrivateKeyFromPublicKey(publicKey, index + 1)
    }
  }

  derivePublicKeyFromIndex() {

  }

  calculateCurrentIndex() {
    // get archaeologist sarcophagi

    // lookup events for each of these sarcophagi

    // get max creation timestamp of these sarcophagi events

    // lookup public key for the sarcophagi with that timestamp

    // get the index of that public key

    // return index + 1
  }

  getHdNodeAtIndex(index: number): ethers.utils.HDNode {
    return this.wallet.derivePath(PATH_WITHOUT_INDEX + index);
  }
}