import inquirer from "inquirer";
import { parseEther } from "ethers/lib/utils";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { Web3Interface } from "../../scripts/web3-interface";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { logColors } from "../../logger/chalk-theme";
import { runApprove } from "../../utils/blockchain/approve";

const DEFAULT_DIGGING_FEES_MONTHLY = "100";
const ONE_MONTH_IN_SECONDS = 2628288;

//
// PROMPT QUESTIONS
//////////////////////////////////////////

const confirmReviewQuestion = (
  diggingFeePerMonth: string,
  rewrapInterval: string,
  freeBond: string,
  maxResTime: string
) => [
  {
    type: "confirm",
    name: "isConfirmed",
    message:
      "You will be registering your profile with the values below:\n\n" +
      `Digging Fee (monthly): ${diggingFeePerMonth} SARCO\n` +
      `Free Bond: ${freeBond} SARCO\n` +
      `Maximum Rewrap Interval: ${rewrapInterval}\n` +
      `Maximum Resurrection Time in: ${maxResTime}\n` +
      `Domain: ${process.env.DOMAIN}\n\n` +
      "Do you want to continue?",
    default: true,
  },
];

const diggingFeeQuestion = [
  {
    type: "input",
    name: "diggingFee",
    message:
      `How much would you like to earn in SARCO (per month)? \n\n` +
      `${logColors.muted(
        `Actual earnings will depend on the number of Sarcophagi, and length of time for each, you are assigned to. Default is ${DEFAULT_DIGGING_FEES_MONTHLY} SARCO per month.`
      )}\n\n` +
      `Enter SARCO Amount (per month):`,
    validate(value) {
      if (value) {
        console.log("validating with", value);
        try {
          parseEther(value.toString());
        } catch (error) {
          return "Please enter a valid SARCO amount";
        }
      }
      return true;
    },
    default: DEFAULT_DIGGING_FEES_MONTHLY,
  },
];

const freeBondQuestion = (args: {
  diggingFeePerSecond: number;
  maxRewrapIntervalSeconds: number;
}) => {
  const maxFeeOnSingleSarcophagus = Math.ceil(
    args.diggingFeePerSecond * args.maxRewrapIntervalSeconds
  );

  return [
    {
      type: "input",
      name: "freeBond",
      message:
        `How much would you like to deposit in your Free Bond (expressed in SARCO)?\n\n` +
        `${logColors.muted(
          `  - You may need a minimum of ${maxFeeOnSingleSarcophagus} in order to be assigned to and maintain one sarcophagus.\n\n` +
            `  - A portion of your free bond (a function of your monthly digging fees and the time you will be responsible for it) will be locked whenever you are assigned to a sarcophagus. This will be released when either you complete your unwrapping duties or the sarcophagus is buried.\n\n` +
            `  - You will need to have enough SARCO in your free bond in order to be successfully assigned to a new Sarcophagus.\n\n`
        )}` +
        `Enter SARCO amount:`,
      validate(value) {
        try {
          parseEther(value);
        } catch {
          return "Please enter a valid SARCO amount";
        }
        return true;
      },
    },
  ];
};

// TODO -- allow months as options
const maxRewrapIntervalQuestion = [
  {
    type: "list",
    name: "maxRewrapInterval",
    message:
      `What is your maximum rewrap interval? \n\n` +
      `${logColors.muted(
        "This is the longest amount of time you find acceptable before being paid."
      )}`,
    choices: ["1 year", "200 days", "100 days", "30 days", "other"],
  },
];

const maxRewrapIntervalDaysQuestion = [
  {
    type: "input",
    name: "maxRewrapIntervalDays",
    message:
      "Expressed in days, how long do you want your maximum rewrap interval to be?\n\n" +
      "Enter number of days:",
    validate(value) {
      const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
      return valid || "Please enter a non-zero number";
    },
    filter: Number,
  },
];

const maxResTimeQuestion = [
  {
    type: "list",
    name: "maxResTime",
    message:
      `What is your maximum resurrection time? \n\n` +
      `${logColors.muted(
        "This is maximum amount of time, from now, you are willing to accept any Sarcophagus curses or rewraps."
      )}`,
    choices: ["2 years", "1 year", "6 months", "3 months", "other"],
  },
];

const maxResTimeMonthsQuestion = [
  {
    type: "input",
    name: "maxResTimeMonths",
    message:
      "Expressed in months, how long are you willing to continue to accept Sarcophagus curses or rewraps?\n\n" +
      "Enter number of months:",
    validate(value) {
      const valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0;
      return valid || "Please enter a non-zero number";
    },
    filter: Number,
  },
];

//
// HELPER FUNCTIONS
//////////////////////////////////////////////////////////////
const separator = () => console.log("\n\n");

const approveAndRegister = async (
  web3Interface: Web3Interface,
  profileParams: ProfileCliParams
) => {
  // Execute approval if necessary
  const alreadyHasAllowance = await hasAllowance(web3Interface, profileParams.freeBond!);

  if (!alreadyHasAllowance) {
    await runApprove(web3Interface);
  }

  separator();

  // Register Profile
  await profileSetup(profileParams, false, true, true);
};

const parseRewrapIntervalAnswer = (rewrapIntervalAnswer: string | number): number => {
  const oneDayInSeconds = 24 * 60 * 60;
  if (typeof rewrapIntervalAnswer === "string") {
    if (rewrapIntervalAnswer === "1 year") {
      return 365 * oneDayInSeconds;
    }

    return Number(rewrapIntervalAnswer.split(" ")[0]) * oneDayInSeconds;
  }

  return rewrapIntervalAnswer * oneDayInSeconds;
};

const parseMaxResTimeAnswer = (maxResTime: string | number): number => {
  let resTimeInterval = 0;
  if (typeof maxResTime === "string") {
    switch (maxResTime) {
      case "2 years":
        resTimeInterval = 24 * ONE_MONTH_IN_SECONDS;
        break;

      case "1 year":
        resTimeInterval = 12 * ONE_MONTH_IN_SECONDS;
        break;

      default:
        resTimeInterval = Number(maxResTime.split(" ")[0]) * ONE_MONTH_IN_SECONDS;
        break;
    }
  } else {
    resTimeInterval = maxResTime * ONE_MONTH_IN_SECONDS;
  }

  return Math.trunc(Date.now() / 1000) + resTimeInterval;
};

//
// REGISTER PROMPT
// ////////////////////
export const registerPrompt = async (web3Interface: Web3Interface, skipApproval?: boolean) => {
  let diggingFeePerMonth: string, rewrapInterval: string, maxResTime: string, freeBond: string;

  /**
   * Ask for approval
   */
  if (!skipApproval) {
    await requestApproval(web3Interface);
    separator();
  }

  /**
   * Max Sarcophagus Life Span
   */
  const maxResTimeAnswer = await inquirer.prompt(maxResTimeQuestion);

  if (maxResTimeAnswer.maxResTime !== "other") {
    maxResTime = maxResTimeAnswer.maxResTime;
  } else {
    const maxMonthsAnswer = await inquirer.prompt(maxResTimeMonthsQuestion);
    maxResTime = maxMonthsAnswer.maxResTimeMonths;
  }

  separator();

  /**
   * Max Rewrap Interval
   */
  const maxRewrapIntervalAnswer = await inquirer.prompt(maxRewrapIntervalQuestion);

  if (maxRewrapIntervalAnswer.maxRewrapInterval !== "other") {
    rewrapInterval = maxRewrapIntervalAnswer.maxRewrapInterval;
  } else {
    const maxRewrapIntervalDaysAnswer = await inquirer.prompt(maxRewrapIntervalDaysQuestion);
    rewrapInterval = maxRewrapIntervalDaysAnswer.maxRewrapIntervalDays;
  }

  separator();

  /**
   * Digging Fees
   */
  const diggingFeesAnswer = await inquirer.prompt(diggingFeeQuestion);
  diggingFeePerMonth = diggingFeesAnswer.diggingFee;

  separator();

  /**
   * Free Bond
   */
  const freeBondAnswer = await inquirer.prompt(
    freeBondQuestion({
      diggingFeePerSecond: Number.parseFloat(diggingFeePerMonth) / ONE_MONTH_IN_SECONDS,
      maxRewrapIntervalSeconds: parseRewrapIntervalAnswer(rewrapInterval),
    })
  );
  freeBond = freeBondAnswer.freeBond;

  separator();

  /**
   * Confirm answers
   */
  const confirmReviewAnswer = await inquirer.prompt(
    confirmReviewQuestion(diggingFeePerMonth, rewrapInterval, freeBond, maxResTime)
  );

  // If user doesn't confirm, then walk through the prompt again
  if (!confirmReviewAnswer.isConfirmed) {
    separator();
    await registerPrompt(web3Interface, true);
  } else {
    const profileParams: ProfileCliParams = {
      // ie, Digging Fees Per Second
      diggingFee: parseEther(
        (Number.parseFloat(diggingFeePerMonth) / ONE_MONTH_IN_SECONDS).toFixed(18)
      ),
      rewrapInterval: parseRewrapIntervalAnswer(rewrapInterval),
      maxResTime: parseMaxResTimeAnswer(maxResTime),
      freeBond: parseEther(freeBond),
    };
    await approveAndRegister(web3Interface, profileParams);
  }
};
