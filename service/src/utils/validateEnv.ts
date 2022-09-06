import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";

import ethers from "ethers";
import { archLogger } from "./chalk-theme";
import { BAD_ENV } from "./exit-codes";
import { exit } from "process";

const _tryReadEnv = (envName: string, envVar: string | undefined, callback?: (envVar: string) => any) => {
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
}

export function validateEnvVars(): PublicEnvConfig {
    _tryReadEnv("IP_ADDRESS", process.env.IP_ADDRESS);
    _tryReadEnv("TCP_PORT", process.env.TCP_PORT);
    _tryReadEnv("WS_PORT", process.env.WS_PORT);
    _tryReadEnv("SIGNAL_SERVER_LIST", process.env.SIGNAL_SERVER_LIST);

    _tryReadEnv("ARWEAVE_HOST", process.env.ARWEAVE_HOST);
    _tryReadEnv("ARWEAVE_PORT", process.env.ARWEAVE_PORT, (envVar) => { if (Number.isNaN(Number.parseFloat(envVar))) throw ""; });
    _tryReadEnv("ARWEAVE_PROTOCOL", process.env.ARWEAVE_PROTOCOL);
    _tryReadEnv("ARWEAVE_TIMEOUT", process.env.ARWEAVE_TIMEOUT, (envVar) => { if (Number.isNaN(Number.parseFloat(envVar))) throw ""; });
    _tryReadEnv("ARWEAVE_LOGGING", process.env.ARWEAVE_LOGGING);

    if (process.env.IS_BOOTSTRAP !== "true") {
        _tryReadEnv("BOOTSTRAP_LIST", process.env.BOOTSTRAP_LIST);
    }

    const publicConfig = validateBlockEnvVars();
    return publicConfig;
}

function validateBlockEnvVars() {
    const publicConfig: PublicEnvConfig = {
        encryptionPublicKey: "",
    };

    _tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL);

    _tryReadEnv("SARCO_DIAMOND_ADDRESS", process.env.SARCO_DIAMOND_ADDRESS, (envVar) => {
        if (!ethers.utils.isAddress(envVar)) throw "";
    });

    _tryReadEnv("SARCO_TOKEN_ADDRESS", process.env.SARCO_TOKEN_ADDRESS, (envVar) => {
        if (!ethers.utils.isAddress(envVar)) throw "";
    });


    _tryReadEnv(
        "ETH_PRIVATE_KEY",
        process.env.ETH_PRIVATE_KEY,
        (envVar) => new ethers.Wallet(envVar).publicKey,
    );

    _tryReadEnv(
        "ENCRYPTION_PRIVATE_KEY",
        process.env.ENCRYPTION_PRIVATE_KEY,
        (envVar) => publicConfig.encryptionPublicKey = new ethers.Wallet(envVar).publicKey,
    );

    return publicConfig;
}