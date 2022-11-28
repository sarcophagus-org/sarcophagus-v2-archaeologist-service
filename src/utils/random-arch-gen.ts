import PeerId from "peer-id";
import { genListenAddresses } from "./listen-addresses";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { SIGNAL_SERVER_LIST } from "../models/node-config";

const localhost = "127.0.0.1";
const localStarServer = localhost;

export const randomTestArchVals = async (opts: {
  existingPeerId?;
  isLocal?: boolean;
}) => {
  const { existingPeerId, isLocal } = opts;

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
    isLocal ? [localStarServer] : SIGNAL_SERVER_LIST,
    peerIdJson.id,
    isLocal
  );

  return { peerId, listenAddresses };
};
