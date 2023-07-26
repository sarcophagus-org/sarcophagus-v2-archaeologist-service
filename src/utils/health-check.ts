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
import {
  ONE_MONTH_IN_SECONDS,
  formatFullPeerString,
  logBalances,
  logNotRegistered,
  logProfile,
} from "../cli/utils";
import { getBlockTimestamp } from "./blockchain/helpers";
import { notifyUser } from "./notification";

/**
 * Runs on service startup
 * @param peerId -- libp2p peer ID that will be validated with arch profile if provided
 */
export async function healthCheck(peerId?: string) {
  notifyUser("Archaeologist health check started");
  const web3Interface = await getWeb3Interface();

  try {
    const sarcoBalance = await getSarcoBalance();
    warnIfSarcoBalanceIsLow(sarcoBalance);

    const { ethBalance } = await warnIfEthBalanceIsLow();

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
          archLogger.error("Peer ID on profile does not match local Peer Id!\n", true);
          archLogger.error("Please update your profile \n", true);
          archLogger.error("Your archaeologist will not appear in the embalmer webapp\n", true);
          archLogger.warn(`Local Peer ID: ${process.env.DOMAIN}:${peerId}`, true);
          archLogger.warn(`Profile Peer ID: ${profile.peerId}`, true);
        });

        // TODO -- add notification once notifications are setup
        // TODO -- consider quitting and forcing user to update their profile
      } else {
        archLogger.debug("local PeerID and domain matches profile value");
      }
    }

    const syncDifferenceSec = Math.abs((await getBlockTimestamp()) * 1000 - Date.now()) / 1000;
    if (syncDifferenceSec >= 1800) {
      archLogger.warn(
        `Warning: your system clock is out of sync with universal UTC time by roughly: ${syncDifferenceSec} seconds`,
        true
      );
    }

    const freeBondBalance = await getFreeBondBalance();
    logProfile(profile);

    logCallout(async () => {
      logBalances(sarcoBalance, ethBalance, web3Interface.ethWallet.address);
      warnIfFreeBondIsLessThanMinDiggingFee(
        freeBondBalance,
        profile.minimumDiggingFeePerSecond,
        profile.curseFee
      );
    });
  } catch (e) {
    archLogger.error(e, true);
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
  curseFee: BigNumber,
  diggingFeePerSecond: BigNumber
): void => {
  const diggingFeePerMonth = diggingFeePerSecond.mul(ONE_MONTH_IN_SECONDS).add(curseFee);

  if (freeBondBal.lt(diggingFeePerMonth)) {
    archLogger.warn(
      `\n   Your free bond is less than you can lock for a new Sarcophagus lasting a month. You may not be able to accept new jobs!`,
      true
    );
    archLogger.warn(`   Run: \`cli update -f <amount>\` to deposit some SARCO\n`, true);
  }
};

export const warnIfEthBalanceIsLow = async (
  doNotify?: boolean
): Promise<{ ethBalance: BigNumber }> => {
  const ethBalance = await getEthBalance();
  if (ethBalance.lte(ethers.utils.parseEther("0.05"))) {
    archLogger.error(
      `\nYou have very little ETH in your account: ${ethers.utils.formatEther(
        ethBalance
      )} ETH.\nYou may not have enough gas for any transactions!\n`,
      true
    );

    if (doNotify) {
      // Notify using user's preferred method
    }
  }

  return { ethBalance };
};

const warnIfSarcoBalanceIsLow = (sarcoBalance: BigNumber): void => {
  if (sarcoBalance.lte(ethers.utils.parseEther("1"))) {
    archLogger.warn(
      `\nYou have very little SARCO in your account: ${ethers.utils.formatEther(
        sarcoBalance
      )} SARCO\n`,
      true
    );
  }
};
