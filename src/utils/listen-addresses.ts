import { getLocalStarSignallingPort } from "../scripts/run_local/helpers";

export const genListenAddresses = (
  servers: string[],
  peerId?: string,
  isLocal?: boolean,
  domain?: string
): string[] => {
  return domain ?
    wssListenAddress(peerId) :
    ssListenAddresses(isLocal === true, servers, peerId);
};

export const wssListenAddress = (
  peerId?: string
): string[] => {
  console.log("listening on websocket")
  return [`/ip4/127.0.0.1/tcp/9000/wss/p2p/${peerId}`]
};

export const ssListenAddresses = (
  isLocal: boolean,
  servers: string[],
  peerId?: string
): string[] => {
  console.log("listening on sig server");
  return servers.map(server => {
    const ssAddress = isLocal
      ? `/ip4/${server}/tcp/${getLocalStarSignallingPort()}/ws/p2p-webrtc-star`
      : `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`;

    return peerId ? `${ssAddress}/p2p/${peerId}` : ssAddress;
  });
};
