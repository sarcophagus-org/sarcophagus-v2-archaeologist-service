import 'dotenv/config'
import { Libp2p } from "libp2p";
import jsonfile from "jsonfile"
import { createFromJSON } from "@libp2p/peer-id-factory";
import { EnvConfig } from 'models/env-config';

import ethers from "ethers";

export function getMultiAddresses(node: Libp2p): string[] {
  return node.getMultiaddrs().map((m) => m.toString())
}

export function validateEnvVars() {
  if (!process.env.IP_ADDRESS) {
    throw Error("IP_ADDRESS not set in .env")
  }

  if (!process.env.TCP_PORT) {
    throw Error("TCP_PORT not set in .env")
  }

  if (!process.env.WS_PORT) {
    throw Error("WS_PORT not set in .env")
  }

  if (!process.env.SIGNAL_SERVER_LIST) {
    throw Error("SIGNAL_SERVER_LIST not set in .env")
  }

  if (!process.env.IS_BOOTSTRAP && !process.env.BOOTSTRAP_LIST) {
    throw Error("BOOTSTRAP_LIST not set in .env")
  }

  if (!process.env.ENCRYPTION_PRIVATE_KEY) {
    throw Error("ENCRYPTION_PRIVATE_KEY not set in .env")
  }
  if (!process.env.MAX_RESURRECTION_TIME) {
    throw Error("MAX_RESURRECTION_TIME not set in .env")
  }
  if (!process.env.MIN_BOUNTY) {
    throw Error("MIN_BOUNTY not set in .env")
  }
  if (!process.env.MIN_DIGGING_FEES) {
    throw Error("MIN_DIGGING_FEES not set in .env")
  }
  if (!process.env.IS_ARWEAVER) {
    throw Error("IS_ARWEAVER not set in .env")
  }
  if (!process.env.FEE_PER_BYTE) {
    throw Error("FEE_PER_BYTE not set in .env")
  }

  var wallet = new ethers.Wallet(process.env.ENCRYPTION_PRIVATE_KEY);

  const config: EnvConfig = {
    publicKey: wallet.publicKey,
    maxRessurectionTime: Number.parseInt(process.env.MAX_RESURRECTION_TIME),
    minBounty: Number.parseInt(process.env.MIN_BOUNTY),
    minDiggingFees: Number.parseInt(process.env.MIN_DIGGING_FEES),
    isArweaver: process.env.IS_ARWEAVER === "true",
    feePerByte: Number.parseInt(process.env.FEE_PER_BYTE),
  };

  return config;
}

export async function loadPeerIdFromFile(idFilePath?: string) {
  const peerIdFile = idFilePath ?? './peer-id.json'

  try {
    const peerIdJson = await jsonfile.readFile(peerIdFile)
    const peerId = createFromJSON(peerIdJson)

    if (!peerId) {
      throw Error("Could not load peer ID. Please make sure peer-id.json file exists in root directory")
    }

    return peerId
  } catch (err) {
    throw Error(`Error loading peer id: ${err}. Try running "npm run peer-id-gen" first`)
  }
}
