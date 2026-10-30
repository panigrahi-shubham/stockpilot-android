import type { Device, Screen } from 'mobilewright';

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

/** Parse "₹1,23,456.78" → 123456.78 */
export function rupees(text: string): number {
  return Number(text.replace(/[^\d.]/g, ''));
}
