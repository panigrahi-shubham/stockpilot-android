import { test, expect } from '@mobilewright/test';
import { LoginScreen } from '../screens/LoginScreen.js';
import { OtpScreen } from '../screens/OtpScreen.js';
import { HomeScreen } from '../screens/HomeScreen.js';
import { freshStart, relaunch, USERS } from '../support/app.js';

test.describe('Login & OTP', () => {
  test.beforeEach(async ({ device, screen }) => {
    await freshStart(device);
    await new LoginScreen(screen).skipOnboardingIfShown();
  });

  test('empty form shows both field errors', async ({ screen }) => {
    const login = new LoginScreen(screen);
    await login.submit().tap();
    await expect(login.emailError()).toHaveText('Email is required');
    await expect(login.passwordError()).toHaveText('Password is required');
  });

  test('wrong password shows the error banner', async ({ screen }) => {
    const login = new LoginScreen(screen);
    await login.login(USERS.buyer, 'wrong123');
    await expect(login.errorBanner()).toContainText('Incorrect email or password');
  });

  test('locked account cannot sign in', async ({ screen }) => {
    const login = new LoginScreen(screen);
    await login.login(USERS.locked);
    await expect(login.errorBanner()).toContainText(/locked/i);
  });

  test('wrong OTP, then the OTP from the SMS banner signs in', async ({ screen }) => {
    const login = new LoginScreen(screen);
    const otp = new OtpScreen(screen);
    await login.login(USERS.buyer);
    await expect(otp.root()).toBeVisible({ timeout: 20_000 });

    const code = await otp.readOtpFromSms();
    await otp.enter('000000');
    await expect(otp.error()).toContainText('Incorrect OTP');

    await otp.enter(code);
    const home = new HomeScreen(screen);
    await home.waitForLoaded();
    await home.dismissPromoIfShown();
    await expect(screen.getByTestId('header-title')).toContainText('Ravi');
  });

  test('"Remember me" pre-fills the email after an app restart', async ({ device, screen }) => {
    const login = new LoginScreen(screen);
    const otp = new OtpScreen(screen);
    await login.login(USERS.buyer, undefined, { remember: true });
    await otp.enter(await otp.readOtpFromSms());
    await new HomeScreen(screen).waitForLoaded();

    // Log out through the native alert.
    await new HomeScreen(screen).dismissPromoIfShown();
    await screen.getByTestId('tab-account').tap();
    await screen.getByTestId('account-row-logout').scrollIntoViewIfNeeded();
    const dialog = screen.waitForEvent('dialog');
    await screen.getByTestId('account-row-logout').tap();
    await (await dialog).tap('Log out');

    await relaunch(device);
    await expect(login.email()).toHaveValue(USERS.buyer);
  });
});
