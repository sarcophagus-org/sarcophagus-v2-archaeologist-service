import { getWeb3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";

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

    const tx = await retryFn(async () => await callPublishPrivateKeyOnArchFacet());
    await tx.wait();

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    archLogger.notice(`Unwrapped ${sarcoId} successfully!`);
  } catch (e) {
    archLogger.error(`Unwrap failed: ${e}`);
    handleRpcError(e);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished =
      inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.filter(id => id !== sarcoId);
  }
}
