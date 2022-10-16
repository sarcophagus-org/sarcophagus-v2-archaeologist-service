export const startOptionDefinitions = [
  {
    name: "private-key",
    alias: "p",
    type: String,
    description: "Set a manual private key for both signing and encryption",
  },
  {
    name: "random-profile",
    alias: "r",
    type: Boolean,
    description: "Sets a random peerId, and registers or updates the profile on startup with some default values",
  }
];
