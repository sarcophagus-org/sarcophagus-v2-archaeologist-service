import { BigNumber } from "ethers";

export interface PublicEnvConfig {
    encryptionPublicKey: string,
    maxResurrectionTime: number,
    minDiggingFees: BigNumber,
    feePerByte: BigNumber,
}