import { ExecaChildProcess, execa, execaCommand } from "execa";
import fs from "fs-extra";
import { archLogger } from "../logger/chalk-theme";
import which from "which";
import path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

async function isExecutable(command) {
  try {
    await fs.access(command, fs.constants.X_OK);

    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return isExecutable(await which(command));
    }

    if (err.code === "EACCES") {
      return false;
    }

    throw err;
  }
}

let outputTimeout: NodeJS.Timeout;

async function waitForOutput(expectedOutput: string, command: string, args: any[] = [], opts = {}) {
  archLogger.info(`Waiting for output...\n`);
  if (!(await isExecutable(command))) {
    args.unshift(command);
    command = "node";
  }

  const proc = execa(command, args, {
    ...opts,
    timeout: 60000,
    all: true,
  });
  let output = "";

  // @ts-ignore
  let time = opts.outputTimeout || 600000;

  outputTimeout = setTimeout(() => {
    archLogger.info(output);

    // @ts-ignore
    if (opts.shouldNotShow) {
      archLogger.info(`Expected output to NOT include: ${expectedOutput}`);
      archLogger.notice("PASSED\n");
      assertionRun = true;
      clearTimeout(outputTimeout);
      proc.kill();
    } else {
      archLogger.error(
        `Expected output: "${expectedOutput}"\n  from "${[command]
          .concat(args)
          .join(" ")}"\n  did not show after ${time / 1000}s`
      );
      archLogger.error("See actual output above");
      throw new Error("OUTPUT TIMEOUT");
    }
  }, time);

  let assertionRun = false;
  proc.all!.on("data", data => {
    output += data.toString("utf8");

    if (assertionRun) return;

    if (output.includes(expectedOutput)) {
      archLogger.info(output);
      clearTimeout(outputTimeout);

      // @ts-ignore
      if (opts.shouldNotShow) {
        archLogger.error(`Expected output to NOT include: "${expectedOutput}"`);
        archLogger.error("See actual output above");
        throw new Error("UNEXPECTED OUTPUT");
      } else {
        archLogger.info(`Expected: ${expectedOutput}`);
        archLogger.notice("PASSED\n");
        assertionRun = true;
      }

      proc.kill();
    }
  });

  try {
    await proc;
  } catch (err) {
    if (!err.killed) {
      throw err;
    }
  }
}

export class TestSuite {
  private workingDirectory: string;
  private contractsDirectory: string;
  private localNetworkProc: ExecaChildProcess;

  constructor(workingDirectory: string, contractsDirectory: string) {
    this.workingDirectory = workingDirectory;
    this.contractsDirectory = contractsDirectory;

    dotenv.config({ override: true });
  }

  setWorkingDirectory(dir: string) {
    this.workingDirectory = dir;
  }

  async expectOutput(
    expectedOutput: string,
    opts: {
      sourceFile: string;
      timeout?: number;
      toNotShow?: boolean;
      restartNetwork?: boolean;
    }
  ) {
    if (opts.restartNetwork) {
      this.localNetworkProc.kill();
      await new Promise(resolve => setTimeout(resolve, 200));

      await this.startLocalNetwork();
    }

    await waitForOutput(
      expectedOutput,
      "node",
      [
        "--experimental-specifier-resolution=node",
        path.join(this.workingDirectory, opts.sourceFile),
      ],
      {
        outputTimeout: opts.timeout || 30000,
        shouldNotShow: opts.toNotShow || false,
      }
    );
  }

  async startLocalNetwork() {
    archLogger.info("Starting local network");
    this.localNetworkProc = execaCommand(`cd ${this.contractsDirectory} && npx hardhat node`, {
      shell: true,
      all: true,
    });

    this.localNetworkProc.all!.on("data", data => {
      process.stdout.write(".");
    });

    const networkStartupTime = !process.env.TEST_NETWORK_STARTUP_TIME
      ? 6000
      : Number.parseInt(process.env.TEST_NETWORK_STARTUP_TIME);

    await new Promise(resolve => setTimeout(resolve, networkStartupTime));

    archLogger.info("\nLocal network ready");
    return () => this.localNetworkProc.kill();
  }
}

// TODO: Not terribly worth it right now to extract this function into some test util file/folder. If more utility functions become necessary, then will refactor.
/**
 * Setup a `TestSuite` object to run tests in the context of the archaeologist service directory's `src/test` folder.
 * @returns spawnTestSuite - Creates and returns a new instance of `TestSuite`
 */
export function setupTestSuite(): () => TestSuite {
  const cwd = path.dirname(fileURLToPath(import.meta.url));

  const spawnTestSuite = () => new TestSuite(cwd, process.env.TEST_CONTRACTS_DIRECTORY!);
  return spawnTestSuite;
}
