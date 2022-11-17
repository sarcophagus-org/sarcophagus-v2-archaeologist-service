import { startService } from "./start_service";
import { getWeb3Interface } from "./scripts/web3-interface";

const web3Interface = await getWeb3Interface();
await startService({ nodeName: "arch", web3Interface: web3Interface });
