import path from 'path';
import { fileURLToPath } from 'url';
import { archLogger } from '../../utils/chalk-theme';
import { TestSuite } from '../test_suite';
import 'dotenv/config';


const cwd = path.dirname(fileURLToPath(import.meta.url));

let testSuite: TestSuite;

testSuite = new TestSuite(cwd);
process.env.IP_ADDRESS = '';

archLogger.warn("\n\nOutputs errors for invalid environment variables");
archLogger.warn("\n\nIP_ADDRESS");
await testSuite.expectOutput('IP_ADDRESS not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\nTCP_PORT");
testSuite = new TestSuite(cwd);
process.env.TCP_PORT = '';
await testSuite.expectOutput('TCP_PORT not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\nWS_PORT");
testSuite = new TestSuite(cwd);
process.env.WS_PORT = '';
await testSuite.expectOutput('WS_PORT not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n BOOTSTRAP_LIST");
testSuite = new TestSuite(cwd);
process.env.BOOTSTRAP_LIST = '';
await testSuite.expectOutput('BOOTSTRAP_LIST not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n SIGNAL_SERVER_LIST");
testSuite = new TestSuite(cwd);
process.env.SIGNAL_SERVER_LIST = '';
await testSuite.expectOutput('SIGNAL_SERVER_LIST not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n SIGNAL_SERVER_LIST");
testSuite = new TestSuite(cwd);
process.env.SIGNAL_SERVER_LIST = '';
await testSuite.expectOutput('SIGNAL_SERVER_LIST not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n DHT_PROTOCOL_PREFIX");
testSuite = new TestSuite(cwd);
process.env.DHT_PROTOCOL_PREFIX = '';
await testSuite.expectOutput('DHT_PROTOCOL_PREFIX not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ENCRYPTION_PRIVATE_KEY");
testSuite = new TestSuite(cwd);
process.env.ENCRYPTION_PRIVATE_KEY = '';
await testSuite.expectOutput('ENCRYPTION_PRIVATE_KEY not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ETH_PRIVATE_KEY");
testSuite = new TestSuite(cwd);
process.env.ETH_PRIVATE_KEY = '';
await testSuite.expectOutput('ETH_PRIVATE_KEY not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n PROVIDER_URL");
testSuite = new TestSuite(cwd);
process.env.PROVIDER_URL = '';
await testSuite.expectOutput('PROVIDER_URL not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n SARCO_DIAMOND_ADDRESS");
testSuite = new TestSuite(cwd);
process.env.SARCO_DIAMOND_ADDRESS = '';
await testSuite.expectOutput('SARCO_DIAMOND_ADDRESS not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ARWEAVE_HOST");
testSuite = new TestSuite(cwd);
process.env.ARWEAVE_HOST = '';
await testSuite.expectOutput('ARWEAVE_HOST not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ARWEAVE_PORT");
testSuite = new TestSuite(cwd);
process.env.ARWEAVE_PORT = '';
await testSuite.expectOutput('ARWEAVE_PORT not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ARWEAVE_PROTOCOL");
testSuite = new TestSuite(cwd);
process.env.ARWEAVE_PROTOCOL = '';
await testSuite.expectOutput('ARWEAVE_PROTOCOL not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ARWEAVE_TIMEOUT");
testSuite = new TestSuite(cwd);
process.env.ARWEAVE_TIMEOUT = '';
await testSuite.expectOutput('ARWEAVE_TIMEOUT not set in .env', { sourceFile: '../../index.js', timeout: 3000 });

archLogger.warn("\n\n ARWEAVE_LOGGING");
testSuite = new TestSuite(cwd);
process.env.ARWEAVE_LOGGING = '';
await testSuite.expectOutput('ARWEAVE_LOGGING not set in .env', { sourceFile: '../../index.js', timeout: 3000 });