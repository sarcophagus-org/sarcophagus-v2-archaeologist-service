import { getWeb3Interface } from "../scripts/web3-interface";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { getGracePeriod, SarcophagusDataSimple } from "./onchain-data";
import fetch from "node-fetch";

async function queryGraphQl(query: string) {
  const web3Interface = await getWeb3Interface();

  const response = await fetch(
    web3Interface.networkConfig.subgraphUrl || process.env.SUBGRAPH_URL!,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    }
  );

  const { data } = (await response.json()) as { data: any };
  return data;
}

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
            ${!opts
      ? ""
      : opts.limitToActiveForArch
        // ACTIVE: arch has NOT published, AND sarco is not expired
        ? `publishes_not_contains_nocase: ["${archAddress}], resurrectionTime_gt: ${opts.activeTimeThreshold}`
        // INACTIVE: res time is behind resurrection threshold (sarco has expired)
        : `resurrectionTime_lte: ${opts.activeTimeThreshold}`
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
  resurrectionTime: string;
  blockTimestamp: string;
}

export class SubgraphData {
  static getArchStats = async () => {
    const archAddress = (await getWeb3Interface()).ethWallet.address;
    const { archaeologist: archStats } = await queryGraphQl(getArchStatsQuery(archAddress));

    const { successes, accusals, failures } = archStats;

    return {
      successes: successes.length,
      accusals,
      fails: failures,
    };
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
      const { sarcophagusData, rewrapSarcophaguses } = (await queryGraphQl(
        getSarcoWithRewrapsQuery(sarcoId)
      )) as {
        sarcophagusData: SarcoDataSubgraph;
        rewrapSarcophaguses: {
          blockNumber: string;
          totalDiggingFees: string;
        }[];
      };

      return {
        id: sarcophagusData.sarcoId,
        creationDate: getDateFromTimestamp(Number.parseInt(sarcophagusData.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(sarcophagusData.resurrectionTime)),
        rewrapCount: rewrapSarcophaguses.length,
      };
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Returns all sarcophagus that the archaeologist is cursed on, sourced
   * from subgraph. This DOES NOT include `cursedAmount` and `perSecondFee`
   * and must be queryed separately from the contracts.
   */
  static getSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    try {
      const { sarcophagusDatas } = (await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address)
      )) as { sarcophagusDatas: SarcoDataSubgraph[] };

      return sarcophagusDatas.map(s => ({
        id: s.sarcoId,
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getActiveSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    const blockTimestamp = await getBlockTimestamp();
    const gracePeriod = (await getGracePeriod()).toNumber();
    try {
      const { sarcophagusDatas } = (await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          limitToActiveForArch: true,
          activeTimeThreshold: blockTimestamp - gracePeriod
        })
      )) as { sarcophagusDatas: SarcoDataSubgraph[] };

      return sarcophagusDatas.map<SarcophagusDataSimple>(s => ({
        id: s.sarcoId,
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  static getPastSarcophagi = async (): Promise<SarcophagusDataSimple[]> => {
    const blockTimestamp = await getBlockTimestamp();
    const gracePeriod = (await getGracePeriod()).toNumber();

    try {
      const { sarcophagusDatas } = (await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          limitToActiveForArch: false,
          activeTimeThreshold: blockTimestamp - gracePeriod
        })
      )) as { sarcophagusDatas: SarcoDataSubgraph[] };

      return sarcophagusDatas.map<SarcophagusDataSimple>(s => ({
        id: s.sarcoId,
        creationDate: getDateFromTimestamp(Number.parseInt(s.blockTimestamp)),
        resurrectionTime: getDateFromTimestamp(Number.parseInt(s.resurrectionTime)),
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };
}
