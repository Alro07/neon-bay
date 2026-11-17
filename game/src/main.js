// main.js — Neon Bay entry point: renderer, game loop, third-person camera,
// on-foot movement, stealing / exiting cars, pause, death and wiring for
// every system (city, traffic, pedestrians, police, missions, combat, HUD,
// audio, save). Original game for make.fun gta6-01.
import * as THREE from 'three';
import { buildCity, makeRng, resolveBuildingCollision, clampToCity } from './city.js';
import { createCar, spawnParkedCars, updatePlayerCar, bumpCars } from './vehicles.js';
import { spawnTraffic, updateTraffic } from './traffic.js';
import { spawnPedestrians, updatePedestrians, scarePedestrians } from './pedestrians.js';
import { updatePolice, addWanted } from './police.js';
import { startMission, updateMissions, restartMission, MISSIONS } from './missions.js';
import { tryPunch, tryShoot, updateParticles } from './combat.js';
import { initHud, updateHud, showHud, showDialog, hideDialog, showToast } from './hud.js';
import { createInput, bindInput, consumeMouse } from './input.js';
import { createSoundBank } from './audio.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { shotName, applyShot } from './shots.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87bfe8);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9fd0ee, 120, 260);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600);

// Sun-soaked daylight.
const sun = new THREE.DirectionalLight(0xfff2d0, 2.8);
sun.position.set(60, 90, -40);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a5a44, 1.5));

// --- shared game state -------------------------------------------------------
const rng = makeRng(20261117);
const state = {
  scene, elapsed: 0, clockMinutes: 10 * 60,
  started: false, paused: false, shotMode: null,
  cash: 0, health: 100, wanted: 0, wantedTimer: 0, lastCrimeAt: -999,
  missionIndex: 0, missionStage: 0, missionTimer: 0,
  objective: 'Meet Mara — start your first job.',
  waypoint: null, speedMph: 0, damageFlash: 0,
  punchCooldown: 0, shootCooldown: 0,
  toastText: '', toastUntil: 0, promptText: '',
  player: {
    pos: new THREE.Vector3(-7.5, 0, 20), yaw: 0, onFoot: true,
    car: null, inCar: false, walkSpeed: 6,
  },
  cameraYaw: 0, cameraPitch: 0.3,
  input: createInput(),
  city: null, parked: [], traffic: [], peds: [], police: [],
  sound: createSoundBank(),
  toast(text, seconds) { showToast(state, text, seconds); },
  dialog(text) { showDialog(text); state.dialogVisible = true; },
  playPickup() { state.sound.pickup(); },
  playPunch() { state.sound.punch(); },
  playShot() { state.sound.shot(); },
  onMissionStart() {},
  onMissionComplete() {},
};

state.city = buildCity(scene);
state.parked = spawnParkedCars(scene, rng);
state.traffic = spawnTraffic(scene, rng);
state.peds = spawnPedestrians(scene, rng);

// The player character: simple capsule figure with a neon jacket.
const playerMesh = new THREE.Group();
{
  const jacket = new THREE.MeshLambertMaterial({ color: 0xff2ea6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.4), jacket);
  body.position.y = 1.05;
  playerMesh.add(body);
  const skin = new THREE.MeshLambertMaterial({ color: 0xf2c89b });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), skin);
  head.position.y = 1.8;
  playerMesh.add(head);
  const pants = new THREE.MeshLambertMaterial({ color: 0x1c2440 });
  for (const sx of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.26), pants);
    leg.position.set(sx, 0.31, 0);
    leg.name = sx < 0 ? 'legL' : 'legR';
    playerMesh.add(leg);
  }
}
scene.add(playerMesh);

// --- interaction -------------------------------------------------------------
function nearestParkedCar(maxDist) {
  let best = null; let bestD = maxDist;
  for (const car of state.parked) {
    const d = Math.hypot(car.group.position.x - state.player.pos.x, car.group.position.z - state.player.pos.z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

function enterCar(car) {
  if (!car.stolen) {
    car.stolen = true;
    addWanted(state, 1, 'Car stolen!');
    scarePedestrians(state, state.player.pos.x, state.player.pos.z, 12);
  }
  car.parked = false;
  state.player.car = car;
  state.player.inCar = true;
  state.player.onFoot = false;
  state.player.yaw = car.heading;
  state.cameraYaw = car.heading;
  state.sound.click();
}

function exitCar() {
  const car = state.player.car;
  if (!car) return;
  car.speed = 0;
  state.player.pos.set(
    car.group.position.x + Math.cos(car.heading) * 2.4, 0,
    car.group.position.z - Math.sin(car.heading) * 2.4);
  state.player.car = null;
  state.player.inCar = false;
  state.player.onFoot = true;
  state.player.yaw = state.cameraYaw;
}

function onInteract() {
  if (!state.started || state.paused) return;
  if (state.dialogVisible) { hideDialog(); state.dialogVisible = false; return; }
  if (state.player.car) { exitCar(); return; }
  const car = nearestParkedCar(4.2);
  if (car) enterCar(car);
}

function onPause() {
  if (!state.started) return;
  state.paused = !state.paused;
  document.getElementById('pause-screen').classList.toggle('hidden', !state.paused);
  if (document.pointerLockElement) document.exitPointerLock();
  if (state.paused) saveGame(state);
}

bindInput(state.input, canvas, {
  onInteract,
  onPunch: () => tryPunch(state),
  onShoot: () => tryShoot(state),
  onRestartMission: () => { if (state.started && !state.paused) restartMission(state); },
  onPause,
  onLockRequest: () => { if (state.started && !state.paused) canvas.requestPointerLock(); },
  onDialogAdvance: () => { if (state.dialogVisible) { hideDialog(); state.dialogVisible = false; } },
});

// --- menus -------------------------------------------------------------------
const startScreen = document.getElementById('start-screen');
const btnStart = document.getElementById('btn-start');
const btnContinue = document.getElementById('btn-continue');
if (hasSave()) btnContinue.classList.remove('hidden');

function beginGame(fromSave) {
  state.sound.init();
  startScreen.classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');
  state.started = true;
  state.paused = false;
  showHud(true);
  if (fromSave) {
    const data = loadGame();
    if (data) {
      state.cash = data.cash; state.health = data.health; state.wanted = data.wanted;
      state.clockMinutes = data.clockMinutes;
      state.player.pos.set(data.pos.x, 0, data.pos.z);
      startMission(state, Math.min(data.missionIndex, MISSIONS.length - 1));
      state.toast('Save loaded — welcome back to Neon Bay', 3);
    }
  } else {
    startMission(state, 0);
  }
  canvas.requestPointerLock();
}
btnStart.addEventListener('click', () => beginGame(false));
btnContinue.addEventListener('click', () => beginGame(true));
document.getElementById('btn-resume').addEventListener('click', onPause);
document.getElementById('btn-save').addEventListener('click', () => {
  if (saveGame(state)) state.toast('Game saved', 2);
});
document.getElementById('btn-restart-mission').addEventListener('click', () => {
  restartMission(state); onPause();
});
document.getElementById('btn-quit').addEventListener('click', () => {
  saveGame(state);
  state.started = false; state.paused = false;
  document.getElementById('pause-screen').classList.add('hidden');
  startScreen.classList.remove('hidden');
  showHud(false);
  if (document.pointerLockElement) document.exitPointerLock();
});

// --- on-foot movement ---------------------------------------------------------
function updateOnFoot(dt) {
  const input = state.input;
  const speed = input.sprint ? 10 : 6;
  const forward = { x: Math.sin(state.cameraYaw), z: Math.cos(state.cameraYaw) };
  const right = { x: Math.cos(state.cameraYaw), z: -Math.sin(state.cameraYaw) };
  let mx = 0; let mz = 0;
  if (input.forward) { mx += forward.x; mz += forward.z; }
  if (input.back) { mx -= forward.x; mz -= forward.z; }
  if (input.right) { mx += right.x; mz += right.z; }
  if (input.left) { mx -= right.x; mz -= right.z; }
  const len = Math.hypot(mx, mz);
  if (len > 0.01) {
    mx /= len; mz /= len;
    state.player.yaw = Math.atan2(mx, mz);
    let nx = state.player.pos.x + mx * speed * dt;
    let nz = state.player.pos.z + mz * speed * dt;
    const fixed = resolveBuildingCollision(state.city.colliders, nx, nz, 0.6);
    const clamped = clampToCity(fixed.x, fixed.z, 2);
    state.player.pos.x = clamped.x;
    state.player.pos.z = clamped.z;
    playerMesh.visible = true;
    playerMesh.position.copy(state.player.pos);
    playerMesh.rotation.y = state.player.yaw;
    const phase = state.elapsed * 11;
    playerMesh.getObjectByName('legL').rotation.x = Math.sin(phase) * 0.6;
    playerMesh.getObjectByName('legR').rotation.x = -Math.sin(phase) * 0.6;
  } else {
    playerMesh.getObjectByName('legL').rotation.x = 0;
    playerMesh.getObjectByName('legR').rotation.x = 0;
  }
  state.speedMph = 0;
}

// --- camera ------------------------------------------------------------------
function updateCamera(dt) {
  const { dx, dy } = consumeMouse(state.input);
  state.cameraYaw -= dx * 0.0028;
  state.cameraPitch = Math.max(0.08, Math.min(0.85, state.cameraPitch + dy * 0.0022));
  const dist = state.player.car ? 11.5 : 8.5;
  const height = state.player.car ? 4.6 : 3.6;
  const tx = state.player.pos.x - Math.sin(state.cameraYaw) * dist;
  const tz = state.player.pos.z - Math.cos(state.cameraYaw) * dist;
  let ty = height + Math.sin(state.cameraPitch) * 4;
  // Keep the camera out of buildings: rise above any roof it would sit inside.
  for (const c of state.city.colliders) {
    if (c.h && tx > c.minX - 0.5 && tx < c.maxX + 0.5 && tz > c.minZ - 0.5 && tz < c.maxZ + 0.5 && ty < c.h + 2) {
      ty = c.h + 2;
    }
  }
  camera.position.set(tx, ty, tz);
  camera.lookAt(state.player.pos.x, 1.6, state.player.pos.z);
  if (state.player.car) {
    // Chase camera follows the car's heading when driving.
    if (Math.abs(state.player.car.speed) > 3) {
      let diff = state.player.car.heading - state.cameraYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      state.cameraYaw += diff * Math.min(1, 2.2 * dt);
    }
  }
}

// --- main loop ---------------------------------------------------------------
const clock = new THREE.Clock();
let saveTimer = 0;
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  state.elapsed += dt;
  state.clockMinutes += dt * 0.35;
  state.punchCooldown = Math.max(0, state.punchCooldown - dt);
  state.shootCooldown = Math.max(0, state.shootCooldown - dt);
  state.damageFlash = Math.max(0, state.damageFlash - dt);

  if (state.started && !state.paused) {
    if (state.player.car) {
      state.speedMph = updatePlayerCar(state, dt);
      playerMesh.visible = false;
      // Car bumps into traffic / parked cars.
      for (const t of state.traffic) bumpCars(state.player.car, t, 1);
      for (const p of state.parked) {
        if (p !== state.player.car) bumpCars(state.player.car, p, 1);
      }
    } else {
      updateOnFoot(dt);
      playerMesh.visible = true;
      playerMesh.position.copy(state.player.pos);
      const car = nearestParkedCar(4.2);
      state.promptText = car ? 'Press E to take the car' : '';
    }
    updateTraffic(state, dt);
    updatePedestrians(state, dt, rng);
    updatePolice(state, dt);
    updateMissions(state, dt);
    updateParticles(state, dt);
    // Health regen when calm; death respawns at the plaza.
    if (state.wanted === 0 && state.health < 100) state.health = Math.min(100, state.health + 3 * dt);
    if (state.health <= 0) {
      state.health = 100;
      state.wanted = 0;
      state.cash = Math.max(0, state.cash - 100);
      if (state.player.car) { state.player.car = null; state.player.inCar = false; }
      state.player.pos.set(-7.5, 0, 20);
      state.toast('You got busted up — patched up at the plaza. -$100', 3.5);
    }
    state.sound.setEngine(state.speedMph, !!state.player.car);
    state.sound.setSiren(state.wanted);
    saveTimer += dt;
    if (saveTimer > 15) { saveTimer = 0; saveGame(state); }
    updateHud(state);
  }
  // Gentle water + beacon motion even on the title screen.
  if (state.city.water) state.city.water.position.y = 0.02 + Math.sin(state.elapsed * 0.7) * 0.05;
  if (state.city.beacon) state.city.beacon.rotation.y = state.elapsed * 0.4;
  updateCamera(state.started && !state.paused ? dt : 0.016);
  if (!state.started) {
    // Slow cinematic orbit over the city behind the title screen.
    const a = state.elapsed * 0.05;
    camera.position.set(Math.sin(a) * 70, 34, Math.cos(a) * 70 - 10);
    camera.lookAt(0, 4, -10);
  }
  renderer.render(scene, camera);
  frameCount += 1;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Screenshot staging runs before the first frame; it starts its own mission.
initHud();
const shot = shotName();
if (shot) {
  state.started = true;
  showHud(true);
  applyShot(state, shot);
}
animate();

// Test hooks (used by the maker's own Playwright checks, not by the game).
window.__NEONBAY__ = {
  state,
  startMission: (i) => startMission(state, i),
  enterNearestCar: () => { const c = nearestParkedCar(99); if (c) { state.player.pos.set(c.group.position.x, 0, c.group.position.z); enterCar(c); } return !!state.player.car; },
  teleport: (x, z) => { state.player.pos.set(x, 0, z); if (state.player.car) { state.player.car.group.position.set(x, 0, z); } },
  frames: () => frameCount,
};
