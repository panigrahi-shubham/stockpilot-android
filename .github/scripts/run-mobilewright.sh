#!/usr/bin/env bash
set -euo pipefail

# This script runs from tests/mobilewright on an already booted emulator.
: "${APP_PATH:?APP_PATH must point to an existing StockPilot APK}"
mkdir -p device-diagnostics
trap 'adb logcat -d -v threadtime > device-diagnostics/logcat.txt 2>&1 || true; adb shell dumpsys activity activities > device-diagnostics/activity.txt 2>&1 || true' EXIT

adb logcat -c
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
adb shell wm size 720x1280
adb shell wm density 320
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0
adb shell settings put secure show_ime_with_hard_keyboard 0
adb install -r "$APP_PATH"
export STOCKPILOT_ADB_SERIAL="$(adb get-serialno)"
adb shell pm path com.stockpilot.b2b
adb shell dumpsys package com.stockpilot.b2b > device-diagnostics/package.txt
if grep -q 'DEBUGGABLE' device-diagnostics/package.txt; then
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
