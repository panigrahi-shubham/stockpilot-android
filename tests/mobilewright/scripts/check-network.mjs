import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { setTimeout } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

export function hasValidatedDefaultNetwork(dump) {
  const id = dump.match(/^Active default network:\s*(\d+)/m)?.[1];
  if (!id) return false;
  // Ignore historical events and request filters, which can mention VALIDATED while offline.
  const current = dump.split('Current Networks:')[1]?.split(/^Network Requests:/m)[0] ?? '';
  const network = current.split(/^\s{2}NetworkAgentInfo\{/m)
    .find((block) => block.startsWith(`network{${id}}`));
  const capabilities = network?.match(/\bnc\{\[\s*Transports:[\s\S]*?\bCapabilities:\s*([A-Z_&]+)/)?.[1].split('&') ?? [];
  return capabilities.includes('INTERNET') && capabilities.includes('VALIDATED');
}

async function waitForNetwork() {
  await mkdir('device-diagnostics', { recursive: true });
  const serial = process.env.STOCKPILOT_ADB_SERIAL;
  const serialArgs = serial ? ['-s', serial] : [];
  for (let attempt = 0; attempt < 30; attempt++) {
    const { stdout } = await execFileAsync('adb', [...serialArgs, 'shell', 'dumpsys', 'connectivity'], {
      timeout: 10_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    await writeFile('device-diagnostics/connectivity-startup.txt', stdout);
    if (hasValidatedDefaultNetwork(stdout)) {
      console.log('Android default network has validated internet connectivity.');
      return;
    }
    if (attempt < 29) await setTimeout(3000);
  }
  throw new Error('Emulator network never became internet-validated. Inspect connectivity-startup.txt; app tests were not started.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await waitForNetwork();
}
