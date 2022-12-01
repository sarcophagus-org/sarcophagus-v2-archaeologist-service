import Arweave from "arweave";
import { decrypt } from "ecies-geth";
import { ethers } from "ethers";
import { solidityKeccak256 } from "ethers/lib/utils";
import { Web3Interface } from "scripts/web3-interface";
import { archLogger } from "../logger/chalk-theme";
import { SarcophagusState } from "./onchain-data";
import { getNetworkConfigByChainId, localChainId } from "../lib/config";

const privateKeyPad = (privKey: string): string => {
  return privKey.startsWith("0x") ? privKey : `0x${privKey}`;
};

export const generateArweaveInstance = (): Arweave => {
  const networkConfig = getNetworkConfigByChainId(process.env.CHAIN_ID || localChainId);
  return Arweave.init(networkConfig.arweave);
};

const MAX_ARWEAVE_RETRIES = 10;
const ARWEAVE_RETRY_INTERVAL = 5000;

const fetchAndDecryptShardFromArweave = async (
  txId: string,
  publicKey: string
): Promise<string> => {
  const arweaveInstance = generateArweaveInstance();

  const fetchData = async () => {
    try {
      const data = await arweaveInstance.transactions.getData(txId, {
        decode: true,
        string: true,
      });

      const jsonData = JSON.parse(data as string) as Record<string, string>;
      return jsonData;
    } catch (e) {
      return await fetchDataFallback();
    }
  };

  let _timeout: NodeJS.Timeout | undefined;
  let _nRetries = 1;

  const fetchDataFallback = async (): Promise<Record<string, string>> => {
    try {
      const response = await arweaveInstance.api.get(txId);

      if (response.data.error) throw response.data;

      if (_timeout) {
        clearTimeout(_timeout);
        _timeout = undefined;
      }
      return response.data as Record<string, string>;
    } catch (e) {
      console.log(`fallback ${_nRetries} failed`, e);
      if (_nRetries >= MAX_ARWEAVE_RETRIES) return {};

      _nRetries = _nRetries + 1;
      return new Promise((resolve, _) => {
        console.log("retrying");
        _timeout = setTimeout(
          () => fetchDataFallback().then(data => resolve(data)),
          ARWEAVE_RETRY_INTERVAL
        );
      });
    }
  };

  try {
    const shards = await fetchData();

    const encryptedShard = shards[publicKey];
    if (!encryptedShard) return "";

    const decrypted = await decrypt(
      Buffer.from(ethers.utils.arrayify(privateKeyPad(process.env.ETH_PRIVATE_KEY!))),
      Buffer.from(ethers.utils.arrayify(encryptedShard))
    );

    const decryptedShardString = ethers.utils.hexlify(decrypted);

    return decryptedShardString;
  } catch (e) {
    archLogger.error("Exception in fetchAndDecryptShardFromArweave");
    archLogger.error(e.toString());
    return "";
  }
};

export const fetchAndValidateShardOnArweave = async (
  arweaveShardsTxId: string,
  expectedDoubleHashedKeyShare: string,
  publicKey: string
): Promise<boolean> => {
  try {
    const decryptedKeyShare = await fetchAndDecryptShardFromArweave(arweaveShardsTxId, publicKey);

    if (!decryptedKeyShare) return false;

    const hashedKeyShare = solidityKeccak256(["bytes"], [decryptedKeyShare]);
    const doubleHashedKeyShare = solidityKeccak256(["bytes"], [hashedKeyShare]);

    return expectedDoubleHashedKeyShare === doubleHashedKeyShare;
  } catch (e) {
    archLogger.error("error in fetchAndValidateShardOnArweave:");
    archLogger.error(e);
    return false;
  }
};

export const fetchAndDecryptShard = async (
  web3Interface: Web3Interface,
  sarcoId: string
): Promise<string> => {
  try {
    const sarco = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

    if (sarco.state === SarcophagusState.DoesNotExist) {
      throw "Sarcophagus does not exist";
    }

    const shardsArweaveTxId = sarco.arweaveTxIds[1];
    return fetchAndDecryptShardFromArweave(
      shardsArweaveTxId,
      web3Interface.encryptionWallet.publicKey
    );
  } catch (e) {
    archLogger.error(e);
    throw Error("Error fetching and decrypting shard");
  }
};
