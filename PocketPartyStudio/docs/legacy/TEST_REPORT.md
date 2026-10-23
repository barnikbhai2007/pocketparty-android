# Pocket Party Deluxe 2.0 — validation scope

## Completed on this revision
- JavaScript syntax checks for game.js and deluxe.js.
- Real headless Chromium loading/rendering, not a mocked canvas/DOM.
- 40 launch/simulation checks: all ten games × 1/2/3/4 human settings, finite scores and expected seat count.
- Eight rule assertions: four-direction connect wins (combined), empty-board nonwin, gravity row, box-edge shape, memory pair preserves turn, colour duplicate-tap prevention, connect gravity/turn placement and box capture/extra turn.
- All six timed games reach their result state under simulated time.
- Seven browser input/layout checks: independent two-track simultaneous taps, two simultaneous Sumo holds, release clearing, four simultaneous colour-game inputs, direct visible-striker drag, pause freezes simulation, no horizontal overflow at 360×640.
- Actual browser rendering captured for ten two-player game screens, four-player Rally/Sumo/Hockey, rules/settings/pause/results, a small-phone board and a browser landscape Sumo fallback.
- Visual inspection led to fixes for controller overlap, header/timer/score collisions, font-dependent missing glyphs, legibility and card/board props.
- Audio master peak/RMS and duration measurements; no digital clipping in the masters.

Read tests/RESULTS.json and tests/VISUAL_INPUT_RESULTS.json for machine-readable results and tests/*.log for the exact output. Tests use direct state inspection as well as Chromium CDP touch dispatch. Direct state inspection is not a substitute for touch-playtesting every game.

## NOT completed
- This redesigned revision has NOT been compiled to APK.
- No Gradle build, APK signature verification, emulator install, physical Android/WebView run or real-finger four-player test was performed for this handoff.
- Native lifecycle/back button/notch/inset behavior, Ogg playback across WebView versions, physical haptics, listening quality, battery/performance/FPS and gameplay balancing remain to be validated.
- Screenshots are Chromium-rendered previews, not Android screenshots. Game time/state is controlled by the capture harness; the result-state capture uses seeded scores.
- The other AI's 87 KB update was not supplied, so its changes are not part of this package.

## Next steps
Use JDK 17 / SDK 35 to build the included Gradle project; see README.md and PROMPT_FOR_BUILD_AI.md. Run TEST_CHECKLIST.md on the actual APK. Treat this as a playable source prototype with enhanced assets, not a production-certified release.
