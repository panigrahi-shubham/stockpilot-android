import { expect, type Screen } from 'mobilewright';
import { rupees } from '../support/app.js';

export class CartScreen {
  constructor(private readonly screen: Screen) {}

  readonly root = () => this.screen.getByTestId('cart-screen');
  readonly couponInput = () => this.screen.getByTestId('cart-coupon-input');
  readonly couponApply = () => this.screen.getByTestId('cart-coupon-apply-button');
  readonly couponError = () => this.screen.getByTestId('cart-coupon-input-error');
  readonly couponStatus = () => this.screen.getByTestId('cart-coupon-status');
  readonly checkout = () => this.screen.getByTestId('cart-checkout-button');
  readonly empty = () => this.screen.getByTestId('cart-empty');

  item(sku: string, variant = 'single') {
    const id = `${sku}-${variant}`;
    return {
      row: this.screen.getByTestId(`cart-item-${id}`),
      qty: this.screen.getByTestId(`cart-item-qty-${id}-value`),
      plus: this.screen.getByTestId(`cart-item-qty-${id}-increment`),
      minus: this.screen.getByTestId(`cart-item-qty-${id}-decrement`),
      lineTotal: this.screen.getByTestId(`cart-item-line-total-${id}`),
      delete: this.screen.getByTestId(`cart-item-delete-${id}`),
    };
  }

  async open() {
    await this.screen.getByTestId('header-cart-button').first().tap();
    await expect(this.root()).toBeVisible();
  }

  async applyCoupon(code: string) {
    await this.couponInput().fill(code);
    await this.couponApply().tap();
  }

  async total(): Promise<number> {
    return rupees(await this.screen.getByTestId('cart-total').getText());
  }

  /** Swipe the row left to reveal the red Delete action, then tap it. */
  async swipeDelete(sku: string, variant = 'single') {
    const it = this.item(sku, variant);
    await it.row.swipe({ direction: 'left' });
    await it.delete.tap();
  }
}
