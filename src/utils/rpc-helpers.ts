import { archLogger } from "../logger/chalk-theme";

interface RpcCallWithTimeoutOptions {
  timeout: number;
  retries: number;
}
export async function rpcCallWithTimeout(
  rpcFunction,
  args,
  options: RpcCallWithTimeoutOptions = {
    timeout: 5000,
    retries: 5
  }
) {
  const {
    timeout,
    retries,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeout);
      });

      // Use Promise.race to race the async call against the timeout
      return await Promise.race([
        rpcFunction(...args),
        timeoutPromise
      ]);
    } catch (e) {
      lastError = e;
      archLogger.notice(`rpcCallWithTimeout Attempt ${attempt} failed: ${e.message}`);
      if (attempt === retries) {
        throw e; // Re-throw the last error if all retries failed
      }
    }
  }

  throw lastError; // Throw last error in case loop exited unexpectedly
}