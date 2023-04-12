import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { BigNumber } from "ethers";
import { getWeb3Interface } from "scripts/web3-interface";
import { getBlockTimestamp, getDateFromTimestamp } from "./blockchain/helpers";
import { getGracePeriod, SarcophagusData, SarcophagusDataSimple } from "./onchain-data";

const graphQlClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/44302/sarcotest2/13",
  cache: new InMemoryCache(),
});

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
    let result = await graphQlClient.query({
      query: gql(getArchStatsQuery(archAddress)),
      fetchPolicy: "cache-first",
    });

    const { successes, accusals } = result.data;

    let fails = 0;

    let archSarcosResult = await graphQlClient.query({
      query: gql(getArchSarcosQuery(archAddress)),
      fetchPolicy: "cache-first",
    });

    // const activeSarcoIds: string[] = [];
    const inactiveSarcoIds: string[] = [];

    const blockTimestamp = await getBlockTimestamp();
    const gracePeriod = await getGracePeriod();
    const activeTimeThreshold = blockTimestamp - gracePeriod.toNumber();

    archSarcosResult.data.forEach(sarco => {
      if (BigNumber.from(sarco.resurrectionTime).gt(activeTimeThreshold)) {
        // activeSarcoIds.push(sarco.sarcoId);
      } else {
        inactiveSarcoIds.push(sarco.sarcoId);
      }
    });

    let publishPrivateKeysResult = await graphQlClient.query({
      query: gql(getPublishPrivateKeysQuery(archAddress)),
      fetchPolicy: "cache-first",
    });

    const unwrappedSarcoIds: string[] = publishPrivateKeysResult.data.map(
      (data: any) => data.sarcoId
    );

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
      let result = await graphQlClient.query({
        query: gql(getArchSarcosQuery((await getWeb3Interface()).ethWallet.address)),
        fetchPolicy: "cache-first",
      });
      return result.data;
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
      let result = await graphQlClient.query({
        query: gql(
          getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
            whereResTimeLessThan: false,
            activeTimeThreshold,
          })
        ),
        fetchPolicy: "cache-first",
      });

      const res: SarcoDataSubgraph[] = result.data;
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
      let result = await graphQlClient.query({
        query: gql(
          getArchSarcosQuery((await getWeb3Interface()).ethWallet.address, {
            whereResTimeLessThan: true,
            activeTimeThreshold,
          })
        ),
        fetchPolicy: "cache-first",
      });

      const res: SarcoDataSubgraph[] = result.data;
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
