import { test, expect } from '@mobilewright/test';
import { APP_ID, deepLink } from '../support/app.js';
import { loginFresh } from '../support/flows.js';

test.describe('Device & system features', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
  });

  test('deep link opens a product page directly', async ({ device, screen }) => {
    await deepLink(device, 'product/SKU-10005');
    await expect(screen.getByTestId('product-screen')).toBeVisible();
    await expect(screen.getByTestId('product-sku')).toContainText('SKU-10005');
  });

  test('promo deep link stores the coupon in the cart', async ({ device, screen }) => {
    await deepLink(device, 'promo/DIWALI25');
    await expect(screen.getByTestId('promo-code')).toHaveText('DIWALI25');
    await screen.getByTestId('promo-cart-button').tap();
    await expect(screen.getByTestId('cart-screen')).toBeVisible();
  });

  test('camera permission: allow from the system dialog', async ({ screen }) => {
    // Accept any OS permission dialog that shows up while we act/poll.
    screen.on('dialog', (d) => (d.isSystem() ? d.accept() : undefined));
    await screen.getByTestId('tab-scan').tap();
    await screen.getByTestId('scan-allow-camera-button').tap();
    await expect(screen.getByTestId('scan-camera-container')).toBeVisible({ timeout: 15_000 });
  });

  test('manual barcode lookup with checksum validation', async ({ screen }) => {
    await screen.getByTestId('tab-scan').tap();
    await screen.getByTestId('scan-manual-input').fill('1234567890123');
    await screen.getByTestId('scan-manual-submit-button').tap();
    await expect(screen.getByTestId('scan-manual-input-error')).toContainText('valid check digit');

    await screen.getByTestId('scan-sample-0').tap();
    await screen.getByTestId('scan-manual-submit-button').tap();
    await expect(screen.getByTestId('scan-result-card')).toBeVisible();
  });

  test('rotate to landscape on Reports', async ({ device, screen }) => {
    await deepLink(device, 'reports');
    await expect(screen.getByTestId('reports-rotate-hint')).toBeVisible();
    await device.setOrientation('landscape');
    await expect(screen.getByTestId('reports-rotate-hint')).toBeHidden();
    await device.setOrientation('portrait');
  });

  test('App lock appears after the app was in background', async ({ device, screen }) => {
    await deepLink(device, 'settings');
    await screen.getByTestId('settings-app-lock-switch').scrollIntoViewIfNeeded();
    await screen.getByTestId('settings-app-lock-switch').tap();

    await screen.pressButton('HOME');
    await new Promise((r) => setTimeout(r, 6000)); // the feature itself is time-based (5 s)
    await device.launchApp(APP_ID);

    await expect(screen.getByTestId('app-lock-screen')).toBeVisible();
    for (const k of ['1', '2', '3', '4']) await screen.getByTestId(`app-lock-key-${k}`).tap();
    await expect(screen.getByTestId('app-lock-screen')).toBeHidden();
  });
});
