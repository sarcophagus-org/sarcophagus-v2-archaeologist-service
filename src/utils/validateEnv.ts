import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";

import * as ethers from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";

const _tryReadEnv = (
  envName: string,
  envVar: string | undefined,
  config?: {
    required?: boolean,
    callback?: (envVar: string) => any
  }

) => {
  const isRequired = config && config.required;
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

export function validateEnvVars(isLocal?: boolean): PublicEnvConfig {
  validateLibp2pEnvVars(isLocal);

  return validateBlockEnvVars(isLocal);
}

function validateLibp2pEnvVars(isLocal?: boolean) {
  _tryReadEnv("IP_ADDRESS", process.env.IP_ADDRESS, { required: !isLocal });
  _tryReadEnv("TCP_PORT", process.env.TCP_PORT || "9000");
  _tryReadEnv("WS_PORT", process.env.WS_PORT || "10000");
  _tryReadEnv("SIGNAL_SERVER_LIST", process.env.SIGNAL_SERVER_LIST);
  _tryReadEnv("BOOTSTRAP_LIST", process.env.BOOTSTRAP_LIST, { required: false });
}

function validateBlockEnvVars(isLocal?: boolean) {
  const publicConfig: PublicEnvConfig = {
    encryptionPublicKey: "",
  };

  _tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL, { required: !isLocal });

  _tryReadEnv(
    "ETH_PRIVATE_KEY",
    process.env.ETH_PRIVATE_KEY,
    {
      required: true ,
      callback: walletPrivateKey => new ethers.Wallet(walletPrivateKey).publicKey
    }
  );

  _tryReadEnv(
    "ENCRYPTION_PRIVATE_KEY",
    process.env.ENCRYPTION_PRIVATE_KEY,
    {
      required: true,
      callback: encryptionPrivateKey =>
        (publicConfig.encryptionPublicKey = new ethers.Wallet(encryptionPrivateKey).publicKey)
    }
  );

  return publicConfig;
}
