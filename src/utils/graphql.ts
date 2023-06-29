import { getWeb3Interface } from "../scripts/web3-interface";
import { SarcophagusDataSimple } from "./onchain-data";
import fetch from "node-fetch";

const fetchApiData = async (url: string) =>
  (await fetch(url, {
    method: "GET",
    headers: { "content-type": "application/json" },
  }))!.json() as any;

interface ArchStats {
  successes: number;
  fails: number;
  accusals: number;
}

export class SubgraphData {
  static getArchStats = async (): Promise<ArchStats | undefined> => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `${subgraphBaseUrl}/arch-stats?chainId=${chainId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
    }
  };

  static getSarcophagus = async (
    sarcoId: string
  ): Promise<
    | (SarcophagusDataSimple & {
        rewrapCount: number;
      })
    | undefined
  > => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `${subgraphBaseUrl}/sarcophagus?chainId=${chainId}&sarcoId=${sarcoId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Returns all sarcophagus IDs that the archaeologist is cursed on, sourced from subgraph.
   */
  static getSarcophagiIds = async (): Promise<string[]> => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `${subgraphBaseUrl}/sarcophagi-ids?chainId=${chainId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  /**
   * Returns all sarcophagi that the archaeologist is cursed on, sourced
   * from subgraph. This DOES NOT include `cursedAmount` and `perSecondFee`
   * and must be queried separately from the contracts.
   */
  static getSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `${subgraphBaseUrl}/sarcophagi?chainId=${chainId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getActiveSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `${subgraphBaseUrl}/active-sarcophagi?chainId=${chainId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getPastSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const web3Interface = await getWeb3Interface();
      const archAddress = web3Interface.ethWallet.address.toLowerCase();
      const { chainId, subgraphBaseUrl } = web3Interface.networkConfig;

      return fetchApiData(
        `https://api.encryptafile.com/subgraph/past-sarcophagi?chainId=${chainId}&archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };
}
