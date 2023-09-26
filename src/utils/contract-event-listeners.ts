import { exit } from "process";
import { destroyWeb3Interface, getWeb3Interface } from "../scripts/web3-interface";
import { RPC_EXCEPTION } from "./exit-codes";
import { inMemoryStore } from "./onchain-data";
import { archLogger } from "../logger/chalk-theme";
import { cancelSheduledPublish, schedulePublishPrivateKeyWithBuffer } from "./scheduler";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { ethers } from "ethers";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";

function getCreateSarcoHandler(network: SarcoSupportedNetwork) {
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
    const { ethWallet, viewStateFacet } = web3Interface.getNetworkContext(network);
    const archAddress = ethWallet.address;

    const isCursed = (cursedArchaeologists as string[]).includes(archAddress);
    if (!isCursed) return;

    const networkContext = (await getWeb3Interface()).getNetworkContext(network);
    const currentBlockTimestampSec = await getBlockTimestamp(networkContext);

    const scheduledResurrectionTime = schedulePublishPrivateKeyWithBuffer(
      currentBlockTimestampSec,
      sarcoId,
      resurrectionTime.toNumber(),
      network,
    );

    const archaeologist = await viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      ethWallet.address
    );

    const block = await ethWallet.provider.getBlock(event.blockNumber);
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

function getRewrapHandler(network: SarcoSupportedNetwork) {
  return async (sarcoId: string, newResurrectionTime: number) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    
    const networkContext = (await getWeb3Interface()).getNetworkContext(network);
    const currentBlockTimestampSec = await getBlockTimestamp(networkContext);
    schedulePublishPrivateKeyWithBuffer(currentBlockTimestampSec, sarcoId, newResurrectionTime, network);
  };
}

function getCleanHandler(network: SarcoSupportedNetwork) {
  return (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus cleaned: ${sarcoId}`);
    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);
  };
}

function getBuryHandler(network: SarcoSupportedNetwork) {
  return (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus buried: ${sarcoId}`);
    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    inMemoryStore.deadSarcophagusIds.push(sarcoId);
  };
}

function getAccuseHandler(network: SarcoSupportedNetwork) {
  return async (sarcoId: string) => {
    const isCursed = inMemoryStore.sarcophagi.findIndex(s => s.id === sarcoId) !== -1;
    if (!isCursed) return;

    archLogger.info(`Sarcophagus accused: ${sarcoId}`);

    // Check if sarcophagus is compromised, if so, remove from inMemoryStore
    // add to deadSarcophagusIds, and cancel scheduled publish
    const web3Interface = await getWeb3Interface();
    const { viewStateFacet } = web3Interface.getNetworkContext(network);

    const sarcoFromContract = await viewStateFacet.getSarcophagus(sarcoId);
    if (sarcoFromContract.isCompromised) {
      inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
      inMemoryStore.deadSarcophagusIds.push(sarcoId);
      cancelSheduledPublish(sarcoId);
    }
  };
}

export async function setupEventListeners(network: SarcoSupportedNetwork) {
  try {
    const web3Interface = await getWeb3Interface();
    const { ethWallet, embalmerFacet, thirdPartyFacet } = web3Interface.getNetworkContext(network);

    const filters = {
      createSarco: embalmerFacet.filters.CreateSarcophagus(),
      rewrap: embalmerFacet.filters.RewrapSarcophagus(),
      clean: thirdPartyFacet.filters.Clean(),
      bury: embalmerFacet.filters.BurySarcophagus(),
      accuse: thirdPartyFacet.filters.AccuseArchaeologist(),
    };

    const handlers = {
      createSarco: getCreateSarcoHandler(network),
      rewrap: getRewrapHandler(network),
      clean: getCleanHandler(network),
      bury: getBuryHandler(network),
      accuse: getAccuseHandler(network),
    };

    embalmerFacet.on(filters.createSarco, handlers.createSarco);
    embalmerFacet.on(filters.rewrap, handlers.rewrap);
    embalmerFacet.on(filters.clean, handlers.clean);
    embalmerFacet.on(filters.bury, handlers.bury);
    embalmerFacet.on(filters.accuse, handlers.accuse);

    ethWallet.provider.on("error", async e => {
      archLogger.error(`Provider connection error: ${e}. Reconnecting...`);
      await destroyWeb3Interface();
      setupEventListeners(network);
    });

    (ethWallet.provider as ethers.providers.WebSocketProvider)._websocket.on(
      "close",
      async e => {
        archLogger.info(`Provider WS connection closed: ${e}. Reconnecting...`);
        await destroyWeb3Interface();
        setupEventListeners(network);
      }
    );
  } catch (e) {
    console.error(e);
    exit(RPC_EXCEPTION);
  }
}
