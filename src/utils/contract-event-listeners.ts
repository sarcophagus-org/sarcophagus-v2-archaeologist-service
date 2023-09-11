import { exit } from "process";
import { destroyWeb3Interface, getWeb3Interface } from "../scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore } from "./onchain-data";
import { archLogger } from "../logger/chalk-theme";
import { cancelSheduledPublish, schedulePublishPrivateKeyWithBuffer } from "./scheduler";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { ethers } from "ethers";

function getCreateSarcoHandler() {
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
    const web3Interface = await getWeb3Interface();
    const archAddress = web3Interface.ethWallet.address;

    const isCursed = (cursedArchaeologists as string[]).includes(archAddress);
    if (!isCursed) return;

    const currentBlockTimestampSec = await getBlockTimestamp();

    const scheduledResurrectionTime = schedulePublishPrivateKeyWithBuffer(
      currentBlockTimestampSec,
      sarcoId,
      resurrectionTime.toNumber()
    );

    const archaeologist = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      web3Interface.ethWallet.address
    );

    const block = await web3Interface.ethWallet.provider.getBlock(event.blockNumber);
    const creationDate = getDateFromTimestamp(block.timestamp);

    inMemoryStore.sarcophagi.push({
      id: sarcoId,
      resurrectionTime: scheduledResurrectionTime,
      perSecondFee: archaeologist.diggingFeePerSecond,
      cursedAmount: archaeologist.curseFee,
      creationDate,
    });
  };
}

function getRewrapHandler() {
  return async (sarcoId: string, newResurrectionTime: number) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    const currentBlockTimestampSec = await getBlockTimestamp();
    schedulePublishPrivateKeyWithBuffer(currentBlockTimestampSec, sarcoId, newResurrectionTime);
  };
}

function getCleanHandler() {
  return (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus cleaned: ${sarcoId}`);
    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);
  };
}

function getBuryHandler() {
  return (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus buried: ${sarcoId}`);
    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);
  };
}

function getAccuseHandler() {
  return async (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus accused: ${sarcoId}`);

    // Check if sarcophagus is compromised, if so, remove from inMemoryStore
    // add to deadSarcophagusIds, and cancel scheduled publish
    const web3Interface = await getWeb3Interface();
    const sarcoFromContract = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);
    if (sarcoFromContract.isCompromised) {
      inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
      inMemoryStore.deadSarcophagusIds.push(sarcoId);
      cancelSheduledPublish(sarcoId);
    }
  };
}

export async function setupEventListeners() {
  try {
    const web3Interface = await getWeb3Interface();

    const filters = {
      createSarco: web3Interface.embalmerFacet.filters.CreateSarcophagus(),
      rewrap: web3Interface.embalmerFacet.filters.RewrapSarcophagus(),
      clean: web3Interface.thirdPartyFacet.filters.Clean(),
      bury: web3Interface.embalmerFacet.filters.BurySarcophagus(),
      accuse: web3Interface.thirdPartyFacet.filters.AccuseArchaeologist(),
    };

    const handlers = {
      createSarco: getCreateSarcoHandler(),
      rewrap: getRewrapHandler(),
      clean: getCleanHandler(),
      bury: getBuryHandler(),
      accuse: getAccuseHandler(),
    };

    web3Interface.embalmerFacet.on(filters.createSarco, handlers.createSarco);
    web3Interface.embalmerFacet.on(filters.rewrap, handlers.rewrap);
    web3Interface.embalmerFacet.on(filters.clean, handlers.clean);
    web3Interface.embalmerFacet.on(filters.bury, handlers.bury);
    web3Interface.embalmerFacet.on(filters.accuse, handlers.accuse);

    web3Interface.ethWallet.provider.on("error", async e => {
      archLogger.error(`Provider connection error: ${e}. Reconnecting...`);
      await destroyWeb3Interface();
      setupEventListeners();
    });

    (web3Interface.ethWallet.provider as ethers.providers.WebSocketProvider)._websocket.on(
      "close",
      async e => {
        archLogger.info(`Provider WS connection closed: ${e}. Reconnecting...`);
        await destroyWeb3Interface();
        setupEventListeners();
      }
    );
  } catch (e) {
    console.error(e);
    exit(RPC_EXCEPTION);
  }
}
