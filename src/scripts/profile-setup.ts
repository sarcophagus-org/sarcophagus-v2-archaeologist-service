import "dotenv/config";

import { getWeb3Interface } from "./web3-interface";
import { validateEnvVars } from "../utils/validateEnv";
import { exit } from "process";
import { RPC_EXCEPTION } from "../utils/exit-codes";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { requestApproval } from "./approve_utils";

import { getOnchainProfile, inMemoryStore } from "../utils/onchain-data";
import { formatFullPeerString, loadPeerIdJsonFromFileOrExit, logProfile } from "../cli/utils";

validateEnvVars();

export enum ProfileOptionNames {
  DIGGING_FEE = "diggingFee",
  REWRAP_INTERVAL = "rewrapInterval",
  FREE_BOND = "freeBond",
}

export interface ProfileParams {
  diggingFee?: BigNumber;
  rewrapInterval?: number;
  freeBond?: BigNumber;
  peerId?: string;
}

const web3Interface = await getWeb3Interface();

export async function profileSetup(
  args: ProfileParams,
  isUpdate: boolean = false,
  exitAfterTx: boolean = true,
  skipApproval?: boolean
) {
  const { diggingFee, rewrapInterval, freeBond, peerId } = args;

  let freeBondDeposit = ethers.constants.Zero;

  if (freeBond && freeBond.gt(ethers.constants.Zero)) {
    if (skipApproval) {
      freeBondDeposit = freeBond;
    } else {
      const approved = await requestApproval(
        web3Interface,
        "You will need to approve Sarcophagus contracts to use your SARCO in order to deposit free bond.\nEnter 'approve' to authorize this, or else hit <ENTER> to continue without a deposit:",
        freeBond
      );

      if (approved) {
        freeBondDeposit = freeBond;
      } else {
        archLogger.info("Skipping free bond deposit");
      }
    }
  }

  const domain = process.env.DOMAIN;
  let peerIdJson = await loadPeerIdJsonFromFileOrExit();
  const pId = peerId || peerIdJson.id;

  // If using websockets with a domain, use a delimiter
  // to store domain + peerId on the contracts
  const fullPeerString = formatFullPeerString(pId, domain);

  try {
    const txType = isUpdate ? "Updating" : "Registering";
    const tx = isUpdate
      ? await web3Interface.archaeologistFacet.updateArchaeologist(
          fullPeerString,
          diggingFee,
          rewrapInterval,
          freeBondDeposit
        )
      : await web3Interface.archaeologistFacet.registerArchaeologist(
          fullPeerString,
          diggingFee,
          rewrapInterval,
          freeBondDeposit
        );

    archLogger.notice(`${txType} Archaeologist`);
    archLogger.info("Please wait for TX to confirm");
    await tx.wait();

    archLogger.notice(isUpdate ? "PROFILE UPDATED!" : "\nPROFILE REGISTERED!");

    const profile = await getOnchainProfile(web3Interface);
    inMemoryStore.profile = profile;
    logProfile(profile);

    if (exitAfterTx) {
      exit(0);
    }
  } catch (error) {
    archLogger.error(error);
    exit(RPC_EXCEPTION);
  }
}
