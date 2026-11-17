// Neon Bay — wanted level + police pursuit (original code).
import { makeCar } from './vehicles.js';
export function makePolice(scene) { return { cars: [], timer: 0 }; }
export function wantedFor(stars) { return Math.min(5, stars); }
export function ensurePolice(state, scene, dt) {
  const want = state.wanted >= 1 ? Math.min(3, state.wanted) : 0;
  // spawn up to `want` police cars near the player
  while (state.police.cars.length < want) {
    const a = Math.random() * Math.PI * 2;
    const c = makeCar(state.player.pos.x + Math.sin(a) * 45, state.player.pos.z + Math.cos(a) * 45, 0, 0x111111, true);
    c.police = true; c.parked = false; c.speed = 0;
    scene.add(c.mesh); state.police.cars.push(c);
  }
  while (state.police.cars.length > want) {
    const c = state.police.cars.pop(); scene.remove(c.mesh);
  }
  // chase: steer toward player, ram speed scales with stars
  for (const c of state.police.cars) {
    const dx = state.player.pos.x - c.x, dz = state.player.pos.z - c.z;
    const dist = Math.hypot(dx, dz) || 1;
    const target = Math.atan2(-dx, -dz);
    let diff = target - c.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
    const top = 13 + state.wanted * 2.5;
    c.speed += (top - c.speed) * dt * 0.8;
    c.x += -Math.sin(c.heading) * c.speed * dt;
    c.z += -Math.cos(c.heading) * c.speed * dt;
    c.mesh.position.set(c.x, 0, c.z);
    c.mesh.rotation.y = c.heading;
    // flashing light bar
    if (c.mesh.userData.lightBar) c.mesh.userData.lightBar.material.emissive.setHex((Math.floor(performance.now() / 250) % 2) ? 0xff0000 : 0x0000ff);
    // ram: damage player on contact
    if (dist < 3.2) {
      state.player.health = Math.max(0, state.player.health - 12 * dt);
      if (state.player.car) { state.player.car.speed *= 0.94; }
    }
  }
  // wanted decays when no police can see the player (far away / hiding)
  if (state.wanted > 0) {
    state.wantedTimer -= dt;
    const nearest = state.police.cars.reduce((m, c) => Math.min(m, Math.hypot(c.x - state.player.pos.x, c.z - state.player.pos.z)), 999);
    if (nearest > 70 && state.wantedTimer <= 0) {
      state.wanted -= 1; state.wantedTimer = 6;
      state.toast('You lost a star — stay out of sight!');
    }
  }
}
export function addWanted(state, n, reason) {
  const before = state.wanted;
  state.wanted = Math.min(5, state.wanted + n);
  state.wantedTimer = 8;
  if (state.wanted > before) state.toast(`WANTED +${state.wanted - before}★ — ${reason}`);
}
