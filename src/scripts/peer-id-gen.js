import fs from 'fs';
import jsonfile from "jsonfile";
import PeerId from "peer-id";

/**
 * This script generates a JSON file with
 * values necessary to create a peer ID for a libp2p node
 */

async function genPeerIdJSON() {
  const peerId = await PeerId.create({ bits: 1024, keyType: "Ed25519" });
  return peerId.toJSON();
}

const file = "./peer-id.json";

if (!fs.existsSync(file)) {
  console.log("creating new peerID JSON file");
  const obj = await genPeerIdJSON();

  jsonfile.writeFile(file, obj, function (err) {
    if (err) console.error(err);
  });
}


