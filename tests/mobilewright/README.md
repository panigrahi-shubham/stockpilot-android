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

## GitHub Actions

The root `.github/workflows/ci.yml` validates an existing **release APK** on Android
35 x86_64. Pull requests run four `@smoke` cases; `main` pushes run regression in
three shards, one worker per emulator. Manual runs can select either suite.

The prepare job downloads the APK once and shares the same SHA-256-identified file
with all shards. Use `apk_url` / `MOBILEWRIGHT_APK_URL`, or
`apk_artifact_id` / `MOBILEWRIGHT_APK_ARTIFACT_ID`. The default artifact is
`13338790340`; a stable HTTPS APK URL is needed when that historical artifact
expires. Optional `apk_sha256` / `MOBILEWRIGHT_APK_SHA256` checks the binary's hash.
CI does not create APKs and rejects debuggable APKs for release validation.

`scripts/check-device.mjs` warms up the app and verifies startup before testing.
It records and closes at most one Pixel Launcher first-boot ANR; it never dismisses
an ANR from the app under test. Hardware keyboard mode keeps controls unobscured.
Set `MOBILEWRIGHT_DEVICE_ID` locally to select a specific device when several are online.
Reports include HTML, JUnit XML, failure screenshots/accessibility trees, package
information, and device logs. Failed assertions fail CI; automatic retries are off.
Download **mobilewright-android-report-1**, **-2**, or **-3**, extract it, then run
`npx mobilewright show-report ./mobilewright-report`.

All 36 cases are discovered, including live-network cases. The local driver's
single-pointer limitation explicitly skips the pinch test, which remains in the
report as an unsupported capability. Other gesture and WebView tests run normally.
WebViews are driven through Android accessibility and real touches, so release
APKs do not require DOM injection or debugging to be enabled.

## Patterns worth copying

| Problem | How the suite solves it |
|---|---|
| Clean state per test | `device.clearAppData()` + `launchApp()` in `freshStart()` |
| OTP that arrives later | wait for `otp-sms-text`, regex the 6 digits (`OtpScreen.readOtpFromSms`) |
| Random promo pop-up | `HomeScreen.dismissPromoIfShown()` — short `waitFor`, swallow timeout |
| Native alerts | `const d = screen.waitForEvent('dialog'); …; (await d).tap('Log out')` |
| Permission dialogs | `screen.on('dialog', d => d.isSystem() ? d.accept() : undefined)` |
| Drag & drop | Measure source/target bounds in native screen pixels; the local driver supports one pointer |
| Pinch coverage | Explicitly skipped until a driver supports multiple pointers |
| Release WebViews | Scope native accessibility locators to the WebView and use real touch scrolling |
| Live data (exchange rates) | parse the number and assert a range, not an exact value |
| Online-only tests | grouped under `Online features` — run them with `npx mobilewright test -g "Online"` or skip them with `--grep-invert "Online"` |

> Mobilewright is young (0.0.x) and moving fast. If an API here changes, check `node_modules/@mobilewright/core/dist/*.d.ts` — the types are the source of truth.
