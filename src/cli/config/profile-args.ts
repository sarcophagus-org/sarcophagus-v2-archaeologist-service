import { parseEther } from "ethers/lib/utils";

export const profileOptionDefinitions = [
  {
    name: "guided",
    alias: "g",
    type: Boolean,
    description: "Run guided walk through to setup profile",
  },
  {
    name: "domain",
    alias: "u",
    type: Boolean,
    description:
      "Update the domain associated with your archaeologist. You will need to set the DOMAIN variable in your .env file before using this.",
  },
  {
    name: "digging-fee",
    alias: "d",
    type: parseEther,
    description: "Minimum payment you want to receive for rewrappings and unwrappings on a curse.",
  },
  {
    name: "rewrap-interval",
    alias: "r",
    type: Number,
    description:
      "Determines how long in the future the resurrection time can be for curses you will accept. The rewrap interval is expressed in seconds. If the resurrection time for a curse is *greater* than the rewrap interval *plus* the time the sarcophagus is created, then you will not be assigned to that curse.",
  },
  {
    name: "max-res-time",
    alias: "s",
    type: Number,
    description:
      "Determines the maximum time you guarantee to be available for curses and/or rewraps on any Sarcophagi. The maximum resurrection time is expressed in seconds. If the resurrection time for a curse is *greater* than this maximum resurrection time, then you will not be assigned to that curse. Sarcophagi are created with a snapshot of this time, and can be rewrapped until then, after which you will no longer be responsible for it and can receive your rewards for it. Updating this will only affect future Sarcophagus curses.",
  },
  {
    name: "free-bond",
    alias: "f",
    type: parseEther,
    description:
      "How much free bond you would like to deposit when registering. You can add more free bond later in a separate transaction. Free bond is locked up when you accept curses, and returned after a successful unwrapping.",
  },
];
