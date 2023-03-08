import { archLogger } from "../logger/chalk-theme";
import { setupTestSuite } from "./test_suite";
import "dotenv/config";
import { getWeb3Interface } from "../scripts/web3-interface";
import { ethers, Wallet } from "ethers";

export async function runTests() {
  const spawnTestSuite = setupTestSuite();

  archLogger.warn("\n\nVerify service starts with expected output");

  const opts = { sourceFile: "../index.js", timeout: 1000, restartNetwork: true };

  const testSuite = spawnTestSuite();
  const cleanup = await testSuite.startLocalNetwork();

  /**
   *
   * TEST: "LISTENING TO MESSAGE STREAM" OUTPUT
   *
   **/
  archLogger.warn("\n\n Listens for messages");
  await testSuite.expectOutput("listening to stream on protocol: /message", {
    ...opts,
    restartNetwork: false,
  });

  /**
   *
   * TEST: "BALANCES" OUTPUT
   *
   **/
  archLogger.warn("\n\n Shows balances");
  await testSuite.expectOutput("YOUR BALANCES:", opts);

  /**
   *
   * SETUP FOR "LOW FUNDS" WARNINGS
   *
   **/
  const web3Interface = await getWeb3Interface(true);

  // Remove ETH from account
  const bal = await web3Interface.ethWallet.getBalance();
  await web3Interface.ethWallet.sendTransaction({
    to: web3Interface.encryptionHdWallet.address,
    value: bal.sub(ethers.utils.parseEther("0.0005")),
  });

  /**
   *
   * TEST: "TOO LITTLE ETH" WARNING
   *
   **/
  archLogger.warn("\n\n Shows notice if there's no ETH in account");
  const noEthNotice =
    "You have very little ETH in your account. You may not be able to sign any transactions (or do unwrappings)!";
  await testSuite.expectOutput(noEthNotice, opts);

  /**
   *
   * TEST: NO WARNING IF ENOUGH ETH
   *
   **/

  // Send ETH back to account
  // TODO -- fix to work with a second wallet that's not the encryption wallet
  // const bal2 = await web3Interface.encryptionHdWallet.getBalance();
  // await web3Interface.encryptionHdWallet.sendTransaction({
  //   to: web3Interface.ethWallet.address,
  //   value: bal2.sub(ethers.utils.parseEther("0.0005")),
  // });

  archLogger.warn("\n\n No notice needed if ETH available");
  await testSuite.expectOutput(noEthNotice, { ...opts, toNotShow: true });

  /**
   *
   * SETUP FOR FREE BOND TESTS - REGISTER ARCH WITH FREE BOND DEPOSIT
   *
   **/
  archLogger.warn("\nRegistering archaeologist");
  const deployerWallet = new Wallet(
    process.env.TEST_DEPLOYER_PRIVATE_KEY!,
    web3Interface.ethWallet.provider
  );
  await web3Interface.sarcoToken
    .connect(deployerWallet)
    .transfer(web3Interface.ethWallet.address, ethers.utils.parseEther("1000"));
  await web3Interface.sarcoToken.approve(
    web3Interface.archaeologistFacet.contract.address,
    ethers.constants.MaxUint256
  );
  await web3Interface.archaeologistFacet.registerArchaeologist(
    "peerId",
    ethers.utils.parseEther("100"),
    1000,
    ethers.utils.parseEther("100"),
    5678987689
  );
  archLogger.warn("done");

  const noFreeBondNotice = "You have no free bond. You will not be able to accept new jobs!";

  /**
   *
   * TEST: NO WARNING IF FREE BOND IN ACCOUNT
   *
   **/
  archLogger.warn("\n\n No notice needed if free bond available");
  await testSuite.expectOutput(noFreeBondNotice, { ...opts, toNotShow: true });

  /**
   *
   * TEST: "NO FREE BOND" WARNING
   *
   **/

  // Withdraw all free bond
  const freeBond = await web3Interface.viewStateFacet.getFreeBond(web3Interface.ethWallet.address);
  await web3Interface.archaeologistFacet.withdrawFreeBond(freeBond);
  archLogger.warn("\n\n Shows notice if there's no free bond");
  await testSuite.expectOutput(noFreeBondNotice, opts);

  cleanup();
}
