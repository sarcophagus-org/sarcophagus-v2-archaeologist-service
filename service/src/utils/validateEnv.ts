import "dotenv/config";
import { PublicEnvConfig } from "models/env-config";
import { BigNumber, constants } from "ethers"

import ethers from "ethers";

const tryReadEnv = (envName: string, envVar: string | undefined, operation?: (envVar: string) => any) => {
    if (!envVar) {
        throw Error(`${envName} not set in .env`)
    }

    if (!operation) return;

    try {
        operation(envVar);
    } catch (_) {
        throw Error(`${envName} not is invalid`)
    }
}

export function validateEnvVars(): PublicEnvConfig {
    tryReadEnv("IP_ADDRESS", process.env.IP_ADDRESS);
    tryReadEnv("TCP_PORT", process.env.TCP_PORT);
    tryReadEnv("WS_PORT", process.env.WS_PORT);
    tryReadEnv("SIGNAL_SERVER_LIST", process.env.SIGNAL_SERVER_LIST);

    if (process.env.IS_BOOTSTRAP !== "true") {
        tryReadEnv("BOOTSTRAP_LIST", process.env.BOOTSTRAP_LIST);
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

    tryReadEnv("CHAIN_ID", process.env.CHAIN_ID, (envVar) => Number.parseInt(envVar));
    tryReadEnv("PROVIDER_URL", process.env.PROVIDER_URL);
    tryReadEnv("SARCO_DIAMOND_ADDRESS", process.env.SARCO_DIAMOND_ADDRESS);
    tryReadEnv("SARCO_TOKEN_ADDRESS", process.env.SARCO_TOKEN_ADDRESS);


    tryReadEnv("ETH_PRIVATE_KEY", process.env.ETH_PRIVATE_KEY);

    tryReadEnv(
        "ENCRYPTION_PRIVATE_KEY",
        process.env.ENCRYPTION_PRIVATE_KEY,
        (envVar) => {
            var wallet = new ethers.Wallet(envVar);
            publicConfig.encryptionPublicKey = wallet.publicKey;
        }
    );

    tryReadEnv(
        "MAX_RESURRECTION_TIME",
        process.env.MAX_RESURRECTION_TIME,
        (envVar) => publicConfig.maxResurrectionTime = Number.parseInt(envVar)
    );
    tryReadEnv(
        "MIN_BOUNTY",
        process.env.MIN_BOUNTY,
        (envVar) => publicConfig.minBounty = BigNumber.from(envVar)
    );
    tryReadEnv(
        "MIN_DIGGING_FEES",
        process.env.MIN_DIGGING_FEES,
        (envVar) => publicConfig.minDiggingFees = BigNumber.from(envVar)
    );
    tryReadEnv(
        "FEE_PER_BYTE",
        process.env.FEE_PER_BYTE,
        (envVar) => publicConfig.feePerByte = BigNumber.from(envVar)
    );
    tryReadEnv(
        "IS_ARWEAVER",
        process.env.IS_ARWEAVER,
        (envVar) => publicConfig.isArweaver = envVar === "true"
    );

    if (!process.env.INFURA_API_KEY && !process.env.ALCHEMY_API_KEY && !process.env.ETHERSCAN_API_KEY) {
        throw Error("None of INFURA_API_KEY, ALCHEMY_API_KEY or ETHERSCAN_API_KEY set in .env")
    }

    return publicConfig;
}