#!/usr/bin/env bash
set -euo pipefail

# This script runs from tests/mobilewright on an already booted emulator.
: "${APP_PATH:?APP_PATH must point to an existing StockPilot APK}"
mkdir -p test-results
trap 'adb logcat -d -v threadtime > test-results/logcat.txt 2>&1 || true' EXIT

adb logcat -c
adb install -r "$APP_PATH"
adb shell pm path com.stockpilot.b2b
npx mobilewright install

# The app is installed once above; the tests reset its data before each flow.
unset APP_PATH
npm test -- --reporter list,html --workers 1 --retries 0 --shard "${MOBILEWRIGHT_SHARD:-1/1}"
