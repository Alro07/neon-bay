// Neon Bay — combat: punch + shoot, particles, tracer (original code).
import * as THREE from 'three';
export function makeParticles(scene) {
  const parts = [];
  return {
    burst(x, y, z, color = 0xffd23e, n = 14) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5),
          new THREE.MeshBasicMaterial({ color }));
        m.position.set(x, y, z);
        scene.add(m);
        parts.push({ m, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 8, life: 0.6 });
      }
    },
    update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt;
        p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
        p.vy -= 12 * dt;
        if (p.life <= 0) { scene.remove(p.m); parts.splice(i, 1); }
      }
    },
  };
}
export function punch(state) {
  // hit nearest ped / police within 2.2m in front
  const p = state.player.pos;
  let hit = null, best = 2.4;
  for (const ped of state.peds) {
    const d = Math.hypot(ped.x - p.x, ped.z - p.z);
    if (d < best) { best = d; hit = ped; }
  }
  if (hit) {
    hit.scared = 3; hit.heading = Math.atan2(-(p.x - hit.x), -(p.z - hit.z));
    state.particles.burst(hit.x, 1.4, hit.z, 0xff5da2);
    state.addWanted(1, 'assault');
    state.toast('You punched a pedestrian!');
  } else {
    state.particles.burst(p.x - Math.sin(state.player.heading) * 1.2, 1.2, p.z - Math.cos(state.player.heading) * 1.2, 0xffffff, 5);
  }
}
export function shoot(state) {
  const p = state.player.pos;
  const dir = { x: -Math.sin(state.player.heading), z: -Math.cos(state.player.heading) };
  let hit = null, best = 40;
  for (const ped of state.peds) {
    const dx = ped.x - p.x, dz = ped.z - p.z;
    const along = dx * dir.x + dz * dir.z;
    const perp = Math.abs(dx * dir.z - dz * dir.x);
    if (along > 0 && along < best && perp < 1.2) { best = along; hit = ped; }
  }
  // tracer line
  const end = hit ? { x: hit.x, z: hit.z } : { x: p.x + dir.x * 30, z: p.z + dir.z * 30 };
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(p.x, 1.4, p.z), new THREE.Vector3(end.x, 1.2, end.z)]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe066 }));
  state.scene.add(line);
  setTimeout(() => state.scene.remove(line), 90);
  if (hit) {
    hit.scared = 4; state.particles.burst(hit.x, 1.4, hit.z, 0xff2222);
    state.addWanted(1, 'shooting');
  }
  state.ammo = Math.max(0, (state.ammo ?? 30) - 1);
}
