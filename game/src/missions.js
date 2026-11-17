// Neon Bay — story missions: 5 sequential jobs from Mara (original code).
// Each mission: dialog lines, objective text, waypoint, optional timer / wanted trigger.
export const MISSIONS = [
  {
    id: 1, name: 'First Delivery', pay: 150,
    who: 'Mara', lines: ['Rio, you made it. Neon Bay runs on couriers — and on people who keep their mouth shut.', 'Take this package to the pier at the south beach. Walk or grab a car. Do not open it.'],
    objective: 'Deliver the package to the South Pier (yellow marker)',
    waypoint: { x: 60, z: 195 }, stage: 'go',
  },
  {
    id: 2, name: 'Hot Wheels', pay: 250,
    who: 'Mara', lines: ['Good. Now you need wheels of your own. Steal any parked car — press E next to it.', 'Bring it to the garage on Palm Row. The boys will strip the plates.'],
    objective: 'Steal a car (E) and drive it to the garage marker',
    waypoint: { x: -90, z: 150 }, stage: 'go', needCar: true,
  },
  {
    id: 3, name: 'Heat', pay: 300,
    who: 'Mara', lines: ['The Bay PD is sniffing around after that little joyride. Lose them.', 'Get your wanted level back to zero. Break line of sight and stay hidden.'],
    objective: 'Lose the cops — get wanted level to 0',
    waypoint: null, stage: 'lose', startWanted: 3,
  },
  {
    id: 4, name: 'Night Run', pay: 400,
    who: 'Mara', lines: ['A client on the north side pays double if you are fast. 75 seconds, Rio. No excuses.', 'Drive — do not walk. The clock is already running.'],
    objective: 'Drive to the North Plaza in 75 seconds',
    waypoint: { x: -150, z: -150 }, stage: 'go', timer: 75,
  },
  {
    id: 5, name: 'Own the Bay', pay: 800,
    who: 'Mara', lines: ['Last one. The harbor boss wants his cut delivered — and the PD knows it.', 'Deliver to the harbor, then shake the cops. Do this and the Bay is yours, Rio.'],
    objective: 'Deliver to the Harbor, then lose the cops',
    waypoint: { x: 150, z: 195 }, stage: 'go', thenLose: true, startWanted: 2,
  },
];
export function missionAt(state) { return MISSIONS[state.missionIndex] || null; }
export function startMission(state, scene, marker) {
  const m = missionAt(state);
  if (!m) return;
  state.missionStage = m.stage; state.missionTimer = m.timer || 0;
  state.missionDone = false;
  if (m.startWanted) { state.wanted = Math.max(state.wanted, m.startWanted); state.wantedTimer = 8; }
  if (m.waypoint) marker.position.set(m.waypoint.x, 2, m.waypoint.z);
  marker.visible = !!m.waypoint;
  state.dialog(m.who, m.lines[0]);
  setTimeout(() => state.dialog(m.who, m.lines[1] || m.lines[0]), 2600);
  state.toast(`Mission ${m.id}: ${m.name} — $${m.pay}`);
}
export function updateMission(state, dt) {
  const m = missionAt(state);
  if (!m || state.missionDone) return;
  if (state.missionTimer > 0) {
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) { state.failMission('Too slow! Mission failed — try again (M).'); return; }
  }
  if (state.missionStage === 'go' && m.waypoint) {
    const d = Math.hypot(state.player.pos.x - m.waypoint.x, state.player.pos.z - m.waypoint.z);
    if (d < 7) {
      if (m.needCar && !state.player.car) { state.toast('You need to be in a car!'); return; }
      if (m.thenLose) { state.missionStage = 'lose'; state.wanted = Math.max(state.wanted, 2); state.wantedTimer = 8; state.toast('Package delivered! Now lose the cops!'); return; }
      completeMission(state);
    }
  } else if (state.missionStage === 'lose') {
    if (state.wanted <= 0) completeMission(state);
  }
}
export function completeMission(state) {
  const m = missionAt(state);
  if (!m) return;
  state.missionDone = true;
  state.cash += m.pay;
  state.completed.push(m.id);
  state.toast(`Mission complete! +$${m.pay}`);
  state.sfxCash();
  state.missionIndex += 1;
  state.save();
  const next = missionAt(state);
  if (next) setTimeout(() => state.beginMission(), 1200);
  else { state.toast('🏆 ALL MISSIONS DONE — You own Neon Bay!'); state.dialog('Mara', 'The Bay is yours, Rio. Come see me anytime — the city never sleeps.'); }
}
