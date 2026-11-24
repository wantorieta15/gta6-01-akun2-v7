// Ember Coast world state: the car, the on-foot player, the ECPD pursuit, the
// helicopter, missions, crew abilities, radio and district standing. Pure
// simulation — no DOM, no three.js — so the shots module can drive it forward
// deterministically and the renderer just paints what is here.

import { CREW, DIALOGUE, DISPATCH_UNITS, DISTRICTS, MISSIONS, MISSION_STAGES, RADIO, WEAPONS, WORLD } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_STAGE = 1 << 0;
export const EVENT_BUSTED = 1 << 1;
export const EVENT_MISSION_DONE = 1 << 2;

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= TAU;
  while (angle < -Math.PI) angle += TAU;
  return angle;
}

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x <= d.x + d.w && z >= d.z && z <= d.z + d.h) return d;
  }
  return DISTRICTS[0];
}

export function createWorld(random) {
  const state = freshState(random);
  return {
    state,
    reset() {
      const next = freshState(random);
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, next);
    },
    step(dt, drive, walk, actions) {
      return stepWorld(state, dt, drive, walk, actions);
    },
  };
}

function freshState(random) {
  const units = DISPATCH_UNITS.map((u, i) => ({
    ...u,
    // Staggered chase offsets behind and beside the player.
    ox: -14 - i * 9 - random.range(0, 8),
    oz: (i % 2 === 0 ? 1 : -1) * (8 + i * 3),
    speed: 0,
    distance: 0,
  }));
  return {
    time: 0,
    mode: 'drive', // 'drive' | 'foot'
    car: { x: -180, z: 40, heading: Math.PI, speed: 0, condition: 87, nitro: 0 },
    player: { x: -180, z: 40, heading: Math.PI },
    heli: { angle: 0.6, radius: 42, height: 46, x: 0, z: 0 },
    units,
    wanted: 3,
    cash: 48250,
    rp: 12480,
    rank: 'STREET KING',
    respect: 74,
    missionIndex: 2, // JOB 3 of 9
    stageIndex: 2,
    stageProgress: 0.46,
    missionTimer: 187, // seconds left
    weaponIndex: 1,
    weapons: WEAPONS.map((w) => ({ ...w })),
    radioIndex: 0,
    district: DISTRICTS[0],
    dialogueIndex: 0,
    dialogueTimer: 0,
    crew: CREW.map((c) => ({ ...c, readyIn: 0 })),
    shotsFired: 0,
    carsPassed: 0,
    nearMisses: 0,
    explosions: [{ x: -196, z: 8, age: 0.4, big: true }],
    waypoint: { x: -180, z: -260 },
    busted: false,
    missionDone: false,
    ghost: 0, // seconds of radar jam left
    message: '',
    messageTimer: 0,
  };
}

function stepWorld(s, dt, drive, walk, actions) {
  s.time += dt;
  let events = EVENT_NONE;

  // Timers.
  s.missionTimer = Math.max(0, s.missionTimer - dt);
  if (s.ghost > 0) s.ghost = Math.max(0, s.ghost - dt);
  if (s.messageTimer > 0) s.messageTimer = Math.max(0, s.messageTimer - dt);
  if (s.dialogueTimer > 0) {
    s.dialogueTimer -= dt;
    if (s.dialogueTimer <= 0) {
      s.dialogueIndex = (s.dialogueIndex + 1) % DIALOGUE.length;
      s.dialogueTimer = 9;
    }
  }
  for (const c of s.crew) if (c.readyIn > 0) c.readyIn = Math.max(0, c.readyIn - dt);

  // Crew abilities.
  if (actions.ability !== undefined && actions.ability !== null) {
    const crew = s.crew[actions.ability];
    if (crew && crew.readyIn <= 0) {
      crew.readyIn = crew.cooldown;
      if (crew.key === 'Z') {
        s.ghost = 8;
        s.message = 'GHOST JAM — dispatch radar blind for 8s';
      } else if (crew.key === 'X') {
        s.car.nitro = 6;
        s.message = 'NITRO SURGE — +40% top speed';
      } else {
        s.car.condition = Math.min(100, s.car.condition + 35);
        s.message = 'FIELD REPAIR — condition restored';
      }
      s.messageTimer = 3;
    }
  }
  if (actions.radio) s.radioIndex = (s.radioIndex + 1) % RADIO.length;
  if (actions.weaponSlot !== undefined && actions.weaponSlot >= 0) {
    const w = s.weapons[actions.weaponSlot];
    if (w && !w.locked) s.weaponIndex = actions.weaponSlot;
  }
  if (actions.weaponNext) {
    let next = s.weaponIndex;
    for (let i = 0; i < s.weapons.length; i += 1) {
      next = (next + 1) % s.weapons.length;
      if (!s.weapons[next].locked) break;
    }
    s.weaponIndex = next;
  }

  // Car enter/exit toggle (E): one press, one transition — never both.
  if (actions.exitCar) {
    if (s.mode === 'drive') {
      s.mode = 'foot';
      s.player.x = s.car.x + 4;
      s.player.z = s.car.z + 3;
      s.car.speed = 0;
      s.message = 'On foot — press E near the car to get back in';
      s.messageTimer = 3;
    } else if (dist2(s.player.x, s.player.z, s.car.x, s.car.z) < 6) {
      s.mode = 'drive';
      s.message = 'Back in the Vulcan GT-R';
      s.messageTimer = 2;
    }
  }

  // Driving.
  if (s.mode === 'drive') {
    const car = s.car;
    const top = WORLD.maxSpeed * (car.nitro > 0 ? 1.4 : 1);
    if (car.nitro > 0) car.nitro = Math.max(0, car.nitro - dt);
    const accel = drive.throttle > 0 ? WORLD.accel : drive.throttle < 0 ? -WORLD.brake : 0;
    car.speed += accel * dt;
    car.speed -= car.speed * WORLD.drag * dt;
    car.speed = clamp(car.speed, -14, top);
    if (Math.abs(car.speed) > 0.5) {
      car.heading += drive.steer * WORLD.steer * dt * (car.speed >= 0 ? 1 : -1) * Math.min(1, Math.abs(car.speed) / 12);
    }
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    // Soft city bounds: the coast road and the grid keep the car inside.
    car.x = clamp(car.x, -560, 580);
    car.z = clamp(car.z, -580, 580);
    s.player.x = car.x;
    s.player.z = car.z;
    s.player.heading = car.heading;
    // Wear and tear at speed, near-misses while weaving.
    if (Math.abs(car.speed) > 30 && Math.abs(drive.steer) > 0.5) {
      s.nearMisses += dt * 0.4;
      if (s.nearMisses > 12) {
        s.nearMisses = 0;
        s.rp += 25;
        s.message = 'NEAR MISS +25 RP';
        s.messageTimer = 2;
      }
    }
    // Waypoint: reach it to advance the mission stage.
    if (dist2(car.x, car.z, s.waypoint.x, s.waypoint.z) < 18) {
      advanceStage(s);
      events |= EVENT_STAGE;
    }
  } else {
    // On foot: walk, camera-relative.
    const p = s.player;
    const speed = WORLD.walkSpeed;
    const sin = Math.sin(p.heading);
    const cos = Math.cos(p.heading);
    p.x += (sin * walk.fwd + cos * walk.strafe) * speed * dt;
    p.z += (cos * walk.fwd - sin * walk.strafe) * speed * dt;
    p.x = clamp(p.x, -560, 580);
    p.z = clamp(p.z, -580, 580);
    if (actions.shoot) {
      const w = s.weapons[s.weaponIndex];
      if (w && !w.locked && w.ammo > 0) {
        w.ammo -= 1;
        s.shotsFired += 1;
        s.rp += 2;
      }
    }
  }

  // Police pursuit: units close in, the helicopter circles overhead.
  const px = s.mode === 'drive' ? s.car.x : s.player.x;
  const pz = s.mode === 'drive' ? s.car.z : s.player.z;
  const chaseSpeed = s.ghost > 0 ? 6 : 17 + s.wanted * 1.5;
  for (const u of s.units) {
    const tx = px + u.ox;
    const tz = pz + u.oz;
    u.distance = Math.round(dist2(tx, tz, px, pz) + 18 + (u.ox % 7));
    // Units drift in their formation; ramming units close the gap.
    if (u.tactic === 'RAMMING' || u.tactic === 'PIT') u.ox += (u.ox < -8 ? 0.4 : -0.4) * dt * 8;
    u.speed = chaseSpeed;
  }
  s.heli.angle += dt * 0.22;
  s.heli.x = px + Math.cos(s.heli.angle) * s.heli.radius;
  s.heli.z = pz + Math.sin(s.heli.angle) * s.heli.radius;

  // Explosion ages out and a fresh one can spark when the chase is hot.
  for (const e of s.explosions) e.age += dt;
  s.explosions = s.explosions.filter((e) => e.age < 3.2);
  if (s.wanted >= 3 && s.explosions.length === 0 && s.time % 7 < dt) {
    s.explosions.push({ x: px - 16, z: pz - 12, age: 0, big: false });
  }

  // District follows the player.
  s.district = districtAt(px, pz);

  // Wanted heat: ramming damage while the tail is close; busted at 0%.
  if (s.mode === 'drive' && s.ghost <= 0) {
    const closest = Math.min(...s.units.map((u) => u.distance));
    if (closest < 26 && Math.abs(s.car.speed) < 12) {
      s.car.condition -= dt * 2.2;
      if (s.car.condition <= 0) {
        s.car.condition = 0;
        s.busted = true;
        events |= EVENT_BUSTED;
      }
    }
  }

  // Cash ticks up slowly from the job; RP from speed.
  if (s.mode === 'drive' && Math.abs(s.car.speed) > 25) s.rp += dt * 3;

  return events;
}

function advanceStage(s) {
  s.stageIndex += 1;
  s.stageProgress = 0;
  if (s.stageIndex >= MISSION_STAGES.length) {
    s.missionDone = true;
    const m = MISSIONS[s.missionIndex];
    m.rating = s.car.condition >= 70 ? 'GOLD' : s.car.condition >= 45 ? 'SILVER' : 'BRONZE';
    m.done = true;
    s.cash += m.reward;
    s.rp += 1500;
    s.message = `JOB COMPLETE — ${m.name} +$${m.reward.toLocaleString('en-US')} — ${m.rating} RATING`;
    s.messageTimer = 4;
    // Next job becomes active.
    if (s.missionIndex + 1 < MISSIONS.length) {
      s.missionIndex += 1;
      s.stageIndex = 0;
      s.missionTimer = 240;
      s.waypoint = { x: -180, z: -260 };
    }
    return;
  }
  s.missionTimer = Math.max(s.missionTimer, 120);
  s.waypoint = { x: -180 + (s.stageIndex % 2 === 0 ? 220 : -40), z: -260 + s.stageIndex * 90 };
  s.message = `STAGE ${s.stageIndex + 1}: ${MISSION_STAGES[s.stageIndex].label}`;
  s.messageTimer = 3;
}

export { MISSIONS, MISSION_STAGES, DIALOGUE, RADIO };
