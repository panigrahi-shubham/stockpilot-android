#!/usr/bin/env bash
set -euo pipefail

# This script runs from tests/mobilewright on an already booted emulator.
: "${APP_PATH:?APP_PATH must point to an existing StockPilot APK}"
mkdir -p test-results
trap 'adb logcat -d -v threadtime > test-results/logcat.txt 2>&1 || true; adb shell dumpsys activity activities > test-results/activity.txt 2>&1 || true' EXIT

adb logcat -c
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0
adb shell settings put secure show_ime_with_hard_keyboard 0
adb install -r "$APP_PATH"
adb shell pm path com.stockpilot.b2b
adb shell dumpsys package com.stockpilot.b2b > test-results/package.txt
if grep -q 'DEBUGGABLE' test-results/package.txt; then
  echo '::error::Release validation requires a non-debuggable APK.'
  exit 1
fi
npx mobilewright install
node scripts/check-device.mjs

# The app is installed once above; the tests reset its data before each flow.
unset APP_PATH
suite_args=()
case "${TEST_SUITE:-regression}" in
  smoke) suite_args+=(--grep '@smoke') ;;
  regression) ;;
  *) echo '::error::Unknown test suite.'; exit 1 ;;
esac
npm test -- --workers 1 --retries 0 --shard "${MOBILEWRIGHT_SHARD:-1/1}" "${suite_args[@]}"
