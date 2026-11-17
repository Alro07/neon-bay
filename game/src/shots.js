// Neon Bay — deterministic shot staging (?shot=cover|drive|foot|mission).
// Called after world build, before first frame, when ?shot= is present.
import { makeCar } from './vehicles.js';
export function stageShot(state, shot) {
  const S = state;
  if (shot === 'cover') {
    // police chase: wanted 3, police cars visible ahead, mission 3 active, player in a car
    S.wanted = 3; S.wantedTimer = 30;
    S.missionIndex = 2; // Heat
    enterNearestCar(S, 30, 30, 0);
    S.beginMission();
    // two police cruisers ahead in the player's view, closing in
    for (const [px, pz] of [[22, 2], [40, -2]]) {
      const c = makeCar(px, pz, Math.PI, 0x111111, true);
      c.police = true; c.parked = false; c.speed = 12;
      S.scene.add(c.mesh); S.police.cars.push(c);
    }
  } else if (shot === 'drive') {
    S.missionIndex = 1; // Hot Wheels
    enterNearestCar(S, -30, 90, Math.PI / 2); // on the z=90 road, heading west
    S.beginMission();
  } else if (shot === 'foot') {
    S.player.pos.x = -45; S.player.pos.z = 98; S.player.heading = Math.PI / 2;
    S.missionIndex = 0; S.beginMission();
    // peds cluster ahead of the player on the sidewalk (player walks west)
    S.peds.slice(0, 6).forEach((p, i) => { p.x = -54 - i * 3; p.z = 98 + (i % 2) * 3; p.heading = -Math.PI / 2; });
  } else if (shot === 'mission') {
    S.player.pos.x = 55; S.player.pos.z = 150; S.player.heading = Math.PI;
    S.missionIndex = 0; S.beginMission();
    S.cash = 0;
  }
  S.player.health = 100;
}
function enterNearestCar(S, x, z, heading) {
  let best = null, bd = 1e9;
  for (const c of S.parkedCars) {
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) {
    best.x = x; best.z = z; best.heading = heading; best.parked = false;
    best.mesh.position.set(x, 0, z); best.mesh.rotation.y = heading;
    S.player.car = best;
    S.player.pos.x = x; S.player.pos.z = z; S.player.heading = heading;
  }
}
