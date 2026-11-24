// Ember Coast boot and main loop. Screens: title (3 save slots) -> play ->
// paused (full map) -> play, and busted / mission-complete overlays.
// ?seed=N fixes the city. ?shot=cover|chase|mission|map (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, SAVE_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_EXIT_CAR, ACTION_SHOOT, ACTION_RADIO, ACTION_ABILITY_Z, ACTION_ABILITY_X, ACTION_ABILITY_C, ACTION_WEAPON_NEXT, createInput } from './input.js';
import { createWorld, EVENT_BUSTED, EVENT_MISSION_DONE, EVENT_STAGE } from './world.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const root = document.getElementById('root');
const random = createRandom(seed);
const world = createWorld(random);
const renderer = createRenderer(canvas, random);
const hud = createHud(root);

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.camera);
    hud.update(world.state, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = 'title';
  let bannerTimer = 0;
  let accumulator = 0;
  let last = performance.now();

  function startGame() {
    world.reset();
    screen = 'play';
    announce('Playing. Job 3 of 9: Ember Coast Heist. Lose the ECPD tail.');
  }

  function endGame(busted) {
    screen = 'over';
    hud.setOverText(
      busted
        ? 'The ECPD boxed you in on the boardwalk and the Vulcan is impounded. Mara is already working on the bail — try again, cleaner this time.'
        : 'The run is over.',
    );
    try {
      const best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
      if (world.state.rp > best) window.localStorage.setItem(BEST_KEY, String(world.state.rp));
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({
        cash: world.state.cash, rp: world.state.rp, time: Date.now(),
      }));
    } catch {
      // Storage can be off: the run then lasts this visit only.
    }
    announce('Busted. Press Enter to try again.');
  }

  function handleActions() {
    const actions = input.takeActions();
    const slot = input.takeWeaponSlot();
    if (actions & ACTION_CONFIRM && (screen === 'title' || screen === 'over')) startGame();
    else if (actions & ACTION_PAUSE && screen === 'play') {
      screen = 'paused';
      announce('Paused. Map open.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === 'paused') {
      screen = 'play';
      announce('Playing.');
    }
    return { actions, slot };
  }

  function step() {
    const { actions, slot } = handleActions();
    if (screen !== 'play') return;
    const drive = input.drive();
    const walk = input.walk();
    const worldActions = {
      exitCar: !!(actions & ACTION_EXIT_CAR),
      shoot: !!(actions & ACTION_SHOOT) || input.shooting(),
      radio: !!(actions & ACTION_RADIO),
      ability: actions & ACTION_ABILITY_Z ? 0 : actions & ACTION_ABILITY_X ? 1 : actions & ACTION_ABILITY_C ? 2 : null,
      weaponSlot: slot,
      weaponNext: !!(actions & ACTION_WEAPON_NEXT),
    };
    const events = world.step(STEP, drive, walk, worldActions);
    if (events & EVENT_BUSTED) endGame(true);
    else if (events & EVENT_MISSION_DONE) {
      screen = 'banner';
      bannerTimer = 3;
      hud.setBannerText('★ JOB COMPLETE — EMBER COAST HEIST ★');
      announce('Job complete.');
    } else if (events & EVENT_STAGE) {
      announce(`Stage ${world.state.stageIndex + 1}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    accumulator += dt;
    if (screen === 'banner') {
      bannerTimer -= dt;
      if (bannerTimer <= 0) screen = 'play';
    }
    if (screen === 'title' || screen === 'play') {
      while (accumulator >= STEP && (screen === 'title' || screen === 'play')) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      handleActions();
    }
    renderer.draw(world.state, screen, null);
    hud.update(world.state, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play') {
      screen = 'paused';
      announce('Paused.');
    }
  });

  announce('Ember Coast. Press Enter to continue.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
