import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { rng } from "./textures.js";

// The sky outside follows the visitor's own clock: sun elevation from local time, date and timezone.
const D2R = Math.PI / 180;
export const SKY_MODES = [["live", "Live (your clock)"], ["sunrise", "Sunrise"], ["midday", "Midday"], ["sunset", "Sunset"], ["midnight", "Midnight"]];
const PRESET = { sunrise: { el: 1.5, H: -80 }, midday: { el: 48, H: 0 }, sunset: { el: 1, H: 80 }, midnight: { el: -40, H: 180 } };

export function sunPosition(date = new Date()) {
  const y = date.getFullYear(), jan = new Date(y, 0, 1).getTimezoneOffset(), jul = new Date(y, 6, 1).getTimezoneOffset();
  const lat = (jan < jul ? -33 : 34) * D2R; // DST in January means southern hemisphere
  const dst = date.getTimezoneOffset() < Math.max(jan, jul) ? 1 : 0;
  const doy = Math.floor((date - new Date(y, 0, 0)) / 864e5);
  const dec = -23.44 * Math.cos(((2 * Math.PI) / 365) * (doy + 10)) * D2R;
  const hours = date.getHours() + date.getMinutes() / 60;
  const H = 15 * (hours - (12.4 + dst));
  const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H * D2R)) / D2R;
  return { el, H: ((H + 540) % 360) - 180 };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function skyInfo(mode, date = new Date()) {
  const { el, H } = PRESET[mode] || sunPosition(date);
  const phase = el >= 8 ? (H < 0 ? "Morning" : "Afternoon") : el >= -1 ? (H < 0 ? "Sunrise" : "Sunset") : el >= -10 ? (H < 0 ? "Dawn" : "Dusk") : "Night";
  return { mode, el, H, phase, day: smooth(-6, 12, el), golden: Math.exp(-(((el - 1) / 7) ** 2)), key: mode + Math.round(el * 2) + ":" + Math.round(H / 4) };
}
export function useSkyInfo(mode) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return useMemo(() => skyInfo(mode, now), [mode, now]);
}

const weights = (el) => { const n = 1 - smooth(-14, -3, el), d = smooth(2, 14, el); return [n, Math.max(0, 1 - n - d), d]; };
function mix(el, night, dusk, day) {
  const [n, k, d] = weights(el);
  return new THREE.Color(0, 0, 0).add(new THREE.Color(night).multiplyScalar(n)).add(new THREE.Color(dusk).multiplyScalar(k)).add(new THREE.Color(day).multiplyScalar(d)).getStyle();
}

export function drawSky(g, w, h, info) {
  const { el, H } = info;
  const top = mix(el, "#070a1f", "#241a3d", "#3f8fdc"), mid = mix(el, "#141634", "#8e3a5a", "#86bfeb"), bot = mix(el, "#262347", "#f2a65e", "#d6ecf7");
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, top); grd.addColorStop(0.5, mid); grd.addColorStop(1, bot);
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  const rs = rng(11), starA = Math.min(1, Math.max(0, (-el - 3) / 8));
  for (let i = 0; i < 120; i++) {
    const x = (rs() * w) | 0, y = (rs() * h * 0.62) | 0, a = (0.3 + rs() * 0.7) * starA;
    if (a > 0.03) { g.fillStyle = "rgba(255,244,225," + a.toFixed(2) + ")"; g.fillRect(x, y, 1, 1); }
  }
  if (el > -5) {
    const sx = w * (0.57 + Math.max(-1, Math.min(1, H / 95)) * 0.13), sy = h * (1 - (0.38 + Math.max(-0.1, Math.min(1, el / 45)) * 0.4));
    const warm = info.golden > 0.4, gc = warm ? "255,190,110" : "255,250,228";
    const glow = g.createRadialGradient(sx, sy, 2, sx, sy, warm ? 80 : 55);
    glow.addColorStop(0, "rgba(" + gc + "," + (0.5 + info.golden * 0.4).toFixed(2) + ")"); glow.addColorStop(1, "rgba(" + gc + ",0)");
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = warm ? "#ffcf7a" : "#fff7da"; g.beginPath(); g.arc(sx, sy, warm ? 14 : 10, 0, Math.PI * 2); g.fill();
  }
  if (el < -3) {
    g.fillStyle = "#f6ecd6"; g.beginPath(); g.arc(196, 52, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = top; g.beginPath(); g.arc(200, 49, 7, 0, Math.PI * 2); g.fill();
  }
  const rc = rng(5), day = info.day > 0.6;
  const cl = day ? "255,255,255" : el > -8 ? "246,160,140" : "70,62,104";
  for (let i = 0; i < 8; i++) {
    const cx = (rc() * w) | 0, cy = (34 + rc() * 62) | 0, cw = (16 + rc() * 34) | 0;
    g.fillStyle = "rgba(" + cl + "," + (day ? 0.9 : 0.55) + ")";
    g.fillRect(cx, cy, cw, 3); g.fillRect(cx + 4, cy - 2, Math.max(4, cw - 12), 2); g.fillRect(cx + 7, cy + 3, Math.max(4, cw - 16), 1);
  }
  const rb = rng(7), back = mix(el, "#1c1530", "#5a2d4f", "#93a3bd"), front = mix(el, "#0f0b18", "#2b1a2e", "#5f6f88");
  let x = 0;
  while (x < w) { const bw = (8 + rb() * 16) | 0, bh = (22 + rb() * 38) | 0; g.fillStyle = back; g.fillRect(x, h - bh, bw, bh); x += bw; }
  g.fillStyle = front; g.fillRect(118, h - 118, 18, 118);
  g.beginPath(); g.moveTo(118, h - 118); g.lineTo(127, h - 140); g.lineTo(136, h - 118); g.fill();
  g.fillStyle = el > 8 ? "#c9a24a" : "#ffcf6b"; g.fillRect(126, h - 152, 2, 14);
  const lit = info.day > 0.7 ? 0.05 : 0.32, rw = rng(13);
  x = 0;
  while (x < w) {
    const bw = (10 + rb() * 22) | 0, bh = (24 + rb() * 56) | 0, tp = h - bh;
    g.fillStyle = front; g.fillRect(x, tp, bw, bh);
    for (let wy = tp + 3; wy < h - 3; wy += 4)
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        const a = rw(), b = rw();
        if (a < lit) { g.fillStyle = b < 0.8 ? "#ffc56b" : "#ff8f5a"; g.fillRect(wx, wy, 1, 2); }
        else if (day && b < 0.3) { g.fillStyle = "rgba(214,236,247,.55)"; g.fillRect(wx, wy, 1, 2); }
      }
    x += bw + (rb() < 0.3 ? 2 : 0);
  }
}

export function useSkyTexture(info) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 320; c.height = 180;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }, []);
  useMemo(() => { drawSky(tex.image.getContext("2d"), 320, 180, info); tex.needsUpdate = true; }, [tex, info.key]);
  return tex;
}
