import { test, expect } from '@mobilewright/test';
import { deepLink } from '../support/app.js';
import { loginFresh } from '../support/flows.js';

test.describe('Seller mode, leads, inbox & compare', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
  });

  test('switching to seller mode unlocks the Seller Hub', async ({ screen }) => {
    await screen.getByTestId('tab-account').tap();
    await screen.getByTestId('account-mode-switch-seller').tap();
    await expect(screen.getByTestId('account-mode-badge')).toContainText(/seller/i);
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
    await add.scrollIntoViewIfNeeded();
    for (let i = 0; i < 5; i++) await add.tap();
    await expect(screen.getByTestId('listing-spec-count')).toHaveText('6/6');
    await expect(add).toBeDisabled();

    await screen.getByTestId('listing-save-draft-button').tap();
    await expect(screen.getByTestId('toast-message')).toHaveText('Saved as draft');
  });

  test('lead status: send a quotation', async ({ device, screen }) => {
    await deepLink(device, 'seller/lead/LD-9031');
    await expect(screen.getByTestId('lead-detail-status')).toHaveText(/new/i);
    await screen.getByTestId('lead-status-select-quoted').tap();
    await screen.getByTestId('lead-quote-input').fill('1800');
    await expect(screen.getByTestId('lead-quote-total')).toContainText('72,000');
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
    await expect(screen.getByTestId('compare-column-SKU-10002')).toBeVisible();
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
    const page = await screen.getByWebView().page();
    await page.locator('#username').fill('tomsmith');
    await page.locator('#password').fill('SuperSecretPassword!');
    await page.locator('button[type="submit"]').click();
    await page.locator('#flash.success').waitFor({ state: 'visible', timeout: 15_000 });
    expect(await page.locator('#flash').textContent()).toContain('You logged into a secure area!');
    // Native toolbar reflects WebView history
    await expect(screen.getByTestId('browser-back-button')).toBeEnabled();
  });
});
