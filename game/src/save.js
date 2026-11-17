// save.js — save / load progress in localStorage (cash, health, mission,
// position, wanted, clock). Auto-saves during play; no account, no network.
const SAVE_KEY = 'neonbay-save-v1';

export function saveGame(state) {
  try {
    const data = {
      version: 1,
      cash: Math.floor(state.cash),
      health: state.health,
      wanted: state.wanted,
      missionIndex: state.missionIndex,
      missionStage: state.missionStage,
      clockMinutes: state.clockMinutes,
      pos: { x: state.player.pos.x, z: state.player.pos.z },
      inCar: !!state.player.car,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export function hasSave() {
  return loadGame() !== null;
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* storage unavailable */ }
}
