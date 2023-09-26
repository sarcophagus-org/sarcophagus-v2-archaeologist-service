import "dotenv/config";
import inquirer from "inquirer";
import { getWeb3Interface } from "./web3-interface";
import { BigNumber } from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { runApprove } from "../utils/blockchain/approve";
import { DENIED_APPROVAL } from "../utils/exit-codes";
import { exit } from "process";
import { SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";

export const hasAllowance = async (amt: BigNumber, network?: SarcoSupportedNetwork) => {
  const web3Interface = await getWeb3Interface();
  const { sarcoToken, ethWallet, networkConfig } = web3Interface.getNetworkContext(network);

  const allowance = await sarcoToken.allowance(
    ethWallet.address,
    networkConfig.diamondDeployAddress
  );

  return allowance.gte(amt);
};

/**
 * Request approval from user to spend SARCO. Will terminate the process if the user rejects the request.
 */
export const requestApproval = async (network?: SarcoSupportedNetwork) => {
  const approvalAnswer = await inquirer.prompt([
    {
      type: "confirm",
      name: "approval",
      message:
        "Do you approve the Sarcophagus contract to spend your SARCO? You must agree to continue.",
      default: true,
    },
  ]);

  // If user does not agree to approval, then exit
  if (!approvalAnswer.approval) {
    archLogger.error("You denied approval, quitting register archaeologist.");
    exit(DENIED_APPROVAL);
  }

  await runApprove(network);
};
