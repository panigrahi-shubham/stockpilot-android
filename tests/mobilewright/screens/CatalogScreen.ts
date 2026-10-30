import { expect, type Screen } from 'mobilewright';
import { rupees } from '../support/app.js';

export class CatalogScreen {
  constructor(private readonly screen: Screen) {}

  readonly root = () => this.screen.getByTestId('catalog-screen');
  readonly search = () => this.screen.getByTestId('catalog-search-input');
  readonly resultsCount = () => this.screen.getByTestId('catalog-results-count');
  readonly skeleton = () => this.screen.getByTestId('catalog-skeleton');

  /** Wait until the skeleton is gone and the results line is final. */
  async waitForResults() {
    await expect(this.skeleton()).toBeHidden({ timeout: 20_000 });
    await expect(this.resultsCount()).not.toHaveText(/Searching/);
  }

  async searchFor(q: string) {
    await this.search().fill(q);
    // 400 ms debounce + API latency: assert on the outcome, never sleep.
    await expect(this.resultsCount()).toContainText(`“${q}”`, { timeout: 15_000 });
    await this.waitForResults();
  }

  async count(): Promise<number> {
    return Number((await this.resultsCount().getText()).match(/\d+/)?.[0] ?? 0);
  }

  async sortBy(option: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'discount') {
    await this.screen.getByTestId('catalog-sort-button').tap();
    await this.screen.getByTestId(`catalog-sort-option-${option}`).tap();
    await this.waitForResults();
  }

  async filterCategory(id: string) {
    await this.screen.getByTestId(`catalog-category-${id}`).tap();
    await this.waitForResults();
  }

  /** Visible prices, top to bottom (only what's on screen — FlatLists virtualise). */
  async visiblePrices(): Promise<number[]> {
    const all = await this.screen.getByText(/^₹[\d,]+(\.\d+)?$/).all();
    const out: number[] = [];
    for (const l of all) out.push(rupees(await l.getText()));
    return out;
  }

  async addProduct(sku: string) {
    await this.screen.getByTestId(`product-add-${sku}`).tap();
  }
}
