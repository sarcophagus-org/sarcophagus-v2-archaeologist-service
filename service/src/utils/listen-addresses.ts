import { starServerPort } from "scripts/signalling-server"

export const genListenAddresses = (
  ipAddress: string,
  tcpPort: number | string,
  servers: string[],
  peerId?: string,
  isLocal?: boolean
): string[] => {
  return [tcpListenAddress(ipAddress, tcpPort)]
    .concat(ssListenAddresses(isLocal === true, servers, peerId))
}

export const tcpListenAddress = (
  ipAddress: string,
  port: number | string
) => {
  return `/ip4/${ipAddress}/tcp/${port}`
}

export const ssListenAddresses = (
  isLocal: boolean,
  servers: string[],
  peerId?: string
): string[] => {
  return servers.map(server => {
    const ssAddress = isLocal ?
      `/ip4/${server}/tcp/${starServerPort}/ws/p2p-webrtc-star` :
      `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`;

    return peerId ? `${ssAddress}/p2p/${peerId}` : ssAddress
  })
}
