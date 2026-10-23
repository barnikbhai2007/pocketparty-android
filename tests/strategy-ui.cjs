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
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const errors = [],
    checks = [],
    screens = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const assert = (v, n) => {
    if (!v) throw Error(n);
    checks.push(n);
  };
  await p.goto("file://" + path.join(root, "app/src/main/assets/index.html"));
  await p.evaluate(() => StudioArt.ready);
  await p.evaluate(() => {
    Party.prefs.sound = false;
    Party.prefs.music = false;
    Party.prefs.haptics = false;
    Party.prefs.humans = 2;
    Party.prefs.bots = 0;
    Party.start("skyhook");
  });
  await p.waitForTimeout(100);
  let sticks = await p.locator(".stick").all(),
    r0 = await sticks[0].boundingBox(),
    r1 = await sticks[1].boundingBox();
  const cdp = await p.context().newCDPSession(p);
  let t0 = { x: r0.x + r0.width / 2, y: r0.y + r0.height / 2, id: 1 },
    t1 = { x: r1.x + r1.width / 2, y: r1.y + r1.height / 2, id: 2 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [t0, t1] });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { ...t0, x: t0.x + 15 },
      { ...t1, y: t1.y - 15 },
    ],
  });
  assert(
    await p.evaluate(() => Party.state.d.controls[0].x > 0.4 && Party.state.d.controls[1].y < -0.4),
    "Two independent touch sticks steer simultaneously",
  );
  let before = await p.evaluate(() => Party.state.d.players.map((v) => ({ x: v.x, y: v.y })));
  await p.waitForTimeout(150);
  let after = await p.evaluate(() => Party.state.d.players.map((v) => ({ x: v.x, y: v.y })));
  assert(
    after[0].x > before[0].x && after[1].y < before[1].y,
    "Two players actually move from touch input",
  );
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert(
    await p.evaluate(() => Party.state.d.controls.every((v) => v.x === 0 && v.y === 0)),
    "Touch release stops both sticks",
  );
  await p.locator('.strategy-pad[data-seat="0"] [data-action="0"]').tap();
  assert(
    await p.evaluate(() => Party.state.d.players[0].energy < 100),
    "Real ability button spends energy",
  );
  await p.click("#pause");
  let elapsed = await p.evaluate(() => Party.state.elapsed);
  await p.waitForTimeout(120);
  assert(await p.evaluate((v) => Party.state.elapsed === v, elapsed), "Pause freezes elapsed time");
  await p.click("#resume");
  await p.evaluate(() => {
    Party.start("fossil");
  });
  await p.waitForTimeout(80);
  let board = await p.locator("#board").boundingBox();
  await p.touchscreen.tap(board.x + board.width * 0.167, board.y + board.height * 0.213);
  await p.locator('.strategy-pad[data-seat="0"] [data-action="0"]').tap();
  assert(
    await p.evaluate(() => Party.state.d.turns === 1 && Party.state.d.clues.some((v) => v >= 0)),
    "Real board selection plus Confirm commits a scan",
  );
  let turns = await p.evaluate(() => Party.state.d.turns);
  await p.locator('.strategy-pad[data-seat="0"] [data-action="0"]').evaluate((e) => e.click());
  assert(
    await p.evaluate((t) => Party.state.d.turns === t, turns),
    "Inactive human controls do not steal a turn",
  );
  await p.evaluate(() => {
    Party.prefs.humans = 1;
    Party.prefs.bots = 2;
    Party.goHome();
  });
  await p.click("#tournament");
  await p.selectOption("#round-preset", "custom");
  await p.fill("#custom-rounds", "2");
  await p.selectOption("#cup-mode", "playlist");
  await p.locator(".playlist-game").nth(0).selectOption("heat");
  await p.locator(".playlist-map").nth(0).selectOption("2");
  await p.locator(".playlist-game").nth(1).selectOption("skyhook");
  await p.locator(".playlist-map").nth(1).selectOption("1");
  await p.click("#cup-begin");
  await p.click("#cup-play");
  assert(
    await p.evaluate(
      () => Party.state.g.id === "heat" && Party.state.mapIndex === 2 && Party.state.n === 3,
    ),
    "Tournament uses rebuilt engine, map and bot seats",
  );
  await p.evaluate(() => {
    for (let t = 0; t < 24; t++) if (!Party.state.ended) Strategy.action(Party.state.d.turn, 2);
  });
  assert(
    await p
      .locator("#modal")
      .textContent()
      .then((s) => s.includes("standings")),
    "Planning round reaches tournament standings through legal passes",
  );
  await p.click("#cup-next");
  await p.click("#cup-play");
  await p.evaluate(() => {
    for (let t = 0; t < 1201; t++) Party.step(0.05);
  });
  assert(
    await p
      .locator("#modal")
      .textContent()
      .then((s) => s.includes("FINAL PODIUM")),
    "Arena round reaches final tournament podium",
  );
  await p.click("#cup-exit");
  fs.mkdirSync(path.join(root, "screenshots/strategy"), { recursive: true });
  for (let [width, height, seats] of [
    [390, 844, 4],
    [360, 740, 4],
    [1024, 768, 4],
    [844, 390, 4],
  ]) {
    await p.setViewportSize({ width, height });
    await p.evaluate((seats) => {
      Party.prefs.humans = seats;
      Party.prefs.bots = 0;
      Party.start("room");
      Party.fit();
    }, seats);
    await p.waitForTimeout(100);
    let dims = await p.evaluate(() => {
      let board = document.getElementById("board").getBoundingClientRect();
      let controls = [...document.querySelectorAll(".str-action")]
        .filter((e) => e.getClientRects().length)
        .map((e) => {
          let r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        board: { x: board.x, y: board.y, w: board.width, h: board.height },
        controls,
        viewport: { w: innerWidth, h: innerHeight },
      };
    });
    assert(!dims.overflow, "No horizontal overflow at " + width + "×" + height);
    assert(Math.abs(dims.board.w - dims.board.h) < 2, "Square board at " + width + "×" + height);
    assert(
      dims.controls.every(
        (r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= width + 1 && r.y + r.h <= height + 1,
      ),
      "Controls remain on screen at " + width + "×" + height,
    );
    if (width < height)
      assert(
        dims.controls.every((r) => r.w >= 43.5 && r.h >= 44),
        "Touch buttons at least 44×44 at " + width + "×" + height,
      );
    let file = "room-" + width + "x" + height + "-4p.png";
    await p.screenshot({ path: path.join(root, "screenshots/strategy", file) });
    screens.push(file);
  }
  await p.setViewportSize({ width: 390, height: 844 });
  let ids = await p.evaluate(() => Object.keys(Strategy.definitions));
  for (let id of ids) {
    await p.evaluate((id) => {
      Party.prefs.humans = 1;
      Party.prefs.bots = 1;
      Expansion.selectMap(0);
      Party.start(id);
      let def = Strategy.definitions[id];
      if (def.kind === "arena") {
        for (let t = 0; t < 160; t++) {
          Strategy.steer(0, 0.7, -0.7);
          if (t % 15 === 0) Strategy.action(0, 0);
          Party.step(0.05);
        }
      } else {
        for (let t = 0; t < 100; t++) {
          if (Party.state.d.turn === 0 && !Party.state.d.busy) def.bot(0);
          Party.step(0.05);
          if (Party.state.d.turns >= 4) break;
        }
      }
      Party.fit();
      Party.render();
    }, id);
    await p.waitForTimeout(50);
    let file = id + "-phone.png";
    await p.screenshot({ path: path.join(root, "screenshots/strategy", file) });
    screens.push(file);
  }
  fs.writeFileSync(
    path.join(root, "tests/STRATEGY_UI.json"),
    JSON.stringify(
      {
        scope:
          "Chromium simulated touch, DOM interactions and viewport checks; not physical Android multi-touch testing",
        checks,
        errors,
        screenshots: screens,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks: checks.length, errors, screenshots: screens.length }));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
