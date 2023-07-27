#!/usr/bin/env -S node --experimental-specifier-resolution=node

import { ArchaeologistCli } from "./cli";
import { archLogger } from "../logger/chalk-theme";

(async () => {
  const args = process.argv.slice(2);
  const cli = new ArchaeologistCli(args);
  try {
    const result = await cli.run();
    if (result && result.constructor && result.constructor.name === "CommandResult") {
      process.exit(result.exitCode);
    }
  } catch (err) {
    await archLogger.error("cli runtime exception: " + err, {
      logTimestamp: true,
      sendNotification: true,
    });
    if (err.stack) {
      archLogger.error(err.stack, { logTimestamp: true });
    }
    process.exit(1);
  }
})();
