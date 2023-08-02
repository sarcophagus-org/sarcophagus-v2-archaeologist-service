import "dotenv/config";
import { exit } from "process";
import { archLogger } from "../../logger/chalk-theme";

export function getLocalStarSignallingPort() {
  if (!process.env.DEV_SIGNAL_SERVER_PORT) {
    archLogger.error(
      "DEV_SIGNAL_SERVER_PORT not set in .env\nAdd this environment variable to set the port the local signalling server listens on",
      { logTimestamp: true }
    );
    exit();
  }

  const starServerPort = Number.parseInt(process.env.DEV_SIGNAL_SERVER_PORT);

  if (Number.isNaN(starServerPort)) {
    archLogger.error("DEV_SIGNAL_SERVER_PORT  .env is not a valid integer", { logTimestamp: true });
    exit();
  }

  return starServerPort;
}

export function parseLocalArchCountArgs() {
  let archCount = 1;

  const argsStr = process.argv.toString().split("--")[1];

  if (argsStr) {
    const args = argsStr
      .split(",")
      .map(a => a.trim())
      .filter(a => a !== "");
    const countArg = args.find(a => a.includes("count"));

    if (countArg) {
      const count = Number.parseInt(countArg.split(":")[1]);
      if (Number.isNaN(count)) {
        archLogger.error("Invalid count argument", { logTimestamp: true });
        exit();
      }

      archCount = count;
    }
  }

  return archCount;
}
