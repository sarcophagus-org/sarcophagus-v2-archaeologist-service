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
const obj = await genPeerIdJSON();

if (fs.existsSync(file)) {
  jsonfile.readFile(file)
    .catch(_error => {
      console.log("peer-id exists but couldn't parse file. generating new peer id");
      jsonfile.writeFile(file, obj, function (err) {
        if (err) console.error(err);
      });
    })
} else {
  console.log("peer-id does not exist, creating new peerID JSON file");
  jsonfile.writeFile(file, obj, function (err) {
    if (err) console.error(err);
  });
}


