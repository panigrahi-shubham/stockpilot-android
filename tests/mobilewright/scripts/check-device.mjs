import { mkdir, writeFile } from 'node:fs/promises';
import { android } from 'mobilewright';

// Warm up the installed release app once before allocating any test cases.
// A broken emulator fails here, with evidence, rather than causing dozens of login failures.
const device = await android.launch({ animations: 'off', appLaunchTimeout: 60_000 });
await mkdir('test-results', { recursive: true });
try {
  await device.setOrientation('portrait');
  await device.clearAppData('com.stockpilot.b2b');
  await device.launchApp('com.stockpilot.b2b');
  const screen = device.screen;
  await screen.getByTestId('onboarding-skip-button')
    .or(screen.getByTestId('login-screen'))
    .waitFor({ state: 'visible', timeout: 60_000 });
  await device.terminateApp('com.stockpilot.b2b');
  console.log('Release app startup and Android device health check passed.');
} catch (error) {
  await writeFile('test-results/device-health.json', JSON.stringify(await device.screen.viewTree(), null, 2));
  await writeFile('test-results/device-health.png', await device.screen.screenshot());
  throw new Error('Android preflight failed. Inspect device-health evidence before diagnosing app test failures.', { cause: error });
} finally {
  await device.close();
}
