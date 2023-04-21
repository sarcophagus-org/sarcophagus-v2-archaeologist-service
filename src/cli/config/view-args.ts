export const viewOptionDefinitions = [
  {
    name: "profile",
    alias: "p",
    type: Boolean,
    description: "Shows your profile values",
  },
  {
    name: "stats",
    alias: "t",
    type: Boolean,
    description: "Shows your archaeologist statistics\n",
  },
  {
    name: "sarcophagi",
    alias: "s",
    type: Boolean,
    description: "Shows your sarcophagi. Can be filtered by adding either of 2 optional flags below:",
  },
  {
    name: "active-curses",
    alias: "a",
    description: "- Shows only your active sarcophagi",
    type: Boolean,
  },
  {
    name: "inactive-curses",
    alias: "i",
    description: "- Shows only your inactive sarcophagi\n",
    type: Boolean,
  },
  {
    name: "sarcophagus-details",
    alias: "d",
    type: String,
    description: "Shows details on a sarcophagus. You'll need its ID",
  },
  {
    name: "balance",
    alias: "b",
    type: Boolean,
    description: "Shows your token balances (ETH + SARCO)",
  },
  {
    name: "free-bond",
    alias: "f",
    type: Boolean,
    description: "Shows your available free bond",
  },
  {
    name: "cursed-bond",
    alias: "c",
    type: Boolean,
    description: "Shows your total cursed bond",
  },
  {
    name: "rewards",
    alias: "r",
    type: Boolean,
    description: "Shows your available rewards",
  },
  {
    name: "export",
    alias: "e",
    type: Boolean,
    description: "Also exports the view data into a csv file"
  },
];
