// Neon Bay — vehicles: car mesh factory + driving physics (original code).
import * as THREE from 'three';
export function makeCarMesh(color, police = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.4), bodyMat);
  body.position.y = 0.55; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x18202e }));
  cabin.position.set(0, 1.2, -0.2); g.add(cabin);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.42, wz); g.add(w); wheels.push(w);
  }
  if (police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0xaa0000 }));
    bar.position.set(0, 1.65, -0.2); g.add(bar); g.userData.lightBar = bar;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 4.42),
      new THREE.MeshLambertMaterial({ color: 0x111111 }));
    stripe.position.y = 0.75; g.add(stripe);
  } else {
    const neon = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.12, 4.44),
      new THREE.MeshLambertMaterial({ color: 0xff5da2, emissive: 0x661133 }));
    neon.position.y = 0.32; g.add(neon);
  }
  // headlights
  for (const sx of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xfff6c0, emissive: 0x888800 }));
    h.position.set(sx, 0.6, -2.22); g.add(h);
  }
  g.userData.wheels = wheels;
  return g;
}
export function makeCar(x, z, heading, color, police = false) {
  const mesh = makeCarMesh(color, police);
  mesh.position.set(x, 0, z); mesh.rotation.y = heading;
  return { mesh, x, z, heading, speed: 0, color, police, parked: !police, id: Math.random().toString(36).slice(2, 8) };
}
// Simple arcade driving: accelerate / brake / reverse / steer, skid on hard turns.
export function driveCar(car, input, dt, colliders, onCrash) {
  const fwd = { x: -Math.sin(car.heading), z: -Math.cos(car.heading) };
  if (input.z < 0) car.speed += 26 * dt;
  if (input.z > 0) car.speed -= (car.speed > 0.5 ? 30 : 14) * dt;
  if (input.brake) car.speed *= Math.max(0, 1 - 3.5 * dt);
  car.speed *= Math.max(0, 1 - 0.4 * dt); // drag
  car.speed = Math.max(-9, Math.min(30, car.speed));
  const steer = input.x * (car.speed >= 0 ? 1 : -1);
  car.heading += steer * 1.9 * dt * Math.min(1, Math.abs(car.speed) / 8);
  const nx = car.x + fwd.x * car.speed * dt, nz = car.z + fwd.z * car.speed * dt;
  // collide with buildings
  let hit = false;
  for (const c of colliders) {
    if (Math.abs(nx - c.x) < c.hw + 1.4 && Math.abs(nz - c.z) < c.hd + 1.4) { hit = true; break; }
  }
  if (hit) { if (Math.abs(car.speed) > 6 && onCrash) onCrash(Math.abs(car.speed)); car.speed *= -0.25; }
  else { car.x = nx; car.z = nz; }
  car.x = Math.max(-208, Math.min(208, car.x));
  car.z = Math.max(-208, Math.min(230, car.z));
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.heading;
  car.mesh.rotation.z = -steer * Math.min(0.06, Math.abs(car.speed) * 0.003);
  for (const w of car.mesh.userData.wheels) w.rotation.x += car.speed * dt * 2;
  return car.speed;
}
export const CAR_COLORS = [0xff3355, 0xffd23e, 0x37e0ff, 0x7dffb0, 0xff8a5c, 0x8b7cff, 0xf5f0e6, 0x2ecc71];
