import path from 'path';
import { fileURLToPath } from 'url';
import { archLogger } from '../utils/chalk-theme';
import { TestSuite } from './test_suite';
import 'dotenv/config';


export async function runTests() {
    archLogger.warn("\n\nVerify service outputs errors for invalid environment variables");

    const cwd = path.dirname(fileURLToPath(import.meta.url));
    const opts = { sourceFile: '../index.js', timeout: 1000 };

    let testSuite: TestSuite;

    const spawnTestSuite = () => new TestSuite(cwd, process.env.TEST_CONTRACTS_DIRECTORY!);

    archLogger.warn("\n\n IP_ADDRESS");
    testSuite = spawnTestSuite();
    process.env.IP_ADDRESS = '';
    await testSuite.expectOutput('IP_ADDRESS not set in .env', opts);

    archLogger.warn("\n\n TCP_PORT");
    testSuite = spawnTestSuite();
    process.env.TCP_PORT = '';
    await testSuite.expectOutput('TCP_PORT not set in .env', opts);

    archLogger.warn("\n\n WS_PORT");
    testSuite = spawnTestSuite();
    process.env.WS_PORT = '';
    await testSuite.expectOutput('WS_PORT not set in .env', opts);

    archLogger.warn("\n\n BOOTSTRAP_LIST");
    testSuite = spawnTestSuite();
    process.env.BOOTSTRAP_LIST = '';
    await testSuite.expectOutput('BOOTSTRAP_LIST not set in .env', opts);

    archLogger.warn("\n\n SIGNAL_SERVER_LIST");
    testSuite = spawnTestSuite();
    process.env.SIGNAL_SERVER_LIST = '';
    await testSuite.expectOutput('SIGNAL_SERVER_LIST not set in .env', opts);

    archLogger.warn("\n\n SIGNAL_SERVER_LIST");
    testSuite = spawnTestSuite();
    process.env.SIGNAL_SERVER_LIST = '';
    await testSuite.expectOutput('SIGNAL_SERVER_LIST not set in .env', opts);

    archLogger.warn("\n\n DHT_PROTOCOL_PREFIX");
    testSuite = spawnTestSuite();
    process.env.DHT_PROTOCOL_PREFIX = '';
    await testSuite.expectOutput('DHT_PROTOCOL_PREFIX not set in .env', opts);

    archLogger.warn("\n\n ENCRYPTION_PRIVATE_KEY");
    testSuite = spawnTestSuite();
    process.env.ENCRYPTION_PRIVATE_KEY = '';
    await testSuite.expectOutput('ENCRYPTION_PRIVATE_KEY not set in .env', opts);

    archLogger.warn("\n\n ETH_PRIVATE_KEY");
    testSuite = spawnTestSuite();
    process.env.ETH_PRIVATE_KEY = '';
    await testSuite.expectOutput('ETH_PRIVATE_KEY not set in .env', opts);

    archLogger.warn("\n\n PROVIDER_URL");
    testSuite = spawnTestSuite();
    process.env.PROVIDER_URL = '';
    await testSuite.expectOutput('PROVIDER_URL not set in .env', opts);

    archLogger.warn("\n\n SARCO_DIAMOND_ADDRESS");
    testSuite = spawnTestSuite();
    process.env.SARCO_DIAMOND_ADDRESS = '';
    await testSuite.expectOutput('SARCO_DIAMOND_ADDRESS not set in .env', opts);

    archLogger.warn("\n\n ARWEAVE_HOST");
    testSuite = spawnTestSuite();
    process.env.ARWEAVE_HOST = '';
    await testSuite.expectOutput('ARWEAVE_HOST not set in .env', opts);

    archLogger.warn("\n\n ARWEAVE_PORT");
    testSuite = spawnTestSuite();
    process.env.ARWEAVE_PORT = '';
    await testSuite.expectOutput('ARWEAVE_PORT not set in .env', opts);

    archLogger.warn("\n\n ARWEAVE_PROTOCOL");
    testSuite = spawnTestSuite();
    process.env.ARWEAVE_PROTOCOL = '';
    await testSuite.expectOutput('ARWEAVE_PROTOCOL not set in .env', opts);

    archLogger.warn("\n\n ARWEAVE_TIMEOUT");
    testSuite = spawnTestSuite();
    process.env.ARWEAVE_TIMEOUT = '';
    await testSuite.expectOutput('ARWEAVE_TIMEOUT not set in .env', opts);

    archLogger.warn("\n\n ARWEAVE_LOGGING");
    testSuite = spawnTestSuite();
    process.env.ARWEAVE_LOGGING = '';
    await testSuite.expectOutput('ARWEAVE_LOGGING not set in .env', opts);
}