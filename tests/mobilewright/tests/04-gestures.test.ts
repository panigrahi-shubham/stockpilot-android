import { test, expect } from '@mobilewright/test';
import { LoginScreen } from '../screens/LoginScreen.js';
import { centreOf, deepLink, freshStart } from '../support/app.js';
import { loginFresh } from '../support/flows.js';

test.describe('Gestures', () => {
  test('swipe through onboarding slides', async ({ device, screen }) => {
    await freshStart(device);
    await expect(screen.getByTestId('onboarding-dot-0-active')).toBeVisible();
    await screen.getByTestId('onboarding-pager').swipe({ direction: 'left' });
    await expect(screen.getByTestId('onboarding-dot-1-active')).toBeVisible();
    await screen.getByTestId('onboarding-pager').swipe({ direction: 'left' });
    await expect(screen.getByTestId('onboarding-get-started-button')).toBeVisible();
  });

  test('long-press the logo for 1.2 s opens the hidden test-account picker', async ({ device, screen }) => {
    await freshStart(device);
    await new LoginScreen(screen).skipOnboardingIfShown();
    await screen.getByTestId('login-logo').longPress({ duration: 1500 });
    await expect(screen.getByTestId('test-accounts-sheet')).toBeVisible();
    await screen.getByTestId('test-account-approver').tap();
    await expect(screen.getByTestId('login-email-input')).toHaveValue('approver@stockpilot.in');
  });

  test.describe('logged in', () => {
    test.beforeEach(async ({ device, screen }) => {
      await loginFresh(device, screen);
    });

    test('pinch-to-zoom in the image viewer (two-finger gesture)', async ({ device, screen }) => {
      await deepLink(device, 'product/SKU-10003');
      await screen.getByTestId('product-image-0').tap();
      await expect(screen.getByTestId('image-viewer-zoom-level')).toHaveText('1.0×');

      const { x, y } = await centreOf(screen, 'image-viewer-canvas');
      await screen.gesture({
        pointers: [
          [
            { x: x - 30, y, time: 0 },
            { x: x - 160, y, time: 400 },
          ],
          [
            { x: x + 30, y, time: 0 },
            { x: x + 160, y, time: 400 },
          ],
        ],
      });
      const zoom = parseFloat(await screen.getByTestId('image-viewer-zoom-level').getText());
      expect(zoom).toBeGreaterThan(1.5);
    });

    test('drag & drop re-orders the quick list', async ({ device, screen }) => {
      await deepLink(device, 'quick-list');
      await expect(screen.getByTestId('quick-list-position-SKU-10001')).toHaveText('#1');

      const from = await centreOf(screen, 'quick-list-handle-SKU-10001');
      const rowHeight = 96;
      await screen.gesture({
        pointers: [
          [
            { x: from.x, y: from.y, time: 0 },
            { x: from.x, y: from.y + 5, time: 300 }, // hold
            { x: from.x, y: from.y + rowHeight * 3, time: 1200 }, // move down 3 rows
          ],
        ],
      });
      await expect(screen.getByTestId('quick-list-position-SKU-10001')).toHaveText('#4');
    });

    test('scroll until an element is visible', async ({ device, screen }) => {
      await deepLink(device, 'settings');
      const version = screen.getByTestId('settings-about-version');
      await version.scrollIntoViewIfNeeded();
      await expect(version).toBeVisible();
    });

    test('double-tap the product image adds it to favourites', async ({ device, screen }) => {
      await deepLink(device, 'product/SKU-10010');
      await screen.getByTestId('product-image-0').doubleTap();
      await expect(screen.getByTestId('toast-message')).toHaveText('Added to favourites');
    });
  });
});
