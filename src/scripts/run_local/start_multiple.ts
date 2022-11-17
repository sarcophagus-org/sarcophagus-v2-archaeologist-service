import "dotenv/config";
import { randomTestArchVals } from "../../utils/random-arch-gen.js";
import { Libp2p } from "libp2p";
import { startService } from "../../start_service";
import { getWeb3Interface } from "../../scripts/web3-interface";

/**
 * Run multiple archaeologists locally
 */
export async function startMultipleLocal(numOfArchsToGenerate: number) {
  let archInitNodePromises: Promise<void | Libp2p>[] = [];
  const web3Interface = await getWeb3Interface({ startMulitpleRandom: true });

  // Nodes will start with this delay between them
  const delayIncrement = 2000;
  let delay = 0;

  for (let i = 1; i <= numOfArchsToGenerate; i++) {
    const { peerId, listenAddresses } = await randomTestArchVals({
      isLocal: true,
    });

    archInitNodePromises.push(
      new Promise(resolve => setTimeout(resolve, delay)).then(() =>
        startService({
          nodeName: `arch${i}`,
          web3Interface,
          peerId,
          listenAddresses,
        })
      )
    );
    delay += delayIncrement;
  }

  return Promise.all(archInitNodePromises);
}
