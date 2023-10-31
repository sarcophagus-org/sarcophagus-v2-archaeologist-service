import "dotenv/config";
import * as ethers from "ethers";
import { archLogger } from "../logger/chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";

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

const _validateProviderUrl = (urlString: string | undefined, networkName: string) => {
  if (urlString === undefined) return; // Nothing to validate as provider url is not set.

  let url: URL;
  try {
    url = new URL(urlString);
  } catch (_) {
    throw new Error(`Invalid ${networkName} provider url: ${urlString}}`);
  }

  if (url.protocol !== "wss:") {
    throw new Error(`Invalid ${networkName} provider protocol: ${url.protocol}`);
  }
};

const _validateEncryptionMnemonic = (mnemonic: string | undefined, networkName: string) => {
  if (mnemonic === undefined) return; // Nothing to validate as mnemonic is not set.

  if (!ethers.utils.isValidMnemonic(mnemonic)) {
    throw new Error(`Invalid ${networkName} mnemonic: ${mnemonic}.`);
  }
};

export function validateEnvVars() {
  _tryReadEnv("CHAIN_IDS", process.env.CHAIN_IDS, {
    required: true,
    callback: envVar => {
      const parsedIds = envVar.split(",");
      if (envVar.split(",").length === 0) {
        throw new Error("CHAIN_IDS must be a comma separated list of chain ids");
      }

      parsedIds.forEach(parsedId => {
        const chainId = Number.parseInt(parsedId.trim());
        if (isNaN(chainId)) {
          throw new Error(`Invalid chain id: ${parsedId}`);
        }
      });
    },
  });

  // On <NETWORK>_PROVIDER_URL Validation:
  // Cannot confirm rpcProvider is valid until an actual network call is attempted
  // This is done in src/network-config.ts -> getNetworkContextByChainId
  _tryReadEnv("MAINNET_PROVIDER_URL", process.env.MAINNET_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "mainnet"),
  });
  _tryReadEnv("GOERLI_PROVIDER_URL", process.env.GOERLI_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "goerli"),
  });
  _tryReadEnv("SEPOLIA_PROVIDER_URL", process.env.SEPOLIA_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "sepolia"),
  });
  _tryReadEnv("BASE_GOERLI_PROVIDER_URL", process.env.BASE_GOERLI_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "baseGoerli"),
  });
  _tryReadEnv("POLYGON_MAINNET_PROVIDER_URL", process.env.POLYGON_MAINNET_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "polygonMainnet"),
  });
  _tryReadEnv("POLYGON_MUMBAI_PROVIDER_URL", process.env.POLYGON_MUMBAI_PROVIDER_URL, {
    required: false,
    callback: envVar => _validateProviderUrl(envVar, "polygonMumbai"),
  });

  _tryReadEnv("MAINNET_ENCRYPTION_MNEMONIC", process.env.MAINNET_ENCRYPTION_MNEMONIC, {
    required: false,
    callback: envVar => _validateEncryptionMnemonic(envVar, "mainnet"),
  });
  _tryReadEnv("GOERLI_ENCRYPTION_MNEMONIC", process.env.GOERLI_ENCRYPTION_MNEMONIC, {
    required: false,
    callback: envVar => _validateEncryptionMnemonic(envVar, "goerli"),
  });
  _tryReadEnv("SEPOLIA_ENCRYPTION_MNEMONIC", process.env.SEPOLIA_ENCRYPTION_MNEMONIC, {
    required: false,
    callback: envVar => _validateEncryptionMnemonic(envVar, "sepolia"),
  });
  _tryReadEnv("BASE_GOERLI_ENCRYPTION_MNEMONIC", process.env.BASE_GOERLI_ENCRYPTION_MNEMONIC, {
    required: false,
    callback: envVar => _validateEncryptionMnemonic(envVar, "baseGoerli"),
  });
  _tryReadEnv(
    "POLYGON_MAINNET_ENCRYPTION_MNEMONIC",
    process.env.POLYGON_MAINNET_ENCRYPTION_MNEMONIC,
    {
      required: false,
      callback: envVar => _validateEncryptionMnemonic(envVar, "polygonMainnet"),
    }
  );
  _tryReadEnv(
    "POLYGON_MUMBAI_ENCRYPTION_MNEMONIC",
    process.env.POLYGON_MUMBAI_ENCRYPTION_MNEMONIC,
    {
      required: false,
      callback: envVar => _validateEncryptionMnemonic(envVar, "polygonMumbai"),
    }
  );

  _tryReadEnv("ETH_PRIVATE_KEY", process.env.ETH_PRIVATE_KEY, { required: true });

  // Make sure there are no duplicate mnemonics in the .env file
  const mnemonics = [
    process.env.MAINNET_ENCRYPTION_MNEMONIC,
    process.env.GOERLI_ENCRYPTION_MNEMONIC,
    process.env.SEPOLIA_ENCRYPTION_MNEMONIC,
    process.env.BASE_GOERLI_ENCRYPTION_MNEMONIC,
    process.env.POLYGON_MUMBAI_ENCRYPTION_MNEMONIC,
    process.env.POLYGON_MAINNET_ENCRYPTION_MNEMONIC,
  ].filter(mnemonic => !!mnemonic);

  const hasDuplicates = mnemonics.some((val, i) => mnemonics.indexOf(val) !== i);
  if (hasDuplicates) {
    throw new Error(
      "Duplicate mnemonics. \
    Be sure to set different <NETWORK>_ENCRYPTION_MNEMONIC environment variables \
    for each network you intend to run on."
    );
  }

  _tryReadEnv("DOMAIN", process.env.DOMAIN, {
    required: true,
    callback: envVar => {
      try {
        const prefix = "https://";
        new URL(prefix + envVar);
      } catch (_) {
        throw new Error(
          `Invalid domain url: ${envVar}. Make sure the domain is of format <subdomain>.<domain>.<domain-extension>`
        );
      }
    },
  });
}
