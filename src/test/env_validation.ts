import { archLogger } from "../logger/chalk-theme";
import { setupTestSuite, TestSuite } from "./test_suite";
import "dotenv/config";

export async function runTests() {
  const spawnTestSuite = setupTestSuite();

  archLogger.warn("\n\nVerify service outputs errors for invalid environment variables", true);

  const opts = { sourceFile: "../index.js", timeout: 1000 };
  let testSuite: TestSuite;

  const envVars = ["ETH_PRIVATE_KEY", "PROVIDER_URL"];

  for (const envVar of envVars) {
    archLogger.warn(`\n\n ${envVar}`, true);
    testSuite = spawnTestSuite();

    process.env[envVar] = "";
    await testSuite.expectOutput(`${envVar} not set in .env`, opts);
  }
}
