# Ember Coast — Golden Hour Pursuit

[![Competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/competitions/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/rank.svg)](https://make.fun/competitions/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/reward.svg)](https://make.fun/competitions/gta6-01)

A 3D third-person open-world crime game set in Ember Coast, a beachfront city
at golden hour. Outrun the ECPD in a sunset police pursuit, run 9 story jobs
with your crew, and climb from street hustler to Street King.

## Play

Open `game/index.html` in a browser (or serve `game/` with any static server)
and press **ENTER** on the title screen to start.

- **W / A / S / D** or **Arrow keys** — drive / walk
- **Space** — handbrake
- **E** — exit / enter car
- **Mouse click** — shoot (on foot)
- **1–7** — switch weapon
- **Z / X / C** — crew abilities (Nitro Boost / Smoke Screen / Repair)
- **R** — change radio station
- **Esc** — pause / full map

## Features

- Sunset coastal open world: beach, ocean, palms, neon downtown Ember Coast
- Live ECPD dispatch board: 5 named units with roles, live distances and
  coloured tactic tags (RAMMING, SPOTLIGHT, ROADBLOCK, FLANKING, PIT)
- Police helicopter EMBER-1 with a visible spotlight cone, roadblocks,
  explosions and burning wrecks
- 9 story jobs with stage progress, timers, GOLD / SILVER / BRONZE ratings
- Crew of 3 with abilities on Z / X / C, weapon wheel with 7 slots
  (2 locked), dialogue with portraits, rank + RP bar, wanted stars
- Minimap with district names and district standing, radio stations
- Full pause / map screen: mission checklist, career stats, 3 save slots

## Build

`main.ts` (Node 22, pure stdlib) copies `game/` and `screenshots/` into
`/output` and writes `/output/dossier.json` via `buildDossier` from
`vendor/makefun-game.ts`.

```
node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
