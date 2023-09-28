import { BigNumber, ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../logger/chalk-theme";
import { NO_ONCHAIN_PROFILE, RPC_EXCEPTION } from "./exit-codes";
import { logCallout } from "../logger/formatter";
import {
  getNetworkTokenBalance,
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
import { NetworkContext } from "../network-config";

/**
 * Runs on service startup
 * @param peerId -- libp2p peer ID that will be validated with arch profile if provided
 */
export async function healthCheck(networkContext: NetworkContext, peerId?: string) {
  try {
    const sarcoBalance = await getSarcoBalance(networkContext);
    warnIfSarcoBalanceIsLow(networkContext, sarcoBalance);
    
    const { networkTokenBalance } = await warnIfEthBalanceIsLow(networkContext);

    const profile = await fetchProfileOrExit(networkContext, () =>
      logBalances(
        networkContext.networkName, 
        networkContext.networkConfig.tokenSymbol, 
        sarcoBalance, 
        networkTokenBalance, 
        networkContext.ethWallet.address
      )
    );

    // Validate local peerId matches the one on the profile
    if (peerId) {
      if (
        peerId !== profile.peerId &&
        profile.peerId !== formatFullPeerString(peerId, process.env.DOMAIN)
      ) {
        logCallout(async () => {
          await archLogger.error(
            `There is a problem with your ${networkContext.networkName} archaeologist profile. Peer ID on profile does not match local Peer Id!\n` +
              "Your archaeologist will not appear in the embalmer webapp\n",
            {
              logTimestamp: true,
              sendNotification: true,
            }
          );
          archLogger.error("Please update your profile \n", { logTimestamp: true });
          archLogger.warn(`Local Peer ID: ${process.env.DOMAIN}:${peerId}`, true);
          archLogger.warn(`Profile Peer ID: ${profile.peerId}`, true);
        });

        // TODO -- consider quitting and forcing user to update their profile
      } else {
        archLogger.debug("local PeerID and domain matches profile value");
      }
    }

    const syncDifferenceSec = Math.abs((await getBlockTimestamp(networkContext)) * 1000 - Date.now()) / 1000;
    if (syncDifferenceSec >= 1800) {
      archLogger.warn(
        `Warning: your system clock is out of sync with universal UTC time by roughly: ${syncDifferenceSec} seconds`,
        true
      );
    }

    const freeBondBalance = await getFreeBondBalance(networkContext);
    logProfile(networkContext.networkName, profile);

    logCallout(async () => {
      logBalances(
        networkContext.networkName, 
        networkContext.networkConfig.tokenSymbol, 
        sarcoBalance, 
        networkTokenBalance, 
        networkContext.ethWallet.address
      );
      warnIfFreeBondIsLessThanMinDiggingFee(
        freeBondBalance,
        profile.minimumDiggingFeePerSecond,
        profile.curseFee
      );
    });
  } catch (e) {
    await archLogger.error(`Health Check error [${networkContext.networkName}]: ${e.toString()}`, {
      sendNotification: true,
      logTimestamp: true,
    });
    exit(RPC_EXCEPTION);
  }
}

const fetchProfileOrExit = async (networkContext: NetworkContext, logBalances: Function): Promise<OnchainProfile> => {
  const profile = await getOnchainProfile(networkContext);
  if (!profile.exists) {
    logCallout(() => {
      logBalances();
      logNotRegistered(networkContext.networkName);
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
  networkContext: NetworkContext,
  sendNotification?: boolean
): Promise<{ networkTokenBalance: BigNumber }> => {
  const networkTokenBalance = await getNetworkTokenBalance(networkContext);

  if (networkTokenBalance.lte(ethers.utils.parseEther("0.05"))) {
    await archLogger.error(
      `\nYou have very little balance in your ${networkContext.networkName} account: ${ethers.utils.formatEther(
        networkTokenBalance
      )} ${networkContext.networkConfig.tokenSymbol}.\n
      You may not have enough gas for any transactions!\n`,
      { sendNotification, logTimestamp: true }
    );
  }

  return { networkTokenBalance };
};

const warnIfSarcoBalanceIsLow = (networkContext: NetworkContext, sarcoBalance: BigNumber): void => {
  if (sarcoBalance.lte(ethers.utils.parseEther("1"))) {
    archLogger.warn(
      `\nYou have very little SARCO in your ${networkContext.networkName} account: ${ethers.utils.formatEther(
        sarcoBalance
      )} SARCO\n`,
      true
    );
  }
};
