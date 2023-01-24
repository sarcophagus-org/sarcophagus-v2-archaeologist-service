import chalk from "chalk";

export const logColors = {
  error: chalk.bold.red,
  warning: chalk.hex("#d8972f"),
  muted: chalk.dim,
  green: chalk.green,
};

export const archLogger = {
  debug: msg => {
    if (process.env.DEBUG) {
      const debugLog = logColors.muted(`debug-${process.env.npm_package_version}::${msg}`);
      console.log(debugLog);
    }
  },
  info: msg => console.log(logColors.muted(msg)),
  notice: msg => console.log(logColors.green(msg)),
  warn: msg => console.log(logColors.warning(msg)),
  error: msg => console.log(logColors.error(msg)),
};
