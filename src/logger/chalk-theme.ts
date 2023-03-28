import chalk from "chalk";

export const logColors = {
  error: chalk.bold.red,
  warning: chalk.hex("#d8972f"),
  muted: chalk.dim,
  green: chalk.green,
};

const currentTimePrefix = () => logColors.muted(`${new Date().toISOString()}  `);

export const archLogger = {
  debug: msg => {
    if (process.env.DEBUG) {
      const debugLog = logColors.muted(
        `${currentTimePrefix()}debug-${process.env.npm_package_version}::${msg}`
      );
      console.log(debugLog);
    }
  },
  info: msg => console.log(`${currentTimePrefix()}${logColors.muted(msg)}`),
  notice: msg => console.log(`${currentTimePrefix()}${logColors.green(msg)}`),
  warn: msg => console.log(`${currentTimePrefix()}${logColors.warning(msg)}`),
  error: msg => console.log(`${currentTimePrefix()}${logColors.error(msg)}`),
};
