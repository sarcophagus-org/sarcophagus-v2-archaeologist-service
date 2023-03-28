import { getWeb3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";
import { warnIfEthBalanceIsLow } from "../health-check";
import { ethers } from "ethers";

export async function publishPrivateKey(sarcoId: string) {
  const web3Interface = await getWeb3Interface();
  archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`, true);
  inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.push(sarcoId);

  try {
    const myCursedArch = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      web3Interface.ethWallet.address
    );

    const privateKey = web3Interface.keyFinder.derivePrivateKeyFromPublicKey(
      myCursedArch.publicKey
    );

    const callPublishPrivateKeyOnArchFacet = (): Promise<any> => {
      return web3Interface.archaeologistFacet.publishPrivateKey(sarcoId, privateKey);
    };

    const tx = await retryFn(callPublishPrivateKeyOnArchFacet, 0, true, `$unwrap ${sarcoId}`);
    const receipt = await tx.wait();

    const gasUsed = ethers.utils.formatEther(receipt.effectiveGasPrice.mul(receipt.gasUsed));
    const cummulativeGasUsed = ethers.utils.formatEther(
      receipt.effectiveGasPrice.mul(receipt.cumulativeGasUsed)
    );

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);

    archLogger.notice(`Unwrapped ${sarcoId} successfully!`, true);
    archLogger.debug(`Gas used: ${gasUsed.toString()} ETH`);
    archLogger.debug(`Cumulative Gas used: ${cummulativeGasUsed.toString()} ETH`);
  } catch (e) {
    archLogger.error(`Unwrap failed: ${e}`, true);
    await warnIfEthBalanceIsLow();
    handleRpcError(e);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished =
      inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.filter(id => id !== sarcoId);
  }
}
