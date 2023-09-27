import { NetworkContext } from "../network-config";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { getGracePeriod, SarcophagusDataSimple } from "./onchain-data";
import fetch from "node-fetch";

const getArchStatsQuery = (archAddress: string) => `query {
    archaeologist (id: "${archAddress}") {
        address
        successes
        failures
        accusals
        blockTimestamp
    }
}`;

const getArchSarcosQuery = (
  archAddress: string,
  opts?: { activeTimeThreshold: number; limitToActiveForArch: boolean }
) => {
  return `query {
    sarcophagusDatas (
        where: {
            cursedArchaeologists_contains_nocase: ["${archAddress}"],
            ${
              !opts
                ? ""
                : opts.limitToActiveForArch
                ? // ACTIVE: arch has NOT published, AND sarco is not expired or buried
                  `publishes_not_contains_nocase: ["${archAddress}"], resurrectionTime_gt: ${opts.activeTimeThreshold}, isBuried: false`
                : // INACTIVE: res time is behind resurrection threshold (sarco has expired)
                  `resurrectionTime_lte: ${opts.activeTimeThreshold}`
            }
        }
        orderBy: resurrectionTime,
        orderDirection: desc
    ) {
        sarcoId
        resurrectionTime
        previousRewrapTime
        publishes
        blockTimestamp
    }
  }`;
};

const getSarcoWithRewrapsQuery = (sarcoId: string) => {
  return `query {
    sarcophagusData (id: "${sarcoId}") {
        sarcoId
        resurrectionTime
        previousRewrapTime
        publishes
        blockTimestamp
    },
    rewrapSarcophaguses (where:{sarcoId: "${sarcoId}"}) {
      id
      blockNumber
      totalDiggingFees
    }
  }`;
};

interface SarcoDataSubgraph {
  sarcoId: string;
  publishes: string[];
  resurrectionTime: string;
  blockTimestamp: string;
}

const getCurseStatus = (
  sarcophagusData: SarcoDataSubgraph,
  archAddress: string,
  blockTimestamp: number,
  resurrectionThreshold: number
): string =>
  sarcophagusData.publishes.includes(archAddress.toLowerCase())
    ? "SUCCESS"
    : blockTimestamp < resurrectionThreshold
    ? "ACTIVE"
    : "FAILED";

export class SubgraphData {
  static getArchStats = async (networkContext: NetworkContext) => {
    const archAddress = networkContext!.ethWallet.address;
    const { archaeologist: archStats } = await this.queryGraphQl(getArchStatsQuery(archAddress), networkContext);

    const { successes, accusals, failures } = archStats;

    return {
      successes: successes.length,
      accusals,
      fails: failures,
    };
  };

  private static async queryGraphQl(query: string, networkContext: NetworkContext) {
    const response = await fetch(
      networkContext!.networkConfig.subgraphUrl || process.env.SUBGRAPH_URL!,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      }
    );

    const { data } = (await response.json()) as { data: any };
    return data;
  }

  static getSarcophagus = async (
    sarcoId: string, networkContext: NetworkContext
  ): Promise<
    | (SarcophagusDataSimple & {
        rewrapCount: number;
      })
    | undefined
  > => {
    try {
      const { sarcophagusData, rewrapSarcophaguses } = (await this.queryGraphQl(
        getSarcoWithRewrapsQuery(sarcoId),
        networkContext
      )) as {
        sarcophagusData: SarcoDataSubgraph;
        rewrapSarcophaguses: {
          blockNumber: string;
          totalDiggingFees: string;
        }[];
      };

      const blockTimestamp = await getBlockTimestamp(networkContext!);
      const resurrectionThreshold =
        Number.parseInt(sarcophagusData.resurrectionTime) + (await getGracePeriod(networkContext!)).toNumber();

      return {
        id: sarcophagusData.sarcoId,
        curseStatus: getCurseStatus(
          sarcophagusData,
          networkContext!.ethWallet.address,
          blockTimestamp,
          resurrectionThreshold
        ),
        creationDate: getDateFromTimestamp(Number.parseInt(sarcophagusData.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(sarcophagusData.resurrectionTime)),
        rewrapCount: rewrapSarcophaguses.length,
      };
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Returns all sarcophagi that the archaeologist is cursed on, sourced
   * from subgraph. This DOES NOT include `cursedAmount` and `perSecondFee`
   * and must be queried separately from the contracts.
   */
  static getSarcophagiIds = async (archAddress: string, networkContext: NetworkContext): Promise<string[]> => {
    try {
      const { sarcophagusDatas } = (await this.queryGraphQl(getArchSarcosQuery(archAddress), networkContext)) as {
        sarcophagusDatas: SarcoDataSubgraph[];
      };

      return sarcophagusDatas.map(s => s.sarcoId);
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
  static getSarcophagi = async (networkContext: NetworkContext): Promise<SarcophagusDataSimple[]> => {
    try {
      const archAddress = networkContext!.ethWallet.address.toLowerCase();
      const { sarcophagusDatas } = (await this.queryGraphQl(getArchSarcosQuery(archAddress), networkContext)) as {
        sarcophagusDatas: SarcoDataSubgraph[];
      };

      const blockTimestamp = await getBlockTimestamp(networkContext!);
      const gracePeriod = (await getGracePeriod(networkContext!)).toNumber();

      return sarcophagusDatas.map(s => ({
        id: s.sarcoId,
        curseStatus: getCurseStatus(
          s,
          archAddress,
          blockTimestamp,
          Number.parseInt(s.resurrectionTime) + gracePeriod
        ),
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getActiveSarcophagi = async (networkContext: NetworkContext): Promise<SarcophagusDataSimple[]> => {
    try {
      const blockTimestamp = await getBlockTimestamp(networkContext!);
      const gracePeriod = (await getGracePeriod(networkContext!)).toNumber();
      const archAddress = networkContext!.ethWallet.address.toLowerCase();

      const { sarcophagusDatas } = (await this.queryGraphQl(
        getArchSarcosQuery(archAddress, {
          limitToActiveForArch: true,
          activeTimeThreshold: blockTimestamp - gracePeriod,
        }), 
        networkContext
      )) as { sarcophagusDatas: SarcoDataSubgraph[] };

      return sarcophagusDatas.map<SarcophagusDataSimple>(s => ({
        id: s.sarcoId,
        curseStatus: "ACTIVE",
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getPastSarcophagi = async (networkContext: NetworkContext): Promise<SarcophagusDataSimple[]> => {
    try {
      const blockTimestamp = await getBlockTimestamp(networkContext!);
      const gracePeriod = (await getGracePeriod(networkContext!)).toNumber();
      const archAddress = networkContext!.ethWallet.address.toLowerCase();

      const { sarcophagusDatas } = (await this.queryGraphQl(
        getArchSarcosQuery(archAddress, {
          limitToActiveForArch: false,
          activeTimeThreshold: blockTimestamp - gracePeriod,
        }),
        networkContext
      )) as { sarcophagusDatas: SarcoDataSubgraph[] };

      return sarcophagusDatas.map<SarcophagusDataSimple>(s => ({
        id: s.sarcoId,
        curseStatus: getCurseStatus(
          s,
          archAddress,
          blockTimestamp,
          Number.parseInt(s.resurrectionTime) + gracePeriod
        ),
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };
}
