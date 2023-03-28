import chalk from "chalk";

export const logColors = {
  error: chalk.bold.red,
  warning: chalk.hex("#d8972f"),
  muted: chalk.dim,
  green: chalk.green,
};

const log = (msg: string) => {
  console.log(`${new Date(Date.now()).toDateString()}: ${msg}`);
}

export const archLogger = {
  debug: msg => {
    if (process.env.DEBUG) {
      const debugLog = logColors.muted(`debug-${process.env.npm_package_version}::${msg}`);
      console.log(debugLog);
    }
  },
  info: msg => log(logColors.muted(msg)),
  notice: msg => log(logColors.green(msg)),
  warn: msg => log(logColors.warning(msg)),
  error: msg => log(logColors.error(msg)),
};
