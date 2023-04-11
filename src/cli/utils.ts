import columnify from "columnify";
import commandLineArgs from "command-line-args";
import { OnchainProfile } from "../utils/onchain-data";
import { logCallout } from "../logger/formatter";
import { archLogger } from "../logger/chalk-theme";
import { formatEther } from "ethers/lib/utils";
import { exit } from "process";
import { BigNumber, ethers } from "ethers";
import jsonfile from "jsonfile";
import { FILE_READ_EXCEPTION } from "../utils/exit-codes";

const PEER_ID_DELIMITER = ":";
export const ONE_MONTH_IN_SECONDS = 2628288;

export const handleCommandArgs = (
  optionDefinitions: any,
  options: any,
  commandName: string
): any => {
  try {
    return commandLineArgs(optionDefinitions, options);
  } catch (err) {
    logCallout(() => {
      const errorName = () => {
        switch (err.name) {
          case "UNKNOWN_OPTION":
            return `You used an invalid option: ${err.optionName}`;
          case "UNKNOWN_VALUE":
            return `You used an invalid value for one of the options: ${err.value}`;
          case "ALREADY_SET":
            return `A value for option ${err.optionName} was already set.}`;
        }
      };

      archLogger.error(errorName());
      archLogger.warn(`\nPlease use:\n`);
      archLogger.info(`cli help ${commandName}\n`);
      archLogger.warn("to see list of valid options.");
    });
    exit(1);
  }
};

/**
 * Logs archaeologist on-chain profile
 * @param profile
 */
export const logProfile = (profile: OnchainProfile): void => {
  logCallout(() => {
    if (!profile.exists) {
      archLogger.error("This archaeologist is not yet registered, please run: \n");
      archLogger.error("cli help register");
    } else {
      console.log("ARCHAEOLOGIST PROFILE: \n");

      const formattedProfile = {};
      // Remove any entries where keys are numeric
      for (let [key, value] of Object.entries(profile)) {
        let formattedValue: string = value.toString();
        if (isNaN(Number(key))) {
          if (["minimumDiggingFeePerSecond", "freeBond", "cursedBond", "curseFee"].includes(key)) {
            formattedValue = `${formatEther(value)} SARCO`;

            if (key === "minimumDiggingFeePerSecond") {
              const monthlyDiggingFee = Number.parseFloat(
                formatEther((value as BigNumber).mul(ONE_MONTH_IN_SECONDS))
              ).toFixed(2);
              formattedValue = `${formattedValue} (~ ${monthlyDiggingFee}/month)`;
            }
          }

          if (key === "maximumRewrapInterval") {
            formattedValue = `${Math.trunc(value / 60 / 60 / 24)} days (${value}s)`;
          }

          if (key === "maximumResurrectionTime") {
            let dateStr = new Date(value.toNumber() * 1000).toDateString();
            dateStr = dateStr.split(" ").splice(1).join(" ");
            formattedValue = `${dateStr} (${value})`;
          }

          formattedProfile[key] = formattedValue;
        }
      }

      const privKey = process.env.ETH_PRIVATE_KEY!;
      formattedProfile["address"] = privKey.startsWith("0x")
        ? ethers.utils.computeAddress(process.env.ETH_PRIVATE_KEY!)
        : ethers.utils.computeAddress("0x" + process.env.ETH_PRIVATE_KEY!);

      console.log(columnify(formattedProfile, { columns: ["FIELD", "VALUE"] }));
    }
  });
};

export const logValidationErrorAndExit = (message: string): void => {
  logCallout(() => {
    archLogger.warn("CLI Args Validation Error:\n");
    archLogger.error(message);
  });

  exit(1);
};

export const logBalances = (
  sarcoBalance: BigNumber,
  ethBalance: BigNumber,
  address: string
): void => {
  console.log(`YOUR BALANCES (${address}):\n`);

  const balances = [
    {
      balance: "",
      ticker: "",
    },
    {
      balance: ` > ${formatEther(sarcoBalance)}`,
      ticker: "SARCO",
    },
    {
      balance: ` > ${formatEther(ethBalance)}`,
      ticker: "ETH",
    },
  ];

  console.log(columnify(balances, { minWidth: 30 }));
};

export function logNotRegistered() {
  archLogger.warn("\n\nARCHAEOLOGIST NOT REGISTERED:\n");
  archLogger.warn(
    `\nYou can use a guided walk through to register a profile by running the command:`
  );
  archLogger.info(`\ncli register --guided`);
}

export const randomIntFromInterval = (min, max) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const formatFullPeerString = (peerId: string, domain?: string): string => {
  return domain ? domain + PEER_ID_DELIMITER + peerId : peerId;
};

export async function loadPeerIdJsonFromFileOrExit(): Promise<Record<string, string>> {
  const peerIdFile = "./peer-id.json";

  try {
    return jsonfile.readFile(peerIdFile);
  } catch (e) {
    archLogger.error(`Error reading file: ${e}`);
    exit(FILE_READ_EXCEPTION);
  }
}
