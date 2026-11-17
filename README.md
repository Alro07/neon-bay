# Neon Bay — Open-World Crime

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Alro07/neon-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Alro07/neon-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Neon Bay** is a 3D open-world crime game built with three.js — a sun-soaked fictional
coastal city you explore on foot and by car. You play **Rio Voss**, a courier new to town,
taking jobs from **Mara**, the bay's fixer, while the Bay PD watches your every move.
Everything here is original: the city, the characters, the story, the art and the sound.

## What's in the game

- **Open world** — a grid city with neon buildings, a beach and the bay, palms, street
  lamps and the Neon Tower, free to explore on foot or by car (third-person camera).
- **Traffic & pedestrians** — cars loop the roads and brake for obstacles; pedestrians
  stroll the sidewalks and scatter when trouble starts.
- **Steal & drive cars** — walk up to any parked car and press **E** to take it.
  Stealing raises your wanted level.
- **Wanted level & police** — 5 stars. Punching, shooting, stealing and hitting
  pedestrians raise the heat; Bay PD cruisers with flashing light bars chase and ram you.
  Break line of sight and stay calm to lose stars.
- **Story missions** — 5 sequential jobs from Mara with dialog, waypoint beacons and
  payouts: First Delivery, Hot Wheels (steal a car), Heat (lose the cops), Night Run
  (75-second timed delivery), and Own the Bay (two-stop finale).
- **Combat** — punch (**F**) and shoot (mouse click) with tracers, impact bursts and
  pedestrians and cruisers that react.
- **HUD + live minimap** — cash, health, wanted stars, clock, mission objective, speed,
  and a circular minimap showing you, the waypoint, police, traffic and pedestrians.
- **Start screen, pause menu, save/load** — progress auto-saves to localStorage.
- **Synthetic sound** — WebAudio engine hum, sirens, gunshots and a synthwave bass loop.
  No audio files, no network requests — everything is vendored or generated.

## How to play

Serve the `game/` folder with any static server, e.g. `node serve.ts`, then open
http://localhost:8080 in desktop Chrome.

| Key | Action |
| --- | --- |
| WASD | Move / drive |
| Mouse | Look (click to lock pointer) |
| E | Steal / exit car |
| F | Punch |
| Click | Shoot |
| Space | Brake |
| Shift | Sprint |
| M | Restart current mission |
| P / Esc | Pause |

## Tech

- three.js 0.160.0, vendored as `game/vendor/three.module.min.js`
- Plain static files under `game/` — no build step, no network requests
- Entry program: `main.ts` (Node 22) copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` via the kit's `vendor/makefun-game.ts`

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

---

Entered on [make.fun](https://make.fun/?ref=q57bcks6&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · Bounty: [Make GTA 6 — gta6-01](https://make.fun/bounty/gta6-01)
