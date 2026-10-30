import { test, expect } from '@mobilewright/test';
import { CatalogScreen } from '../screens/CatalogScreen.js';
import { CartScreen } from '../screens/CartScreen.js';
import { loginFresh } from '../support/flows.js';

const SKU = 'SKU-10001'; // Annapurna Gold Sona Masoori Rice 25 kg — in stock, MOQ 2 (ADD puts 2 in the cart)

test.describe('Cart & checkout', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
    await screen.getByTestId('tab-catalog').tap();
    const catalog = new CatalogScreen(screen);
    await catalog.waitForResults();
    await catalog.addProduct(SKU);
    // The toast disappears after 3.5 s — assert it straight away.
    await expect(screen.getByTestId('toast-message')).toContainText('to cart');
  });

  test('coupon below minimum shows a helpful error, then applies after raising quantity', async ({ screen }) => {
    const cart = new CartScreen(screen);
    await cart.open();
    await cart.applyCoupon('B2B10');
    await expect(cart.couponError()).toContainText('more to use this code');

    for (let i = 0; i < 4; i++) await cart.item(SKU).plus.tap();
    await expect(cart.item(SKU).qty).toHaveValue(/\d+/);
    await cart.applyCoupon('B2B10');
    await expect(cart.couponStatus()).toContainText('You save');
  });

  test('swipe left deletes an item and the empty state appears', async ({ screen }) => {
    const cart = new CartScreen(screen);
    await cart.open();
    await cart.swipeDelete(SKU);
    await expect(cart.empty()).toBeVisible();
  });

  test('checkout validates the delivery step', async ({ screen }) => {
    const cart = new CartScreen(screen);
    await cart.open();
    for (let i = 0; i < 2; i++) await cart.item(SKU).plus.tap();
    await expect(cart.checkout()).toBeEnabled();
    await cart.checkout().tap();

    await expect(screen.getByTestId('checkout-step-0-active')).toBeVisible();
    await screen.getByTestId('checkout-continue-button').tap();
    await expect(screen.getByTestId('checkout-step-1-active')).toBeVisible();

    await screen.getByTestId('checkout-continue-button').tap();
    await expect(screen.getByTestId('checkout-delivery-date-error')).toHaveText('Select a delivery date');
    await expect(screen.getByTestId('checkout-slot-error')).toHaveText('Select a delivery slot');
    await expect(screen.getByTestId('checkout-slot-evening')).toBeDisabled();
  });

  test('Android back on checkout asks "Leave checkout?"', async ({ screen, platform }) => {
    test.skip(platform !== 'android', 'Hardware back is Android-only');
    const cart = new CartScreen(screen);
    await cart.open();
    for (let i = 0; i < 2; i++) await cart.item(SKU).plus.tap();
    await cart.checkout().tap();

    const dialog = screen.waitForEvent('dialog');
    await screen.pressButton('BACK');
    const d = await dialog;
    expect(d.title()).toBe('Leave checkout?');
    await d.tap('Stay');
    await expect(screen.getByTestId('checkout-screen')).toBeVisible();
  });
});
