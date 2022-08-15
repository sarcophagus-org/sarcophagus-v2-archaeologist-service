import 'dotenv/config'
import { getWeb3Interface } from './scripts/web3-interface'
import { Archaeologist } from "./models/archaeologist"
import { validateEnvVars } from './utils/validateEnv'
import { ethers } from 'ethers'
import { parseArgs } from './utils/parseArgs'

const config = validateEnvVars()

const arch = new Archaeologist({
  name: "arch",
  bootstrapList: process.env.BOOTSTRAP_LIST!.split(",").map(s => s.trim()),
  listenAddressesConfig: {
    ipAddress: process.env.IP_ADDRESS!,
    tcpPort: process.env.TCP_PORT!,
    wsPort: process.env.WS_PORT!,
    signalServerList: process.env.SIGNAL_SERVER_LIST!.split(",").map(s => s.trim())
  }
})

await arch.initNode({ config })
arch.setupIncomingConfigStream();

const web3Interface = await getWeb3Interface();

const bal = await web3Interface.sarcoToken.balanceOf(await web3Interface.signer.getAddress());
const ethBal = await web3Interface.signer.getBalance();

console.log("ETH Balance: ", ethers.utils.formatEther(ethBal));
console.log("SARCO Balance: ", ethers.utils.formatEther(bal));

parseArgs(web3Interface);