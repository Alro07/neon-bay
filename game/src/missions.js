// missions.js — the Neon Bay story: five sequential jobs from Mara, the bay's
// fixer. Each mission has dialog, a waypoint beacon in the world and on the
// minimap, and a cash payout on completion.
import * as THREE from 'three';
import { addWanted } from './police.js';

export const MISSIONS = [
  {
    id: 'first-delivery', title: '1 — First Delivery', payout: 150,
    intro: 'Rio. Welcome to Neon Bay. I need a package run to the boardwalk cafe — no questions, no stops. The yellow beacon marks the spot. Go.',
    objective: 'Deliver the package to the boardwalk cafe (yellow beacon).',
    waypoints: [{ x: -45, z: -66, label: 'Boardwalk Cafe' }],
    timed: 0,
  },
  {
    id: 'hot-wheels', title: '2 — Hot Wheels', payout: 250,
    intro: 'Nice work. Next job needs wheels — fast ones. Grab any parked car on the street. The PD will notice, so don\'t hang around. Bring it to the garage on 5th.',
    objective: 'Steal a parked car (press E near one), then drive it to the garage.',
    waypoints: [{ x: 45, z: 15, label: 'Mara\'s Garage' }],
    needsCar: true,
  },
  {
    id: 'heat', title: '3 — Heat', payout: 300,
    intro: 'The cops are onto us after that lift. Lose them, then meet my runner at the Neon Tower plaza. Keep your head down — if they catch you, the job is blown.',
    objective: 'Drop your wanted level, then reach the Neon Tower plaza.',
    waypoints: [{ x: 76, z: 60, label: 'Neon Tower Plaza' }],
    startWanted: 2,
  },
  {
    id: 'night-run', title: '4 — Night Run', payout: 400,
    intro: 'A buyer is waiting across town with a fat wallet, but the window is tight: 75 seconds. Drive like the bay is on fire. Don\'t be late.',
    objective: 'Reach the buyer at the marina within 75 seconds!',
    waypoints: [{ x: -75, z: 45, label: 'Marina Buyer' }],
    timed: 75,
  },
  {
    id: 'own-the-bay', title: '5 — Own the Bay', payout: 600,
    intro: 'Last one, Rio. Two stops: the drop at the pier, then the pickup at the north gate. Do this clean and the whole bay is yours. Mara out.',
    objective: 'Drop at the pier, then pick up at the north gate.',
    waypoints: [{ x: -60, z: -66, label: 'Pier Drop' }, { x: 60, z: -60, label: 'North Gate' }],
    timed: 0,
  },
];

let beacon = null;
let beaconRing = null;

export function setWaypoint(state, x, z, label) {
  clearWaypoint(state);
  const group = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.6, 30, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
  );
  beam.position.y = 15;
  group.add(beam);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.28, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd23e }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.35;
  group.add(ring);
  group.position.set(x, 0, z);
  state.scene.add(group);
  beacon = group;
  beaconRing = ring;
  state.waypoint = { x, z, label };
}

export function clearWaypoint(state) {
  if (beacon) { state.scene.remove(beacon); beacon = null; beaconRing = null; }
  state.waypoint = null;
}

export function startMission(state, index) {
  const m = MISSIONS[index];
  if (!m) { state.missionIndex = MISSIONS.length; state.missionStage = 0; clearWaypoint(state); state.objective = 'All jobs done — Neon Bay is yours, Rio.'; return; }
  state.missionIndex = index;
  state.missionStage = 0;
  state.missionTimer = m.timed || 0;
  if (m.startWanted) state.wanted = Math.max(state.wanted, m.startWanted);
  state.objective = m.objective;
  state.dialog(m.intro);
  const wp = m.waypoints[0];
  setWaypoint(state, wp.x, wp.z, wp.label);
  state.toast(m.title, 3);
  if (typeof state.onMissionStart === 'function') state.onMissionStart(m);
}

export function restartMission(state) {
  startMission(state, Math.min(state.missionIndex, MISSIONS.length - 1));
}

export function completeMission(state) {
  const m = MISSIONS[state.missionIndex];
  state.cash += m.payout;
  state.toast('Mission complete!  +$' + m.payout, 3.5);
  if (typeof state.onMissionComplete === 'function') state.onMissionComplete(m);
  if (typeof state.playPickup === 'function') state.playPickup();
  startMission(state, state.missionIndex + 1);
}

export function updateMissions(state, dt) {
  if (state.missionIndex >= MISSIONS.length) return;
  const m = MISSIONS[state.missionIndex];
  if (m.timed) {
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) {
      state.toast('Too slow — the buyer walked. Mission restarted.', 3);
      restartMission(state);
      return;
    }
  }
  if (!state.waypoint) return;
  if (m.needsCar && state.missionStage === 0 && state.player.car) {
    state.missionStage = 1;
    state.toast('Car secured. Now drive it to the garage!', 2.5);
  }
  const d = Math.hypot(state.player.pos.x - state.waypoint.x, state.player.pos.z - state.waypoint.z);
  if (d < 5) {
    if (state.missionStage < m.waypoints.length - 1) {
      state.missionStage += 1;
      const wp = m.waypoints[state.missionStage];
      setWaypoint(state, wp.x, wp.z, wp.label);
      state.toast('Next stop: ' + wp.label, 2.5);
    } else {
      completeMission(state);
    }
  }
  // Pulse the waypoint ring.
  if (beaconRing) {
    const s = 1 + Math.sin(state.elapsed * 4) * 0.12;
    beaconRing.scale.set(s, s, 1);
  }
}
