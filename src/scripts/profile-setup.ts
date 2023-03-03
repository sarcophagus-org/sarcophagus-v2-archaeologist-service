import "dotenv/config";

import { getWeb3Interface } from "./web3-interface";
import { validateEnvVars } from "../utils/validateEnv";
import { exit } from "process";
import { RPC_EXCEPTION } from "../utils/exit-codes";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { requestApproval } from "./approve_utils";

import { getOnchainProfile, inMemoryStore } from "../utils/onchain-data";
import {
  formatFullPeerString,
  loadPeerIdJsonFromFileOrExit,
  logProfile,
  ONE_MONTH_IN_SECONDS,
} from "../cli/utils";
import { handleRpcError } from "../utils/rpc-error-handler";

validateEnvVars();

export enum ProfileOptionNames {
  DIGGING_FEE = "diggingFee",
  REWRAP_INTERVAL = "rewrapInterval",
  FREE_BOND = "freeBond",
  DOMAIN = "domain",
}

export interface ProfileCliParams {
  diggingFee?: BigNumber;
  rewrapInterval?: number;
  maxResTime?: number;
  freeBond?: BigNumber;
  peerId?: string;
}

const web3Interface = await getWeb3Interface();

export async function profileSetup(
  args: ProfileCliParams,
  isUpdate: boolean = false,
  exitAfterTx: boolean = true,
  skipApproval: boolean = false
) {
  const { diggingFee, rewrapInterval, freeBond, peerId, maxResTime } = args;

  const diggingFeePerSecond = diggingFee!.div(ONE_MONTH_IN_SECONDS);

  let freeBondDeposit = ethers.constants.Zero;

  if (freeBond && freeBond.gt(ethers.constants.Zero)) {
    if (!skipApproval) {
      await requestApproval(web3Interface);
    }

    freeBondDeposit = freeBond;
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
          diggingFeePerSecond,
          freeBondDeposit!,
          freeBondDeposit,
          freeBondDeposit!
        )
      : await web3Interface.archaeologistFacet.registerArchaeologist(
          fullPeerString,
          diggingFeePerSecond,
          rewrapInterval!,
          freeBondDeposit,
          maxResTime!
        );

    archLogger.notice(`${txType} Archaeologist`);
    archLogger.info("Please wait for TX to confirm");
    await tx?.wait();

    archLogger.notice(isUpdate ? "PROFILE UPDATED!" : "\nPROFILE REGISTERED!");

    const profile = await getOnchainProfile(web3Interface);
    inMemoryStore.profile = profile;
    logProfile(profile);

    if (exitAfterTx) {
      exit(0);
    }
  } catch (error) {
    handleRpcError(error);
    exit(RPC_EXCEPTION);
  }
}
