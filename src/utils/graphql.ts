import { getWeb3Interface } from "../scripts/web3-interface";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { getGracePeriod, SarcophagusDataSimple } from "./onchain-data";
import fetch from "node-fetch";
import { archLogger } from "logger/chalk-theme";

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
        accusals
        blockTimestamp
    }
}`;

const getArchSarcosQuery = (
  archAddress: string,
  opts?: { activeTimeThreshold: number; whereResTimeLessThan: boolean }
) => {
  return `query {
    sarcophagusDatas (
        where: {
            cursedArchaeologists_contains_nocase: ["${archAddress}"],
            ${!opts
      ? ""
      : opts.whereResTimeLessThan
        ? `resurrectionTime_lt: ${opts.activeTimeThreshold}`
        : `resurrectionTime_gte: ${opts.activeTimeThreshold}`
    }
        }
        orderBy:resurrectionTime,
        orderDirection: desc
    ) {
        sarcoId
        resurrectionTime
        previousRewrapTime
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

    const { successes, accusals } = archStats;

    let fails = 0;

    const { sarcophagusDatas } = (await queryGraphQl(getArchSarcosQuery(archAddress))) as {
      sarcophagusDatas: SarcoDataSubgraph[];
    };

    const blockTimestamp = await getBlockTimestamp();
    const gracePeriod = await getGracePeriod();
    const activeTimeThreshold = blockTimestamp + gracePeriod.toNumber();

    sarcophagusDatas.forEach(sarco => {
      if (Number.parseInt(sarco.resurrectionTime) > activeTimeThreshold) {
        archLogger.debug('a fail:');
        archLogger.debug(`res time: ${getDateFromTimestamp(Number.parseInt(sarco.resurrectionTime))}`);
        archLogger.debug(`threshold: ${getDateFromTimestamp(activeTimeThreshold)}`);
        // If this arch doesn't have a sarcoId, which is past its grace period, in its successes, then it never published
        if (!successes.includes(sarco.sarcoId)) ++fails;
      }
    });

    return {
      successes: successes.length,
      accusals,
      fails,
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
    const gracePeriod = await getGracePeriod();
    const activeTimeThreshold = blockTimestamp - gracePeriod.toNumber();
    try {
      const { sarcophagusDatas } = (await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          whereResTimeLessThan: false,
          activeTimeThreshold,
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
    const gracePeriod = await getGracePeriod();
    const activeTimeThreshold = blockTimestamp - gracePeriod.toNumber();
    try {
      const { sarcophagusDatas } = (await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          whereResTimeLessThan: true,
          activeTimeThreshold,
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
