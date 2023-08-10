import fs from "fs";
import jsonfile from "jsonfile";
import PeerId from "peer-id";
const { exec } = require('child_process');

/**
 * This script generates a JSON file with
 * values necessary to create a peer ID for a libp2p node
 */


// Function to execute a shell command and return a Promise
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(`Error executing command: ${cmd}`);
                console.error(error);
                reject(error);
            } else {
                resolve(stdout ? stdout.trim() : '');
            }
        });
    });
}

async function updateVolumeWithFile() {
    try {
        console.log("Creating or verifying named volume...");
        await execShellCommand('docker volume create peer-id-volume');
        
        console.log("Populating named volume with peer-id.json...");
        const cmd = 'docker run --rm -v $(pwd)/peer-id.json:/data/peer-id.json -v peer-id-volume:/home/node/app busybox cp /data/peer-id.json /home/node/app/';
        await execShellCommand(cmd);
        
        console.log("Volume updated successfully!");
    } catch (error) {
        console.error("Error updating the volume:", error);
    }
}


async function genPeerIdJSON() {
  const peerId = await PeerId.create({ bits: 1024, keyType: "Ed25519" });
  return peerId.toJSON();
}

const file = "./peer-id.json";
const obj = await genPeerIdJSON();

function createPeerIdFile() {
  jsonfile.writeFile(file, obj, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log("peer-id file created successfully");
      updateVolumeWithFile();
    }
  });
}

if (fs.existsSync(file)) {
  jsonfile.readFile(file).catch(_error => {
    console.log("peer-id exists but couldn't parse file. generating new peer id");
    createPeerIdFile();
  });
} else {
  console.log("peer-id does not exist, creating new peerID JSON file");
    createPeerIdFile();
}
