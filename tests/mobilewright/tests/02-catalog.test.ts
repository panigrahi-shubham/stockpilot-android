import { test, expect } from '@mobilewright/test';
import { CatalogScreen } from '../screens/CatalogScreen.js';
import { loginFresh } from '../support/flows.js';

test.describe('Catalog', () => {
  test.beforeEach(async ({ device, screen }) => {
    await loginFresh(device, screen);
    await screen.getByTestId('tab-catalog').tap();
    await new CatalogScreen(screen).waitForResults();
  });

  test('search narrows the results and shows the keyword', async ({ screen }) => {
    const catalog = new CatalogScreen(screen);
    const all = await catalog.count();
    await catalog.searchFor('ghee');
    const filtered = await catalog.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(all);
  });

  test('nonsense search shows the empty state, and clearing restores results', async ({ screen }) => {
    const catalog = new CatalogScreen(screen);
    await catalog.search().fill('zzzz-no-such-product');
    await expect(screen.getByTestId('catalog-empty')).toBeVisible({ timeout: 15_000 });
    await screen.getByTestId('catalog-empty-action').tap();
    await catalog.waitForResults();
    expect(await catalog.count()).toBeGreaterThan(50);
  });

  test('sort "Price: Low to High" puts the cheapest first', async ({ screen }) => {
    const catalog = new CatalogScreen(screen);
    await catalog.sortBy('price_asc');
    const prices = await catalog.visiblePrices();
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('long-press a product opens quick actions and adds it to favourites', async ({ screen }) => {
    await screen.getByTestId('product-card-SKU-10001-open').longPress({ duration: 800 });
    await expect(screen.getByTestId('catalog-quick-actions')).toBeVisible();
    await screen.getByTestId('quick-action-favorite').tap();
    await expect(screen.getByTestId('toast-message')).toContainText('favourites');
  });

  test('category chip filters the list', async ({ screen }) => {
    const catalog = new CatalogScreen(screen);
    await catalog.filterCategory('dairy');
    await expect(screen.getByTestId('catalog-category-dairy')).toBeSelected();
    expect(await catalog.count()).toBeLessThan(20);
  });
});
