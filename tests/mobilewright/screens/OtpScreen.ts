import { expect, type Screen } from 'mobilewright';

export class OtpScreen {
  constructor(private readonly screen: Screen) {}

  readonly root = () => this.screen.getByTestId('otp-screen');
  readonly smsText = () => this.screen.getByTestId('otp-sms-text');
  readonly firstBox = () => this.screen.getByTestId('otp-input-0');
  readonly verify = () => this.screen.getByTestId('otp-verify-button');
  readonly error = () => this.screen.getByTestId('otp-error');

  /**
   * The fake SMS banner slides in ~2 s after the screen opens and hides after 8 s.
   * Wait for it, then pull the 6-digit code out of the message.
   */
  async readOtpFromSms(): Promise<string> {
    await expect(this.smsText()).toBeVisible({ timeout: 15_000 });
    const text = await this.smsText().getText();
    const otp = text.match(/\b\d{6}\b/)?.[0];
    if (!otp) throw new Error(`No OTP found in SMS: "${text}"`);
    return otp;
  }

  /** Typing all 6 digits into the first box auto-distributes them (like SMS autofill). */
  async enter(otp: string) {
    await this.firstBox().fill(otp);
    await this.verify().tap();
  }
}
