// city.js — builds the Neon Bay city: ground, road grid, beach, buildings,
// palms, lamps and neon signs. Deterministic (seeded RNG) so every run looks the same.
import * as THREE from 'three';

export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROAD_COORDS = [-60, -30, 0, 30, 60];
const ROAD_W = 9;
export const CITY_BOUND = 96;

function windowTexture(rng) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  // Light base so the building colour stays bright in daylight; windows glow.
  g.fillStyle = '#9aa0b5'; g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 12) {
      const lit = rng() < 0.55;
      g.fillStyle = lit ? (rng() < 0.7 ? '#ffe9a3' : '#8ef6ff') : '#3a4060';
      g.fillRect(x, y, 8, 7);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCity(scene) {
  const rng = makeRng(20261117);
  const colliders = [];
  const group = new THREE.Group();
  group.name = 'NeonBayCity';

  // Ground: big concrete slab.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshLambertMaterial({ color: 0x5a6b4e }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -10);
  group.add(ground);

  // Beach sand (south edge) and the bay water beyond it.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 34),
    new THREE.MeshLambertMaterial({ color: 0xe8d29a }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.05, -102);
  group.add(sand);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 90),
    new THREE.MeshLambertMaterial({ color: 0x1e7fb8, emissive: 0x0a3d66 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.02, -164);
  water.name = 'bayWater';
  group.add(water);

  // Roads: dark strips along every grid line, plus the beach boulevard.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x23242e });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0x8a8f9e });
  for (const c of ROAD_COORDS) {
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 200), roadMat);
    ns.rotation.x = -Math.PI / 2; ns.position.set(c, 0.08, -5);
    group.add(ns);
    const ew = new THREE.Mesh(new THREE.PlaneGeometry(200, ROAD_W), roadMat);
    ew.rotation.x = -Math.PI / 2; ew.position.set(-5, 0.08, c);
    group.add(ew);
    // Sidewalk strips beside each road.
    for (const off of [-7.5, 7.5]) {
      const s1 = new THREE.Mesh(new THREE.PlaneGeometry(3, 200), walkMat);
      s1.rotation.x = -Math.PI / 2; s1.position.set(c + off, 0.06, -5);
      group.add(s1);
      const s2 = new THREE.Mesh(new THREE.PlaneGeometry(200, 3), walkMat);
      s2.rotation.x = -Math.PI / 2; s2.position.set(-5, 0.06, c + off);
      group.add(s2);
    }
    // Dashed centre lines.
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffe9a3 });
    for (let d = -95; d < 95; d += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.4), dashMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(c, 0.1, d);
      group.add(dash);
    }
  }

  // Buildings: one or two per block, bright neon palette, lit windows.
  const palette = [0xff5da2, 0x39e6ff, 0xffd23e, 0x7dff8a, 0xff7a3d, 0xb678ff, 0x4dc3ff, 0xff4d6d];
  const winTex = windowTexture(rng);
  const blocks = [];
  for (let i = 0; i < ROAD_COORDS.length - 1; i++) {
    for (let j = 0; j < ROAD_COORDS.length - 1; j++) {
      blocks.push([ROAD_COORDS[i] + 15, ROAD_COORDS[j] + 15]);
    }
  }
  const buildingMeshes = [];
  for (const [bx, bz] of blocks) {
    const count = rng() < 0.5 ? 1 : 2;
    for (let k = 0; k < count; k++) {
      const w = 9 + rng() * 7;
      const d = 9 + rng() * 7;
      const h = 8 + rng() * rng() * 34;
      const cx = bx + (count === 2 ? (k === 0 ? -5 : 5) : 0) + (rng() - 0.5) * 2;
      const cz = bz + (rng() - 0.5) * 2;
      const color = palette[Math.floor(rng() * palette.length)];
      const mat = new THREE.MeshLambertMaterial({ color, map: winTex, emissive: color, emissiveIntensity: 0.28 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(cx, h / 2, cz);
      group.add(b);
      buildingMeshes.push(b);
      colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, h });
      // Neon roof trim.
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3),
        new THREE.MeshBasicMaterial({ color: 0xff2ea6 }),
      );
      trim.position.set(cx, h + 0.25, cz);
      group.add(trim);
    }
  }

  // Neon Tower landmark at the north-east corner plaza.
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(16, 62, 16),
    new THREE.MeshLambertMaterial({ color: 0x27306e, map: winTex, emissive: 0x331133 }),
  );
  tower.position.set(76, 31, 76);
  group.add(tower);
  colliders.push({ minX: 68, maxX: 84, minZ: 68, maxZ: 84, h: 62 });
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 2.2, 26, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff2ea6, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  beacon.position.set(76, 75, 76);
  beacon.name = 'towerBeacon';
  group.add(beacon);

  // Palm trees along the beach boulevard.
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2fae5f });
  for (let x = -85; x <= 85; x += 10) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 8), trunkMat);
    trunk.position.set(x, 3.5, -72);
    group.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.4, 8), leafMat);
    crown.position.set(x, 8.4, -72);
    group.add(crown);
  }

  // Street lamps at intersections.
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x30343f });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const cx of ROAD_COORDS) {
    for (const cz of ROAD_COORDS) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6, 6), poleMat);
      pole.position.set(cx + 6, 3, cz + 6);
      group.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), lampMat);
      lamp.position.set(cx + 6, 6.2, cz + 6);
      group.add(lamp);
    }
  }

  scene.add(group);
  return { group, colliders, buildingMeshes, water, beacon };
}

// Push a circle (x, z, radius) out of every building collider it overlaps.
export function resolveBuildingCollision(colliders, x, z, radius) {
  let px = x; let pz = z;
  for (const c of colliders) {
    const nx = Math.max(c.minX, Math.min(px, c.maxX));
    const nz = Math.max(c.minZ, Math.min(pz, c.maxZ));
    const dx = px - nx; const dz = pz - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        px = nx + (dx / d) * radius;
        pz = nz + (dz / d) * radius;
      } else {
        px = c.maxX + radius;
      }
    }
  }
  return { x: px, z: pz };
}

export function clampToCity(x, z, margin = 4) {
  return {
    x: Math.max(-CITY_BOUND + margin, Math.min(CITY_BOUND - margin, x)),
    z: Math.max(-118, Math.min(CITY_BOUND - margin, z)),
  };
}
