import { parseEther } from "ethers/lib/utils";

export const profileOptionDefinitions = [
  {
    name: "view",
    alias: "v",
    type: Boolean,
    description: "View your profile.",
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
    name: "free-bond",
    alias: "f",
    type: parseEther,
    description:
      "How much free bond you would like to deposit when registering. You can add more free bond later in a separate transaction. Free bond is locked up when you accept curses, and returned after a successful unwrapping.",
  },
  {
    name: "domain",
    alias: "w",
    type: parseEther,
    description:
      "If registering with a domain, this will be used in place of your peerID",
  },
];
