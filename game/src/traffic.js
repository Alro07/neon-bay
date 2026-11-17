// traffic.js — AI traffic cars that loop around city blocks on the road grid,
// slowing down when something is right in front of them.
import * as THREE from 'three';
import { createCar, bumpCars } from './vehicles.js';

const LOOPS = [
  [[-60, -60], [60, -60], [60, 60], [-60, 60]],
  [[-30, -30], [30, -30], [30, 30], [-30, 30]],
  [[-60, 0], [60, 0], [60, 30], [-60, 30]],
  [[0, -60], [0, 60], [-30, 60], [-30, -60]],
  [[-60, -30], [-60, 30], [30, 30], [30, -30]],
  [[-30, -60], [60, -60], [60, 0], [-30, 0]],
];

export function spawnTraffic(scene, rng) {
  const cars = [];
  LOOPS.forEach((loop, i) => {
    const start = loop[i % loop.length];
    const c = createCar(scene, start[0], start[1], 0, 0x9aa3b2);
    c.loop = loop;
    c.loopIndex = (i + 1) % loop.length;
    c.cruise = 9 + rng() * 4;
    c.wait = 0;
    cars.push(c);
  });
  return cars;
}

function obstacleAhead(state, car, dist) {
  const fx = Math.sin(car.heading); const fz = Math.cos(car.heading);
  const px = car.group.position.x; const pz = car.group.position.z;
  const check = (x, z) => {
    const dx = x - px; const dz = z - pz;
    const along = dx * fx + dz * fz;
    const side = Math.abs(dx * fz - dz * fx);
    return along > 0 && along < dist && side < 2.2;
  };
  if (state.player.car !== car && check(state.player.pos.x, state.player.pos.z)) return true;
  for (const other of state.traffic) {
    if (other !== car && check(other.group.position.x, other.group.position.z)) return true;
  }
  for (const cop of state.police) {
    if (check(cop.group.position.x, cop.group.position.z)) return true;
  }
  return false;
}

export function updateTraffic(state, dt) {
  for (const car of state.traffic) {
    const target = car.loop[car.loopIndex];
    const dx = target[0] - car.group.position.x;
    const dz = target[1] - car.group.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 2.5) {
      car.loopIndex = (car.loopIndex + 1) % car.loop.length;
      continue;
    }
    const wantHeading = Math.atan2(dx, dz);
    let diff = wantHeading - car.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
    const blocked = obstacleAhead(state, car, 9);
    const targetSpeed = blocked ? 0 : car.cruise;
    car.speed += (targetSpeed - car.speed) * Math.min(1, 2.5 * dt);
    car.group.position.x += Math.sin(car.heading) * car.speed * dt;
    car.group.position.z += Math.cos(car.heading) * car.speed * dt;
    car.group.rotation.y = car.heading;
    for (const w of car.wheels) w.rotation.x += car.speed * dt * 2.4;
  }
  // Keep traffic cars from overlapping each other.
  for (let i = 0; i < state.traffic.length; i++) {
    for (let j = i + 1; j < state.traffic.length; j++) {
      bumpCars(state.traffic[i], state.traffic[j], 0.6);
    }
  }
}
