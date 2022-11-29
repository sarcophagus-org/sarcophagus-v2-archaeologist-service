import "dotenv/config";
import jsonfile from "jsonfile";
import { createFromJSON } from "@libp2p/peer-id-factory";

export async function loadPeerIdFromFile() {
  const peerIdFile = "./peer-id.json";

  try {
    const peerIdJson = await jsonfile.readFile(peerIdFile);
    const peerId = createFromJSON(peerIdJson);

    if (!peerId) {
      throw Error(
        "Could not load peer ID. Please make sure peer-id.json file exists in root directory"
      );
    }

    return peerId;
  } catch (err) {
    throw Error(`Error loading peer id: ${err}. Try running "npm run peer-id-gen" first`);
  }
}
