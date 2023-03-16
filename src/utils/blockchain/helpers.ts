import { ethers } from "ethers";
import { getNetworkConfigByChainId, localChainId } from "lib/config";
import { archLogger } from "../../logger/chalk-theme";

const MAX_RETRIES = 5;
const INTERVAL_BETWEEN_RETRIES = 5000;
export const wait = ms => new Promise(res => setTimeout(res, ms));

export const retryFn = async (fn: Function, depth = 0) => {
  try {
    return await fn();
  } catch (e) {
    archLogger.debug(`attempt ${depth + 1} failed, retrying....`);
    if (depth > MAX_RETRIES) {
      throw e;
    }

    await wait(INTERVAL_BETWEEN_RETRIES);

    return retryFn(fn, depth + 1);
  }
};

export const getBlockTimestampMs = async () => {
  const networkConfig = getNetworkConfigByChainId(process.env.CHAIN_ID || localChainId);
  const provider = new ethers.providers.JsonRpcProvider(
    networkConfig.providerUrl || process.env.PROVIDER_URL
  );
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);

  // Converting the time to milliseconds as per javascript standard
  return block.timestamp * 1000;
};
