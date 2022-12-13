import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";
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
    archLogger.error(`${envName} is required and not set in .env`);
    exit(BAD_ENV);
  } else if (!envVar) {
    return;
  }

  if (!config || !config.callback) return;

  try {
    config.callback(envVar);
  } catch (_) {
    archLogger.error(`${envName} is invalid`);
    exit(BAD_ENV);
  }
};

export function validateEnvVars(): PublicEnvConfig {
  const chainID = isLocalNetwork ? hardhatNetworkConfig.chainId.toString() : process.env.CHAIN_ID;
  _tryReadEnv("CHAIN_ID", chainID, {
    required: true,
    callback: envVar => {
      getNetworkConfigByChainId(envVar);
    },
  });

  const providerURL = isLocalNetwork ? hardhatNetworkConfig.providerUrl : process.env.PROVIDER_URL;
  _tryReadEnv("PROVIDER_URL", providerURL, { required: true });
  _tryReadEnv("ETH_PRIVATE_KEY", process.env.ETH_PRIVATE_KEY, { required: true });
  _tryReadEnv("ENCRYPTION_MNEMONIC", process.env.ENCRYPTION_MNEMONIC,
    {
      required: true,
      callback: mnemonic => {
        ethers.utils.HDNode.fromMnemonic(mnemonic);
      },
    });

  // TODO -- add validation for domain if it is present
}
