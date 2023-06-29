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
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/arch-stats?archAddress=${archAddress}`
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
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/sarcophagus?sarcoId=${sarcoId}&archAddress=${archAddress}`
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
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/sarcophagi-ids?archAddress=${archAddress}`
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
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/sarcophagi?archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getActiveSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/active-sarcophagi?archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getPastSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const archAddress = (await getWeb3Interface()).ethWallet.address.toLowerCase();
      return fetchApiData(
        `https://api.encryptafile.com/subgraph/past-sarcophagi?archAddress=${archAddress}`
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };
}
