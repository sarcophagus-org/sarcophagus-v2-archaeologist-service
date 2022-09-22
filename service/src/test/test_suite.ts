import { execa } from 'execa';
import fs from 'fs-extra';
import { archLogger } from '../utils/chalk-theme';
import which from 'which';
import path from 'path';
import * as dotenv from 'dotenv';

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

async function waitForOutput(expectedOutput: string, command: string, args: any[] = [], opts = {}) {
    archLogger.info(`Waiting for output...`)
    if (!await isExecutable(command)) {
        args.unshift(command)
        command = 'node'
    }

    const proc = execa(command, args, {
        ...opts,
        all: true
    })
    let output = ''
    // @ts-ignore
    let time = opts.timeout || 600000

    let timeout = setTimeout(() => {
        archLogger.error('Timed out')
        archLogger.error(`Expected output: "${expectedOutput}"\n  from "${[command].concat(args).join(' ')}"\n  did not show after ${time / 1000}s`);
        throw new Error('OUTPUT TIMEOUT')
    }, time)

    proc.all!.on('data', (data) => {
        process.stdout.write(data)

        output += data.toString('utf8')

        if (output.includes(expectedOutput)) {
            clearTimeout(timeout)
            archLogger.notice("PASSED")
            archLogger.notice(expectedOutput)
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

    async expectOutput(expectedOutput: string, opts: { sourceFile: string, timeout?: number }) {

        await waitForOutput(expectedOutput, 'node', ['--experimental-specifier-resolution=node', path.join(this.workingDirectory, opts.sourceFile)], {
            timeout: opts.timeout || 30000
        })
    }
}