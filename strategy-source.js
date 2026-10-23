/* Pocket Party 5 — Strategy rebuild. Authored rules; no copied commercial game code. */
const strategyDefs = {};
const STR = { bg: "#f6f0e3", ink: "#24333b", muted: "#66716f", gold: "#ac7426" };
const ST = {
  text(t, x, y, size = 24, col = STR.ink, align = "center") {
    c.save();
    size = Math.max(23, size);
    c.font = "700 " + size + "px Arial";
    c.fillStyle = col;
    c.textAlign = align;
    c.textBaseline = "middle";
    let rows = [String(t)];
    if (c.measureText(rows[0]).width > 550 && String(t).includes(" ")) {
      rows = [""];
      for (let w of String(t).split(" ")) {
        let k = rows.length - 1;
        if (c.measureText(rows[k] + " " + w).width > 550 && rows[k]) rows.push(w);
        else rows[k] += (rows[k] ? " " : "") + w;
      }
    }
    rows.forEach((row, k) => c.fillText(row, x, y + (k - (rows.length - 1) / 2) * (size + 3)));
    c.restore();
  },
  box(x, y, w, h, fill = "#fffaf0", border = "#c7c2b2", r = 10) {
    rr(c, x, y, w, h, r, fill, border, 2);
  },
  circle(x, y, r, col, border) {
    circ(c, x, y, r, col, border, 3);
  },
  line(a, b, col = "#6e7974", w = 4) {
    line(c, a.x, a.y, b.x, b.y, col, w);
  },
  bg() {
    c.fillStyle = STR.bg;
    c.fillRect(0, 0, 600, 600);
    c.save();
    c.globalAlpha = 0.16;
    artImage("board-" + themed(), 0, 0, 600, 600);
    c.restore();
  },
  grid(cols = 6, rows = cols, y = 90, size = 480) {
    return { cols, rows, x: (600 - size) / 2, y, size, cell: size / cols };
  },
  xy(k, g) {
    return {
      x: g.x + ((k % g.cols) + 0.5) * g.cell,
      y: g.y + (Math.floor(k / g.cols) + 0.5) * g.cell,
    };
  },
  index(p, g) {
    let x = Math.floor((p.x - g.x) / g.cell),
      y = Math.floor((p.y - g.y) / g.cell);
    return x >= 0 && x < g.cols && y >= 0 && y < g.rows ? y * g.cols + x : -1;
  },
  cells(g, fn) {
    for (let k = 0; k < g.cols * g.rows; k++) {
      let p = this.xy(k, g);
      this.box(p.x - g.cell / 2 + 2, p.y - g.cell / 2 + 2, g.cell - 4, g.cell - 4, "#fffaf0c9");
      fn?.(k, p, g.cell);
    }
  },
  banner(t, sub) {
    this.text(t, 300, 27, 25);
    if (sub) this.text(sub, 300, 58, 21, STR.muted);
  },
  select(k, g) {
    if (k < 0) return;
    let p = this.xy(k, g);
    this.box(
      p.x - g.cell / 2 + 4,
      p.y - g.cell / 2 + 4,
      g.cell - 8,
      g.cell - 8,
      null,
      COL[S.d.turn],
      5,
    );
  },
  cards(items, selected = -1, y = 380) {
    let w = 540 / items.length;
    items.forEach((item, k) => {
      let x = 30 + k * w;
      this.box(
        x + 4,
        y,
        w - 8,
        100,
        k === selected ? TINT[S.d.turn] : "#fffcf2",
        k === selected ? COL[S.d.turn] : "#b8b8a7",
      );
      let a = Array.isArray(item) ? item : [item];
      a.forEach((v, j) => this.text(v, x + w / 2, y + 28 + j * 28, j ? 21 : 25));
    });
  },
  cardAt(p, n, y = 380) {
    return p.y >= y && p.y <= y + 100 && p.x >= 30 && p.x < 570
      ? Math.min(n - 1, Math.floor((p.x - 30) / (540 / n)))
      : -1;
  },
  note(t) {
    S.d.note = t;
    S.d.noteAt = S.elapsed;
    S.message = t;
  },
  add(i, v) {
    if (v) score(i, v);
  },
  neighbors(k, n = 6) {
    let x = k % n,
      y = Math.floor(k / n);
    return [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]
      .filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n)
      .map(([a, b]) => b * n + a);
  },
  cellsNear(k, n = 6) {
    let x = k % n,
      y = Math.floor(k / n),
      a = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        if ((dx || dy) && x + dx >= 0 && x + dx < n && y + dy >= 0 && y + dy < n)
          a.push((y + dy) * n + x + dx);
    return a;
  },
  rng(k) {
    return (((k * 1103515245 + 12345) >>> 0) % 997) / 997;
  },
};
function strategyRegister(id, def) {
  strategyDefs[id] = def;
  let g = games.find((v) => v.id === id);
  Object.assign(g, {
    tag: def.tag,
    rule: def.rule,
    goal:
      def.goal ||
      (def.kind === "arena"
        ? "60 seconds."
        : (def.rounds || 8) + " rounds; one deliberate action per turn.") +
        " Highest banked score wins. Solo: beat your record.",
    time: def.kind === "arena" ? 60 : 0,
    strategic: true,
    target: def.target || 12,
    action: "PLAY",
  });
  engines[id] = {
    init() {
      S.d = {
        strategy: true,
        kind: def.kind,
        turn: 0,
        first: 0,
        turns: 0,
        round: 1,
        mode: 0,
        sel: -1,
        note: "",
        noteAt: -99,
        botWait: 0,
        controls: many(() => ({ x: 0, y: 0, held: false })),
        p: [],
      };
      def.init();
      strategyControls();
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (S.d.kind === "arena") {
        def.update(dt);
        strategyArenaBots(def, dt);
      } else {
        def.update?.(dt);
        if (!S.ended && S.d.turn >= prefs.humans && !S.d.busy) {
          S.d.botWait -= dt;
          if (S.d.botWait <= 0) {
            S.d.botWait = botSkill().delay * 1.8;
            def.bot(S.d.turn);
            strategyControlLabels();
          }
        }
      }
      if (S.elapsed - S.d.noteAt > 2.8) S.message = strategyStatus();
    },
    tap(i, p) {
      if (!active() || !p) return;
      if (def.kind !== "arena" && i !== S.d.turn) return;
      def.tap?.(i, p);
      strategyControlLabels();
    },
    move(i, p) {
      def.move?.(i, p);
    },
    up(i, p) {
      def.up?.(i, p);
    },
    action(i, k) {
      if (!active() || i >= S.n) return;
      if (def.kind !== "arena" && (i !== S.d.turn || S.d.busy)) return;
      if (def.kind === "arena") def.action(i, k);
      else if (k === 0) {
        if (def.act(i, S.d.sel) === true) strategyNext();
      } else if (k === 1) {
        S.d.mode = (S.d.mode + 1) % (def.modes?.length || 1);
        ST.note((def.modes || ["Select"])[S.d.mode] + " — select a target, then Confirm.");
      } else {
        def.pass?.(i);
        strategyNext();
      }
      strategyControlLabels();
    },
    draw() {
      c.save();
      c.scale(W / 600, H / 600);
      ST.bg();
      def.draw();
      c.restore();
    },
  };
}
function strategyStatus() {
  let def = strategyDefs[S.g.id],
    d = S.d;
  if (d.kind === "arena") return def.hint;
  return (
    pname(d.turn) +
    " · " +
    (def.modes?.[d.mode] || "Choose") +
    " · select, then Confirm · round " +
    d.round +
    "/" +
    (def.rounds || 8)
  );
}
function strategyNext() {
  let d = S.d,
    def = strategyDefs[S.g.id];
  d.turns++;
  d.sel = -1;
  d.mode = 0;
  def.afterTurn?.();
  if (d.turns % S.n === 0) {
    def.round?.();
    if (d.turns / S.n >= (def.rounds || 8)) {
      def.end?.();
      finish();
      return;
    }
    d.round++;
    d.first = (d.first + 1) % S.n;
  }
  d.turn = (d.first + (d.turns % S.n)) % S.n;
  d.botWait = botSkill().delay * 1.8;
  strategyControlLabels();
  hud();
}
function strategyControls() {
  const d = S.d,
    def = strategyDefs[S.g.id];
  $("play").dataset.strategy = def.kind;
  $("top").innerHTML = "";
  $("bottom").innerHTML = "";
  for (let i = 0; i < S.n; i++) {
    let node = document.createElement("div");
    node.className = "strategy-pad";
    node.dataset.seat = i;
    node.style.setProperty("--seat", COL[i]);
    let human = i < prefs.humans,
      arenaMode = def.kind === "arena";
    if (!arenaMode && def.modes?.length === 1) node.classList.add("single-mode");
    node.innerHTML =
      '<div class="seat-label">' +
      pname(i) +
      '<span class="seat-resource"></span></div><div class="seat-actions">' +
      (arenaMode
        ? '<div class="stick" role="application" aria-label="' +
          pname(i) +
          ' movement"><span></span></div>'
        : "") +
      '<button class="str-action" data-action="0">' +
      (arenaMode ? def.buttons[0] : "Confirm") +
      '</button><button class="str-action" data-action="1">' +
      (arenaMode ? def.buttons[1] : "Mode") +
      "</button>" +
      (!arenaMode ? '<button class="str-action pass-action" data-action="2">Pass</button>' : "") +
      "</div>";
    node.querySelectorAll("button").forEach((btn) => {
      btn.disabled = !human;
      btn.onclick = () => engines[S.g.id].action(i, +btn.dataset.action);
    });
    if (!arenaMode && def.modes?.length === 1)
      node.querySelector('[data-action="1"]').hidden = true;
    let stick = node.querySelector(".stick");
    if (stick) {
      let pointer = null;
      const stop = () => {
        pointer = null;
        if (S?.d.controls?.[i]) {
          S.d.controls[i].x = 0;
          S.d.controls[i].y = 0;
          S.d.controls[i].held = false;
        }
        stick.querySelector("span").style.transform = "translate(0,0)";
      };
      let steer = (e) => {
        let r = stick.getBoundingClientRect(),
          x = (e.clientX - r.left - r.width / 2) / (r.width * 0.36),
          y = (e.clientY - r.top - r.height / 2) / (r.height * 0.36),
          l = Math.hypot(x, y);
        if (l > 1) {
          x /= l;
          y /= l;
        }
        d.controls[i] = { x, y, held: true };
        stick.querySelector("span").style.transform =
          "translate(" + x * 16 + "px," + y * 16 + "px)";
      };
      stick.onpointerdown = (e) => {
        if (!human || !active()) return;
        e.preventDefault();
        pointer = e.pointerId;
        stick.setPointerCapture(pointer);
        steer(e);
      };
      stick.onpointermove = (e) => {
        if (pointer === e.pointerId && active()) steer(e);
      };
      stick.onpointerup = stop;
      stick.onpointercancel = stop;
      stick.onlostpointercapture = stop;
    }
    $(i < 2 ? "bottom" : "top").appendChild(node);
  }
  strategyControlLabels();
  requestAnimationFrame(() => {
    if (S?.d === d) {
      fit();
      render();
    }
  });
}
function strategyShortMode(t) {
  return (
    {
      Clockwise: "CW",
      Counterclockwise: "CCW",
      "Rotate rail": "Rail",
      "Run marble": "Run",
      Excavate: "Dig",
      "Cash out": "Bank",
      "Build toll": "Toll",
      Dispatch: "Ship",
      Harvest: "Pick",
      Breathe: "Rest",
      Medium: "Med",
      "Play note": "Note",
      Bank: "Bank",
      Normal: "Fwd",
      Reverse: "Rev",
    }[t] || t
  );
}
function strategyControlLabels() {
  if (!S?.d.strategy) return;
  let d = S.d,
    def = strategyDefs[S.g.id];
  document.querySelectorAll(".strategy-pad").forEach((node) => {
    let i = +node.dataset.seat,
      isTurn = d.kind === "arena" || d.turn === i;
    node.classList.toggle("waiting", !isTurn);
    node
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = i >= prefs.humans || !isTurn || !!d.busy));
    let resource = def.resource?.(i) || "";
    node.querySelector(".seat-resource").textContent = resource;
    if (d.kind !== "arena") {
      node.querySelector('[data-action="1"]').textContent = strategyShortMode(
        def.modes?.[d.mode] || "Mode",
      );
      node.querySelector('[data-action="0"]').textContent = isTurn ? "Confirm" : "Wait";
    }
  });
}
// The older studio policy is deliberately bypassed for rebuilt engines. Each new bot uses legal inputs.
const legacyStudioBots = studioBots;
studioBots = function (dt) {
  if (S?.g.strategic) return;
  legacyStudioBots(dt);
};
const strategyOldStart = start;
start = function (id) {
  delete $("play").dataset.strategy;
  strategyOldStart(id);
  if (S.g.strategic) {
    S.message = strategyStatus();
    hud();
  }
};
const strategyOldHome = goHome;
goHome = function () {
  strategyOldHome();
  if ($("play").classList.contains("hidden")) delete $("play").dataset.strategy;
};
function strategyCanvasInput() {
  const old = {
    down: canvas.onpointerdown,
    move: canvas.onpointermove,
    up: canvas.onpointerup,
    cancel: canvas.onpointercancel,
  };
  let touch = null;
  function point(e) {
    let r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 600, y: ((e.clientY - r.top) / r.height) * 600 };
  }
  canvas.onpointerdown = (e) => {
    if (!S?.g.strategic) return old.down?.(e);
    if (!active() || S.d.kind === "arena" || S.d.turn >= prefs.humans) return;
    e.preventDefault();
    touch = e.pointerId;
    canvas.setPointerCapture(touch);
    engines[S.g.id].tap(S.d.turn, point(e));
  };
  canvas.onpointermove = (e) => {
    if (!S?.g.strategic) return old.move?.(e);
    if (active() && touch === e.pointerId) engines[S.g.id].move(S.d.turn, point(e));
  };
  canvas.onpointerup = (e) => {
    if (!S?.g.strategic) return old.up?.(e);
    if (active() && touch === e.pointerId) engines[S.g.id].up(S.d.turn, point(e));
    touch = null;
  };
  canvas.onpointercancel = (e) => {
    touch = null;
    if (!S?.g.strategic) old.cancel?.(e);
  };
}
window.addEventListener("load", strategyCanvasInput);
const strategyClearInput = () => {
  if (S?.d.controls)
    S.d.controls.forEach((p) => {
      p.x = 0;
      p.y = 0;
      p.held = false;
    });
  document.querySelectorAll(".stick span").forEach((n) => (n.style.transform = "translate(0,0)"));
};
window.addEventListener("blur", strategyClearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) strategyClearInput();
});
// Keyboard controls are a genuine alternative, not a tap-score shortcut.
const strategyKeys = [
    ["KeyW", "KeyD", "KeyS", "KeyA", "KeyF", "KeyG"],
    ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Enter", "ShiftRight"],
    ["KeyI", "KeyL", "KeyK", "KeyJ", "KeyO", "KeyP"],
    ["Numpad8", "Numpad6", "Numpad5", "Numpad4", "Numpad1", "Numpad2"],
  ],
  strategyDown = new Set();
window.addEventListener("keydown", (e) => {
  if (!active() || !S?.g.strategic || S.d.kind !== "arena") return;
  for (let i = 0; i < prefs.humans; i++) {
    let keys = strategyKeys[i],
      k = keys.indexOf(e.code);
    if (k < 0) continue;
    e.preventDefault();
    if (k >= 4 && !e.repeat) engines[S.g.id].action(i, k - 4);
    strategyDown.add(e.code);
    S.d.controls[i] = {
      x: +strategyDown.has(keys[1]) - +strategyDown.has(keys[3]),
      y: +strategyDown.has(keys[2]) - +strategyDown.has(keys[0]),
      held: true,
    };
  }
});
window.addEventListener("keyup", (e) => {
  strategyDown.delete(e.code);
  if (!S?.g.strategic || S.d.kind !== "arena") return;
  for (let i = 0; i < prefs.humans; i++) {
    let keys = strategyKeys[i];
    if (keys.includes(e.code))
      S.d.controls[i] = {
        x: +strategyDown.has(keys[1]) - +strategyDown.has(keys[3]),
        y: +strategyDown.has(keys[2]) - +strategyDown.has(keys[0]),
        held: false,
      };
  }
});
window.addEventListener("blur", () => strategyDown.clear());

// TEN TACTICAL ARENAS. Steering, facing, collision, cargo and banking are shared foundations;
// powers and objectives are intentionally different. An action alone never creates points.
const ARENA_IDS = [
  "skyhook",
  "kite",
  "gravity",
  "sea",
  "tongue",
  "ghost",
  "planet",
  "octopus",
  "tide",
  "echo",
];
const arenaSpecs = {
  skyhook: {
    tag: "HARPOON · STEAL · BANK",
    buttons: ["Hook", "Dash"],
    hint: "Steer to aim. Harpoon pulls scrap or steals cargo. Bank at your numbered dock.",
    rule: "Move with your stick; your arrow is your aim. Harpoon scrap toward you, or hit a rival to steal one carried piece. Dash costs energy. Only cargo returned to your own numbered dock scores.",
  },
  kite: {
    tag: "FLY · GUST · DEFEND",
    buttons: ["Gust", "Shield"],
    hint: "Carry ribbons home. Gust rivals away from ribbons; shield blocks gusts.",
    rule: "Steer through the wind, collect up to five ribbons and return to your numbered dock. Cargo slows you. Gust pushes nearby rivals and knocks out cargo; shield counters it. Both consume energy, so choose when to fight.",
  },
  gravity: {
    tag: "ATTRACT · REPEL · DELIVER",
    buttons: ["Attract", "Repel"],
    hint: "Magnet keys into your dock. Attract objects; repel rivals and contest their haul.",
    rule: "Steer your magnet. Attract moves nearby keys toward you; repel pushes keys and rivals away. Up to five keys fit in your hold. Deliver them to your own dock. Fighting drains the same energy needed to escape.",
  },
  sea: {
    tag: "TORPEDO · SILENCE · SALVAGE",
    buttons: ["Fire", "Silent"],
    hint: "Salvage and bank. Torpedoes knock out cargo; Silent evades targeting but slows you.",
    rule: "Steer the submarine and face a rival before firing. Torpedoes spill cargo; a silent shield blocks a hit but slows your movement. Take salvage to your numbered dock to score. Reefs block both boats and shots.",
  },
  tongue: {
    tag: "AIM · SNAP · COUNTER",
    buttons: ["Snap", "Guard"],
    hint: "Face bugs and snap from range. Guard blocks tongue hits; avoid the moving wasp.",
    rule: "Steer to aim your tongue at bugs or rivals. A hit pulls a bug toward you or steals one carried bug from a rival. Guard blocks a hit. The wasp makes you drop your haul. Bank bugs at your own dock.",
  },
  ghost: {
    tag: "FACE · FLASH · EXTRACT",
    buttons: ["Flash", "Ward"],
    hint: "Flash a spirit inside your facing cone, then extract it at your own dock.",
    rule: "Spirits cannot be picked up by walking over them. Aim your arrow and flash inside the cone to capture them. A flash can also stun an unwarded rival and spill cargo. Ward counters it. Bank captured spirits at your numbered dock.",
  },
  planet: {
    tag: "POSITION · KICK · PULL",
    buttons: ["Kick", "Pull"],
    hint: "Face the ball and kick into a rival goal. Your own numbered goal needs defending.",
    rule: "Move around the solar pitch. Kick only works close to the ball and sends it along your arrow. Pull bends the ball toward you at an energy cost. Score in any rival goal; an own goal awards nobody. Solo: attack the opposite practice goal.",
  },
  octopus: {
    tag: "TETHER · TUG · CONTEST",
    buttons: ["Tether", "Tug"],
    hint: "Attach to a nearby crate, steer home, and tug. Rival tethers pull in opposition.",
    rule: "Move near a crate and use Tether to attach or release. Your tether pulls it as you move; rivals can attach to the same crate. Tug gives a brief stronger pull but drains energy. A crate delivered to your own dock scores its printed value.",
  },
  tide: {
    tag: "RAID · READ TIDE · ESCAPE",
    buttons: ["Sprint", "Raft"],
    hint: "The central flood expands. Watch oxygen, raid at low tide, and bank before the surge.",
    rule: "Treasure is inside the tidal basin. Read the expanding flood ring: underwater oxygen drains, and running out drops cargo. Sprint crosses gaps; Raft protects you briefly. Return treasure to your numbered dock rather than staying in the basin.",
  },
  echo: {
    tag: "SONAR · REMEMBER · DELIVER",
    buttons: ["Ping", "Burst"],
    hint: "Ping reveals parcels briefly. Remember locations, collect them and return home.",
    rule: "Parcels are only drawn during your sonar reveal. Ping costs energy, so remember the layout and steer to unseen parcels between pings. Burst trades energy for speed. Only returning parcels to your own numbered dock scores. Bots also need sonar.",
  },
};
function arenaBase(i, n = S.n) {
  return n === 1
    ? { x: 80, y: 520 }
    : [
        { x: 80, y: 520 },
        { x: 520, y: 520 },
        { x: 80, y: 80 },
        { x: 520, y: 80 },
      ][i];
}
function arenaBlock(p, r = 16) {
  return S.d.walls.some(
    (o) => p.x > o.x - r && p.x < o.x + o.w + r && p.y > o.y - r && p.y < o.y + o.h + r,
  );
}
function arenaSpend(i, cost, cd = 0.8) {
  let p = S.d.players[i];
  if (p.cd > 0 || p.energy < cost || p.stun > 0) return false;
  p.energy -= cost;
  p.cd = cd;
  return true;
}
function arenaDrop(p, amount = 99) {
  let d = S.d,
    n = Math.min(p.carry, amount);
  for (let k = 0; k < n; k++) {
    let o = d.loot.find((v) => v.sleep > 0);
    if (!o) break;
    Object.assign(o, {
      x: clamp(p.x + rand(-25, 25), 35, 565),
      y: clamp(p.y + rand(-25, 25), 35, 565),
      sleep: 0,
      v: 1,
    });
  }
  p.carry -= n;
}
function arenaShot(i, type) {
  let p = S.d.players[i];
  S.d.shots.push({
    x: p.x + p.dx * 20,
    y: p.y + p.dy * 20,
    vx: p.dx * 290,
    vy: p.dy * 290,
    owner: i,
    type,
    life: 1.6,
  });
}
function arenaPush(i, power, radius) {
  let d = S.d,
    p = d.players[i];
  d.players.forEach((q, j) => {
    let l = dist(p, q);
    if (j !== i && l < radius && q.shield <= 0) {
      let dx = (q.x - p.x) / (l || 1),
        dy = (q.y - p.y) / (l || 1);
      q.x = clamp(q.x + dx * power, 24, 576);
      q.y = clamp(q.y + dy * power, 24, 576);
      if (arenaBlock(q)) {
        q.x = q.safeX;
        q.y = q.safeY;
      }
      q.stun = 0.35;
      arenaDrop(q, 1);
    }
  });
}
for (const id of ARENA_IDS) {
  let spec = arenaSpecs[id];
  strategyRegister(id, {
    kind: "arena",
    ...spec,
    init() {
      let d = S.d;
      d.players = many((i) => {
        let a = arenaBase(i);
        return {
          ...a,
          safeX: a.x,
          safeY: a.y,
          dx: (300 - a.x) / Math.hypot(300 - a.x, 300 - a.y),
          dy: (300 - a.y) / Math.hypot(300 - a.x, 300 - a.y),
          energy: 100,
          cd: 0,
          shield: 0,
          stun: 0,
          boost: 0,
          carry: 0,
          oxygen: 100,
          reveal: 2,
          tether: -1,
          bot: 0,
        };
      });
      d.walls =
        mi() === 0
          ? [
              { x: 155, y: 245, w: 80, h: 24 },
              { x: 365, y: 331, w: 80, h: 24 },
            ]
          : mi() === 1
            ? [
                { x: 260, y: 150, w: 30, h: 115 },
                { x: 310, y: 335, w: 30, h: 115 },
              ]
            : [
                { x: 160, y: 210, w: 95, h: 24 },
                { x: 345, y: 366, w: 95, h: 24 },
                { x: 280, y: 277, w: 40, h: 46 },
              ];
      if (id === "planet") d.walls = [];
      d.loot = Array.from({ length: 12 }, (_, k) => {
        let a = (k / 12) * Math.PI * 2;
        let r = 90 + (k % 3) * 38;
        return { x: 300 + Math.cos(a) * r, y: 300 + Math.sin(a) * r, v: 1 + (k % 2), sleep: 0 };
      });
      d.shots = [];
      d.ball = { x: 300, y: 300, vx: 0, vy: 0, last: -1 };
      d.crates = [
        { x: 260, y: 290, v: 3 },
        { x: 380, y: 280, v: 4 },
        { x: 300, y: 180, v: 2 },
      ];
      for (let o of [...d.loot, ...d.crates])
        if (arenaBlock(o, 20)) {
          let choices = [];
          for (let x = 100; x <= 500; x += 80)
            for (let y = 100; y <= 500; y += 80)
              if (
                !arenaBlock({ x, y }, 24) &&
                many((i) => arenaBase(i)).every((b) => dist(b, { x, y }) > 130)
              )
                choices.push({ x, y });
          let best = choices.sort((a, b) => dist(a, o) - dist(b, o))[0];
          if (best) {
            o.x = best.x;
            o.y = best.y;
          }
        }
      d.wasp = { x: 300, y: 300 };
      d.flood = 80;
    },
    resource(i) {
      let p = S.d.players[i];
      return (
        Math.round(p.energy) +
        "⚡ " +
        (id === "planet"
          ? ""
          : id === "octopus"
            ? p.tether >= 0
              ? "tether " + (p.tether + 1)
              : "free"
            : id === "tide"
              ? Math.round(p.oxygen) + "% O₂"
              : p.carry + "/5")
      );
    },
    action(i, k) {
      let d = S.d,
        p = d.players[i];
      if (id === "octopus") {
        if (k === 0) {
          if (p.tether >= 0) p.tether = -1;
          else {
            let best = d.crates.map((q, j) => ({ j, l: dist(p, q) })).sort((a, b) => a.l - b.l)[0];
            if (best.l < 100) p.tether = best.j;
            else ST.note("Move within the dotted tether range.");
          }
          return;
        }
        if (arenaSpend(i, 22, 0.9)) p.boost = 0.65;
        return;
      }
      if (id === "planet") {
        if (k === 0) {
          if (dist(p, d.ball) > 57) {
            ST.note("Get closer to the ball before kicking.");
            return;
          }
          if (arenaSpend(i, 18, 0.55)) {
            d.ball.vx = p.dx * 480;
            d.ball.vy = p.dy * 480;
            d.ball.last = i;
          }
        } else if (arenaSpend(i, 32, 1.1)) {
          let b = d.ball,
            l = dist(p, b);
          if (l < 180) {
            b.vx += ((p.x - b.x) / (l || 1)) * 190;
            b.vy += ((p.y - b.y) / (l || 1)) * 190;
            b.last = i;
          }
        }
        return;
      }
      if (id === "echo") {
        if (arenaSpend(i, k === 0 ? 28 : 35, k === 0 ? 1.4 : 1)) {
          if (k === 0) p.reveal = 2.4 - mi() * 0.35;
          else p.boost = 0.65;
        }
        return;
      }
      if (id === "tide") {
        if (arenaSpend(i, k === 0 ? 28 : 40, k === 0 ? 1 : 2)) {
          if (k === 0) p.boost = 0.75;
          else p.shield = 2.5;
        }
        return;
      }
      if (k === 1 && id !== "gravity" && id !== "skyhook") {
        if (arenaSpend(i, 30, 1.3)) p.shield = 1.8;
        return;
      }
      if (id === "gravity") {
        if (!arenaSpend(i, 24, 0.8)) return;
        let sign = k === 0 ? 1 : -1;
        d.loot.forEach((o) => {
          let l = dist(p, o);
          if (o.sleep <= 0 && l < 140) {
            o.x = clamp(o.x + ((p.x - o.x) / (l || 1)) * 55 * sign, 30, 570);
            o.y = clamp(o.y + ((p.y - o.y) / (l || 1)) * 55 * sign, 30, 570);
          }
        });
        if (k === 1) arenaPush(i, 60, 130);
        return;
      }
      if (id === "kite") {
        if (arenaSpend(i, 32, 1)) arenaPush(i, 100, 135);
        return;
      }
      if (id === "ghost") {
        if (!arenaSpend(i, 30, 0.9)) return;
        p.flash = 0.25;
        d.loot.forEach((o) => {
          let dx = o.x - p.x,
            dy = o.y - p.y,
            l = Math.hypot(dx, dy);
          if (o.sleep <= 0 && l < 145 && (dx * p.dx + dy * p.dy) / (l || 1) > 0.65 && p.carry < 5) {
            p.carry = Math.min(5, p.carry + o.v);
            o.sleep = 4;
          }
        });
        d.players.forEach((q, j) => {
          let l = dist(p, q);
          if (
            j !== i &&
            l < 145 &&
            q.shield <= 0 &&
            ((q.x - p.x) * p.dx + (q.y - p.y) * p.dy) / (l || 1) > 0.65
          ) {
            q.stun = 0.65;
            arenaDrop(q, 2);
          }
        });
        return;
      }
      if (id === "skyhook" && k === 1) {
        if (arenaSpend(i, 30, 1)) p.boost = 0.7;
        return;
      }
      if (arenaSpend(i, id === "sea" ? 32 : 24, id === "sea" ? 1.1 : 0.8)) arenaShot(i, id);
    },
    update(dt) {
      let d = S.d;
      d.flood = 100 + (Math.sin(S.elapsed * (0.35 + mi() * 0.06)) * 0.5 + 0.5) * 110;
      d.wasp = {
        x: 300 + Math.cos(S.elapsed * 0.8) * 150,
        y: 300 + Math.sin(S.elapsed * 1.1) * 140,
      };
      d.players.forEach((p, i) => {
        let u = d.controls[i],
          n = Math.hypot(u.x, u.y),
          speed =
            (p.boost > 0 ? 235 : 125) *
            (1 - p.carry * 0.055) *
            (id === "sea" && p.shield > 0 ? 0.6 : 1);
        p.energy = Math.min(100, p.energy + dt * (p.shield > 0 ? 4 : 12));
        p.cd = Math.max(0, p.cd - dt);
        p.stun = Math.max(0, p.stun - dt);
        p.shield = Math.max(0, p.shield - dt);
        p.boost = Math.max(0, p.boost - dt);
        p.flash = Math.max(0, (p.flash || 0) - dt);
        p.reveal = Math.max(0, p.reveal - dt);
        if (n > 0.05 && p.stun <= 0) {
          p.dx = u.x / n;
          p.dy = u.y / n;
          let ox = p.x,
            oy = p.y;
          p.x = clamp(p.x + p.dx * speed * dt * Math.min(n, 1), 24, 576);
          if (arenaBlock(p)) p.x = ox;
          p.y = clamp(p.y + p.dy * speed * dt * Math.min(n, 1), 24, 576);
          if (arenaBlock(p)) p.y = oy;
        }
        p.safeX = p.x;
        p.safeY = p.y;
        if (id === "kite") {
          let ox = p.x;
          p.x = clamp(p.x + Math.sin(S.elapsed * 0.7) * dt * (20 + mi() * 10), 24, 576);
          if (arenaBlock(p)) p.x = ox;
        }
        if (id === "tide") {
          if (dist(p, { x: 300, y: 300 }) < d.flood && p.shield <= 0) {
            p.oxygen -= dt * (25 + mi() * 5);
            if (p.oxygen <= 0) {
              arenaDrop(p);
              Object.assign(p, arenaBase(i), { oxygen: 100, stun: 1 });
              ST.note(pname(i) + " washed back to shore. Cargo dropped.");
            }
          } else p.oxygen = Math.min(100, p.oxygen + dt * 45);
        }
        if (id === "tongue" && dist(p, d.wasp) < 35 && p.shield <= 0 && p.stun <= 0) {
          arenaDrop(p, 2);
          p.stun = 0.7;
        }
        if (!["planet", "octopus", "ghost"].includes(id))
          d.loot.forEach((o) => {
            if (o.sleep <= 0 && p.carry < 5 && dist(p, o) < 25) {
              p.carry = Math.min(5, p.carry + o.v);
              o.sleep = 4 + mi();
            }
          });
        if (!["planet", "octopus"].includes(id) && p.carry && dist(p, arenaBase(i)) < 49) {
          ST.add(i, p.carry);
          p.carry = 0;
        }
      });
      // Body collision makes positioning and blocking meaningful.
      for (let i = 0; i < S.n; i++)
        for (let j = i + 1; j < S.n; j++) {
          let a = d.players[i],
            b = d.players[j],
            l = dist(a, b);
          if (l < 33) {
            let dx = (b.x - a.x) / (l || 1),
              dy = (b.y - a.y) / (l || 1);
            if (!l) dx = 1;
            let push = (33 - l) * 0.5;
            a.x = clamp(a.x - dx * push, 24, 576);
            a.y = clamp(a.y - dy * push, 24, 576);
            b.x = clamp(b.x + dx * push, 24, 576);
            b.y = clamp(b.y + dy * push, 24, 576);
            if (arenaBlock(a)) {
              a.x = a.safeX;
              a.y = a.safeY;
            }
            if (arenaBlock(b)) {
              b.x = b.safeX;
              b.y = b.safeY;
            }
          }
        }
      d.loot.forEach((o, k) => {
        if (o.sleep > 0) {
          o.sleep -= dt;
          if (o.sleep <= 0) {
            let a = k * 2.4 + S.elapsed * 0.1;
            o.x = 300 + Math.cos(a) * (80 + (k % 3) * 38);
            o.y = 300 + Math.sin(a) * (80 + (k % 3) * 38);
            if (arenaBlock(o, 5)) {
              o.x = 300;
              o.y = 300;
            }
          }
        }
      });
      d.shots.forEach((b) => {
        b.life -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 15 || b.x > 585 || b.y < 15 || b.y > 585 || arenaBlock(b, 2)) {
          b.life = 0;
          return;
        }
        let p = d.players[b.owner];
        for (let j = 0; j < S.n; j++) {
          let q = d.players[j];
          if (j === b.owner || dist(b, q) > 23 || b.life <= 0) continue;
          b.life = 0;
          if (q.shield > 0) {
            q.shield = 0;
            continue;
          }
          q.stun = 0.5;
          if ((b.type === "skyhook" || b.type === "tongue") && q.carry > 0 && p.carry < 5) {
            q.carry--;
            p.carry++;
          } else arenaDrop(q, 2);
        }
        if (b.type !== "sea")
          for (let o of d.loot)
            if (o.sleep <= 0 && dist(b, o) < 22 && b.life > 0) {
              o.x = p.x + p.dx * 24;
              o.y = p.y + p.dy * 24;
              b.life = 0;
            }
      });
      d.shots = d.shots.filter((b) => b.life > 0);
      if (id === "octopus")
        d.crates.forEach((o, k) => {
          let vx = 0,
            vy = 0;
          d.players.forEach((p) => {
            if (p.tether === k) {
              let l = dist(o, p);
              if (l > 230) {
                p.tether = -1;
                return;
              }
              let force = (p.boost > 0 ? 150 : 65) / o.v;
              vx += ((p.x - o.x) / (l || 1)) * force;
              vy += ((p.y - o.y) / (l || 1)) * force;
            }
          });
          let ox = o.x,
            oy = o.y;
          o.x = clamp(o.x + vx * dt, 30, 570);
          o.y = clamp(o.y + vy * dt, 30, 570);
          if (arenaBlock(o, 17)) {
            o.x = ox;
            o.y = oy;
          }
          d.players.forEach((p, i) => {
            if (dist(o, arenaBase(i)) < 50) {
              ST.add(i, o.v);
              o.x = 270 + k * 25;
              o.y = 270 + k * 25;
              d.players.forEach((q) => {
                if (q.tether === k) q.tether = -1;
              });
            }
          });
        });
      if (id === "planet") {
        let b = d.ball;
        b.vx *= Math.pow(0.975, dt * 60);
        b.vy *= Math.pow(0.975, dt * 60);
        if (mi() > 0) {
          let dx = 300 - b.x,
            dy = 300 - b.y,
            l = Math.hypot(dx, dy);
          b.vx += (dx / (l || 1)) * dt * (mi() === 2 ? 55 : 28);
          b.vy += (dy / (l || 1)) * dt * (mi() === 2 ? 55 : 28);
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 17 || b.x > 583) {
          b.x = clamp(b.x, 17, 583);
          b.vx *= -0.8;
        }
        if (b.y < 17 || b.y > 583) {
          b.y = clamp(b.y, 17, 583);
          b.vy *= -0.8;
        }
        d.players.forEach((p, i) => {
          let l = dist(b, p);
          if (l < 32) {
            b.x = p.x + ((b.x - p.x) / (l || 1)) * 33;
            b.y = p.y + ((b.y - p.y) / (l || 1)) * 33;
            b.vx += (b.x - p.x) * 2;
            b.vy += (b.y - p.y) * 2;
            b.last = i;
          }
        });
        let goals = S.n === 1 ? [{ x: 520, y: 80 }] : many((i) => arenaBase(i));
        goals.forEach((g, k) => {
          if (dist(b, g) < 55) {
            if (b.last >= 0 && (S.n === 1 || b.last !== k)) ST.add(b.last, 3);
            Object.assign(b, { x: 300, y: 300, vx: 0, vy: 0, last: -1 });
          }
        });
      }
      strategyControlLabels();
    },
    draw() {
      let d = S.d;
      ST.box(13, 13, 574, 574, "#fff9eb88", "#8e9e96", 14);
      if (id === "tide") {
        ST.circle(300, 300, d.flood, "#3b95b32c", "#43859f");
        ST.text("FLOOD", 300, 300, 24, "#39758e");
      }
      d.walls.forEach((o) => ST.box(o.x, o.y, o.w, o.h, "#6b7d73", "#40594f", 4));
      many((i) => {
        let b = arenaBase(i);
        ST.circle(b.x, b.y, id === "planet" ? 55 : 48, TINT[i], COL[i]);
        ST.text(
          (id === "planet" ? "GOAL " : "BANK ") + (i + 1),
          b.x,
          b.y + (b.y > 300 ? 62 : -62),
          20,
          COL[i],
        );
      });
      if (id === "planet" && S.n === 1) {
        ST.circle(520, 80, 55, "#e9d0aa", "#8f602a");
        ST.text("GOAL", 520, 80, 21);
      }
      if (id === "planet") {
        let b = d.ball;
        ST.circle(b.x, b.y, 15, "#fffef3", "#273f4b");
        ST.line({ x: 290, y: 300 }, { x: 310, y: 300 }, "#d1c5a4", 2);
      } else if (id === "octopus") {
        d.crates.forEach((o) => {
          sprite("parcel", o.x, o.y, 56);
          ST.circle(o.x + 24, o.y - 22, 17, "#fff7dd", "#8b7654");
          ST.text(o.v, o.x + 24, o.y - 22, 23);
        });
        d.players.forEach((p) => {
          if (p.tether >= 0) ST.line(p, d.crates[p.tether], "#765131", 4);
        });
      } else {
        let reveal = id !== "echo" || d.players.slice(0, prefs.humans).some((p) => p.reveal > 0);
        d.loot.forEach((o) => {
          if (o.sleep <= 0 && reveal) {
            sprite(
              id === "ghost"
                ? "ghost"
                : id === "tongue"
                  ? "bug"
                  : id === "gravity"
                    ? "gravity"
                    : id === "kite"
                      ? "ribbon"
                      : "coin",
              o.x,
              o.y,
              35,
            );
            if (o.v > 1) ST.text(o.v, o.x + 18, o.y - 16, 20);
          }
        });
      }
      if (id === "tongue") sprite("wasp", d.wasp.x, d.wasp.y, 47);
      d.shots.forEach((b) => {
        ST.line({ x: b.x - b.vx * 0.04, y: b.y - b.vy * 0.04 }, b, COL[b.owner], 6);
      });
      d.players.forEach((p, i) => {
        if (p.flash > 0) {
          c.save();
          c.globalAlpha = 0.3;
          c.fillStyle = "#e9b32c";
          c.beginPath();
          c.moveTo(p.x, p.y);
          let a = Math.atan2(p.dy, p.dx);
          c.arc(p.x, p.y, 145, a - 0.86, a + 0.86);
          c.fill();
          c.restore();
        }
        if (id === "octopus" && i < prefs.humans && p.tether < 0) {
          c.setLineDash([7, 7]);
          ST.circle(p.x, p.y, 100, null, COL[i] + "66");
          c.setLineDash([]);
        }
        if (p.shield > 0) ST.circle(p.x, p.y, 29, null, COL[i]);
        ST.circle(p.x, p.y, 18, COL[i], "#fffaf0");
        ST.text(i + 1, p.x, p.y, 22, "#fff");
        ST.line(
          { x: p.x + p.dx * 21, y: p.y + p.dy * 21 },
          { x: p.x + p.dx * 37, y: p.y + p.dy * 37 },
          COL[i],
          6,
        );
        if (p.carry) ST.text(p.carry, p.x, p.y + 36, 22, COL[i]);
        if (p.stun > 0) ST.text("!", p.x, p.y - 34, 26, "#b7432d");
        if (id === "tide") {
          ST.box(p.x - 21, p.y - 31, 42, 6, "#d6dcce", null, 2);
          ST.box(
            p.x - 21,
            p.y - 31,
            (42 * p.oxygen) / 100,
            6,
            p.oxygen < 30 ? "#b7432d" : "#3f7f91",
            null,
            2,
          );
        }
      });
    },
  });
}

function arenaWaypoint(from, goal) {
  let clear = true;
  for (let t = 0; t <= 20; t++)
    if (
      arenaBlock(
        { x: from.x + ((goal.x - from.x) * t) / 20, y: from.y + ((goal.y - from.y) * t) / 20 },
        24,
      )
    ) {
      clear = false;
      break;
    }
  if (clear) return goal;
  let points = Array.from({ length: 100 }, (_, k) => ({
      x: 30 + (k % 10) * 60,
      y: 30 + Math.floor(k / 10) * 60,
    })),
    free = points.map((p, k) => ({ p, k })).filter((o) => !arenaBlock(o.p, 25)),
    start = free.slice().sort((a, b) => dist(a.p, from) - dist(b.p, from))[0]?.k,
    end = free.slice().sort((a, b) => dist(a.p, goal) - dist(b.p, goal))[0]?.k;
  if (start === undefined || end === undefined) return goal;
  let q = [[start, []]],
    seen = new Set([start]);
  while (q.length) {
    let [k, path0] = q.shift();
    if (k === end) {
      let route = [start, ...path0];
      let pick = route.find((k) => dist(points[k], from) > 50);
      return points[pick ?? end];
    }
    for (let n of ST.neighbors(k, 10))
      if (!seen.has(n) && !arenaBlock(points[n], 25)) {
        seen.add(n);
        q.push([n, path0.concat(n)]);
      }
  }
  return goal;
}

function strategyArenaBots(def, dt) {
  let d = S.d,
    id = S.g.id;
  for (let i = prefs.humans; i < S.n; i++) {
    let p = d.players[i];
    p.bot -= dt;
    if (p.bot > 0) continue;
    let skill = botSkill();
    p.bot = skill.delay;
    let target = arenaBase(i),
      nearestEnemy = d.players
        .map((q, j) => ({ q, j, l: j === i ? 9999 : dist(p, q) }))
        .sort((a, b) => a.l - b.l)[0];
    if (id === "planet") {
      let b = d.ball,
        goal = S.n === 1 ? { x: 520, y: 80 } : arenaBase((i + 1) % S.n),
        l = dist(b, goal);
      target = {
        x: b.x + ((b.x - goal.x) / (l || 1)) * 35,
        y: b.y + ((b.y - goal.y) / (l || 1)) * 35,
      };
      if (dist(p, b) < 60) {
        let dx = goal.x - p.x,
          dy = goal.y - p.y,
          n = Math.hypot(dx, dy);
        p.dx = dx / n;
        p.dy = dy / n;
        def.action(i, 0);
      } else if (dist(p, b) < 130 && p.energy > 60) def.action(i, 1);
    } else if (id === "octopus") {
      if (p.tether < 0) {
        let o = d.crates.map((q, j) => ({ q, j, l: dist(p, q) })).sort((a, b) => a.l - b.l)[0];
        target = o.q;
        if (o.l < 95) def.action(i, 0);
      } else {
        let crate = d.crates[p.tether],
          waypoint = arenaWaypoint(crate, arenaBase(i)),
          vx = waypoint.x - crate.x,
          vy = waypoint.y - crate.y,
          l = Math.hypot(vx, vy);
        target = {
          x: clamp(crate.x + (vx / (l || 1)) * Math.min(l, 130), 24, 576),
          y: clamp(crate.y + (vy / (l || 1)) * Math.min(l, 130), 24, 576),
        };
        if (p.energy > 35) def.action(i, 1);
      }
    } else {
      let visible = id !== "echo" || p.reveal > 0;
      if (p.carry < 3 && !(id === "tide" && p.oxygen < 45)) {
        let options = d.loot.filter((o) => o.sleep <= 0 && visible);
        if (options.length) {
          let o = options.sort((a, b) => dist(a, p) / a.v - dist(b, p) / b.v)[0];
          target = o;
          p.memory = { x: o.x, y: o.y };
        } else if (id === "echo") {
          target = p.memory || { x: 300, y: 300 };
          if (p.energy > 35) def.action(i, 0);
        }
      }
      if (id === "tide" && p.oxygen < 40) {
        target = arenaBase(i);
        if (p.energy > 42) def.action(i, 1);
      }
      if (id === "ghost" && dist(p, target) < 140) {
        let dx = target.x - p.x,
          dy = target.y - p.y,
          l = Math.hypot(dx, dy);
        p.dx = dx / (l || 1);
        p.dy = dy / (l || 1);
        def.action(i, 0);
      }
      if (["skyhook", "tongue"].includes(id) && dist(p, target) < 160 && p.carry < 3)
        def.action(i, 0);
      if (id === "gravity" && p.carry < 4) def.action(i, 0);
      if (nearestEnemy.l < 100 && nearestEnemy.q.carry > 0 && p.energy > 50) {
        if (["sea", "tongue", "skyhook"].includes(id)) {
          let q = nearestEnemy.q,
            l = nearestEnemy.l;
          p.dx = (q.x - p.x) / (l || 1);
          p.dy = (q.y - p.y) / (l || 1);
        }
        def.action(i, 0);
      }
      if (nearestEnemy.l < 100 && p.carry >= 3 && p.energy > 40) def.action(i, 1);
    }
    let dx = target.x - p.x,
      dy = target.y - p.y,
      l = Math.hypot(dx, dy),
      x = dx / (l || 1),
      y = dy / (l || 1);
    let probe = { x: p.x + x * 48, y: p.y + y * 48 };
    if (arenaBlock(probe, 20)) {
      let left = { x: p.x - y * 50, y: p.y + x * 50 },
        right = { x: p.x + y * 50, y: p.y - x * 50 };
      if (!arenaBlock(left, 20) && left.x > 25 && left.x < 575 && left.y > 25 && left.y < 575) {
        let t = x;
        x = -y;
        y = t;
      } else if (!arenaBlock(right, 20)) {
        let t = x;
        x = y;
        y = -t;
      } else {
        x = -x;
        y = -y;
      }
    }
    if (Math.random() < skill.error) {
      x += rand(-0.7, 0.7);
      y += rand(-0.7, 0.7);
    }
    d.controls[i] = { x: l < 12 ? 0 : x, y: l < 12 ? 0 : y, held: true };
  }
}
// TWELVE PLANNING / BOARD SYSTEMS. Public legal previews and fixed rounds replace tap races.
function tableRegister(id, def) {
  let init = def.init;
  strategyRegister(id, {
    kind: "table",
    ...def,
    init() {
      init();
      S.d.botWait = botSkill().delay * 1.8;
    },
    bot(i) {
      let list = def.choices(i);
      if (!list.length) {
        engines[id].action(i, 2);
        return;
      }
      list.sort((a, b) => b.v - a.v);
      let pick = Math.random() < botSkill().error ? chosen(list) : list[0];
      S.d.sel = pick.sel;
      S.d.mode = pick.mode || 0;
      def.botSelect?.(pick);
      engines[id].action(i, 0);
    },
  });
}
function gridTap(g) {
  return (i, p) => {
    S.d.sel = ST.index(p, g);
  };
}
function invalid(t) {
  ST.note(t);
  return false;
}
function miniCards(items, selected, y = 510) {
  let w = 540 / items.length;
  items.forEach((a, k) => {
    ST.box(
      34 + k * w,
      y,
      w - 8,
      76,
      k === selected ? TINT[S.d.turn] : "#fffbef",
      k === selected ? COL[S.d.turn] : "#b9bba7",
    );
    (Array.isArray(a) ? a : [a]).forEach((v, j) =>
      ST.text(v, 30 + (k + 0.5) * w, y + 22 + j * 28, 22),
    );
  });
}
function miniAt(p, n, y = 510) {
  return p.y >= y && p.y < y + 76 ? ST.cardAt({ ...p, y: y + 10 }, n, y) : -1;
}

function moleDistance(start, targets, rocks, occupied) {
  if (!targets.length) return 30;
  let q = [{ k: start, v: 0 }],
    seen = new Map();
  while (q.length) {
    q.sort((a, b) => a.v - b.v);
    let o = q.shift();
    if (seen.has(o.k)) continue;
    seen.set(o.k, o.v);
    if (targets.includes(o.k)) return o.v;
    for (let k of ST.neighbors(o.k))
      if (!occupied.has(k) && !seen.has(k)) q.push({ k, v: o.v + (rocks.has(k) ? 2 : 1) });
  }
  return 50;
}
function golemDistance(start, rune) {
  let q = [{ k: start, v: 0 }],
    seen = new Set();
  while (q.length) {
    let o = q.shift();
    if (seen.has(o.k)) continue;
    seen.add(o.k);
    for (let p of PROGRAMS)
      for (let a of [p, p.slice().reverse()]) {
        let k = o.k;
        for (let cmd of a) {
          let x = (k % 5) + [0, 1, 0, -1][cmd],
            y = Math.floor(k / 5) + [-1, 0, 1, 0][cmd],
            n = y * 5 + x;
          if (x < 0 || x > 4 || y < 0 || y > 4 || S.d.walls.has(n)) continue;
          k = n;
          if (k === rune) return o.v + 1;
        }
        if (!seen.has(k)) q.push({ k, v: o.v + 1 });
      }
  }
  return 40;
}

const G6 = ST.grid(6, 6, 88, 480);
tableRegister("fossil", {
  tag: "DEDUCE · SCAN · EXCAVATE",
  modes: ["Scan", "Excavate"],
  rule: "Select a square, then Confirm. Scan costs 1 tool and reveals the number of fossils in its eight neighbours—not whether the square itself contains one. Excavate costs 2 tools: a fossil earns 4, an empty hole costs 1 point. Everyone shares clues. You regain 2 tools each round. Plan from the numbers instead of digging blindly.",
  init() {
    let d = S.d;
    d.bones = new Set(shuffle([...Array(36).keys()]).slice(0, 8 + mi()));
    d.revealed = Array(36).fill(false);
    d.clues = Array(36).fill(-1);
    d.tools = many(() => 6);
  },
  resource(i) {
    return S.d.tools[i] + " tools";
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (k < 0 || d.revealed[k]) return invalid("Choose an unexcavated square.");
    let cost = d.mode === 0 ? 1 : 2;
    if (d.tools[i] < cost) return invalid("Not enough tools. Pass to wait for the next round.");
    if (d.mode === 0 && d.clues[k] >= 0) return invalid("That clue is already visible.");
    d.tools[i] -= cost;
    if (d.mode === 0) {
      d.clues[k] = ST.cellsNear(k).filter((n) => d.bones.has(n)).length;
      ST.note("Clue: " + d.clues[k] + " fossils around this square.");
    } else {
      d.revealed[k] = true;
      ST.add(i, d.bones.has(k) ? 4 : -1);
      d.clues[k] = ST.cellsNear(k).filter((n) => d.bones.has(n)).length;
      ST.note(d.bones.has(k) ? "Fossil preserved: +4." : "Empty excavation: −1.");
    }
    return true;
  },
  round() {
    S.d.tools = S.d.tools.map((n) => Math.min(8, n + 2));
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 36; k++)
      if (!d.revealed[k]) {
        let known = ST.cellsNear(k).filter((n) => d.clues[n] >= 0),
          risk =
            known.reduce(
              (v, n) =>
                v +
                (d.clues[n] -
                  ST.cellsNear(n).filter((q) => d.revealed[q] && d.bones.has(q)).length) /
                  Math.max(1, ST.cellsNear(n).filter((q) => !d.revealed[q]).length),
              0,
            ) / (known.length || 1);
        if (d.tools[i] >= 1 && d.clues[k] < 0)
          a.push({ sel: k, mode: 0, v: 0.7 + known.length * 0.05 });
        if (d.tools[i] >= 2)
          a.push({ sel: k, mode: 1, v: risk * 5 - 1 + (known.length ? 0 : -0.2) });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Shared dig site",
      d.bones.size -
        d.revealed.filter((v, k) => v && d.bones.has(k)).length +
        " fossils still buried · numbers count neighbours",
    );
    ST.cells(G6, (k, p) => {
      if (d.revealed[k]) {
        ST.box(p.x - 37, p.y - 37, 74, 74, d.bones.has(k) ? "#e9d295" : "#d8d5c8");
        if (d.bones.has(k)) sprite("fossil", p.x, p.y, 50);
        else ST.text("·", p.x, p.y, 25);
      } else if (d.clues[k] >= 0)
        ST.text(d.clues[k], p.x, p.y, 32, d.clues[k] ? "#315e79" : "#83968b");
      else ST.text("?", p.x, p.y, 27, "#9a927d");
    });
    ST.select(d.sel, G6);
  },
});
tableRegister("mole", {
  tag: "TUNNEL · ROUTE · RETURN",
  modes: ["Move", "Dig"],
  rounds: 20,
  rule: "Your numbered mole starts at its coloured postbox. Select an adjacent square: Move walks onto clear soil; Dig removes a rock but does not move you. Rocks cost 2 energy; walking costs 1. Collect a shared parcel, then return to your own postbox for 5 points. Everyone can use a tunnel after it is dug. Regain 1 energy each turn.",
  init() {
    let d = S.d;
    d.pos = [30, 35, 0, 5].slice(0, S.n);
    d.bases = d.pos.slice();
    d.rocks = new Set(
      (mi() === 1 ? [8, 9, 13, 14, 20, 22, 26, 27] : [7, 9, 13, 16, 19, 22, 26, 28]).filter(
        (k) => !d.pos.includes(k),
      ),
    );
    if (mi() === 2) [8, 14, 21, 27].forEach((k) => d.rocks.add(k));
    d.mail = new Set([14, 20, 15].filter((k) => !d.rocks.has(k)));
    if (!d.mail.size) d.mail.add(18);
    d.carry = many(() => false);
    d.energy = many(() => 6);
  },
  resource(i) {
    return S.d.energy[i] + "⚡ " + (S.d.carry[i] ? "MAIL" : "empty");
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (!ST.neighbors(d.pos[i]).includes(k)) return invalid("Choose a square beside your mole.");
    if (d.mode === 1) {
      if (!d.rocks.has(k) || d.energy[i] < 2)
        return invalid("Dig an adjacent rock; it costs 2 energy.");
      d.energy[i] -= 2;
      d.rocks.delete(k);
    } else {
      if (d.rocks.has(k) || d.energy[i] < 1 || d.pos.some((p, j) => j !== i && p === k))
        return invalid("Clear soil only. A rival mole blocks that square.");
      d.energy[i]--;
      d.pos[i] = k;
      if (d.mail.has(k) && !d.carry[i]) {
        d.mail.delete(k);
        d.carry[i] = true;
      }
      if (k === d.bases[i] && d.carry[i]) {
        ST.add(i, 5);
        d.carry[i] = false;
        let empty = [...Array(36).keys()].filter(
          (q) => !d.rocks.has(q) && !d.bases.includes(q) && !d.mail.has(q),
        );
        if (empty.length) d.mail.add(chosen(empty));
      }
    }
    return true;
  },
  afterTurn() {
    S.d.energy = S.d.energy.map((n) => Math.min(7, n + 1));
  },
  choices(i) {
    let d = S.d,
      target = d.carry[i] ? [d.bases[i]] : [...d.mail],
      a = [];
    for (let k of ST.neighbors(d.pos[i])) {
      let occupied = new Set(d.pos.filter((_, j) => j !== i));
      if (occupied.has(k)) continue;
      let route = moleDistance(k, target, d.rocks, occupied);
      if (d.rocks.has(k) && d.energy[i] >= 2) a.push({ sel: k, mode: 1, v: 20 - route - 1 });
      else if (!d.rocks.has(k) && d.energy[i] > 0) a.push({ sel: k, mode: 0, v: 20 - route });
    }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Carry one parcel. Find a route.",
      "Shared tunnels · blocked squares need a Dig turn",
    );
    ST.cells(G6, (k, p) => {
      if (d.rocks.has(k)) {
        ST.box(p.x - 37, p.y - 37, 74, 74, "#6a786e");
        ST.text("ROCK", p.x, p.y, 20, "#fff");
      }
      d.bases.forEach((v, i) => {
        if (v === k) {
          ST.box(p.x - 36, p.y - 36, 72, 72, TINT[i], COL[i]);
          ST.text("P" + (i + 1), p.x, p.y - 21, 21, COL[i]);
        }
      });
      if (d.mail.has(k)) sprite("parcel", p.x, p.y, 43);
      d.pos.forEach((v, i) => {
        if (v === k) {
          ST.circle(p.x, p.y + 6, 23, COL[i]);
          ST.text(i + 1, p.x, p.y + 6, 25, "#fff");
        }
      });
    });
    ST.select(d.sel, G6);
  },
});
const GG = ST.grid(5, 5, 84, 400);
const PROGRAMS = [
  [0, 0, 1],
  [1, 1, 2],
  [2, 2, 3],
  [3, 3, 0],
];
function golemRun(i, program, award = false) {
  let d = S.d,
    k = d.pos[i],
    route = [];
  for (let cmd of program) {
    let x = (k % 5) + [0, 1, 0, -1][cmd],
      y = Math.floor(k / 5) + [-1, 0, 1, 0][cmd],
      next = y * 5 + x;
    if (x < 0 || x > 4 || y < 0 || y > 4 || d.walls.has(next)) continue;
    k = next;
    route.push(k);
    if (award && k === d.rune) {
      ST.add(i, 4);
      d.rune = chosen(
        [...Array(25).keys()].filter((n) => !d.walls.has(n) && !d.pos.includes(n) && n !== k),
      );
    }
  }
  return { k, route };
}
tableRegister("golem", {
  tag: "PROGRAM · PREDICT · BLOCK",
  modes: ["Normal", "Reverse"],
  rounds: 10,
  rule: "Select a three-step program below the grid. The highlighted landing is a legal preview; walls cancel individual steps. Reverse flips the order of the three commands. Confirm runs your program. A rune crossed earns 4 points. Landing on a rival sends it back to its start, so positioning can deny their next route.",
  init() {
    S.d.pos = [20, 24, 0, 4].slice(0, S.n);
    S.d.starts = S.d.pos.slice();
    S.d.rune = 12;
    S.d.walls = new Set(mi() === 0 ? [6, 18] : mi() === 1 ? [6, 8, 16, 18] : [7, 11, 18]);
    S.d.programs = PROGRAMS;
  },
  resource(i) {
    return "cell " + (S.d.pos[i] + 1);
  },
  tap(i, p) {
    S.d.sel = miniAt(p, 4);
  },
  act(i, k) {
    if (k < 0 || k > 3) return invalid("Choose one of the four programs.");
    let a = PROGRAMS[k].slice();
    if (S.d.mode) a.reverse();
    let out = golemRun(i, a, true);
    S.d.pos.forEach((p, j) => {
      if (j !== i && p === out.k) S.d.pos[j] = S.d.starts[j];
    });
    S.d.pos[i] = out.k;
    return true;
  },
  choices(i) {
    return PROGRAMS.flatMap((p, k) =>
      [0, 1].map((mode) => {
        let a = mode ? p.slice().reverse() : p,
          o = golemRun(i, a),
          r = S.d.rune;
        return { sel: k, mode, v: o.route.includes(r) ? 100 : 20 - golemDistance(o.k, r) };
      }),
    );
  },
  draw() {
    let d = S.d;
    ST.banner("Program three steps", "Rune +4 · landing on a rival resets it");
    ST.cells(GG, (k, p) => {
      if (d.walls.has(k)) ST.box(p.x - 37, p.y - 37, 74, 74, "#586c60");
      if (d.rune === k) sprite("coin", p.x, p.y, 42);
      d.pos.forEach((q, i) => {
        if (k === q) {
          ST.circle(p.x, p.y, 24, COL[i]);
          ST.text(i + 1, p.x, p.y, 25, "#fff");
        }
      });
    });
    if (d.sel >= 0) {
      let a = PROGRAMS[d.sel].slice();
      if (d.mode) a.reverse();
      let out = golemRun(d.turn, a),
        last = ST.xy(d.pos[d.turn], GG);
      out.route.forEach((k) => {
        let p = ST.xy(k, GG);
        ST.line(last, p, COL[d.turn], 5);
        last = p;
      });
      ST.select(out.k, GG);
    }
    d.pos.forEach((k, i) => {
      let p = ST.xy(k, GG);
      ST.circle(p.x, p.y, 24, COL[i]);
      ST.text(i + 1, p.x, p.y, 25, "#fff");
    });
    miniCards(
      PROGRAMS.map((p) =>
        (d.mode ? p.slice().reverse() : p).map((k) => ["↑", "→", "↓", "←"][k]).join(" "),
      ),
      d.sel,
    );
  },
});
tableRegister("sunshine", {
  tag: "PLANT · GROW · SHADE",
  modes: ["Plant", "Grow", "Uproot"],
  rule: "Plant beside one of your plants for 2 water, or grow a selected plant for 2 water. Your first seed may go anywhere. Maximum height is 3. A taller neighbouring rival shades you and prevents growth. Uproot one of your plants to recover 2 water. Water refills by 1 / 2 / 3 per round on variants 1 / 2 / 3. After eight rounds, each plant scores its height, plus 3 for an uncontested tallest plant in a row.",
  init() {
    S.d.tiles = Array(36).fill(null);
    S.d.water = many(() => 5);
  },
  resource(i) {
    return S.d.water[i] + " water";
  },
  tap: gridTap(G6),
  act(i, k) {
    let d = S.d;
    if (k < 0) return invalid("Select a garden square.");
    let o = d.tiles[k];
    if (d.mode === 2) {
      if (o?.owner !== i) return invalid("Only your own plants can be uprooted.");
      d.tiles[k] = null;
      d.water[i] += 2;
      return true;
    }
    if (d.water[i] < 2) return invalid("You need 2 water. Pass to replenish.");
    if (d.mode === 0) {
      if (o) return invalid("Plant on empty soil.");
      if (
        d.tiles.some((o) => o?.owner === i) &&
        !ST.neighbors(k).some((n) => d.tiles[n]?.owner === i)
      )
        return invalid("New plants must touch your own roots.");
      d.tiles[k] = { owner: i, h: 1 };
    } else {
      if (!o || o.owner !== i || o.h >= 3) return invalid("Grow your own plant, up to height 3.");
      if (ST.neighbors(k).some((n) => d.tiles[n] && d.tiles[n].owner !== i && d.tiles[n].h > o.h))
        return invalid("A taller rival shades this plant. Grow elsewhere or reroute.");
      o.h++;
    }
    d.water[i] -= 2;
    return true;
  },
  round() {
    S.d.water = S.d.water.map((n) => Math.min(9, n + mi() + 1));
  },
  end() {
    let d = S.d;
    d.tiles.forEach((o) => {
      if (o) ST.add(o.owner, o.h);
    });
    for (let row = 0; row < 6; row++) {
      let a = d.tiles.slice(row * 6, row * 6 + 6).filter(Boolean),
        max = Math.max(0, ...a.map((o) => o.h)),
        leaders = a.filter((o) => o.h === max);
      if (leaders.length === 1) ST.add(leaders[0].owner, 3);
    }
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 36; k++) {
      let o = d.tiles[k];
      if (d.water[i] >= 2) {
        if (
          !o &&
          (!d.tiles.some((t) => t?.owner === i) ||
            ST.neighbors(k).some((n) => d.tiles[n]?.owner === i))
        )
          a.push({ sel: k, mode: 0, v: 4 + ST.neighbors(k).filter((n) => !d.tiles[n]).length });
        if (
          o?.owner === i &&
          o.h < 3 &&
          !ST.neighbors(k).some((n) => d.tiles[n] && d.tiles[n].owner !== i && d.tiles[n].h > o.h)
        )
          a.push({ sel: k, mode: 1, v: 7 + o.h });
      }
    }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Grow into the light",
      "Water +" + (mi() + 1) + "/round · heights + row bonuses at end",
    );
    ST.cells(G6, (k, p) => {
      let o = d.tiles[k];
      if (o) {
        ST.box(p.x - 35, p.y - 35, 70, 70, TINT[o.owner], COL[o.owner]);
        sprite("sunshine", p.x, p.y - 3, 46);
        ST.text("P" + (o.owner + 1) + " · " + o.h, p.x, p.y + 25, 21, COL[o.owner]);
      }
    });
    ST.select(d.sel, G6);
  },
});
tableRegister("orchard", {
  tag: "GROW · WAIT · HARVEST",
  modes: ["Harvest", "Lamp"],
  rule: "Fruit ripens by one stage in the sunlit column each round. Select and harvest fruit at stage 2–4 for its stage in points; stage 5 rots to zero. Lamp costs a turn to ripen a square and its neighbours by one stage—use it to set up a harvest or spoil a rival’s opportunity. After a harvest, a new stage-0 fruit grows there.",
  init() {
    S.d.fruit = Array.from({ length: 25 }, (_, k) => (k + mi()) % 4);
    S.d.sun = mi() % 5;
  },
  tap: gridTap(ST.grid(5, 5, 88, 480)),
  act(i, k) {
    if (k < 0 || k >= 25) return invalid("Select a fruit square.");
    let d = S.d;
    if (d.mode === 0) {
      if (d.fruit[k] < 2) return invalid("Fruit needs stage 2 before harvesting.");
      ST.add(i, d.fruit[k]);
      d.fruit[k] = 0;
    } else {
      for (let n of [k, ...ST.neighbors(k, 5)]) d.fruit[n] = (d.fruit[n] + 1) % 5;
    }
    return true;
  },
  round() {
    let d = S.d;
    for (let k = 0; k < 25; k++) if (k % 5 === d.sun) d.fruit[k] = (d.fruit[k] + 1) % 5;
    d.sun = (d.sun + 1) % 5;
  },
  choices() {
    return S.d.fruit.flatMap((v, k) =>
      v >= 2
        ? [{ sel: k, mode: 0, v: v * 3 }]
        : [{ sel: k, mode: 1, v: ST.neighbors(k, 5).filter((n) => S.d.fruit[n] === 1).length - 1 }],
    );
  },
  draw() {
    let d = S.d,
      g = ST.grid(5, 5, 88, 480);
    ST.banner(
      "Wait for ripe. Do not wait too long.",
      "Next sunlight: column " + (d.sun + 1) + " · stage 5 rots",
    );
    ST.cells(g, (k, p) => {
      if (k % 5 === d.sun)
        ST.box(p.x - g.cell / 2 + 3, p.y - g.cell / 2 + 3, g.cell - 6, g.cell - 6, "#f2df9e66");
      sprite("orchard", p.x, p.y - 7, 46);
      ST.text(d.fruit[k] + " / 4", p.x, p.y + 29, 23, d.fruit[k] >= 2 ? "#377146" : "#827a6b");
    });
    ST.select(d.sel, g);
  },
});
tableRegister("parcel", {
  tag: "DISPATCH · TOLL · CONGESTION",
  modes: ["Dispatch", "Build toll"],
  rounds: 10,
  rule: "Choose one of three routes. Dispatch spends 1 coin; routes pay 3 / 5 / 8 after 1 / 2 / 3 rounds. Every shipment already on the route adds one round of congestion. A rival toll transfers 1 of your eventual payout to its owner. Build toll costs 3 coins and claims an unowned route. Gain 1 coin each round. Undelivered parcels are lost at the end, so watch the deadline.",
  init() {
    S.d.coins = many(() => 5 - mi());
    S.d.tolls = [-1, -1, -1];
    S.d.shipments = [];
  },
  resource(i) {
    return S.d.coins[i] + " coins";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 160);
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 2) return invalid("Select a route card.");
    if (d.mode === 1) {
      if (d.tolls[k] >= 0 || d.coins[i] < 3)
        return invalid("A toll costs 3 coins on an unowned route.");
      d.coins[i] -= 3;
      d.tolls[k] = i;
    } else {
      if (d.coins[i] < 1) return invalid("Dispatch costs 1 coin.");
      d.coins[i]--;
      d.shipments.push({
        owner: i,
        route: k,
        eta: k + 1 + d.shipments.filter((o) => o.route === k).length,
        value: [3, 5, 8][k],
      });
    }
    return true;
  },
  round() {
    let d = S.d;
    d.coins = d.coins.map((n) => n + 1);
    d.shipments.forEach((o) => o.eta--);
    let done = d.shipments.filter((o) => o.eta <= 0);
    done.forEach((o) => parcelPay(o));
    d.shipments = d.shipments.filter((o) => o.eta > 0);
  },
  end() {
    S.d.shipments = [];
  },
  choices(i) {
    let d = S.d;
    return [0, 1, 2].flatMap((k) => {
      let a = [];
      if (d.coins[i] >= 1)
        a.push({
          sel: k,
          mode: 0,
          v:
            [3, 5, 8][k] / (k + 1 + d.shipments.filter((o) => o.route === k).length) -
            +(d.tolls[k] >= 0 && d.tolls[k] !== i),
        });
      if (d.coins[i] >= 3 && d.tolls[k] < 0 && d.round < 5 && S.n > 1)
        a.push({ sel: k, mode: 1, v: 3.4 - k * 0.25 });
      return a;
    });
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Public routes. Real congestion.",
      "Tolls transfer points · queued parcels add delay",
    );
    ST.cards(
      [0, 1, 2].map((k) => [
        "ROUTE " + (k + 1),
        [3, 5, 8][k] + "pt / " + (k + 1 + d.shipments.filter((o) => o.route === k).length) + "rd",
      ]),
      d.sel,
      160,
    );
    [0, 1, 2].forEach((k) => {
      let x = 120 + k * 180;
      ST.text(
        d.tolls[k] < 0 ? "No toll" : "Toll P" + (d.tolls[k] + 1),
        x,
        294,
        23,
        d.tolls[k] < 0 ? STR.muted : COL[d.tolls[k]],
      );
      let q = d.shipments.filter((o) => o.route === k);
      q.slice(0, 6).forEach((o, j) => {
        ST.box(x - 78, 330 + j * 36, 156, 31, TINT[o.owner], COL[o.owner]);
        ST.text("P" + (o.owner + 1) + " · ETA " + o.eta, x, 346 + j * 36, 21, COL[o.owner]);
      });
    });
  },
});
function parcelPay(o) {
  let toll = S.d.tolls[o.route],
    tax = toll >= 0 && toll !== o.owner ? 1 : 0;
  ST.add(o.owner, o.value - tax);
  if (tax) ST.add(toll, 1);
}
const RECIPES = [
  { need: [2, 1, 0], v: 5, heat: 2 },
  { need: [0, 2, 2], v: 7, heat: 3 },
  { need: [2, 0, 3], v: 9, heat: 4 },
];
tableRegister("potion", {
  tag: "DRAFT · BREW · STABILISE",
  modes: ["Gather", "Brew", "Cool"],
  rounds: 10,
  rule: "Gather one ingredient from the limited shared stock, or select a recipe and Brew it from your inventory. Brewing increases shared instability; at 10 it explodes and everyone loses one of every ingredient. Cool spends your turn reducing instability by 4. Recipes pay 5 / 7 / 9. Stock refills by one of each ingredient each round.",
  init() {
    S.d.stock = [2 + mi(), 4 - mi(), 3];
    S.d.inv = many(() => [1, 1, 1]);
    S.d.heat = mi() * 2;
  },
  resource(i) {
    return S.d.inv[i].join(" / ");
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, p.y < 300 ? 160 : 365) + (p.y < 300 ? 0 : 3);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      if (d.heat <= 0) return invalid("The cauldron is already stable.");
      d.heat = Math.max(0, d.heat - 4);
      return true;
    }
    if (d.mode === 0) {
      if (k < 0 || k > 2 || d.stock[k] <= 0)
        return invalid("Select an ingredient with remaining stock.");
      d.stock[k]--;
      d.inv[i][k]++;
    } else {
      if (k < 3 || k > 5) return invalid("Select a recipe in the lower row.");
      let r = RECIPES[k - 3];
      if (r.need.some((n, j) => d.inv[i][j] < n))
        return invalid("Missing ingredients. Inventory order: Fire / Water / Herb.");
      r.need.forEach((n, j) => (d.inv[i][j] -= n));
      ST.add(i, r.v);
      d.heat += r.heat;
      if (d.heat >= 10) {
        d.inv = d.inv.map((a) => a.map((n) => Math.max(0, n - 1)));
        d.heat = 0;
        ST.note("Cauldron burst: everyone lost one of each ingredient.");
      }
    }
    return true;
  },
  round() {
    S.d.stock = S.d.stock.map((n) => Math.min(5, n + 1));
  },
  choices(i) {
    let d = S.d,
      a = [];
    RECIPES.forEach((r, k) => {
      if (r.need.every((n, j) => d.inv[i][j] >= n)) a.push({ sel: k + 3, mode: 1, v: r.v + 3 });
    });
    for (let k = 0; k < 3; k++)
      if (d.stock[k] > 0) a.push({ sel: k, mode: 0, v: 4 - d.inv[i][k] + (k === 2 ? 0.3 : 0) });
    if (d.heat >= 7) a.push({ sel: 0, mode: 2, v: 3 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Ingredient market",
      "Instability " + d.heat + "/10 · your bag: " + d.inv[d.turn].join(" / "),
    );
    ST.cards(
      ["FIRE", "WATER", "HERB"].map((s, k) => [s, "Stock " + d.stock[k]]),
      d.sel,
      160,
    );
    ST.text("RECIPES · Fire / Water / Herb", 300, 325, 23);
    ST.cards(
      RECIPES.map((r) => [r.need.join(" / "), r.v + " pts · +" + r.heat + " risk"]),
      d.sel - 3,
      365,
    );
    ST.text("Cool = −4 instability, no ingredients", 300, 526, 22, STR.muted);
  },
});
const SHAPES = [
  [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
];
function roomShape(k, rot) {
  let a = SHAPES[k].map((p) => p.slice());
  for (let n = 0; n < rot; n++) a = a.map(([x, y]) => [-y, x]);
  let mx = Math.min(...a.map((p) => p[0])),
    my = Math.min(...a.map((p) => p[1]));
  return a.map(([x, y]) => [x - mx, y - my]);
}
function roomCells(sel, shape) {
  let x = sel % 6,
    y = Math.floor(sel / 6),
    a = shape.map(([dx, dy]) => [x + dx, y + dy]);
  return a.some(([x, y]) => x < 0 || x >= 6 || y < 0 || y >= 6) ? [] : a.map(([x, y]) => y * 6 + x);
}
tableRegister("room", {
  tag: "DRAFT · ROTATE · PACK",
  modes: ["0°", "90°", "180°", "270°"],
  rule: "Choose one of three pieces below the shared floor, then select the top-left placement square. Mode rotates the piece; the outlined footprint is the placement preview. Confirm fits it without overlap. Each new tile scores 1. Completing a row or column earns 4 extra for the placer, then that line clears. Deny rivals easy completions.",
  init() {
    S.d.floor = Array(36).fill(-1);
    S.d.offer = [mi() % 4, (mi() + 1) % 4, (mi() + 2) % 4];
    S.d.piece = 0;
  },
  tap(i, p) {
    let k = miniAt(p, 3);
    if (k >= 0) S.d.piece = k;
    else S.d.sel = ST.index(p, ST.grid(6, 6, 76, 420));
  },
  act(i, k) {
    let d = S.d;
    if (k < 0) return invalid("Choose a piece and a placement square.");
    let cells = roomCells(k, roomShape(d.offer[d.piece], d.mode));
    if (!cells.length || cells.some((n) => d.floor[n] >= 0))
      return invalid("That shape overlaps or runs off the floor.");
    cells.forEach((n) => (d.floor[n] = i));
    ST.add(i, cells.length);
    let clear = new Set();
    for (let n = 0; n < 6; n++) {
      let row = [0, 1, 2, 3, 4, 5].map((x) => n * 6 + x),
        col = [0, 1, 2, 3, 4, 5].map((y) => y * 6 + n);
      for (let a of [row, col])
        if (a.every((q) => d.floor[q] >= 0)) {
          a.forEach((q) => clear.add(q));
          ST.add(i, 4);
        }
    }
    clear.forEach((n) => (d.floor[n] = -1));
    d.offer[d.piece] = (d.offer[d.piece] + 1 + mi()) % 4;
    return true;
  },
  choices() {
    let d = S.d,
      a = [];
    d.offer.forEach((shape, piece) => {
      for (let mode = 0; mode < 4; mode++)
        for (let sel = 0; sel < 36; sel++) {
          let cells = roomCells(sel, roomShape(shape, mode));
          if (cells.length && cells.every((n) => d.floor[n] < 0)) {
            let complete = 0;
            for (let r = 0; r < 6; r++) {
              for (let row of [
                [0, 1, 2, 3, 4, 5].map((k) => r * 6 + k),
                [0, 1, 2, 3, 4, 5].map((k) => k * 6 + r),
              ])
                if (row.every((k) => d.floor[k] >= 0 || cells.includes(k))) complete++;
            }
            a.push({
              sel,
              mode,
              piece,
              v:
                cells.length +
                complete * 4 -
                ST.neighbors(sel).filter((k) => d.floor[k] < 0).length * 0.05,
            });
          }
        }
    });
    return a;
  },
  botSelect(p) {
    S.d.piece = p.piece;
  },
  draw() {
    let d = S.d,
      g = ST.grid(6, 6, 76, 420);
    g.x = 90;
    ST.banner("Fit the whole piece", "Tiles +1 · completed line +4, then clears");
    ST.cells(g, (k, p) => {
      if (d.floor[k] >= 0) {
        ST.box(
          p.x - g.cell / 2 + 3,
          p.y - g.cell / 2 + 3,
          g.cell - 6,
          g.cell - 6,
          TINT[d.floor[k]],
          COL[d.floor[k]],
        );
        ST.text(d.floor[k] + 1, p.x, p.y, 24, COL[d.floor[k]]);
      }
    });
    if (d.sel >= 0)
      roomCells(d.sel, roomShape(d.offer[d.piece], d.mode)).forEach((k) => ST.select(k, g));
    miniCards(
      d.offer.map((s) => [["L corner", "Bar", "Z bend", "Square"][s]]),
      d.piece,
    );
    d.offer.forEach((s, k) => {
      let shape = roomShape(s, d.mode),
        max = Math.max(...shape.map((p) => p[0])) + 1;
      shape.forEach(([x, y]) =>
        ST.box(30 + (k + 0.5) * 180 - max * 9 + x * 18, 548 + y * 18, 16, 16, COL[d.turn], null, 2),
      );
    });
  },
});
function tailorBoard(seed) {
  let answer = Array(16).fill(0); // All tiles are elbows; a serpentine elbow path is planted before scrambling.
  let path = [4, 5, 1, 2, 6, 7, 11];
  let rot = [0, 0, 2, 3, 1, 3, 1];
  path.forEach((k, j) => (answer[k] = rot[j]));
  return {
    rot: answer.map((n, k) => (n + Math.floor(ST.rng(seed + k) * 4)) % 4),
    answer,
    solves: 0,
  };
}
const PIPE_DIRS = [
  [3, 0],
  [0, 1],
  [1, 2],
  [2, 3],
];
function pipeDirs(board, k) {
  return k === 4 ? (board.rot[k] % 2 ? [0, 2] : [1, 3]) : PIPE_DIRS[board.rot[k]];
}
function tailorFlow(board) {
  let seen = new Set(),
    q = [];
  if (pipeDirs(board, 4).includes(3)) q.push(4);
  while (q.length) {
    let k = q.shift();
    if (seen.has(k)) continue;
    seen.add(k);
    for (let dir of pipeDirs(board, k)) {
      let x = (k % 4) + [0, 1, 0, -1][dir],
        y = Math.floor(k / 4) + [-1, 0, 1, 0][dir],
        n = y * 4 + x;
      if (
        x >= 0 &&
        x < 4 &&
        y >= 0 &&
        y < 4 &&
        pipeDirs(board, n).includes((dir + 2) % 4) &&
        !seen.has(n)
      )
        q.push(n);
    }
  }
  return { seen, win: seen.has(11) && pipeDirs(board, 11).includes(1) };
}
tableRegister("tailor", {
  tag: "ROTATE · CONNECT · PLAN",
  modes: ["Clockwise", "Counterclockwise"],
  rounds: 12,
  rule: "This is a thread circuit, not a matching-tap race. Connect the left source at row 2 to the right sink at row 3 by rotating thread tiles. Select one tile and Confirm a quarter turn. Flowing thread is highlighted. Completing your circuit earns 10, then gives a fresh circuit. Each player has an independent board and gets one rotation per turn.",
  init() {
    S.d.boards = many((i) => tailorBoard(41 + mi() * 20 + i * 7));
  },
  tap: gridTap(ST.grid(4, 4, 106, 440)),
  act(i, k) {
    if (k < 0 || k >= 16) return invalid("Select a thread tile.");
    let b = S.d.boards[i];
    b.rot[k] = (b.rot[k] + (S.d.mode ? 3 : 1)) % 4;
    if (tailorFlow(b).win) {
      ST.add(i, 10);
      S.d.boards[i] = tailorBoard(77 + S.d.turns + i + mi() * 12);
      ST.note("Circuit connected: +10. Fresh board.");
    }
    return true;
  },
  choices(i) {
    let b = S.d.boards[i],
      a = [];
    for (let k = 0; k < 16; k++)
      for (let mode = 0; mode < 2; mode++) {
        let prev = b.rot[k];
        b.rot[k] = (prev + (mode ? 3 : 1)) % 4;
        let f = tailorFlow(b);
        let distance = b.rot.reduce(
          (v, n, j) => v + Math.min((n - b.answer[j] + 4) % 4, (b.answer[j] - n + 4) % 4),
          0,
        );
        a.push({ sel: k, mode, v: (f.win ? 100 : 0) + f.seen.size * 0.15 - distance });
        b.rot[k] = prev;
      }
    return a;
  },
  draw() {
    let d = S.d,
      g = ST.grid(4, 4, 106, 440);
    g.x = 80;
    let b = d.boards[d.turn],
      f = tailorFlow(b);
    ST.banner(pname(d.turn) + " thread circuit", "Source left R2 → sink right R3");
    ST.cells(g, (k, p) => {
      for (let dir of pipeDirs(b, k))
        ST.line(
          p,
          {
            x: p.x + [0, 1, 0, -1][dir] * g.cell * 0.43,
            y: p.y + [-1, 0, 1, 0][dir] * g.cell * 0.43,
          },
          f.seen.has(k) ? COL[d.turn] : "#858d80",
          10,
        );
      ST.circle(p.x, p.y, 7, f.seen.has(k) ? COL[d.turn] : "#858d80");
    });
    ST.text("→", 48, ST.xy(4, g).y, 34, COL[d.turn]);
    ST.text("→", 552, ST.xy(11, g).y, 34, COL[d.turn]);
    ST.select(d.sel, g);
  },
});
function unravelEdges() {
  return [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
  ];
}
function unravelPoint(slot) {
  let a = (slot / 8) * Math.PI * 2 - Math.PI / 2;
  return { x: 300 + Math.cos(a) * 205, y: 320 + Math.sin(a) * 205 };
}
function unravelCross(order) {
  let e = unravelEdges(),
    out = 0;
  for (let a = 0; a < e.length; a++)
    for (let b = a + 1; b < e.length; b++) {
      if (e[a].some((k) => e[b].includes(k))) continue;
      if (
        crossing(
          unravelPoint(order.indexOf(e[a][0])),
          unravelPoint(order.indexOf(e[a][1])),
          unravelPoint(order.indexOf(e[b][0])),
          unravelPoint(order.indexOf(e[b][1])),
        )
      )
        out++;
    }
  return out;
}
tableRegister("unravel", {
  tag: "SWAP · UNTANGLE · FINISH",
  modes: ["Swap"],
  rounds: 10,
  rule: "Select two numbered knots, then Confirm to swap their fixed positions. Knots cannot collapse onto one point. No points for repeated partial improvements: only the player removing the final crossing earns 8. Everyone shares this web, so avoid handing an easy finish to the next player. A solved web is replaced.",
  init() {
    S.d.order =
      mi() === 0
        ? [0, 2, 1, 3, 5, 4, 6, 7]
        : mi() === 1
          ? [0, 3, 1, 5, 2, 6, 4, 7]
          : [0, 4, 2, 6, 1, 5, 3, 7];
    S.d.pair = [];
  },
  tap(i, p) {
    let best = [...Array(8).keys()]
      .map((k) => ({ k, l: dist(p, unravelPoint(k)) }))
      .sort((a, b) => a.l - b.l)[0];
    if (best.l < 45) {
      if (S.d.pair.length >= 2) S.d.pair = [];
      if (!S.d.pair.includes(best.k)) S.d.pair.push(best.k);
      S.d.sel = best.k;
    }
  },
  act() {
    let d = S.d;
    if (d.pair.length !== 2) return invalid("Choose two different knots.");
    let [a, b] = d.pair;
    [d.order[a], d.order[b]] = [d.order[b], d.order[a]];
    if (unravelCross(d.order) === 0) {
      ST.add(d.turn, 8);
      d.order = [0, 2, 4, 1, 6, 3, 5, 7];
    }
    d.pair = [];
    return true;
  },
  choices() {
    let d = S.d,
      a = [];
    for (let x = 0; x < 8; x++)
      for (let y = x + 1; y < 8; y++) {
        let arr = d.order.slice();
        [arr[x], arr[y]] = [arr[y], arr[x]];
        let cross = unravelCross(arr);
        a.push({ sel: x, pair: [x, y], v: cross === 0 ? 100 : -cross });
      }
    return a;
  },
  botSelect(p) {
    S.d.pair = p.pair;
  },
  draw() {
    let d = S.d;
    ST.banner("Untangle the shared web", unravelCross(d.order) + " crossings · final swap earns 8");
    for (let [a, b] of unravelEdges())
      ST.line(unravelPoint(d.order.indexOf(a)), unravelPoint(d.order.indexOf(b)), "#566e75", 5);
    d.order.forEach((v, k) => {
      let p = unravelPoint(k);
      ST.circle(p.x, p.y, 31, d.pair.includes(k) ? COL[d.turn] : "#fff4d2", "#546959");
      ST.text(v + 1, p.x, p.y, 28, d.pair.includes(k) ? "#fff" : STR.ink);
    });
  },
});
function wobbleNew(seed) {
  let tiles = Array(25).fill(0),
    answer = Array(25).fill(0); // 0 empty, 1 slash, 2 backslash.
  // Guaranteed route: enter left row 2, turn up at (2,2), right at (2,0), down at (4,0), exit right row 3.
  for (let [k, v] of [
    [12, 1],
    [2, 1],
    [4, 2],
    [19, 2],
  ])
    answer[k] = v;
  tiles = answer.slice();
  let changes = [2, 4, 12, 19];
  changes.slice(0, 2 + mi()).forEach((k, j) => (tiles[k] = (tiles[k] + 1 + ((seed + j) % 2)) % 3));
  return { tiles, answer };
}
function wobbleTrace(b) {
  let x = -1,
    y = 2,
    dir = 1,
    route = [],
    seen = new Set();
  for (let t = 0; t < 70; t++) {
    x += [0, 1, 0, -1][dir];
    y += [-1, 0, 1, 0][dir];
    if (x < 0 || x >= 5 || y < 0 || y >= 5)
      return { win: x === 5 && y === 3, route, exit: { x, y } };
    let k = y * 5 + x,
      key = k + ":" + dir;
    if (seen.has(key)) break;
    seen.add(key);
    route.push(k);
    if (b.tiles[k] === 1) dir = [1, 0, 3, 2][dir];
    else if (b.tiles[k] === 2) dir = [3, 2, 1, 0][dir];
  }
  return { win: false, route, exit: { x, y } };
}
tableRegister("wobble", {
  tag: "BUILD · TRACE · TEST",
  modes: ["Rotate rail", "Run marble"],
  rounds: 12,
  rule: "Route a marble from the left inlet on row 3 to the right basket on row 4. Select a tile and Rotate rail to cycle empty / slash / backslash. Run marble spends a turn: success earns 8, failure loses 1. The first three cells are previewed, not the whole solution. Each player has a separate board; successful boards reset.",
  init() {
    S.d.boards = many((i) => wobbleNew(i + mi() * 9));
    S.d.trace = [];
  },
  tap: gridTap(ST.grid(5, 5, 106, 440)),
  act(i, k) {
    let b = S.d.boards[i];
    if (S.d.mode === 1) {
      let trace = wobbleTrace(b);
      ST.add(i, trace.win ? 8 : -1);
      S.d.trace = trace.route;
      S.d.traceAt = S.elapsed;
      if (trace.win) S.d.boards[i] = wobbleNew(S.d.turns + i);
      return true;
    }
    if (k < 0 || k >= 25) return invalid("Choose a rail square.");
    b.tiles[k] = (b.tiles[k] + 1) % 3;
    S.d.trace = [];
    return true;
  },
  choices(i) {
    let b = S.d.boards[i];
    if (wobbleTrace(b).win) return [{ sel: 0, mode: 1, v: 100 }];
    let a = [];
    for (let k = 0; k < 25; k++) {
      let cur = b.tiles[k];
      b.tiles[k] = (cur + 1) % 3;
      let mismatch = b.tiles.reduce((s, v, j) => s + (v !== b.answer[j]), 0);
      a.push({ sel: k, mode: 0, v: (wobbleTrace(b).win ? 100 : 0) - mismatch });
      b.tiles[k] = cur;
    }
    return a;
  },
  draw() {
    let d = S.d,
      g = ST.grid(5, 5, 106, 440);
    g.x = 80;
    let b = d.boards[d.turn];
    ST.banner(pname(d.turn) + " marble workshop", "Inlet ← row 3 · basket → row 4");
    ST.cells(g, (k, p) => {
      if (b.tiles[k])
        ST.line(
          { x: p.x - 28, y: p.y + (b.tiles[k] === 1 ? 28 : -28) },
          { x: p.x + 28, y: p.y + (b.tiles[k] === 1 ? -28 : 28) },
          "#8a5f34",
          9,
        );
    });
    let route = wobbleTrace(b).route.slice(0, 3);
    route.forEach((k) => {
      let p = ST.xy(k, g);
      ST.circle(p.x, p.y, 9, "#b88229");
    });
    ST.text("→", 48, ST.xy(10, g).y, 34);
    sprite("plate", 552, ST.xy(19, g).y, 40);
    ST.select(d.sel, g);
  },
});
const CHOIR_MOTIFS = [
  [0, 1, 2],
  [2, 1, 0],
  [1, 3, 1],
];
tableRegister("choir", {
  tag: "COMPOSE · DENY · REST",
  modes: ["Play note", "Rest"],
  rounds: 10,
  rule: "Compose a shared melody. Choose DO / RE / MI / FA; the last two notes plus your note may complete one of the three public motifs for 5 points. A step of one note also earns 1. Repeating the last note loses 1. Notes cost breath (1, 1, 2, 2); Rest restores 3. Set up your own score without gifting the next player an obvious motif.",
  init() {
    S.d.melody = mi() === 0 ? [0, 3] : mi() === 1 ? [0, 1] : [2, 1];
    S.d.breath = many(() => 5 - mi());
  },
  resource(i) {
    return S.d.breath[i] + " breath";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 4, 370);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      d.breath[i] = Math.min(7, d.breath[i] + 3);
      return true;
    }
    if (k < 0 || k > 3) return invalid("Choose a note.");
    let cost = k < 2 ? 1 : 2;
    if (d.breath[i] < cost) return invalid("Not enough breath. Switch to Rest.");
    d.breath[i] -= cost;
    let last = d.melody.at(-1),
      tail = d.melody.slice(-2).concat(k);
    ST.add(
      i,
      (last === k ? -1 : Math.abs(last - k) === 1 ? 1 : 0) +
        CHOIR_MOTIFS.filter((a) => a.every((v, j) => v === tail[j])).length * 5,
    );
    d.melody.push(k);
    tone(260 * Math.pow(2, k / 5));
    return true;
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let k = 0; k < 4; k++)
      if (d.breath[i] >= (k < 2 ? 1 : 2)) {
        let tail = d.melody.slice(-2).concat(k),
          last = d.melody.at(-1),
          value =
            (last === k ? -1 : Math.abs(last - k) === 1 ? 1 : 0) +
            CHOIR_MOTIFS.filter((m) => m.every((n, j) => n === tail[j])).length * 5;
        let gifts = CHOIR_MOTIFS.some((m) => m[0] === tail[1] && m[1] === tail[2]);
        a.push({ sel: k, mode: 0, v: value * 3 - (gifts ? 2 : 0) - k * 0.03 });
      }
    if (d.breath[i] < 3) a.push({ sel: 0, mode: 1, v: 4 });
    return a;
  },
  draw() {
    let d = S.d,
      notes = ["DO", "RE", "MI", "FA"];
    ST.banner("Compose, do not just repeat", "Motif +5 · adjacent note +1 · repeat −1");
    CHOIR_MOTIFS.forEach((m, k) =>
      ST.text(m.map((n) => notes[n]).join(" → "), 300, 128 + k * 42, 27, COL[k]),
    );
    ST.box(40, 270, 520, 70, "#e2e9de");
    ST.text(
      "Last two: " +
        d.melody
          .slice(-2)
          .map((n) => notes[n])
          .join(" → "),
      300,
      305,
      28,
    );
    ST.cards(
      notes.map((n, k) => [n, (k < 2 ? 1 : 2) + " breath"]),
      d.sel,
      370,
    );
    ST.text("Next player inherits the melody you leave.", 300, 530, 23, STR.muted);
  },
});
// EIGHT INTERACTIVE ECONOMY / PHYSICS DUELS. No holding a button to manufacture score.
function elevatorRequest(i, k) {
  let floors = 4 + mi(),
    from = S.d?.floor ?? 0,
    to = (from + 1 + ((i + k) % Math.max(1, floors - 1))) % floors;
  return { from, to, w: 1 + ((i + k) % 3), fare: 3 + ((i + k) % 3) };
}
tableRegister("elevator", {
  tag: "LOAD · ROUTE · COMPETE",
  modes: ["Choose"],
  rounds: 10,
  rule: "The lift is shared. Select one of your three passenger cards to board it—but only at its pickup floor and within the 7 kg capacity. Or select a floor to move the lift up to two floors. Arrivals pay the printed fare to the passenger’s owner. Rivals can move your passengers away, use spare capacity, or accidentally help your route.",
  init() {
    let d = S.d;
    d.floor = 0;
    d.load = [];
    d.requests = many((i) => [0, 1, 2].map((k) => elevatorRequest(i, k)));
    d.serial = 0;
  },
  resource(i) {
    return S.d.load.filter((o) => o.owner === i).length + " aboard";
  },
  tap(i, p) {
    if (p.y >= 475) {
      let k = ST.cardAt(p, 3, 475);
      S.d.sel = k < 0 ? -1 : 100 + k;
    } else {
      let f = Math.floor((p.y - 100) / 55);
      S.d.sel = f >= 0 && f < 4 + mi() ? f : -1;
    }
  },
  act(i, k) {
    let d = S.d;
    if (k >= 100 && k <= 102) {
      let j = k - 100,
        o = d.requests[i][j],
        load = d.load.reduce((a, o) => a + o.w, 0);
      if (o.from !== d.floor)
        return invalid("This passenger waits at F" + o.from + ". Move the lift first.");
      if (load + o.w > 7) return invalid("Lift full. Deliver passengers before boarding more.");
      d.load.push({ ...o, owner: i });
      d.serial++;
      let floors = 4 + mi(),
        from = (d.serial + i) % floors,
        to = (from + 1 + (d.serial % (floors - 1))) % floors;
      d.requests[i][j] = { from, to, w: 1 + (d.serial % 3), fare: 3 + (d.serial % 3) };
      return true;
    }
    if (k < 0 || k >= 4 + mi() || k === d.floor || Math.abs(k - d.floor) > 2)
      return invalid("Select a different floor, at most two floors away.");
    d.floor = k;
    d.load = d.load.filter((o) => {
      if (o.to === k) {
        ST.add(o.owner, o.fare);
        return false;
      }
      return true;
    });
    return true;
  },
  choices(i) {
    let d = S.d,
      a = [];
    d.requests[i].forEach((o, k) => {
      if (o.from === d.floor && d.load.reduce((a, q) => a + q.w, 0) + o.w <= 7)
        a.push({ sel: 100 + k, v: o.fare / o.w + 2 });
    });
    for (let f = 0; f < 4 + mi(); f++)
      if (f !== d.floor && Math.abs(f - d.floor) <= 2) {
        let delivery = d.load
            .filter((o) => o.owner === i && o.to === f)
            .reduce((v, o) => v + o.fare, 0),
          distReq = Math.min(...d.requests[i].map((o) => Math.abs(f - o.from))),
          distLoad = d.load.filter((o) => o.owner === i).map((o) => Math.abs(f - o.to));
        a.push({
          sel: f,
          v: delivery * 3 + (distLoad.length ? 4 - Math.min(...distLoad) : 2 - distReq),
        });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "One lift. Competing routes.",
      d.load.reduce((v, o) => v + o.w, 0) + "/7 kg · current floor F" + d.floor,
    );
    for (let f = 0; f < 4 + mi(); f++) {
      let y = 100 + f * 55;
      ST.box(
        55,
        y,
        490,
        48,
        f === d.floor ? "#dce7dd" : "#fffaf0",
        d.sel === f ? COL[d.turn] : "#b4b7a7",
      );
      ST.text("F" + f, 87, y + 24, 24);
      ST.text(
        f === d.floor ? "LIFT HERE" : Math.abs(f - d.floor) <= 2 ? "MOVE HERE" : "too far",
        365,
        y + 24,
        23,
        f === d.floor ? "#366650" : STR.muted,
      );
    }
    d.load.forEach((o, k) => {
      ST.text("P" + (o.owner + 1) + "→" + o.to, 155 + k * 65, 438, 21, COL[o.owner]);
    });
    ST.cards(
      d.requests[d.turn].map((o) => [
        "F" + o.from + " → F" + o.to,
        o.w + "kg · " + o.fare + " pts",
      ]),
      d.sel - 100,
      475,
    );
  },
});
tableRegister("tumble", {
  tag: "WEIGHT · TORQUE · COUNTER",
  modes: ["Light 1", "Heavy 2"],
  rounds: 10,
  rule: "Select a position on the shared plank and choose Light or Heavy. Outer placements earn more points but create torque. Stay within the printed torque limit. A collapse removes all unbanked piece points and penalises the placer 2 more. Each position holds two pieces; filling all positions safely banks the table and resets it. Heavy pieces are limited to three per player.",
  init() {
    S.d.pieces = [];
    S.d.heavy = many(() => 3);
    S.d.limit = mi() === 0 ? 14 : mi() === 1 ? 11 : 9;
  },
  resource(i) {
    return S.d.heavy[i] + " heavy";
  },
  tap(i, p) {
    S.d.sel =
      p.y > 140 && p.y < 420 && p.x >= 30 && p.x < 570
        ? Math.min(8, Math.floor((p.x - 30) / 60))
        : -1;
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 8 || d.pieces.filter((p) => p.slot === k).length >= 2)
      return invalid("Choose a position with fewer than two pieces.");
    let w = d.mode + 1;
    if (w === 2 && d.heavy[i] <= 0) return invalid("No heavy pieces left. Use Light.");
    if (w === 2) d.heavy[i]--;
    let v = 1 + Math.floor(Math.abs(k - 4) / 2) * w,
      o = { slot: k, w, owner: i, v };
    d.pieces.push(o);
    let torque = d.pieces.reduce((n, p) => n + (p.slot - 4) * p.w, 0);
    if (Math.abs(torque) > d.limit) {
      d.pieces.slice(0, -1).forEach((p) => ST.add(p.owner, -p.v));
      ST.add(i, -2);
      d.pieces = [];
      ST.note("COLLAPSE: all table points removed; placer −2.");
    } else {
      ST.add(i, v);
      if (d.pieces.length >= 18) {
        d.pieces = [];
        ST.note("Full table banked safely. Fresh plank.");
      }
    }
    return true;
  },
  choices(i) {
    let d = S.d,
      torque = d.pieces.reduce((v, p) => v + (p.slot - 4) * p.w, 0),
      a = [];
    for (let k = 0; k < 9; k++)
      for (let mode = 0; mode < 2; mode++)
        if ((!mode || d.heavy[i] > 0) && d.pieces.filter((p) => p.slot === k).length < 2) {
          let t = torque + (k - 4) * (mode + 1),
            v = 1 + Math.floor(Math.abs(k - 4) / 2) * (mode + 1);
          a.push({ sel: k, mode, v: Math.abs(t) <= d.limit ? v * 3 - Math.abs(t) * 0.12 : -100 });
        }
    return a;
  },
  draw() {
    let d = S.d,
      t = d.pieces.reduce((n, p) => n + (p.slot - 4) * p.w, 0);
    ST.banner(
      "Balance is a shared problem",
      "Torque " + t + " · safe range −" + d.limit + " to +" + d.limit,
    );
    ST.box(30, 320, 540, 26, "#a47c4a", "#745634");
    ST.text("▲", 300, 378, 58, "#695c43");
    for (let k = 0; k < 9; k++) {
      let x = 60 + k * 60;
      ST.text(k - 4, x, 420, 23);
      ST.box(
        x - 25,
        150,
        50,
        150,
        d.sel === k ? TINT[d.turn] : "#fffaf044",
        d.sel === k ? COL[d.turn] : "#c3b59a",
      );
      d.pieces
        .filter((p) => p.slot === k)
        .forEach((o, j) => {
          ST.box(x - 21, 270 - j * 51, 42, 43, COL[o.owner], null);
          ST.text(o.w, x, 292 - j * 51, 25, "#fff");
        });
    }
    ST.text("Outer slots pay more. Collapse removes their points.", 300, 505, 22, STR.muted);
    ST.text("Select a vertical slot, then Confirm.", 300, 550, 23);
  },
});
tableRegister("moss", {
  tag: "AIM · POWER · BANK SHOT",
  modes: ["Soft", "Medium", "Hard"],
  rounds: 12,
  rule: "Select an aim point on the green. Mode chooses shot power; Confirm flicks your numbered ball toward it. Bumpers and rival balls affect the route. Sink your ball in a hole for its 2 / 4 / 6 points, then return to your tee. You may need several position-building shots. The next turn waits for the physics to settle.",
  init() {
    S.d.balls = many((i) => ({
      x: 75 + (i * 450) / Math.max(1, S.n - 1),
      y: 530,
      vx: 0,
      vy: 0,
      tee: 75 + (i * 450) / Math.max(1, S.n - 1),
    }));
    S.d.holes = [
      { x: 110, y: 65, r: 29, v: 2 },
      { x: 300, y: 65, r: 24, v: 4 },
      { x: 490, y: 65, r: 19, v: 6 },
    ];
    S.d.bumps =
      mi() === 0
        ? [
            { x: 220, y: 250, r: 43 },
            { x: 390, y: 360, r: 42 },
          ]
        : mi() === 1
          ? [
              { x: 180, y: 200, r: 50 },
              { x: 420, y: 200, r: 50 },
              { x: 300, y: 370, r: 40 },
            ]
          : [
              { x: 160, y: 320, r: 45 },
              { x: 300, y: 250, r: 55 },
              { x: 440, y: 320, r: 45 },
            ];
    S.d.aim = { x: 300, y: 80 };
  },
  tap(i, p) {
    S.d.aim = p;
    S.d.sel = 0;
  },
  act(i, k) {
    if (k < 0) return invalid("Select an aim point on the green.");
    let d = S.d,
      b = d.balls[i],
      l = dist(b, d.aim);
    if (l < 10) return invalid("Aim farther away from your ball.");
    let speed = [200, 325, 460][d.mode];
    b.vx = ((d.aim.x - b.x) / l) * speed;
    b.vy = ((d.aim.y - b.y) / l) * speed;
    d.busy = true;
    d.motion = 0;
    return false;
  },
  update(dt) {
    let d = S.d;
    if (!d.busy) return;
    d.motion += dt;
    d.balls.forEach((b, i) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let drag = Math.pow(0.982, dt * 60);
      b.vx *= drag;
      b.vy *= drag;
      if (b.x < 19 || b.x > 581) {
        b.x = clamp(b.x, 19, 581);
        b.vx *= -0.78;
      }
      if (b.y < 20 || b.y > 580) {
        b.y = clamp(b.y, 20, 580);
        b.vy *= -0.78;
      }
      for (let o of d.bumps) {
        let l = dist(b, o),
          nx = (b.x - o.x) / (l || 1),
          ny = (b.y - o.y) / (l || 1);
        if (l < o.r + 13) {
          b.x = o.x + nx * (o.r + 14);
          b.y = o.y + ny * (o.r + 14);
          let v = b.vx * nx + b.vy * ny;
          if (v < 0) {
            b.vx -= 1.8 * v * nx;
            b.vy -= 1.8 * v * ny;
          }
        }
      }
      for (let h of d.holes)
        if (dist(b, h) < h.r) {
          ST.add(i, h.v);
          Object.assign(b, { x: b.tee, y: 530, vx: 0, vy: 0 });
        }
    });
    for (let i = 0; i < S.n; i++)
      for (let j = i + 1; j < S.n; j++) {
        let a = d.balls[i],
          b = d.balls[j],
          l = dist(a, b);
        if (l < 27) {
          let nx = (a.x - b.x) / (l || 1),
            ny = (a.y - b.y) / (l || 1),
            v = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          a.x += (nx * (28 - l)) / 2;
          a.y += (ny * (28 - l)) / 2;
          b.x -= (nx * (28 - l)) / 2;
          b.y -= (ny * (28 - l)) / 2;
          if (v < 0) {
            a.vx -= v * nx;
            a.vy -= v * ny;
            b.vx += v * nx;
            b.vy += v * ny;
          }
        }
      }
    if (d.motion > 4 || (d.motion > 0.6 && d.balls.every((b) => Math.hypot(b.vx, b.vy) < 15))) {
      d.balls.forEach((b) => {
        b.vx = 0;
        b.vy = 0;
      });
      d.busy = false;
      strategyNext();
    }
  },
  choices(i) {
    let d = S.d,
      b = d.balls[i],
      h = d.holes.slice().sort((a, c) => dist(b, a) / a.v - dist(b, c) / c.v)[0];
    return [
      {
        sel: 0,
        mode: dist(b, h) > 250 ? 2 : dist(b, h) > 130 ? 1 : 0,
        aim: { x: h.x, y: h.y },
        v: 1,
      },
    ];
  },
  botSelect(p) {
    S.d.aim = p.aim;
  },
  draw() {
    let d = S.d;
    ST.box(15, 15, 570, 570, "#dbe8cbcc", "#879d78");
    d.holes.forEach((h) => {
      ST.circle(h.x, h.y, h.r, "#354b38", "#dde5d3");
      ST.text(h.v, h.x, h.y, 26, "#fff");
    });
    d.bumps.forEach((b) => ST.circle(b.x, b.y, b.r, "#91ac7e", "#566e4c"));
    if (!d.busy) {
      let b = d.balls[d.turn];
      ST.line(b, d.aim, COL[d.turn], 3);
      ST.circle(d.aim.x, d.aim.y, 9, null, COL[d.turn]);
    }
    d.balls.forEach((b, i) => {
      ST.circle(b.x, b.y, 14, COL[i], "#fff");
      ST.text(i + 1, b.x, b.y, 20, "#fff");
    });
    if (d.busy) ST.text("LET IT ROLL", 300, 565, 22, STR.muted);
  },
});
function suitcaseOffer(k) {
  let w = 1 + (k % 4),
    bad = k % 4 === 2;
  return { w, v: w + 1 + (k % 3) + (bad ? 3 : 0), bad };
}
tableRegister("suitcase", {
  tag: "DRAFT · CAPACITY · CASH OUT",
  modes: ["Pack", "Cash out", "Permit"],
  rule: "Draft items into your limited bag. Each card shows weight and value; RED cargo is contraband. Cash out banks the whole bag and empties it, using a turn. Customs checks after rounds 3 and 6 confiscate all unpermitted contraband. Permit costs 2 coins and protects one audit. The final bag cashes out after the last audit. Greedy cargo blocks future space.",
  init() {
    S.d.bags = many(() => []);
    S.d.offers = Array.from({ length: 5 }, (_, k) => suitcaseOffer(k + mi() * 2));
    S.d.permit = many(() => false);
    S.d.coins = many(() => 3);
    S.d.serial = 10;
    S.d.capacity = 10 - mi();
  },
  resource(i) {
    return (
      S.d.bags[i].reduce((v, o) => v + o.w, 0) + "/" + S.d.capacity + "kg · " + S.d.coins[i] + "c"
    );
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 5, 170);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      if (!d.bags[i].length) return invalid("Your bag is empty.");
      ST.add(
        i,
        d.bags[i].reduce((v, o) => v + o.v, 0),
      );
      d.bags[i] = [];
      return true;
    }
    if (d.mode === 2) {
      if (d.coins[i] < 2 || d.permit[i])
        return invalid("A permit costs 2 coins; only one can be held.");
      d.coins[i] -= 2;
      d.permit[i] = true;
      return true;
    }
    if (k < 0 || k > 4) return invalid("Select an item to pack.");
    let o = d.offers[k];
    if (d.bags[i].reduce((v, o) => v + o.w, 0) + o.w > d.capacity)
      return invalid("Too heavy. Cash out before adding this item.");
    d.bags[i].push(o);
    d.offers[k] = suitcaseOffer(d.serial++);
    return true;
  },
  round() {
    let d = S.d;
    d.coins = d.coins.map((n) => n + 1);
    if (d.round % 3 === 0) {
      d.bags = d.bags.map((bag, i) => bag.filter((o) => !o.bad || d.permit[i]));
      d.permit.fill(false);
      ST.note("Customs audit complete. Unpermitted red cargo confiscated.");
    }
  },
  end() {
    S.d.bags.forEach((bag, i) =>
      ST.add(
        i,
        bag.reduce((v, o) => v + o.v, 0),
      ),
    );
  },
  choices(i) {
    let d = S.d,
      bag = d.bags[i],
      weight = bag.reduce((v, o) => v + o.w, 0),
      a = [];
    d.offers.forEach((o, k) => {
      if (weight + o.w <= d.capacity)
        a.push({
          sel: k,
          mode: 0,
          v: o.v / o.w + 2 - (o.bad && d.round % 3 === 0 && !d.permit[i] ? 5 : 0),
        });
    });
    if (bag.length)
      a.push({
        sel: 0,
        mode: 1,
        v:
          weight >= d.capacity - 2
            ? 10
            : d.round % 3 === 0 && bag.some((o) => o.bad) && !d.permit[i]
              ? 9
              : 1,
      });
    if (bag.some((o) => o.bad) && !d.permit[i] && d.round % 3 === 0 && d.coins[i] >= 2)
      a.push({ sel: 0, mode: 2, v: 7 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Pack value, not just weight",
      "Next audit: " +
        (d.round <= 3 ? "round 3" : d.round <= 6 ? "round 6" : "none") +
        " · capacity " +
        d.capacity +
        "kg",
    );
    ST.cards(
      d.offers.map((o) => [(o.bad ? "RED " : "") + o.w + "kg", o.v + " pts"]),
      d.sel,
      170,
    );
    ST.text(pname(d.turn) + " BAG", 300, 330, 27, COL[d.turn]);
    let bag = d.bags[d.turn];
    ST.text(
      bag.length
        ? bag.length + " items · " + bag.filter((o) => o.bad).length + " RED cargo"
        : "Empty — draft from the market",
      300,
      380,
      22,
    );
    ST.text(
      "Value " +
        bag.reduce((v, o) => v + o.v, 0) +
        " · RED value " +
        bag.filter((o) => o.bad).reduce((v, o) => v + o.v, 0),
      300,
      430,
      25,
    );
    ST.text(d.permit[d.turn] ? "PERMITTED" : "NO PERMIT", 300, 470, 23);
    ST.text("Cash out trades a turn for safety and space.", 300, 520, 23, STR.muted);
  },
});
tableRegister("spaghetti", {
  tag: "PULL · READ TENSION · BANK",
  modes: ["Pull", "Bank", "Relax"],
  rule: "Three shared noodles have separate tension meters. Pull adds 2 unbanked bites and increases tension by 2, plus 1 for every other attached player. At tension 10 or more the noodle snaps: all attached cargo is lost and the puller loses 1 point. Bank scores your bites and releases the noodle. Relax reduces selected tension by 3 but earns nothing. You cannot switch noodles while carrying bites. Unbanked bites are lost at match end.",
  init() {
    S.d.lanes = [
      { t: mi() * 2, left: 14 - mi() },
      { t: mi() * 2, left: 12 - mi() },
      { t: mi() * 2, left: 16 - mi() },
    ];
    S.d.pending = many(() => 0);
    S.d.attached = many(() => -1);
  },
  resource(i) {
    return S.d.pending[i] + " unbanked";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 180);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 1) {
      if (!d.pending[i]) return invalid("No bites to bank.");
      let lane = d.attached[i];
      ST.add(i, d.pending[i]);
      d.pending[i] = 0;
      d.attached[i] = -1;
      d.lanes[lane].t = Math.max(0, d.lanes[lane].t - 2);
      return true;
    }
    if (k < 0 || k > 2) return invalid("Select a noodle.");
    let o = d.lanes[k];
    if (d.mode === 2) {
      o.t = Math.max(0, o.t - 3);
      return true;
    }
    if (d.attached[i] >= 0 && d.attached[i] !== k)
      return invalid("Bank your current bites before switching noodles.");
    if (o.left <= 0) return invalid("This noodle is empty. Bank or choose another.");
    let extra = d.attached.filter((n, j) => n === k && j !== i).length;
    d.attached[i] = k;
    d.pending[i] += Math.min(2, o.left);
    o.left = Math.max(0, o.left - 2);
    o.t += 2 + extra;
    if (o.t >= 10) {
      d.attached.forEach((n, j) => {
        if (n === k) {
          d.pending[j] = 0;
          d.attached[j] = -1;
        }
      });
      ST.add(i, -1);
      o.t = 0;
      ST.note("SNAP! Everyone attached lost unbanked bites.");
    }
    return true;
  },
  round() {
    let d = S.d;
    d.lanes.forEach((o, k) => {
      o.t = Math.max(0, o.t - 1);
      if (o.left === 0 && !d.attached.includes(k)) o.left = 14;
    });
  },
  end() {
    S.d.pending.fill(0);
  },
  choices(i) {
    let d = S.d,
      a = [];
    if (d.pending[i]) a.push({ sel: d.attached[i], mode: 1, v: d.pending[i] >= 4 ? 12 : 4 });
    d.lanes.forEach((o, k) => {
      if ((d.attached[i] < 0 || d.attached[i] === k) && o.left > 0) {
        let extra = d.attached.filter((n, j) => n === k && j !== i).length;
        a.push({ sel: k, mode: 0, v: o.t + 2 + extra < 10 ? 8 - o.t * 0.35 : -20 });
      }
      if (o.t > 3) a.push({ sel: k, mode: 2, v: 1 });
    });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "The whole table shares the tension",
      "At 10: SNAP · bank before rivals pull too hard",
    );
    ST.cards(
      d.lanes.map((o, k) => ["NOODLE " + (k + 1), o.left + " bites left"]),
      d.sel,
      180,
    );
    d.lanes.forEach((o, k) => {
      let x = 120 + k * 180;
      ST.box(x - 65, 320, 130, 22, "#ddd8c7");
      if (o.t) ST.box(x - 65, 320, (130 * o.t) / 10, 22, o.t >= 7 ? "#b94c36" : "#af8b3f");
      ST.text(o.t + "/10", x, 375, 29, o.t >= 7 ? "#a33c2c" : STR.ink);
      ST.text(
        d.attached
          .map((n, j) => (n === k ? "P" + (j + 1) : ""))
          .filter(Boolean)
          .join(" + ") || "Unclaimed",
        x,
        427,
        23,
      );
    });
    ST.text("Bank = secure bites · Relax = −3 tension", 300, 520, 23, STR.muted);
  },
});
tableRegister("candle", {
  tag: "BLOW · GUARD · RECOVER",
  modes: ["Blow", "Guard", "Breathe"],
  rounds: 10,
  rule: "Choose a rival candle to Blow: spend 2 breath for 2 damage, or 3 if the forecast wind favours its numbered position. Guard spends 1 breath to block the next 3 damage. Breathe restores 3 breath. Each damage earns 1; extinguishing earns 3 more, then the candle relights. Wind advances after each round. Solo includes a training candle that responds after each turn.",
  init() {
    let n = Math.max(2, S.n);
    S.d.flames = Array(n).fill(6);
    S.d.guards = Array(n).fill(0);
    S.d.breath = Array(n).fill(5);
    S.d.wind = mi() % n;
  },
  resource(i) {
    return S.d.flames[i] + " flame · " + S.d.breath[i] + " breath";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, S.d.flames.length, 210);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      d.breath[i] = Math.min(7, d.breath[i] + 3);
    } else if (d.mode === 1) {
      if (d.breath[i] < 1) return invalid("Guard costs 1 breath.");
      d.breath[i]--;
      d.guards[i] = 3;
    } else {
      if (k < 0 || k >= d.flames.length || k === i)
        return invalid("Choose a different candle to attack.");
      if (d.breath[i] < 2) return invalid("Blow costs 2 breath. Switch to Breathe.");
      d.breath[i] -= 2;
      candleHit(i, k, 2 + (k === d.wind ? 1 : 0));
    }
    if (S.n === 1) {
      if (d.breath[1] < 2) d.breath[1] += 3;
      else if (d.flames[1] <= 3 && d.guards[1] === 0) {
        d.guards[1] = 3;
        d.breath[1]--;
      } else {
        d.breath[1] -= 2;
        candleHit(1, 0, 2);
      }
    }
    return true;
  },
  round() {
    S.d.wind = (S.d.wind + 1) % S.d.flames.length;
  },
  choices(i) {
    let d = S.d,
      a = [];
    if (d.breath[i] >= 2)
      d.flames.forEach((v, k) => {
        if (k !== i)
          a.push({
            sel: k,
            mode: 0,
            v: Math.max(0, 2 + (k === d.wind ? 1 : 0) - d.guards[k]) + (v <= 3 ? 3 : 0),
          });
      });
    if (d.flames[i] <= 3 && d.breath[i] > 0 && d.guards[i] === 0) a.push({ sel: i, mode: 1, v: 5 });
    if (d.breath[i] < 3) a.push({ sel: i, mode: 2, v: 4 });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner("Read the next gust", "Wind favours attacks on candle " + (d.wind + 1));
    ST.cards(
      d.flames.map((v, i) => ["CANDLE " + (i + 1), v + " flame"]),
      d.sel,
      210,
    );
    let w = 540 / d.flames.length;
    d.flames.forEach((v, i) => {
      let x = 30 + (i + 0.5) * w;
      sprite("candle", x, 390, 75);
      ST.text("Shield " + d.guards[i], x, 455, 22, i < S.n ? COL[i] : STR.muted);
      ST.text("Breath " + d.breath[i], x, 493, 22);
    });
  },
});
function candleHit(i, k, power) {
  let d = S.d,
    absorbed = Math.min(power, d.guards[k]);
  d.guards[k] -= absorbed;
  let damage = Math.min(d.flames[k], power - absorbed);
  d.flames[k] -= damage;
  if (i < S.n) ST.add(i, damage);
  if (d.flames[k] <= 0) {
    if (i < S.n) ST.add(i, 3);
    d.flames[k] = 6;
    d.guards[k] = 0;
  }
}
tableRegister("heat", {
  tag: "STOKE · CASH OUT · VENT",
  modes: ["Stoke", "Bank", "Vent"],
  rule: "Choose 1 / 2 / 3 fuel to Stoke: each fuel adds 2 unbanked shares and 12 pressure. At 100 pressure the boiler bursts: everyone loses unbanked shares and the stoker loses 2 points. Bank secures shares; at pressure 65+ it pays a 50% bonus, then lowers pressure by 10. Vent lowers pressure by 22 and restores 2 fuel. Gain 1 fuel each round. Unbanked shares are lost at match end. Read what the next player could do.",
  init() {
    S.d.pressure = 20 + mi() * 5;
    S.d.pending = many(() => 0);
    S.d.fuel = many(() => 5);
  },
  resource(i) {
    return S.d.pending[i] + " shares · " + S.d.fuel[i] + " fuel";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 380);
  },
  act(i, k) {
    let d = S.d;
    if (d.mode === 2) {
      d.pressure = Math.max(0, d.pressure - 22);
      d.fuel[i] = Math.min(7, d.fuel[i] + 2);
      return true;
    }
    if (d.mode === 1) {
      if (!d.pending[i]) return invalid("No shares to bank.");
      ST.add(i, Math.floor(d.pending[i] * (d.pressure >= 65 ? 1.5 : 1)));
      d.pending[i] = 0;
      d.pressure = Math.max(0, d.pressure - 10);
      return true;
    }
    if (k < 0 || k > 2) return invalid("Select a fuel amount.");
    let n = k + 1;
    if (d.fuel[i] < n) return invalid("Not enough fuel. Vent to recover.");
    d.fuel[i] -= n;
    d.pending[i] += n * 2;
    d.pressure += n * (12 + mi());
    if (d.pressure >= 100) {
      d.pending.fill(0);
      d.pressure = 20;
      ST.add(i, -2);
      ST.note("BOILER BURST. All unbanked shares lost; stoker −2.");
    }
    return true;
  },
  round() {
    S.d.fuel = S.d.fuel.map((v) => Math.min(7, v + 1));
    S.d.pressure = Math.max(0, S.d.pressure - 5);
  },
  end() {
    S.d.pending.fill(0);
  },
  choices(i) {
    let d = S.d,
      a = [{ sel: 0, mode: 2, v: d.fuel[i] < 2 ? 8 : 1 }];
    if (d.pending[i])
      a.push({
        sel: 0,
        mode: 1,
        v: d.pressure >= 65 ? 15 : d.pending[i] >= 6 ? 10 : d.pressure > 55 ? 7 : 2,
      });
    for (let k = 0; k < 3; k++)
      if (d.fuel[i] >= k + 1)
        a.push({
          sel: k,
          mode: 0,
          v:
            d.pressure + (k + 1) * (12 + mi()) >= 100
              ? -50
              : (k + 1) * 2 + 2 - (d.pressure > 70 ? 8 : 0),
        });
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner("Everyone owns the risk", "Banking at 65+ pays ×1.5 · 100 bursts");
    ST.box(65, 130, 470, 85, "#d9ded2");
    ST.box(
      65,
      130,
      (470 * d.pressure) / 100,
      85,
      d.pressure >= 80 ? "#b94c36" : d.pressure >= 65 ? "#3c7d57" : "#b18b3e",
    );
    ST.text(d.pressure + " pressure", 300, 173, 32, STR.ink);
    ST.text(
      "Unbanked: " + d.pending.map((n, i) => "P" + (i + 1) + " " + n).join(" · "),
      300,
      285,
      24,
    );
    ST.cards(
      ["1 fuel", "2 fuel", "3 fuel"].map((s, k) => [s, "+" + (k + 1) * 2 + " shares"]),
      d.sel,
      380,
    );
    ST.text("Bank reduces 10 · Vent reduces 22", 300, 535, 23, STR.muted);
  },
});
tableRegister("gift", {
  tag: "BID · READ RIVALS · COMMIT",
  modes: ["Bid 0", "Bid 1", "Bid 2", "Bid 3"],
  rule: "Choose a gift lane and a coin bid. Lane 1 has two winners at 3 points each; lanes 2 and 3 have one winner at 5 and 8. If overcrowded, highest bids win; ties follow the printed round priority. Bids cost coins even when you lose. All choices are public, not falsely “secret” on one screen. Starting priority rotates each round; regain 2 coins per round.",
  init() {
    S.d.coins = many(() => 5 - mi() * 2);
    S.d.bids = many(() => null);
  },
  resource(i) {
    return S.d.coins[i] + " coins";
  },
  tap(i, p) {
    S.d.sel = ST.cardAt(p, 3, 180);
  },
  act(i, k) {
    let d = S.d;
    if (k < 0 || k > 2) return invalid("Choose one of the three lanes.");
    let bid = d.mode;
    if (d.coins[i] < bid) return invalid("You cannot afford that bid.");
    d.coins[i] -= bid;
    d.bids[i] = { lane: k, bid };
    return true;
  },
  round() {
    let d = S.d;
    for (let lane = 0; lane < 3; lane++) {
      let bids = d.bids
        .map((o, i) => (o && o.lane === lane ? { ...o, i } : null))
        .filter(Boolean)
        .sort(
          (a, b) => b.bid - a.bid || ((a.i - d.first + S.n) % S.n) - ((b.i - d.first + S.n) % S.n),
        );
      bids.slice(0, [2, 1, 1][lane]).forEach((o) => ST.add(o.i, [3, 5, 8][lane]));
    }
    d.bids = many(() => null);
    d.coins = d.coins.map((n) => Math.min(9, n + 2));
  },
  choices(i) {
    let d = S.d,
      a = [];
    for (let lane = 0; lane < 3; lane++)
      for (let bid = 0; bid <= Math.min(3, d.coins[i]); bid++) {
        let rivals = d.bids.filter((o) => o?.lane === lane),
          beaten = rivals.filter((o) => o.bid >= bid).length,
          cap = [2, 1, 1][lane];
        a.push({
          sel: lane,
          mode: bid,
          v: beaten < cap ? [3, 5, 8][lane] - bid * 0.7 : -(bid + 1),
        });
      }
    return a;
  },
  draw() {
    let d = S.d;
    ST.banner(
      "Public commitment. Limited coins.",
      "Tie priority: " + many((k) => "P" + (((d.first + k) % S.n) + 1)).join(" → "),
    );
    ST.cards(
      [
        ["LANE 1", "2 winners · +3"],
        ["LANE 2", "1 winner · +5"],
        ["LANE 3", "1 winner · +8"],
      ],
      d.sel,
      180,
    );
    d.bids.forEach((o, i) => {
      ST.box(70, 330 + i * 52, 460, 44, TINT[i], COL[i]);
      ST.text(
        "P" + (i + 1) + " · " + (o ? "Lane " + (o.lane + 1) + " / bid " + o.bid : "not committed"),
        300,
        352 + i * 52,
        24,
        COL[i],
      );
    });
    ST.text("Bids are spent even if the lane rejects you.", 300, 570, 22, STR.muted);
  },
});
// Expose normal input paths for integration tests and accessibility tooling; no score injection.
window.Strategy = {
  definitions: strategyDefs,
  get state() {
    return S?.d;
  },
  action(i, k) {
    engines[S.g.id].action(i, k);
  },
  steer(i, x, y) {
    if (S?.d.kind === "arena")
      S.d.controls[i] = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), held: true };
  },
  get version() {
    return "5.0.0-strategy";
  },
};
const strategyRules = rules;
rules = function (id) {
  strategyRules(id);
  let g = games.find((v) => v.id === id);
  if (!g.strategic) return;
  let note = document.querySelector(".proto-note");
  if (note)
    note.textContent =
      "Strategy rebuild · " +
      (strategyDefs[id].kind === "arena"
        ? "Stick + two abilities; only objectives score."
        : "Turn-based planning; no speed tapping.");
};
$("home").querySelector(".party-banner p").textContent =
  "10 classics. 30 rebuilt strategy games. No tap farming.";
document.querySelector(".lab-label").textContent = "STRATEGY REBUILD · LOCAL 1–4 PLAYERS";
document.querySelector(".section-title small").textContent = "40 GAMES · 30 REBUILT RULESETS";
studioLibrary();

const strategyOriginalLibrary = studioLibrary;
let strategyShelf = "all";
studioLibrary = function (filter = "") {
  strategyOriginalLibrary(filter);
  document.querySelectorAll(".card[data-game]").forEach((card) => {
    let g = games.find((v) => v.id === card.dataset.game),
      show =
        strategyShelf === "all" ||
        (strategyShelf === "classic" && !g.strategic) ||
        strategyShelf === strategyDefs[g.id]?.kind;
    card.style.display = show ? "" : "none";
  });
};
const strategyTabs = document.createElement("div");
strategyTabs.className = "strategy-filters";
strategyTabs.setAttribute("role", "group");
strategyTabs.setAttribute("aria-label", "Game type");
strategyTabs.innerHTML = [
  ["all", "All 40"],
  ["classic", "Classics 10"],
  ["arena", "Arenas 10"],
  ["table", "Planning 20"],
]
  .map(
    ([id, t]) =>
      '<button data-shelf="' + id + '" aria-pressed="' + (id === "all") + '">' + t + "</button>",
  )
  .join("");
$("grid").before(strategyTabs);
strategyTabs.querySelectorAll("button").forEach(
  (b) =>
    (b.onclick = () => {
      strategyShelf = b.dataset.shelf;
      strategyTabs
        .querySelectorAll("button")
        .forEach((q) => q.setAttribute("aria-pressed", q === b));
      studioLibrary($("library-search").value);
    }),
);
studioLibrary();
