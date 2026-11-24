// Ember Coast — Golden Hour Pursuit. Every tuning number, colour and piece of
// content data in one place. The playfield is a fixed 1280x720 logical area;
// the HUD is DOM laid over the WebGL canvas, so no rule below depends on the
// window size. Sunset palette: ember orange, dusk violet, sea teal.

export const STEP = 1 / 60;
export const FIELD = { width: 1280, height: 720 };

// The coastal city is a 1200 x 1200 metre grid, origin at its centre. The sea
// lies west (negative x), the beach runs along x = -260, the coastal highway
// runs north-south at x = -180, and the downtown grid fills the east.
export const WORLD = {
  size: 1200,
  seaX: -300,
  beachX: -260,
  highwayX: -180,
  roadGap: 90,
  maxSpeed: 62, // m/s, about 223 km/h
  accel: 26,
  brake: 48,
  drag: 0.35,
  steer: 1.9,
  walkSpeed: 7,
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const PALETTE = {
  skyTop: 0x2b1e4d,
  skyMid: 0xd95f2b,
  skyLow: 0xffb347,
  sun: 0xffd27a,
  sea: 0x1d5f7a,
  sand: 0xe8c98a,
  asphalt: 0x2c2f36,
  sidewalk: 0x8a7f72,
  buildingA: 0x7a5a6e,
  buildingB: 0x8a6a5a,
  buildingC: 0x5a6a8a,
  palm: 0x2f7a3d,
  trunk: 0x7a5a38,
  carPlayer: 0xff5a1f,
  carPolice: 0x1c2f4a,
  heli: 0x22303f,
  fire: 0xff7a1a,
  smoke: 0x3a3a3a,
};

export const DISTRICTS = [
  { name: 'PALM SHORES', x: -300, z: -300, w: 220, h: 600, standing: 82, blurb: 'Beachfront — the crew owns the boardwalk' },
  { name: 'EMBER DOCK', x: -80, z: -320, w: 260, h: 220, standing: 64, blurb: 'Docks — smugglers pay their tolls here' },
  { name: 'DOWNTOWN', x: 180, z: -260, w: 420, h: 300, standing: 41, blurb: 'Downtown — ECPD watches every corner' },
  { name: 'CORAL HEIGHTS', x: -80, z: -60, w: 260, h: 260, standing: 57, blurb: 'Heights — quiet streets, loud engines' },
  { name: 'SUNSET STRIP', x: 180, z: 60, w: 420, h: 260, standing: 73, blurb: 'The Strip — neon, noise and fast money' },
  { name: 'MARINA BAY', x: -300, z: 320, w: 220, h: 280, standing: 68, blurb: 'Marina — boats, bars and back doors' },
];

export const CREW = [
  { key: 'Z', name: 'MARA', role: 'HACKER', ability: 'GHOST JAM', desc: 'Blinds dispatch radar for 8s', cooldown: 20 },
  { key: 'X', name: 'DEX', role: 'DRIVER', ability: 'NITRO SURGE', desc: '+40% top speed for 6s', cooldown: 15 },
  { key: 'C', name: 'LENA', role: 'FIXER', ability: 'FIELD REPAIR', desc: 'Restores 35% car condition', cooldown: 25 },
];

export const WEAPONS = [
  { slot: 1, name: 'PISTOL', ammo: 48, icon: '▸' },
  { slot: 2, name: 'SMG', ammo: 132, icon: '▸▸' },
  { slot: 3, name: 'SHOTGUN', ammo: 24, icon: '▸▸▸' },
  { slot: 4, name: 'RIFLE', ammo: 90, icon: '▸▸▸▸' },
  { slot: 5, name: 'ROCKET', ammo: 3, icon: '✦' },
  { slot: 6, name: 'SNIPER', ammo: 0, locked: true },
  { slot: 7, name: 'MINIGUN', ammo: 0, locked: true },
];

export const RADIO = [
  { station: 'EMBER FM 98.6', song: 'Golden Hour — The Coastals' },
  { station: 'SUNSET DRIVE 101.2', song: 'Palm Shadows — Velvet Heat' },
  { station: 'TIDE RADIO 94.1', song: 'Neon Tide — Marisol Bay' },
];

export const MISSIONS = [
  { id: 1, name: 'FIRST LIGHT', rating: 'GOLD', done: true, reward: 1200 },
  { id: 2, name: 'BOARDWALK HEAT', rating: 'GOLD', done: true, reward: 2400 },
  { id: 3, name: 'EMBER COAST HEIST', rating: null, done: false, reward: 6800 },
  { id: 4, name: 'DOCKLANDS DROP', rating: null, done: false, reward: 4100 },
  { id: 5, name: 'STRIP SHOWDOWN', rating: null, done: false, reward: 5300 },
  { id: 6, name: 'HELI HUNT', rating: null, done: false, reward: 7900 },
  { id: 7, name: 'MARINA MIDNIGHT', rating: null, done: false, reward: 6200 },
  { id: 8, name: 'GOLDEN GETAWAY', rating: null, done: false, reward: 9400 },
  { id: 9, name: 'KING OF EMBER', rating: null, done: false, reward: 15000 },
];

export const MISSION_STAGES = [
  { label: 'Steal the Vulcan GT-R', done: true },
  { label: 'Reach the boardwalk pickup', done: true },
  { label: 'Lose the ECPD tail', done: false },
  { label: 'Deliver the car to Lena', done: false },
];

export const DISPATCH_UNITS = [
  { call: 'EMBER-1', role: 'AIR UNIT', tactic: 'SPOTLIGHT', color: '#ffd23f' },
  { call: 'TARPON 38', role: 'INTERCEPTOR', tactic: 'RAMMING', color: '#ff5a3c' },
  { call: 'PELICAN-11', role: 'PURSUIT', tactic: 'FLANKING', color: '#4fc3f7' },
  { call: 'CONDOR-1', role: 'AIR SUPPORT', tactic: 'TRACKING', color: '#ffd23f' },
  { call: 'BARRACUDA 07', role: 'ROADBLOCK', tactic: 'ROADBLOCK', color: '#ff9f1c' },
  { call: 'MANTA 22', role: 'PURSUIT', tactic: 'PIT', color: '#ff5a3c' },
  { call: 'STINGRAY 04', role: 'PURSUIT', tactic: 'CLOSING IN', color: '#4fc3f7' },
];

export const DIALOGUE = [
  { name: 'LENA', role: 'FIXER', text: 'The Vulcan is hot and every unit in Ember Coast is on you. Lose them on the boardwalk — then bring her home.', portrait: 'L' },
  { name: 'MARA', role: 'HACKER', text: 'Dispatch just lit up the whole grid. I can ghost their radar, but only for eight seconds. Make it count.', portrait: 'M' },
  { name: 'DEX', role: 'DRIVER', text: 'Heli spotlight is on us. Keep it on the coast road — the palms break their line of sight.', portrait: 'D' },
];

export const SAVE_SLOTS = [
  { slot: 1, label: 'SLOT 1', detail: 'EMBER COAST HEIST — 42% — 14:32' },
  { slot: 2, label: 'SLOT 2', detail: 'BOARDWALK HEAT — 28% — 11:07' },
  { slot: 3, label: 'SLOT 3', detail: 'EMPTY — NEW GAME' },
];

export const CARS = [
  { name: 'VULCAN GT-R', color: 0xff5a1f },
  { name: 'COASTAL COMET', color: 0x27b6c9 },
  { name: 'SUNSET FALCON', color: 0xffc21c },
];

export const BEST_KEY = 'ember-coast.best';
export const SAVE_KEY = 'ember-coast.save';
