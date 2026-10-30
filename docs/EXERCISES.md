# StockPilot B2B — Automation Practice Plan

A graded set of **122 exercises** that take a manual mobile tester from “I can find an element” to “I own a cross-platform framework”. Every exercise names the exact screen, the test IDs to use, and the Appium / Mobilewright API that solves it.

Recommended pace: one level per week, with Level 9 as the capstone. Levels 10 and 11 cover the marketplace (seller mode) and live online features added in 2.5.0.

| Level | Theme | Exercises | What you’ll be able to say in an interview |
|---|---|---|---|
| 0 | Setup & inspection | 6 | “I can set up Appium / Mobilewright from scratch and inspect any app.” |
| 1 | First scripts | 10 | “I automate login flows with validations.” |
| 2 | Locators & assertions | 10 | “I choose stable locators and avoid brittle XPath.” |
| 3 | Waits & synchronisation | 10 | “My tests don’t flake on slow networks or animations.” |
| 4 | Gestures | 14 | “I automate swipe, long-press, drag-and-drop, pinch and scroll.” |
| 5 | Device & system features | 16 | “I handle permissions, alerts, notifications, deep links, background/foreground.” |
| 6 | Hybrid / WebView | 8 | “I switch between native and web contexts.” |
| 7 | Framework engineering | 10 | “I built a POM/SOM framework with fixtures, data, reporting and CI.” |
| 8 | Bug hunting | 4 | “My automation catches real functional bugs.” |
| 9 | Capstone E2E journeys | 4 | “I own end-to-end regression for a B2B ordering product.” |
| 10 | Marketplace: seller mode, leads, inbox, compare, reviews | 18 | “I automate role-based, two-sided marketplace flows.” |
| 11 | Online & live WebView | 12 | “I test against real networks and live websites without flaky tests.” |

**Test accounts** (password `Pilot@123` for all): `buyer@`, `approver@`, `slow@`, `glitch@`, `newstore@`, `locked@` … `@stockpilot.in`. Long-press the StockPilot logo on the login screen for 1.2 s to open the test-account picker (that itself is exercise L4-05).

**QA Lab** (unlock by tapping the app version 7× on Account, or open `stockpilot://qa-lab`): latency, random failures, offline, promo pop-up mode, skip OTP, expire session, push notification, crash, reset.

---

## Level 0 — Setup & inspection

| # | Exercise | Where | Hints |
|---|---|---|---|
| L0-01 | Build the APK (or simulator .app) and install it on an emulator | README → *Build the app* | `adb install -r app-release.apk` |
| L0-02 | Launch the app from your tool with **no** test code: just open & close | — | Appium: `appium:appPackage com.stockpilot.b2b`, `appium:appActivity .MainActivity`. Mobilewright: `bundleId: 'com.stockpilot.b2b'` |
| L0-03 | Open Appium Inspector **and** `npx mobilewright inspect`; find `login-email-input` in both | Login | Note how Android shows it as *resource-id*, iOS as *name* |
| L0-04 | Write down 3 different locator strategies for the Sign-in button and decide which is most stable | Login | id / accessibility id / text / XPath |
| L0-05 | Print the full page source (XML) of the Home screen and count how many `product-add-` buttons exist | Home | Appium: `driver.getPageSource()`. Mobilewright: `screen.viewTree()` |
| L0-06 | Take a screenshot of the onboarding screen and attach it to your report | Onboarding | `driver.saveScreenshot()` / `screen.screenshot()` |

## Level 1 — First scripts (login module)

| # | Exercise | Test IDs | Assertion |
|---|---|---|---|
| L1-01 | Skip onboarding | `onboarding-skip-button` | `login-screen` visible |
| L1-02 | Go through all 3 onboarding slides with **Next** | `onboarding-next-button` → `onboarding-get-started-button` | Button ID changes on last slide |
| L1-03 | Submit an empty login form | `login-submit-button` | `login-email-input-error` = “Email is required”, `login-password-input-error` = “Password is required” |
| L1-04 | Invalid email format | `login-email-input` = `ravi@` | “Enter a valid email address” |
| L1-05 | Wrong password | `buyer@stockpilot.in` / `wrong123` | `login-error-message` contains “Incorrect email or password” |
| L1-06 | Locked account | `locked@stockpilot.in` | Error contains “locked” |
| L1-07 | Show / hide password | `login-password-input-toggle-visibility` | `secureTextEntry` flips (Android `password` attribute, iOS `XCUIElementTypeSecureTextField` → `TextField`) |
| L1-08 | Forgot password happy & unhappy path | `forgot-password-email-input`, `forgot-password-submit-button` | Success text / “We couldn’t find an account” |
| L1-09 | Request access sheet with validation | `login-request-access-link`, `request-access-*` | Phone must be 10 digits starting 6–9 |
| L1-10 | **Remember me** survives an app restart | `login-remember-checkbox` | After terminate + relaunch the email is pre-filled |

## Level 2 — Locators & assertions

| # | Exercise | Where / IDs | Skill |
|---|---|---|---|
| L2-01 | Find the product card for `SKU-10001` and read its price | `product-price-SKU-10001` | Dynamic IDs from data |
| L2-02 | Count products returned for “rice” | `catalog-results-count` | Parse numbers out of text |
| L2-03 | Read the cart badge and assert it equals the sum of quantities in the cart | `header-cart-button-badge` vs `cart-item-qty-*-value` | Cross-screen data checks |
| L2-04 | Assert the Checkout button is **disabled** when the cart is below ₹2,000 | `cart-checkout-button` | `isEnabled()` / `toBeDisabled()` |
| L2-05 | Assert a radio option is selected & another is disabled | `checkout-slot-morning`, `checkout-slot-evening` | `selected` / `enabled` attributes |
| L2-06 | Assert a checkbox is checked | `checkout-terms-checkbox` | `checked` attribute / `toBeChecked()` |
| L2-07 | Switch language to Telugu and make your login test pass **unchanged** | Settings → `settings-language-select` | Prove testIDs beat text locators |
| L2-08 | Find “Order shipped” notification using *partial text* only | Notifications | `textContains` / `getByText(/shipped/i)` |
| L2-09 | Get the 3rd order card in the Active tab without knowing its ID | `orders-list` | Index-based (`nth(2)`) — and why it’s risky |
| L2-10 | Verify every price in the catalog grid is formatted `₹x,xx,xxx.xx` | `product-price-*` | Regex assertions over a list |

## Level 3 — Waits & synchronisation

| # | Exercise | Where | What makes it hard |
|---|---|---|---|
| L3-01 | Read the OTP from the fake SMS banner and log in | `otp-sms-text` → `otp-input-0` | Banner appears ~2 s **after** the screen and disappears after 8 s |
| L3-02 | Wrong OTP → error → correct OTP | `otp-error` | Inputs are cleared after an error |
| L3-03 | Wait for **Resend OTP** to become available | `otp-resend-timer` → `otp-resend-button` | 30-second countdown; don’t `sleep(30000)` |
| L3-04 | Assert a toast message before it vanishes | `toast-message` | Visible for only 3.5 s |
| L3-05 | Log in as `slow@stockpilot.in` and add a product | — | 4–7 s per API call — tune timeouts, not sleeps |
| L3-06 | Set QA Lab latency to 5,000 ms and make the catalog test still pass | `qa-latency-slider` | Skeleton (`catalog-skeleton`) before list |
| L3-07 | Type in search and wait for results to update | `catalog-search-input`, `catalog-results-count` | 400 ms debounce + async results |
| L3-08 | Wait for the loading overlay to disappear after placing an order | `loading-overlay` | Wait for *invisibility* |
| L3-09 | Pull to refresh Orders and assert one order’s status changed | `orders-list`, `order-status-*` | Data changes under you |
| L3-10 | Set failure rate to 30% and make the catalog test retry on `catalog-error-retry` | QA Lab → `qa-fail-rate-30` | Recovery logic vs. blind retries |

## Level 4 — Gestures

| # | Gesture | Where / IDs | Appium hint | Mobilewright hint |
|---|---|---|---|---|
| L4-01 | Horizontal swipe | Onboarding pager / home banner (`onboarding-dot-1-active`) | `mobile: swipeGesture` or W3C actions | `locator.swipe({ direction: 'left' })` |
| L4-02 | Swipe left to delete | Cart row → `cart-item-delete-*` | W3C pointer move | `locator.swipe({ direction: 'left' })` |
| L4-03 | Swipe right to “Save” | Cart row → `cart-item-save-*` | — | `direction: 'right'` |
| L4-04 | Long-press | Catalog card `product-card-SKU-xxxxx-open` → `catalog-quick-actions` | `mobile: longClickGesture` | `locator.longPress()` |
| L4-05 | Long-press with **duration** | `login-logo` (1.2 s) → `test-accounts-sheet` | `duration: 1500` | `longPress({ duration: 1500 })` |
| L4-06 | Double-tap | Product gallery `product-image-0` → heart animation + favourite | `mobile: doubleClickGesture` | `locator.doubleTap()` |
| L4-07 | **Pinch to zoom** | Image viewer `image-viewer-canvas`; assert `image-viewer-zoom-level` > 1.0× | Two-finger W3C actions / `element.zoom()` | `screen.gesture({ pointers: [[…], […]] })` — two finger paths |
| L4-08 | **Drag & drop** | Quick list handle `quick-list-handle-SKU-10001` to position #4 | W3C press-hold-move (`helpers/gestures.ts`) | `screen.gesture({ pointers: [[hold, …, drop]] })` |
| L4-09 | Set a slider value | Filter `filter-price-slider` to ₹1,000 | W3C drag on the thumb / `setValue` | coordinate tap on the track |
| L4-10 | Scroll until visible | Settings → `settings-about-version`; Help → `faq-item-7` | `UiScrollable` / `mobile: scrollGesture` | `scrollIntoViewIfNeeded()` |
| L4-11 | Horizontal scroll inside vertical scroll | Reports `reports-table-scroll` → `reports-cell-0-top-category` | Scroll the inner element | `locator.swipe` on the table |
| L4-12 | Pull to refresh | Home `home-scroll` → `home-last-updated` time changes | swipe down from top | `screen.swipe('down')` |
| L4-13 | Edge-swipe to open the drawer | Home → `drawer` | swipe from x=5 | `screen.swipe('right')` |
| L4-14 | Infinite scroll to the end | Catalog → `catalog-end-of-list` | loop scroll until found | loop `screen.swipe('up')` |

## Level 5 — Device & system features

| # | Feature | Where | Notes |
|---|---|---|---|
| L5-01 | Camera permission → **Allow** | Scan tab → `scan-allow-camera-button` | Android: `id=com.android.permissioncontroller:id/permission_allow_foreground_only_button` |
| L5-02 | Camera permission → **Don’t allow** twice → **Open settings** | `scan-open-settings-button` | Asserts `scan-permission-message` text |
| L5-03 | Manual barcode entry with checksum validation | `scan-manual-input` → `scan-result-card` | Invalid EAN → `scan-manual-input-error` |
| L5-04 | Location permission + auto-fill | Checkout → Add address → `address-use-location-button` | Set emulator GPS first |
| L5-05 | Native **Alert** (accept / dismiss) | Account → `account-row-logout`; Order → Cancel | `driver.acceptAlert()` / button text |
| L5-06 | Native **date picker** dialog | Checkout step 2 → `checkout-delivery-date` | Sunday → `checkout-delivery-date-error` |
| L5-07 | Hardware **Back** blocked by “Leave checkout?” | Checkout → Android back | `driver.back()` then handle the alert |
| L5-08 | **Deep links** | `stockpilot://product/SKU-10001`, `stockpilot://promo/DIWALI25` | `mobile: deepLink` / `device.goto()` |
| L5-09 | **Push notification** tap opens the order | QA Lab → `qa-notify-button` | `driver.openNotifications()`; tap by text |
| L5-10 | Notification permission (Android 13+) appears **after** placing the first order | Order success | Handle a dialog that appears mid-flow |
| L5-11 | **Background → foreground** triggers App Lock | Settings → `settings-app-lock-switch`; background 6 s; PIN `1234` | `driver.background(6)` / terminate+activate |
| L5-12 | App Lock: 3 wrong PINs sign you out | `app-lock-key-*`, `app-lock-error` | Assert attempts message |
| L5-13 | **Clipboard** | Order success → `order-success-copy` | `driver.getClipboard()` (base64) |
| L5-14 | **Orientation** | Reports → rotate → `reports-rotate-hint` disappears | `setOrientation('LANDSCAPE')` / `device.setOrientation('landscape')` |
| L5-15 | **File upload** from device | KYC → `kyc-upload-cheque`; push a PDF first | `driver.pushFile('/sdcard/Download/cheque.pdf', base64)` |
| L5-16 | **Biometrics** | Settings → `settings-biometric-switch`; Login → `login-biometric-button` | Android emulator: `adb -e emu finger touch 1`; iOS: `mobile: sendBiometricMatch` |

## Level 6 — Hybrid / WebView

| # | Exercise | Where | Hints |
|---|---|---|---|
| L6-01 | List contexts and switch to the WebView | Account → Terms of Trade | `NATIVE_APP`, `WEBVIEW_com.stockpilot.b2b` |
| L6-02 | Assert the Terms title inside HTML | `#terms-title` | CSS selector in web context |
| L6-03 | Scroll to `#terms-end`, switch back to native, assert `webview-accept-button` is enabled | Terms | Native ↔ web round trip |
| L6-04 | Submit feedback with **no rating** → `#fb-error` | Account → Send feedback | Web validation |
| L6-05 | Submit valid feedback → native toast | `#fb-rating`, `#fb-comments`, `#fb-submit` | WebView → native bridge |
| L6-06 | Search the help centre and assert “no results” | Help → Help centre → `#help-search` | Mobilewright: `screen.getByWebView().page()` |
| L6-07 | Web portal start page: type in `#portal-search`, tap `#portal-go`, then assert the native `browser-url-input` changed | Drawer → Web portal | Web action → native assertion |
| L6-08 | Tap `#portal-link-login`, then use the native `browser-back-button` and assert you’re back on `#portal-title` | Web portal | Native toolbar driving WebView history |

## Level 7 — Framework engineering

| # | Task |
|---|---|
| L7-01 | Screen Object Model: one class per screen (`LoginScreen`, `CatalogScreen` …) exposing intent-level methods (`loginAs(user)`) |
| L7-02 | Cross-platform selector helper: `byTestId(id)` → `id=` on Android, `~` on iOS (see `tests/appium-wdio/helpers`) |
| L7-03 | Test data in JSON: users, products, coupons. Data-driven login test for all 6 accounts |
| L7-04 | Fixture that starts every test logged in (use QA Lab → Skip OTP, or the OTP-banner helper) |
| L7-05 | Reset state between tests (`adb shell pm clear com.stockpilot.b2b` or QA Lab → Reset) — measure the speed difference |
| L7-06 | Turn off animations (QA Lab → `qa-animations-switch` + `use.animations: 'off'`) and compare flakiness |
| L7-07 | Screenshot + page-source/view-tree on failure; video on retry |
| L7-08 | HTML report (Mobilewright `--reporter html`, WDIO Allure) |
| L7-09 | Run Android + iOS from one suite (projects / capabilities) |
| L7-10 | GitHub Actions: build APK with EAS, boot emulator, run smoke suite |

## Level 8 — Bug hunting with automation

Log in as **`glitch@stockpilot.in`**. This account has **4 planted functional bugs**. Write tests that pass for `buyer@` and fail for `glitch@`, then write a proper bug report for each (title, steps, expected, actual, severity, priority, evidence).

| # | Area to investigate |
|---|---|
| L8-01 | Catalog sorting |
| L8-02 | Coupons in the cart |
| L8-03 | Quantity stepper in the cart |
| L8-04 | Tax calculation in the price summary |

<details>
<summary><b>Answer key (open only after you’ve tried)</b></summary>

1. **Sort “Price: Low to High” returns High → Low.** Expected ascending prices in `product-price-*`.
2. **Coupon `B2B10` applies 1% instead of 10%.** On a ₹10,000 cart, `cart-coupon-discount` shows ₹100 instead of ₹1,000.
3. **Cart stepper `+` / `−` changes quantity by 2.** `cart-item-qty-*-value` jumps 4 → 6.
4. **GST is always 18%**, even for 5% / 12% slab products. Compare `cart-gst` with Σ(line total × product GST%).

</details>

## Level 9 — Capstone journeys

1. **Order to delivery (buyer):** login → search “ghee” → add MOQ → apply `DIWALI25` (expect “Add items worth …”) → raise quantity → checkout with UPI (`checkout-upi-input`, `upi-confirm-button`) → order success → copy order ID → find it in Orders → wait for status “Packed” (15 s) or the push notification.
2. **Approval workflow (two users):** buyer places an order > ₹50,000 → status `Pending approval` → log out → approver logs in → Drawer → Approvals → approve → buyer sees `Confirmed`.
3. **New store onboarding:** `newstore@` → home shows `home-kyc-card` → cart shows `cart-kyc-warning` and checkout disabled → upload 4 KYC docs → submit → credit line activated → checkout enabled.
4. **Resilience suite:** run journey 1 with latency 2,500 ms, 10% failures, promo pop-up “Always” and animations ON. Your suite must stay green across 5 consecutive runs.

## Level 10 — Marketplace (seller mode, leads, inbox, compare, reviews)

Switch modes on **Account → `account-mode-switch-seller`**. Seller screens are also deep-linkable (`stockpilot://seller`, `…/seller/product-form`, `…/seller/leads`, `…/seller/lead/LD-9031`).

| # | Exercise | Where | Hints |
|---|---|---|---|
| L10-01 | Switch to seller mode and assert the drawer shows `drawer-mode` = “SELLER MODE” and `drawer-item-seller-hub` exists; switch back and assert it’s gone | Account, Drawer | Conditional elements: `toBeHidden()` / `isExisting() === false` |
| L10-02 | Open Seller Hub while in **buyer** mode → `seller-mode-off-card` → `seller-switch-to-seller-button` | Seller Hub | Guarded content |
| L10-03 | Read `seller-kpi-active-value`, deactivate a listing with `listing-toggle-L-2001`, go back and assert the KPI dropped by 1 | Seller Hub ↔ My products | Cross-screen state |
| L10-04 | My products tabs: count `listing-card-*` per tab (`my-products-tabs-active/inactive/draft`) and assert drafts can’t be toggled | My products | Disabled switch |
| L10-05 | Publish an empty form → assert every error and `listing-error-summary` | Add product | Field error IDs end in `-error` |
| L10-06 | Type 85 characters into the title → counter stops at `80/80` | `listing-title-input-counter` | maxLength |
| L10-07 | Price ₹500, MRP ₹400 → `listing-mrp-input-error`; fix it and assert `listing-discount-preview` shows the right % | Add product | Cross-field validation + maths |
| L10-08 | Add specs until `listing-spec-count` = `6/6`, assert `listing-add-spec-button` disabled; remove one and assert it’s enabled again | Add product | Dynamic lists |
| L10-09 | Add 5 photos (camera + gallery), wait out `listing-photo-uploading`, assert `listing-photo-limit`; make photo 3 the cover | Add product | Permissions, progress waits |
| L10-10 | Change a field, press Android **Back** → `listing-discard-dialog`; Cancel keeps you there, Discard leaves | Add product | Back-button interception |
| L10-11 | Save as draft → toast → the listing appears under the Draft tab | Add product → My products | End-to-end create |
| L10-12 | Filter leads by status chips and assert every `lead-status-*` matches | Leads | Loop over list items |
| L10-13 | Quote LD-9031: `lead-status-select-quoted` → `lead-quote-input` 1800 → assert `lead-quote-total` (qty × price) → send | Lead details | Calculation inside a sheet |
| L10-14 | `lead-call-button` → `call-buyer-dialog` → Call → assert the phone dialer opened, then return to the app | Lead details | `getCurrentPackage()` / `activateApp` |
| L10-15 | Inbox: swipe `conversation-C-logistics` left → archive → UNDO via `toast-action` | Messages | Swipe + ephemeral toast |
| L10-16 | Long-press a conversation → `conversation-menu-delete` → confirm in `delete-conversation-dialog` | Messages | Long-press menus |
| L10-17 | Chat: send a message and wait for `chat-last-status` to read “Read”, then for the bot reply | Chat | Polling waits, no `sleep` |
| L10-18 | Compare: add 3 products (long-press → `quick-action-compare`), add a 4th and assert the oldest was replaced (count stays 3), open Compare and assert `compare-best-price` sits in the cheapest column | Catalog → Compare | Limits + table assertions |

Bonus: write a review with no stars (`write-review-stars-error`), then a valid one and assert it’s first in `reviews-list` under “Most recent”; send a “Get best price” enquiry and find the new lead (new ID from the toast) in Seller → Leads.

## Level 11 — Online features & live WebView

These need internet on the device. Live data changes, so **assert ranges, formats and states — not exact values**.

| # | Exercise | Where | Hints |
|---|---|---|---|
| L11-01 | Wait for `market-rate-USD`, parse `market-rate-USD-inr` and assert 50 < value < 150 | Live market rates | Parsing text → number |
| L11-02 | Assert `market-fetched-at` updates after pull-to-refresh (`market-refresh`) | Live market rates | Pull-to-refresh on live data |
| L11-03 | Tap each `market-chart-currency-*` chip and assert `market-chart` re-renders; tap a bar and read `market-chart-tooltip` | Live market rates | Dynamic charts |
| L11-04 | Converter: 1,00,000 INR → USD, swap, assert the reverse conversion is consistent (±1%) | `market-amount-input`, `market-swap-button` | Maths with tolerance |
| L11-05 | Turn on QA Lab → Simulate offline, open Live market → `market-error` → turn off → `market-error-retry` | Live market rates | Error/retry |
| L11-06 | Real airplane mode: `driver.toggleAirplaneMode(true)` → `offline-banner-text` says “No internet” → back online → toast “Back online” | Any screen | Device network control (Android emulator) |
| L11-07 | Checkout address: type pincode 500016 → wait for `address-pincode-result` → pick an office from `address-post-office-select` | Checkout | Live API + dropdown |
| L11-08 | Same with the network off → assert the offline fallback message | Checkout | Fallback paths |
| L11-09 | GSTIN checksum: `36AAPFS1234K1ZX` valid, `36AAPFS1234K1ZY` invalid (`bp-gstin-check`) | Business profile | Data-driven test |
| L11-10 | Web portal → bookmark “Practice login” → log in inside the WebView (`#username`, `#password`, `#flash`) | Web portal | Context switch on a live site |
| L11-11 | Bookmark “Dynamic loading” → click `#start button` → wait for `#finish` (≈5 s) inside the WebView | Web portal | Web-context waits |
| L11-12 | Type `not a real host.zz` in `browser-url-input` → assert search page; type `https://nope.invalid` → `browser-error` → `browser-retry-button` | Web portal | Native error state over WebView |

---

### Mapping your manual test cases to automation

| Manual habit | Automation equivalent |
|---|---|
| “Verify error message is displayed” | Locate `X-error` and assert exact text |
| “Verify button is disabled” | `isEnabled() === false` / `toBeDisabled()` |
| “Wait for the page to load” | Wait for a unique screen ID like `catalog-screen` + absence of `catalog-skeleton` |
| “Swipe left on the item” | W3C pointer actions / `locator.swipe` |
| “Accept the permission pop-up” | Locate the system dialog button by resource-id / label |
| “Check in landscape mode” | `setOrientation` + re-assert layout |
| “Kill and relaunch the app” | `terminateApp` + `activateApp` / `launchApp` |
| “Test on slow network” | QA Lab latency or the `slow@` user |
| “Turn off Wi‑Fi and check” | `toggleAirplaneMode(true)` / `toggleWiFi(false)` and assert `offline-banner` |
| “Verify the rate looks right” (live data) | Assert format and a sane range, never an exact number |
