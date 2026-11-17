// shots.js — deterministic staging for screenshots. ?shot=cover|drive|foot|mission
// places the player, sets the wanted level, spawns police and opens the right
// mission state BEFORE the first frame renders, so each screenshot shows the
// system it is meant to show. Used by the maker only; normal play ignores it.
import { startMission } from './missions.js';
import { spawnPoliceCar } from './police.js';

export function shotName() {
  const q = new URLSearchParams(window.location.search).get('shot');
  return ['cover', 'drive', 'foot', 'mission'].includes(q) ? q : null;
}

export function applyShot(state, name) {
  if (!name) return;
  state.started = true;
  state.shotMode = name;
  document.getElementById('start-screen').classList.add('hidden');
  if (name === 'cover') {
    // Police chase: player in a car, 3 wanted stars, cruisers closing in
    // AHEAD of the player (visible in frame), first mission active.
    enterCarForShot(state);
    state.player.pos.set(0, 0, 10);
    state.player.car.group.position.set(0, 0, 10);
    state.player.car.heading = Math.PI;
    state.player.car.group.rotation.y = Math.PI;
    state.player.car.speed = 14;
    state.wanted = 3;
    spawnPoliceCar(state);
    spawnPoliceCar(state);
    state.police[0].group.position.set(-5, 0, -14);
    state.police[0].heading = 0;
    state.police[0].group.rotation.y = 0;
    state.police[1].group.position.set(6, 0, -22);
    state.police[1].heading = 0;
    state.police[1].group.rotation.y = 0;
    state.cameraYaw = Math.PI;
    state.cameraPitch = 0.32;
    startMission(state, 0);
    hideShotDialog(state);
  } else if (name === 'drive') {
    // Cruising a city street with traffic ahead.
    enterCarForShot(state);
    state.player.pos.set(30, 0, -20);
    state.player.car.group.position.set(30, 0, -20);
    state.player.car.heading = 0;
    state.player.car.group.rotation.y = 0;
    state.player.car.speed = 18;
    state.cameraYaw = 0;
    state.cameraPitch = 0.3;
    state.traffic[0].group.position.set(30, 0, -2);
    state.traffic[0].heading = 0;
    state.traffic[0].cruise = 3;
    state.traffic[1].group.position.set(30, 0, 14);
    state.traffic[1].heading = 0;
    state.traffic[1].cruise = 3;
    startMission(state, 0);
    hideShotDialog(state);
  } else if (name === 'foot') {
    // On foot on the beach boulevard, pedestrians nearby, waypoint ahead.
    state.player.pos.set(0, 0, -70);
    state.player.yaw = Math.PI * 0.85;
    state.cameraYaw = Math.PI * 0.85;
    state.cameraPitch = 0.28;
    for (let i = 0; i < 4 && i < state.peds.length; i++) {
      state.peds[i].mesh.position.set(-6 + i * 3, 0, -76 - (i % 2) * 3);
    }
    startMission(state, 0);
    hideShotDialog(state);
  } else if (name === 'mission') {
    // Mid-mission on the open beach boulevard: Mara's dialog open, the
    // waypoint beacon down the road, palms and pedestrians in frame.
    state.player.pos.set(0, 0, -60);
    state.player.yaw = -1.7;
    state.cameraYaw = -1.7;
    state.cameraPitch = 0.3;
    for (let i = 0; i < 3 && i < state.peds.length; i++) {
      state.peds[i].mesh.position.set(-8 - i * 2, 0, -66 - i * 2);
    }
    startMission(state, 0);
    // startMission already opens Mara's dialog; leave it open.
  }
}

function hideShotDialog(state) {
  document.getElementById('dialog').classList.remove('on');
  state.dialogVisible = false;
}

function enterCarForShot(state) {
  const car = state.parked[0];
  car.parked = false;
  car.stolen = true;
  state.player.car = car;
  state.player.inCar = true;
  state.player.pos.set(car.group.position.x, 0, car.group.position.z);
}
