// Ember Coast HUD: DOM panels over the WebGL canvas. Every cover-shot
// element lives here and is positioned so nothing overlaps at 1280x720:
// mission top-left, dispatch below it, money/wanted top-right, radio
// top-centre, crew abilities mid-right, weapons + speed bottom-right,
// minimap + district bottom-left, dialogue bottom-centre. The same panels
// drive the title screen (3 save slots) and the pause/map screen.

import { CREW, DIALOGUE, DISTRICTS, MISSIONS, MISSION_STAGES, RADIO, SAVE_SLOTS } from './config.js';

const STAR_FULL = '★';
const STAR_EMPTY = '☆';

function el(tag, cls, parent) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (parent) parent.appendChild(node);
  return node;
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function fmtMoney(n) {
  return `$${n.toLocaleString('en-US')}`;
}

export function createHud(root) {
  const hud = el('div', 'hud', root);

  // --- Mission panel, top-left.
  const mission = el('div', 'panel mission', hud);
  const missionJob = el('div', 'm-job', mission);
  const missionName = el('div', 'm-name', mission);
  const missionBar = el('div', 'bar', mission);
  const missionFill = el('div', 'bar-fill', missionBar);
  const missionNext = el('div', 'm-next', mission);
  const missionTimer = el('div', 'm-timer', mission);

  // --- Dispatch panel, left below the mission.
  const dispatch = el('div', 'panel dispatch', hud);
  el('div', 'd-head', dispatch).textContent = 'ECPD DISPATCH — LIVE';
  const dispatchRows = el('div', 'd-rows', dispatch);
  const unitRows = [];
  for (let i = 0; i < 5; i += 1) {
    const row = el('div', 'd-row', dispatchRows);
    const call = el('span', 'd-call', row);
    const role = el('span', 'd-role', row);
    const dist = el('span', 'd-dist', row);
    const tag = el('span', 'd-tag', row);
    unitRows.push({ call, role, dist, tag });
  }
  const dispatchFoot = el('div', 'd-foot', dispatch);

  // --- Money / wanted / rank, top-right.
  const money = el('div', 'panel money', hud);
  const moneyCash = el('div', 'cash', money);
  const moneyStars = el('div', 'stars', money);
  const moneyRank = el('div', 'rank', money);

  // --- Radio, top-centre.
  const radio = el('div', 'panel radio', hud);
  const radioStation = el('div', 'r-station', radio);
  const radioSong = el('div', 'r-song', radio);

  // --- Crew ability cards, mid-right.
  const abilities = el('div', 'abilities', hud);
  const abilityCards = CREW.map((c) => {
    const card = el('div', 'ability', abilities);
    const portrait = el('div', 'a-portrait', card);
    portrait.textContent = c.name[0];
    const body = el('div', 'a-body', card);
    const name = el('div', 'a-name', body);
    name.textContent = `${c.ability}  [${c.key}]`;
    const who = el('div', 'a-who', body);
    who.textContent = `${c.name} • ${c.role}`;
    const status = el('div', 'a-status', body);
    return { card, status };
  });

  // --- Weapon wheel, bottom-right above the speedometer.
  const weapons = el('div', 'weapons', hud);
  const weaponSlots = [];
  for (let i = 0; i < 7; i += 1) {
    const slot = el('div', 'w-slot', weapons);
    const num = el('div', 'w-num', slot);
    const name = el('div', 'w-name', slot);
    const ammo = el('div', 'w-ammo', slot);
    weaponSlots.push({ slot, num, name, ammo });
  }

  // --- Speedometer, bottom-right.
  const speed = el('div', 'panel speed', hud);
  const speedCar = el('div', 's-car', speed);
  const speedNum = el('div', 's-num', speed);
  const speedUnit = el('div', 's-unit', speed);
  const speedCond = el('div', 's-cond', speed);
  const speedCondFill = el('div', 's-cond-fill', speedCond);
  const speedCondLabel = el('span', 's-cond-label', speedCond);

  // --- District label + minimap, bottom-left.
  const district = el('div', 'panel district', hud);
  const districtName = el('div', 'dist-name', district);
  const districtStand = el('div', 'dist-stand', district);
  const minimapWrap = el('div', 'minimap-wrap', hud);
  const minimap = el('canvas', 'minimap', minimapWrap);
  minimap.width = 150;
  minimap.height = 150;
  const mm = minimap.getContext('2d');
  const north = el('div', 'mm-north', minimapWrap);
  north.textContent = 'N';

  // --- Dialogue, bottom-centre.
  const dialogue = el('div', 'panel dialogue', hud);
  const dlgPortrait = el('div', 'dlg-portrait', dialogue);
  const dlgBody = el('div', 'dlg-body', dialogue);
  const dlgName = el('div', 'dlg-name', dlgBody);
  const dlgText = el('div', 'dlg-text', dlgBody);

  // --- Centre toast for pickups, ability calls and stage changes.
  const toast = el('div', 'toast', hud);

  // --- Title screen.
  const title = el('div', 'screen title-screen', root);
  el('div', 't-kicker', title).textContent = 'MAKE.FUN • GTA6-01 • EMBER COAST';
  el('div', 't-logo', title).textContent = 'EMBER COAST';
  el('div', 't-sub', title).textContent = 'GOLDEN HOUR PURSUIT';
  el('div', 't-tag', title).textContent = 'A 3D open-world crime chase at sunset. Steal the Vulcan GT-R, outrun the ECPD, deliver the car — and become King of Ember.';
  const slots = el('div', 't-slots', title);
  SAVE_SLOTS.forEach((s, i) => {
    const slot = el('div', `t-slot${i === 0 ? ' selected' : ''}`, slots);
    el('div', 't-slot-label', slot).textContent = s.label;
    el('div', 't-slot-detail', slot).textContent = s.detail;
  });
  el('div', 't-enter', title).textContent = 'PRESS ENTER TO CONTINUE';
  el('div', 't-controls', title).textContent = 'WASD drive • E exit car • Mouse shoot • 1–7 weapons • Z/X/C crew abilities • R radio • ESC pause / map';

  // --- Pause / full map screen.
  const pause = el('div', 'screen pause-screen', root);
  const pauseInner = el('div', 'p-inner', pause);
  el('div', 'p-title', pauseInner).textContent = 'EMBER COAST — MAP';
  const pauseCols = el('div', 'p-cols', pauseInner);
  const colMap = el('div', 'p-col', pauseCols);
  el('div', 'p-h', colMap).textContent = 'DISTRICTS & STANDING';
  const pauseDistricts = DISTRICTS.map((d) => {
    const row = el('div', 'p-dist', colMap);
    const name = el('span', 'p-dist-name', row);
    name.textContent = d.name;
    const bar = el('span', 'p-dist-bar', row);
    const fill = el('span', 'p-dist-fill', bar);
    fill.style.width = `${d.standing}%`;
    const val = el('span', 'p-dist-val', row);
    val.textContent = `${d.standing}%`;
    return { row };
  });
  const colJobs = el('div', 'p-col', pauseCols);
  el('div', 'p-h', colJobs).textContent = 'JOB CHECKLIST';
  const jobRows = MISSIONS.map((m) => {
    const row = el('div', 'p-job', colJobs);
    const name = el('span', 'p-job-name', row);
    name.textContent = `JOB ${m.id} — ${m.name}`;
    const rating = el('span', 'p-job-rating', row);
    return { row, rating };
  });
  const colStats = el('div', 'p-col', pauseCols);
  el('div', 'p-h', colStats).textContent = 'CAREER STATS';
  const statRows = {};
  for (const [label, key] of [
    ['Completion', 'complete'],
    ['Cash earned', 'cash'],
    ['Reputation', 'rp'],
    ['Shots fired', 'shots'],
    ['Near misses', 'near'],
    ['Jobs done', 'jobs'],
  ]) {
    const row = el('div', 'p-stat', colStats);
    el('span', 'p-stat-label', row).textContent = label;
    statRows[key] = el('span', 'p-stat-val', row);
  }
  el('div', 'p-resume', pauseInner).textContent = 'ESC — RESUME • 3 SAVE SLOTS: SLOT 1 (42%) • SLOT 2 (28%) • SLOT 3 (EMPTY)';

  // --- Busted / game over screen.
  const over = el('div', 'screen over-screen', root);
  el('div', 'o-title', over).textContent = 'BUSTED';
  const overText = el('div', 'o-text', over);
  el('div', 'o-enter', over).textContent = 'PRESS ENTER TO TRY AGAIN';

  // --- Mission complete banner.
  const banner = el('div', 'screen banner-screen', root);
  const bannerText = el('div', 'b-text', banner);

  function drawMinimap(state) {
    const W = 150;
    const H = 150;
    mm.clearRect(0, 0, W, H);
    mm.fillStyle = 'rgba(10, 16, 26, 0.82)';
    mm.fillRect(0, 0, W, H);
    const scale = W / 1200;
    const toX = (x) => (x + 600) * scale;
    const toY = (z) => (z + 600) * scale;
    // Sea + sand.
    mm.fillStyle = '#1d5f7a';
    mm.fillRect(0, 0, toX(-300), H);
    mm.fillStyle = '#e8c98a';
    mm.fillRect(toX(-300), 0, toX(-210) - toX(-300), H);
    // Districts.
    for (const d of DISTRICTS) {
      mm.fillStyle = d === state.district ? 'rgba(255, 194, 28, 0.35)' : 'rgba(120, 130, 160, 0.22)';
      mm.fillRect(toX(d.x), toY(d.z), d.w * scale, d.h * scale);
      mm.strokeStyle = 'rgba(255,255,255,0.25)';
      mm.strokeRect(toX(d.x), toY(d.z), d.w * scale, d.h * scale);
    }
    // Roads.
    mm.strokeStyle = 'rgba(255,255,255,0.5)';
    mm.lineWidth = 1;
    mm.beginPath();
    mm.moveTo(toX(-180), 0);
    mm.lineTo(toX(-180), H);
    mm.stroke();
    for (const z of [-260, -80, 100, 280]) {
      mm.beginPath();
      mm.moveTo(0, toY(z));
      mm.lineTo(W, toY(z));
      mm.stroke();
    }
    // Waypoint.
    mm.fillStyle = '#ffc21c';
    mm.beginPath();
    mm.arc(toX(state.waypoint.x), toY(state.waypoint.z), 4, 0, Math.PI * 2);
    mm.fill();
    // Police dots.
    mm.fillStyle = '#4fc3f7';
    for (const u of state.units) {
      mm.beginPath();
      mm.arc(toX(state.car.x + u.ox), toY(state.car.z + u.oz), 2.5, 0, Math.PI * 2);
      mm.fill();
    }
    // Player arrow.
    const px = toX(state.mode === 'drive' ? state.car.x : state.player.x);
    const py = toY(state.mode === 'drive' ? state.car.z : state.player.z);
    mm.save();
    mm.translate(px, py);
    mm.rotate(-state.player.heading);
    mm.fillStyle = '#ff5a1f';
    mm.beginPath();
    mm.moveTo(0, -6);
    mm.lineTo(4.5, 5);
    mm.lineTo(-4.5, 5);
    mm.closePath();
    mm.fill();
    mm.restore();
  }

  return {
    update(state, screen) {
      const inGame = screen === 'play' || screen === 'paused';
      hud.style.display = inGame ? 'block' : 'none';
      title.style.display = screen === 'title' ? 'flex' : 'none';
      pause.style.display = screen === 'paused' ? 'flex' : 'none';
      over.style.display = screen === 'over' ? 'flex' : 'none';
      banner.style.display = screen === 'banner' ? 'flex' : 'none';
      if (!inGame) return;

      const mission = MISSIONS[state.missionIndex];
      const stage = MISSION_STAGES[state.stageIndex] || MISSION_STAGES[MISSION_STAGES.length - 1];
      missionJob.textContent = `JOB ${state.missionIndex + 1}/9 — ${mission.name}`;
      missionName.textContent = `STAGE ${state.stageIndex + 1}/${MISSION_STAGES.length}: ${stage.label}`;
      missionFill.style.width = `${Math.round(state.stageProgress * 100)}%`;
      missionNext.textContent = `NEXT: ${MISSION_STAGES[Math.min(state.stageIndex + 1, MISSION_STAGES.length - 1)].label}`;
      missionTimer.textContent = `⏱ ${fmtTime(state.missionTimer)}`;

      state.units.slice(0, 5).forEach((u, i) => {
        const row = unitRows[i];
        row.call.textContent = u.call;
        row.role.textContent = u.role;
        row.dist.textContent = state.ghost > 0 ? '— — —' : `${u.distance}m`;
        row.tag.textContent = u.tactic;
        row.tag.style.background = u.color;
        row.tag.style.color = '#14100a';
      });
      dispatchFoot.textContent = state.ghost > 0
        ? '⚠ RADAR JAMMED — GHOST JAM ACTIVE'
        : `HELI EMBER-1 ON STATION • ${state.units.length} UNITS IN PURSUIT`;

      moneyCash.textContent = fmtMoney(state.cash);
      moneyStars.textContent = STAR_FULL.repeat(state.wanted) + STAR_EMPTY.repeat(5 - state.wanted);
      moneyRank.textContent = `${state.rank} • RP ${state.rp.toLocaleString('en-US')} • RESPECT ${state.respect}%`;

      const station = RADIO[state.radioIndex];
      radioStation.textContent = `♪ ${station.station}`;
      radioSong.textContent = station.song;

      state.crew.forEach((c, i) => {
        const card = abilityCards[i];
        if (c.readyIn <= 0) {
          card.status.textContent = 'READY';
          card.status.className = 'a-status ready';
          card.card.classList.remove('cooling');
        } else {
          card.status.textContent = `${Math.ceil(c.readyIn)}s`;
          card.status.className = 'a-status cooling';
          card.card.classList.add('cooling');
        }
      });

      state.weapons.forEach((w, i) => {
        const slot = weaponSlots[i];
        slot.num.textContent = w.slot;
        slot.name.textContent = w.locked ? 'LOCKED' : w.name;
        slot.ammo.textContent = w.locked ? '—' : `×${w.ammo}`;
        slot.slot.classList.toggle('active', i === state.weaponIndex);
        slot.slot.classList.toggle('locked', !!w.locked);
      });

      speedCar.textContent = state.mode === 'drive' ? 'VULCAN GT-R' : 'ON FOOT';
      const kmh = Math.round(Math.abs(state.car.speed) * 3.6);
      speedNum.textContent = state.mode === 'drive' ? String(kmh) : '0';
      speedUnit.textContent = 'KM/H';
      speedCondFill.style.width = `${Math.round(state.car.condition)}%`;
      speedCondFill.style.background = state.car.condition > 50 ? '#37d67a' : state.car.condition > 25 ? '#ffc21c' : '#ff5a3c';
      speedCondLabel.textContent = `CONDITION ${Math.round(state.car.condition)}%`;

      districtName.textContent = state.district.name;
      districtStand.textContent = `STANDING ${state.district.standing}% • ${state.district.blurb}`;
      drawMinimap(state);

      const dlg = DIALOGUE[state.dialogueIndex];
      dlgPortrait.textContent = dlg.portrait;
      dlgName.textContent = `${dlg.name} — ${dlg.role}`;
      dlgText.textContent = dlg.text;

      toast.style.opacity = state.messageTimer > 0 ? '1' : '0';
      toast.textContent = state.message;

      // Pause screen numbers.
      const done = MISSIONS.filter((m) => m.done).length;
      statRows.complete.textContent = `${Math.round(((done + state.stageProgress) / MISSIONS.length) * 100)}%`;
      statRows.cash.textContent = fmtMoney(state.cash);
      statRows.rp.textContent = state.rp.toLocaleString('en-US');
      statRows.shots.textContent = String(state.shotsFired);
      statRows.near.textContent = String(Math.floor(state.nearMisses));
      statRows.jobs.textContent = `${done}/9`;
      jobRows.forEach((row, i) => {
        const m = MISSIONS[i];
        row.rating.textContent = m.done ? (m.rating || 'DONE') : i === state.missionIndex ? 'ACTIVE' : '—';
        row.rating.className = `p-job-rating${m.done && m.rating === 'GOLD' ? ' gold' : ''}${i === state.missionIndex ? ' active' : ''}`;
        row.row.classList.toggle('done', m.done);
      });
      pauseDistricts.forEach((row, i) => {
        row.row.classList.toggle('current', DISTRICTS[i] === state.district);
      });
    },
    setOverText(text) {
      overText.textContent = text;
    },
    setBannerText(text) {
      bannerText.textContent = text;
    },
  };
}
