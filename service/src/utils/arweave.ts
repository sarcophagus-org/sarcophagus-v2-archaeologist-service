import Arweave from 'arweave';
import { decrypt } from 'ecies-geth';
import { ethers } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { Web3Interface } from 'scripts/web3-interface';
import { archLogger } from './chalk-theme';
import { SarcophagusState } from './onchain-data';

export const arweaveService = Arweave.init({
    host: process.env.ARWEAVE_HOST,
    port: process.env.ARWEAVE_PORT,
    protocol: process.env.ARWEAVE_PROTOCOL,
    timeout: Number.parseInt(process.env.ARWEAVE_TIMEOUT!),
    logging: process.env.ARWEAVE_LOGGING === "true",
});

export const fetchAndValidateArweaveShard = async (
    arweaveTxId: string,
    expectedUnencryptedHash: string,
    publicKey: string,
): Promise<boolean> => {
    try {
        const data = await arweaveService.transactions.getData(arweaveTxId, { decode: true, string: true });

        const shards = JSON.parse(data as string);
        const encryptedShard = shards[publicKey];

        const decrypted = await decrypt(
            Buffer.from(ethers.utils.arrayify(process.env.ENCRYPTION_PRIVATE_KEY!)),
            Buffer.from(ethers.utils.arrayify(encryptedShard)),
        );

        const decryptedShardString = new TextDecoder().decode(decrypted);
        const unencryptedHash = solidityKeccak256(['string'], [decryptedShardString]);

        return expectedUnencryptedHash === unencryptedHash;
    } catch (e) {
        archLogger.error(e);
        return false;
    }
};


export const fetchAndDecryptShard = async (
    web3Interface: Web3Interface,
    sarcoId: string,
): Promise<string> => {
    try {
        const sarco = await web3Interface.viewStateFacet.getSarcophagus(sarcoId);

        if (sarco.state !== SarcophagusState.Exists) {
            throw "Sarcophagus does not exist";
        }

        const arweaveTxId = sarco.arweaveTxIds[0];

        const data = await arweaveService.transactions.getData(arweaveTxId, { decode: true, string: true });

        const shards = JSON.parse(data as string);
        const encryptedShard = shards[web3Interface.encryptionWallet.publicKey];

        const decrypted = await decrypt(
            Buffer.from(ethers.utils.arrayify(process.env.ENCRYPTION_PRIVATE_KEY!)),
            Buffer.from(ethers.utils.arrayify(encryptedShard)),
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        archLogger.error(e);
        return "";
    }
};