import { ethers } from "ethers";

export const signPacked = async (
  ethWallet: ethers.Wallet,
  types: string[],
  data: string[]
): Promise<string> => {
  const dataHex = ethers.utils.defaultAbiCoder.encode(types, data);
  const dataHash = ethers.utils.keccak256(dataHex);
  const dataHashBytes = ethers.utils.arrayify(dataHash);
  return ethWallet.signMessage(dataHashBytes);
};
