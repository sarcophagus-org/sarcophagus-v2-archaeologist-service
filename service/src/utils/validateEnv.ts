import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";

import ethers from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";

const _tryReadEnv = (
  envName: string,
  envVar: string | undefined,
  callback?: (envVar: string) => any
) => {
  if (!envVar) {
    archLogger.error(`${envName} not set in .env`);
    exit(BAD_ENV);
  }

  if (!callback) return;

  try {
    callback(envVar);
  } catch (_) {
    archLogger.error(`${envName} is invalid`);
    exit(BAD_ENV);
  }
};

export function validateEnvVars(): PublicEnvConfig {
  validateLibp2pEnvVars();
  validateArweaveEnvVars();

  return validateBlockEnvVars();
}

function validateLibp2pEnvVars() {
  _tryReadEnv("IP_ADDRESS", process.env.IP_ADDRESS);
  _tryReadEnv("TCP_PORT", process.env.TCP_PORT);
  _tryReadEnv("WS_PORT", process.env.WS_PORT);
  _tryReadEnv("SIGNAL_SERVER_LIST", process.env.SIGNAL_SERVER_LIST);
  if (process.env.IS_BOOTSTRAP !== "true") {
    _tryReadEnv("BOOTSTRAP_LIST", process.env.BOOTSTRAP_LIST);
  }
}

function validateArweaveEnvVars() {
  _tryReadEnv("ARWEAVE_HOST", process.env.ARWEAVE_HOST);
  _tryReadEnv("ARWEAVE_PORT", process.env.ARWEAVE_PORT, envVar => {
    if (Number.isNaN(Number.parseFloat(envVar))) throw "";
  });
  _tryReadEnv("ARWEAVE_PROTOCOL", process.env.ARWEAVE_PROTOCOL);
  _tryReadEnv("ARWEAVE_TIMEOUT", process.env.ARWEAVE_TIMEOUT, envVar => {
    if (Number.isNaN(Number.parseFloat(envVar))) throw "";
  });
  _tryReadEnv("ARWEAVE_LOGGING", process.env.ARWEAVE_LOGGING);
}

function validateBlockEnvVars() {
  const publicConfig: PublicEnvConfig = {
    encryptionPublicKey: "",
  };

  _tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL);

  _tryReadEnv("SARCO_DIAMOND_ADDRESS", process.env.SARCO_DIAMOND_ADDRESS, sarcoDiamondAddress => {
    if (!ethers.utils.isAddress(sarcoDiamondAddress)) throw "";
  });

  _tryReadEnv("SARCO_TOKEN_ADDRESS", process.env.SARCO_TOKEN_ADDRESS, sarcoTokenAddress => {
    if (!ethers.utils.isAddress(sarcoTokenAddress)) throw "";
  });

  _tryReadEnv(
    "ETH_PRIVATE_KEY",
    process.env.ETH_PRIVATE_KEY,
    walletPrivateKey => new ethers.Wallet(walletPrivateKey).publicKey
  );

  _tryReadEnv(
    "ENCRYPTION_PRIVATE_KEY",
    process.env.ENCRYPTION_PRIVATE_KEY,
    encryptionPrivateKey =>
      (publicConfig.encryptionPublicKey = new ethers.Wallet(encryptionPrivateKey).publicKey)
  );

  return publicConfig;
}
