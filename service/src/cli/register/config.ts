import { BigNumber } from "ethers";

export const registerOptionDefinitions = [
  {
    name: 'digging-fee',
    alias: 'df',
    type: BigNumber,
    description: 'Minimum digging fee you would need to receive for each rewrap and unwrap to accept a job'
  },
  {
    name: 'rewrap-interval',
    alias: 'ri',
    type: Number,
    description: 'Maximum time in seconds from when a sarcophagus is created that the resurrection time must be before'
  },
  {
    name: 'free-bond',
    alias: 'fb',
    type: BigNumber,
    description: 'How much free bond you would like to deposit when registering. You can add more free bond later in a separate transaction.'
  },
]