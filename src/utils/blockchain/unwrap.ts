import { Web3Interface } from "../../scripts/web3-interface";
import { archLogger } from "../../logger/chalk-theme";
import { fetchAndDecryptShard } from "../arweave";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";

const MAX_RETRIES = 5;
const INTERVAL_BETWEEN_RETRIES = 5000;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const unwrapSarcophagusWithRetry = async (unwrapFn: Function, depth = 0) => {
  try {
    return await unwrapFn();
  } catch (e) {
    archLogger.warn(`Unwrap attempt ${depth + 1} failed, retrying....`);
    if (depth > MAX_RETRIES) {
      throw e;
    }

    await wait(INTERVAL_BETWEEN_RETRIES);

    return unwrapSarcophagusWithRetry(unwrapFn, depth + 1);
  }
}

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

    const tx = await unwrapSarcophagusWithRetry(callUnwrapOnArchFacet);
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