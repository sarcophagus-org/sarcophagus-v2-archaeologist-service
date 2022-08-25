import Arweave from 'arweave';
import { decrypt } from 'ecies-geth';
import { ethers } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { archLogger } from './chalk-theme';

const arweave = Arweave.init({
    host: 'localhost', // 'arweave.net', // Hostname or IP address for a Arweave host
    port: 1984, //443, // Port
    protocol: 'http', // 'https', // Network protocol http or https
    timeout: 20000, // Network request timeouts in milliseconds
    logging: false, // Enable network request logging
});

export const fetchAndValidateArweaveShard = async (arweaveTxId: string, expectedUnencryptedHash: string, publicKey: string) => {
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