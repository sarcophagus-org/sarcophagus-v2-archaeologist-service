import { ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { CLI_BAD_STARTUP_ARGUMENT, RPC_EXCEPTION } from "./exit-codes";

export async function parseArgs(web3Interface: Web3Interface) {
    const argsStr = process.argv.toString().split("--")[1];

    if (!argsStr) return;

    const args = argsStr.split(",");

    const processedArgs: string[] = [];
    const commands: { run: Function, notice: string }[] = [];

    args.forEach(async arg => {
        const argData = arg.split(":");

        if (argData.length !== 2) {
            console.error("Unrecognized argument format:", arg);
            exit(CLI_BAD_STARTUP_ARGUMENT);
        }

        const argName = argData[0];
        const argVal = argData[1];

        if (processedArgs.includes(argName)) {
            console.error("Duplicate argument:", arg);
            exit(CLI_BAD_STARTUP_ARGUMENT);
        }

        switch (argName) {
            case "deposit":
                commands.push({
                    run: () => web3Interface.archaeologistFacet.depositFreeBond(ethers.utils.parseEther(argVal)),
                    notice: `Depositing ${argVal} SARCO into free bond`
                });

                processedArgs.push(argName);
                break;

            case "withdraw-bond":
                commands.push({
                    run: async () => web3Interface.archaeologistFacet.withdrawFreeBond(ethers.utils.parseEther(argVal)),
                    notice: `Withdrawing ${argVal} SARCO from free bond`
                });

                processedArgs.push(argName);
                break;

            case "withdraw-reward":
                commands.push({
                    run: () => web3Interface.archaeologistFacet.withdrawReward(ethers.utils.parseEther(argVal)),
                    notice: `Withdrawing ${argVal} SARCO from reward`
                });

                processedArgs.push(argName);
                break;

            default:
                console.error("Unrecognized argument:", argName);
                exit(CLI_BAD_STARTUP_ARGUMENT);
        }
    });

    try {
        commands.forEach(cmd => {
            console.log(cmd.notice);
            setTimeout(() => {
                cmd.run().catch(e => {
                    if (e.reason) {
                        handleRpcError(e.reason);
                    }
                    else {
                        console.error(e);
                    }
                    exit(RPC_EXCEPTION);
                })
            }, 500);
        });
    }
    catch (e) {
        // console.log(e);
    }
}

function handleRpcError(error: string) {
    if (error.includes("NotEnoughFreeBond")) {
        const a = error.indexOf("(") + 1;
        const b = error.indexOf(",");

        const available = error.substring(a, b);
        console.error(`"Not enough free bond. Available: ${ethers.utils.formatEther(available)} SARCO`,)
    }
}