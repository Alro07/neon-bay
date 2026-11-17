// Neon Bay — traffic cars looping on the road grid (original code).
import { makeCar, CAR_COLORS } from './vehicles.js';
import { ROADS } from './city.js';
export function spawnTraffic(scene, n = 14) {
  const cars = [];
  for (let i = 0; i < n; i++) {
    const horizontal = i % 2 === 0;
    const road = ROADS[i % ROADS.length];
    const along = -190 + (i * 53) % 380;
    const color = CAR_COLORS[i % CAR_COLORS.length];
    const heading = horizontal ? (i % 4 < 2 ? Math.PI / 2 : -Math.PI / 2) : (i % 4 < 2 ? 0 : Math.PI);
    const car = makeCar(horizontal ? along : road + (i % 3 - 1) * 2.5, horizontal ? road + (i % 3 - 1) * 2.5 : along, heading, color);
    car.parked = false; car.speed = 7 + (i % 5);
    car.horizontal = horizontal; car.road = road;
    scene.add(car.mesh); cars.push(car);
  }
  return cars;
}
export function updateTraffic(cars, dt, playerCar) {
  for (const c of cars) {
    const fwd = { x: -Math.sin(c.heading), z: -Math.cos(c.heading) };
    // slow down if the player's car is right ahead
    let slow = false;
    if (playerCar) {
      const dx = playerCar.x - c.x, dz = playerCar.z - c.z;
      const d = Math.hypot(dx, dz);
      if (d < 9 && dx * fwd.x + dz * fwd.z > 0) slow = true;
    }
    const target = slow ? 0 : 8 + (c.speed % 3);
    c.speed += (target - c.speed) * dt;
    c.x += fwd.x * c.speed * dt; c.z += fwd.z * c.speed * dt;
    if (c.x > 205) c.x = -205; if (c.x < -205) c.x = 205;
    if (c.z > 225) c.z = -205; if (c.z < -205) c.z = 225;
    c.mesh.position.set(c.x, 0, c.z);
    for (const w of c.mesh.userData.wheels) w.rotation.x += c.speed * dt * 2;
  }
}
export function spawnParked(scene) {
  const cars = [];
  const spots = [[-30, -82], [30, -142], [90, 38], [-90, 98], [150, -22], [-150, 158], [30, 158], [-30, 38]];
  spots.forEach(([x, z], i) => {
    const car = makeCar(x, z, (i % 2 ? Math.PI / 2 : 0), CAR_COLORS[(i * 3 + 1) % CAR_COLORS.length]);
    car.parked = true; scene.add(car.mesh); cars.push(car);
  });
  return cars;
}
