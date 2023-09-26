import { NetworkContext } from "network-config";
import { archLogger } from "../../logger/chalk-theme";

const MAX_RETRIES = 2;
const INTERVAL_BETWEEN_RETRIES = 5000;
export const wait = ms => new Promise(res => setTimeout(res, ms));

export const retryFn = async (fn: Function, depth = 0, randomize = false, logOutput = "") => {
  try {
    return await fn();
  } catch (e) {
    archLogger.warn(`${logOutput} attempt ${depth + 1} failed, retrying....`, true);
    if (depth > MAX_RETRIES) {
      throw e;
    }

    if (randomize) {
      await wait(INTERVAL_BETWEEN_RETRIES * getRandomInt(3, 30));
    } else {
      await wait(INTERVAL_BETWEEN_RETRIES);
    }

    return retryFn(fn, depth + 1, randomize, logOutput);
  }
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getBlockTimestamp = async (networkContext: NetworkContext): Promise<number> => {
  try {
    const provider = networkContext.ethWallet.provider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);

    return block.timestamp;
  } catch (error) {
    // Not a good fallback, may want to institute a retry or failure (or notification)
    archLogger.warn(`Error retrieving block time: ${error}`, true);
    return Math.trunc(Date.now() / 1000);
  }
};

export const getDateFromTimestamp = (timestamp: number) => new Date(timestamp * 1000);
