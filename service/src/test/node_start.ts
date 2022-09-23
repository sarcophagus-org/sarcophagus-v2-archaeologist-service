import path from 'path';
import { fileURLToPath } from 'url';
import { archLogger } from '../utils/chalk-theme';
import { TestSuite } from './test_suite';
import 'dotenv/config';
import { getWeb3Interface } from '../scripts/web3-interface';
import { ethers, Wallet } from 'ethers';

export async function runTests() {
    archLogger.warn("\n\nVerify service starts with expected output");

    const cwd = path.dirname(fileURLToPath(import.meta.url));
    const opts = { sourceFile: '../index.js', timeout: 1000, restartNetwork: true };

    let testSuite: TestSuite;

    testSuite = new TestSuite(cwd, process.env.TEST_CONTRACTS_DIRECTORY!);

    const cleanup = await testSuite.startLocalNetwork();

    archLogger.warn("\n\n Listens for messages");
    await testSuite.expectOutput('listening to stream on protocol: /message', { ...opts, restartNetwork: false });

    archLogger.warn("\n\n Shows balances");
    await testSuite.expectOutput('YOUR BALANCES:', opts);

    const web3Interface = await getWeb3Interface();

    // Remove ETH from account
    const bal = await web3Interface.ethWallet.getBalance();
    await web3Interface.ethWallet.sendTransaction({
        to: web3Interface.encryptionWallet.address,
        value: bal.sub(ethers.utils.parseEther('0.0005'))
    });

    archLogger.warn("\n\n Shows notice if there's no ETH in account");
    const noEthNotice = 'You have very little ETH in your account. You may not be able to sign any transactions (or do unwrappings)!';
    await testSuite.expectOutput(noEthNotice, opts);

    // Send ETH back to account
    const bal2 = await web3Interface.encryptionWallet.getBalance();
    await web3Interface.encryptionWallet.sendTransaction({
        to: web3Interface.ethWallet.address,
        value: bal2.sub(ethers.utils.parseEther('0.0005'))
    });
    archLogger.warn("\n\n No notice needed if ETH available");
    await testSuite.expectOutput(noEthNotice, { ...opts, toNotShow: true });

    archLogger.warn("\nRegistering archaeologist");
    const deployerWallet = new Wallet(process.env.TEST_DEPLOYER_PRIVATE_KEY!, web3Interface.ethWallet.provider);
    await web3Interface.sarcoToken.connect(deployerWallet).transfer(web3Interface.ethWallet.address, ethers.utils.parseEther('1000'));
    await web3Interface.sarcoToken.approve(web3Interface.archaeologistFacet.address, ethers.constants.MaxUint256);
    await web3Interface.archaeologistFacet.registerArchaeologist('peerId', ethers.utils.parseEther('100'), 1000, ethers.utils.parseEther('100'));
    archLogger.warn("done");

    const noFreeBondNotice = 'You have no free bond. You will not be able to accept new jobs!';

    archLogger.warn("\n\n No notice needed if free bond available");
    await testSuite.expectOutput(noFreeBondNotice, { ...opts, toNotShow: true });

    // Withdraw all free bond
    const freeBond = await web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
    await web3Interface.archaeologistFacet.withdrawFreeBond(freeBond);

    archLogger.warn("\n\n Shows notice if there's no free bond");
    await testSuite.expectOutput(noFreeBondNotice, opts);

    cleanup();
}