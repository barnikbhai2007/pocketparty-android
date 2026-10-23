# Pocket Party Deluxe 2.0 — asset-rich Android source

**SOURCE ZIP, NOT AN APK. Android compilation and physical-device testing have not been performed on this revision.**

This is a substantial presentation/control redesign of the earlier Pocket Party source available in this conversation. The separate 87 KB source reportedly modified by another AI was never attached, so those changes have NOT been merged.

## What changed
- 10 illustrated game-selection tiles, original generated material textures, detailed transparent car/striker/counter/card/traffic-light sprites, and an editable SVG logo.
- Full-screen arenas. The old generic controller bars are hidden; the live input surface is the arena itself.
- Two-player racing/target/rhythm areas face opposite ends of the device. Three/four-player versions use independent sections.
- Hockey: drag the actual striker along its side. Sumo: circular corner thumb zones, hold/release. Reaction games: tap your part of the screen. Board games: tap the board, no controller overlay.
- Face-to-face score ribbons, particles, sound effects, background music toggle and pause-aware audio.
- Portrait-first native Android layout to prevent orientation changes moving controls during a match. Browser landscape fallback was spot-checked for Sumo only; it is not a promise of universal landscape support.
- Solo AI, 1–4 humans, 10 games, local settings/scores, instructions, rematch and offline operation retained.

## Why the source ZIP is large
`asset-source/audio/` contains eleven real, original synthesized instrumental loop masters in 44.1 kHz, 16-bit stereo WAV: about 97 MB uncompressed in total. Smaller Ogg versions are used inside the app. The ZIP also includes source artwork, transparent sprites and browser-rendered screenshots. There are no dummy padding files.

**Source ZIP size is not APK size.** Lossless masters, tools and preview images live OUTSIDE `app/src/main/assets` and are not bundled into the APK by the Android build. Do not force a 45 MB APK by copying source masters into production assets.

## Included games
Pocket Rally; Orbit Sumo; Pocket Hockey; Quick Draw; Colour Catch; Bullseye Club; Beat Street; Match Mates; Three’s a Line; Box Buddies.

One player means one human against one bot. With 2–4 humans, all seats are human. Local device only, not online multiplayer.

## Build
Open this folder (containing `settings.gradle`) in Android Studio. Use **JDK 17**, Android SDK Platform **35**, Build Tools **35.0.0**. The included wrapper uses Gradle **8.9** and AGP **8.7.3**.

Linux/macOS:
```sh
chmod +x gradlew
./gradlew --no-daemon :app:assembleDebug
```
Windows:
```powershell
.\gradlew.bat --no-daemon :app:assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk` (automatically debug-signed).

Set ANDROID_HOME or local.properties/sdk.dir if the SDK is not detected. Initial Gradle/dependency downloads require working internet/DNS on the build machine. The GAME needs no internet and the manifest does not request INTERNET.

Alternative: use the included `.github/workflows/build-apk.yml` in a repository you authorize. Put project contents at the repository root, including hidden `.github` directory. Run Actions > Build Android APK. No workflow has been run for this handoff.

## Preview without compiling
```sh
python -m http.server 8080 --directory app/src/main/assets
```
Visit http://localhost:8080 in a current browser. `index.html` can also open directly. Keep Android System WebView current on the device. Target Android 8+ (minSdk 26).

## Tests
Install Node and Playwright, then:
```sh
npm install
npx playwright install chromium
npm test
node tests/visual-and-input.cjs
```
Set CHROMIUM_PATH to an existing Chromium executable if necessary. `tests/RESULTS.json` and `tests/VISUAL_INPUT_RESULTS.json` record the included runs. These are real browser checks, but they do NOT establish Android compilation, real-device multitouch, performance, latency or audio lifecycle correctness. Read TEST_REPORT.md.

## File map
- `app/src/main/assets/game.js`: original game rules, state, UI and scoring.
- `app/src/main/assets/deluxe.js`: replacement full-screen renderers and direct multitouch routing.
- `app/src/main/assets/assets.js`: bundled artwork, sprite and music loading.
- `app/src/main/assets/assets/`: runtime art, textures, sprites, Ogg loops and WAV effects.
- `asset-source/`: lossless music masters, original generated atlases and cropped artwork masters; not shipped in APK.
- `tools/make_audio.py`, `make_sprites.py`, `finish_sprites.py`: original reproducible audio/sprite production scripts.
- `preview/`: actual Chromium render captures, NOT Android screenshots. Test setup freezes/simulates game state for inspection; results capture is seeded for a clear representative win.
- `PROMPT_FOR_BUILD_AI.md`: next-AI compilation/validation handoff.

Release distribution still needs device QA, balancing, private release signing, privacy/store-listing review and packaging checks. Never put a private signing key/password in this ZIP or a public repository.
