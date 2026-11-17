// Neon Bay — HUD + minimap (original code).
export function drawMinimap(state, canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, C = W / 2, scale = W / 460;
  ctx.clearRect(0, 0, W, W);
  ctx.fillStyle = '#0e2a3d'; ctx.beginPath(); ctx.arc(C, C, C - 2, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(C, C, C - 2, 0, Math.PI * 2); ctx.clip();
  // sea: z > 210 is water, at the bottom of the minimap
  ctx.fillStyle = '#1e90d6'; ctx.fillRect(0, C + 210 * scale, W, 50 * scale);
  // roads
  ctx.strokeStyle = '#3a4150'; ctx.lineWidth = 7;
  for (const r of [-150, -90, -30, 30, 90, 150]) {
    ctx.beginPath(); ctx.moveTo(0, C + r * scale); ctx.lineTo(W, C + r * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(C + r * scale, 0); ctx.lineTo(C + r * scale, W); ctx.stroke();
  }
  const dot = (x, z, color, r) => {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(C + x * scale, C + z * scale, r, 0, Math.PI * 2); ctx.fill();
  };
  // waypoint
  const m = state.mission;
  if (m && m.waypoint) dot(m.waypoint.x, m.waypoint.z, '#ffd23e', 6);
  for (const c of state.traffic) dot(c.x, c.z, '#9fb3c8', 2);
  for (const pc of state.police.cars) dot(pc.x, pc.z, '#3b82ff', 3);
  for (const p of state.peds) dot(p.x, p.z, '#ffb3d1', 1.5);
  // player arrow
  ctx.save();
  ctx.translate(C + state.player.pos.x * scale, C + state.player.pos.z * scale);
  ctx.rotate(Math.PI - state.player.heading);
  ctx.fillStyle = '#7dffb0';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}
export function updateHUD(state, els) {
  els.cash.textContent = '$' + state.cash.toLocaleString();
  els.stars.textContent = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
  els.healthfill.style.width = Math.max(0, state.player.health) + '%';
  const m = state.mission;
  els.missionLabel.textContent = m ? `Mission ${m.id}: ${m.name}` : '🏆 All missions complete!';
  els.vehLabel.textContent = state.player.car ? `🚗 ${state.player.car.police ? 'Bay PD Cruiser' : 'Stolen car'} — Space to brake` : 'On foot — press E near a car to steal it';
  els.speedVal.textContent = Math.round(Math.abs(state.player.car ? state.player.car.speed * 3.6 : state.player.walkSpeed * 3.6));
  if (m) {
    els.objTitle.textContent = `Mission ${m.id}: ${m.name}`;
    let t = m.objective;
    if (state.missionTimer > 0) t += ` — ${Math.ceil(state.missionTimer)}s left`;
    if (state.missionStage === 'lose') t = 'Lose the cops — wanted level must reach 0';
    els.objText.textContent = t;
  } else {
    els.objTitle.textContent = 'Neon Bay is yours';
    els.objText.textContent = 'Free roam — explore, drive, cause chaos.';
  }
}
