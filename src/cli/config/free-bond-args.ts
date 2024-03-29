import { parseEther } from "ethers/lib/utils";

export const freeBondDefinitions = [
  {
    name: "network",
    alias: "n",
    type: String,
    description: "Network to run this command on.",
  },
  {
    name: "withdraw",
    alias: "w",
    type: parseEther,
    description: "How much free bond to withdraw in SARCO.",
  },
  {
    name: "withdraw-all",
    alias: "a",
    type: Boolean,
    description: "Withdraw all available free bond.",
  },
  {
    name: "deposit",
    alias: "d",
    type: parseEther,
    description: "How much free bond to deposit in SARCO.",
  },
];
