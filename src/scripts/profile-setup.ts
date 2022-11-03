import "dotenv/config";

import { getWeb3Interface } from "./web3-interface";
import { validateEnvVars } from "../utils/validateEnv";
import { exit } from "process";
import { FILE_READ_EXCEPTION, RPC_EXCEPTION } from "../utils/exit-codes";
import { archLogger } from "../logger/chalk-theme";
import { BigNumber, ethers } from "ethers";
import { requestApproval } from "./approve_utils";

import jsonfile from "jsonfile";
import { getOnchainProfile, inMemoryStore } from "../utils/onchain-data";
import { logProfile } from "../cli/utils";

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

const handleException = e => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
};

export async function profileSetup(
  args: ProfileParams,
  isUpdate: boolean = false,
  exitAfterTx: boolean = true
  ) {
  const { diggingFee, rewrapInterval, freeBond, peerId } = args;
  let freeBondDeposit = ethers.constants.Zero;

  if (freeBond && freeBond.gt(ethers.constants.Zero)) {
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

  let peerIdJson;

  try {
    peerIdJson = await jsonfile.readFile("./peer-id.json");
  } catch (e) {
    archLogger.error(`Error reading file: ${e}`);
    exit(FILE_READ_EXCEPTION);
  }

  const tx = isUpdate
    ? await web3Interface.archaeologistFacet.updateArchaeologist(
        peerId || peerIdJson.id,
        diggingFee,
        rewrapInterval,
        freeBondDeposit
      )
    : await web3Interface.archaeologistFacet.registerArchaeologist(
        peerId || peerIdJson.id,
        diggingFee,
        rewrapInterval,
        freeBondDeposit
      );

  archLogger.info("Waiting for transaction");

  const txInterval = setInterval(() => process.stdout.write("."), 1000);

  tx.wait()
    .then(async () => {
      clearInterval(txInterval);
      archLogger.notice(isUpdate ? "PROFILE UPDATED!" : "\nPROFILE REGISTERED!");
      const profile = await getOnchainProfile(web3Interface);
      inMemoryStore.profile = profile;
      logProfile(profile);
      if (exitAfterTx) {
        exit(0);
      }
    })
    .catch(handleException);
}