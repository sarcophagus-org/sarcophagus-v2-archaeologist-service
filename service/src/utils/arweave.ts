import Arweave from 'arweave';
import { decrypt } from 'ecies-geth';
import { ethers } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { archLogger } from './chalk-theme';

const arweave = Arweave.init({
    host: process.env.ARWEAVE_HOST,
    port: process.env.ARWEAVE_PORT,
    protocol: process.env.ARWEAVE_PROTOCOL,
    timeout: Number.parseInt(process.env.ARWEAVE_TIMEOUT!),
    logging: process.env.ARWEAVE_LOGGING === "true",
});

export const fetchAndValidateArweaveShard = async (
    arweaveTxId: string,
    expectedUnencryptedHash: string,
    publicKey: string
): Promise<boolean> => {
    try {
        const data = await arweave.transactions.getData(arweaveTxId, { decode: true, string: true });

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