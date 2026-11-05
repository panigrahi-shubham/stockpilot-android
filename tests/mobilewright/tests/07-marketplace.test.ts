import { test, expect } from '@mobilewright/test';
import { deepLink, dismissKeyboard, scrollAboveFooter } from '../support/app.js';
import { loginFresh } from '../support/flows.js';

test.describe('Seller mode, leads, inbox & compare', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
  });

  test('switching to seller mode unlocks the Seller Hub', async ({ screen }) => {
    await screen.getByTestId('tab-account').tap();
    await screen.getByTestId('account-mode-switch-seller').tap();
    await expect(screen.getByTestId('account-mode-badge').getByText(/seller/i)).toBeVisible();
    await screen.getByTestId('account-open-seller-hub').tap();
    await expect(screen.getByTestId('seller-hub-screen')).toBeVisible();
    await expect(screen.getByTestId('seller-mode-off-card')).toBeHidden();
  });

  test('add product: publish validation, max 6 specs, save as draft', async ({ device, screen }) => {
    await deepLink(device, 'seller/product-form');
    await screen.getByTestId('listing-publish-button').tap();
    await expect(screen.getByTestId('listing-title-input-error')).toHaveText('Title must be at least 10 characters');
    await expect(screen.getByTestId('listing-photos-error')).toHaveText('Add at least one photo');

    await screen.getByTestId('listing-title-input').fill('Groundnut Oil 15 L Tin');
    await expect(screen.getByTestId('listing-title-input-counter')).toHaveText('22/80');

    const add = screen.getByTestId('listing-add-spec-button');
    for (let i = 0; i < 5; i++) {
      await scrollAboveFooter(device, add, 'listing-form-scroll');
      await add.tap();
      await screen.getByTestId('listing-spec-count').scrollIntoViewIfNeeded({ direction: 'down' });
      await expect(screen.getByTestId('listing-spec-count')).toHaveText(`${i + 2}/6`);
    }
    await expect(screen.getByTestId('listing-spec-count')).toHaveText('6/6');
    await scrollAboveFooter(device, add, 'listing-form-scroll');
    await expect(add).toBeDisabled();

    await screen.getByTestId('listing-save-draft-button').tap();
    await expect(
      screen.getByTestId('home-screen'),
      'Saving a draft should return to the previous screen without asking to discard changes',
    ).toBeVisible({ timeout: 20_000 });
    await deepLink(device, 'seller/products');
    await screen.getByTestId('my-products-search-input').fill('Groundnut Oil 15 L Tin');
    await expect(screen.getByText('Groundnut Oil 15 L Tin', { exact: true })).toBeVisible();
  });

  test('lead status: send a quotation', async ({ device, screen }) => {
    await deepLink(device, 'seller/lead/LD-9031');
    await expect(screen.getByTestId('lead-detail-status').getByText(/^new$/i)).toBeVisible();
    await scrollAboveFooter(device, screen.getByTestId('lead-status-select-quoted'), 'lead-detail-scroll');
    await screen.getByTestId('lead-status-select-quoted').tap();
    await screen.getByTestId('lead-quote-input').scrollIntoViewIfNeeded();
    await screen.getByTestId('lead-quote-input').fill('1800');
    await dismissKeyboard(device);
    await expect(screen.getByTestId('lead-quote-total')).toContainText('72,000');
    await screen.getByTestId('lead-quote-send-button').scrollIntoViewIfNeeded();
    await screen.getByTestId('lead-quote-send-button').tap();
    await expect(screen.getByTestId('lead-detail-quote')).toContainText('1,800');
  });

  test('inbox: swipe left to archive, then UNDO from the toast', async ({ device, screen }) => {
    await deepLink(device, 'messages');
    const row = screen.getByTestId('conversation-C-logistics');
    await row.swipe({ direction: 'left' });
    await screen.getByTestId('conversation-archive-C-logistics').tap();
    await expect(row).toBeHidden();
    await screen.getByTestId('toast-action').tap(); // UNDO
    await expect(row).toBeVisible();
  });

  test('chat: message status goes Sent → Delivered → Read and the buyer replies', async ({ device, screen }) => {
    await deepLink(device, 'chat?cid=C-buyer-1');
    await screen.getByTestId('chat-input').fill('Best I can do is ₹1,800');
    await screen.getByTestId('chat-send-button').tap();
    await expect(screen.getByTestId('chat-last-status')).toHaveText('Read', { timeout: 6000 });
    await expect(screen.getByTestId('chat-typing-indicator')).toBeHidden({ timeout: 8000 });
    await expect(screen.getByText(/15 days credit/)).toBeVisible();
  });

  test('compare two products side by side', async ({ screen }) => {
    await screen.getByTestId('tab-catalog').tap();
    for (const sku of ['SKU-10001', 'SKU-10002']) {
      await screen.getByTestId(`product-card-${sku}-open`).longPress({ duration: 800 });
      await screen.getByTestId('quick-action-compare').tap();
    }
    await expect(screen.getByTestId('catalog-compare-count')).toHaveText('2 selected to compare');
    await screen.getByTestId('catalog-compare-open').tap();
    await expect(screen.getByTestId('compare-screen')).toBeVisible();
    await screen.getByTestId('compare-table-scroll').swipe({ direction: 'left' });
    await expect(screen.getByTestId('compare-column-SKU-10002')).toBeVisible();
    await screen.getByTestId('compare-best-price').scrollIntoViewIfNeeded();
    await expect(screen.getByTestId('compare-best-price')).toBeVisible();
  });
});

test.describe('Online features (device needs internet)', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
  });

  test('live exchange rates load from the internet', async ({ device, screen }) => {
    await deepLink(device, 'market');
    await expect(screen.getByTestId('market-rate-USD')).toBeVisible({ timeout: 20_000 });
    const inr = parseFloat((await screen.getByTestId('market-rate-USD-inr').getText()).replace(/[^\d.]/g, ''));
    expect(inr).toBeGreaterThan(50);
    expect(inr).toBeLessThan(150);
  });

  test('web portal: log in to a live practice site inside the WebView', async ({ device, screen }) => {
    await deepLink(device, `browser?url=${encodeURIComponent('https://the-internet.herokuapp.com/login')}`);
    const webview = screen.getByTestId('browser-webview');
    await expect(webview.getByText('Login Page', { exact: true })).toBeVisible({ timeout: 30_000 });
    // Android exposes only the visible WebView controls, so positional indexes change while scrolling.
    const username = webview.getByPlaceholder('Username', { exact: true });
    const password = webview.getByPlaceholder('Password', { exact: true });
    await scrollAboveFooter(device, username, 'browser-webview');
    await username.tap();
    await expect(username).toBeFocused();
    await device.driver.typeText('tomsmith');
    await expect(username).toHaveValue('tomsmith');
    await scrollAboveFooter(device, password, 'browser-webview');
    await password.tap();
    await expect(password).toBeFocused();
    await device.driver.typeText('SuperSecretPassword!');
    const login = webview.getByRole('button', { name: /Login/i });
    await scrollAboveFooter(device, login, 'browser-webview');
    await login.tap();
    await expect(webview.getByText(/You logged into a secure area!/)).toBeVisible({ timeout: 30_000 });
    // Native toolbar reflects WebView history
    await expect(screen.getByTestId('browser-back-button')).toBeEnabled();
  });
});
