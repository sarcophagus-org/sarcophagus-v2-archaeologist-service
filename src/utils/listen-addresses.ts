import { getLocalStarSignallingPort } from "../scripts/run_local/helpers";
import { archLogger } from "../logger/chalk-theme";

export const genListenAddresses = (
  servers: string[],
  chainId: number,
  peerId?: string,
  isLocal?: boolean,
  domain?: string
): string[] => {
  return domain ? wssListenAddress(chainId) : ssListenAddresses(isLocal === true, servers, peerId);
};

export const wssListenAddress = (chainId: number): string[] => {
  archLogger.debug("using websockets");

  // To support running the archaeologist service on multiple networks simultaneously,
  // we need to listen on a different port for each network.
  // We use the chainId to determine which port to use. These ports are hardcoded in the
  // docker-compose.yml file of the quickstart-archaeologist repo.
  // TODO: for cleaner looking code, we could import these ports from the sdk.
  const chainIdTolistenPort = new Map<number, string>([
    [1, "9000"], // mainnet
    [11155111, "9001"], // sepolia
    [5, "9002"], // goerli
    [84531, "9003"], // baseGoerli
    [80001, "9004"], // Polygon Mumbai
  ]);

  return [`/ip4/127.0.0.1/tcp/${chainIdTolistenPort[chainId]}/wss`];
};

export const ssListenAddresses = (
  isLocal: boolean,
  servers: string[],
  peerId?: string
): string[] => {
  archLogger.debug("using signalling server");
  return servers.map(server => {
    const ssAddress = isLocal
      ? `/ip4/${server}/tcp/${getLocalStarSignallingPort()}/ws/p2p-webrtc-star`
      : `/dns4/${server}/tcp/443/wss/p2p-webrtc-star`;

    return peerId ? `${ssAddress}/p2p/${peerId}` : ssAddress;
  });
};
