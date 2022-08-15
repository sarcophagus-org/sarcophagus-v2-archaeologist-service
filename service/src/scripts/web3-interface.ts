import { ethers } from "ethers";
import {
    IERC20,
    ArchaeologistFacet__factory,
    ViewStateFacet__factory,
    ArchaeologistFacet,
    ViewStateFacet,
    IERC20__factory
} from "../typechain";


interface Web3Interface {
    networkName: string,
    wallet: ethers.Wallet,
    signer: ethers.Signer,
    sarcoToken: IERC20,
    archaeologistFacet: ArchaeologistFacet,
    viewStateFacet: ViewStateFacet,
};

export const getWeb3Interface = async () => {
    const rpcProvider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);
    const signer = rpcProvider.getSigner(wallet.address);
    const network = await rpcProvider.detectNetwork();

    const sarcoToken = IERC20__factory.connect(process.env.SARCO_TOKEN_ADDRESS!, signer);
    const archaeologistFacet = ArchaeologistFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);
    const viewStateFacet = ViewStateFacet__factory.connect(process.env.SARCO_DIAMOND_ADDRESS!, signer);

    return {
        networkName: network.name,
        wallet,
        signer,
        sarcoToken,
        archaeologistFacet,
        viewStateFacet,
    } as Web3Interface;
}