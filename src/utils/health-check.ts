import { BigNumber, ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { NO_ONCHAIN_PROFILE, RPC_EXCEPTION } from "./exit-codes";
import { logCallout } from "../logger/formatter";
import {
  getEthBalance,
  getFreeBondBalance,
  getOnchainProfile,
  getSarcoBalance,
  inMemoryStore,
  OnchainProfile,
} from "./onchain-data";
import { formatFullPeerString, logBalances, logProfile } from "../cli/utils";
import { registerPrompt } from "../cli/prompts/register-prompt";

/**
 * Runs on service startup
 * @param web3Interface
 * @param peerId -- libp2p peer ID that will be validated with arch profile if provided
 */
export async function healthCheck(web3Interface: Web3Interface, peerId?: string) {
  try {
    const sarcoBalance = await getSarcoBalance(web3Interface);
    warnIfSarcoBalanceIsLow(sarcoBalance);

    const ethBalance = await getEthBalance(web3Interface);
    warnIfEthBalanceIsLow(ethBalance);

    const profile = await fetchProfileOrExit(web3Interface, () =>
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address)
    );

    // Validate local peerId matches the one on the profile
    if (peerId) {
      if (
        peerId !== profile.peerId &&
        peerId !== formatFullPeerString(profile.peerId, process.env.DOMAIN)
      ) {
        logCallout(async () => {
          archLogger.warn("Peer ID on profile does not match local Peer Id\n");
          archLogger.warn("Please update your profile \n");
          archLogger.warn("Your archaeologist will not appear in the embalmer webapp\n");
        });

        // TODO -- add notification once notifications are setup
        // TODO -- consider quitting and forcing user to update their profile
      }
    }

    const freeBondBalance = await getFreeBondBalance(web3Interface);
    logProfile(profile);

    logCallout(async () => {
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);

      // Free bond must be >= their min digging fee to accept new jobs
      await warnIfFreeBondIsLessThanMinDiggingFee(freeBondBalance, profile.minimumDiggingFee);
    });
  } catch (e) {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }
}

const fetchProfileOrExit = async (
  web3Interface: Web3Interface,
  logBalances: Function
): Promise<OnchainProfile> => {
  const profile = await getOnchainProfile(web3Interface);
  if (!profile.exists) {
    logCallout(() => {
      logBalances();
      archLogger.warn("\n\nARCHAEOLOGIST NOT REGISTERED:\n");
      archLogger.warn(`\nYour archaeologist is not yet registered.`);
      archLogger.warn(`\nPlease register your archaeologist using the following prompts:`);
    });

    exit(NO_ONCHAIN_PROFILE);
  }

  return profile;
};

const warnIfFreeBondIsLessThanMinDiggingFee = (
  freeBondBal: BigNumber,
  minDiggingFee: BigNumber
): void => {
  if (freeBondBal.lt(minDiggingFee)) {
    archLogger.warn(
      `\n   Your free bond is less than your minimum digging fee. You will not be able to accept new jobs!`
    );
    archLogger.error(`   Run: \`cli update -f <amount>\` to deposit some SARCO\n`);
  }
};

const warnIfEthBalanceIsLow = (ethBalance: BigNumber): void => {
  if (ethBalance.lte(ethers.utils.parseEther("0.0005"))) {
    archLogger.error(
      `\nYou have very little ETH in your account: ${ethers.utils.formatEther(
        ethBalance
      )} ETH.\nYou may not be able to sign any transactions (or do unwrappings)!\n`
    );
  }
};

const warnIfSarcoBalanceIsLow = (sarcoBalance: BigNumber): void => {
  if (sarcoBalance.lte(ethers.utils.parseEther("0.0005"))) {
    archLogger.warn(
      `\nYou have very little SARCO in your account: ${ethers.utils.formatEther(
        sarcoBalance
      )} SARCO\n`
    );
  }
};
