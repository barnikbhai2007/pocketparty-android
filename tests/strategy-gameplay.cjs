const { chromium } = require("playwright"),
  fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, "..");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/local/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.join(root, "app/src/main/assets/index.html"));
  await p.evaluate(() => StudioArt.ready);
  const result = await p.evaluate(() => {
    Party.prefs.sound = false;
    Party.prefs.music = false;
    Party.prefs.haptics = false;
    Party.prefs.difficulty = "normal";
    Party.prefs.consistency = "steady";
    const checks = [],
      fixtures = [],
      matches = [],
      spam = [];
    function ok(v, n) {
      if (!v) throw Error(n);
      checks.push(n);
    }
    function start(id, n = 1, map = 0) {
      Party.prefs.humans = n;
      Party.prefs.bots = 0;
      Expansion.selectMap(map);
      Party.start(id);
      return Party.state.d;
    }
    function use(sel, mode = 0, i = Party.state.d.turn) {
      Party.state.d.sel = sel;
      Party.state.d.mode = mode;
      Strategy.action(i, 0);
    }
    function test(name, fn) {
      try {
        fn();
        fixtures.push({ name, ok: true });
      } catch (e) {
        fixtures.push({ name, ok: false, error: e.message });
      }
    }
    ok(Object.keys(Strategy.definitions).length === 30, "Thirty rebuilt definitions");
    for (let id of Object.keys(Strategy.definitions).filter(
      (id) => Strategy.definitions[id].kind === "arena",
    )) {
      start(id);
      for (let t = 0; t < 400; t++) {
        Strategy.action(0, t % 2);
        Party.step(0.05);
      }
      spam.push({ id, score: Party.state.scores[0], ok: Party.state.scores[0] === 0 });
    }
    test("Cargo has no score until docked", () => {
      let d = start("kite");
      let q = d.loot[0];
      Object.assign(d.players[0], { x: q.x, y: q.y });
      Party.step(0.01);
      ok(d.players[0].carry > 0 && Party.state.scores[0] === 0, "Pickup is unbanked");
      Object.assign(d.players[0], { x: 80, y: 520 });
      Party.step(0.01);
      ok(Party.state.scores[0] > 0 && d.players[0].carry === 0, "Docking banks actual cargo");
    });
    test("Cooldown and energy gate repeated firing", () => {
      let d = start("skyhook");
      Strategy.action(0, 0);
      let energy = d.players[0].energy;
      Strategy.action(0, 0);
      ok(
        d.shots.length === 1 && d.players[0].energy === energy,
        "Repeated ability cannot bypass cooldown",
      );
    });
    test("Ward blocks real projectile", () => {
      let d = start("sea", 2);
      d.loot.forEach((o) => (o.sleep = 9));
      Object.assign(d.players[0], { x: 80, y: 400, dx: 1, dy: 0 });
      Object.assign(d.players[1], { x: 170, y: 400, shield: 2, carry: 3 });
      Strategy.action(0, 0);
      for (let t = 0; t < 15; t++) Party.step(0.02);
      ok(d.players[1].carry === 3 && d.players[1].stun === 0, "Shield blocks torpedo spill");
    });
    test("Magnet pulls objects rather than injecting score", () => {
      let d = start("gravity");
      Object.assign(d.players[0], { x: 100, y: 400 });
      Object.assign(d.loot[0], { x: 180, y: 400, sleep: 0 });
      Strategy.action(0, 0);
      ok(d.loot[0].x < 180 && Party.state.scores[0] === 0, "Attract moves the key");
    });
    test("Flash uses facing cone", () => {
      let d = start("ghost");
      Object.assign(d.players[0], { x: 300, y: 400, dx: 1, dy: 0 });
      d.loot.forEach((o) => (o.sleep = 9));
      Object.assign(d.loot[0], { x: 370, y: 400, sleep: 0, v: 1 });
      Object.assign(d.loot[1], { x: 230, y: 400, sleep: 0, v: 1 });
      Strategy.action(0, 0);
      ok(d.players[0].carry === 1 && d.loot[1].sleep === 0, "Front captured; rear untouched");
    });
    test("Goal checks last touch and goal ownership", () => {
      let d = start("planet", 2);
      Object.assign(d.players[1], { x: 400, y: 400 });
      Object.assign(d.ball, { x: 520, y: 520, vx: 0, vy: 0, last: 0 });
      Party.step(0.01);
      ok(Party.state.scores[0] === 3, "Rival goal pays last toucher");
      Object.assign(d.ball, { x: 80, y: 520, vx: 0, vy: 0, last: 0 });
      Party.step(0.01);
      ok(Party.state.scores[0] === 3, "Own goal pays nobody");
    });
    test("Opposed tethers cancel", () => {
      let d = start("octopus", 2);
      d.walls = [];
      Object.assign(d.crates[0], { x: 300, y: 300 });
      Object.assign(d.players[0], { x: 240, y: 300, tether: 0 });
      Object.assign(d.players[1], { x: 360, y: 300, tether: 0 });
      Party.step(0.05);
      ok(Math.abs(d.crates[0].x - 300) < 0.001, "Equal tugs do not choose an arbitrary winner");
    });
    test("Flood consumes oxygen and drops cargo", () => {
      let d = start("tide");
      Object.assign(d.players[0], { x: 300, y: 300, oxygen: 0.1, carry: 3 });
      Party.step(0.05);
      ok(
        d.players[0].oxygen === 100 && d.players[0].carry === 0 && d.players[0].x === 80,
        "Oxygen failure returns to dock without score",
      );
    });
    test("Fossil clue costs tools; excavation scores once", () => {
      let d = start("fossil");
      let k = [...d.bones][0];
      use(k, 0);
      ok(d.tools[0] === 7 && d.clues[k] >= 0, "Scan + round refill are accounted");
      use(k, 1);
      let score = Party.state.scores[0],
        turns = d.turns;
      use(k, 1);
      ok(
        score === 4 && Party.state.scores[0] === score && d.turns === turns,
        "Excavation cannot be farmed",
      );
    });
    test("Mole forbids teleporting", () => {
      let d = start("mole");
      use(0, 0);
      ok(d.turns === 0 && d.pos[0] === 30, "Only adjacent movement is legal");
    });
    test("Golem executes selected three-step program", () => {
      let d = start("golem");
      use(0, 0);
      ok(d.turns === 1 && d.pos[0] !== 20, "Program changes position through normal action");
    });
    test("Planting scores only at final harvest", () => {
      let d = start("sunshine");
      use(0, 0);
      ok(Party.state.scores[0] === 0 && d.tiles[0]?.owner === 0, "No early tap score for planting");
    });
    test("Orchard over-ripening really rots", () => {
      let d = start("orchard");
      d.fruit[12] = 4;
      use(12, 1);
      ok(d.fruit[12] === 0, "Stage 5 resets to zero");
    });
    test("Route dispatch settles after ETA", () => {
      let d = start("parcel");
      use(0, 0);
      ok(
        Party.state.scores[0] === 3 && d.shipments.length === 0,
        "One-round route delivered legally",
      );
    });
    test("Potion uses inventory and public stock", () => {
      let d = start("potion");
      use(0, 0);
      ok(d.inv[0][0] === 2, "Gather adds ingredient");
      use(3, 1);
      ok(Party.state.scores[0] === 5 && d.inv[0][0] === 0, "Brew consumes exact recipe");
    });
    test("Packing prevents overlap and previews real shape", () => {
      let d = start("room");
      use(0, 0);
      let before = Party.state.scores[0],
        turns = d.turns;
      use(0, 0);
      ok(
        before === 3 && d.turns === turns && Party.state.scores[0] === before,
        "Overlapping shape rejected without spending turn",
      );
    });
    test("Thread generator contains a valid route", () => {
      let d = start("tailor");
      d.boards[0].rot = d.boards[0].answer.slice();
      d.boards[0].rot[0] = (d.boards[0].rot[0] + 1) % 4;
      use(0, 1);
      ok(Party.state.scores[0] === 10, "Restoring known valid thread scores through normal rule");
    });
    test("Fixed knot slots cannot be collapsed", () => {
      let d = start("unravel");
      d.pair = [1, 2];
      use(1, 0);
      ok(
        new Set(d.order).size === 8 && d.order.length === 8,
        "Swap keeps all eight unique fixed slots",
      );
    });
    test("Marble workshop has a guaranteed solvable route", () => {
      let d = start("wobble");
      d.boards[0].tiles = d.boards[0].answer.slice();
      use(0, 1);
      ok(Party.state.scores[0] === 8, "Successful marble test scores");
    });
    test("Marble failure has a cost", () => {
      let d = start("wobble");
      d.boards[0].tiles.fill(0);
      use(0, 1);
      ok(Party.state.scores[0] === -1, "Straight path misses row-4 basket");
    });
    test("Choir repeat is penalised", () => {
      start("choir");
      use(3, 0);
      ok(Party.state.scores[0] === -1, "Repeated last note is not free score");
    });
    test("Elevator boards and delivers real passenger", () => {
      let d = start("elevator");
      let dest = d.requests[0][0].to;
      use(100, 0);
      ok(d.load.length === 1, "Passenger boarded at correct floor");
      use(dest, 0);
      ok(Party.state.scores[0] === 3 && d.load.length === 0, "Arrival pays owner fare");
    });
    test("Torque collapse removes unbanked piece points", () => {
      let d = start("tumble");
      use(8, 1);
      ok(Party.state.scores[0] === 5, "Heavy outer placement pays risky value");
      use(8, 1);
      ok(
        Party.state.scores[0] === -2 && d.pieces.length === 0,
        "Collapse retracts prior points and penalises placer",
      );
    });
    test("Flick is real physics, not target tapping", () => {
      let d = start("moss");
      let y = d.balls[0].y;
      d.aim = { x: 75, y: 100 };
      use(0, 2);
      ok(d.busy && d.turns === 0, "Turn waits during shot");
      for (let t = 0; t < 100; t++) Party.step(0.05);
      ok(!d.busy && d.turns === 1 && d.balls[0].y !== y, "Physics moves ball and then advances");
    });
    test("Suitcase rejects over-capacity cargo", () => {
      let d = start("suitcase");
      d.bags[0] = [{ w: d.capacity, v: 5, bad: false }];
      use(0, 0);
      ok(d.turns === 0 && d.bags[0].length === 1, "Overweight pack rejected");
    });
    test("Noodle snap affects all attached players", () => {
      let d = start("spaghetti", 2);
      d.lanes[0].t = 9;
      d.pending[1] = 4;
      d.attached[1] = 0;
      use(0, 0);
      ok(
        d.pending[1] === 0 && d.attached[1] === -1 && Party.state.scores[0] === -1,
        "Risk spills rival and actor cargo",
      );
    });
    test("Candle guard counters attack", () => {
      let d = start("candle", 2);
      d.guards[1] = 3;
      use(1, 0);
      ok(d.flames[1] === 6 && Party.state.scores[0] === 0, "Guard absorbs the full blow");
    });
    test("Pressure bonus requires real shares", () => {
      let d = start("heat");
      use(0, 1);
      ok(d.turns === 0 && Party.state.scores[0] === 0, "Empty banking rejected");
      use(2, 0);
      d.pressure = 70;
      use(0, 1);
      ok(Party.state.scores[0] === 9 && d.pending[0] === 0, "Six shares bank at 1.5 multiplier");
    });
    test("Public bid tie priority rotates", () => {
      let d = start("gift", 2);
      use(2, 0, 0);
      use(2, 0, 1);
      ok(Party.state.scores[0] === 8 && d.turn === 1, "First round priority P1");
      use(2, 0, 1);
      use(2, 0, 0);
      ok(Party.state.scores[1] === 8 && d.turn === 0, "Second round priority P2");
    });
    test("Idle human is not skipped in planning games", () => {
      let d = start("gift");
      Party.prefs.bots = 3;
      Party.start("gift");
      d = Party.state.d;
      for (let t = 0; t < 100; t++) Party.step(0.05);
      ok(d.turns === 0 && d.turn === 0, "Bots wait for a human commitment");
    });
    // Complete matches on every rebuilt map: solo and four seats. Human seats are driven by legal input policies.
    for (let id of Object.keys(Strategy.definitions))
      for (let map = 0; map < 3; map++)
        for (let seats of [1, 4]) {
          Party.prefs.humans = 1;
          Party.prefs.bots = seats - 1;
          Expansion.selectMap(map);
          Party.start(id);
          let def = Strategy.definitions[id],
            frames = 0;
          while (!Party.state.ended && frames < 6000) {
            let d = Party.state.d;
            if (def.kind !== "arena" && d.turn === 0 && !d.busy) def.bot(0);
            if (def.kind === "arena" && frames % 10 === 0) {
              let q = d.players[0],
                target = { x: 80, y: 520 };
              if (q.carry < 3) {
                let o = d.loot
                  .filter((o) => o.sleep <= 0)
                  .sort(
                    (a, b) => Math.hypot(a.x - q.x, a.y - q.y) - Math.hypot(b.x - q.x, b.y - q.y),
                  )[0];
                if (o) target = o;
              }
              if (id === "planet") target = d.ball;
              if (id === "octopus") target = q.tether >= 0 ? { x: 80, y: 520 } : d.crates[0];
              let x = target.x - q.x,
                y = target.y - q.y,
                n = Math.hypot(x, y) || 1;
              Strategy.steer(0, x / n, y / n);
              if (id === "octopus") {
                if (q.tether < 0) Strategy.action(0, 0);
                else Strategy.action(0, 1);
              } else Strategy.action(0, frames % 20 ? 0 : 1);
            }
            Party.step(0.05);
            frames++;
          }
          Party.render();
          matches.push({
            id,
            map,
            seats,
            ended: Party.state.ended,
            frames,
            scores: Party.state.scores.slice(),
            turns: Party.state.d.turns,
            ok: Party.state.ended && Party.state.scores.every(Number.isFinite),
          });
        }
    return {
      scope:
        "Chromium simulation and synthetic legal-rule fixtures, not human enjoyment, win-rate, Android or physical multitouch certification",
      checks,
      fixtures,
      spam,
      matches,
    };
  });
  result.pageErrors = errors;
  fs.writeFileSync(
    path.join(root, "tests/STRATEGY_GAMEPLAY.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        checks: result.checks.length,
        fixtures: result.fixtures.length,
        fixtureFailures: result.fixtures.filter((v) => !v.ok),
        spamFailures: result.spam.filter((v) => !v.ok),
        completeMatches: result.matches.length,
        matchFailures: result.matches.filter((v) => !v.ok),
        zeroScores: result.matches
          .filter((v) => v.scores.every((s) => s === 0))
          .map((v) => ({ id: v.id, map: v.map, seats: v.seats })),
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  await b.close();
  if (
    errors.length ||
    result.fixtures.some((v) => !v.ok) ||
    result.spam.some((v) => !v.ok) ||
    result.matches.some((v) => !v.ok)
  )
    process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
