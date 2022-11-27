import inquirer from 'inquirer';
import { parseEther } from "ethers/lib/utils";
import { exit } from "process";
import { DENIED_APPROVAL } from "../../utils/exit-codes";
import { ethers } from "ethers";
import { ProfileParams, profileSetup } from "../../scripts/profile-setup";
import { Web3Interface } from "../../scripts/web3-interface";
import { hasAllowance } from "../../scripts/approve_utils";
import { approve } from "../../utils/blockchain/approve";
import { archLogger, logColors } from "../../logger/chalk-theme";

const DEFAULT_DIGGING_FEES = "100";

const approvalQuestion = [
  {
    type: 'confirm',
    name: 'approval',
    message: 'Do you approve the Sarcophagus contract to spend your SARCO? You must agree to continue.',
    default: true,
  }
];

const confirmReviewQuestion = (diggingFee: string, rewrapInterval: string, freeBond: string) => [
  {
    type: 'confirm',
    name: 'isConfirmed',
    message: 'You will be registering your profile with the values below:\n\n' +
    `Digging Fee: ${diggingFee} SARCO\n` +
    `Free Bond: ${freeBond} SARCO\n` +
    `Maximum Rewrap Interval: ${rewrapInterval}\n\n` +
    'Do you want to continue?',
    default: true,
  }
];

const diggingFeeQuestion = [
  {
    type: 'input',
    name: 'diggingFee',
    message: `What is your digging fee in SARCO? \n\n` +
    `${logColors.muted(`Examples: 10 SARCO, 15.5 SARCO, 100 SARCO. Default is ${DEFAULT_DIGGING_FEES} SARCO.`)}\n\n` +
    `Enter SARCO Amount:`,
    validate(value) {
      if (value) {
        console.log('validating with', value);
        try {
          parseEther(value.toString())
        } catch (error) {
          return 'Please enter a valid SARCO amount';
        }
      }
      return true;
    },
    default: DEFAULT_DIGGING_FEES
  },
]

const freeBondQuestion = (diggingFee: string) => {
  return [
    {
      type: 'input',
      name: 'freeBond',
      message:
        `How much would you like to deposit in Free Bond (expressed in SARCO)?\n\n` +
        `${logColors.muted(`Minimum to accept a job is your digging fee of ${diggingFee.toString()}.\n\n` +
        `This bond will be locked when you are assigned to a sarcophagus, and released when either you complete your unwrapping duties or the sarcophagus is buried.`)}\n` +
        `Enter SARCO amount:`,
      validate(value) {
        try {
          parseEther(value)
        } catch {
          return 'Please enter a valid SARCO amount';
        }
        return true;
      }
    },
  ]
}

// TODO -- allow months as options
const maxRewrapIntervalQuestion = [
  {
    type: 'list',
    name: 'maxRewrapInterval',
    message: `What is your maximum rewrap interval? \n\n` +
    `${logColors.muted('This is the longest amount of time you find acceptable before being paid.')}`,
    choices: ['1 year', '200 days', '100 days', '30 days', 'other']
  }
]

const maxRewrapIntervalDaysQuestion = [
  {
    type: 'input',
    name: 'maxRewrapIntervalDays',
    message: 'Expressed in days, how long do you want your maximum rewrap interval to be?\n\n' +
      'Enter number of days:',
    validate(value) {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number
  }
]

const separator = () => {
  console.log("\n\n");
}

const approveAndRegister = async (web3Interface: Web3Interface, profileParams: ProfileParams) => {
  /**
   * Execute approval if necessary
   */
  const alreadyHasAllowance = await hasAllowance(web3Interface, profileParams.freeBond!);

  if (!alreadyHasAllowance) {
    await approve(web3Interface, ethers.constants.MaxUint256);
  }

  separator();

  /**
   * Register Profile
   */
  await profileSetup(
    profileParams,
    false,
    false,
    true
  );
}

const parseRewrapInterval = (rewrapInterval: string | number): number => {
  const oneDayInSeconds = 24 * 60 * 60;
  if (typeof rewrapInterval === 'string') {
    if (rewrapInterval === '1 year') {
      return 365 * oneDayInSeconds;
    }

    return Number(rewrapInterval.split(' ')[0]) * oneDayInSeconds;
  }

  return Number(rewrapInterval) * oneDayInSeconds;
}

export const registerPrompt = async (web3Interface: Web3Interface, skipApproval?: boolean) => {
  let diggingFee: string, rewrapInterval: string, freeBond: string;

  /**
   * Ask for approval
   */
  if (!skipApproval) {
    const approvalAnswer = await inquirer.prompt(approvalQuestion);

    // If user does not agree to approval, then exit
    if (!approvalAnswer.approval) {
      archLogger.error('You denied approval, quitting register archaeologist.')
      exit(DENIED_APPROVAL);
    }

    separator();
  }

  /**
   * Digging Fees
   */
  const diggingFeesAnswer = await inquirer.prompt(diggingFeeQuestion);
  diggingFee = diggingFeesAnswer.diggingFee;

  separator();

  /**
   * Free Bond
   */
  const freeBondAnswer = await inquirer.prompt(freeBondQuestion(diggingFee));
  freeBond = freeBondAnswer.freeBond;

  separator();

  /**
   * Max Rewrap Interval
   */
  const maxRewrapIntervalAnswer = await inquirer.prompt(maxRewrapIntervalQuestion);

  if (maxRewrapIntervalAnswer.maxRewrapInterval !== 'other') {
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
    confirmReviewQuestion(
      diggingFee,
      rewrapInterval,
      freeBond
    )
  );

  // If user doesn't confirm, then walk through the prompt again
  if (!confirmReviewAnswer.isConfirmed) {
    separator();
    await registerPrompt(web3Interface, true);
  } else {
    const profileParams: ProfileParams = {
      diggingFee: parseEther(diggingFee),
      rewrapInterval: parseRewrapInterval(rewrapInterval),
      freeBond: parseEther(freeBond)
    }
    await approveAndRegister(web3Interface, profileParams);
  }
}