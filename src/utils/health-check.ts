import { BigNumber, ethers } from "ethers";
import { exit } from "process";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { RPC_EXCEPTION, NO_ONCHAIN_PROFILE } from "./exit-codes";
import { logCallout } from "../logger/formatter";
import {
  getEthBalance,
  getFreeBondBalance,
  getOnchainProfile,
  getSarcoBalance,
  OnchainProfile,
} from "./onchain-data";
import { logBalances, logProfile } from "../cli/utils";

/**
 * Runs on service startup
 * @param web3Interface
 * @param peerId -- libp2p peer ID that will be validated with arch profile if provided
 */
export async function healthCheck(web3Interface: Web3Interface, peerId?: string) {
  try {
    const profile = await fetchProfileOrPromptProfileSetup(web3Interface);

    // Validate local peerId matches the one on the profile
    if (peerId) {
      if (peerId !== profile.peerId) {
        logCallout( async () => {
          archLogger.warn("Peer ID on profile does not match local Peer Id\n");
          archLogger.warn("Your archaeologist will not appear in the embalmer webapp\n");
        })

        // TODO -- add notification once notifications are setup
        // TODO -- consider prompting user to update their profile
      }
    }

    const sarcoBalance = await getSarcoBalance(web3Interface);
    const ethBalance = await getEthBalance(web3Interface);
    const freeBondBalance = await getFreeBondBalance(web3Interface);
    logProfile(profile);

    logCallout(async () => {
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);

      // If ETH balance is low, the archaeologist won't have gas to sign transactions
      warnIfEthBalanceIsLow(ethBalance);

      // Free bond must be >= their min digging fee to accept new jobs
      await warnIfFreeBondIsLessThanMinDiggingFee(freeBondBalance, profile.minimumDiggingFee);
    });
  } catch (e) {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }
}

const fetchProfileOrPromptProfileSetup = async (
  web3Interface: Web3Interface
): Promise<OnchainProfile> => {
  const profile = await getOnchainProfile(web3Interface);
  if (!profile.exists) {
    logCallout(() => {
      archLogger.warn(" ARCHAEOLOGIST NOT REGISTERED:\n");
      archLogger.warn(`\n   Your archaeologist is not yet registered.`);
      archLogger.error(
        `   Run: \`cli help register \` to see options for registering\n`
      );
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
    archLogger.error(
      `   Run: \`npm run start -- --deposit-bond:<amount>\` to deposit some SARCO\n`
    );
  }
};

const warnIfEthBalanceIsLow = (ethBalance: BigNumber): void => {
  if (ethBalance.lte(ethers.utils.parseEther("0.0005"))) {
    archLogger.warn(
      `\n   You have very little ETH in your account. You may not be able to sign any transactions (or do unwrappings)!\n`
    );
  }
};
