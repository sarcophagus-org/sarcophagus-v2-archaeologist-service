import PeerId from "peer-id";
import { genListenAddresses } from "./listen-addresses";
import { createFromJSON } from "@libp2p/peer-id-factory";

const localhost = "127.0.0.1";
const localStarServer = localhost;

export const randomTestArchVals = async (opts: {
  tcpPort: string | number;
  wsPort: string | number;
  existingPeerId?;
  isLocal?: boolean;
}) => {
  const { tcpPort, existingPeerId, isLocal } = opts;

  let peerIdJson, peerId;
  if (!existingPeerId) {
    const randomPeerId = await PeerId.create({ bits: 1024, keyType: "Ed25519" });
    peerIdJson = randomPeerId.toJSON();
    peerId = await createFromJSON(peerIdJson);
  } else {
    peerId = existingPeerId;
    peerIdJson = peerId.toJSON();
  }

  const listenAddresses = genListenAddresses(
    localhost,
    tcpPort,
    isLocal ? [localStarServer] : process.env.SIGNAL_SERVER_LIST!.split(",").map(s => s.trim()),
    peerIdJson.id,
    isLocal
  );

  return { peerId, listenAddresses };
};