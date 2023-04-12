import { BigNumber } from "ethers";
import { getWeb3Interface } from "../scripts/web3-interface";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { getGracePeriod, SarcophagusDataSimple } from "./onchain-data";
import fetch from "node-fetch";

async function queryGraphQl(query: string) {
  const response = await fetch(process.env.SUBGRAPH_URL!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });

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
            ${
              !opts
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
        blockTimestamp
    }
  }`;
};

const getPublishPrivateKeysQuery = (archAddress: string) => `query {
   publishPrivateKeys (where:{ archaeologist: "${archAddress}" }) {
    sarcoId
    }
}`;

interface SarcoDataSubgraph {
  sarcoId: string;
  resurrectionTime: string;
  blockTimestamp: string;
}

export class SubgraphData {
  static getArchStats = async () => {
    const archAddress = (await getWeb3Interface()).ethWallet.address;
    let archStats = await queryGraphQl(getArchStatsQuery(archAddress));

    const { successes, accusals } = archStats;

    let fails = 0;

    let archSarcos = await queryGraphQl(getArchSarcosQuery(archAddress));

    const inactiveSarcoIds: string[] = [];

    const blockTimestamp = await getBlockTimestamp();
    const gracePeriod = await getGracePeriod();
    const activeTimeThreshold = blockTimestamp - gracePeriod.toNumber();

    archSarcos.forEach(sarco => {
      if (BigNumber.from(sarco.resurrectionTime).gt(activeTimeThreshold)) {
        // activeSarcoIds.push(sarco.sarcoId);
      } else {
        inactiveSarcoIds.push(sarco.sarcoId);
      }
    });

    let publishPrivateKeys = await queryGraphQl(getPublishPrivateKeysQuery(archAddress));

    const unwrappedSarcoIds: string[] = publishPrivateKeys.map((data: any) => data.sarcoId);

    inactiveSarcoIds.forEach(sarcoId => {
      if (!unwrappedSarcoIds.includes(sarcoId)) ++fails;
    });

    return {
      successes,
      accusals,
      fails,
    };
  };
  static getSarcophagi = async (): Promise<SarcoDataSubgraph[]> => {
    try {
      return await queryGraphQl(getArchSarcosQuery((await getWeb3Interface()).ethWallet.address));
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
      const res: SarcoDataSubgraph[] = await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          whereResTimeLessThan: false,
          activeTimeThreshold,
        })
      );

      return res.map<SarcophagusDataSimple>(s => ({
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
      let res: SarcoDataSubgraph[] = await queryGraphQl(
        getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
          whereResTimeLessThan: true,
          activeTimeThreshold,
        })
      );

      return res.map<SarcophagusDataSimple>(s => ({
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
