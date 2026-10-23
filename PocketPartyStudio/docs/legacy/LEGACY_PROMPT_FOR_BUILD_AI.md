# Build this existing Pocket Party Deluxe Android project

I am attaching PocketPartyDeluxe-2.0-source-assets.zip. Extract it. This is an existing, original 10-game local multiplayer project, not a request for a fresh scaffold. Read README.md and TEST_REPORT.md first.

## Preserve the redesign
Keep the illustrated game menu, textures, detailed sprite assets, music and FULL-SCREEN GAME-SPECIFIC CONTROLS. Do not restore the old generic P1/P2 controller bars. Hockey must drag the visible striker directly; racing taps its own track; Sumo uses circular corner hold zones; board games take board input. Two players face opposite ends of the same device. Keep 1–4 human support and solo bots. Native Android orientation is intentionally portrait-first.

## Compile, don't just explain
1. Use JDK 17, Gradle wrapper 8.9, AGP 8.7.3, SDK platform 35 and build-tools 35.0.0.
2. Configure ANDROID_HOME or local.properties. Run:
   chmod +x gradlew
   ./gradlew --no-daemon :app:assembleDebug
   (Windows: .\gradlew.bat --no-daemon :app:assembleDebug)
3. Fix actual build errors without removing games/features/assets. Give the exact error if blocked. Network/DNS failures downloading Gradle are environment failures, not proof the game source is broken.
4. Output app/build/outputs/apk/debug/app-debug.apk. Debug signing is acceptable for installation testing. Verify package site.st3amkeys.pocketparty, version 2.0.0, minSdk 26 and APK signature. Provide SHA-256.

## Assets and size
The source ZIP is deliberately asset-rich: roughly 97 MB of useful lossless stereo WAV masters, artwork masters, compressed in-app music, sprites and preview screenshots. Do NOT put asset-source/, tools/, tests/ or preview/ into the APK. The APK is expected to be considerably smaller than the source ZIP. Do not add padding files or duplicate audio just to inflate an APK size.

## Validate honestly
Run existing tests and read their results. Browser runs passed 40 game/player-count smoke combinations, eight rule assertions, completion of six timed games, and seven input/layout checks; they are not full device QA.
Install the APK on an Android emulator/phone, test all ten games with 1/2/3/4 humans, three/four real concurrent touches if a physical device is available, striker collision correctness, bot behavior, scoring/wins, timers, pause/background/resume, Android Back, sound/music/haptics, persistence, no-network cold start, notches/insets and low-end FPS. Respect portrait-first native layout. Check WebView Ogg playback and that menu music stops when backgrounded. Capture genuine Android screenshots. Do not relabel the included Chromium renders as Android captures.

Return the actual APK, updated source ZIP, actual device/emulator screenshots, test commands/results and remaining limitations. Do not claim full testing or a successful build unless it happened. Do not publish the code to GitHub without my permission; a GitHub Actions build workflow is supplied if I authorize a repository.
