# Mobilewright sample suite — StockPilot B2B

Playwright-style mobile tests using [Mobilewright](https://mobilewright.dev) with a **Screen Object Model**.

```
screens/      LoginScreen, OtpScreen, HomeScreen, CatalogScreen, CartScreen
support/      app.ts (fresh start, deep links, helpers) · flows.ts (loginFresh)
tests/        01-login · 02-catalog · 03-cart-checkout · 04-gestures · 05-device · 06-webview · 07-marketplace (seller, leads, inbox, compare + 🌐 live market & live WebView)
```

## Run

```bash
npm install
npx mobilewright doctor            # checks adb / Xcode / simulators
npx mobilewright devices           # the booted emulator must be listed
npx mobilewright test              # all tests on Android
npx mobilewright test 04-gestures  # one file
PLATFORM=ios npx mobilewright test # iOS simulator
APP_PATH=/path/to/app-release.apk npx mobilewright test   # install the build first
npx mobilewright show-report
npx mobilewright inspect           # live locator inspector in your browser
```

## Patterns worth copying

| Problem | How the suite solves it |
|---|---|
| Clean state per test | `device.clearAppData()` + `launchApp()` in `freshStart()` |
| OTP that arrives later | wait for `otp-sms-text`, regex the 6 digits (`OtpScreen.readOtpFromSms`) |
| Random promo pop-up | `HomeScreen.dismissPromoIfShown()` — short `waitFor`, swallow timeout |
| Native alerts | `const d = screen.waitForEvent('dialog'); …; (await d).tap('Log out')` |
| Permission dialogs | `screen.on('dialog', d => d.isSystem() ? d.accept() : undefined)` |
| Pinch / drag & drop | `screen.gesture({ pointers: [[...finger1], [...finger2]] })` |
| Hybrid screens | `const page = await screen.getByWebView().page()` → Playwright locators |
| Live data (exchange rates) | parse the number and assert a range, not an exact value |
| Online-only tests | grouped under `Online features` — run them with `npx mobilewright test -g "Online"` or skip them with `--grep-invert "Online"` |

> Mobilewright is young (0.0.x) and moving fast. If an API here changes, check `node_modules/@mobilewright/core/dist/*.d.ts` — the types are the source of truth.
