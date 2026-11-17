// audio.js — all sound is synthesized with WebAudio: no audio files, no
// network. Engine hum, police siren, gunshots, punches, pickup chimes and a
// simple synthwave bass loop.
export function createSoundBank() {
  const bank = {
    ctx: null, master: null, engineOsc: null, engineGain: null,
    sirenOsc: null, sirenGain: null, musicTimer: null, musicStep: 0, enabled: false,

    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
        // Engine hum: low sawtooth whose pitch follows speed.
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 55;
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.0;
        const engineFilter = this.ctx.createBiquadFilter();
        engineFilter.type = 'lowpass'; engineFilter.frequency.value = 420;
        this.engineOsc.connect(engineFilter);
        engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.master);
        this.engineOsc.start();
        // Police siren: two-tone triangle, silent until wanted.
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'triangle';
        this.sirenOsc.frequency.value = 750;
        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.value = 0;
        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.master);
        this.sirenOsc.start();
        this.enabled = true;
        this.startMusic();
      } catch (err) {
        this.enabled = false;
      }
    },

    setEngine(speedMph, inCar) {
      if (!this.enabled) return;
      const target = inCar ? 0.05 + Math.min(0.09, speedMph / 900) : 0;
      this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
      this.engineOsc.frequency.setTargetAtTime(52 + speedMph * 1.6, this.ctx.currentTime, 0.1);
    },

    setSiren(wanted) {
      if (!this.enabled) return;
      const t = this.ctx.currentTime;
      this.sirenGain.gain.setTargetAtTime(wanted > 0 ? 0.045 : 0, t, 0.2);
      if (wanted > 0) {
        const step = Math.floor(t * 2) % 2 === 0 ? 750 : 1050;
        this.sirenOsc.frequency.setTargetAtTime(step, t, 0.05);
      }
    },

    blip(freq, dur, type, vol) {
      if (!this.enabled) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = type || 'square';
      o.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur);
    },

    noiseBurst(dur, vol) {
      if (!this.enabled) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1800;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
    },

    shot() { this.noiseBurst(0.14, 0.5); this.blip(160, 0.1, 'square', 0.2); },
    punch() { this.noiseBurst(0.09, 0.3); },
    pickup() { this.blip(660, 0.12, 'sine', 0.2); setTimeout(() => this.blip(990, 0.18, 'sine', 0.2), 110); },
    click() { this.blip(440, 0.06, 'square', 0.1); },

    startMusic() {
      // Simple synthwave bass loop: A minor walk, one note per beat.
      const notes = [55, 55, 65.41, 49, 55, 55, 82.41, 73.42];
      this.musicTimer = setInterval(() => {
        if (!this.enabled || document.hidden) return;
        const f = notes[this.musicStep % notes.length];
        this.musicStep += 1;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = f;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.45);
      }, 460);
    },
  };
  return bank;
}
