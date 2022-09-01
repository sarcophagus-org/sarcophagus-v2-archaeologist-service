import { ethers } from "ethers";
import { exit } from "process";
import { archLogger } from "../utils/chalk-theme";
import {
    IERC20,
    ArchaeologistFacet__factory,
    EmbalmerFacet__factory,
    ViewStateFacet__factory,
    ArchaeologistFacet,
    EmbalmerFacet,
    ViewStateFacet,
    IERC20__factory,
    ThirdPartyFacet,
    ThirdPartyFacet__factory
} from "../abi_interfaces";
import { BAD_ENV } from "../utils/exit-codes";


export interface Web3Interface {
    networkName: string,
    ethWallet: ethers.Wallet,
    encryptionWallet: ethers.Wallet,
    signer: ethers.Signer,
    sarcoToken: IERC20,
    archaeologistFacet: ArchaeologistFacet,
    embalmerFacet: EmbalmerFacet,
    thirdPartyFacet: ThirdPartyFacet,
    viewStateFacet: ViewStateFacet,
};

export const getWeb3Interface = async (): Promise<Web3Interface> => {
    try {
        const rpcProvider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
        const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);
        const encryptionWallet = new ethers.Wallet(process.env.ENCRYPTION_PRIVATE_KEY!, rpcProvider);
        const signer = rpcProvider.getSigner(ethWallet.address);

        const network = await rpcProvider.detectNetwork()

        const sarcoToken = IERC20__factory.connect(process.env.SARCO_TOKEN_ADDRESS!, signer);
        const embalmerFacet = EmbalmerFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);
        const archaeologistFacet = ArchaeologistFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);
        const viewStateFacet = ViewStateFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);
        const thirdPartyFacet = ThirdPartyFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);

        // Cannot confirm rpcProvider is valid until an actual network call is attempted
        sarcoToken.balanceOf(ethWallet.address);

        return {
            networkName: network.name,
            encryptionWallet,
            ethWallet,
            signer,
            sarcoToken,
            archaeologistFacet,
            embalmerFacet,
            viewStateFacet,
            thirdPartyFacet,
        } as Web3Interface;
    } catch (e) {
        archLogger.error(e);
        archLogger.error("Confirm PROVIDER_URL in .env is a valid RPC Provider URL");
        exit(BAD_ENV);
    }
}