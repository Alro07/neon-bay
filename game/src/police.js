// police.js — Bay PD: cruisers spawn while the player is wanted, chase and ram,
// and flash their light bars. Wanted stars cool down once the player breaks
// line of sight and stays calm.
import * as THREE from 'three';
import { createCar, bumpCars } from './vehicles.js';
import { resolveBuildingCollision, clampToCity } from './city.js';

export function addWanted(state, amount, reason) {
  if (amount <= 0) return;
  state.wanted = Math.min(5, state.wanted + amount);
  state.wantedTimer = 0;
  state.lastCrimeAt = state.elapsed;
  if (reason) state.toast(reason + '  +' + amount + '★', 2.2);
}

export function spawnPoliceCar(state) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 26 + Math.random() * 14;
  let x = state.player.pos.x + Math.sin(angle) * dist;
  let z = state.player.pos.z + Math.cos(angle) * dist;
  const c = clampToCity(x, z, 6);
  x = c.x; z = c.z;
  const cop = createCar(state.scene, x, z, 0, 0x101418, { police: true });
  cop.cruise = 24 + state.wanted * 1.5;
  cop.flashPhase = Math.random() * 10;
  state.police.push(cop);
  return cop;
}

export function updatePolice(state, dt) {
  // Spawn cruisers up to the wanted level (min 1 while wanted > 0).
  const wantCount = state.wanted > 0 ? Math.min(3, state.wanted) : 0;
  while (state.police.length < wantCount) spawnPoliceCar(state);
  while (state.police.length > wantCount) {
    const cop = state.police.pop();
    state.scene.remove(cop.group);
  }

  for (const cop of state.police) {
    const px = state.player.pos.x; const pz = state.player.pos.z;
    const dx = px - cop.group.position.x;
    const dz = pz - cop.group.position.z;
    const dist = Math.hypot(dx, dz);
    const wantHeading = Math.atan2(dx, dz);
    let diff = wantHeading - cop.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turnRate = dist < 6 ? 3.4 : 2.4;
    cop.heading += Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
    const targetSpeed = dist < 4 ? cop.cruise * 0.4 : cop.cruise;
    cop.speed += (targetSpeed - cop.speed) * Math.min(1, 2 * dt);
    let nx = cop.group.position.x + Math.sin(cop.heading) * cop.speed * dt;
    let nz = cop.group.position.z + Math.cos(cop.heading) * cop.speed * dt;
    const fixed = resolveBuildingCollision(state.city.colliders, nx, nz, 1.6);
    cop.group.position.x = clampToCity(fixed.x, fixed.z, 2).x;
    cop.group.position.z = clampToCity(fixed.x, fixed.z, 2).z;
    cop.group.rotation.y = cop.heading;
    for (const w of cop.wheels) w.rotation.x += cop.speed * dt * 2.4;
    // Flashing light bar (red/blue alternating).
    cop.flashPhase += dt * 9;
    const bar = cop.group.getObjectByName('lightBar');
    if (bar) bar.material.color.setHex(Math.sin(cop.flashPhase) > 0 ? 0xff2222 : 0x2244ff);
    // Ram the player: bump their car, or hurt them on foot.
    if (state.player.car) {
      if (bumpCars(cop, state.player.car, 1.4)) {
        state.player.car.speed *= 0.82;
        cop.speed *= 0.7;
        state.damageFlash = 0.35;
        state.health = Math.max(0, state.health - 2 * dt * 10);
      }
    } else if (dist < 2.6) {
      state.health = Math.max(0, state.health - 12 * dt);
      state.damageFlash = 0.4;
    }
    // Shot-up cruisers smoke and stop chasing.
    if (cop.health <= 0) {
      cop.speed = Math.max(0, cop.speed - 20 * dt);
      cop.group.position.y = 0;
    }
  }

  // Wanted cooldown: no cop within 42m for a while -> lose a star.
  if (state.wanted > 0) {
    let nearest = Infinity;
    for (const cop of state.police) {
      nearest = Math.min(nearest, Math.hypot(
        cop.group.position.x - state.player.pos.x,
        cop.group.position.z - state.player.pos.z));
    }
    const calm = nearest > 42 || state.police.length === 0;
    if (calm) {
      state.wantedTimer += dt;
      if (state.wantedTimer > 9) {
        state.wanted -= 1;
        state.wantedTimer = 0;
        state.toast(state.wanted > 0 ? 'Heat cooling off… ' + state.wanted + '★ left' : 'You lost the cops!', 2.5);
      }
    } else {
      state.wantedTimer = 0;
    }
  }
}
