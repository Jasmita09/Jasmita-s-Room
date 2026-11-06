// Soft procedural Halloween lullaby (Web Audio, no files): music-box melody in A minor,
// a warm pad, a soft bass, little twinkles and a gentle reverb. Loops forever, ~80 bpm waltz.
let ctx = null, out = null, wet = null, timer = null, on = false, next = 0, beat = 0;
const BEAT = 0.75, VOL = 0.16;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MEL = [[76, 72, 69], [77, 76, 72], [74, 77, 74], [71, 68, 64], [76, 72, 69], [81, 77, 72], [74, 71, 68], [69, null, null],
             [72, 76, 81], [80, 76, 71], [77, 74, 69], [71, 74, 76], [72, 69, 76], [77, 72, 69], [71, 68, 74], [69, null, 64]];
const CH = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59], [57, 60, 64], [53, 57, 60], [52, 56, 59], [57, 60, 64]];
const TW = [81, 84, 86, 88, 91, 93];
const PB = [[3, -1, 2, -1], [-1, 1, -1, 2], [3, 2, 1, -1], [0, -1, -1, -1]];
export const TAPES = [
  { id: "A", name: "Cozy Library", color: "#d97d46", beat: 0.75, bpb: 3, chords: CH, padVol: 0.05, melVol: 0.2, melLen: 2.4, tw: 0.12,
    mel: (bar, b) => MEL[bar % 16][b], bass: (bar, b, c) => (b === 0 ? c[0] : null), off: (b) => b > 0 },
  { id: "B", name: "Haunted Caf\u00e9", color: "#7b2d42", beat: 0.4, bpb: 4, padVol: 0.035, melVol: 0.15, melLen: 1.4, tw: 0.05,
    chords: [[50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 58], [53, 57, 60, 64], [46, 50, 53, 57], [52, 55, 58, 62], [45, 49, 52, 55], [50, 53, 57, 60]],
    mel: (bar, b, c) => { const k = PB[bar % 4][b]; return k < 0 ? null : c[k] + 12; }, bass: (bar, b, c) => [c[0], c[1], c[2], c[1]][b], off: () => false },
  { id: "C", name: "Deep Focus", color: "#33476b", beat: 1.1, bpb: 4, padVol: 0.06, melVol: 0.13, melLen: 3.2, tw: 0.18,
    chords: [[48, 52, 55, 59], [45, 52, 55, 59], [41, 48, 52, 57], [43, 50, 52, 55]],
    mel: (bar, b, c) => (b === 0 ? c[3] + 12 : b === 2 && bar % 2 ? c[2] + 24 : null), bass: (bar, b, c) => (b === 0 ? c[0] : null), off: () => false }
];
let tape = 0, reset = false, vol = 0.6;
try { tape = Math.min(2, Math.max(0, +localStorage.getItem("cpn-tape") || 0)); } catch {}
const tsubs = new Set();
export const getTape = () => tape;
export const onTape = (f) => { tsubs.add(f); return () => tsubs.delete(f); };
export function setTape(i) { tape = (i + TAPES.length) % TAPES.length; reset = true; try { localStorage.setItem("cpn-tape", tape); } catch {} tsubs.forEach((f) => f(tape)); }
export function setMusicVol(v) { vol = v; if (on && ctx) { const t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t); out.gain.exponentialRampToValueAtTime(Math.max(0.0001, VOL * vol * 1.6), t + 0.3); } }

function impulse(c, sec = 3.2) {
  const len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  return b;
}
function setup() {
  if (ctx || typeof window === "undefined") return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC();
  out = ctx.createGain(); out.gain.value = 0.0001; out.connect(ctx.destination);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200; lp.connect(out);
  const rv = ctx.createConvolver(); rv.buffer = impulse(ctx); const rg = ctx.createGain(); rg.gain.value = 0.55; rv.connect(rg); rg.connect(lp);
  const dry = ctx.createGain(); dry.gain.value = 0.7; dry.connect(lp);
  wet = { dry, rv };
  return ctx;
}
function send(node, revAmt = 0.6) { node.connect(wet.dry); const g = ctx.createGain(); g.gain.value = revAmt; node.connect(g); g.connect(wet.rv); }

function bell(t, m, vel = 0.22, len = 2.2) {      // music box / celesta tine
  const g = ctx.createGain(), f = mtof(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  [[1, 1], [2.0, 0.18], [3.01, 0.07], [4.2, 0.04]].forEach(([r, a]) => {
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = "sine"; o.frequency.value = f * r; og.gain.value = a;
    o.connect(og); og.connect(g); o.start(t); o.stop(t + len + 0.05);
  });
  send(g, 0.7);
}
function pad(t, notes, dur, pv = 0.05) {
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pv, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
  notes.forEach((m) => [-6, 6].forEach((det) => {
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(m); o.detune.value = det;
    o.connect(lp); o.start(t); o.stop(t + dur + 0.7);
  }));
  lp.connect(g); send(g, 0.8);
}
function bass(t, m, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = mtof(m - 12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); send(g, 0.3); o.start(t); o.stop(t + dur + 0.05);
}
function schedule() {
  if (!ctx) return;
  const la = typeof document !== "undefined" && document.hidden ? 1.6 : 0.4;
  while (next < ctx.currentTime + la) {
    const T = TAPES[tape];
    if (reset) { beat = 0; reset = false; }
    const bar = Math.floor(beat / T.bpb), b = beat % T.bpb, chord = T.chords[bar % T.chords.length];
    if (b === 0) pad(next, chord, T.beat * T.bpb, T.padVol);
    const bn = T.bass(bar, b, chord); if (bn) bass(next, bn, b === 0 ? T.beat * T.bpb * 0.85 : T.beat * 0.9);
    if (T.off(b)) bell(next, chord[(b + 1) % chord.length], 0.05, 1.2);
    const mm = T.mel(bar, b, chord); if (mm) bell(next, mm, T.melVol, T.melLen);
    if (Math.random() < T.tw) bell(next + T.beat * 0.5, TW[Math.floor(Math.random() * TW.length)], 0.05, 2.8);
    next += T.beat; beat++;
  }
}
export function startMusic() {
  if (!setup()) return;
  if (ctx.state === "suspended") ctx.resume();
  if (on) return; on = true;
  next = Math.max(next, ctx.currentTime + 0.1);
  out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), ctx.currentTime);
  out.gain.exponentialRampToValueAtTime(Math.max(0.0001, VOL * vol * 1.6), ctx.currentTime + 2.5);
  clearInterval(timer); timer = setInterval(schedule, 100); schedule();
}
export function stopMusic() {
  if (!ctx || !on) return; on = false;
  const t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t); out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  clearInterval(timer); timer = null;
}
export const musicPlaying = () => on && ctx && ctx.state === "running";
