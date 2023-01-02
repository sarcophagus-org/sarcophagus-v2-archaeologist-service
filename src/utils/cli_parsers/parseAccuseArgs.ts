import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../../logger/chalk-theme";
import { CLI_BAD_ACCUSE_ARG, FILE_READ_EXCEPTION } from "../exit-codes";

import jsonfile from "jsonfile";

// TODO -- update accuse to work with CLI and new private key setup
export enum AccuseArgNames {
  SARCO_ID = "id",
  PAYMENT_ADDRESS = "pay",
  SHARDS_FILEPATH = "shards-filepath",
}

interface AccuseCliParams {
  sarcoId: string;
  paymentAddress: string;
  shardHashesFilePath: string;
}

export interface AccuseContractParams {
  sarcoId: string;
  paymentAddress: string;
  keyShareHashes: string[];
}

export async function parseAccuseArgs(): Promise<AccuseContractParams> {
  const argsStr = process.argv.toString().split("--")[1];

  if (!argsStr) {
    archLogger.error("Missing arguments to accuse. See the README for usage.");
    exit(CLI_BAD_ACCUSE_ARG);
  }

  const args = argsStr
    .split(",")
    .map(a => a.trim())
    .filter(a => a !== "");

  const processedArgs: string[] = [];

  const accuseParams: AccuseCliParams = {
    sarcoId: "",
    paymentAddress: "",
    shardHashesFilePath: "",
  };

  args.forEach(arg => {
    const argData = arg.split(":");

    if (argData.length !== 2) {
      archLogger.error(`Unrecognized argument format: ${arg}. See the README for usage.`);
      exit(CLI_BAD_ACCUSE_ARG);
    }

    const argName = argData[0];
    const argVal = argData[1];

    if (processedArgs.includes(argName)) {
      archLogger.error(`Duplicate argument: ${arg}`);
      exit(CLI_BAD_ACCUSE_ARG);
    }

    switch (argName) {
      case AccuseArgNames.SARCO_ID:
        accuseParams.sarcoId = argVal;
        processedArgs.push(argName);
        break;

      case AccuseArgNames.PAYMENT_ADDRESS:
        accuseParams.paymentAddress = argVal;
        processedArgs.push(argName);
        break;

      case AccuseArgNames.SHARDS_FILEPATH:
        accuseParams.shardHashesFilePath = argVal;
        processedArgs.push(argName);
        break;

      default:
        archLogger.error(`Unrecognized argument: ${argName}. See the README for usage.`);
        exit(CLI_BAD_ACCUSE_ARG);
    }
  });

  // validate arguments
  if (!processedArgs.includes(AccuseArgNames.SARCO_ID)) {
    archLogger.error(`Missing argument to accuse: ${AccuseArgNames.SARCO_ID}`);
    exit(CLI_BAD_ACCUSE_ARG);
  }

  if (!processedArgs.includes(AccuseArgNames.PAYMENT_ADDRESS)) {
    archLogger.error(`Missing argument to accuse: ${AccuseArgNames.PAYMENT_ADDRESS}`);
    exit(CLI_BAD_ACCUSE_ARG);
  } else if (!ethers.utils.isAddress(accuseParams.paymentAddress)) {
    archLogger.error(`Argument ${accuseParams.paymentAddress} is not a valid ETH address`);
    exit(CLI_BAD_ACCUSE_ARG);
  }

  let keyShareHashes: string[];

  if (!processedArgs.includes(AccuseArgNames.SHARDS_FILEPATH)) {
    archLogger.error(`Missing argument to accuse: ${AccuseArgNames.SHARDS_FILEPATH}`);
    exit(CLI_BAD_ACCUSE_ARG);
  } else {
    try {
      const csvJson = await jsonfile.readFile(accuseParams.shardHashesFilePath);
      keyShareHashes = csvJson.map(hash => hash.trim());
    } catch (e) {
      archLogger.error(`Error reading file: ${e}`);
      exit(FILE_READ_EXCEPTION);
    }
  }

  return {
    sarcoId: accuseParams.sarcoId,
    paymentAddress: accuseParams.paymentAddress,
    keyShareHashes,
  };
}
