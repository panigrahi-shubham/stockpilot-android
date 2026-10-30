# StockPilot B2B — Locator Reference

Every interactive element in the app has a stable `testID`. This file lists **all of them** (859 IDs and ID patterns across 47 screens and components), generated from the source code.

## How a React Native `testID` shows up to your tool

| Tool / platform | What the testID becomes | How to find it |
|---|---|---|
| **Android (UiAutomator2)** | `resource-id` attribute (exactly the testID, *no* package prefix) | `id=login-email-input` with capability `appium:disableIdLocatorAutocompletion: true` — or `android=new UiSelector().resourceId("login-email-input")` — or XPath `//*[@resource-id="login-email-input"]` |
| **iOS (XCUITest)** | `name` / accessibility **identifier** | `~login-email-input` (accessibility id) — or `-ios predicate string:name == "login-email-input"` |
| **Mobilewright (both)** | accessibility identifier / resource-id | `screen.getByTestId('login-email-input')` |
| **Appium Inspector / `mobilewright inspect`** | Shown as *resource-id* (Android) / *name* (iOS) | Click the element and copy |

> **Text changes, IDs don’t.** Switch the language to हिन्दी or తెలుగు (Settings → Language) and every label changes — locators built on `getByText()` / XPath `@text` will break, `testID` locators keep working. That is deliberate: it’s exercise L2-07.

## Naming convention

```
<screen>-<element>[-<qualifier>]          login-submit-button, cart-coupon-input
<screen>-<element>-<dynamicKey>           product-add-SKU-10001, order-card-SP-261018-4037
<parentTestID>-<part>                     product-qty-decrement, login-password-input-error
```

### Suffixes added automatically by shared widgets

| Widget | Suffixes you can use |
|---|---|
| Text input `X` | `X` (the input), `X-label`, `X-error`, `X-counter`, `X-toggle-visibility` (password eye) |
| Quantity stepper `X` | `X-decrement`, `X-value` (editable), `X-increment` |
| Radio group `X` | `X-<optionValue>` e.g. `checkout-payment-upi`, `settings-theme-dark` |
| Segmented tabs `X` | `X-<value>`, `X-<value>-count` e.g. `orders-tabs-delivered-count` |
| Dropdown `X` | `X` (field), `X-value`, `X-sheet`, `X-search`, `X-option-<value-slug>` e.g. `address-state-select-option-telangana` |
| Bottom sheet `X` | `X`, `X-title`, `X-close`, `X-backdrop` |
| Confirm dialog `X` | `X`, `X-title`, `X-message`, `X-confirm`, `X-cancel` |
| Date field `X` | `X`, `X-value`, `X-error`, `X-picker` (iOS inline calendar) |
| Button `X` | `X`, `X-spinner` (while loading) |
| Icon button `X` with count | `X-badge` e.g. `header-cart-button-badge` |
| Rating stars `X` (editable) | `X-1` … `X-5` |
| Empty / error state `X` | `X-title`, `X-action` / `X-message`, `X-retry` |

### IDs that change with state (great for assertions)

| Pattern | Meaning |
|---|---|
| `onboarding-next-button` → `onboarding-get-started-button` | Button ID changes on the last slide |
| `onboarding-dot-{i}-active`, `home-banner-dot-{i}-active` | Which carousel page is showing |
| `checkout-step-{0..3}-{done\|active\|todo}` | Checkout progress |
| `product-tier-{i}-active` | Which bulk-price tier your quantity falls in |
| `order-timeline-{status}-done` | Completed steps in the order timeline |
| `app-lock-key-{0-9}`, `app-lock-biometric`, `app-lock-delete` | PIN pad keys |
| `tab-home`, `tab-catalog`, `tab-scan`, `tab-orders`, `tab-account` | Bottom tab buttons |

### Things that deliberately have **no** testID

So you also practise other strategies:
- Native system UI: permission dialogs, the Android date-picker dialog, native `Alert`s (Log out, Cancel order, Leave checkout, Session expired), the share sheet, the notification shade.
  Android: `id=android:id/button1` (positive) / `button2` (negative), `id=com.android.permissioncontroller:id/permission_allow_button`. iOS: `driver.acceptAlert()` / `~Allow`.
- HTML inside the WebView screens — use the HTML `id`s listed at the bottom of this page.
- Some text-only labels (section headings, helper text) — use text / partial text.

---


## onboarding

<sub>Source: `src/app/onboarding.tsx`</sub>

| testID | Element |
|---|---|
| `onboarding-screen` | Container |
| `onboarding-pager` | List (scrollable) |
| `onboarding-slide-{i}` | Container |
| `onboarding-title-{i}` | Text |
| `onboarding-language-{id}` | Tappable |
| `onboarding-skip-button` | Tappable |
| `onboarding-dots` | Container |
| `onboarding-dot-{i}{iindexactive}` | Container |

## login

<sub>Source: `src/app/login.tsx`</sub>

| testID | Element |
|---|---|
| `login-screen` | Container |
| `login-scroll` | Scroll view |
| `login-logo` | Tappable |
| `login-language-button` | Tappable |
| `login-title` | Text |
| `login-session-expired` | Container |
| `login-error-banner` | Container |
| `login-error-message` | Text |
| `login-email-input` | Text input |
| `login-password-input` | Text input |
| `login-remember-checkbox` | Checkbox |
| `login-forgot-password-link` | Tappable |
| `login-submit-button` | Button |
| `login-biometric-button` | Button |
| `login-request-access-link` | Tappable |
| `login-terms-link` | Tappable |
| `login-app-version` | Text |
| `test-accounts-sheet` | Bottom sheet |
| `test-account-{kind}` | Tappable |
| `login-language-sheet` | Bottom sheet |
| `login-language-option-{id}` | Tappable |
| `request-access-sheet` | Bottom sheet |
| `request-access-submit` | Button |
| `request-access-business-input` | Text input |
| `request-access-phone-input` | Text input |

## otp

<sub>Source: `src/app/otp.tsx`</sub>

| testID | Element |
|---|---|
| `otp-screen` | Container |
| `otp-back-to-login` | Button |
| `otp-header` | AppHeader |
| `otp-title` | Text |
| `otp-subtitle` | Text |
| `otp-inputs` | Container |
| `otp-input-{i}` | Text input |
| `otp-error` | Text |
| `otp-resend-timer` | Text |
| `otp-resend-limit` | Text |
| `otp-resend-button` | Tappable |
| `otp-verify-button` | Button |
| `otp-sms-banner` | Tappable |
| `otp-sms-text` | Text |

## forgot-password

<sub>Source: `src/app/forgot-password.tsx`</sub>

| testID | Element |
|---|---|
| `forgot-password-screen` | Container |
| `forgot-password-header` | AppHeader |
| `forgot-password-success` | Container |
| `forgot-password-success-message` | Text |
| `forgot-password-back-button` | Button |
| `forgot-password-email-input` | Text input |
| `forgot-password-submit-button` | Button |

## Side drawer (hamburger menu)

<sub>Source: `src/app/(main)/_layout.tsx`</sub>

| testID | Element |
|---|---|
| `drawer` | Container |
| `drawer-user-name` | Text |
| `drawer-business-name` | Text |
| `drawer-user-role` | Text |
| `drawer-mode` | Text |
| `drawer-scroll` | Scroll view |
| `drawer-item-{id}` | Tappable |
| `drawer-item-{id}-badge` | Badge |
| `drawer-logout-button` | Tappable |

## home

<sub>Source: `src/app/(main)/(tabs)/home.tsx`</sub>

| testID | Element |
|---|---|
| `home-screen` | Screen |
| `home-header` | AppHeader |
| `home-scroll` | Scroll view |
| `home-refresh` | Pull-to-refresh |
| `home-search-bar` | Tappable |
| `home-kyc-card` | Card |
| `home-kyc-button` | Button |
| `home-credit-card` | Container |
| `home-available-credit` | Text |
| `home-credit-utilisation` | Progress bar |
| `home-credit-used` | Text |
| `home-credit-limit` | Text |
| `home-pay-dues-button` | Tappable |
| `home-seller-hub-card` | Tappable |
| `home-seller-hub-summary` | Text |
| `home-quick-actions-title` | SectionHeader |
| `home-quick-{id}` | Tappable |
| `home-kpi-scroll` | Scroll view |
| `home-kpi-{id}` | Container |
| `home-kpi-{id}-value` | Text |
| `home-deals-title` | Text |
| `home-deals-list` | List (scrollable) |
| `home-recent-orders-title` | SectionHeader |
| `home-recent-order-{id}` | Tappable |
| `home-last-updated` | Text |
| `promo-modal` | Container |
| `promo-modal-close` | Tappable |
| `promo-modal-title` | Text |
| `promo-modal-code` | Text |
| `promo-modal-cta` | Button |
| `home-banner-carousel` | List (scrollable) |
| `home-banner-{index}` | Tappable |
| `home-banner-dot-{i}{iidxactive}` | Container |
| `home-deals-timer` | Text |
| `pay-dues-sheet` | Bottom sheet |
| `pay-dues-submit` | Button |
| `pay-dues-outstanding` | Text |
| `pay-dues-amount-input` | Text input |
| `pay-dues-method` | Radio group |
| `pay-dues-upi-input` | Text input |

## catalog

<sub>Source: `src/app/(main)/(tabs)/catalog.tsx`</sub>

| testID | Element |
|---|---|
| `catalog-category-chips` | Scroll view |
| `catalog-category-all` | Chip |
| `catalog-category-{id}` | Chip |
| `catalog-results-count` | Text |
| `catalog-sort-button` | Tappable |
| `catalog-filter-button` | Tappable |
| `catalog-filter-count` | Container |
| `catalog-layout-toggle` | Tappable |
| `catalog-screen` | Screen |
| `catalog-header` | AppHeader |
| `catalog-search-input` | Text input |
| `catalog-search-clear` | Tappable |
| `catalog-recent-searches` | Container |
| `catalog-recent-clear` | Tappable |
| `catalog-recent-search-{i}` | Chip |
| `catalog-error` | Error state |
| `catalog-skeleton` | Container |
| `catalog-list` | List (scrollable) |
| `catalog-empty` | Empty state |
| `catalog-loading-more` | Container |
| `catalog-end-of-list` | Text |
| `catalog-compare-bar` | Container |
| `catalog-compare-count` | Text |
| `catalog-compare-clear` | Tappable |
| `catalog-compare-open` | Tappable |
| `catalog-sort-sheet` | Bottom sheet |
| `catalog-sort-option` | Radio group |
| `catalog-quick-actions` | Bottom sheet |
| `quick-action-favorite` | Row |
| `quick-action-compare` | Row |
| `quick-action-quick-list` | Row |
| `quick-action-share` | Row |
| `quick-action-details` | Row |
| `catalog-filter-sheet` | Bottom sheet |
| `filter-reset-button` | Button |
| `filter-apply-button` | Button |
| `filter-scroll` | Scroll view |
| `filter-price-value` | Text |
| `filter-price-slider` | Slider |
| `filter-in-stock-switch` | Switch |
| `filter-favorites-switch` | Switch |
| `filter-brand-{replaceaz09g}` | Checkbox |

## scan

<sub>Source: `src/app/(main)/(tabs)/scan.tsx`</sub>

| testID | Element |
|---|---|
| `scan-screen` | Screen |
| `scan-header` | AppHeader |
| `scan-scroll` | Scroll view |
| `scan-permission-card` | Card |
| `scan-permission-message` | Text |
| `scan-allow-camera-button` | Button |
| `scan-open-settings-button` | Button |
| `scan-camera-container` | Container |
| `scan-camera` | Camera |
| `scan-torch-toggle` | Tappable |
| `scan-result-card` | Card |
| `scan-result-name` | Text |
| `scan-result-price` | Text |
| `scan-result-dismiss` | Tappable |
| `scan-result-view-button` | Button |
| `scan-result-add-button` | Button |
| `scan-not-found` | Container |
| `scan-not-found-message` | Text |
| `scan-manual-input` | Text input |
| `scan-manual-submit-button` | Button |
| `scan-sample-{i}` | Tappable |
| `scan-recent` | Container |
| `scan-recent-{i}` | Tappable |

## orders

<sub>Source: `src/app/(main)/(tabs)/orders.tsx`</sub>

| testID | Element |
|---|---|
| `orders-screen` | Screen |
| `orders-header` | AppHeader |
| `orders-tabs` | Segmented tabs |
| `orders-search-input` | Text input |
| `orders-date-filter-button` | Tappable |
| `orders-date-chip` | Chip |
| `orders-list` | List (scrollable) |
| `orders-refresh` | Pull-to-refresh |
| `orders-empty` | Empty state |
| `orders-date-sheet` | Bottom sheet |
| `orders-date-clear` | Button |
| `orders-date-apply` | Button |
| `orders-date-preset-{id}` | Chip |
| `orders-date-from` | Date picker |
| `orders-date-to` | Date picker |

## account

<sub>Source: `src/app/(main)/(tabs)/account.tsx`</sub>

| testID | Element |
|---|---|
| `account-screen` | Screen |
| `account-header` | AppHeader |
| `account-scroll` | Scroll view |
| `account-profile-card` | Card |
| `account-user-name` | Text |
| `account-user-email` | Text |
| `account-role-badge` | Badge |
| `account-kyc-badge` | Badge |
| `account-edit-profile-button` | Tappable |
| `account-business` | InfoLine |
| `account-gstin` | InfoLine |
| `account-credit-limit` | InfoLine |
| `account-mode-card` | Card |
| `account-mode-badge` | Badge |
| `account-mode-switch` | Segmented tabs |
| `account-open-seller-hub` | Button |
| `account-row-business-profile` | Row |
| `account-row-kyc` | Row |
| `account-row-quick-list` | Row |
| `account-row-favourites` | Row |
| `account-row-reports` | Row |
| `account-row-approvals` | Row |
| `account-row-messages` | Row |
| `account-row-notifications` | Row |
| `account-row-market` | Row |
| `account-row-browser` | Row |
| `account-row-settings` | Row |
| `account-row-chat` | Row |
| `account-row-help` | Row |
| `account-row-call` | Row |
| `account-row-terms` | Row |
| `account-row-feedback` | Row |
| `account-row-qa-lab` | Row |
| `account-row-logout` | Row |
| `account-app-version` | Tappable |
| `{testID}-copy` | Tappable |

## product/[sku]

<sub>Source: `src/app/product/[sku].tsx`</sub>

| testID | Element |
|---|---|
| `product-screen` | Screen |
| `product-header` | AppHeader |
| `product-error` | Error state |
| `product-loading` | Container |
| `product-favorite-button` | Icon button |
| `product-compare-button` | Icon button |
| `product-share-button` | Icon button |
| `product-scroll` | Scroll view |
| `product-gallery` | List (scrollable) |
| `product-image-{item}` | Tappable |
| `product-image-counter` | Text |
| `product-tag-{t}` | Badge |
| `product-title` | Text |
| `product-rating` | Rating stars |
| `product-sku` | Text |
| `product-sku-copy` | Tappable |
| `product-price` | Text |
| `product-discount` | Text |
| `product-stock` | StockLabel |
| `product-tier-table` | Container |
| `product-tier-{i}{activeactive}` | Container |
| `product-variant-{id}` | Chip |
| `product-moq-hint` | Text |
| `product-qty` | Qty stepper |
| `product-qty-error` | Text |
| `product-enquiry-button` | Tappable |
| `product-pincode-input` | Text input |
| `product-pincode-check-button` | Button |
| `product-pincode-result` | Text |
| `product-description` | Text |
| `product-read-more` | Tappable |
| `product-highlight-{i}` | Container |
| `product-specs-toggle` | Tappable |
| `product-spec-{i}` | Container |
| `product-similar-list` | List (scrollable) |
| `product-bottom-bar` | Container |
| `product-total` | Text |
| `product-notify-button` | Button |
| `product-add-to-cart-button` | Button |
| `product-buy-now-button` | Button |

## Product page: ratings & reviews, “Get best price” enquiry

<sub>Source: `src/components/ProductExtras.tsx`</sub>

| testID | Element |
|---|---|
| `product-reviews` | Container |
| `product-rating-average` | Text |
| `product-rating-total` | Text |
| `product-rating-bar-{star}` | Container |
| `product-rating-count-{star}` | Text |
| `product-all-reviews-button` | Button |
| `product-write-review-button` | Button |
| `reviews-sheet` | Bottom sheet |
| `reviews-sort` | Segmented tabs |
| `reviews-list` | Scroll view |
| `review-{id}` | Container |
| `review-helpful-{id}` | Tappable |
| `write-review-sheet` | Bottom sheet |
| `write-review-submit` | Button |
| `write-review-stars` | Rating stars |
| `write-review-stars-error` | Text |
| `write-review-title` | Text input |
| `write-review-body` | Text input |
| `enquiry-sheet` | Bottom sheet |
| `enquiry-submit-button` | Button |
| `enquiry-product` | Text |
| `enquiry-qty-input` | Text input |
| `enquiry-requirement-input` | Text input |
| `enquiry-city-input` | Text input |
| `enquiry-phone-input` | Text input |
| `enquiry-whatsapp-checkbox` | Checkbox |

## image-viewer

<sub>Source: `src/app/image-viewer.tsx`</sub>

| testID | Element |
|---|---|
| `image-viewer-screen` | Container |
| `image-viewer-close` | Tappable |
| `image-viewer-zoom-level` | Text |
| `image-viewer-canvas` | Container |
| `image-viewer-prev` | Tappable |
| `image-viewer-counter` | Text |
| `image-viewer-next` | Tappable |
| `image-viewer-reset` | Tappable |

## Compare products

<sub>Source: `src/app/compare.tsx`</sub>

| testID | Element |
|---|---|
| `compare-screen` | Screen |
| `compare-header` | AppHeader |
| `compare-empty` | Empty state |
| `compare-clear-button` | Tappable |
| `compare-scroll` | Scroll view |
| `compare-table-scroll` | Scroll view |
| `compare-table` | Container |
| `compare-column-{sku}` | Container |
| `compare-name-{sku}` | Text |
| `compare-remove-{sku}` | Tappable |
| `compare-row-{id}` | Container |
| `compare-cell-{id}-{sku}` | Text |
| `compare-best-{id}` | Icon |
| `compare-add-{sku}` | Button |
| `compare-hint` | Text |

## cart

<sub>Source: `src/app/cart.tsx`</sub>

| testID | Element |
|---|---|
| `cart-screen` | Screen |
| `cart-header` | AppHeader |
| `cart-empty` | Empty state |
| `cart-clear-button` | Tappable |
| `cart-scroll` | Scroll view |
| `cart-free-delivery-progress` | Container |
| `cart-free-delivery-unlocked` | Container |
| `cart-offers-toggle` | Tappable |
| `cart-coupon-applied` | Container |
| `cart-coupon-code` | Text |
| `cart-coupon-status` | Text |
| `cart-coupon-remove` | Tappable |
| `cart-coupon-input` | Text input |
| `cart-coupon-apply-button` | Button |
| `cart-offers-list` | Container |
| `cart-offer-apply-{k}` | Tappable |
| `cart-summary` | Card |
| `cart-subtotal` | Label/value |
| `cart-coupon-discount` | Label/value |
| `cart-gst` | Label/value |
| `cart-delivery` | Label/value |
| `cart-total` | Label/value |
| `cart-savings` | Text |
| `cart-min-order-warning` | Notice |
| `cart-kyc-warning` | Notice |
| `cart-credit-warning` | Notice |
| `cart-approval-notice` | Notice |
| `cart-bottom-total` | Text |
| `cart-checkout-button` | Button |
| `clear-cart-dialog` | Dialog |
| `{testID}-text` | Text |
| `cart-item-delete-{id}` | Tappable |
| `cart-item-save-{id}` | Tappable |
| `cart-item-{id}` | Container |
| `cart-item-name-{id}` | Text |
| `cart-item-variant-{id}` | Text |
| `cart-item-qty-{id}` | Qty stepper |
| `cart-item-line-total-{id}` | Text |

## checkout

<sub>Source: `src/app/checkout.tsx`</sub>

| testID | Element |
|---|---|
| `checkout-screen` | Screen |
| `checkout-header` | AppHeader |
| `checkout-stepper` | Container |
| `checkout-step-{i}-{status}` | Container |
| `checkout-scroll` | Scroll view |
| `checkout-address` | Radio group |
| `checkout-address-error` | Text |
| `checkout-add-address-button` | Button |
| `checkout-delivery-date` | Date picker |
| `checkout-slot` | Radio group |
| `checkout-slot-error` | Text |
| `checkout-instructions-input` | Text input |
| `checkout-unload-checkbox` | Checkbox |
| `checkout-payment` | Radio group |
| `checkout-payment-error` | Text |
| `checkout-upi-input` | Text input |
| `checkout-neft-details` | Card |
| `checkout-neft-copy-{replaceazg}` | Tappable |
| `checkout-po-input` | Text input |
| `checkout-po-file` | Container |
| `checkout-po-file-name` | Text |
| `checkout-po-file-remove` | Tappable |
| `checkout-po-upload-button` | Button |
| `checkout-review-address` | ReviewLine |
| `checkout-review-delivery` | ReviewLine |
| `checkout-review-payment` | ReviewLine |
| `checkout-review-items-toggle` | Tappable |
| `checkout-review-item-{sku}` | Container |
| `checkout-subtotal` | Label/value |
| `checkout-discount` | Label/value |
| `checkout-gst` | Label/value |
| `checkout-delivery` | Label/value |
| `checkout-total` | Label/value |
| `checkout-approval-notice` | Container |
| `checkout-terms-checkbox` | Checkbox |
| `checkout-terms-link` | Text |
| `checkout-terms-error` | Text |
| `checkout-back-button` | Button |
| `checkout-continue-button` | Button |
| `checkout-place-order-button` | Button |
| `{testID}-edit` | Tappable |
| `upi-wait-modal` | Container |
| `upi-wait-timer` | Text |
| `upi-confirm-button` | Button |
| `upi-cancel-button` | Button |
| `address-form` | Card |
| `address-use-location-button` | Button |
| `address-label-input` | Text input |
| `address-name-input` | Text input |
| `address-phone-input` | Text input |
| `address-line1-input` | Text input |
| `address-pincode-input` | Text input |
| `address-city-input` | Text input |
| `address-pincode-lookup` | Container |
| `address-pincode-result` | Text |
| `address-post-office-select` | Dropdown |
| `address-state-select` | Dropdown |
| `address-cancel-button` | Button |
| `address-save-button` | Button |

## order-success

<sub>Source: `src/app/order-success.tsx`</sub>

| testID | Element |
|---|---|
| `order-success-screen` | Container |
| `order-success-title` | Text |
| `order-success-message` | Text |
| `order-success-id` | Text |
| `order-success-copy` | Tappable |
| `order-success-amount` | Text |
| `order-success-items` | Text |
| `order-success-track-button` | Button |
| `order-success-continue-button` | Button |
| `rate-app-dialog` | Container |
| `rate-app-stars` | Rating stars |
| `rate-app-submit` | Button |
| `rate-app-later` | Tappable |

## order/[id]

<sub>Source: `src/app/order/[id].tsx`</sub>

| testID | Element |
|---|---|
| `order-detail-screen` | Screen |
| `order-detail-header` | AppHeader |
| `order-not-found` | Empty state |
| `order-detail-copy-id` | Tappable |
| `order-detail-scroll` | Scroll view |
| `order-detail-status` | Badge |
| `order-detail-cancel-reason` | Text |
| `order-detail-eta` | Text |
| `order-detail-tracking-id` | Text |
| `order-approval-card` | Card |
| `order-reject-button` | Button |
| `order-approve-button` | Button |
| `order-item-{sku}` | Tappable |
| `order-detail-subtotal` | Label/value |
| `order-detail-discount` | Label/value |
| `order-detail-gst` | Label/value |
| `order-detail-delivery` | Label/value |
| `order-detail-total` | Label/value |
| `order-detail-payment-method` | Text |
| `order-detail-address` | Text |
| `order-rate-stars` | Rating stars |
| `order-invoice-button` | Button |
| `order-reorder-button` | Button |
| `order-dispute-button` | Button |
| `order-cancel-button` | Button |
| `order-help-button` | Button |
| `cancel-order-sheet` | Bottom sheet |
| `cancel-order-confirm` | Button |
| `cancel-reason` | Radio group |
| `cancel-other-input` | Text input |
| `reject-order-sheet` | Bottom sheet |
| `reject-order-confirm` | Button |
| `reject-note-input` | Text input |
| `order-timeline` | Container |
| `order-timeline-{s}{donedone}` | Container |
| `dispute-sheet` | Bottom sheet |
| `dispute-submit` | Button |
| `dispute-type-select` | Dropdown |
| `dispute-description-input` | Text input |
| `dispute-photo-attached` | Container |
| `dispute-photo-name` | Text |
| `dispute-photo-remove` | Tappable |
| `dispute-photo-camera` | Button |
| `dispute-photo-gallery` | Button |
| `dispute-photo-error` | Text |

## notifications

<sub>Source: `src/app/notifications.tsx`</sub>

| testID | Element |
|---|---|
| `notifications-screen` | Screen |
| `notifications-header` | AppHeader |
| `notifications-mark-all-read` | Tappable |
| `notifications-filter-{f}` | Chip |
| `notifications-list` | List (scrollable) |
| `notifications-refresh` | Pull-to-refresh |
| `notifications-section-{toLowerCase}` | Text |
| `notification-delete-{id}` | Tappable |
| `notification-{id}` | Tappable |
| `notification-title-{id}` | Text |
| `notification-unread-{id}` | Container |
| `notifications-empty` | Empty state |

## Messages inbox

<sub>Source: `src/app/messages.tsx`</sub>

| testID | Element |
|---|---|
| `messages-screen` | Screen |
| `messages-header` | AppHeader |
| `messages-search-input` | Text input |
| `messages-filter-{f}` | Chip |
| `messages-list` | List (scrollable) |
| `conversation-archive-{id}` | Tappable |
| `conversation-star-{id}` | Tappable |
| `conversation-{id}` | Tappable |
| `conversation-name-{id}` | Text |
| `conversation-starred-{id}` | Icon |
| `conversation-preview-{id}` | Text |
| `conversation-unread-{id}` | Container |
| `messages-empty` | Empty state |
| `messages-archived-row` | Tappable |
| `conversation-menu` | Bottom sheet |
| `conversation-menu-read` | Row |
| `conversation-menu-star` | Row |
| `conversation-menu-archive` | Row |
| `conversation-menu-delete` | Row |
| `delete-conversation-dialog` | Dialog |

## Chat (one conversation)

<sub>Source: `src/app/chat.tsx`</sub>

| testID | Element |
|---|---|
| `chat-screen` | Screen |
| `chat-header` | AppHeader |
| `chat-not-found` | Empty state |
| `chat-star-button` | Icon button |
| `chat-messages` | List (scrollable) |
| `chat-message-{index}` | Container |
| `chat-attachment-{index}` | Container |
| `chat-message-text-{index}` | Text |
| `chat-last-status` | Text |
| `chat-typing-indicator` | Container |
| `chat-quick-reply-{i}` | Chip |
| `chat-attach-button` | Tappable |
| `chat-input` | Text input |
| `chat-send-button` | Tappable |

## Seller Hub (dashboard)

<sub>Source: `src/app/seller/index.tsx`</sub>

| testID | Element |
|---|---|
| `seller-hub-screen` | Screen |
| `seller-hub-header` | AppHeader |
| `seller-hub-scroll` | Scroll view |
| `seller-mode-off-card` | Card |
| `seller-switch-to-seller-button` | Button |
| `seller-total-views` | Text |
| `seller-kpi-{id}` | Tappable |
| `seller-kpi-{id}-value` | Text |
| `seller-add-product-button` | Button |
| `seller-my-products-button` | Button |
| `seller-recent-leads-title` | SectionHeader |
| `seller-recent-lead-{id}` | Tappable |
| `seller-switch-to-buyer-button` | Button |

## Seller · My products

<sub>Source: `src/app/seller/products.tsx`</sub>

| testID | Element |
|---|---|
| `my-products-screen` | Screen |
| `my-products-header` | AppHeader |
| `my-products-tabs` | Segmented tabs |
| `my-products-search-input` | Text input |
| `my-products-list` | List (scrollable) |
| `listing-card-{id}` | Tappable |
| `listing-thumb-{id}` | Image |
| `listing-title-{id}` | Text |
| `listing-status-{id}` | Badge |
| `listing-toggle-{id}` | Switch |
| `my-products-empty` | Empty state |
| `my-products-add-button` | Tappable |

## Seller · Add / edit product

<sub>Source: `src/app/seller/product-form.tsx`</sub>

| testID | Element |
|---|---|
| `listing-form-screen` | Screen |
| `listing-form-header` | AppHeader |
| `listing-delete-button` | Tappable |
| `listing-form-scroll` | Scroll view |
| `listing-error-summary` | Container |
| `listing-photo-count` | Text |
| `listing-photos` | Scroll view |
| `listing-photo-{i}` | Tappable |
| `listing-photo-cover-{i}` | Container |
| `listing-photo-remove-{i}` | Tappable |
| `listing-photo-uploading` | Container |
| `listing-photo-progress` | Progress bar |
| `listing-add-photo-button` | Tappable |
| `listing-photo-limit` | Text |
| `listing-photos-error` | Text |
| `listing-title-input` | Text input |
| `listing-category-select` | Dropdown |
| `listing-price-input` | Text input |
| `listing-mrp-input` | Text input |
| `listing-discount-preview` | Text |
| `listing-moq-input` | Text input |
| `listing-unit-select` | Dropdown |
| `listing-description-input` | Text input |
| `listing-spec-count` | Text |
| `listing-spec-row-{i}` | Container |
| `listing-spec-key-{i}` | Text input |
| `listing-spec-value-{i}` | Text input |
| `listing-spec-remove-{i}` | Tappable |
| `listing-spec-error-{i}` | Text |
| `listing-add-spec-button` | Button |
| `listing-active-switch` | Switch |
| `listing-save-draft-button` | Button |
| `listing-publish-button` | Button |
| `listing-photo-source-sheet` | Bottom sheet |
| `listing-photo-source-camera` | Button |
| `listing-photo-source-gallery` | Button |
| `listing-discard-dialog` | Dialog |

## Seller · Leads list

<sub>Source: `src/app/seller/leads.tsx`</sub>

| testID | Element |
|---|---|
| `leads-screen` | Screen |
| `leads-header` | AppHeader |
| `leads-filter-{f}` | Chip |
| `leads-list` | List (scrollable) |
| `lead-card-{id}` | Tappable |
| `lead-new-dot-{id}` | Container |
| `lead-status-{id}` | Badge |
| `lead-requirement-{id}` | Text |
| `leads-empty` | Empty state |

## Seller · Lead details

<sub>Source: `src/app/seller/lead/[id].tsx`</sub>

| testID | Element |
|---|---|
| `lead-detail-screen` | Screen |
| `lead-detail-header` | AppHeader |
| `lead-not-found` | Empty state |
| `lead-detail-scroll` | Scroll view |
| `lead-detail-status` | Badge |
| `lead-detail-buyer` | Label/value |
| `lead-detail-city` | Label/value |
| `lead-detail-phone` | Label/value |
| `lead-detail-product` | Text |
| `lead-detail-requirement` | Text |
| `lead-detail-quote` | Text |
| `lead-status-select` | Radio group |
| `lead-reply-chat-button` | Button |
| `lead-call-button` | Button |
| `lead-whatsapp-button` | Button |
| `call-buyer-dialog` | Dialog |
| `lead-quote-sheet` | Bottom sheet |
| `lead-quote-send-button` | Button |
| `lead-quote-input` | Text input |
| `lead-quote-total` | Text |

## Live market (ONLINE)

<sub>Source: `src/app/market.tsx`</sub>

| testID | Element |
|---|---|
| `market-screen` | Screen |
| `market-header` | AppHeader |
| `market-scroll` | Scroll view |
| `market-refresh` | Pull-to-refresh |
| `market-connection` | Container |
| `market-connection-text` | Text |
| `market-fetched-at` | Text |
| `market-error` | Error state |
| `market-rates-date` | Text |
| `market-rate-{code}` | Tappable |
| `market-rate-{code}-inr` | Text |
| `market-stale-warning` | Text |
| `market-chart-currency-{code}` | Chip |
| `market-chart-error` | Error state |
| `market-chart-summary` | Text |
| `market-chart-change` | Text |
| `market-chart` | Container |
| `market-chart-bar-{i}` | Tappable |
| `market-chart-tooltip` | Text |
| `market-amount-input` | Text input |
| `market-swap-button` | Tappable |
| `market-target-{code}` | Chip |
| `market-converted-value` | Text |
| `market-source-link` | Tappable |

## Web portal — in-app browser (ONLINE WebView)

<sub>Source: `src/app/browser.tsx`</sub>

| testID | Element |
|---|---|
| `browser-screen` | Screen |
| `browser-header` | AppHeader |
| `browser-lock-icon` | Icon |
| `browser-url-input` | Text input |
| `browser-stop-button` | Tappable |
| `browser-progress` | Progress bar |
| `browser-error` | Container |
| `browser-error-message` | Text |
| `browser-retry-button` | Button |
| `browser-webview` | WebView |
| `browser-toolbar` | Container |
| `browser-back-button` | Toolbar button |
| `browser-forward-button` | Toolbar button |
| `browser-reload-button` | Toolbar button |
| `browser-home-button` | Toolbar button |
| `browser-bookmarks-button` | Toolbar button |
| `browser-open-external` | Toolbar button |
| `browser-bookmarks-sheet` | Bottom sheet |
| `browser-bookmark-{id}` | Tappable |

## reports

<sub>Source: `src/app/reports.tsx`</sub>

| testID | Element |
|---|---|
| `reports-screen` | Screen |
| `reports-header` | AppHeader |
| `reports-export-button` | Tappable |
| `reports-scroll` | Scroll view |
| `reports-range` | Segmented tabs |
| `reports-kpi-{id}` | Container |
| `reports-kpi-{id}-value` | Text |
| `reports-tooltip` | Container |
| `reports-tooltip-text` | Text |
| `reports-chart` | Container |
| `reports-bar-{i}` | Tappable |
| `reports-category-{id}` | Container |
| `reports-rotate-hint` | Container |
| `reports-table-scroll` | Scroll view |
| `reports-table` | Container |
| `reports-row-{i}` | Container |
| `reports-cell-{i}-{replacesg}` | Text |

## approvals

<sub>Source: `src/app/approvals.tsx`</sub>

| testID | Element |
|---|---|
| `approvals-screen` | Screen |
| `approvals-header` | AppHeader |
| `approvals-no-access` | Empty state |
| `approvals-list` | List (scrollable) |
| `approvals-select-all` | Checkbox |
| `approval-card-{id}` | Container |
| `approval-select-{id}` | Checkbox |
| `approval-amount-{id}` | Text |
| `approval-review-{id}` | Button |
| `approvals-empty` | Empty state |
| `approvals-approve-selected` | Button |
| `approvals-confirm-dialog` | Dialog |

## quick-list

<sub>Source: `src/app/quick-list.tsx`</sub>

| testID | Element |
|---|---|
| `quick-list-screen` | Screen |
| `quick-list-header` | AppHeader |
| `quick-list-empty` | Empty state |
| `quick-list-scroll` | Scroll view |
| `quick-list-items` | Container |
| `quick-list-total` | Text |
| `quick-list-add-all-button` | Button |
| `quick-list-row-{sku}` | Container |
| `quick-list-handle-{sku}` | Container |
| `quick-list-name-{sku}` | Text |
| `quick-list-position-{sku}` | Text |
| `quick-list-qty-{sku}` | Qty stepper |
| `quick-list-remove-{sku}` | Tappable |

## kyc

<sub>Source: `src/app/kyc.tsx`</sub>

| testID | Element |
|---|---|
| `kyc-screen` | Screen |
| `kyc-header` | AppHeader |
| `kyc-scroll` | Scroll view |
| `kyc-overall-status` | Text |
| `kyc-doc-{id}` | Card |
| `kyc-doc-{id}-status` | Badge |
| `kyc-upload-progress-{id}` | Progress bar |
| `kyc-upload-percent-{id}` | Text |
| `kyc-upload-{id}` | Button |
| `kyc-doc-{id}-error` | Text |
| `kyc-submit-button` | Button |

## business-profile

<sub>Source: `src/app/business-profile.tsx`</sub>

| testID | Element |
|---|---|
| `business-profile-screen` | Screen |
| `business-profile-header` | AppHeader |
| `business-profile-scroll` | Scroll view |
| `business-profile-error-summary` | Container |
| `bp-business-input` | Text input |
| `bp-owner-input` | Text input |
| `bp-phone-input` | Text input |
| `bp-email-input` | Text input |
| `bp-gstin-input` | Text input |
| `bp-gstin-check` | Text |
| `bp-gst-portal-button` | Tappable |
| `bp-pan-input` | Text input |
| `bp-type-select` | Dropdown |
| `bp-size` | Radio group |
| `bp-years` | Qty stepper |
| `bp-offday-{toLowerCase}` | Chip |
| `bp-offday-error` | Text |
| `bp-location-value` | Text |
| `bp-location-error` | Text |
| `bp-location-button` | Button |
| `bp-save-button` | Button |
| `discard-changes-dialog` | Dialog |

## settings

<sub>Source: `src/app/settings.tsx`</sub>

| testID | Element |
|---|---|
| `settings-screen` | Screen |
| `settings-header` | AppHeader |
| `settings-scroll` | Scroll view |
| `settings-theme` | Radio group |
| `settings-language-select` | Dropdown |
| `settings-notif-orders` | Switch |
| `settings-notif-offers` | Switch |
| `settings-notif-payments` | Switch |
| `settings-test-notification` | Button |
| `settings-biometric-switch` | Switch |
| `settings-app-lock-switch` | Switch |
| `settings-change-password` | Row |
| `settings-clear-cache` | Row |
| `settings-download-data` | Row |
| `settings-compact-catalog` | Switch |
| `settings-about-version` | Row |
| `settings-about-licences` | Row |
| `clear-cache-dialog` | Dialog |
| `settings-section-{replaceazg}` | Text |
| `change-password-sheet` | Bottom sheet |
| `change-password-submit` | Button |
| `change-password-current` | Text input |
| `change-password-new` | Text input |
| `password-strength-bar` | Progress bar |
| `password-strength-label` | Text |
| `change-password-confirm` | Text input |

## help

<sub>Source: `src/app/help.tsx`</sub>

| testID | Element |
|---|---|
| `help-screen` | Screen |
| `help-header` | AppHeader |
| `help-scroll` | Scroll view |
| `help-search-input` | Text input |
| `faq-list` | Container |
| `faq-item-{i}` | Container |
| `faq-question-{i}` | Tappable |
| `faq-answer-{i}` | Text |
| `faq-empty` | Empty state |
| `help-chat` | Row |
| `help-call` | Row |
| `help-email` | Row |
| `help-whatsapp` | Row |
| `help-center` | Row |

## webview

<sub>Source: `src/app/webview.tsx`</sub>

| testID | Element |
|---|---|
| `webview-screen` | Screen |
| `webview-header` | AppHeader |
| `webview` | WebView |
| `webview-loading` | Container |
| `webview-scroll-hint` | Text |
| `webview-accept-button` | Button |

## qa-lab

<sub>Source: `src/app/qa-lab.tsx`</sub>

| testID | Element |
|---|---|
| `qa-lab-screen` | Screen |
| `qa-lab-header` | AppHeader |
| `qa-lab-scroll` | Scroll view |
| `qa-latency-value` | Text |
| `qa-latency-slider` | Slider |
| `qa-fail-rate` | Segmented tabs |
| `qa-offline-switch` | Switch |
| `qa-promo-mode` | Segmented tabs |
| `qa-notify-button` | Button |
| `qa-animations-switch` | Switch |
| `qa-skip-otp-switch` | Switch |
| `qa-expire-session-button` | Button |
| `qa-deeplink-{i}` | Tappable |
| `qa-deeplink-copy-{i}` | Tappable |
| `qa-account-{kind}` | Container |
| `qa-device-info` | Text |
| `qa-crash-button` | Button |
| `qa-reset-button` | Button |
| `qa-reset-dialog` | Dialog |

## promo/[code]

<sub>Source: `src/app/promo/[code].tsx`</sub>

| testID | Element |
|---|---|
| `promo-screen` | Screen |
| `promo-header` | AppHeader |
| `promo-invalid` | Empty state |
| `promo-code` | Text |
| `promo-description` | Text |
| `promo-applied-banner` | Container |
| `promo-shop-button` | Button |
| `promo-cart-button` | Button |

## +not-found

<sub>Source: `src/app/+not-found.tsx`</sub>

| testID | Element |
|---|---|
| `not-found-screen` | Screen |
| `not-found-header` | AppHeader |
| `not-found` | Empty state |

## Crash screen (root error boundary)

<sub>Source: `src/app/_layout.tsx`</sub>

| testID | Element |
|---|---|
| `crash-screen` | Container |
| `crash-title` | Text |
| `crash-message` | Text |
| `crash-restart-button` | Tappable |

## Shared header & offline banner (every screen)

<sub>Source: `src/components/chrome.tsx`</sub>

| testID | Element |
|---|---|
| `header-menu-button` | Icon button |
| `header-back-button` | Icon button |
| `header-close-button` | Icon button |
| `header-title` | Text |
| `header-subtitle` | Text |
| `header-messages-button` | Icon button |
| `header-notifications-button` | Icon button |
| `header-cart-button` | Icon button |
| `offline-banner` | Container |
| `offline-banner-text` | Text |
| `offline-banner-retry` | Tappable |

## Product card (catalog, deals, similar)

<sub>Source: `src/components/ProductCard.tsx`</sub>

| testID | Element |
|---|---|
| `product-notify-{sku}` | Tappable |
| `product-qty-{sku}` | Qty stepper |
| `product-add-{sku}` | Tappable |
| `product-price-{sku}` | Text |
| `product-card-{sku}` | Container |
| `product-card-{sku}-open` | Tappable |
| `product-name-{sku}` | Text |
| `product-stock-{sku}` | StockLabel |
| `product-fav-icon-{sku}` | Icon |

## Order card (orders list)

<sub>Source: `src/components/OrderCard.tsx`</sub>

| testID | Element |
|---|---|
| `order-card-{id}` | Tappable |
| `order-id-{id}` | Text |
| `order-status-{id}` | Badge |
| `order-total-{id}` | Text |

## App lock (PIN pad)

<sub>Source: `src/components/AppLock.tsx`</sub>

| testID | Element |
|---|---|
| `app-lock-screen` | Container |
| `app-lock-dots` | Container |
| `app-lock-error` | Text |
| `app-lock-signout` | Tappable |

## Toast, sheets, dialogs, dropdowns, loader

<sub>Source: `src/components/overlays.tsx`</sub>

| testID | Element |
|---|---|
| `toast` | Container |
| `toast-message` | Text |
| `toast-action` | Tappable |
| `{testID}-backdrop` | Tappable |
| `{testID}-title` | Text |
| `{testID}-close` | Tappable |
| `{testID}-message` | Text |
| `{testID}-cancel` | Button |
| `{testID}-confirm` | Button |
| `{testID}-value` | Text |
| `{testID}-error` | Text |
| `{testID}-sheet` | Bottom sheet |
| `{testID}-search` | Text input |
| `{testID}-option-{toLowerCase}` | Tappable |
| `loading-overlay` | Container |
| `loading-overlay-message` | Text |

## Reusable widgets — suffix patterns

<sub>Source: `src/components/ui.tsx`</sub>

| testID | Element |
|---|---|
| `{testID}-label` | Text |
| `{testID}-toggle-visibility` | Tappable |
| `{testID}-error` | Text |
| `{testID}-counter` | Text |
| `{testID}-{value}` | Tappable |
| `{testID}-remove` | Tappable |
| `{testID}-{value}-count` | Text |
| `{testID}-decrement` | Tappable |
| `{testID}-value` | Text input |
| `{testID}-increment` | Tappable |
| `{testID}-title` | Text |
| `{testID}-action` | Button |
| `{testID}-message` | Text |
| `{testID}-retry` | Button |

## Date picker field — suffix patterns

<sub>Source: `src/components/DateField.tsx`</sub>

| testID | Element |
|---|---|
| `{testID}-value` | Text |
| `{testID}-error` | Text |
| `{testID}-picker` | DateTimePicker |

---

## WebView (hybrid) HTML ids

Open with `/webview?doc=terms|help|feedback` (Account → Terms of Trade / Send feedback, Help → Help centre).
Context name on Android: `WEBVIEW_com.stockpilot.b2b`.

| Page | HTML ids |
|---|---|
| Terms | `#terms-title`, `#terms-updated`, `#terms-section-1` … `#terms-section-12`, `#terms-end` (scrolling to it enables the native `webview-accept-button`) |
| Help centre | `#help-title`, `#help-search`, `#help-articles`, `#article-ordering`, `#article-credit`, `#article-returns`, `#article-gst`, `#help-no-results`, `#help-chat-button` |
| Feedback | `#feedback-form`, `#fb-name`, `#fb-rating` (select), `#fb-area` (select), `#fb-comments`, `#fb-contact` (checkbox), `#fb-error`, `#fb-submit` |

### Web portal start page (`/browser`, local HTML) and live pages

| Page | HTML ids / selectors |
|---|---|
| Start page | `#portal-title`, `#portal-search`, `#portal-go`, `#portal-link-gst`, `#portal-link-pincode`, `#portal-link-login`, `#portal-link-dynamic`, `#portal-link-saucedemo`, `#portal-link-appium` |
| the-internet.herokuapp.com/login (live) | `#username`, `#password`, `button[type="submit"]`, `#flash` (tomsmith / SuperSecretPassword!) |
| the-internet …/dynamic_loading/2 (live) | `#start button`, `#loading`, `#finish` |
| saucedemo.com (live) | `#user-name`, `#password`, `#login-button`, `[data-test="inventory-item"]` |

> Live third-party pages can change without notice — that’s part of the realism.
