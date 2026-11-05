import { test, expect } from '@mobilewright/test';
import { LoginScreen } from '../screens/LoginScreen.js';
import { OtpScreen } from '../screens/OtpScreen.js';
import { HomeScreen } from '../screens/HomeScreen.js';
import { freshStart, relaunch, scrollAboveFooter, USERS } from '../support/app.js';

test.describe('Login & OTP', () => {
  test.beforeEach(async ({ device, screen }) => {
    await freshStart(device);
    await new LoginScreen(screen, device).skipOnboardingIfShown();
  });

  test('empty form shows both field errors', async ({ device, screen }) => {
    const login = new LoginScreen(screen, device);
    await login.submit().tap();
    await expect(login.emailError()).toHaveText('Email is required');
    await expect(login.passwordError()).toHaveText('Password is required');
  });

  test('wrong password shows the error banner', async ({ device, screen }) => {
    const login = new LoginScreen(screen, device);
    await login.login(USERS.buyer, 'wrong123');
    await login.errorBanner().scrollIntoViewIfNeeded({ direction: 'down' });
    await expect(login.errorBanner()).toContainText('Incorrect email or password');
  });

  test('locked account cannot sign in', async ({ device, screen }) => {
    const login = new LoginScreen(screen, device);
    await login.login(USERS.locked);
    await login.errorBanner().scrollIntoViewIfNeeded({ direction: 'down' });
    await expect(login.errorBanner()).toContainText(/locked/i);
  });

  test('wrong OTP, then the OTP from the SMS banner signs in @smoke', async ({ device, screen }) => {
    const login = new LoginScreen(screen, device);
    const otp = new OtpScreen(screen, device);
    await login.login(USERS.buyer);
    await expect(otp.root()).toBeVisible({ timeout: 20_000 });

    const code = await otp.readOtpFromSms();
    await otp.enter('000000');
    await expect(otp.error()).toContainText('Incorrect OTP');

    await otp.enter(code);
    const home = new HomeScreen(screen);
    await home.waitForLoaded();
    await expect(screen.getByTestId('header-title')).toContainText('Ravi');
  });

  test('"Remember me" pre-fills the email after an app restart', async ({ device, screen }) => {
    const login = new LoginScreen(screen, device);
    const otp = new OtpScreen(screen, device);
    await login.login(USERS.buyer, undefined, { remember: true });
    await otp.enter(await otp.readOtpFromSms());
    await new HomeScreen(screen).waitForLoaded();

    // Log out through the native alert.
    await screen.getByTestId('tab-account').tap();
    await scrollAboveFooter(device, screen.getByTestId('account-row-logout'), 'account-scroll');
    await screen.getByTestId('account-row-logout').tap();
    await expect(screen.getByText('Log out?', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: /^Log out$/i }).tap();
    await expect(login.root()).toBeVisible();

    await relaunch(device);
    await expect(login.email()).toHaveValue(USERS.buyer);
  });
});
