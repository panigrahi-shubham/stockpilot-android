import { expect, type Device, type Screen } from 'mobilewright';
import { LoginScreen } from '../screens/LoginScreen.js';
import { OtpScreen } from '../screens/OtpScreen.js';
import { HomeScreen } from '../screens/HomeScreen.js';
import { freshStart, USERS } from './app.js';

/** Fresh install → skip onboarding → password → OTP from SMS banner → Home (promo handled). */
export async function loginFresh(device: Device, screen: Screen, email: string = USERS.buyer) {
  await freshStart(device);
  const login = new LoginScreen(screen);
  const otp = new OtpScreen(screen);
  const home = new HomeScreen(screen);

  await login.skipOnboardingIfShown();
  await login.login(email);
  await expect(otp.root()).toBeVisible({ timeout: 20_000 });
  await otp.enter(await otp.readOtpFromSms());
  await home.waitForLoaded();
  await home.dismissPromoIfShown();
  return { login, otp, home };
}
