import { execa, ExecaChildProcess } from 'execa';
import fs from 'fs-extra';
import { archLogger } from '../utils/chalk-theme';
import which from 'which';
import path from 'path';
import * as dotenv from 'dotenv';
import { exit } from 'process';

async function isExecutable(command) {
    try {
        await fs.access(command, fs.constants.X_OK)

        return true
    } catch (err) {
        if (err.code === 'ENOENT') {
            return isExecutable(await which(command))
        }

        if (err.code === 'EACCES') {
            return false
        }

        throw err
    }
}

let outputTimeout: NodeJS.Timeout;

async function waitForOutput(expectedOutput: string, command: string, args: any[] = [], opts = {}) {
    if (outputTimeout) clearTimeout(outputTimeout);

    archLogger.info(`Waiting for output...\n`)
    if (!await isExecutable(command)) {
        args.unshift(command)
        command = 'node'
    }

    const proc = execa(command, args, {
        ...opts,
        timeout: 60000,
        all: true
    })
    let output = ''
    // @ts-ignore
    let time = opts.outputTimeout || 600000

    outputTimeout = setTimeout(() => {
        archLogger.info(output)

        // @ts-ignore
        if (opts.shouldNotShow) {
            archLogger.info(`Expected output to NOT include: ${expectedOutput}`)
            archLogger.notice("PASSED\n")
            assertionRun = true;
            clearTimeout(outputTimeout)
            proc.kill();
        } else {
            archLogger.error(`Expected output: "${expectedOutput}"\n  from "${[command].concat(args).join(' ')}"\n  did not show after ${time / 1000}s`);
            archLogger.error('See actual output above')
            throw new Error('OUTPUT TIMEOUT')
        }
    }, time)

    let assertionRun = false;
    proc.all!.on('data', (data) => {
        output += data.toString('utf8')

        if (assertionRun) return;

        if (output.includes(expectedOutput)) {
            archLogger.info(output)
            clearTimeout(outputTimeout)

            // @ts-ignore
            if (opts.shouldNotShow) {
                archLogger.error(`Expected output to NOT include: "${expectedOutput}"`)
                archLogger.error('See actual output above')
                throw new Error('UNEXPECTED OUTPUT')
            } else {
                archLogger.info(`Expected: ${expectedOutput}`)
                archLogger.notice("PASSED\n")
                assertionRun = true;
            }

            proc.kill()
        }
    })

    try {
        await proc
    } catch (err) {
        if (!err.killed) {
            throw err
        }
    }
}

export class TestSuite {
    private workingDirectory: string;

    constructor(workingDirectory: string) {
        this.workingDirectory = workingDirectory;
        dotenv.config({ path: '.env.test', override: true });
    }

    setWorkingDirectory(dir: string) {
        this.workingDirectory = dir;
    }

    async expectOutput(expectedOutput: string, opts: { sourceFile: string, timeout?: number, toNotShow?: boolean, }) {
        console.log('toNotShow', opts.toNotShow);

        await waitForOutput(expectedOutput, 'node', ['--experimental-specifier-resolution=node', path.join(this.workingDirectory, opts.sourceFile)], {
            outputTimeout: opts.timeout || 30000,
            shouldNotShow: opts.toNotShow || false,
        })
    }
}