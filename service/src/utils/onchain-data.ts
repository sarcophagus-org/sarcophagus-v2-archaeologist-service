import { BigNumber } from "ethers";
import { Web3Interface } from "scripts/web3-interface";
import { fetchAndDecryptShard } from "./arweave";
import { archLogger } from "../logger/chalk-theme";
import { handleRpcError } from "./rpc-error-handler";
import { scheduleUnwrap } from "./scheduler";

export interface OnchainProfile {
  exists: boolean;
  minimumDiggingFee: BigNumber;
  maximumRewrapInterval: BigNumber;
  freeBond: BigNumber;
  cursedBond: BigNumber;
  peerId: string;
}

interface SarcophagusData {
  id: string;
  resurrectionTime: Date;
}

interface InMemoryStore {
  sarcophagi: SarcophagusData[];
  profile?: OnchainProfile;
}

export const inMemoryStore: InMemoryStore = {
  sarcophagi: [],
};

export async function retrieveAndStoreOnchainProfileAndSarcophagi(web3Interface: Web3Interface) {
  inMemoryStore.sarcophagi = await getOnchainCursedSarcophagi(web3Interface);
  inMemoryStore.profile = await getOnchainProfile(web3Interface);
}

export async function getOnchainProfile(web3Interface: Web3Interface): Promise<OnchainProfile> {
  return web3Interface.viewStateFacet.getArchaeologistProfile(web3Interface.ethWallet.address);
}

export async function getSarcoBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.sarcoToken.balanceOf(web3Interface.ethWallet.address);
}

export async function getEthBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.signer.getBalance();
}

export async function getFreeBondBalance(web3Interface: Web3Interface): Promise<BigNumber> {
  return web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
}

export async function getOnchainCursedSarcophagi(
  web3Interface: Web3Interface
): Promise<SarcophagusData[]> {
  const archSarco: SarcophagusData[] = [];

  const sarcoIds = await web3Interface.viewStateFacet.getArchaeologistSarcophagi(
    web3Interface.ethWallet.address
  );
  sarcoIds.map(async sarcoId => {
    const sarco = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);
    const archStorage = await web3Interface.viewStateFacet.getSarcophagusArchaeologist(
      sarcoId,
      web3Interface.ethWallet.address
    );

    if (sarco.state === SarcophagusState.Exists && !archStorage.unencryptedShard) {
      const nowTimestampInSeconds = new Date().getTime() / 1000;
      // TODO: rename resurrectionWindow to gracePeriod when contract updates merged
      const tooLateToUnwrap =
        sarco.resurrectionTime.toNumber() + sarco.resurrectionWindow.toNumber() <
        nowTimestampInSeconds;

      if (tooLateToUnwrap) {
        archLogger.warn(`You failed to unwrap a Sarcophagus on time: ${sarcoId}\n`);
        // TODO: archaeologist might want to call clean here

        return;
      }

      // only add unwrappable sarco that have state === EXISTS and haven't already unwrapped (uploaded their unencrypted shard)
      const resurrectionTime = new Date(sarco.resurrectionTime.toNumber() * 1000);
      archSarco.push({
        id: sarcoId,
        resurrectionTime,
      });

      // Schedule an uwrap job for each sarco this arch is cursed on. `scheduleUnwrap` will cancel existing
      // schedules, so no duplicate jobs will be created.

      // NOTE: It is marginally possible that the arch node and a sarco it's bonded to end up in a state where
      // the sarco's resurrection time is past, but we're still within its grace period. In that case,
      // scheduling a job won't work as resurrection time is in the past, so we'll want immediately attempt
      // a rewrap in an effort to salvage the situation.
      if (nowTimestampInSeconds > sarco.resurrectionTime.toNumber()) {
        unwrapSarcophagus(web3Interface, sarcoId);
      } else {
        scheduleUnwrap(web3Interface, sarcoId, resurrectionTime);
      }
    }
  });

  return archSarco;
}

export async function unwrapSarcophagus(web3Interface: Web3Interface, sarcoId: string) {
  archLogger.notice(`Unwrapping sarcophagus ${sarcoId}`);

  const decryptedShard = await fetchAndDecryptShard(web3Interface, sarcoId);

  if (!decryptedShard) {
    archLogger.error("Unwrap failed -- unable to decrypt shard");
    return;
  }

  try {
    await web3Interface.archaeologistFacet.unwrapSarcophagus(sarcoId, decryptedShard);

    inMemoryStore.sarcophagi = inMemoryStore.sarcophagi.filter(s => s.id !== sarcoId);
    archLogger.notice("Unwrapped successfully!");
  } catch (e) {
    archLogger.error("Unwrap failed");
    handleRpcError(e.reason);
  }
}

export enum SarcophagusState {
  DoesNotExist,
  Exists,
  Done,
}
