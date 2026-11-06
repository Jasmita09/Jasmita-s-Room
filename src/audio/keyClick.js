// Procedural mechanical-keyboard sounds via Web Audio (no audio files):
// a band-passed noise "tick" for the switch + a short pitched "thock" for the cap.
let ctx = null, master = null, noise = null, enabled = true;
export const setSoundEnabled = (v) => { enabled = !!v; };

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 0.06);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export const unlockAudio = () => { ensure(); };

function burst(c, t, freq, q, gain, dur) {
  const n = c.createBufferSource();
  n.buffer = noise;
  n.playbackRate.value = 0.85 + Math.random() * 0.3;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(g); g.connect(master);
  n.start(t); n.stop(t + dur + 0.02);
}

export function playKeyClick(kind = "key") {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + 0.002;
  const wide = kind === "wide";
  burst(c, t, (wide ? 2200 : 3400) + Math.random() * 800, 0.9, wide ? 0.5 : 0.42, 0.04);
  const o = c.createOscillator();
  o.type = "triangle";
  const f0 = (wide ? 150 : 230) + Math.random() * 40;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.06);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(wide ? 0.38 : 0.26, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + (wide ? 0.11 : 0.08));
  o.connect(og); og.connect(master);
  o.start(t); o.stop(t + 0.15);
  if (wide) burst(c, t + 0.014, 900, 1.4, 0.18, 0.05);
}

// Room critters: a soft pulsing purr, a quick hiss and a wobbly "booo".
function noiseBuf(c, sec) {
  const len = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
export function playPurr() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, dur = 1.8;
  const n = c.createBufferSource(); n.buffer = noiseBuf(c, dur);
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 170;
  const g = c.createGain(); g.gain.value = 0.4;
  const lfo = c.createOscillator(); lfo.frequency.value = 24; const lg = c.createGain(); lg.gain.value = 0.32;
  lfo.connect(lg); lg.connect(g.gain);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(1.4, t + 0.25);
  env.gain.setValueAtTime(1.4, t + dur - 0.5); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(lp); lp.connect(g); g.connect(env); env.connect(master);
  n.start(t); n.stop(t + dur); lfo.start(t); lfo.stop(t + dur);
}
export function playHiss() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.5);
  const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3200;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.5);
}
export function playBoo() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 7; vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency);
  o.type = "sawtooth"; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.5);
  lp.type = "lowpass"; lp.frequency.value = 1100;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6); vib.start(t); vib.stop(t + 0.6);
}

// Notebook page rustle + lamp switch click.
export function playPage() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.4);
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(1100, t); bp.frequency.linearRampToValueAtTime(3400, t + 0.32);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.07); g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
  n.connect(bp); bp.connect(g); g.connect(master || c.destination); n.start(t); n.stop(t + 0.4);
}
export function playSwitch() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  [0, 0.05].forEach((dl, i) => {
    const t = c.currentTime + 0.01 + dl, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.04);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = i ? 2600 : 1400;
    const g = c.createGain(); g.gain.setValueAtTime(i ? 0.25 : 0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    n.connect(hp); hp.connect(g); g.connect(master || c.destination); n.start(t); n.stop(t + 0.045);
  });
}

// Soft two-note clock chime.
export function playChime() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  [[784, 0], [523.25, 0.32]].forEach(([f, dl]) => {
    const t = c.currentTime + 0.01 + dl, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = f; o2.type = "triangle"; o2.frequency.value = f * 2.01;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g); o2.connect(g); g.connect(master); o.start(t); o2.start(t); o.stop(t + 1.25); o2.stop(t + 1.25);
  });
}

// Mug sip, wooden drawer slide, card shuffle.
export function playSip() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.35);
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 2; bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(2200, t + 0.25);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.35);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(260, t + 0.38); o.frequency.exponentialRampToValueAtTime(120, t + 0.48);
  og.gain.setValueAtTime(0.0001, t + 0.38); og.gain.exponentialRampToValueAtTime(0.15, t + 0.4); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(og); og.connect(master); o.start(t + 0.38); o.stop(t + 0.52);
}
export function playDrawer() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.01, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.4);
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.05); g.gain.linearRampToValueAtTime(0.2, t + 0.28); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  n.connect(lp); lp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.4);
}
export function playCard() {
  if (!enabled) return; const c = ensure(); if (!c) return;
  for (let i = 0; i < 4; i++) {
    const t = c.currentTime + 0.01 + i * 0.05, n = c.createBufferSource(); n.buffer = noiseBuf(c, 0.05);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
    const g = c.createGain(); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.05);
  }
}

// Soft yarn-ball bounce: a muffled thump with a tiny pitch drop.
export function playBoop(v = 1) {
  if (!enabled) return; const c = ensure(); if (!c) return;
  const t = c.currentTime + 0.005, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = "sine"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.12);
  lp.type = "lowpass"; lp.frequency.value = 600;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * Math.min(1, v), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.18);
  burst(c, t, 900, 1.2, 0.08 * Math.min(1, v), 0.04);
}
