import { getWeb3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { handleRpcError } from "../rpc-error-handler";
import { getEthBalance, inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";
import { warnIfEthBalanceIsLow } from "../../utils/health-check";

export async function publishPrivateKey(sarcoId: string) {
  const web3Interface = await getWeb3Interface();
  archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`);
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

    const tx = await retryFn(callPublishPrivateKeyOnArchFacet);
    const receipt = await tx.wait();

    const gasUsed = receipt.getTransactionReceipt().gasUsed;

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);

    archLogger.notice(`Unwrapped ${sarcoId} successfully!`);
    archLogger.debug(`Gas used: ${gasUsed.toString()}`);
  } catch (e) {
    archLogger.error(`Unwrap failed: ${e}`);
    await warnIfEthBalanceIsLow();
    handleRpcError(e);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished =
      inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.filter(id => id !== sarcoId);
  }
}
