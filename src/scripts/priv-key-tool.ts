import "dotenv/config";
import { ethers } from "ethers";
import { KeyFinder } from "../models/key-finder";

if(!process.env.ENCRYPTION_MNEMONIC!) {
  console.log("please add ENCRYPTION_MNEMONIC to env file")
}

if(!process.env.INDEX) {
  console.log("please pass in INDEX to call to this script")
}

const encryptionHdWallet = ethers.utils.HDNode.fromMnemonic(process.env.ENCRYPTION_MNEMONIC!);

const keyFinder = new KeyFinder(encryptionHdWallet);

const privKey = keyFinder.derivePrivateKeyAtIndex(process.env.INDEX || 1);
console.log("private key at index:", process.env.INDEX);
console.log(privKey)