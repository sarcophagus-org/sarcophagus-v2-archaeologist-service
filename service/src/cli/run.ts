import {ArchaeologistCli} from "./cli";
import { archLogger } from "../logger/chalk-theme";

(async () => {
  const args = process.argv.slice(2);
  const cli = new ArchaeologistCli(args);
  try {
    const result = await cli.run();
    if (result && result.constructor &&
      result.constructor.name === 'CommandResult') {
      process.exit(result.exitCode);
    }
  } catch (err) {
    archLogger.error('cli runtime exception: ' + err);
    if (err.stack) {
      archLogger.error(err.stack);
    }
    process.exit(1);
  }
})();