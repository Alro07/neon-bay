// Neon Bay — synthetic WebAudio sound + music (no audio files).
let ctx = null, master = null, musicTimer = null, engineOsc = null, engineGain = null;
export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
  } catch (e) { /* audio unavailable */ }
}
function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
}
export const sfx = {
  punch() { tone(160, 0.12, 'square', 0.25, 60); },
  shoot() { tone(900, 0.09, 'sawtooth', 0.25, 120); tone(180, 0.08, 'square', 0.2, 50); },
  pickup() { tone(660, 0.1, 'sine', 0.2); setTimeout(() => tone(990, 0.15, 'sine', 0.2), 90); },
  cash() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.22), i * 80)); },
  sirenBlip() { tone(700, 0.25, 'sine', 0.12, 1100); },
  crash() { tone(90, 0.3, 'sawtooth', 0.3, 40); },
  horn() { tone(370, 0.25, 'square', 0.15); },
  mission() { [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle', 0.22), i * 110)); },
  busted() { [220, 180, 140].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.2), i * 150)); },
};
export function startMusic() {
  if (!ctx || musicTimer) return;
  const bass = [110, 110, 130.8, 98, 110, 110, 146.8, 164.8];
  const lead = [440, 523, 659, 523, 587, 659, 784, 659];
  let i = 0;
  musicTimer = setInterval(() => {
    if (!ctx || ctx.state === 'suspended') return;
    tone(bass[i % bass.length], 0.45, 'triangle', 0.10);
    if (i % 2 === 0) tone(lead[i % lead.length], 0.3, 'sine', 0.05);
    i++;
  }, 260);
}
export function engineStart() {
  if (!ctx || engineOsc) return;
  engineOsc = ctx.createOscillator(); engineGain = ctx.createGain();
  engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 55;
  engineGain.gain.value = 0.03; engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start();
}
export function engineSet(speed) {
  if (engineOsc) { engineOsc.frequency.value = 50 + Math.abs(speed) * 4; engineGain.gain.value = 0.02 + Math.min(0.06, Math.abs(speed) * 0.002); }
}
export function engineStop() { if (engineOsc) { try { engineOsc.stop(); } catch (e) {} engineOsc = null; } }
