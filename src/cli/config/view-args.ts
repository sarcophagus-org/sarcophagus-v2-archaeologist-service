import { sharedOptionDefinitions } from "./shared-args";

export const viewOptionDefinitions = [
  {
    name: "profile",
    alias: "p",
    type: Boolean,
    description: "Shows your profile values",
  },
  {
    name: "sarcophagi",
    alias: "s",
    type: Boolean,
    description: "Shows your sarcophagi",
  },
  {
    name: "balance",
    alias: "b",
    type: Boolean,
    description: "Shows your token balances (ETH + SARCO)",
  },
  ...sharedOptionDefinitions,
];
