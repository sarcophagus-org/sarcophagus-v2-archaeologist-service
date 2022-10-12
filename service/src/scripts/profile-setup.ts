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

validateEnvVars();

export enum ProfileArgNames {
  DIGGING_FEE = "digging-fee",
  REWRAP_INTERVAL = "rewrap-interval",
  FREE_BOND = "free-bond",
}

export interface ProfileParams {
  diggingFee: BigNumber;
  rewrapInterval: number;
  freeBond: BigNumber;
}

const web3Interface = await getWeb3Interface();

const handleException = e => {
  archLogger.error(e);
  exit(RPC_EXCEPTION);
};

export async function profileSetup(args: ProfileParams, isUpdate: boolean = false) {
  const { diggingFee, rewrapInterval, freeBond } = args;
  let freeBondDeposit = ethers.constants.Zero;

  if (freeBond.gt(ethers.constants.Zero)) {
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
        peerIdJson.id,
        diggingFee,
        rewrapInterval,
        freeBondDeposit
      )
    : await web3Interface.archaeologistFacet.registerArchaeologist(
        peerIdJson.id,
        diggingFee,
        rewrapInterval,
        freeBondDeposit
      );

  archLogger.info("Waiting for transaction");
  setInterval(() => process.stdout.write("."), 1000);

  tx.wait()
    .then(async () => {
      archLogger.notice(isUpdate ? "PROFILE UPDATED!" : "\nPROFILE REGISTERED!");
      inMemoryStore.profile = await getOnchainProfile(web3Interface);
      exit(0);
    })
    .catch(handleException);
}
