import chalk from "chalk";

export const logColors = {
  error: chalk.bold.red,
  warning: chalk.hex("#d8972f"),
  muted: chalk.dim,
  green: chalk.green,
};

const currentTimePrefix = () => logColors.muted(`${new Date(Date.now()).toISOString()}  `);

export const archLogger = {
  debug: msg => {
    if (process.env.DEBUG) {
      const debugLog = logColors.muted(
        `${currentTimePrefix()}debug-${process.env.npm_package_version}::${msg}`
      );
      console.log(debugLog);
    }
  },
  info: (msg, logTimestamp = false) =>
    console.log(`${logTimestamp ? currentTimePrefix() : ""}${logColors.muted(msg)}`),
  notice: (msg, logTimestamp = false) =>
    console.log(`${logTimestamp ? currentTimePrefix() : ""}${logColors.green(msg)}`),
  warn: (msg, logTimestamp = false) =>
    console.log(`${logTimestamp ? currentTimePrefix() : ""}${logColors.warning(msg)}`),
  error: (msg, logTimestamp = false) =>
    console.log(`${logTimestamp ? currentTimePrefix() : ""}${logColors.error(msg)}`),
};
