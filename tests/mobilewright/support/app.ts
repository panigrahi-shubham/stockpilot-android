import type { Device, Locator, Screen } from 'mobilewright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Only press Back when Android reports an open keyboard; otherwise it navigates away. */
export async function dismissKeyboard(device: Device) {
  if (process.env.PLATFORM === 'ios') return;
  // The test fixture's RPC session uses a synthetic Device.id ("test"), not an ADB serial.
  const serialArgs = process.env.STOCKPILOT_ADB_SERIAL ? ['-s', process.env.STOCKPILOT_ADB_SERIAL] : [];
  const { stdout } = await execFileAsync('adb', [...serialArgs, 'shell', 'dumpsys', 'input_method']);
  if (/(?:mInputShown|isInputViewShown|mIsInputViewShown)=true\b/.test(stdout)) {
    await device.screen.pressButton('BACK');
  }
}

export const APP_ID = 'com.stockpilot.b2b';
export const PASSWORD = 'Pilot@123';

export const USERS = {
  buyer: 'buyer@stockpilot.in',
  approver: 'approver@stockpilot.in',
  slow: 'slow@stockpilot.in',
  glitch: 'glitch@stockpilot.in',
  newStore: 'newstore@stockpilot.in',
  locked: 'locked@stockpilot.in',
} as const;

/** Like a fresh install: wipe app data, then launch. Onboarding will show again. */
export async function freshStart(device: Device) {
  await device.terminateApp(APP_ID).catch(() => {});
  await device.setOrientation('portrait');
  await device.clearAppData(APP_ID);
  await device.launchApp(APP_ID);
}

/** Kill and relaunch without clearing data (persistence checks). */
export async function relaunch(device: Device) {
  await device.terminateApp(APP_ID).catch(() => {});
  await device.launchApp(APP_ID);
}

/** Open any screen directly: deepLink(device, 'product/SKU-10001'). */
export async function deepLink(device: Device, path: string) {
  await device.openUrl(`stockpilot://${path}`);
}

/** Centre point of an element — handy for raw gestures. */
export async function centreOf(screen: Screen, testId: string) {
  const b = await screen.getByTestId(testId).boundingBox();
  return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), box: b };
}

/** Keep touch coordinates inside the visible content, away from fixed headers and footers. */
export async function swipeWithin(device: Device, containerId: string, direction: 'up' | 'down' = 'up') {
  const bounds = await device.screen.getByTestId(containerId).boundingBox();
  const { width, height } = await device.screenSize();
  const top = Math.max(bounds.y, height * 0.15);
  const bottom = Math.min(bounds.y + bounds.height, height * 0.8);
  const x = Math.min(width * 0.85, bounds.x + bounds.width * 0.85);
  const high = top + (bottom - top) * 0.2;
  const low = top + (bottom - top) * 0.8;
  await device.screen.gesture({ pointers: [[
    { x, y: direction === 'up' ? low : high, time: 0 },
    { x, y: direction === 'up' ? high : low, time: 500 },
  ]] });
}

/** The driver's viewport check alone does not account for sticky app controls. */
export async function scrollAboveFooter(device: Device, locator: Locator, containerId: string) {
  await dismissKeyboard(device);
  await locator.scrollIntoViewIfNeeded();
  const { height } = await device.screenSize();
  for (let attempt = 0; attempt < 8; attempt++) {
    const bounds = await locator.boundingBox();
    if (bounds.y >= height * 0.15 && bounds.y + bounds.height <= height * 0.78) return;
    await swipeWithin(device, containerId, bounds.y < height * 0.15 ? 'down' : 'up');
  }
  throw new Error('Control could not be brought above the fixed footer.');
}

/** Parse "₹1,23,456.78" → 123456.78 */
export function rupees(text: string): number {
  return Number(text.replace(/[^\d.]/g, ''));
}
