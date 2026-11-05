import { expect, type Screen } from 'mobilewright';

export class HomeScreen {
  constructor(private readonly screen: Screen) {}

  readonly root = () => this.screen.getByTestId('home-screen');
  readonly cartBadge = () => this.screen.getByTestId('header-cart-button-badge');
  readonly availableCredit = () => this.screen.getByTestId('home-available-credit');

  async waitForLoaded() {
    await this.root().or(this.screen.getByTestId('promo-modal')).waitFor({ timeout: 20_000 });
    await this.dismissPromoIfShown();
    await expect(this.root()).toBeVisible({ timeout: 20_000 });
  }

  /**
   * The festive promo pop-up appears ~1.5 s after Home loads, 50% of the time (QA Lab → "Random").
   * Robust tests handle it instead of hoping it doesn't show.
   */
  async dismissPromoIfShown() {
    const close = this.screen.getByTestId('promo-modal-close');
    if (await close.isVisible({ timeout: 3500 })) {
      await close.tap();
      await close.waitFor({ state: 'hidden' });
    }
  }

  async openTab(tab: 'home' | 'catalog' | 'scan' | 'orders' | 'account') {
    await this.screen.getByTestId(`tab-${tab}`).tap();
  }
}
