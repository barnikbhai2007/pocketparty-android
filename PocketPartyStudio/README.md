# Pocket Party 5.0 — Strategy Rebuild

**A playable offline browser game and editable Android WebView project. Not a compiled APK or a store-ready release.**

This revision rebuilds the last thirty games' rules and controls, rather than adding another art pass. The original ten game-core source and all supplied runtime art/audio files remain unchanged.

## Play now

- **One-file edition:** open `PocketParty-5.0-Strategy.html` in a recent browser. All 195 image/audio resources are embedded; no extraction, account, download at runtime, or server is required. Audio starts after interaction and follows browser autoplay support.
- **Source edition:** extract the project and open `PLAY.html`. It opens `app/src/main/assets/index.html`.
- If a phone's file viewer blocks HTML scripts, open the file in an actual browser. Alternatively serve the runtime folder with `python3 -m http.server 8080` and open its address from the same machine.
- Portrait is best on phones. A tablet is preferable for three or four players and for small grid targets. Landscape phone controls fit, but the board is necessarily smaller.

### Where to start

Try **Skyhook Scramble** for movement/stealing, **Planet Movers** for a ball duel, **Mossball Garden** for physical bank shots, and **Golem Gambit** for planning. Library tabs separate **10 classics / 10 arenas / 20 planning games**.

## What changed in the thirty additions

### Ten tactical arenas

Steer with your own on-screen stick; face your arrow to aim. Two ability buttons trade energy and cooldowns for useful actions. Objectives—not touching a control—produce points.

- Skyhook: hook scrap, steal cargo, dash, and return to your dock.
- Kite: wind, cargo slowdown, gust displacement, and shield counters.
- Gravity: attract keys or repel keys/rivals to control delivery routes.
- Quiet Sea: torpedoes, reef cover, cargo spills and a slowing silent shield.
- Tongue: ranged bug capture/theft, guards, and a moving wasp.
- Ghost: aimed flash cones, stun/ward counterplay, spirit extraction.
- Planet: moving ball, facing-dependent kicks, pull fields, rival goals and own-goal checks.
- Octopus: attach to a crate, pull against rival tethers, route it around cover and bank it.
- Tide: expanding flood, oxygen, rafts, sprinting and retreat decisions.
- Echo: limited sonar reveals, remembered parcel locations, burst movement and delivery.

**Cargo is not score until delivered.** Power use consumes recoverable energy. Shots, shields, cover, body collisions, contested objectives and carrying limits make positioning matter. The arenas share collision/resource foundations; they are not advertised as ten unrelated physics engines.

### Twenty planning games

Tap a target, choose a mode if applicable, then **Confirm**. Invalid actions explain why and do not spend a turn. **Pass** is a real turn, not a score shortcut. Bots wait for idle humans. Fixed rounds replace the old universal 45-second timer.

| Game | Decision that replaces the old tap loop |
|---|---|
| Fossil Frenzy | Spend limited tools on shared numerical clues or risky excavation. |
| Goblin Elevator | Board at actual pickup floors; compete for shared lift capacity and routing. |
| Wobble Works | Edit rails and trace a marble path; testing a wrong route costs a turn and point. |
| The Unravelers | Swap fixed knot slots; only the final untangling move scores. |
| Tumble Table | Counter torque, choose finite heavy pieces and avoid losing all table points. |
| Mossball Garden | Aim/power physical shots, use bumpers, and wait for motion to settle. |
| Critter Choir | Compose a shared melody, manage breath and deny the next player's motif. |
| Potion Panic | Draft scarce ingredients, brew recipes and manage shared instability. |
| Mole Mail | Dig shared tunnels, route around blockers and return actual parcels to base. |
| Dream Tailors | Rotate thread circuits; complete a real connected source-to-sink route. |
| Golem Gambit | Preview and execute three-step programs around walls and rival positions. |
| Suspicious Suitcase | Pack weight/value, reserve space and time cash-outs or customs permits. |
| Room for Trouble | Draft/rotate whole polyominoes; deny or complete shared lines. |
| Borrowed Sunshine | Spend water, grow height, expand roots and shade competing plants. |
| Definitely Not a Trap | Commit public bids with limited coins and rotating tie priority. |
| Shadow Orchard | Read future sunlight, ripen fruit, harvest or deliberately over-ripen it. |
| Spaghetti Heist | Read shared tension, compete for noodles and bank before another pull snaps them. |
| Heat Dividend | Stoke, vent or cash out shared-pressure investments before a burst. |
| Parcel Parliament | Balance route payoff against congestion, tolls and the delivery deadline. |
| Candle Criminals | Trade attacks, shields and breath recovery against a public wind forecast. |

Each addition keeps three selectable variants. Variants change layouts, resources, initial puzzle states or hazards; these are **not ninety separately authored large levels**. Some games are independent-board puzzles with alternating turns rather than direct combat.

## Controls

- **Arenas:** each human has a stick and two ability buttons. The facing arrow determines directional powers. Numbered banks/goals match the numbered player tokens.
- **Planning:** the whole shared board belongs to the active player's turn. Mode changes are free; Confirm commits one action; Pass gives up the turn. Waiting seats cannot act.
- **Keyboard for the new arenas:** P1 WASD + F/G; P2 arrows + Enter/right Shift; P3 IJKL + O/P; P4 keypad 8/6/5/4 + 1/2. Keyboard play was not retrofitted into the preserved classics or the board puzzles.
- Pause contains the full rules. Solo runs track a local best score, not a universal arbitrary pass/fail score.

## Bots and tournaments

Choose 1–4 humans and 0–3 bots, up to four total seats. Easy/Normal/Hard and steady/variable form remain available. New bots use legal actions with delays and errors; they do not inject points. Route bots plan over visible walls, and sonar bots need their own reveal. Difficulty labels are not measured win-rate promises.

Tournaments retain random pools, per-round game/variant playlists, placement scoring, shared ties and replay. No save/resume or sudden-death system was added.

## Evidence and honest limits

- `tests/STUDIO_MATRIX.json`: 1,100 short game × variant × valid human/bot configurations, including the preserved classics.
- `tests/STRATEGY_GAMEPLAY.json`: 180 complete rebuilt-game simulations, 30 synthetic rule-path fixtures, and ten stationary ability-spam checks. Fixtures explicitly construct states to test rules; they are not human playthroughs.
- `tests/STRATEGY_UI.json`: simulated simultaneous touch sticks, movement, ability use, selection + confirmation, pause, tournament flow and four viewport sizes.
- `tests/STRATEGY_STANDALONE.json`: separate validation of the embedded one-file edition.
- `tests/PRESERVATION.json`: original core/runtime asset hashes compared with the supplied ZIP.
- `screenshots/strategy/`: actual browser renders, not concept artwork. Automated policies drive some screenshots; no claim of a human gameplay review is made.

These checks establish the tested stability and rule paths, **not fun, commercial-quality balance, accessibility certification or physical-device performance**. Android compilation, signing, Android audio lifecycle and real-device simultaneous touch have not been performed. Public bids are intentionally public; there is no fake private-information mechanic on a shared screen. Art/audio licensing and store policy review still need a release audit.

## REA and reference games

The requested official [morluto/rea](https://github.com/morluto/rea) tool, `rea-agents@6.3.0`, was run against the supplied 4.0 JavaScript assets before rebuilding. It parsed the app sources successfully. `tests/REA_SOURCE_INSPECTION.json` records the scope, statistics, limitations and evidence hash. This was **static inspection of your supplied app**, not reverse engineering of a commercial APK. No Stickman Party / 2 Player Games APK or executable was supplied, so no claim is made that its internals were inspected.

The public [Stickman Party listing](https://play.google.com/store/apps/details?id=com.PlayMax.playergames) provided the shared-screen, distinct-objective local multiplayer reference. The rebuild uses original rules/code and retained supplied assets; no commercial source, levels or assets were copied.

## Edit/build

- `core-source.js`: preserved classic core; do not overwrite it to fix an addition.
- `strategy-source.js`: authoritative new rules, controls, planners and rendering for all thirty additions.
- `expansion-source.js` / `studio-source.js`: retained catalog, variant/tournament infrastructure, legacy implementations, party/audio setup and art helpers. Their old addition engines are replaced by the strategy engines at assembly time.
- `build-expansion.py`: assembles `app/src/main/assets/game.js`.
- `app/src/main/assets/strategy.css`: scoped strategy layout; does not restyle the first ten.
- `build-standalone.py`: embeds the tested runtime plus all image/audio resources into one HTML.

```sh
python3 build-expansion.py
npm install
CHROMIUM_PATH=/path/to/chromium npm test
CHROMIUM_PATH=/path/to/chromium npm run test:matrix
CHROMIUM_PATH=/path/to/chromium npm run test:ui
python3 build-standalone.py --output PocketParty-5.0-Strategy.html
CHROMIUM_PATH=/path/to/chromium npm run test:standalone
```

The lightweight source ZIP includes all editable game code, Android build files and runtime assets. It omits the unchanged 105 MB high-resolution artwork/audio masters and legacy screenshots to avoid duplicating your original download. Keep your original 4.0 ZIP for those masters and the art/audio regeneration scripts' inputs. This omission does not prevent playing or compiling the application.

### Android build

Use Android Studio, **JDK 17**, Android SDK 35 and the Gradle dependencies. Run `./gradlew :app:assembleDebug`, or push the project to GitHub and use its included Build Android APK workflow. Version: `5.0.0-strategy`, code 5. The supplied browser file and ZIP are **not an APK**.
