import { test, expect } from '@mobilewright/test';
import { loginFresh } from '../support/flows.js';
import { scrollAboveFooter, swipeWithin } from '../support/app.js';

test.describe('Hybrid WebView', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
    await screen.getByTestId('tab-account').tap();
  });

  test('scrolling Terms to the end enables the native accept button', async ({ device, screen }) => {
    await screen.getByTestId('account-row-terms').scrollIntoViewIfNeeded();
    await screen.getByTestId('account-row-terms').tap();
    await expect(screen.getByTestId('webview-accept-button')).toBeDisabled();

    const webview = screen.getByTestId('webview');
    await expect(webview.getByText('Terms of Trade', { exact: true })).toBeVisible();
    // Real touch scrolling triggers the app's read-to-end event on a release APK.
    await webview.getByText('— End of document —', { exact: true }).scrollIntoViewIfNeeded({ maxSwipes: 30 });
    await swipeWithin(device, 'webview');

    // Back on the native side
    await expect(screen.getByTestId('webview-accept-button')).toBeEnabled();
    await screen.getByTestId('webview-accept-button').tap();
  });

  test('feedback form shows web validation for a missing rating', async ({ device, screen }) => {
    await screen.getByTestId('account-row-feedback').scrollIntoViewIfNeeded();
    await screen.getByTestId('account-row-feedback').tap();

    const webview = screen.getByTestId('webview');
    // Android exposes the associated HTML labels as these native input hints.
    const name = webview.getByPlaceholder('Your name', { exact: true });
    const comments = webview.getByPlaceholder('Comments', { exact: true });
    await scrollAboveFooter(device, name, 'webview');
    await name.tap();
    await expect(name).toBeFocused();
    await device.driver.typeText('Ravi');
    await scrollAboveFooter(device, comments, 'webview');
    await comments.tap();
    await expect(comments).toBeFocused();
    await device.driver.typeText('Delivery was quick and the cartons were intact.');
    const submit = webview.getByRole('button', { name: /Submit feedback/i });
    await scrollAboveFooter(device, submit, 'webview');
    await submit.tap();
    await expect(webview.getByText('Please select a rating.', { exact: true })).toBeVisible();
  });
});
