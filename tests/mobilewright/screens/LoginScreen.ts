import { expect, type Screen } from 'mobilewright';
import { PASSWORD } from '../support/app.js';

export class LoginScreen {
  constructor(private readonly screen: Screen) {}

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
    if (await skip.isVisible({ timeout: 4000 }).catch(() => false)) await skip.tap();
    await expect(this.root()).toBeVisible();
  }

  async login(email: string, password = PASSWORD, opts: { remember?: boolean } = {}) {
    await this.email().fill(email);
    await this.password().fill(password);
    if (opts.remember) await this.remember().check();
    await this.submit().tap();
  }
}
