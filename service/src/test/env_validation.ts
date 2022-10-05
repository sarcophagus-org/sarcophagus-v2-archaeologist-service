import { archLogger } from '../utils/chalk-theme';
import { setupTestSuite, TestSuite } from './test_suite';
import 'dotenv/config';


export async function runTests() {
    const spawnTestSuite = setupTestSuite();

    archLogger.warn("\n\nVerify service outputs errors for invalid environment variables");

    const opts = { sourceFile: '../index.js', timeout: 1000 };
    let testSuite: TestSuite;

    const envVars = [
        "IP_ADDRESS",
        "TCP_PORT",
        "WS_PORT",
        "BOOTSTRAP_LIST",
        "SIGNAL_SERVER_LIST",
        "ENCRYPTION_PRIVATE_KEY",
        "ETH_PRIVATE_KEY",
        "PROVIDER_URL",
        "SARCO_DIAMOND_ADDRESS",
        "ARWEAVE_HOST",
        "ARWEAVE_PORT",
        "ARWEAVE_TIMEOUT",
        "ARWEAVE_LOGGING",
    ];

    for (const envVar of envVars) {
        archLogger.warn(`\n\n ${envVar}`);
        testSuite = spawnTestSuite();

        process.env[envVar] = '';
        await testSuite.expectOutput(`${envVar} not set in .env`, opts);
    }
}