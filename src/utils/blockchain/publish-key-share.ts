import { Web3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { fetchAndDecryptShard } from "../arweave";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";

export async function publishKeyShare(web3Interface: Web3Interface, sarcoId: string) {
  archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`);
  inMemoryStore.sarcoIdsInProcessOfHavingKeySharesPublished.push(sarcoId);

  try {
    const decryptedShard = await fetchAndDecryptShard(web3Interface, sarcoId);

    const callPublishKeyShareOnArchFacet = (): Promise<any> => {
      return web3Interface.archaeologistFacet.unwrapSarcophagus(
        sarcoId,
        decryptedShard
      )
    }

    const tx = await retryFn(callPublishKeyShareOnArchFacet);
    await tx.wait();

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    archLogger.notice(`Unwrapped ${sarcoId} successfully!`);
  } catch (e) {
    archLogger.error(`Unwrap failed: ${e}`);
    handleRpcError(e.reason);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfHavingKeySharesPublished = inMemoryStore.sarcoIdsInProcessOfHavingKeySharesPublished.filter(id => id !== sarcoId)
  }
}