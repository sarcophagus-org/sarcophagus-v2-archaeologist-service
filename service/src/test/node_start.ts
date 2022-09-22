import path from 'path';
import { fileURLToPath } from 'url';
import { archLogger } from '../utils/chalk-theme';
import { TestSuite } from './test_suite';
import 'dotenv/config';


archLogger.warn("\n\nVerify service starts with expected output");

const cwd = path.dirname(fileURLToPath(import.meta.url));
const opts = { sourceFile: '../index.js', timeout: 1200 };

let testSuite: TestSuite;

testSuite = new TestSuite(cwd);

archLogger.warn("\n\n Listens for messages");
await testSuite.expectOutput('listening to stream on protocol: /message', opts);

archLogger.warn("\n\n Shows balances");
await testSuite.expectOutput('YOUR BALANCES:', opts);

archLogger.warn("\n\n Shows notice if there's no free bond");
const noFreeBondNotice = 'You have no free bond. You will not be able to accept new jobs!';
await testSuite.expectOutput(noFreeBondNotice, opts);

const noEthNotice = 'You have no ETH in your account. You will not be able to sign any transactions (or do unwrappings)!';
// archLogger.warn("\n\n Shows notice if there's no ETH in account");
// await testSuite.expectOutput(noEthNotice, opts);

archLogger.warn("\n\n No notice needed if ETH available");
await testSuite.expectOutput(noEthNotice, { ...opts, toNotShow: true });

archLogger.warn("\n\n No notice needed if free bond available");
await testSuite.expectOutput(noFreeBondNotice, { ...opts, toNotShow: true });