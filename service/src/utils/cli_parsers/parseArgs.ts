import { ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../chalk-theme";
import { CLI_BAD_STARTUP_ARG, RPC_EXCEPTION } from "../exit-codes";
import { healthCheck } from "../health-check";
import { handleRpcError } from "../rpc-error-handler";

export async function parseArgs(web3Interface: Web3Interface) {
    const argsStr = process.argv.toString().split("--")[1];

    if (!argsStr) {
        healthCheck(web3Interface);
        return;
    }

    const args = argsStr.split(",").map(a => a.trim()).filter(a => a !== "");

    const processedArgs: string[] = [];
    const commands: {
        cmdName: string,
        run: () => Promise<any>,
        notice: string,
        onComplete?: Function,
    }[] = [];

    let doExit = false;

    args.forEach(arg => {
        const argData = arg.split(":");

        if (argData.length !== 2) {
            archLogger.error(`Unrecognized argument format: ${arg}`);
            exit(CLI_BAD_STARTUP_ARG);
        }

        const argName = argData[0];
        const argVal = argData[1];

        if (processedArgs.includes(argName)) {
            archLogger.error(`Duplicate argument: ${arg}`);
            exit(CLI_BAD_STARTUP_ARG);
        }

        switch (argName) {
            case "q":
            case "exit":
            case "end":
            case "quit":
                doExit = true;
                break;

            case "deposit-bond":
                commands.push({
                    cmdName: argName,
                    run: () => web3Interface.archaeologistFacet.depositFreeBond(ethers.utils.parseEther(argVal)),
                    notice: `Depositing ${argVal} SARCO into free bond...`
                });

                processedArgs.push(argName);
                break;

            case "withdraw-bond":
                commands.push({
                    cmdName: argName,
                    run: () => web3Interface.archaeologistFacet.withdrawFreeBond(ethers.utils.parseEther(argVal)),
                    notice: `Withdrawing ${argVal} SARCO from free bond...`
                });

                processedArgs.push(argName);
                break;

            case "withdraw-reward":
                commands.push({
                    cmdName: argName,
                    run: () => web3Interface.archaeologistFacet.withdrawReward(ethers.utils.parseEther(argVal)),
                    notice: `Withdrawing ${argVal} SARCO from reward...`
                });

                processedArgs.push(argName);
                break;

            case "rewards":
                commands.push({
                    cmdName: argName,
                    run: async () => web3Interface.viewStateFacet.getAvailableRewards(web3Interface.ethWallet.address),
                    notice: `Querying contract...`,
                    onComplete: (reward: ethers.BigNumberish) => archLogger.info(`\nRewards Available: ${ethers.utils.formatEther(reward)} SARCO`),
                });

                processedArgs.push(argName);
                break;

            case "free-bond":
                commands.push({
                    cmdName: argName,
                    run: async () => web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address),
                    notice: `Querying contract...`,
                    onComplete: (bond: ethers.BigNumberish) => archLogger.info(`\nFree Bond Available: ${ethers.utils.formatEther(bond)} SARCO`),

                });

                processedArgs.push(argName);
                break;

            default:
                archLogger.error(`Unrecognized argument: ${argName}`);
                exit(CLI_BAD_STARTUP_ARG);
        }
    })

    let intervalIds: Record<string, any> = {};
    let cmdPromises: Promise<void>[] = [];
    for await (const cmd of commands) {
        process.stdout.write(`\n${cmd.notice}`);

        const cmdPromise = new Promise<void>((resolve, reject) => {
            intervalIds[cmd.cmdName] = setInterval(() => process.stdout.write("."), 1000);

            const _runCommand = () => {
                cmd.run().then(async res => {
                    if (res.wait) {
                        try {
                            await res.wait();
                            if (cmd.onComplete) cmd.onComplete();
                            else archLogger.info("SUCCESS");
                            resolve();
                        } catch (e) {
                            reject();
                        } finally {
                            clearInterval(intervalIds[cmd.cmdName]);
                        }
                    } else {
                        clearInterval(intervalIds[cmd.cmdName]);

                        if (cmd.onComplete) cmd.onComplete(res);
                        else archLogger.info("SUCCESS");
                        resolve();
                    }
                }).catch(e => {
                    if (e.reason) {
                        handleRpcError(e.reason);
                    }
                    else {
                        archLogger.error(e);
                    }
                    exit(RPC_EXCEPTION);
                });
            }

            // Give user time to change their mind and CTRL+C out of this process with this timeout
            setTimeout(() => _runCommand(), 2000);
        });

        cmdPromises.push(cmdPromise);
    }

    Promise.all(cmdPromises).then(() =>
        doExit ?
            exit(0) :
            healthCheck(web3Interface)
    ).catch((e) => {
        archLogger.error(e);
        exit(RPC_EXCEPTION);
    });;
}