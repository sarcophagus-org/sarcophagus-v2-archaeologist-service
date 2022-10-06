import { ethers } from "ethers";
import { exit } from "process";
import { ProfileArgNames, ProfileParams } from "../../scripts/profile-setup";
import { archLogger } from "../chalk-theme";
import { CLI_BAD_REGISTER_PROFILE_ARG } from "../exit-codes";

export async function parseRegisterArgs(): Promise<ProfileParams> {
  const argsStr = process.argv.toString().split("--")[1];

  if (!argsStr) {
    archLogger.error("Missing arguments to register. See the README for usage.");
    exit(CLI_BAD_REGISTER_PROFILE_ARG);
  }

  const args = argsStr
    .split(",")
    .map(a => a.trim())
    .filter(a => a !== "");

  const processedArgs: string[] = [];

  const registerParams: ProfileParams = {
    diggingFee: ethers.constants.Zero,
    rewrapInterval: 0,
    freeBond: ethers.constants.Zero,
  };

  args.forEach(arg => {
    const argData = arg.split(":");

    if (argData.length !== 2) {
      archLogger.error(`Unrecognized argument format: ${arg}. See the README for usage.`);
      exit(CLI_BAD_REGISTER_PROFILE_ARG);
    }

    const argName = argData[0];
    const argVal = argData[1];

    if (processedArgs.includes(argName)) {
      archLogger.error(`Duplicate argument: ${arg}`);
      exit(CLI_BAD_REGISTER_PROFILE_ARG);
    }

    switch (argName) {
      case ProfileArgNames.DIGGING_FEE:
        registerParams.diggingFee = ethers.utils.parseEther(argVal);
        processedArgs.push(argName);
        break;

      case ProfileArgNames.REWRAP_INTERVAL:
        registerParams.rewrapInterval = Number.parseInt(argVal);
        processedArgs.push(argName);
        break;

      case ProfileArgNames.FREE_BOND:
        registerParams.freeBond = ethers.utils.parseEther(argVal);
        processedArgs.push(argName);
        break;

      default:
        archLogger.error(`Unrecognized argument: ${argName}. See the README for usage.`);
        exit(CLI_BAD_REGISTER_PROFILE_ARG);
    }
  });

  // validate arguments
  if (!processedArgs.includes(ProfileArgNames.DIGGING_FEE)) {
    archLogger.error(`Missing argument to register: ${ProfileArgNames.DIGGING_FEE}`);
    exit(CLI_BAD_REGISTER_PROFILE_ARG);
  } else if (registerParams.diggingFee.eq(ethers.constants.Zero)) {
    archLogger.warn(
      `You are registering without setting a minimum digging fee. You might not receive any rewards!`
    );
  }

  if (!processedArgs.includes(ProfileArgNames.REWRAP_INTERVAL)) {
    archLogger.error(`Missing argument to register: ${ProfileArgNames.REWRAP_INTERVAL}`);
    exit(CLI_BAD_REGISTER_PROFILE_ARG);
  } else if (registerParams.rewrapInterval === 0) {
    archLogger.error(`Maximum rewrap interval cannot be 0`);
    exit(CLI_BAD_REGISTER_PROFILE_ARG);
  } else if (Number.isNaN(registerParams.rewrapInterval)) {
    archLogger.error(`Invalid valued provided for argument \`${ProfileArgNames.REWRAP_INTERVAL}\``);
    exit(CLI_BAD_REGISTER_PROFILE_ARG);
  }

  return {
    diggingFee: registerParams.diggingFee,
    rewrapInterval: registerParams.rewrapInterval,
    freeBond: registerParams.freeBond,
  };
}
