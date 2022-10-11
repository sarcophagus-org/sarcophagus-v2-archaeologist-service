import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { validateEnvVars } from "../../utils/validateEnv";
import { getWeb3Interface } from "../../scripts/web3-interface";
import { getOnchainProfile } from "../../utils/onchain-data";
import { archLogger } from "../../logger/chalk-theme";
import { exit } from "process";
import { BigNumber } from "ethers";
import { registerOptionDefinitions } from "./config";

validateEnvVars();

const web3Interface = await getWeb3Interface();
const profile = await getOnchainProfile(web3Interface);

archLogger.notice("Registering your Archaeologist profile...");

if (profile.exists) {
  archLogger.notice("Already registered!");
  exit(0);
}

const options = commandLineArgs(registerOptionDefinitions);

if (options.help) {
  const usage = commandLineUsage([
    {
      header: 'Typical Example',
      content: 'A simple example demonstrating typical usage.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    },
    {
      content: 'Project home: {underline https://github.com/me/example}'
    }
  ])
  console.log(usage)
} else {
  console.log(options)
}