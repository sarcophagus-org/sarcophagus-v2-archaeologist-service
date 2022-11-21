export const sharedOptionDefinitions = [
  {
    name: "address-config=file",
    alias: "a",
    type: String,
    description: "Set the name of the json config file mapping arch address to peerId",
  },
  {
    name: "config-index",
    alias: "c",
    type: Number,
    description:
      "Set the index of the entry from the config file (default is for hardhat), use those setting to start the arch service.",
  },
];
