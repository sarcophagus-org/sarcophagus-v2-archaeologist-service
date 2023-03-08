import { ArchaeologistFacet } from "@sarcophagus-org/sarcophagus-v2-contracts";
import { BytesLike, ethers } from "ethers";
import { handleRpcError } from "utils/rpc-error-handler";

export class ArchaeologistFacetX {
  archaeologistFacet: ArchaeologistFacet;

  constructor(facet: ArchaeologistFacet) {
    this.archaeologistFacet = facet;
  }

  public get contract(): ArchaeologistFacet {
    return this.archaeologistFacet;
  }

  publishPrivateKey(
    sarcoId: BytesLike,
    privateKey: BytesLike
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () => this.archaeologistFacet.publishPrivateKey(sarcoId, privateKey),
      () => this.archaeologistFacet.callStatic.publishPrivateKey(sarcoId, privateKey)
    );
  }

  depositFreeBond(amount: ethers.BigNumberish): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () => this.archaeologistFacet.depositFreeBond(amount),
      () => this.archaeologistFacet.callStatic.depositFreeBond(amount)
    );
  }

  withdrawFreeBond(amount: ethers.BigNumberish): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () => this.archaeologistFacet.withdrawFreeBond(amount),
      () => this.archaeologistFacet.callStatic.withdrawFreeBond(amount)
    );
  }

  withdrawReward(): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () => this.archaeologistFacet.withdrawReward(),
      () => this.archaeologistFacet.callStatic.withdrawReward()
    );
  }

  updateArchaeologist(
    peerId: string,
    minimumDiggingFeePerSecond: ethers.BigNumberish,
    maximumRewrapInterval: ethers.BigNumberish,
    freeBond: ethers.BigNumberish,
    maximumResurrectionTime: ethers.BigNumberish
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () =>
        this.archaeologistFacet.updateArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime
        ),
      () =>
        this.archaeologistFacet.callStatic.updateArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime
        )
    );
  }

  registerArchaeologist(
    peerId: string,
    minimumDiggingFeePerSecond: ethers.BigNumberish,
    maximumRewrapInterval: ethers.BigNumberish,
    freeBond: ethers.BigNumberish,
    maximumResurrectionTime: ethers.BigNumberish
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      () =>
        this.archaeologistFacet.registerArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime
        ),
      () =>
        this.archaeologistFacet.callStatic.registerArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime
        )
    );
  }

  async _run(contractCall: Function, callStatic: Function) {
    try {
      await callStatic();
    } catch (e) {
      // Only processes error, does not terminate process
      handleRpcError(e);
    }

    // `contractCall` will fail if `callStatic` above failed. Should be handled externally.
    // 
    // Even though the transaction will not revert with meaningful error output, `handleRpcError`
    // above will have processed and logged the correct error from `callStatic`, and these logs 
    // should be checked for debugging purposes.
    return await contractCall();
  }
}
