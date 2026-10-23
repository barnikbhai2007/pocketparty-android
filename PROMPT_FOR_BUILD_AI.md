# Pocket Party 5.0 build handoff

This is an offline browser runtime in an Android WebView shell. Read README.md first.

1. Preserve core-source.js and the classic ten unless explicitly asked otherwise.
2. Edit strategy-source.js for the thirty rebuilt games. It overrides their old expansion/studio engines intentionally.
3. Run python3 build-expansion.py before testing or Android compilation.
4. Run npm test, npm run test:matrix and npm run test:ui with CHROMIUM_PATH configured.
5. Use JDK 17 + SDK 35 for ./gradlew :app:assembleDebug. Do not describe an unbuilt ZIP as an APK.
6. See tests/STRATEGY_*.json for actual evidence and its scope. Legacy reports do not certify this build.
7. The lightweight delivery omits unchanged asset-source masters; runtime assets are complete. Use the original 4.0 ZIP if regenerating artwork or music.
