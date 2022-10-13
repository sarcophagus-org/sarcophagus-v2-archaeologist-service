import columnify from "columnify";
import commandLineArgs from "command-line-args";
import { OnchainProfile } from "../utils/onchain-data";
import { logCallout } from "../logger/formatter";
import { archLogger } from "../logger/chalk-theme";
import { formatEther } from "ethers/lib/utils";
import { exit } from "process";
import { BigNumber, ethers } from "ethers";

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
        if (isNaN(Number(key))) {
          if (["minimumDiggingFee", "freeBond", "cursedBond"].includes(key)) {
            value = `${formatEther(value)} SARCO`;
          }
          formattedProfile[key] = value;
        }
      }

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

// TODO: may want to separate these balances in the CLI UX (sarco/eth balance VS. free bond)
// maybe with horizontal separator or something
export const logBalances = (
  sarcoBalance: BigNumber,
  ethBalance: BigNumber,
  freeBondBalance: BigNumber
): void => {
  console.log(" YOUR BALANCES:\n");

  const balances = [
    {
      field: "SARCO",
      balance: formatEther(sarcoBalance),
      ticker: "SARCO",
    },
    {
      field: "ETHER",
      balance: formatEther(ethBalance),
      ticker: "ETH",
    },
    {
      field: "Free Bond",
      balance: formatEther(freeBondBalance),
      ticker: "SARCO",
    },
  ];

  console.log(columnify(balances, { minWidth: 20 }));
};
