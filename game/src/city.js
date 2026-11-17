// Neon Bay — city: ground, roads, buildings, palms, beach, sea, lamps (original code).
import * as THREE from 'three';
export const CITY = 420; // city spans -210..210
export const ROADS = [-150, -90, -30, 30, 90, 150]; // grid road centres
let seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
function box(w, h, d, color, x, y, z, emissive = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, emissive }));
  m.position.set(x, y, z); return m;
}
export function buildCity(scene) {
  const colliders = []; // {x,z,hw,hd}
  const group = new THREE.Group();
  // ground + beach + sea
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(CITY + 160, CITY + 160),
    new THREE.MeshLambertMaterial({ color: 0x3d7a4a }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 0); group.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(CITY + 160, 40),
    new THREE.MeshLambertMaterial({ color: 0xe8d28a }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.02, CITY / 2 + 20); group.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(CITY + 160, 120),
    new THREE.MeshLambertMaterial({ color: 0x1e90d6 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.01, CITY / 2 + 100); group.add(sea);
  // roads: dark strips + centre dashes
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x2b2f38 });
  for (const r of ROADS) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(CITY, 14), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.03, r); group.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(14, CITY), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(r, 0.03, 0); group.add(v);
    for (let i = -200; i <= 200; i += 16) {
      const d1 = box(6, 0.05, 0.6, 0xffe066, i, 0.05, r);
      const d2 = box(0.6, 0.05, 6, 0xffe066, r, 0.05, i);
      group.add(d1, d2);
    }
  }
  // sidewalks: light strips along roads
  const walkMat = new THREE.MeshLambertMaterial({ color: 0x9aa3ad });
  for (const r of ROADS) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(CITY, 3), walkMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.04, r + 8.5); group.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(3, CITY), walkMat);
    v.rotation.x = -Math.PI / 2; v.position.set(r + 8.5, 0.04, 0); group.add(v);
  }
  // buildings in blocks between roads
  const palette = [0xff5da2, 0x37e0ff, 0xffd23e, 0x8b7cff, 0x7dffb0, 0xff8a5c, 0x5ce1e6, 0xf5f0e6, 0x4a6fa5, 0xe07a9a];
  const winMat = new THREE.MeshLambertMaterial({ color: 0x9fe8ff, emissive: 0x224455 });
  for (let i = 0; i < ROADS.length - 1; i++) {
    for (let j = 0; j < ROADS.length - 1; j++) {
      const cx = (ROADS[i] + ROADS[i + 1]) / 2, cz = (ROADS[j] + ROADS[j + 1]) / 2;
      const n = 1 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) {
        const w = 14 + rnd() * 16, d = 14 + rnd() * 16, h = 12 + rnd() * 46;
        const x = cx + (k - 0.5) * 22 + (rnd() - 0.5) * 8, z = cz + (rnd() - 0.5) * 14;
        const c = palette[Math.floor(rnd() * palette.length)];
        const b = box(w, h, d, c, x, h / 2, z);
        group.add(b);
        // neon roof trim + windows strip
        group.add(box(w + 0.4, 0.8, d + 0.4, 0xffffff, x, h + 0.4, z, c));
        for (let wy = 6; wy < h - 2; wy += 7) group.add(box(w * 0.8, 1.6, 0.3, 0x9fe8ff, x, wy, z + d / 2 + 0.1));
        colliders.push({ x, z, hw: w / 2, hd: d / 2 });
      }
    }
  }
  // landmark: Neon Tower (tall, centre) + Marina Pier + Bay Plaza sign blocks
  const tower = box(24, 95, 24, 0x2a2a55, 0, 47.5, 0);
  group.add(tower);
  group.add(box(26, 2, 26, 0xff5da2, 0, 96, 0, 0xff5da2));
  colliders.push({ x: 0, z: 0, hw: 13, hd: 13 });
  // palms along beach road
  for (let x = -200; x <= 200; x += 20) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 6),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2b }));
    trunk.position.set(x, 4.5, 196); group.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x2fae5f }));
    top.position.set(x, 9.5, 196); top.scale.y = 0.6; group.add(top);
  }
  // street lamps at intersections (thin poles, off the sidewalk centre)
  for (const rx of ROADS) for (const rz of ROADS) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6),
      new THREE.MeshLambertMaterial({ color: 0x333a45 }));
    pole.position.set(rx + 10.5, 3, rz + 10.5); group.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xfff2a0, emissive: 0xaa8800 }));
    lamp.position.set(rx + 10.5, 6.2, rz + 10.5); group.add(lamp);
  }
  scene.add(group);
  return { colliders, group };
}
export function collideCircle(colliders, x, z, r) {
  for (const c of colliders) {
    const dx = Math.max(Math.abs(x - c.x) - c.hw, 0), dz = Math.max(Math.abs(z - c.z) - c.hd, 0);
    if (dx * dx + dz * dz < r * r) return c;
  }
  return null;
}
export function clampCity(x, z) {
  return { x: Math.max(-205, Math.min(205, x)), z: Math.max(-205, Math.min(228, z)) };
}
