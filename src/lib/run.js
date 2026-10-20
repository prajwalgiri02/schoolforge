import { spawnSync } from 'node:child_process';

export function commandExists(command) {
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [command], { stdio: 'ignore' });

    return probe.status === 0;
}

/**
 * Runs a command with inherited output and throws if it fails.
 */
export function run(command, args, { cwd, log = console.log } = {}) {
    log(`  $ ${[command, ...args].join(' ')}`);
    const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

    if (result.status !== 0) {
        throw new Error(`Command failed (${result.status ?? result.signal}): ${[command, ...args].join(' ')}`);
    }
}
