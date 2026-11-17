// Neon Bay — keyboard + mouse input (original code).
export const keys = {};
export let mouseDX = 0, mouseDY = 0, mouseClicked = false;
export function initInput(canvas, onPause, onInteract) {
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE' && onInteract) onInteract();
    if (e.code === 'KeyP' || e.code === 'Escape') onPause && onPause();
    if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('click', () => { mouseClicked = true; });
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) { mouseDX += e.movementX; mouseDY += e.movementY; }
  });
  canvas.addEventListener('click', () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.(); });
}
export function consumeMouse() { const d = { dx: mouseDX, dy: mouseDY }; mouseDX = 0; mouseDY = 0; return d; }
export function consumeClick() { const c = mouseClicked; mouseClicked = false; return c; }
export function axis() {
  let x = 0, z = 0;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  return { x, z };
}
