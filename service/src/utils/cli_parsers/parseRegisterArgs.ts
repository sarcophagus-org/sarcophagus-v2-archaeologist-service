import { ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../chalk-theme";
import { CLI_BAD_REGISTER_PROFILE_ARG } from "../exit-codes";

const diggingFee = 'digging-fee';
const rewrapInterval = 'rewrap-interval';
const freeBond = 'free-bond';

export async function parseRegisterArgs(web3Interface: Web3Interface): Promise<{
    minimumDiggingFee: ethers.BigNumber;
    maximumRewrapInterval: number;
    freeBond: ethers.BigNumber;
}> {
    const argsStr = process.argv.toString().split("--")[1];

    if (!argsStr) {
        archLogger.error("Missing arguments to register");
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    }

    const args = argsStr.split(",").map(a => a.trim()).filter(a => a !== "");

    const processedArgs: string[] = [];

    const registerParams = {
        diggingFee: ethers.constants.Zero,
        rewrapInterval: 0,
        freeBond: ethers.constants.Zero,
    }

    args.forEach(arg => {
        const argData = arg.split(":");

        if (argData.length !== 2) {
            archLogger.error(`Unrecognized argument format: ${arg}`);
            exit(CLI_BAD_REGISTER_PROFILE_ARG);
        }

        const argName = argData[0];
        const argVal = argData[1];

        if (processedArgs.includes(argName)) {
            archLogger.error(`Duplicate argument: ${arg}`);
            exit(CLI_BAD_REGISTER_PROFILE_ARG);
        }

        switch (argName) {
            case diggingFee:
                registerParams.diggingFee = ethers.utils.parseEther(argVal);
                processedArgs.push(argName);
                break;

            case rewrapInterval:
                registerParams.rewrapInterval = Number.parseInt(argVal);
                processedArgs.push(argName);
                break;

            case freeBond:
                registerParams.freeBond = ethers.utils.parseEther(argVal);
                processedArgs.push(argName);
                break;

            default:
                archLogger.error(`Unrecognized argument: ${argName}`);
                exit(CLI_BAD_REGISTER_PROFILE_ARG);
        }
    })

    // validate arguments
    if (!processedArgs.includes(diggingFee)) {
        archLogger.error(`Missing argument to register: ${diggingFee}`);
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    } else if (registerParams.diggingFee.eq(ethers.constants.Zero)) {
        archLogger.warn(`You are registering without setting a minimum digging fee. You might not receive any rewards!`);
    }

    if (!processedArgs.includes(rewrapInterval)) {
        archLogger.error(`Missing arguments to register: ${rewrapInterval}`);
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    } else if (registerParams.rewrapInterval === 0) {
        archLogger.error(`Maximum rewrap interval cannot be 0`);
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    } else if (registerParams.rewrapInterval === NaN) {
        archLogger.error(`Invalid \`${rewrapInterval}\` argument: ${processedArgs.push(rewrapInterval)}`);
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    }

    return {
        minimumDiggingFee: registerParams.diggingFee,
        maximumRewrapInterval: registerParams.rewrapInterval,
        freeBond: registerParams.freeBond,
    }
}