import { logValidationErrorAndExit } from "../utils";
import { archLogger } from "../../logger/chalk-theme";
import { BigNumber } from "ethers";

// TODO: we may not want to enforce a minimum here, unless it's enforced in the contracts
const MINIMUM_REWRAP_INTERVAL = 15 * 60; // 15 minutes
const MINIMUM_MAX_RESURRECTION_TIME_INTERVAL = 60 * 60 * 24; // 1 day

export const validateRewrapInterval = (rewrapInterval: number | undefined) => {
  if ((rewrapInterval ?? 0) < MINIMUM_REWRAP_INTERVAL) {
    logValidationErrorAndExit(
      `The rewrap interval must be at least: ${MINIMUM_REWRAP_INTERVAL} seconds`
    );
  }
};

export const validateMaxResurrectionTime = (maximumResurrectionTime: number | undefined) => {
  if ((maximumResurrectionTime ?? 0) < MINIMUM_MAX_RESURRECTION_TIME_INTERVAL) {
    logValidationErrorAndExit(
      `The maximum resurrection time must be at least: ${MINIMUM_REWRAP_INTERVAL} seconds into the future`
    );
  }
};

export const isFreeBondProvidedAndZero = (freeBond: BigNumber | undefined): boolean => {
  const warnAboutFreeBond = !!freeBond && freeBond.eq(0);
  if (warnAboutFreeBond) {
    archLogger.warn("Free Bond is 0, no free bond will be deposited");
  }
  return warnAboutFreeBond;
};
