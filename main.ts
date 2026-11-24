// main.ts — Ember Coast: Golden Hour Pursuit (gta6-01, Akun 2)
// SPDX-License-Identifier: MIT
// Node 22, pure stdlib. Copies game/ + screenshots/ into /output and writes
// /output/dossier.json via buildDossier from vendor/makefun-game.ts.
// Run: node main.ts   (or: node --experimental-strip-types main.ts)
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "output");

const gameDir = join(root, "game");
const shotsDir = join(root, "screenshots");
if (!existsSync(gameDir)) throw new Error("missing game/ directory");
if (!existsSync(shotsDir)) throw new Error("missing screenshots/ directory — render them first");
if (readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).length === 0) {
  throw new Error("no screenshots in screenshots/ — render them first");
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, "game"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const dossierPath = join(outDir, "dossier.json");
writeFileSync(dossierPath, buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));

console.log("dossier written: " + dossierPath);
console.log("output ready in " + outDir);
