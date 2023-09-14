import "dotenv/config";
import * as ethers from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";
import { getNetworkConfigByChainId, isLocalNetwork } from "../lib/config";
import { hardhatNetworkConfig } from "../lib/config/hardhat";

const _tryReadEnv = (
  envName: string,
  envVar: string | undefined,
  config?: {
    required?: boolean;
    callback?: (envVar: string) => any;
  }
) => {
  const isRequired = config && config.required;
  if (isRequired && !envVar) {
    archLogger.error(`${envName} is required and not set in .env`, { logTimestamp: true });
    exit(BAD_ENV);
  } else if (!envVar) {
    return;
  }

  if (!config || !config.callback) return;

  try {
    config.callback(envVar);
  } catch (e) {
    archLogger.debug(e);
    archLogger.error(`${envName} is invalid: ${envVar}`, { logTimestamp: true });
    exit(BAD_ENV);
  }
};

export function validateEnvVars() {
  const chainID = isLocalNetwork ? hardhatNetworkConfig.chainId.toString() : process.env.CHAIN_ID;
  _tryReadEnv("CHAIN_ID", chainID, {
    required: true,
    callback: envVar => {
      getNetworkConfigByChainId(envVar);
    },
  });

  _tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL, { required: true });
  _tryReadEnv("ETH_PRIVATE_KEY", process.env.ETH_PRIVATE_KEY, { required: true });
  _tryReadEnv("ENCRYPTION_MNEMONIC", process.env.ENCRYPTION_MNEMONIC, {
    required: true,
    callback: mnemonic => {
      if (!ethers.utils.isValidMnemonic(mnemonic)) {
        throw new Error(
          "Invalid mnemonic. Make sure you have set the correct <NETWORK>_ENCRYPTION_MNEMONIC environment variable."
        );
      }

      // Make sure there are no duplicate mnemonics in the .env file
      //
      // Notes:
      // The quickstart archaeologist, which uses this repo in dockerized form, will read from the respective
      // <NETWORK>_ENCRYPTION_MNEMONIC env variables, and set the ENCRYPTION_MNEMONIC env variable.
      //
      // This means as far as the context running container is concerned, the ENCRYPTION_MNEMONIC env variable
      // is used (while not set directly in `.env`), and that is actually what need to be checked for validity.
      //
      // Effectively, the correct <NETWORK>_ENCRYPTION_MNEMONIC env variable is checked for validity by the code above.
      //
      // However the env file does still contain all mnemonic variants (if set by user), which are still readable.
      // We can thus separately check for duplicates.
      const mnemonics: string[] = [];
      if (!!process.env.ETH_ENCRYPTION_MNEMONIC) {
        mnemonics.push(process.env.ETH_ENCRYPTION_MNEMONIC!);
      }

      if (!!process.env.GOERLI_ENCRYPTION_MNEMONIC) {
        mnemonics.push(process.env.GOERLI_ENCRYPTION_MNEMONIC);
      }

      if (!!process.env.SEPOLIA_ENCRYPTION_MNEMONIC) {
        mnemonics.push(process.env.SEPOLIA_ENCRYPTION_MNEMONIC);
      }

      const hasDuplicates = mnemonics.some((val, i) => mnemonics.indexOf(val) !== i);
      if (hasDuplicates) {
        throw new Error(
          "Duplicate mnemonics. \
        Be sure to set different <NETWORK>_ENCRYPTION_MNEMONIC environment variables \
        for each network you intend to run on."
        );
      }
    },
  });

  // TODO -- add validation for domain if it is present
}
