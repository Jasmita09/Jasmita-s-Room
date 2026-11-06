// Study soundboard: procedural ambient layers (rain, cat purr, crackling candles, typing) + mixer state + thunder.
import { startMusic, stopMusic, setMusicVol } from "./music.js";
const DEF = { music: 0.6, rain: 0, purr: 0, crackle: 0, typing: 0 };
let mix = (() => { try { return { ...DEF, ...JSON.parse(localStorage.getItem("cpn-mix") || "{}") }; } catch { return { ...DEF }; } })();
const subs = new Set();
export const getMix = () => mix;
export const onMix = (f) => { subs.add(f); return () => subs.delete(f); };
export function setMix(k, v) { mix = { ...mix, [k]: v }; try { localStorage.setItem("cpn-mix", JSON.stringify(mix)); } catch {} apply(); subs.forEach((f) => f(mix)); }

let ctx = null, started = false, white, brown, L = {}, timer;
function buf(kind, sec = 3) {
  const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
function loop(b) { const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; }
function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
const filt = (type, f, q = 0.7) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
function burst(dest, t, f, q, v, dur, b = white) {
  const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const g = gain(0); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  chain(s, filt("bandpass", f, q), g, dest); s.start(t, Math.random() * 2); s.stop(t + dur + 0.02);
}
function setup() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC(); white = buf("white"); brown = buf("brown");
  const master = gain(0.9); master.connect(ctx.destination);
  const mk = (k, s) => { const g = gain(0); g.connect(master); L[k] = { g, scale: s, next: 0 }; return g; };
  // rain: hiss + body + droplets
  const rg = mk("rain", 0.55);
  chain(loop(white), filt("highpass", 500), filt("lowpass", 3200), gain(0.35), rg);
  chain(loop(brown), filt("lowpass", 700), gain(0.5), rg);
  L.rain.ev = (t) => { burst(rg, t, 2500 + Math.random() * 4000, 4, 0.08 + Math.random() * 0.12, 0.03); return 0.02 + Math.random() * 0.07; };
  // purr: low rumble amplitude-modulated at ~25 Hz, breathing in and out
  const pg = mk("purr", 1.1), am = gain(0.5), br = gain(0.5);
  const o = ctx.createOscillator(); o.frequency.value = 25; chain(o, gain(0.5), am.gain); o.start();
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.38; chain(lfo, gain(0.45), br.gain); lfo.start();
  chain(loop(brown), filt("lowpass", 320), am, br, pg);
  // crackling candles: warm hum + pops
  const cg = mk("crackle", 0.7);
  chain(loop(brown), filt("lowpass", 500), gain(0.25), cg);
  L.crackle.ev = (t) => { const big = Math.random() < 0.12; burst(cg, t, big ? 1200 : 1800 + Math.random() * 3500, big ? 1 : 3, big ? 0.5 : 0.06 + Math.random() * 0.15, big ? 0.05 : 0.012); return 0.03 + Math.random() * 0.18; };
  // typing: bursts of keys with pauses
  const tg = mk("typing", 0.6); let left = 0;
  L.typing.ev = (t) => {
    if (left <= 0) { left = 4 + Math.floor(Math.random() * 18); return 0.5 + Math.random() * 1.8; }
    left--; const space = Math.random() < 0.15;
    burst(tg, t, space ? 1400 : 2400 + Math.random() * 1400, 1.2, 0.35, 0.035);
    burst(tg, t + 0.004, space ? 160 : 230, 3, 0.25, 0.05, brown);
    return 0.07 + Math.random() * 0.12;
  };
  timer = setInterval(tick, 100);
  return true;
}
function tick() {
  if (!ctx) return; const la = document.hidden ? 1.6 : 0.25, now = ctx.currentTime;
  Object.entries(L).forEach(([k, l]) => {
    if (!l.ev || mix[k] <= 0) { l.next = now; return; }
    if (l.next < now) l.next = now;
    while (l.next < now + la) l.next += l.ev(l.next);
  });
}
function apply() {
  if (!started) return;
  setMusicVol(mix.music); if (mix.music > 0) startMusic(); else stopMusic();
  const t = ctx.currentTime;
  Object.entries(L).forEach(([k, l]) => { l.g.gain.cancelScheduledValues(t); l.g.gain.setTargetAtTime(mix[k] * l.scale, t, 0.25); });
}
export function startAmbience() {
  if (typeof window === "undefined") return;
  if (!ctx && !setup()) return;
  if (ctx.state === "suspended") ctx.resume();
  if (!started) { started = true; apply(); } else if (mix.music > 0) startMusic();
}
// Distant thunder: a low rolling rumble with a couple of swells.
export function playThunder() {
  if (!ctx) return; const t = ctx.currentTime + 0.05, v = 0.35 + mix.rain * 0.6;
  const s = ctx.createBufferSource(); s.buffer = brown; s.loop = true;
  const lp = filt("lowpass", 260), g = gain(0);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.25); g.gain.exponentialRampToValueAtTime(v * 0.4, t + 1.0);
  g.gain.exponentialRampToValueAtTime(v * 0.8, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
  lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(120, t + 4);
  chain(s, lp, g, ctx.destination); s.start(t, Math.random() * 2); s.stop(t + 4.6);
}
