import { Web3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { fetchAndDecryptShard } from "../arweave";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";

export async function unwrapSarcophagus(web3Interface: Web3Interface, sarcoId: string) {
  archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`);
  inMemoryStore.sarcoIdsInProcessOfBeingUnwrapped.push(sarcoId);

  try {
    const decryptedShard = await fetchAndDecryptShard(web3Interface, sarcoId);

    const callUnwrapOnArchFacet = (): Promise<any> => {
      return web3Interface.archaeologistFacet.unwrapSarcophagus(
        sarcoId,
        decryptedShard
      )
    }

    const tx = await retryFn(callUnwrapOnArchFacet);
    await tx.wait();

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    archLogger.notice(`Unwrapped ${sarcoId} successfully!`);
  } catch (e) {
    archLogger.error(`Unwrap failed: ${e}`);
    handleRpcError(e.reason);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfBeingUnwrapped = inMemoryStore.sarcoIdsInProcessOfBeingUnwrapped.filter(id => id !== sarcoId)
  }
}