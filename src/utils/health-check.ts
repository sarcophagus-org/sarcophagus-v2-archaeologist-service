import { BigNumber, ethers } from "ethers";
import { exit } from "process";
import { getWeb3Interface } from "../scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { NO_ONCHAIN_PROFILE, RPC_EXCEPTION } from "./exit-codes";
import { logCallout } from "../logger/formatter";
import {
  getEthBalance,
  getFreeBondBalance,
  getOnchainProfile,
  getSarcoBalance,
  OnchainProfile,
} from "./onchain-data";
import { formatFullPeerString, logBalances, logNotRegistered, logProfile } from "../cli/utils";

/**
 * Runs on service startup
 * @param peerId -- libp2p peer ID that will be validated with arch profile if provided
 */
export async function healthCheck(peerId?: string) {
  const web3Interface = await getWeb3Interface();

  try {
    const sarcoBalance = await getSarcoBalance();
    warnIfSarcoBalanceIsLow(sarcoBalance);

    const ethBalance = await getEthBalance();
    warnIfEthBalanceIsLow(ethBalance);

    const profile = await fetchProfileOrExit(() =>
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address)
    );

    // Validate local peerId matches the one on the profile
    if (peerId) {
      if (
        peerId !== profile.peerId &&
        profile.peerId !== formatFullPeerString(peerId, process.env.DOMAIN)
      ) {
        logCallout(async () => {
          archLogger.error("Peer ID on profile does not match local Peer Id!\n");
          archLogger.error("Please update your profile \n");
          archLogger.error("Your archaeologist will not appear in the embalmer webapp\n");
          archLogger.warn(`Local Peer ID: ${process.env.DOMAIN}:${peerId}`);
          archLogger.warn(`Profile Peer ID: ${profile.peerId}`);
        });

        // TODO -- add notification once notifications are setup
        // TODO -- consider quitting and forcing user to update their profile
      } else {
        archLogger.debug("local PeerID and domain matches profile value");
      }
    }

    const freeBondBalance = await getFreeBondBalance();
    logProfile(profile);

    logCallout(async () => {
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);

      // Free bond must be >= their min digging fee to accept new jobs
      warnIfFreeBondIsLessThanMinDiggingFee(freeBondBalance, profile.minimumDiggingFeePerSecond);
    });
  } catch (e) {
    archLogger.error(e);
    exit(RPC_EXCEPTION);
  }
}

const fetchProfileOrExit = async (logBalances: Function): Promise<OnchainProfile> => {
  const profile = await getOnchainProfile();
  if (!profile.exists) {
    logCallout(() => {
      logBalances();
      logNotRegistered();
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
