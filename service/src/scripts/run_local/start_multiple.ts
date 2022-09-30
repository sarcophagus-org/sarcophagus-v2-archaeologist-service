import 'dotenv/config'
import { randomTestArchVals } from "../../utils/random-arch-gen.js";
import { Libp2p } from "libp2p";
import { startService } from '../../start_service';


function _randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Run multiple archaeologists locally
 */
export async function startMultipleLocal(numOfArchsToGenerate: number) {
  const startingTcpPort = _randomIntFromInterval(10000, 15000)
  const startingWsPort = _randomIntFromInterval(15001, 20000)

  let archInitNodePromises: Promise<void | Libp2p>[] = [];

  // Nodes will start with this delay between them
  const delayIncrement = 2000;
  let delay = 0;

  for (let i = 1; i <= numOfArchsToGenerate; i++) {
    const { peerId, listenAddresses } = await randomTestArchVals({
      tcpPort: startingTcpPort + i,
      wsPort: startingWsPort + i
    })

    archInitNodePromises.push(
      new Promise(resolve => setTimeout(resolve, delay))
        .then(() =>
          startService({
            nodeName: `arch${i}`,
            peerId,
            listenAddresses,
            isTest: true,
          })
        )
    )
    delay += delayIncrement
  }

  return Promise.all(archInitNodePromises);
}



