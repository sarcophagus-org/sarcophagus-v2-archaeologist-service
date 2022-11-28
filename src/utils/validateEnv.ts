import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";
import * as ethers from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";
import { getNetworkConfigByChainId, isLocalNetwork } from "../lib/config";
import { goerliNetworkConfig } from "../lib/config/goerli";
import { hardhatNetworkConfig } from "../lib/config/hardhat";

// TODO: update to mainnet when that time comes.
const DEFAULT_CHAIN_ID = goerliNetworkConfig.chainId.toString();

const _tryReadEnv = (
  envName: string,
  envVar: string | undefined,
  config?: {
    required?: boolean,
    callback?: (envVar: string) => any
  }
) => {
  const isRequired = (config && config.required);
  if (isRequired && !envVar) {
    archLogger.error(`${envName} is required and not set in .env`);
    exit(BAD_ENV);
  } else if (!envVar) {
    return
  }

  if (!config || !config.callback) return;

  try {
    config.callback(envVar);
  } catch (_) {
    archLogger.error(`${envName} is invalid`);
    exit(BAD_ENV);
  }
};

// TODO
export function validateEnvVars(): PublicEnvConfig {
  _tryReadEnv("CHAIN_ID", process.env.CHAIN_ID || DEFAULT_CHAIN_ID, {
    callback: envVar => {
      getNetworkConfigByChainId(envVar)
    }
  });

  return validateBlockEnvVars(isLocalNetwork);
}

function validateBlockEnvVars(isLocal?: boolean) {
  const publicConfig: PublicEnvConfig = {
    encryptionPublicKey: "",
  };

  const providerURL = isLocal ? hardhatNetworkConfig.providerUrl : process.env.PROVIDER_URL;

  _tryReadEnv("PROVIDER_URL", providerURL, {required: true});

  _tryReadEnv(
    "ETH_PRIVATE_KEY",
    process.env.ETH_PRIVATE_KEY,
    {
      required: true,
      callback: walletPrivateKey =>
        (publicConfig.encryptionPublicKey = new ethers.Wallet(walletPrivateKey).publicKey)
    }
  );

  return publicConfig;
}
