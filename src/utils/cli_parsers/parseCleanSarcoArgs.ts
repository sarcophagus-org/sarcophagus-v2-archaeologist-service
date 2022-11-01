import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../../logger/chalk-theme";
import { CLI_BAD_CLEAN_ARG } from "../exit-codes";

export enum CleanArgNames {
  SARCO_ID = "id",
  PAYMENT_ADDRESS = "pay",
}

export interface CleanParams {
  sarcoId: string;
  paymentAddress: string;
}

export async function parseCleanSarcoArgs(): Promise<CleanParams> {
  const argsStr = process.argv.toString().split("--")[1];

  if (!argsStr) {
    archLogger.error("Missing arguments to clean. See the README for usage.");
    exit(CLI_BAD_CLEAN_ARG);
  }

  const args = argsStr
    .split(",")
    .map(a => a.trim())
    .filter(a => a !== "");

  const processedArgs: string[] = [];

  const cleanParams: CleanParams = {
    sarcoId: "",
    paymentAddress: "",
  };

  args.forEach(arg => {
    const argData = arg.split(":");

    if (argData.length !== 2) {
      archLogger.error(`Unrecognized argument format: ${arg}. See the README for usage.`);
      exit(CLI_BAD_CLEAN_ARG);
    }

    const argName = argData[0];
    const argVal = argData[1];

    if (processedArgs.includes(argName)) {
      archLogger.error(`Duplicate argument: ${arg}`);
      exit(CLI_BAD_CLEAN_ARG);
    }

    switch (argName) {
      case CleanArgNames.SARCO_ID:
        cleanParams.sarcoId = argVal;
        processedArgs.push(argName);
        break;

      case CleanArgNames.PAYMENT_ADDRESS:
        cleanParams.paymentAddress = argVal;
        processedArgs.push(argName);
        break;

      default:
        archLogger.error(`Unrecognized argument: ${argName}. See the README for usage.`);
        exit(CLI_BAD_CLEAN_ARG);
    }
  });

  // validate arguments
  if (!processedArgs.includes(CleanArgNames.SARCO_ID)) {
    archLogger.error(`Missing argument to clean: ${CleanArgNames.SARCO_ID}`);
    exit(CLI_BAD_CLEAN_ARG);
  }

  if (!processedArgs.includes(CleanArgNames.PAYMENT_ADDRESS)) {
    archLogger.error(`Missing argument to clean: ${CleanArgNames.PAYMENT_ADDRESS}`);
    exit(CLI_BAD_CLEAN_ARG);
  } else if (!ethers.utils.isAddress(cleanParams.paymentAddress)) {
    archLogger.error(`Argument ${cleanParams.paymentAddress} is not a valid ETH address`);
    exit(CLI_BAD_CLEAN_ARG);
  }

  return {
    sarcoId: cleanParams.sarcoId,
    paymentAddress: cleanParams.paymentAddress,
  };
}
