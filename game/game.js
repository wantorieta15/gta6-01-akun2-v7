// ============================================================================
// EMBER COAST — GOLDEN HOUR PURSUIT
// 3D third-person open-world crime game. Vanilla JS + Three.js (r160).
// Single file, no build step. All art is procedural (no external assets).
// ============================================================================
(function () {
"use strict";

// ----------------------------- DATA ---------------------------------------
var DISTRICTS = [
  { name: "PALM SHORES",   x: -60, z: -40, standing: 3, color: "#2ecc71" },
  { name: "NEON ROW",      x:  40, z: -60, standing: 4, color: "#e84393" },
  { name: "MARINA DEL SOL",x: -70, z:  60, standing: 2, color: "#3498db" },
  { name: "EMBER HEIGHTS", x:  60, z:  55, standing: 5, color: "#f1c40f" },
  { name: "DOCKSIDE",      x:   0, z:  90, standing: 1, color: "#e67e22" },
  { name: "OLD TOWN",      x:   0, z:   0, standing: 3, color: "#9b59b6" }
];

var MISSIONS = [
  { name: "SUNSET PICKUP",   obj: "Pick up the package at Marina Del Sol",   target: [-70, 60],  rating: "GOLD",   done: true  },
  { name: "NEON DROP",       obj: "Deliver the package to Neon Row",          target: [40, -60],   rating: "SILVER", done: true  },
  { name: "EMBER RUN",       obj: "Reach the Palm Shores safehouse",          target: [-60, -40],  rating: null,     done: false },
  { name: "DOCKSIDE DEAL",   obj: "Meet the buyer at Dockside, no cops",     target: [0, 90],     rating: null,     done: false },
  { name: "HEIGHTS HEIST",   obj: "Lift the vault keys in Ember Heights",    target: [60, 55],    rating: null,     done: false },
  { name: "OLD TOWN GETAWAY",obj: "Escape the ECPD dragnet through Old Town",target: [0, 0],      rating: null,     done: false },
  { name: "PALM SHORES RACE",obj: "Win the midnight street race",            target: [-60, -40],  rating: null,     done: false },
  { name: "MARINA AMBUSH",   obj: "Ambush the rival crew at the marina",     target: [-70, 60],   rating: null,     done: false },
  { name: "GOLDEN HOUR KING",obj: "Final run: outrun every unit to the pier",target: [-95, 10],   rating: null,     done: false }
];

var WEAPONS = [
  { n: "1", icon: "👊", name: "FISTS",    ammo: "∞" },
  { n: "2", icon: "🔫", name: "PISTOL",   ammo: 96 },
  { n: "3", icon: "🔫", name: "SMG",      ammo: 240 },
  { n: "4", icon: "💥", name: "SHOTGUN",  ammo: 32 },
  { n: "5", icon: "🎯", name: "RIFLE",    ammo: 120 },
  { n: "6", icon: "🔒", name: "SNIPER",   ammo: 0, locked: true },
  { n: "7", icon: "🔒", name: "ROCKET",   ammo: 0, locked: true }
];

var CREW = [
  { key: "Z", name: "RICO",  ability: "NITRO BOOST",  cd: 0 },
  { key: "X", name: "DANTE", ability: "SMOKE SCREEN", cd: 0 },
  { key: "C", name: "LENA",  ability: "FIELD REPAIR", cd: 0 }
];

var RADIOS = [
  "♪ EMBER FM 97.3 — \"Golden Hour Drive\" · The Coastlines",
  "♪ NEON WAVE 101.1 — \"Palm Static\" · Midnight Mirage",
  "♪ DOCK RADIO 88.5 — \"Salt & Chrome\" · The Breakers",
  "♪ OLD TOWN 92.9 — \"Sunset Rumba\" · Lucia Mar"
];

var DISPATCH = [
  { id: "EMBER-1",  role: "HELICOPTER", tag: "SPOTLIGHT", cls: "tag-spot",  air: true },
  { id: "TARPON 38",role: "INTERCEPTOR",tag: "RAMMING",   cls: "tag-ram",   air: false },
  { id: "PELICAN-11",role:"ROADBLOCK",  tag: "ROADBLOCK", cls: "tag-road",  air: false },
  { id: "CONDOR-1", role: "PURSUIT",    tag: "FLANKING",  cls: "tag-flank", air: false },
  { id: "HARBOR 7", role: "PURSUIT",    tag: "PIT",       cls: "tag-pit",   air: false }
];

var DIALOGS = [
  { who: "M", name: "MARISOL \"MARI\" VEGA — FIXER", text: "The whole coast is lit up, kid. Lose that heli and the safehouse is yours — don't stop for anything." },
  { who: "R", name: "RICO — DRIVER", text: "Nitro's hot and the road is clear ahead. Say the word and we vanish into the sunset." },
  { who: "D", name: "DANTE — LOOKOUT", text: "Two units boxing in from Neon Row. Cut through Old Town — the alleys are too tight for them." },
  { who: "L", name: "LENA — MECHANIC", text: "Engine's holding at eighty-two percent. Bring her home in one piece and I'll make her purr again." }
];

// ----------------------------- STATE --------------------------------------
var S = {
  mode: "title",           // title | playing | paused
  inCar: true,
  mission: 2,              // JOB 3/9 (index 2)
  stage: 2, stageMax: 3,
  stageProg: 0.62,
  timer: 167,              // seconds
  cash: 12480, rp: 8450, wanted: 3,
  speed: 0, speedTarget: 0,
  condition: 82,
  weapon: 1, radio: 0,
  dialogIdx: 0, dialogT: 0,
  stats: { jobsDone: 2, chases: 14, topSpeed: 187, shotsFired: 312, distance: 48.6, arrests: 0, playMin: 96 },
  keys: {},
  nitro: 0, smoke: 0,
  coverMode: false,   // staged cover shot: car holds position, speedo stays high
  explosionT: 0
};

var player = { x: 0, z: 30, heading: Math.PI, speed: 0, onFoot: false };
var police = [];   // {mesh, x, z, speed, unit}
var heli = null, heliLight = null, heliCone = null;
var objective = null; // beacon mesh
var particles = [];

// ----------------------------- DOM ----------------------------------------
function el(id) { return document.getElementById(id); }
function $(sel) { return document.querySelector(sel); }

// ----------------------------- THREE SETUP --------------------------------
var scene, camera, renderer, clock;
var carMesh, carBody, footMesh, wheels = [];
var WORLD = 120; // half-size of drivable city

function makeMat(color, opts) {
  var o = opts || {};
  return new THREE.MeshLambertMaterial({ color: color, emissive: o.emissive || 0x000000 });
}

function box(w, h, d, color, x, y, z, opts) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMat(color, opts));
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

function initScene() {
  var canvas = el("scene");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xff7e3c);       // golden-hour sky
  scene.fog = new THREE.Fog(0xff9a5c, 90, 320);

  camera = new THREE.PerspectiveCamera(62, 1280 / 720, 0.1, 600);
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(1280, 720, false);
  renderer.setPixelRatio(1);

  scene.add(new THREE.HemisphereLight(0xffd9a0, 0x40305a, 0.95));
  var sun = new THREE.DirectionalLight(0xffb347, 1.5);
  sun.position.set(-80, 40, -60);
  scene.add(sun);

  // Sun disc low on the horizon (west, over the ocean)
  var sunBall = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd23c }));
  sunBall.position.set(-190, 26, -40);
  scene.add(sunBall);

  // Ocean (west side) + sand beach
  var ocean = new THREE.Mesh(new THREE.PlaneGeometry(220, 320),
    new THREE.MeshLambertMaterial({ color: 0x1a5f8a, emissive: 0x0a2a44 }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(-190, 0.05, 0);
  scene.add(ocean);
  var sand = new THREE.Mesh(new THREE.PlaneGeometry(46, 320),
    new THREE.MeshLambertMaterial({ color: 0xe8c98a }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(-98, 0.06, 0);
  scene.add(sand);

  // Ground / city slab
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 340),
    new THREE.MeshLambertMaterial({ color: 0x3a3a44 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(10, 0, 0);
  scene.add(ground);

  // Road grid (dark strips + centre dashes)
  var roadMat = new THREE.MeshLambertMaterial({ color: 0x1c1c22 });
  var dashMat = new THREE.MeshBasicMaterial({ color: 0xffd23c });
  [-80, -40, 0, 40, 80].forEach(function (c) {
    var r1 = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), roadMat);
    r1.rotation.x = -Math.PI / 2; r1.position.set(0, 0.1, c); scene.add(r1);
    var r2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 240), roadMat);
    r2.rotation.x = -Math.PI / 2; r2.position.set(c, 0.1, 0); scene.add(r2);
    for (var d = -110; d < 120; d += 16) {
      var dash = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5), dashMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.12, c); scene.add(dash);
      var dash2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4), dashMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(c, 0.12, d); scene.add(dash2);
    }
  });

  // Buildings with lit windows (downtown + districts)
  var winCols = [0xffd23c, 0xff9a3c, 0x7dd8ff, 0xff5b8a];
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  for (var i = 0; i < 90; i++) {
    var bx = -70 + rnd() * 170, bz = -95 + rnd() * 190;
    if (Math.abs(bx % 40) < 8 || Math.abs(bz % 40) < 8) continue; // keep off roads
    if (bx < -72) continue; // beach side
    var h = 6 + rnd() * 26;
    var b = box(8 + rnd() * 8, h, 8 + rnd() * 8, 0x2a2438 + Math.floor(rnd() * 0x222222), bx, h / 2, bz);
    var win = new THREE.Mesh(new THREE.PlaneGeometry(6, h * 0.7),
      new THREE.MeshBasicMaterial({ color: winCols[i % 4], transparent: true, opacity: 0.55 }));
    win.position.set(bx, h / 2, bz + 4.6); scene.add(win);
  }

  // Palm trees along the beach road and avenues
  function palm(x, z) {
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 6),
      makeMat(0x7a5230));
    trunk.position.set(x, 3.5, z); trunk.rotation.z = 0.12; scene.add(trunk);
    for (var k = 0; k < 5; k++) {
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.4, 4),
        makeMat(0x2fae5f));
      var a = (k / 5) * Math.PI * 2;
      leaf.position.set(x + Math.cos(a) * 1.6, 7.4, z + Math.sin(a) * 1.6);
      leaf.rotation.z = Math.cos(a) * 1.1; leaf.rotation.x = -Math.sin(a) * 1.1;
      scene.add(leaf);
    }
  }
  for (var p = -110; p <= 110; p += 14) { palm(-72, p); palm(-58, p + 7); }
  for (var q = -70; q <= 70; q += 22) { palm(q, -72); palm(q + 11, 72); }

  // Streetlights
  for (var s = -100; s <= 100; s += 40) {
    box(0.4, 6, 0.4, 0x888888, -46, 3, s);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
    lamp.position.set(-46, 6.2, s); scene.add(lamp);
  }

  buildPlayerCar();
  buildFootPlayer();
  buildPolice();
  buildHeli();
  buildObjective();
  spawnExplosion(-18, 18); // burning wreck near the chase for the cover frame
}

function buildPlayerCar() {
  carMesh = new THREE.Group();
  carBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 4.6),
    new THREE.MeshLambertMaterial({ color: 0xff5b3c, emissive: 0x30100a }));
  carBody.position.y = 0.55; carMesh.add(carBody);
  var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x18202e, emissive: 0x0a1420 }));
  cabin.position.set(0, 1.1, -0.3); carMesh.add(cabin);
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.6),
    new THREE.MeshBasicMaterial({ color: 0xffd23c }));
  stripe.position.set(0, 0.9, 0); carMesh.add(stripe);
  wheels = [];
  [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]].forEach(function (p) {
    var w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12),
      makeMat(0x111111));
    w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.42, p[1]);
    carMesh.add(w); wheels.push(w);
  });
  // headlights
  var hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  hl.position.set(-0.7, 0.6, 2.32); carMesh.add(hl);
  var hl2 = hl.clone(); hl2.position.x = 0.7; carMesh.add(hl2);
  scene.add(carMesh);
}

function buildFootPlayer() {
  footMesh = new THREE.Group();
  var body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4),
    makeMat(0xff5b3c));
  body.position.y = 1.0; footMesh.add(body);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12),
    makeMat(0xe8b88a));
  head.position.y = 1.85; footMesh.add(head);
  var gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.7),
    makeMat(0x222222));
  gun.position.set(0.3, 1.15, 0.4); footMesh.add(gun);
  footMesh.visible = false;
  scene.add(footMesh);
}

function buildPolice() {
  police = [];
  var starts = [[-14, 8, 0xff2222], [-6, 42, 0x2266ff], [16, 14, 0xff2222]];
  starts.forEach(function (s, idx) {
    var g = new THREE.Group();
    var b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 4.4),
      new THREE.MeshLambertMaterial({ color: 0xf2f2f2, emissive: 0x111111 }));
    b.position.y = 0.55; g.add(b);
    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.0),
      makeMat(0x18202e));
    cab.position.set(0, 1.05, -0.2); g.add(cab);
    var bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.3),
      new THREE.MeshBasicMaterial({ color: idx % 2 ? 0xff2222 : 0x2266ff }));
    bar.position.set(0, 1.4, -0.2); g.add(bar);
    g.userData.bar = bar;
    g.position.set(s[0], 0, s[1]);
    scene.add(g);
    police.push({ mesh: g, x: s[0], z: s[1], speed: 9 + idx * 2, unit: DISPATCH[idx + 1], hp: 100 });
  });
}

function buildHeli() {
  heli = new THREE.Group();
  var body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 5.2),
    makeMat(0x222831));
  body.position.y = 0; heli.add(body);
  var tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.5),
    makeMat(0x222831));
  tail.position.set(0, 0.3, -4.2); heli.add(tail);
  var rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.5),
    makeMat(0x111111));
  rotor.position.y = 1.0; heli.add(rotor);
  heli.userData.rotor = rotor;
  var skid = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 3.4),
    makeMat(0x444444));
  skid.position.y = -1.0; heli.add(skid);
  // spotlight cone (translucent) + real spotlight
  heliCone = new THREE.Mesh(new THREE.ConeGeometry(7, 26, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  heliCone.position.y = -14; heliCone.rotation.x = Math.PI; // apex up at heli
  heli.add(heliCone);
  heliLight = new THREE.SpotLight(0xfff2b0, 3.2, 60, 0.32, 0.5, 1);
  heliLight.position.set(0, -1, 0);
  heli.add(heliLight);
  heliLight.target.position.set(0, -26, 0);
  heli.add(heliLight.target);
  heli.position.set(-24, 30, -6);
  scene.add(heli);
}

function buildObjective() {
  objective = new THREE.Group();
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = 20; objective.add(beam);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd23c }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; objective.add(ring);
  var m = MISSIONS[S.mission];
  objective.position.set(m.target[0], 0, m.target[1]);
  scene.add(objective);
}

// Explosion: burst of orange/red glowing spheres + smoke, rises and fades
function spawnExplosion(x, z) {
  var g = new THREE.Group();
  for (var i = 0; i < 26; i++) {
    var s = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.7, 8, 8),
      new THREE.MeshBasicMaterial({ color: [0xffd23c, 0xff8c1a, 0xff3c1a, 0x555555][i % 4], transparent: true, opacity: 0.95 }));
    s.position.set((Math.random() - 0.5) * 4, Math.random() * 3 + 0.5, (Math.random() - 0.5) * 4);
    s.userData.vy = 1 + Math.random() * 3;
    g.add(s);
  }
  // burning wreck: a flipped dark car beside the fire
  var wreck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 4.2), makeMat(0x1a1a1a, { emissive: 0x441100 }));
  wreck.position.set(2.5, 0.6, 1.5); wreck.rotation.z = 0.5; g.add(wreck);
  g.position.set(x, 0, z);
  scene.add(g);
  particles.push({ g: g, t: 0 });
  S.explosionT = 1;
}

// ----------------------------- HUD ----------------------------------------
var TAGS = ["RAMMING", "SPOTLIGHT", "ROADBLOCK", "FLANKING", "PIT", "FIRING"];
function distTo(x, z) {
  var dx = x - player.x, dz = z - player.z;
  return Math.round(Math.sqrt(dx * dx + dz * dz));
}
function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return "⏱ " + String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}
function renderDispatch() {
  var html = "";
  DISPATCH.forEach(function (u, i) {
    var d, tag = u.tag, cls = u.cls;
    if (u.air) {
      d = distTo(heli.position.x, heli.position.z);
    } else {
      var p = police[i - 1] || { x: 20, z: 20 };
      d = distTo(p.x, p.z);
      // tactic tags rotate live as the chase evolves
      var cyc = TAGS[Math.floor(performance.now() / 2600 + i) % TAGS.length];
      if (cyc !== "SPOTLIGHT") { tag = cyc; cls = "tag-" + ({ RAMMING: "ram", SPOTLIGHT: "spot", ROADBLOCK: "road", FLANKING: "flank", PIT: "pit", FIRING: "fire" })[cyc]; }
    }
    html += '<div class="unit-row"><span class="unit-name">' + u.id + '</span>' +
      '<span class="unit-role">' + u.role + '</span>' +
      '<span class="unit-dist">' + d + ' m</span>' +
      '<span class="unit-tag ' + cls + '">' + tag + '</span></div>';
  });
  el("dispatch-units").innerHTML = html;
}
function renderWeapons() {
  var html = "";
  WEAPONS.forEach(function (w, i) {
    var cls = "wslot" + (i === S.weapon ? " active" : "") + (w.locked ? " locked" : "");
    html += '<div class="' + cls + '"><span class="wicon">' + w.icon + '</span>' +
      '<span>' + w.n + ' ' + w.name + '</span>' +
      (w.locked ? '<span class="wlock">🔒 LOCKED</span>' : '<span class="wammo">' + w.ammo + '</span>') + '</div>';
  });
  el("weapon-wheel").innerHTML = html;
}
function nearestDistrict() {
  var best = DISTRICTS[0], bd = 1e9;
  DISTRICTS.forEach(function (d) {
    var dd = (d.x - player.x) * (d.x - player.x) + (d.z - player.z) * (d.z - player.z);
    if (dd < bd) { bd = dd; best = d; }
  });
  return best;
}
function renderHUD() {
  var m = MISSIONS[S.mission];
  el("job-count").textContent = "JOB " + (S.mission + 1) + "/9";
  el("job-timer").textContent = fmtTime(S.timer);
  el("job-name").textContent = m.name;
  el("stage-bar").style.width = Math.round(S.stageProg * 100) + "%";
  el("job-stage").textContent = "STAGE " + S.stage + "/" + S.stageMax + " — " + (S.stage === 1 ? "REACH THE MARK" : S.stage === 2 ? "LOSE THE TAIL" : "FINAL SPRINT");
  el("job-next").textContent = "NEXT: " + m.obj;
  el("cash").textContent = "$" + S.cash.toLocaleString("en-US");
  var stars = el("wanted").children;
  for (var i = 0; i < 5; i++) stars[i].className = "star" + (i < S.wanted ? " on" : "");
  el("rp-text").textContent = "RP " + S.rp.toLocaleString("en-US");
  el("rp-fill").style.width = Math.min(100, (S.rp % 10000) / 100) + "%";
  el("speed").textContent = Math.round(Math.abs(player.speed) * 3.2);
  el("cond").textContent = Math.round(S.condition) + "%";
  el("cond-fill").style.width = Math.round(S.condition) + "%";
  el("cond-fill").style.background = S.condition > 50 ? "#7dff8a" : S.condition > 25 ? "#ffd23c" : "#ff5b5b";
  var d = nearestDistrict();
  el("district").textContent = "📍 " + d.name;
  el("standing").textContent = "Standing: " + ["", "HOSTILE ★☆☆☆☆", "WARY ★★☆☆☆", "RESPECTED ★★★☆☆", "TRUSTED ★★★★☆", "LEGEND ★★★★★"][d.standing];
  el("radio-bar").textContent = RADIOS[S.radio];
  el("mode-hint").textContent = S.inCar ? "E — EXIT VEHICLE · ESC — MAP" : "CLICK — SHOOT · E — ENTER CAR · ESC — MAP";
  el("crosshair").classList.toggle("hidden", S.inCar);
  renderDispatch();
  renderCrewCards();
  drawMinimap();
}
function renderCrewCards() {
  ["z", "x", "c"].forEach(function (k, i) {
    var c = CREW[i];
    var card = el("card-" + k);
    var span = card.querySelector(".cc-key span");
    if (c.cd > 0) { span.textContent = Math.ceil(c.cd) + "s"; span.className = "cool"; card.classList.add("used"); }
    else { span.textContent = "READY"; span.className = "ready"; card.classList.remove("used"); }
  });
}
function toast(msg, ms) {
  var t = el("toast");
  t.textContent = msg;
  clearTimeout(t._h);
  t._h = setTimeout(function () { t.textContent = ""; }, ms || 2600);
}

// ----------------------------- MINIMAP ------------------------------------
function drawMinimap() {
  var c = el("minimap"), ctx = c.getContext("2d");
  var W = c.width, H = c.height, cx = W / 2, cy = H / 2;
  var scale = W / 260;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0c1a2e"; ctx.beginPath(); ctx.arc(cx, cy, cx, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, cx - 2, 0, 7); ctx.clip();
  // ocean + sand
  ctx.fillStyle = "#1a5f8a"; ctx.fillRect(0, 0, 34, H);
  ctx.fillStyle = "#e8c98a"; ctx.fillRect(34, 0, 12, H);
  // roads
  ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 5;
  [-80, -40, 0, 40, 80].forEach(function (v) {
    ctx.beginPath(); ctx.moveTo(0, cy + v * scale); ctx.lineTo(W, cy + v * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + v * scale, 0); ctx.lineTo(cx + v * scale, H); ctx.stroke();
  });
  // districts
  DISTRICTS.forEach(function (d) {
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(cx + d.x * scale, cy + d.z * scale, 4, 0, 7); ctx.fill();
  });
  // objective
  var m = MISSIONS[S.mission];
  ctx.fillStyle = "#ffd23c";
  ctx.beginPath(); ctx.arc(cx + m.target[0] * scale, cy + m.target[1] * scale, 6, 0, 7); ctx.fill();
  ctx.strokeStyle = "#ffd23c"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx + m.target[0] * scale, cy + m.target[1] * scale, 10, 0, 7); ctx.stroke();
  // police (red) + heli (yellow)
  police.forEach(function (p) {
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath(); ctx.arc(cx + p.x * scale, cy + p.z * scale, 4, 0, 7); ctx.fill();
  });
  ctx.fillStyle = "#ffd23c";
  ctx.beginPath(); ctx.arc(cx + heli.position.x * scale, cy + heli.position.z * scale, 5, 0, 7); ctx.fill();
  // player arrow (rotates with heading)
  ctx.save();
  ctx.translate(cx + player.x * scale, cy + player.z * scale);
  ctx.rotate(-player.heading);
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
  // N indicator
  ctx.fillStyle = "#fff"; ctx.font = "bold 13px Arial"; ctx.fillText("N", cx - 4, 16);
  ctx.fillStyle = "#ff5b3c"; ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx - 4, 28); ctx.lineTo(cx + 4, 28); ctx.closePath(); ctx.fill();
}

// ----------------------------- BIG MAP / PAUSE ----------------------------
function drawBigMap() {
  var c = el("bigmap"), ctx = c.getContext("2d");
  var W = c.width, H = c.height, cx = W / 2, cy = H / 2, scale = W / 300;
  ctx.fillStyle = "#0c1a2e"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1a5f8a"; ctx.fillRect(0, 0, 40, H);
  ctx.fillStyle = "#e8c98a"; ctx.fillRect(40, 0, 14, H);
  ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 6;
  [-80, -40, 0, 40, 80].forEach(function (v) {
    ctx.beginPath(); ctx.moveTo(0, cy + v * scale); ctx.lineTo(W, cy + v * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + v * scale, 0); ctx.lineTo(cx + v * scale, H); ctx.stroke();
  });
  ctx.font = "bold 12px Arial";
  DISTRICTS.forEach(function (d) {
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(cx + d.x * scale, cy + d.z * scale, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(d.name, cx + d.x * scale + 9, cy + d.z * scale + 4);
  });
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + player.x * scale, cy + player.z * scale, 6, 0, 7); ctx.fill();
  ctx.fillText("YOU", cx + player.x * scale + 9, cy + player.z * scale + 4);
}
function renderPause() {
  drawBigMap();
  var dl = "";
  DISTRICTS.forEach(function (d) {
    dl += '<div><span style="color:' + d.color + '">●</span> <b>' + d.name + "</b> — " +
      ["", "HOSTILE ★☆☆☆☆", "WARY ★★☆☆☆", "RESPECTED ★★★☆☆", "TRUSTED ★★★★☆", "LEGEND ★★★★★"][d.standing] + "</div>";
  });
  el("district-list").innerHTML = dl;
  var ml = "";
  MISSIONS.forEach(function (m, i) {
    var medal = m.done ? '<span class="medal ' + m.rating.toLowerCase() + '">' + m.rating + "</span>"
      : i === S.mission ? '<span class="medal" style="background:#ff8c1a;color:#fff">ACTIVE</span>'
      : '<span class="medal locked">LOCKED</span>';
    ml += '<div class="mission-row"><span class="mstat">' + (m.done ? "✅" : i === S.mission ? "▶️" : "🔒") + "</span>" +
      '<span class="mname">' + (i + 1) + ". " + m.name + "</span>" + medal + "</div>";
  });
  el("mission-list").innerHTML = ml;
  var done = MISSIONS.filter(function (m) { return m.done; }).length;
  el("career-stats").innerHTML =
    "🏆 Jobs complete: " + done + " / 9 (" + Math.round(done / 9 * 100) + "%)<br>" +
    "💰 Cash earned: $" + S.cash.toLocaleString("en-US") + "<br>" +
    "⭐ Rank: STREET KING — RP " + S.rp.toLocaleString("en-US") + "<br>" +
    "🚔 Chases survived: " + S.stats.chases + " · Arrests: " + S.stats.arrests + "<br>" +
    "🏎 Top speed: " + S.stats.topSpeed + " MPH · Distance: " + S.stats.distance + " mi<br>" +
    "🔫 Shots fired: " + S.stats.shotsFired + " · Play time: " + S.stats.playMin + " min";
  var ps = "";
  for (var s = 1; s <= 3; s++) {
    var sv = loadSave(s);
    ps += '<div class="save-slot" data-slot="' + s + '"><b>SLOT ' + s + "</b><span>" +
      (sv ? "JOB " + (sv.mission + 1) + "/9 · $" + sv.cash.toLocaleString("en-US") + " · RP " + sv.rp : "EMPTY") + "</span></div>";
  }
  el("pause-saves").innerHTML = ps;
  el("pause-saves").querySelectorAll(".save-slot").forEach(function (node) {
    node.addEventListener("click", function () {
      saveGame(+node.getAttribute("data-slot"));
      toast("💾 Saved to SLOT " + node.getAttribute("data-slot"));
      renderPause();
    });
  });
}

// ----------------------------- SAVE ---------------------------------------
function saveGame(slot) {
  try {
    localStorage.setItem("embercoast_save_" + slot, JSON.stringify({
      mission: S.mission, cash: S.cash, rp: S.rp, wanted: S.wanted,
      condition: S.condition, x: player.x, z: player.z
    }));
  } catch (e) { /* storage unavailable in some sandboxes */ }
}
function loadSave(slot) {
  try {
    var raw = localStorage.getItem("embercoast_save_" + slot);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function refreshTitleSlots() {
  for (var s = 1; s <= 3; s++) {
    var sv = loadSave(s);
    el("slot-" + s).textContent = sv
      ? "JOB " + (sv.mission + 1) + "/9 · $" + sv.cash.toLocaleString("en-US")
      : "NEW GAME — JOB 1/9";
  }
}

// ----------------------------- ACTIONS ------------------------------------
function useAbility(i) {
  var c = CREW[i];
  if (c.cd > 0 || S.mode !== "playing") return;
  if (i === 0) { // Nitro
    S.nitro = 2.5; c.cd = 12; toast("💨 RICO: NITRO BOOST!");
  } else if (i === 1) { // Smoke
    S.smoke = 4; S.wanted = Math.max(1, S.wanted - 1); c.cd = 18;
    toast("💨 DANTE: SMOKE SCREEN — they lost visual!");
    spawnExplosion(player.x + 6, player.z + 6);
  } else { // Repair
    S.condition = Math.min(100, S.condition + 30); c.cd = 20;
    toast("🔧 LENA: FIELD REPAIR +30% condition");
  }
  renderCrewCards();
}
function shoot() {
  if (S.mode !== "playing" || S.inCar) return;
  var w = WEAPONS[S.weapon];
  if (w.locked) { toast("🔒 " + w.name + " is LOCKED — finish JOB 5 to unlock"); return; }
  if (typeof w.ammo === "number") {
    if (w.ammo <= 0) { toast("No ammo!"); return; }
    w.ammo--; S.stats.shotsFired++;
  }
  // hit nearest police unit in front
  var best = null, bd = 1e9;
  police.forEach(function (p) {
    var d = Math.hypot(p.x - player.x, p.z - player.z);
    if (d < bd) { bd = d; best = p; }
  });
  if (best && bd < 55) {
    best.hp -= 34;
    spawnExplosion(best.x, best.z);
    if (best.hp <= 0) {
      best.hp = 100; best.x = player.x + (Math.random() - 0.5) * 120; best.z = player.z + (Math.random() - 0.5) * 120;
      S.cash += 250; S.rp += 120; S.wanted = Math.min(5, S.wanted + 1);
      toast("💥 Unit disabled! +$250 · +120 RP");
    }
  }
  renderWeapons();
}
function toggleCar() {
  S.inCar = !S.inCar;
  carMesh.visible = S.inCar;
  footMesh.visible = !S.inCar;
  if (!S.inCar) {
    footMesh.position.set(player.x, 0, player.z);
    toast("🚶 On foot — click to shoot, E to get back in");
  } else {
    toast("🚗 Back behind the wheel");
  }
}
function completeMission() {
  var m = MISSIONS[S.mission];
  m.done = true;
  var rating = S.timer > 90 ? "GOLD" : S.timer > 30 ? "SILVER" : "BRONZE";
  m.rating = rating;
  S.stats.jobsDone++;
  var bonus = rating === "GOLD" ? 2500 : rating === "SILVER" ? 1500 : 800;
  S.cash += bonus; S.rp += rating === "GOLD" ? 800 : 500;
  S.wanted = Math.max(1, S.wanted - 1);
  var mc = el("mission-complete");
  el("mc-rating").textContent = rating;
  el("mc-title").textContent = "JOB COMPLETE — " + m.name;
  el("mc-detail").textContent = "+$" + bonus.toLocaleString("en-US") + " · +" + (rating === "GOLD" ? 800 : 500) + " RP · Wanted down";
  mc.classList.remove("hidden");
  setTimeout(function () { mc.classList.add("hidden"); }, 3200);
  if (S.mission < MISSIONS.length - 1) {
    S.mission++;
    S.stage = 1; S.stageProg = 0; S.timer = 240;
    var nm = MISSIONS[S.mission];
    objective.position.set(nm.target[0], 0, nm.target[1]);
    S.dialogIdx = (S.dialogIdx + 1) % DIALOGS.length;
    showDialog(S.dialogIdx);
    toast("📋 NEW JOB: " + nm.name);
  } else {
    toast("👑 ALL 9 JOBS DONE — YOU ARE THE GOLDEN HOUR KING!");
  }
}
function showDialog(i) {
  var d = DIALOGS[i];
  el("dlg-portrait").textContent = d.who;
  el("dlg-name").textContent = d.name;
  el("dlg-text").textContent = d.text;
}

// ----------------------------- INPUT --------------------------------------
function bindInput() {
  window.addEventListener("keydown", function (e) {
    var k = e.key.toLowerCase();
    S.keys[k] = true;
    if (S.mode === "title" && (k === "enter" || k === " ")) { startGame(1); return; }
    if (S.mode !== "playing") {
      if (k === "escape" && S.mode === "paused") resumeGame();
      return;
    }
    if (k === "escape") { pauseGame(); return; }
    if (k === "e") toggleCar();
    if (k === "z") useAbility(0);
    if (k === "x") useAbility(1);
    if (k === "c") useAbility(2);
    if (k === "r") { S.radio = (S.radio + 1) % RADIOS.length; toast(RADIOS[S.radio]); }
    if (k >= "1" && k <= "7") {
      var w = WEAPONS[+k - 1];
      if (w.locked) { toast("🔒 " + w.name + " LOCKED"); }
      else { S.weapon = +k - 1; renderWeapons(); }
    }
    if (k === " ") e.preventDefault();
  });
  window.addEventListener("keyup", function (e) { S.keys[e.key.toLowerCase()] = false; });
  el("scene").addEventListener("click", shoot);
  document.querySelectorAll("#title-screen .save-slot").forEach(function (node) {
    node.addEventListener("click", function () { startGame(+node.getAttribute("data-slot")); });
  });
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
}

// ----------------------------- FLOW ---------------------------------------
function startGame(slot) {
  var sv = loadSave(slot);
  if (sv) {
    S.mission = sv.mission; S.cash = sv.cash; S.rp = sv.rp;
    S.wanted = sv.wanted; S.condition = sv.condition;
    player.x = sv.x; player.z = sv.z;
    var m = MISSIONS[S.mission];
    objective.position.set(m.target[0], 0, m.target[1]);
  }
  S.mode = "playing";
  el("title-screen").classList.add("hidden");
  el("hud").classList.remove("hidden");
  renderWeapons();
  showDialog(0);
  renderHUD();
  toast("🚗 JOB " + (S.mission + 1) + "/9 — " + MISSIONS[S.mission].name);
}
function pauseGame() {
  S.mode = "paused";
  el("pause-screen").classList.remove("hidden");
  renderPause();
}
function resumeGame() {
  S.mode = "playing";
  el("pause-screen").classList.add("hidden");
}

// ----------------------------- MAIN LOOP ----------------------------------
var lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (S.mode === "playing") update(dt, t / 1000);
  updateAmbient(dt, t / 1000);
  renderer.render(scene, camera);
}
function updateAmbient(dt, now) {
  // helicopter rotor + orbit around the player
  if (heli) {
    heli.userData.rotor.rotation.y += dt * 22;
    if (S.coverMode) {
      // pinned ahead of the player so heli + spotlight cone stay in the cover frame
      heli.position.x = player.x - 24;
      heli.position.z = player.z - 4;
      heli.position.y = 20;
      heli.lookAt(player.x, 0, player.z);
    } else {
      var a = now * 0.25;
      heli.position.x = player.x + Math.cos(a) * 26;
      heli.position.z = player.z + Math.sin(a) * 26 - 6;
      heli.position.y = 30 + Math.sin(now * 0.8) * 1.5;
      heli.lookAt(player.x, 0, player.z);
    }
    heliLight.target.position.set(player.x - heli.position.x, -30, player.z - heli.position.z);
  }
  // explosion particles rise + fade, then re-ignite so the cover stays hot
  particles.forEach(function (p) {
    p.t += dt;
    p.g.children.forEach(function (c) { c.position.y += (c.userData.vy || 1) * dt; });
    if (p.t > 3.2) {
      p.t = 0;
      p.g.children.forEach(function (c, i) {
        c.position.set((Math.random() - 0.5) * 6, Math.random() * 4 + 0.5, (Math.random() - 0.5) * 6);
        c.material.opacity = 0.95;
      });
    } else if (p.t > 2.2) {
      p.g.children.forEach(function (c) { c.material.opacity = Math.max(0.25, c.material.opacity - dt * 0.4); });
    }
  });
  // objective beacon pulse
  if (objective) {
    var s = 1 + Math.sin(now * 3) * 0.12;
    objective.scale.set(s, 1, s);
    objective.rotation.y += dt * 0.8;
  }
  // police light bars flash
  police.forEach(function (p, i) {
    p.mesh.userData.bar.material.color.setHex(Math.floor(now * 6 + i) % 2 ? 0xff2222 : 0x2266ff);
  });
}
function update(dt, now) {
  // --- cooldowns / timer ---
  CREW.forEach(function (c) { if (c.cd > 0) c.cd -= dt; });
  S.timer -= dt;
  if (S.timer <= 0) { S.timer = 240; toast("⏱ Time up — the job window reset, keep driving!"); }
  S.dialogT += dt;
  if (S.dialogT > 14) { S.dialogT = 0; S.dialogIdx = (S.dialogIdx + 1) % DIALOGS.length; showDialog(S.dialogIdx); }
  if (S.nitro > 0) S.nitro -= dt;

  // --- driving / walking ---
  var fwd = (S.keys["w"] || S.keys["arrowup"] || S.coverMode ? 1 : 0) - (S.keys["s"] || S.keys["arrowdown"] ? 1 : 0);
  var steer = (S.keys["a"] || S.keys["arrowleft"] ? 1 : 0) - (S.keys["d"] || S.keys["arrowright"] ? 1 : 0);
  if (S.inCar) {
    var maxSpd = 42 + (S.nitro > 0 ? 22 : 0);
    player.speed += fwd * 26 * dt;
    if (fwd === 0) player.speed *= (1 - 0.5 * dt);
    if (S.keys[" "]) player.speed *= (1 - 3.5 * dt); // handbrake
    player.speed = Math.max(-10, Math.min(maxSpd, player.speed));
    if (Math.abs(player.speed) > 0.5) player.heading += steer * 1.9 * dt * (player.speed > 0 ? 1 : -1);
    if (!S.coverMode) { // staged cover: hold position so the frame stays dense
      player.x += Math.sin(player.heading) * player.speed * dt;
      player.z += Math.cos(player.heading) * player.speed * dt;
    }
    player.x = Math.max(-110, Math.min(115, player.x));
    player.z = Math.max(-110, Math.min(110, player.z));
    carMesh.position.set(player.x, 0, player.z);
    carMesh.rotation.y = player.heading;
    wheels.forEach(function (w) { w.rotation.x += player.speed * dt * 2; });
    S.speed = player.speed;
    S.stats.topSpeed = Math.max(S.stats.topSpeed, Math.round(Math.abs(player.speed) * 3.2));
    S.stats.distance += Math.abs(player.speed) * dt * 0.0006;
    // wall scrape damage
    if ((player.x <= -109 || player.x >= 114 || player.z <= -109 || player.z >= 109) && Math.abs(player.speed) > 8) {
      S.condition = Math.max(5, S.condition - dt * 6);
    }
  } else {
    var sp = 7;
    var mx = (S.keys["d"] || S.keys["arrowright"] ? 1 : 0) - (S.keys["a"] || S.keys["arrowleft"] ? 1 : 0);
    var mz = (S.keys["s"] || S.keys["arrowdown"] ? 1 : 0) - (S.keys["w"] || S.keys["arrowup"] ? 1 : 0);
    player.x += mx * sp * dt; player.z += mz * sp * dt;
    player.x = Math.max(-110, Math.min(115, player.x));
    player.z = Math.max(-110, Math.min(110, player.z));
    footMesh.position.set(player.x, 0, player.z);
    footMesh.rotation.y = player.heading;
  }

  // --- police chase: units close in, distances live ---
  police.forEach(function (p, i) {
    var dx = player.x - p.x, dz = player.z - p.z;
    var d = Math.hypot(dx, dz) || 1;
    var chase = Math.min(p.speed, 8 + d * 0.12) * (S.smoke > 0 ? 0.25 : 1) * (S.coverMode ? 0.3 : 1);
    p.x += (dx / d) * chase * dt;
    p.z += (dz / d) * chase * dt;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = Math.atan2(dx, dz);
    if (d < 4 && S.inCar && Math.abs(player.speed) > 6) {
      // rammed: small damage + wanted heat
      S.condition = Math.max(5, S.condition - dt * 4);
      player.speed *= (1 - 0.6 * dt);
    }
  });
  if (S.smoke > 0) S.smoke -= dt;

  // --- mission progress: reaching the objective marker ---
  var m = MISSIONS[S.mission];
  var md = Math.hypot(m.target[0] - player.x, m.target[1] - player.z);
  S.stageProg = Math.max(0.08, Math.min(0.98, 1 - md / 160));
  if (S.stage === 1 && md < 120) S.stage = 2;
  if (S.stage === 2 && md < 60) S.stage = 3;
  if (md < 7) completeMission();
  // slow wanted decay while clean
  if (Math.random() < dt * 0.02 && S.wanted > 1) S.wanted--;

  // --- chase camera ---
  var camDist = S.inCar ? 10.5 : 8;
  var camH = S.inCar ? 4.6 : 3.4;
  var bx = player.x - Math.sin(player.heading) * camDist;
  var bz = player.z - Math.cos(player.heading) * camDist;
  camera.position.set(bx, camH, bz);
  camera.lookAt(player.x + Math.sin(player.heading) * 6, 1.6, player.z + Math.cos(player.heading) * 6);

  renderHUD();
}

// ----------------------------- SHOT MODES ---------------------------------
// ?shot=cover  -> straight into the dense chase HUD (dossier shot 0)
// ?shot=foot   -> on-foot shooting mode
// ?shot=pause  -> pause / full map screen
// ?shot=title  -> title screen only
function applyShotMode() {
  var q = new URLSearchParams(location.search).get("shot") || "";
  if (q === "title") { refreshTitleSlots(); return; }
  if (q === "cover") {
    // Beach road facing the sunset: ocean + palms + sun disc ahead,
    // police + heli + explosion staged ahead in frame.
    player.x = -52; player.z = 10; player.heading = -Math.PI / 2; player.speed = 38;
    police[0].x = -78; police[0].z = 4;
    police[1].x = -86; police[1].z = 16;
    police[2].x = -74; police[2].z = -2;
    spawnExplosion(-84, 0);
    S.coverMode = true;
    S.mission = 2; S.stage = 2; S.stageProg = 0.62; S.timer = 167;
    S.wanted = 3; S.cash = 12480; S.rp = 8450; S.condition = 82;
    startGame(1);
    return;
  }
  if (q === "foot") {
    player.x = 4; player.z = 26; player.heading = Math.PI;
    startGame(1); toggleCar();
    return;
  }
  if (q === "pause") {
    player.x = 4; player.z = 26; player.heading = Math.PI;
    startGame(1); pauseGame();
    return;
  }
  refreshTitleSlots();
}

// ----------------------------- BOOT ---------------------------------------
try {
  initScene();
  bindInput();
  renderWeapons();
  showDialog(0);
  // idle title camera: slow orbit over the coast so the title looks alive
  camera.position.set(30, 18, 80);
  camera.lookAt(-20, 2, 0);
  applyShotMode();
  if (S.mode === "title") {
    (function titleOrbit() {
      if (S.mode !== "title") return;
      var t = performance.now() / 1000;
      camera.position.set(Math.cos(t * 0.08) * 70, 20, Math.sin(t * 0.08) * 70 + 10);
      camera.lookAt(-20, 2, 0);
      requestAnimationFrame(titleOrbit);
    })();
  }
  clock = { start: function () {} };
  requestAnimationFrame(loop);
  window.__emberReady = true;
} catch (err) {
  document.title = "ERROR: " + err.message;
  var d = document.createElement("div");
  d.textContent = "BOOT ERROR: " + err.message;
  d.style.cssText = "position:absolute;top:0;left:0;color:#fff;background:#c00;padding:8px;z-index:99";
  document.body.appendChild(d);
  window.__emberError = String(err && err.message);
}
})();
