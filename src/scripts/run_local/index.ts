import "dotenv/config";
import { sigServer } from "@libp2p/webrtc-star-signalling-server";
import { archLogger } from "../../logger/chalk-theme";
import { getLocalStarSignallingPort, parseLocalArchCountArgs } from "./helpers";
import { startMultipleLocal } from "./start_multiple";

const starServerPort = getLocalStarSignallingPort();
const archCount = parseLocalArchCountArgs();

try {
  await sigServer({
    port: starServerPort,
    host: "127.0.0.1",
    metrics: true,
  });

  archLogger.notice(
    `\n⚡️ Local star signalling server started on http://localhost:${starServerPort}`,
    true
  );
} catch (e) {
  const addr = `127.0.0.1:${starServerPort}`;
  if (e.toString().includes(`address already in use ${addr}`)) {
    archLogger.warn(
      `⚠️ Address ${addr} is in use.\nIf this isn't a local signalling server, you might want to close the process using this and re-run this script\n`,
      true
    );
  } else {
    throw e;
  }
}

archLogger.notice(`⚡️ Starting ${archCount} archaeologist nodes...\n`, true);
if (archCount > 5) {
  archLogger.warn(
    "================================================================================================="
  );
  archLogger.warn(
    " ⚠️ WARNING: STARTING UP TOO MANY NODES IN ONE THREAD MIGHT CLOG UP PROCESSES AND BLOCK MESSAGING ",
    true
  );
  archLogger.warn(
    "================================================================================================="
  );
}

await startMultipleLocal(archCount);
