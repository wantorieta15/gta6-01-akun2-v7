// Keyboard + mouse input. Keys are edge-triggered into an action bitmask the
// main loop consumes once per frame, so a single press never double-fires.

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;
export const ACTION_EXIT_CAR = 1 << 2;
export const ACTION_SHOOT = 1 << 3;
export const ACTION_RADIO = 1 << 4;
export const ACTION_ABILITY_Z = 1 << 5;
export const ACTION_ABILITY_X = 1 << 6;
export const ACTION_ABILITY_C = 1 << 7;
export const ACTION_WEAPON_NEXT = 1 << 8;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_CONFIRM,
  Escape: ACTION_PAUSE,
  KeyE: ACTION_EXIT_CAR,
  KeyR: ACTION_RADIO,
  KeyZ: ACTION_ABILITY_Z,
  KeyX: ACTION_ABILITY_X,
  KeyC: ACTION_ABILITY_C,
  KeyQ: ACTION_WEAPON_NEXT,
};

const WEAPON_KEYS = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6,
};

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let weaponSlot = -1;
  let mouseDown = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action !== undefined) {
      queued |= action;
      event.preventDefault();
    }
    const slot = WEAPON_KEYS[event.code];
    if (slot !== undefined) weaponSlot = slot;
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseDown(event) {
    mouseDown = true;
    queued |= ACTION_SHOOT;
    event.preventDefault();
  }

  function onMouseUp() {
    mouseDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    // -1 left, +1 right for steering; -1 back, +1 forward for throttle.
    drive() {
      const left = held.has('KeyA') || held.has('ArrowLeft') ? -1 : 0;
      const right = held.has('KeyD') || held.has('ArrowRight') ? 1 : 0;
      const up = held.has('KeyW') || held.has('ArrowUp') ? 1 : 0;
      const down = held.has('KeyS') || held.has('ArrowDown') ? -1 : 0;
      return { steer: left + right, throttle: up + down };
    },
    // Walking: x strafe, z forward (camera-relative, same keys as driving).
    walk() {
      const fwd = (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0) - (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0);
      const strafe = (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0);
      return { fwd, strafe };
    },
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
    takeWeaponSlot() {
      const slot = weaponSlot;
      weaponSlot = -1;
      return slot;
    },
    shooting() {
      return mouseDown || held.has('Space');
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    },
  };
}
