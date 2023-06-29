import inquirer from "inquirer";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ProfileCliParams, profileSetup } from "../../scripts/profile-setup";
import { hasAllowance, requestApproval } from "../../scripts/approve_utils";
import { logColors } from "../../logger/chalk-theme";
import { runApprove } from "../../utils/blockchain/approve";
import { ONE_DAY_IN_SECONDS, ONE_MONTH_IN_SECONDS } from "../utils";
import { getBlockTimestamp } from "../../utils/blockchain/helpers";
import { getSarcoBalance } from "../../utils/onchain-data";

const DEFAULT_DIGGING_FEES_MONTHLY = "10";
const DEFAULT_CURSE_FEE = "300";

//
// PROMPT QUESTIONS
//////////////////////////////////////////

const confirmReviewQuestion = (
  diggingFeePerMonth: string,
  rewrapInterval: string,
  freeBond: string,
  maxResTime: string,
  curseFee: string
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
      `Domain: ${process.env.DOMAIN}\n` +
      `Curse Fee: ${curseFee}\n\n` +
      "Do you want to continue?",
    default: true,
  },
];

const diggingFeeQuestion = [
  {
    type: "input",
    name: "diggingFee",
    message:
      `What is your digging fee? \n\n` +
      `${logColors.muted(
        `The digging fee setting is the fee that is charged by each node to the user for the service of ` +
          `monitoring EACH of their sarcophagi over time. It is expressed in $SARCO / Month.\n\n` +
          `This fee should be set high enough to cover operating expenses of the server, but low enough to ` +
          `be competitive in the market.` +
          `Actual earnings will depend on the number of customers (sarcophagi) you attract, the length of ` +
          `their respective curses, and the frequency of their attestations.\n\n` +
          `Digging fees are paid to to archaeologist ` +
          `nodes every time the embalmer attests to their liveliness (re-wraps), or after a successful resurrection. ` +
          `This means that the digging fee you specify here will be the minimum you will earn, per month, per sarcophagus.\n\n` +
          `If the market price of $SARCO goes up or down, this fee should be adjusted to match current market conditions.\n\n` +
          `Suggested setting as of mainnet launch: ${DEFAULT_DIGGING_FEES_MONTHLY} SARCO per Month.`
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

const curseFeeQuestion = [
  {
    type: "input",
    name: "curseFee",
    message:
      `What is your Curse Fee?\n\n` +
      `${logColors.muted(
        `The Curse Fee is a one-time fee charged to the user upfront to cover the cost of gas for the node(s) they choose, ` +
          `it is charged by each node that is chosen. This value is set by the individual archaeologist operator, but ` +
          `should be greater than or equal to the the cost of gas to perform the resurrection operation. This operation has ` +
          `a gas limit of ~170,000.\n\nSince gas costs on ETH are a market, there is an opportunity for node operators ` +
          `to predict gas costs in the future to generate alpha. They can choose to be:\n\n` +
          ` - Conservative in their curse fee assuming gas will always be 100gwei in the future and charging a higher curseFee, ` +
          `thus getting less customers, or` +
          `\n\n - Aggressive in their pricing assuming gas will be 50gwei in the future, ` +
          `charging a lower fee, getting more customers, but taking on the risk of losing money on gas expense in the future.\n\n` +
          `Since the gas fee paid at the time of resurrection (one time expense) will be whatever the market is current charging ` +
          `(resurrections MUST happen on time within the 1hr grace period), this setting is probabilistic and can be informed by ` +
          `historical gas price research. Not every customer that chooses your node will have a resurrection, many sarcophagi ` +
          `will be buried and never resurrected, in this case your node will still receive the full curse fee, but will not be ` +
          `required to spend any gas on that customer. The ratio of resurrected to buried sarcophagi however is totally ` +
          `unpredictable at network launch.\n\nIf the market price of $SARCO goes up or down, this fee should be adjusted ` +
          `to match current market conditions.\n\nSuggested setting as of mainnet launch: 300 SARCO`
      )}\n\n` +
      `Enter SARCO Amount:`,
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
    default: DEFAULT_CURSE_FEE,
  },
];

const freeBondQuestion = (args: {
  diggingFeePerSecond: number;
  sarcoBalance: string;
  curseFee: number;
}) => {
  const diggingFeePerMonth = args.diggingFeePerSecond * ONE_MONTH_IN_SECONDS;

  return [
    {
      type: "input",
      name: "freeBond",
      message:
        `Choose how much $SARCO you would like to deposit into the contract to accept new curses from Sarcophagus users \n\n` +
        `${logColors.muted(
          `Since you set your Digging Fee to ${diggingFeePerMonth} and your Curse Fee to ${args.curseFee},` +
            `the minimum you can deposit to accept one customer is ${
              diggingFeePerMonth + args.curseFee
            }.\n\n` +
            `When a customer chooses you as one of their archaeologist nodes, your free bond will be locked until the ` +
            `sarcophagus is successfully resurrected or buried by the user. It will then be released and available for ` +
            `future curses. Potential customers will not be able to see your node as an option if you do not have ` +
            `sufficient free bond available, however there is no added benefit to having a unnecessarily large free bond, ` +
            `and you can add more at any time. Your current SARCO balance is ${args.sarcoBalance}.\n\n`
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
        "This setting allows the archaeologist node operator to specify the maximum duration of each successive re-wrap for the embalmer.\nThis setting will only become important as the network matures, so it is best to leave to default during launch.\nThe max re-wrap interval must be less than or equal to the time between now and the max resurrection time set in the previous step.\n\nDefault is equal to the length of time between now and the maximum resurrection time you set in the previous step.\n\n"
      )}`,
    choices: ["default", "1 year", "200 days", "100 days", "30 days", "other"],
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
        "This setting allows archaeologist nodes to set how long into the future they are willing to operate their node.\nIt is expressed as point in time (unix timestamp). This setting exists so that nodes are not expected to operate forever.\nYour max resurrection time can always be extended, but the extension will only apply to future sarcophagi.\nThere is no suggested max resurrection time, but shutting down your node prior to the date you specify will result in the loss of your free bond, harm your on-chain reputation, and harm the users who have chosen you as their archaeologist node.\n\n"
      )}`,
    choices: ["1 year", "6 months", "3 months", "other"],
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

const approveAndRegister = async (profileParams: ProfileCliParams) => {
  // Execute approval if necessary
  const alreadyHasAllowance = await hasAllowance(profileParams.freeBond!);

  if (!alreadyHasAllowance) {
    await runApprove();
  }

  separator();

  // Register Profile
  await profileSetup(profileParams, false, true, true);
};

const parseRewrapIntervalAnswer = (rewrapIntervalAnswer: string | number): number => {
  if (typeof rewrapIntervalAnswer === "string") {
    if (rewrapIntervalAnswer === "1 year") {
      return 365 * ONE_DAY_IN_SECONDS;
    }

    return Number(rewrapIntervalAnswer.split(" ")[0]) * ONE_DAY_IN_SECONDS;
  }

  return rewrapIntervalAnswer * ONE_DAY_IN_SECONDS;
};

const parseMaxResTimeAnswer = async (
  maxResTime: string | number,
  blockTimestamp: number
): Promise<number> => {
  let maxResurrectionTimeInterval = 0;
  if (typeof maxResTime === "string") {
    switch (maxResTime) {
      case "2 years":
        maxResurrectionTimeInterval = 24 * ONE_MONTH_IN_SECONDS;
        break;

      case "1 year":
        maxResurrectionTimeInterval = 12 * ONE_MONTH_IN_SECONDS;
        break;

      case "6 months":
        maxResurrectionTimeInterval = 6 * ONE_MONTH_IN_SECONDS;
        break;

      case "3 months":
        maxResurrectionTimeInterval = 3 * ONE_MONTH_IN_SECONDS;
        break;

      default:
        maxResurrectionTimeInterval = Number(maxResTime.split(" ")[0]) * ONE_MONTH_IN_SECONDS;
        break;
    }
  } else {
    maxResurrectionTimeInterval = maxResTime * ONE_MONTH_IN_SECONDS;
  }

  return blockTimestamp + maxResurrectionTimeInterval;
};

//
// REGISTER PROMPT
// ////////////////////
export const registerPrompt = async (skipApproval?: boolean) => {
  let diggingFeePerMonth: string,
    rewrapInterval: string,
    maxResTime: string,
    freeBond: string,
    curseFee: string;

  /**
   * Ask for approval
   */
  if (!skipApproval) {
    await requestApproval();
    separator();
  }

  const blockTimestamp = await getBlockTimestamp();

  /**
   * Digging Fees
   */
  const diggingFeesAnswer = await inquirer.prompt(diggingFeeQuestion);
  diggingFeePerMonth = diggingFeesAnswer.diggingFee;

  separator();

  /**
   * Curse Fee
   */
  const curseFeeAnswer = await inquirer.prompt(curseFeeQuestion);
  curseFee = curseFeeAnswer.curseFee;

  separator();

  /**
   * Free Bond
   */
  const freeBondAnswer = await inquirer.prompt(
    freeBondQuestion({
      diggingFeePerSecond: Number.parseFloat(diggingFeePerMonth) / ONE_MONTH_IN_SECONDS,
      curseFee: Number.parseFloat(curseFee),
      sarcoBalance: formatEther(await getSarcoBalance()),
    })
  );
  freeBond = freeBondAnswer.freeBond;

  separator();

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

  if (maxRewrapIntervalAnswer.maxRewrapInterval === "default") {
    const maxResTimestamp = await parseMaxResTimeAnswer(maxResTime, blockTimestamp);
    rewrapInterval = `${Math.floor((maxResTimestamp - blockTimestamp) / ONE_DAY_IN_SECONDS)} days`;
  } else if (maxRewrapIntervalAnswer.maxRewrapInterval !== "other") {
    rewrapInterval = maxRewrapIntervalAnswer.maxRewrapInterval;
  } else {
    const maxRewrapIntervalDaysAnswer = await inquirer.prompt(maxRewrapIntervalDaysQuestion);
    rewrapInterval = maxRewrapIntervalDaysAnswer.maxRewrapIntervalDays;
  }

  separator();

  /**
   * Confirm answers
   */
  const confirmReviewAnswer = await inquirer.prompt(
    confirmReviewQuestion(diggingFeePerMonth, rewrapInterval, freeBond, maxResTime, curseFee)
  );

  // If user doesn't confirm, then walk through the prompt again
  if (!confirmReviewAnswer.isConfirmed) {
    separator();
    await registerPrompt(true);
  } else {
    const profileParams: ProfileCliParams = {
      // ie, Digging Fees Per Second
      diggingFee: parseEther(diggingFeePerMonth),
      rewrapInterval: parseRewrapIntervalAnswer(rewrapInterval),
      maxResTime: await parseMaxResTimeAnswer(maxResTime, blockTimestamp),
      freeBond: parseEther(freeBond),
      curseFee: parseEther(curseFee),
    };
    await approveAndRegister(profileParams);
  }
};
