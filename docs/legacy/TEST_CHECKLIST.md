# QA checklist / initial validation status

This source handoff is NOT a successfully compiled APK, production release or fully tested game. See `tests/RESULTS.json` if present for the precise checks run on this packaged revision. Browser tests do not validate Android packaging, Android lifecycle, real multitouch, latency or performance.

## Build and install — still required
- [ ] Gradle assembleDebug succeeds on JDK 17 / SDK 35.
- [ ] `apksigner verify --verbose app-debug.apk` succeeds.
- [ ] Install, cold-launch and relaunch on Android 8+ with current WebView.
- [ ] Disable network and cold-launch; every asset and game still works.
- [ ] Manifest has no INTERNET permission or unexpected permissions.

## Each of 10 games × 4 human counts
- [ ] Instructions open; start, score, finish, rematch and back-to-menu work.
- [ ] Solo bot acts and the round can complete.
- [ ] 2/3/4 human controls address independent players.
- [ ] 3/4 simultaneous physical fingers are processed independently.
- [ ] Player identities are readable without colour alone.

## Rule-specific tests
- Rally: both lanes, clean pass +1, collision −2, no double award.
- Sumo: release rotates, hold thrusts, contact impulse, ring-out attribution within 4s, respawn.
- Hockey: 2/3/4 defended sides, unused sides are walls, paddle collision and misses, serve reset, best score is fewest goals conceded.
- Draw: early −1 locks player out; only first legal tap wins; all-early/no-tap timeout; seven rounds terminate.
- Colour: one tap per card, correct +1/wrong −1, bot reacts only to its colour.
- Target: centre +3, outer +1, miss 0, cooldown prevents spam.
- Rhythm: one tap per beat, exact and close windows, shrinking ring meets fixed circle at scoring time.
- Memory: two flips, nonmatches rotate turn, matches preserve turn, claimed cards stay revealed, all pairs finish.
- Connect: gravity, full-column rejection, horizontal/vertical/both diagonals, 3/4-player turn rotation, full-board tie.
- Boxes: edge placement, duplicate rejection, single/double-box capture, extra turn, 16-box completion.

## UX / lifecycle
- [ ] Portrait 360×640, 390×844; portrait tablet. Native app is portrait-locked; browser landscape is a fallback, not the primary play mode.
- [ ] No clipped labels, misplaced touch zones or overlays obscuring critical controls.
- [ ] Pause actually freezes timers/physics; restart resets state.
- [ ] Background/foreground pauses safely; no held inputs remain stuck.
- [ ] Android Back resumes/exits as intended, without accidentally finishing Activity mid-round.
- [ ] Settings and wins persist across restart; reset requires confirmation.
- [ ] Sound/haptics toggles work and no audio plays after backgrounding.
- [ ] Measure FPS, battery and input latency on a lower-end physical device.

Known limitations: one local device only; no online multiplayer; only one bot in solo; seat-based scores; basic difficulty heuristics; no tournament mode, cloud saves, accessibility screen-reader game narration, release keystore, store listing or privacy-policy hosting. Initial project may need further balancing/polish after device playtesting.
