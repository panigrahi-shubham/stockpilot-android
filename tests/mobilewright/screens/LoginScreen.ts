import { expect, type Device, type Screen } from 'mobilewright';
import { PASSWORD, scrollAboveFooter } from '../support/app.js';

export class LoginScreen {
  constructor(private readonly screen: Screen, private readonly device: Device) {}

  readonly root = () => this.screen.getByTestId('login-screen');
  readonly email = () => this.screen.getByTestId('login-email-input');
  readonly password = () => this.screen.getByTestId('login-password-input');
  readonly submit = () => this.screen.getByTestId('login-submit-button');
  readonly remember = () => this.screen.getByTestId('login-remember-checkbox');
  readonly errorBanner = () => this.screen.getByTestId('login-error-message');
  readonly emailError = () => this.screen.getByTestId('login-email-input-error');
  readonly passwordError = () => this.screen.getByTestId('login-password-input-error');

  /** Onboarding only appears on a fresh install — skip it if it's there. */
  async skipOnboardingIfShown() {
    const skip = this.screen.getByTestId('onboarding-skip-button');
    // Wait for either valid entry screen rather than silently ignoring a startup failure.
    await skip.or(this.root()).waitFor({ state: 'visible', timeout: 30_000 });
    if (await skip.isVisible()) await skip.tap();
    await expect(this.root()).toBeVisible();
  }

  async login(email: string, password = PASSWORD, opts: { remember?: boolean } = {}) {
    await scrollAboveFooter(this.device, this.email(), 'login-scroll');
    await this.email().tap();
    await expect(this.email()).toBeFocused();
    await this.device.driver.fill(email);
    await expect(this.email()).toHaveValue(email);
    await scrollAboveFooter(this.device, this.password(), 'login-scroll');
    await this.password().tap();
    // The driver's combined tap/fill can write into the previous field before focus moves.
    await expect(this.password()).toBeFocused();
    await this.device.driver.fill(password);
    if (opts.remember) {
      await scrollAboveFooter(this.device, this.remember(), 'login-scroll');
      await this.remember().check();
    }
    await scrollAboveFooter(this.device, this.submit(), 'login-scroll');
    await this.submit().tap();
  }
}
