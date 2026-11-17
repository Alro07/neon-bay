// Neon Bay — boot, player, camera, main loop (original code).
import * as THREE from 'three';
import { keys, axis, consumeMouse, consumeClick, initInput } from './input.js';
import { initAudio, sfx, startMusic, engineStart, engineSet, engineStop } from './audio.js';
import { loadSave, saveGame } from './save.js';
import { buildCity, collideCircle, clampCity, ROADS } from './city.js';
import { makeCar, driveCar, CAR_COLORS } from './vehicles.js';
import { spawnTraffic, updateTraffic, spawnParked } from './traffic.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { makePolice, ensurePolice, addWanted } from './police.js';
import { MISSIONS, missionAt, startMission, updateMission } from './missions.js';
import { makeParticles, punch, shoot } from './combat.js';
import { drawMinimap, updateHUD } from './hud.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 180, 480);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
scene.add(new THREE.HemisphereLight(0xffffff, 0x3d7a4a, 1.1));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.6);
sun.position.set(120, 180, 60); scene.add(sun);

// --- state ---
const saved = loadSave();
const state = {
  cash: saved?.cash ?? 0, missionIndex: saved?.missionIndex ?? 0, completed: saved?.completed ?? [],
  wanted: 0, wantedTimer: 0, ammo: 30, missionTimer: 0, missionStage: 'go', missionDone: false,
  player: { pos: new THREE.Vector3(saved?.px ?? -30, 0, saved?.pz ?? -30), heading: 0, health: saved?.health ?? 100, car: null, walkSpeed: 0 },
  police: makePolice(scene), peds: [], traffic: [], parkedCars: [], scene,
  toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; clearTimeout(this._tt); this._tt = setTimeout(() => t.textContent = '', 3200); },
  dialog(who, text) { const d = document.getElementById('dialog'); document.getElementById('dlgWho').textContent = who + ': '; document.getElementById('dlgText').textContent = text; d.classList.remove('hidden'); clearTimeout(this._dt); this._dt = setTimeout(() => d.classList.add('hidden'), 5200); },
  addWanted(n, r) { addWanted(state, n, r); },
  sfxCash() { sfx.cash(); },
  save() { saveGame(state); },
  failMission(msg) { state.toast(msg); sfx.busted(); state.missionIndex = state.missionIndex; state.beginMission(); },
  beginMission() {
    const m = missionAt(state);
    if (!m) return;
    startMission(state, scene, marker);
  },
};
Object.defineProperty(state, 'mission', { get() { return missionAt(state); } });
state.player.pos.y = 0;

// --- world ---
const { colliders } = buildCity(scene);
state.traffic = spawnTraffic(scene, 14);
state.parkedCars = spawnParked(scene);
state.peds = spawnPeds(scene, 22);
state.particles = makeParticles(scene);
// player character (Rio): simple figure
const playerMesh = new THREE.Group();
const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.45), new THREE.MeshLambertMaterial({ color: 0xff3355 }));
pBody.position.y = 1.05; playerMesh.add(pBody);
const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
pHead.position.y = 1.85; playerMesh.add(pHead);
const pLegL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.28), new THREE.MeshLambertMaterial({ color: 0x223344 }));
pLegL.position.set(-0.2, 0.35, 0); playerMesh.add(pLegL);
const pLegR = pLegL.clone(); pLegR.position.x = 0.2; playerMesh.add(pLegR);
scene.add(playerMesh);
// waypoint marker: glowing beacon
const marker = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 30, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
marker.visible = false; scene.add(marker);
const markerBase = new THREE.Mesh(new THREE.TorusGeometry(3, 0.3, 8, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd23e }));
markerBase.rotation.x = Math.PI / 2; markerBase.position.y = 0.15; scene.add(markerBase);
// starter car near spawn
const starter = makeCar(-24, -30, Math.PI / 2, 0xff3355);
starter.parked = true; scene.add(starter.mesh); state.parkedCars.push(starter);

// --- UI refs ---
const els = {
  cash: document.getElementById('cash'), stars: document.getElementById('stars'),
  healthfill: document.getElementById('healthfill'), missionLabel: document.getElementById('missionLabel'),
  vehLabel: document.getElementById('vehLabel'), speedVal: document.getElementById('speedVal'),
  objTitle: document.getElementById('objTitle'), objText: document.getElementById('objText'),
};
const minimap = document.getElementById('minimap');
const menu = document.getElementById('menu');
let running = false, paused = false, camYaw = 0, camPitch = 0.32, walkPhase = 0;
let lastSave = 0;

function startGame(fresh) {
  initAudio(); startMusic();
  if (fresh) { state.cash = 0; state.missionIndex = 0; state.completed = []; state.player.pos.set(-30, 0, -30); state.player.health = 100; state.wanted = 0; }
  menu.classList.add('hidden');
  running = true; paused = false;
  if (missionAt(state)) state.beginMission();
  state.toast(fresh ? 'Welcome to Neon Bay!' : 'Welcome back to Neon Bay!');
}
document.getElementById('btnPlay').onclick = () => startGame(true);
document.getElementById('btnContinue').onclick = () => startGame(false);
document.getElementById('btnHow').onclick = () => document.getElementById('howText').classList.toggle('hidden');

function togglePause() {
  if (!running) return;
  paused = !paused;
  menu.classList.toggle('hidden', !paused);
  document.querySelector('#menu h1').textContent = paused ? 'PAUSED' : 'NEON BAY';
  if (!paused) document.querySelector('#menu h1').textContent = 'NEON BAY';
}
function interact() {
  if (!running || paused) return;
  const p = state.player;
  if (p.car) {
    // exit car
    const c = p.car; p.car = null;
    p.pos.set(c.x + 3, 0, c.z + 1); p.heading = c.heading;
    engineStop(); state.toast('You left the car');
    return;
  }
  // enter nearest car within 5m
  let best = null, bd = 5;
  for (const c of state.parkedCars) {
    const d = Math.hypot(c.x - p.pos.x, c.z - p.pos.z);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) {
    p.car = best; best.parked = false;
    p.pos.set(best.x, 0, best.z); p.heading = best.heading;
    engineStart(); sfx.horn();
    state.addWanted(1, 'car theft');
    state.toast('Car stolen! +1★ — the cops noticed');
  }
}
initInput(canvas, togglePause, interact);
addEventListener('keydown', e => {
  if (e.code === 'KeyM' && running) state.beginMission();
  if (e.code === 'KeyF' && running && !paused && !state.player.car) { punch(state); sfx.punch(); }
  if (e.code === 'Enter' && !running) startGame(false);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --- shot staging ---
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(state, shot);
  menu.classList.add('hidden');
  running = true;
  // place marker for staged mission
  const m = missionAt(state);
  if (m && m.waypoint) { marker.position.set(m.waypoint.x, 2, m.waypoint.z); marker.visible = true; }
  // keep camera behind player for a good frame
  camYaw = state.player.heading;
  window.__neonReady = true;
}

// --- main loop ---
const clock = new THREE.Clock();
let frames = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  frames++;
  if (running && !paused) {
    const p = state.player;
    const mouse = consumeMouse();
    camYaw -= mouse.dx * 0.0032;
    camPitch = Math.max(0.08, Math.min(0.9, camPitch + mouse.dy * 0.002));
    if (consumeClick() && !p.car) { shoot(state); sfx.shoot(); }
    const inp = axis();
    if (p.car) {
      const c = p.car;
      const speed = driveCar(c, { x: inp.x, z: inp.z, brake: keys.Space }, dt, colliders, v => { sfx.crash(); state.particles.burst(c.x, 1, c.z, 0xffffff, 10); });
      engineSet(speed);
      p.pos.set(c.x, 0, c.z); p.heading = c.heading;
      camYaw = c.heading; // chase cam follows car heading
      playerMesh.visible = false;
    } else {
      playerMesh.visible = true;
      // on-foot movement relative to camera yaw
      const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
      const right = { x: -fwd.z, z: fwd.x };
      let mx = 0, mz = 0;
      if (inp.z < 0) { mx += fwd.x; mz += fwd.z; }
      if (inp.z > 0) { mx -= fwd.x; mz -= fwd.z; }
      if (inp.x > 0) { mx += right.x; mz += right.z; }
      if (inp.x < 0) { mx -= right.x; mz -= right.z; }
      const len = Math.hypot(mx, mz);
      const speed = keys.ShiftLeft ? 9 : 5.5;
      p.walkSpeed = len > 0 ? speed : 0;
      if (len > 0) {
        mx /= len; mz /= len;
        let nx = p.pos.x + mx * speed * dt, nz = p.pos.z + mz * speed * dt;
        const hit = collideCircle(colliders, nx, nz, 0.9);
        if (hit) { // slide along wall
          if (!collideCircle(colliders, p.pos.x, nz, 0.9)) { p.pos.z = nz; }
          else if (!collideCircle(colliders, nx, p.pos.z, 0.9)) { p.pos.x = nx; }
        } else { p.pos.x = nx; p.pos.z = nz; }
        p.heading = Math.atan2(-mx, -mz);
        walkPhase += dt * 10;
      }
      const cl = clampCity(p.pos.x, p.pos.z); p.pos.x = cl.x; p.pos.z = cl.z;
      playerMesh.position.set(p.pos.x, 0, p.pos.z);
      playerMesh.rotation.y = p.heading;
      pLegL.rotation.x = Math.sin(walkPhase) * 0.6 * (len > 0 ? 1 : 0);
      pLegR.rotation.x = -Math.sin(walkPhase) * 0.6 * (len > 0 ? 1 : 0);
    }
    updateTraffic(state.traffic, dt, p.car);
    updatePeds(state.peds, dt, { x: p.pos.x, z: p.pos.z, inCar: !!p.car, speed: p.car ? p.car.speed : 0 }, ped => {
      state.addWanted(1, 'hit a pedestrian'); sfx.crash();
      state.particles.burst(ped.x, 1.2, ped.z, 0xff2222, 12);
    });
    ensurePolice(state, scene, dt);
    updateMission(state, dt);
    state.particles.update(dt);
    // marker pulse + base follows waypoint
    const m = missionAt(state);
    if (m && m.waypoint && state.missionStage === 'go') {
      marker.visible = true; marker.position.y = 15 + Math.sin(frames * 0.05) * 2;
      markerBase.position.set(m.waypoint.x, 0.15, m.waypoint.z);
      markerBase.visible = true;
    } else { marker.visible = false; markerBase.visible = false; }
    // busted / wasted
    if (p.health <= 0) {
      p.health = 100; p.pos.set(-30, 0, -30); state.wanted = 0;
      if (p.car) { p.car = null; engineStop(); }
      state.toast('BUSTED! You woke up at the hospital — $100 fine');
      state.cash = Math.max(0, state.cash - 100); sfx.busted();
    }
    // camera chase
    const camDist = p.car ? 11 : 8.5;
    const cx = p.pos.x + Math.sin(camYaw) * camDist * Math.cos(camPitch);
    const cz = p.pos.z + Math.cos(camYaw) * camDist * Math.cos(camPitch);
    const cy = 3.5 + camDist * Math.sin(camPitch);
    camera.position.set(cx, cy, cz);
    camera.lookAt(p.pos.x, p.car ? 1.2 : 1.6, p.pos.z);
    // HUD + minimap (every 3rd frame)
    if (frames % 3 === 0) { updateHUD(state, els); drawMinimap(state, minimap); }
    document.getElementById('crosshair').style.display = p.car ? 'none' : 'block';
    // autosave every 10s
    if (performance.now() - lastSave > 10000) { lastSave = performance.now(); saveGame(state); }
  }
  renderer.render(scene, camera);
  if (frames === 5) window.__neonReady = true;
}
animate();
window.__neonState = state;
