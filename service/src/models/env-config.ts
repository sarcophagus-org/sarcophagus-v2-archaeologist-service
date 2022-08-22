import { BigNumber } from "ethers";

export interface PublicEnvConfig {
    encryptionPublicKey: string,
    maxResurrectionTime: number,
    minBounty: BigNumber,
    minDiggingFees: BigNumber,
    isArweaver: boolean,
    feePerByte: BigNumber,
}