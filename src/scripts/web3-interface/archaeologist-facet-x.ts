import { ArchaeologistFacet } from "@sarcophagus-org/sarcophagus-v2-contracts";
import { BytesLike, ethers } from "ethers";
import { handleRpcError } from "../../utils/rpc-error-handler";
import { getWeb3Interface } from "../web3-interface";
import "dotenv/config"

export class ArchaeologistFacetX {
  archaeologistFacet: ArchaeologistFacet;
  chainId: number;

  constructor(facet: ArchaeologistFacet, chainId: number) {
    this.archaeologistFacet = facet;
    this.chainId = chainId;
  }

  public get contract(): ArchaeologistFacet {
    return this.archaeologistFacet;
  }

  publishPrivateKey(
    sarcoId: BytesLike,
    privateKey: BytesLike
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) => this.archaeologistFacet.publishPrivateKey(sarcoId, privateKey, txOverrides),
      () => this.archaeologistFacet.callStatic.publishPrivateKey(sarcoId, privateKey)
    );
  }

  depositFreeBond(amount: ethers.BigNumberish): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) => this.archaeologistFacet.depositFreeBond(amount, txOverrides),
      () => this.archaeologistFacet.callStatic.depositFreeBond(amount)
    );
  }

  withdrawFreeBond(amount: ethers.BigNumberish): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) => this.archaeologistFacet.withdrawFreeBond(amount, txOverrides),
      () => this.archaeologistFacet.callStatic.withdrawFreeBond(amount)
    );
  }

  withdrawReward(): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) => this.archaeologistFacet.withdrawReward(txOverrides),
      () => this.archaeologistFacet.callStatic.withdrawReward()
    );
  }

  updateArchaeologist(
    peerId: string,
    minimumDiggingFeePerSecond: ethers.BigNumberish,
    maximumRewrapInterval: ethers.BigNumberish,
    freeBond: ethers.BigNumberish,
    maximumResurrectionTime: ethers.BigNumberish,
    curseFee: ethers.BigNumberish
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) =>
        this.archaeologistFacet.updateArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime,
          curseFee,
          txOverrides
        ),
      () =>
        this.archaeologistFacet.callStatic.updateArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime,
          curseFee
        )
    );
  }

  registerArchaeologist(
    peerId: string,
    minimumDiggingFeePerSecond: ethers.BigNumberish,
    maximumRewrapInterval: ethers.BigNumberish,
    freeBond: ethers.BigNumberish,
    maximumResurrectionTime: ethers.BigNumberish,
    curseFee: ethers.BigNumberish
  ): Promise<ethers.ContractTransaction | undefined> {
    return this._run(
      (txOverrides: ethers.Overrides) =>
        this.archaeologistFacet.registerArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime,
          curseFee,
          txOverrides
        ),
      () =>
        this.archaeologistFacet.callStatic.registerArchaeologist(
          peerId,
          minimumDiggingFeePerSecond,
          maximumRewrapInterval,
          freeBond,
          maximumResurrectionTime,
          curseFee
        )
    );
  }

  async _run(contractCall: Function, callStatic: Function) {
    const web3interface = await getWeb3Interface();
    const networkContext = web3interface.getNetworkContext(this.chainId);

    try {
      await callStatic();
    } catch (e) {
      // Only processes error, does not terminate process
      handleRpcError(e, networkContext);
    }

    const gasPrice = await networkContext.ethWallet.getGasPrice();
    const gasMultiplier = ethers.BigNumber.from(process.env.GAS_MULTIPLIER || "1")
    const txOverrides = {
      gasPrice: gasPrice.mul(gasMultiplier)
    }

    // `contractCall` will fail if `callStatic` above failed. Should be handled externally.
    //
    // Even though the transaction will not revert with meaningful error output, `handleRpcError`
    // above will have processed and logged the correct error from `callStatic`, and these logs
    // should be checked for debugging purposes.
    return await contractCall(txOverrides);
  }
}
