import { ethers } from "ethers";

interface Web3Interface {
    networkName: string | undefined,
    wallet: ethers.Wallet | undefined,
    signer: ethers.Signer | undefined,
};

export const getWeb3Interface = async () => {
    const rpcProvider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
    const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY!, rpcProvider);
    const signer = rpcProvider.getSigner(wallet.address);
    const network = await rpcProvider.detectNetwork();

    return {
        networkName: network.name,
        wallet,
        signer,
    } as Web3Interface;
}