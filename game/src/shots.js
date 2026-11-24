// Screenshot scenes behind ?shot=cover|chase|mission|map (with &seed=N). Each
// one sets the world to a fixed, hand-staged chase moment and returns the
// screen to draw plus an optional cinematic camera, so the frame is what a
// real game looks like mid-chase and the same seed always gives the same
// frame. The cover stages ALL twelve rank-1 cover elements at once: sunset
// coast, heli spotlight + police + explosion, named dispatch panel, mission
// panel, weapon wheel with locked slots, minimap, portrait dialogue, cash +
// wanted + rank, big speed + condition, radio, district and crew abilities.

import { DIALOGUE } from './config.js';

function setChase(s, opts) {
  s.mode = opts.mode || 'drive';
  s.car.x = opts.x ?? -180;
  s.car.z = opts.z ?? 60;
  s.car.heading = opts.heading ?? Math.PI;
  s.car.speed = opts.speed ?? 39;
  s.car.condition = opts.condition ?? 87;
  s.player.x = s.car.x;
  s.player.z = s.car.z;
  s.player.heading = s.car.heading;
  s.wanted = opts.wanted ?? 3;
  s.cash = 48250;
  s.rp = 12480;
  s.missionIndex = 2;
  s.stageIndex = 2;
  s.stageProgress = 0.46;
  s.missionTimer = 187;
  s.dialogueIndex = opts.dialogue ?? 0;
  s.dialogueTimer = 9;
  s.radioIndex = 0;
  s.weaponIndex = 1;
  s.ghost = 0;
  s.message = '';
  s.messageTimer = 0;
  // Police formation: one ramming on the left rear, one flanking right rear,
  // one closing in directly behind — all inside the cover frame.
  const offsets = opts.units || [
    { ox: -9, oz: 15 },
    { ox: 10, oz: 19 },
    { ox: -2, oz: 26 },
    { ox: 16, oz: 8 },
    { ox: -18, oz: 30 },
  ];
  s.units.forEach((u, i) => {
    const off = offsets[i % offsets.length];
    u.ox = off.ox;
    u.oz = off.oz;
    u.distance = Math.round(Math.hypot(u.ox, u.oz) + 18 + (u.ox % 7));
  });
  // Helicopter ahead-left in the sky, spotlight cone over the road.
  s.heli.radius = opts.heliRadius ?? 55;
  s.heli.angle = opts.heliAngle ?? 3.9;
  s.heli.height = 46;
  s.heli.x = s.car.x + Math.cos(s.heli.angle) * s.heli.radius;
  s.heli.z = s.car.z + Math.sin(s.heli.angle) * s.heli.radius;
  // Burning wreck on the left shoulder, clear of the player's car.
  s.explosions = [{ x: s.car.x - 24, z: s.car.z - 32, age: 0.4, big: true }];
  s.waypoint = { x: -180, z: -260 };
}

/**
 * Stage `world` for the named shot and return { screen, camera }.
 * camera is a fixed cinematic {x,y,z,tx,ty,tz} or null for the follow camera.
 */
export function stageShot(name, world) {
  const s = world.state;
  world.reset();
  if (name === 'map') {
    setChase(s, { speed: 0 });
    return { screen: 'paused', camera: null };
  }
  if (name === 'mission') {
    // On foot on the coast road: the player just stepped out, SMG out, a
    // pursuit unit closing in, Mara on the radio. Open ground, no buildings
    // in the way, sea and palms in frame.
    setChase(s, { mode: 'foot', x: -192, z: -40, heading: Math.PI * 0.85, speed: 0, dialogue: 1 });
    s.player.x = -188;
    s.player.z = -36;
    s.car.x = -192;
    s.car.z = -40;
    s.weaponIndex = 1;
    s.weapons[1].ammo = 132;
    s.message = 'ON FOOT — take cover, the ECPD is closing in';
    s.messageTimer = 3;
    return {
      screen: 'play',
      camera: { x: -176, y: 6, z: -6, tx: -198, ty: 1.5, tz: -72 },
    };
  }
  if (name === 'chase') {
    // Full-speed run down the coast road, heli high, roadblock unit ahead.
    setChase(s, { x: -180, z: 140, speed: 52, heliAngle: 4.6, heliRadius: 60 });
    s.explosions = [{ x: -194, z: 116, age: 0.9, big: true }];
    s.message = 'NEAR MISS +25 RP';
    s.messageTimer = 2;
    return {
      screen: 'play',
      camera: { x: -158, y: 7, z: 168, tx: -184, ty: 2, tz: 100 },
    };
  }
  // Default: the cover. Golden hour, coast road, everything at once.
  setChase(s, {});
  return {
    screen: 'play',
    camera: { x: -152, y: 9, z: 96, tx: -188, ty: 2.5, tz: 20 },
  };
}

export { DIALOGUE };
