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
  bundleId: 'com.stockpilot.b2b',
  installApps: process.env.APP_PATH ? [process.env.APP_PATH] : undefined,
  testDir: './tests',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // one device → run serially
  reporter: 'html',
  viewTree: 'on-failure', // attaches the accessibility tree to the report when a test fails
  expect: { timeout: 10_000 },
  use: {
    actionTimeout: 10_000,
    animations: 'off',
  },
});
