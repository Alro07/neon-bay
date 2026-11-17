# Neon Bay — Open-World Crime

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Alro07/neon-bay/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Alro07/neon-bay/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Neon Bay** is a 3D open-world crime game built with three.js — a sun-soaked fictional
city you can explore on foot and by car. You play **Rio**, a courier new to town, taking
jobs from **Mara** while the Bay PD watches your every move.

## What's in the game

- **Open world** — a grid city with neon buildings, a beach, palms, street lamps and the
  Neon Tower, free to explore on foot or by car (third-person chase camera).
- **Traffic & pedestrians** — cars loop the roads, pedestrians walk the sidewalks and
  scatter when you cause trouble.
- **Steal & drive cars** — walk up to any parked car and press **E** to take it.
  Stealing raises your wanted level.
- **Wanted level & police** — 5 stars. Punching, shooting, stealing and hitting
  pedestrians raise the heat; Bay PD cruisers with flashing light bars chase and ram you.
  Break line of sight to lose stars.
- **Story missions** — 5 sequential jobs with dialog and objectives: First Delivery,
  Hot Wheels (steal a car), Heat (lose the cops), Night Run (75-second timed delivery),
  and Own the Bay (final delivery + escape). Each pays cash.
- **Combat** — punch (**F**) and shoot (mouse click) with particles and tracers.
- **HUD + minimap** — cash, health, wanted stars, mission objective, speed, and a live
  circular minimap with traffic, police, pedestrians and the mission waypoint.
- **Start screen, pause menu, save/load** — progress auto-saves to localStorage.
- **Synthetic sound** — WebAudio engine hum, sirens, gunshots and a chiptune loop.
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

- three.js 0.160.0 vendored as `game/vendor/three.module.min.js`
- Plain static files under `game/`, no build step, no network requests
- Source split by system: `city`, `vehicles`, `traffic`, `pedestrians`, `police`,
  `missions`, `combat`, `hud`, `audio`, `save`, `input`, `shots`, `main`

All names, characters, story, art and music are original fiction. No affiliation
with any commercial game.

Bounty: [Make GTA 6 (gta6-01) on make.fun](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

<sub>Entered on [make.fun](https://make.fun/?ref=q57bcks6&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
