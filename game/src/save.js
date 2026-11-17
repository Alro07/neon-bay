// Neon Bay — save / load via localStorage.
const KEY = 'neon-bay-save-v1';
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d !== 'object' || !d) return null;
    return d;
  } catch (e) { return null; }
}
export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      mission: state.missionIndex, cash: state.cash, completed: state.completed,
      px: state.player.pos.x, pz: state.player.pos.z, health: state.player.health, t: Date.now(),
    }));
    return true;
  } catch (e) { return false; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }
