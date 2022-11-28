import { webRTCStar } from "@libp2p/webrtc-star";
import wrtc from "wrtc";
import { kadDHT } from "@libp2p/kad-dht";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import { Libp2pOptions } from "libp2p";

interface NodeConfigParams {
  bootstrapList?: string[];
  isBootstrap?: boolean;
  autoDial?: boolean;
}

// protocol names used to set up communication with embalmer node nodes
export const PUBLIC_KEY_STREAM = "/archaeologist-public-key";
export const NEGOTIATION_SIGNATURE_STREAM = "/archaeologist-negotiation-signature";
export const SIGNAL_SERVER_LIST = ["sig.encryptafile.com"];
const DHT_PROTOCOL_PREFIX = "/archaeologist-service";

const dht = kadDHT({
  protocolPrefix: DHT_PROTOCOL_PREFIX,
  clientMode: false,
});

const webRtcStar = webRTCStar({ wrtc });

export class NodeConfig {
  public configObj: Libp2pOptions = {
    transports: [webRtcStar.transport],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    dht,
    peerDiscovery: [webRtcStar.discovery],
    connectionManager: {
      autoDial: false,
    },
  };

  constructor(options: NodeConfigParams = {}) {
    if (options.bootstrapList) {
      this.configObj.peerDiscovery!.push(
        bootstrap({
          list: options.bootstrapList,
        })
      );
    }

    if (options.isBootstrap) {
      this.configObj.relay = {
        enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
        hop: {
          enabled: true, // Allows you to be a relay for other peers
        },
      };
    }

    if (options.autoDial) {
      this.configObj.connectionManager = {
        autoDial: true,
      };
    }
  }

  public add(key: any, val: any) {
    Object.assign(this.configObj, {
      [key]: val,
    });
  }
}
