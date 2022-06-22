import { Libp2p } from "libp2p";
import PeerId from 'peer-id'

export async function genPeerIdJSON(): Promise<PeerId.JSONPeerId> {
  const peerId = await PeerId.create({ bits: 1024, keyType: 'Ed25519' })
  return peerId.toJSON()
}

export function getMultiAddresses(node: Libp2p): string[] {
  return node.getMultiaddrs().map((m) => m.toString())
}