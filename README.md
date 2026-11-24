# Ember Coast — Golden Hour Pursuit

[![Competition](https://img.shields.io/badge/competition-gta6--01-orange)](https://make.fun/c/gta6-01)
[![Rank](https://img.shields.io/badge/rank-target_TOP_50-gold)](https://make.fun/c/gta6-01)
[![Reward](https://img.shields.io/badge/reward-%241%2C666_USDC-green)](https://make.fun/c/gta6-01)

A 3D third-person open-world crime game set in Ember Coast, a beachfront city
at golden hour. Steal the Vulcan GT-R, outrun the ECPD, deliver the car — and
become King of Ember.

## How to play

Serve `game/` with any static server, e.g. `python3 -m http.server 8080
--directory game`, then open `http://localhost:8080`.

| Key | Action |
| --- | --- |
| Enter | Start / continue from a save slot |
| W A S D / arrows | Drive (or walk on foot) |
| E | Exit the car / get back in |
| Mouse click / Space | Shoot (on foot) |
| 1–7 / Q | Select weapon (slots 6–7 locked) |
| Z / X / C | Crew abilities: Mara's Ghost Jam, Dex's Nitro Surge, Lena's Field Repair |
| R | Change radio station |
| Esc | Pause — full map, job checklist, career stats, save slots |

## What is inside

- **9 story jobs** with stage progress, timers and GOLD / SILVER / BRONZE
  mission ratings, from FIRST LIGHT to KING OF EMBER.
- **ECPD dispatch board**: named units (EMBER-1, TARPON 38, PELICAN-11,
  CONDOR-1, BARRACUDA 07, MANTA 22, STINGRAY 04) with roles, live distances
  and coloured tactic tags — RAMMING, SPOTLIGHT, ROADBLOCK, FLANKING, PIT.
- **Crew of three** with abilities on Z / X / C and cooldowns.
- **Weapon wheel** with 7 slots, ammo counts and locked slots.
- **Rank & RP bar**, cash, 5-star wanted level, respect and district
  standing across 6 named districts.
- **Minimap** with N indicator, live police dots and the job waypoint.
- **Portrait dialogue** from Lena, Mara and Dex driving the story.
- **Radio** with three stations, a full pause/map screen, career stats and
  3 save slots.
- **Golden-hour 3D city**: sunset over the sea, beach, palms, downtown
  towers, a coastal highway, a police helicopter with a spotlight cone and
  a burning wreck on the shoulder.

## Tech

Plain static files, no build step: `game/index.html` + ES modules under
`game/src/`, three.js vendored as `game/vendor/three.min.js`. `main.ts`
copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Screenshots

`?shot=cover|chase|mission|map` stages each dossier shot deterministically
(`&seed=1`): the cover is the full chase at golden hour, the second is a
full-speed coast-road run, the third is on-foot combat at the docks, and the
fourth is the pause map with the job checklist and career stats.
