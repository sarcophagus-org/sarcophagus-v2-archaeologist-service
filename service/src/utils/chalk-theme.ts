import chalk from 'chalk';

export const logColors = {
    error: chalk.bold.red,
    warning: chalk.hex('#FFA500'),
    muted: chalk.dim,
    green: chalk.green,
}

export const archLogger = {
    info: (msg) => console.log(logColors.muted(msg)),
    notice: (msg) => console.log(logColors.green(msg)),
    warn: (msg) => console.log(logColors.warning(msg)),
    error: (msg) => console.log(logColors.error(msg)),
}