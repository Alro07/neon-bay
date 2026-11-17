// Neon Bay — pedestrians walking the sidewalks (original code).
import * as THREE from 'three';
import { ROADS } from './city.js';
const SHIRTS = [0xff5da2, 0xffd23e, 0x37e0ff, 0x7dffb0, 0xff8a5c, 0xffffff, 0x8b7cff];
export function makePed(x, z) {
  const g = new THREE.Group();
  const shirt = SHIRTS[Math.floor(Math.random() * SHIRTS.length)];
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.4),
    new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.0; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
  head.position.y = 1.75; g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x223344 }));
  legL.position.set(-0.18, 0.35, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.18; g.add(legR);
  g.position.set(x, 0, z);
  return { mesh: g, x, z, heading: Math.random() * Math.PI * 2, speed: 1.2 + Math.random(), legL, legR, phase: Math.random() * 6, scared: 0 };
}
export function spawnPeds(scene, n = 22) {
  const peds = [];
  for (let i = 0; i < n; i++) {
    const road = ROADS[i % ROADS.length];
    const along = -190 + (i * 37) % 380;
    const horizontal = i % 2 === 0;
    const p = makePed(horizontal ? along : road + 8.5, horizontal ? road + 8.5 : along);
    p.heading = horizontal ? (i % 4 < 2 ? Math.PI / 2 : -Math.PI / 2) : 0;
    scene.add(p.mesh); peds.push(p);
  }
  return peds;
}
export function updatePeds(peds, dt, playerPos, onHit) {
  for (const p of peds) {
    if (p.scared > 0) { p.scared -= dt; }
    const sp = p.scared > 0 ? 4.5 : p.speed;
    p.x += -Math.sin(p.heading) * sp * dt;
    p.z += -Math.cos(p.heading) * sp * dt;
    if (p.x > 205 || p.x < -205 || p.z > 230 || p.z < -205) p.heading += Math.PI;
    // hit by player car?
    if (playerPos && playerPos.inCar && Math.hypot(p.x - playerPos.x, p.z - playerPos.z) < 2.2 && Math.abs(playerPos.speed || 0) > 3) {
      if (onHit) onHit(p);
      p.scared = 2; p.heading += Math.PI / 2;
    }
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.heading;
    p.phase += dt * (p.scared > 0 ? 14 : 7);
    p.legL.rotation.x = Math.sin(p.phase) * 0.5;
    p.legR.rotation.x = -Math.sin(p.phase) * 0.5;
  }
}
