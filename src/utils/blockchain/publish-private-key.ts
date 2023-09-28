import { archLogger } from "../../logger/chalk-theme";
import { handleRpcError } from "../rpc-error-handler";
import { inMemoryStore } from "../onchain-data";
import { retryFn } from "./helpers";
import { warnIfEthBalanceIsLow } from "../health-check";
import { ethers } from "ethers";
import { NetworkContext } from "../../network-config";

export async function publishPrivateKey(sarcoId: string, networkContext: NetworkContext) {
  const { viewStateFacet, ethWallet, archaeologistFacet, keyFinder } = networkContext;

  archLogger.notice(`[${networkContext.networkName}] Unwrapping sarcophagus ${sarcoId}`, true);
  inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.push(sarcoId);

  try {
    const myCursedArch = await viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      ethWallet.address
    );

    const privateKey = keyFinder.derivePrivateKeyFromPublicKey(myCursedArch.publicKey);

    const callPublishPrivateKeyOnArchFacet = (): Promise<any> => {
      return archaeologistFacet.publishPrivateKey(sarcoId, privateKey);
    };

    const tx = await retryFn(callPublishPrivateKeyOnArchFacet, 0, true, `$unwrap ${sarcoId}`);
    const receipt = await tx.wait();

    const gasUsed = ethers.utils.formatEther(receipt.effectiveGasPrice.mul(receipt.gasUsed));
    const cummulativeGasUsed = ethers.utils.formatEther(
      receipt.effectiveGasPrice.mul(receipt.cumulativeGasUsed)
    );

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);

    archLogger.notice(`[${networkContext.networkName}] Unwrapped ${sarcoId} successfully!`, true);
    archLogger.debug(`[${networkContext.networkName}] Gas used: ${gasUsed.toString()} ETH`);
    archLogger.debug(
      `[${networkContext.networkName}] Cumulative Gas used: ${cummulativeGasUsed.toString()} ETH`
    );
  } catch (e) {
    await archLogger.error(`[${networkContext.networkName}] Unwrap failed: ${e}`, {
      sendNotification: true,
      logTimestamp: true,
      networkContext,
    });
    handleRpcError(e, networkContext);
  } finally {
    inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished =
      inMemoryStore.sarcoIdsInProcessOfHavingPrivateKeyPublished.filter(id => id !== sarcoId);

    await warnIfEthBalanceIsLow(networkContext, true);
  }
}
