import { parseEther } from "ethers/lib/utils";

export const freeBondDefinitions = [
  {
    name: "withdraw",
    alias: "w",
    type: parseEther,
    description: "How much free bond to withdraw in SARCO.",
  },
  {
    name: "deposit",
    alias: "d",
    type: parseEther,
    description: "How much free bond to deposit in SARCO.",
  },
];
