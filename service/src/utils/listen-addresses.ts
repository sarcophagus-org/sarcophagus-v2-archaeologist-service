export const genListenAddresses = (
  ipAddress: string,
  tcpPort: number | string,
  wsPort: number | string,
  servers: string[],
  peerId?: string
): string[] => {
  return [
    tcpListenAddress(ipAddress, tcpPort),
    wsListenAddress(ipAddress, wsPort),
  ].concat(
    ssListenAddresses(servers, peerId)
  )
}

export const tcpListenAddress = (
  ipAddress: string,
  port: number | string
) => {
  return `/ip4/${ipAddress}/tcp/${port}`
}

export const wsListenAddress = (
  ipAddress: string,
  port: number | string
): string => {
  return `/ip4/${ipAddress}/tcp/${port}/ws`
}

export const ssListenAddresses = (
  servers: string[],
  peerId?: string
): string[] => {
  return servers.map(server => {
    const ssAddress = `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`
    return peerId ? `${ssAddress}/p2p/${peerId}` : ssAddress
  })
}
