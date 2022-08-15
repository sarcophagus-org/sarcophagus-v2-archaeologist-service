import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";
import { BigNumber, constants } from "ethers"

import ethers from "ethers";

const _tryReadEnv = (envName: string, envVar: string | undefined, callback?: (envVar: string) => any) => {
    if (!envVar) {
        throw Error(`${envName} not set in .env`)
    }

    if (!callback) return;

    try {
        callback(envVar);
    } catch (_) {
        throw Error(`${envName} not is invalid`)
    }
}

export function validateEnvVars(): PublicEnvConfig {
    _tryReadEnv("IP_ADDRESS", process.env.IP_ADDRESS);
    _tryReadEnv("TCP_PORT", process.env.TCP_PORT);
    _tryReadEnv("WS_PORT", process.env.WS_PORT);
    _tryReadEnv("SIGNAL_SERVER_LIST", process.env.SIGNAL_SERVER_LIST);

    if (process.env.IS_BOOTSTRAP !== "true") {
        _tryReadEnv("BOOTSTRAP_LIST", process.env.BOOTSTRAP_LIST);
    }

    const publicConfig = validateBlockEnvVars();
    return publicConfig;
}

function validateBlockEnvVars() {
    const publicConfig: PublicEnvConfig = {
        encryptionPublicKey: "",
        maxResurrectionTime: 0,
        minBounty: constants.Zero,
        minDiggingFees: constants.Zero,
        isArweaver: false,
        feePerByte: constants.Zero,
    };

    _tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL);
    _tryReadEnv("SARCO_DIAMOND_ADDRESS", process.env.SARCO_DIAMOND_ADDRESS);
    _tryReadEnv("SARCO_TOKEN_ADDRESS", process.env.SARCO_TOKEN_ADDRESS);


    _tryReadEnv("ETH_PRIVATE_KEY", process.env.ETH_PRIVATE_KEY);

    _tryReadEnv(
        "ENCRYPTION_PRIVATE_KEY",
        process.env.ENCRYPTION_PRIVATE_KEY,
        (envVar) => {
            var wallet = new ethers.Wallet(envVar);
            publicConfig.encryptionPublicKey = wallet.publicKey;
        }
    );

    _tryReadEnv(
        "MAX_RESURRECTION_TIME",
        process.env.MAX_RESURRECTION_TIME,
        (envVar) => {
            if (Number.isNaN(Number.parseInt(envVar))) throw "";
            publicConfig.maxResurrectionTime = Number.parseInt(envVar)
        }
    );
    _tryReadEnv(
        "MIN_BOUNTY",
        process.env.MIN_BOUNTY,
        (envVar) => publicConfig.minBounty = BigNumber.from(envVar)
    );
    _tryReadEnv(
        "MIN_DIGGING_FEES",
        process.env.MIN_DIGGING_FEES,
        (envVar) => publicConfig.minDiggingFees = BigNumber.from(envVar)
    );
    _tryReadEnv(
        "FEE_PER_BYTE",
        process.env.FEE_PER_BYTE,
        (envVar) => publicConfig.feePerByte = BigNumber.from(envVar)
    );
    _tryReadEnv(
        "IS_ARWEAVER",
        process.env.IS_ARWEAVER,
        (envVar) => publicConfig.isArweaver = envVar === "true"
    );

    return publicConfig;
}