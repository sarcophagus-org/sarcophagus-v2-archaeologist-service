import "dotenv/config";
import { randomTestArchVals } from "../../utils/random-arch-gen.js";
import { Libp2p } from "libp2p";
import { startService } from "../../start_service";
import { HARDHAT_CHAIN_ID, SarcoSupportedNetwork } from "@sarcophagus-org/sarcophagus-v2-sdk";
import { getWeb3Interface } from "../../scripts/web3-interface.js";

/**
 * Run multiple archaeologists locally
 */
export async function startMultipleLocal(numOfArchsToGenerate: number) {
  let archInitNodePromises: Promise<void | Libp2p>[] = [];

  // Nodes will start with this delay between them
  const delayIncrement = 2000;
  let delay = 0;

  for (let i = 1; i <= numOfArchsToGenerate; i++) {
    const { peerId, listenAddresses } = await randomTestArchVals({
      isLocal: true,
    });

    archInitNodePromises.push(
      new Promise(resolve => setTimeout(resolve, delay)).then(async () =>
        startService({
          nodeName: `arch${i}`,
          peerId,
          listenAddresses,
          isTest: true,
          networkContexts: [
            (await getWeb3Interface()).getNetworkContext(HARDHAT_CHAIN_ID as SarcoSupportedNetwork),
          ],
        })
      )
    );
    delay += delayIncrement;
  }

  return Promise.all(archInitNodePromises);
}
