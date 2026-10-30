import { test, expect } from '@mobilewright/test';
import { loginFresh } from '../support/flows.js';

test.describe('Hybrid WebView', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
    await screen.getByTestId('tab-account').tap();
  });

  test('scrolling Terms to the end enables the native accept button', async ({ screen }) => {
    await screen.getByTestId('account-row-terms').scrollIntoViewIfNeeded();
    await screen.getByTestId('account-row-terms').tap();
    await expect(screen.getByTestId('webview-accept-button')).toBeDisabled();

    const page = await screen.getByWebView().page();
    expect(await page.locator('#terms-title').textContent()).toBe('Terms of Trade');
    await page.locator('#terms-end').scrollIntoViewIfNeeded();

    // Back on the native side
    await expect(screen.getByTestId('webview-accept-button')).toBeEnabled();
    await screen.getByTestId('webview-accept-button').tap();
  });

  test('feedback form shows web validation for a missing rating', async ({ screen }) => {
    await screen.getByTestId('account-row-feedback').scrollIntoViewIfNeeded();
    await screen.getByTestId('account-row-feedback').tap();

    const page = await screen.getByWebView().page();
    await page.locator('#fb-name').fill('Ravi');
    await page.locator('#fb-comments').fill('Delivery was quick and the cartons were intact.');
    await page.locator('#fb-submit').click();
    const error = page.locator('#fb-error');
    await error.waitFor({ state: 'visible' });
    expect(await error.textContent()).toBe('Please select a rating.');
  });
});
