import { exit } from "process";
import { destroyWeb3Interface, getWeb3Interface } from "../scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore } from "./onchain-data";
import { archLogger } from "../logger/chalk-theme";
import { cancelSheduledPublish, schedulePublishPrivateKeyWithBuffer } from "./scheduler";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { ethers } from "ethers";
import { getNetworkContextByChainId, NetworkContext } from "../network-config";

function getCreateSarcoHandler(networkContext: NetworkContext) {
  return async (
    sarcoId,
    sarcoName,
    resurrectionTime,
    creationTime,
    embalmer,
    recipient,
    cursedArchaeologists,
    totalDiggingFees,
    arweaveTxId,
    event
  ) => {
    const { viewStateFacet, ethWallet } = networkContext;
    const archAddress = ethWallet.address;

    const isCursed = (cursedArchaeologists as string[]).includes(archAddress);
    if (!isCursed) return;

    const currentBlockTimestampSec = await getBlockTimestamp(networkContext);

    const scheduledResurrectionTime = schedulePublishPrivateKeyWithBuffer(
      currentBlockTimestampSec,
      sarcoId,
      resurrectionTime.toNumber(),
      networkContext
    );

    const archaeologist = await viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      ethWallet.address
    );

    const block = await ethWallet.provider.getBlock(event.blockNumber);
    const creationDate = getDateFromTimestamp(block.timestamp);

    inMemoryStore.get(networkContext.chainId)!.sarcophagi.push({
      id: sarcoId,
      resurrectionTime: scheduledResurrectionTime,
      perSecondFee: archaeologist.diggingFeePerSecond,
      cursedAmount: archaeologist.curseFee,
      creationDate,
    });
  };
}

function getRewrapHandler(networkContext: NetworkContext) {
  return async (sarcoId: string, newResurrectionTime: number) => {
    const isCursed =
      inMemoryStore.get(networkContext.chainId)!.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    const currentBlockTimestampSec = await getBlockTimestamp(networkContext);
    schedulePublishPrivateKeyWithBuffer(
      currentBlockTimestampSec,
      sarcoId,
      newResurrectionTime,
      networkContext
    );
  };
}

function getCleanHandler(networkContext: NetworkContext) {
  return (sarcoId: string) => {
    const isCursed =
      inMemoryStore.get(networkContext.chainId)!.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus cleaned: ${sarcoId}`);
    inMemoryStore.get(networkContext.chainId)!.sarcophagi = inMemoryStore
      .get(networkContext.chainId)!
      .sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.get(networkContext.chainId)!.deadSarcophagusIds.push(sarcoId);
  };
}

function getBuryHandler(networkContext: NetworkContext) {
  return (sarcoId: string) => {
    const isCursed =
      inMemoryStore.get(networkContext.chainId)!.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`[${networkContext.networkName}] Sarcophagus buried: ${sarcoId}`);
    inMemoryStore.get(networkContext.chainId)!.sarcophagi = inMemoryStore
      .get(networkContext.chainId)!
      .sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.get(networkContext.chainId)!.deadSarcophagusIds.push(sarcoId);
  };
}

function getAccuseHandler(networkContext: NetworkContext) {
  return async (sarcoId: string) => {
    const isCursed =
      inMemoryStore.get(networkContext.chainId)!.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`[${networkContext.networkName}] Sarcophagus accused: ${sarcoId}`);

    // Check if sarcophagus is compromised, if so, remove from inMemoryStore
    // add to deadSarcophagusIds, and cancel scheduled publish
    const { viewStateFacet } = networkContext;

    const sarcoFromContract = await viewStateFacet.getSarcophagus(sarcoId);
    if (sarcoFromContract.isCompromised) {
      inMemoryStore.get(networkContext.chainId)!.sarcophagi = inMemoryStore
        .get(networkContext.chainId)!
        .sarcophagi.filter(s => s.id !== sarcoId);
      inMemoryStore.get(networkContext.chainId)!.deadSarcophagusIds.push(sarcoId);
      cancelSheduledPublish(sarcoId);
    }
  };
}

export async function setupEventListeners(networkContext: NetworkContext) {
  try {
    const { embalmerFacet, thirdPartyFacet, ethWallet } = networkContext;
    const filters = {
      createSarco: embalmerFacet.filters.CreateSarcophagus(),
      rewrap: embalmerFacet.filters.RewrapSarcophagus(),
      clean: thirdPartyFacet.filters.Clean(),
      bury: embalmerFacet.filters.BurySarcophagus(),
      accuse: thirdPartyFacet.filters.AccuseArchaeologist(),
    };

    const handlers = {
      createSarco: getCreateSarcoHandler(networkContext),
      rewrap: getRewrapHandler(networkContext),
      clean: getCleanHandler(networkContext),
      bury: getBuryHandler(networkContext),
      accuse: getAccuseHandler(networkContext),
    };

    embalmerFacet.on(filters.createSarco, handlers.createSarco);
    embalmerFacet.on(filters.rewrap, handlers.rewrap);
    embalmerFacet.on(filters.clean, handlers.clean);
    embalmerFacet.on(filters.bury, handlers.bury);
    embalmerFacet.on(filters.accuse, handlers.accuse);

    ethWallet.provider.on("error", async e => {
      archLogger.error(
        `[${networkContext.networkName}] Provider connection error: ${e}. Reconnecting...`
      );
      await destroyWeb3Interface();
      setupEventListeners(networkContext);
    });

    (ethWallet.provider as ethers.providers.WebSocketProvider)._websocket.on("close", async e => {
      archLogger.info(
        `[${networkContext.networkName}] Provider WS connection closed: ${e}. Reconnecting...`
      );

      const newNetworkContext: NetworkContext = getNetworkContextByChainId(4);
      (await getWeb3Interface()).networkContexts.delete(networkContext);
      (await getWeb3Interface()).networkContexts.add(newNetworkContext);

      setupEventListeners(newNetworkContext);
    });
  } catch (e) {
    console.error(e);
    exit(RPC_EXCEPTION);
  }
}
