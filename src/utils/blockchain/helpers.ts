import { archLogger } from "../../logger/chalk-theme";

const MAX_RETRIES = 5;
const INTERVAL_BETWEEN_RETRIES = 5000;
export const wait = (ms) => new Promise((res) => setTimeout(res, ms));

export const retryFn = async (fn: Function, depth = 0) => {
  try {
    return await fn();
  } catch (e) {
    archLogger.warn(`attempt ${depth + 1} failed, retrying....`);
    if (depth > MAX_RETRIES) {
      throw e;
    }

    await wait(INTERVAL_BETWEEN_RETRIES);

    return retryFn(fn, depth + 1);
  }
}