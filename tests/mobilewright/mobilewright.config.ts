import { defineConfig } from 'mobilewright';

/**
 * Run on Android (default) or iOS:
 *   npx mobilewright test                      # first booted Android emulator / device
 *   PLATFORM=ios npx mobilewright test         # first booted iOS simulator
 *   APP_PATH=../../app-release.apk npx mobilewright test   # install the build first
 */
const platform = (process.env.PLATFORM ?? 'android') as 'android' | 'ios';

export default defineConfig({
  platform,
  deviceId: process.env.MOBILEWRIGHT_DEVICE_ID,
  bundleId: 'com.stockpilot.b2b',
  autoAppLaunch: false, // Each scenario launches once through freshStart; avoid duplicate cold starts.
  installApps: process.env.APP_PATH ? [process.env.APP_PATH] : undefined,
  testDir: './tests',
  timeout: 120_000,
  retries: 0,
  workers: 1, // one device → run serially
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : 'html',
  globalTimeout: 25 * 60_000,
  captureGitInfo: { commit: true },
  viewTree: 'on-failure', // attaches the accessibility tree to the report when a test fails
  expect: { timeout: 10_000 },
  use: {
    // The platform fixture reads use.platform; the top-level default alone leaves it undefined.
    platform,
    deviceId: process.env.MOBILEWRIGHT_DEVICE_ID,
    actionTimeout: 10_000,
    animations: 'off',
  },
});
