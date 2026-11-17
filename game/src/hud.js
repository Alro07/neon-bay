// hud.js — the HUD: cash, health, wanted stars, clock, objective, speed, and
// a live circular minimap drawn on a 2D canvas (player, waypoint, police,
// traffic, pedestrians, beach).
import { MISSIONS } from './missions.js';

const els = {};
let minimapCtx = null;

export function initHud() {
  els.cash = document.getElementById('cash');
  els.clock = document.getElementById('clock');
  els.stars = document.getElementById('stars');
  els.health = document.getElementById('health-bar');
  els.speed = document.getElementById('speed');
  els.objective = document.getElementById('objective-text');
  els.toast = document.getElementById('toast');
  els.prompt = document.getElementById('prompt');
  els.dialog = document.getElementById('dialog');
  els.dialogText = document.getElementById('dialog-text');
  els.crosshair = document.getElementById('crosshair');
  els.hud = document.getElementById('hud');
  const mm = document.getElementById('minimap');
  minimapCtx = mm.getContext('2d');
}

export function showHud(on) {
  els.hud.classList.toggle('on', on);
}

export function showDialog(text) {
  els.dialogText.textContent = text;
  els.dialog.classList.add('on');
}

export function hideDialog() {
  els.dialog.classList.remove('on');
}

export function showToast(state, text, seconds) {
  state.toastText = text;
  state.toastUntil = state.elapsed + seconds;
}

export function updateHud(state) {
  els.cash.textContent = '$' + Math.floor(state.cash).toLocaleString('en-US');
  const totalMin = Math.floor(state.clockMinutes) % (24 * 60);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const mm = String(totalMin % 60).padStart(2, '0');
  els.clock.textContent = hh + ':' + mm + (state.missionIndex < MISSIONS.length && MISSIONS[state.missionIndex].timed ? '  ⏱ ' + Math.max(0, Math.ceil(state.missionTimer)) + 's' : '');
  let stars = '';
  for (let i = 0; i < 5; i++) stars += '<span class="' + (i < state.wanted ? 'lit' : 'dim') + '">★</span>';
  els.stars.innerHTML = stars;
  els.health.style.width = Math.max(0, state.health) + '%';
  els.speed.textContent = state.player.car
    ? Math.round(state.speedMph) + ' mph  •  ' + (state.player.car.police ? 'BAY PD CRUISER' : 'YOUR CAR')
    : 'ON FOOT';
  els.objective.textContent = state.objective;
  els.crosshair.style.display = (!state.player.car && state.started && !state.paused) ? 'block' : 'none';
  if (state.toastText && state.elapsed < state.toastUntil) {
    els.toast.textContent = state.toastText;
  } else {
    els.toast.textContent = '';
    state.toastText = '';
  }
  els.prompt.textContent = state.promptText || '';
  drawMinimap(state);
}

function toMap(state, x, z) {
  // World ±110 maps into the 190px circle with a 8px margin.
  const s = 190 / 240;
  return [95 + (x + 5) * s, 95 + (z + 5) * s];
}

function drawMinimap(state) {
  const g = minimapCtx;
  if (!g) return;
  g.clearRect(0, 0, 190, 190);
  g.save();
  g.beginPath();
  g.arc(95, 95, 94, 0, Math.PI * 2);
  g.clip();
  // Land, beach and water.
  g.fillStyle = '#1d2b45'; g.fillRect(0, 0, 190, 190);
  const [, sandY] = toMap(state, 0, -85);
  g.fillStyle = '#c9a86a'; g.fillRect(0, sandY, 190, 190 - sandY);
  const [, waterY] = toMap(state, 0, -119);
  g.fillStyle = '#1e7fb8'; g.fillRect(0, waterY, 190, 190 - waterY);
  // Roads.
  g.strokeStyle = '#5a6274'; g.lineWidth = 5;
  for (const c of [-60, -30, 0, 30, 60]) {
    const [x] = toMap(state, c, 0);
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 190); g.stroke();
    const [, y] = toMap(state, 0, c);
    g.beginPath(); g.moveTo(0, y); g.lineTo(190, y); g.stroke();
  }
  const dot = (x, z, color, r) => {
    const [mx, my] = toMap(state, x, z);
    g.fillStyle = color;
    g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.fill();
  };
  for (const car of state.traffic) dot(car.group.position.x, car.group.position.z, '#cfd6e4', 2.5);
  for (const ped of state.peds) dot(ped.mesh.position.x, ped.mesh.position.z, '#ff9ecf', 1.6);
  for (const cop of state.police) dot(cop.group.position.x, cop.group.position.z, '#ff4444', 3.5);
  if (state.waypoint) {
    const [wx, wy] = toMap(state, state.waypoint.x, state.waypoint.z);
    const pulse = 5 + Math.sin(state.elapsed * 5) * 1.5;
    g.fillStyle = '#ffd23e';
    g.beginPath(); g.moveTo(wx, wy - pulse); g.lineTo(wx + pulse, wy); g.lineTo(wx, wy + pulse); g.lineTo(wx - pulse, wy); g.closePath(); g.fill();
  }
  // Player arrow (rotates with heading).
  const [px, py] = toMap(state, state.player.pos.x, state.player.pos.z);
  g.save();
  g.translate(px, py);
  g.rotate(Math.atan2(Math.sin(state.player.yaw), Math.cos(state.player.yaw)));
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill();
  g.restore();
  g.restore();
  // Rim.
  g.strokeStyle = '#39e6ff'; g.lineWidth = 3;
  g.beginPath(); g.arc(95, 95, 93, 0, Math.PI * 2); g.stroke();
}
