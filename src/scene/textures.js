import * as THREE from "three";

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(w, h, draw, opts = {}) {
  const k = opts.hd || 1, c = document.createElement("canvas");
  c.width = w * k; c.height = h * k;
  const g = c.getContext("2d");
  g.scale(k, k);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts.pixel !== false) {
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  } else { t.anisotropy = 8; }
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}

// Pixel-art Atlanta-ish twilight skyline seen through the window.
export const skylineTexture = () => canvasTexture(320, 180, (g, w, h) => {
  const r = rng(7);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#241a3d"); sky.addColorStop(0.3, "#4b2550"); sky.addColorStop(0.55, "#8e3a5a");
  sky.addColorStop(0.75, "#d4694a"); sky.addColorStop(0.9, "#f2a65e"); sky.addColorStop(1, "#f7c27a");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 80; i++) {
    g.fillStyle = "rgba(255,240,220," + (0.3 + r() * 0.6).toFixed(2) + ")";
    g.fillRect((r() * w) | 0, (r() * h * 0.42) | 0, 1, 1);
  }
  g.fillStyle = "#fbe9cf"; g.beginPath(); g.arc(62, 30, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#30204a"; g.beginPath(); g.arc(66, 27, 8, 0, Math.PI * 2); g.fill();
  const glow = g.createRadialGradient(212, 140, 4, 212, 140, 70);
  glow.addColorStop(0, "rgba(255,214,140,0.9)"); glow.addColorStop(1, "rgba(255,180,120,0)");
  g.fillStyle = glow; g.fillRect(140, 70, 150, 110);
  g.fillStyle = "#ffd38a"; g.beginPath(); g.arc(212, 140, 20, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(246,160,140,0.55)";
  for (let i = 0; i < 9; i++) g.fillRect((r() * w) | 0, (60 + r() * 50) | 0, (20 + r() * 50) | 0, 2);
  let x = 0;
  while (x < w) { const bw = (8 + r() * 16) | 0, bh = (22 + r() * 38) | 0; g.fillStyle = "#5a2d4f"; g.fillRect(x, h - bh, bw, bh); x += bw; }
  // spire tower
  g.fillStyle = "#3a2140"; g.fillRect(118, h - 118, 18, 118);
  g.beginPath(); g.moveTo(118, h - 118); g.lineTo(127, h - 140); g.lineTo(136, h - 118); g.fill();
  g.fillStyle = "#ffcf6b"; g.fillRect(126, h - 152, 2, 14);
  x = 0;
  while (x < w) {
    const bw = (10 + r() * 22) | 0, bh = (24 + r() * 56) | 0, top = h - bh;
    g.fillStyle = "#2b1a2e"; g.fillRect(x, top, bw, bh);
    for (let wy = top + 3; wy < h - 3; wy += 4)
      for (let wx = x + 2; wx < x + bw - 2; wx += 3)
        if (r() < 0.3) { g.fillStyle = r() < 0.8 ? "#ffc56b" : "#ff8f5a"; g.fillRect(wx, wy, 1, 2); }
    x += bw + (r() < 0.3 ? 2 : 0);
  }
});

export const floorTexture = () => canvasTexture(64, 64, (g, w, h) => {
  const r = rng(3);
  const tones = ["#6e4630", "#7a4f36", "#5f3c2a", "#83563a"];
  for (let y = 0; y < h; y += 8) {
    let x = -((r() * 30) | 0);
    while (x < w) {
      const len = (18 + r() * 30) | 0;
      g.fillStyle = tones[(r() * tones.length) | 0]; g.fillRect(x, y, len, 8);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x, y, 1, 8);
      x += len;
    }
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(0, y + 7, w, 1);
  }
}, { repeat: [5, 6] });

export const rugTexture = () => canvasTexture(48, 32, (g, w, h) => {
  g.fillStyle = "#7b2d42"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c25934"; g.fillRect(2, 2, w - 4, h - 4);
  g.fillStyle = "#f1dfc4"; g.fillRect(4, 4, w - 8, h - 8);
  g.fillStyle = "#d97d46"; g.fillRect(4, 7, w - 8, 1); g.fillRect(4, h - 8, w - 8, 1);
  for (let cx = 11; cx < w - 6; cx += 13) {
    for (let dy = -5; dy <= 5; dy++) {
      const ww = 5 - Math.abs(dy);
      g.fillStyle = "#d97d46"; g.fillRect(cx - ww, h / 2 + dy, ww * 2 + 1, 1);
      if (ww > 2) { g.fillStyle = "#7b2d42"; g.fillRect(cx - ww + 2, h / 2 + dy, ww * 2 - 3, 1); }
    }
  }
});

export const paintingTexture = (variant) => canvasTexture(32, 42, (g, w, h) => {
  if (variant === 0) {
    const s = g.createLinearGradient(0, 0, 0, h);
    s.addColorStop(0, "#4b2550"); s.addColorStop(0.5, "#d4694a"); s.addColorStop(1, "#f6c27a");
    g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffe0a0"; g.beginPath(); g.arc(20, 24, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#6b6b3a"; g.beginPath(); g.moveTo(0, 30); g.lineTo(12, 24); g.lineTo(26, 31); g.lineTo(32, 28); g.lineTo(32, 42); g.lineTo(0, 42); g.fill();
    g.fillStyle = "#3e3d22"; g.beginPath(); g.moveTo(0, 36); g.lineTo(18, 32); g.lineTo(32, 37); g.lineTo(32, 42); g.lineTo(0, 42); g.fill();
  } else {
    g.fillStyle = "#f4ead9"; g.fillRect(0, 0, w, h);
    [["#7b2d42", 13], ["#c25934", 9.5], ["#d97d46", 6]].forEach(([c, rad]) => {
      g.fillStyle = c; g.beginPath(); g.arc(16, 30, rad, Math.PI, 0); g.lineTo(16 + rad, 34); g.lineTo(16 - rad, 34); g.fill();
    });
    g.fillStyle = "#2a3550"; g.fillRect(22, 8, 4, 4); g.fillStyle = "#6b6b3a"; g.fillRect(0, 34, w, 8);
  }
});

function wrap(g, text, maxW) {
  const words = text.split(" "); const lines = []; let line = "";
  words.forEach((wd) => { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; });
  if (line) lines.push(line);
  return lines;
}

export const journalTexture = (text, date, label = "TODAY’S REFLECTION") => canvasTexture(1024, 680, (g, w, h) => {
  g.fillStyle = "#fbf3e4"; g.fillRect(0, 0, w, h);
  const crease = g.createLinearGradient(w / 2 - 40, 0, w / 2 + 40, 0);
  crease.addColorStop(0, "rgba(0,0,0,0)"); crease.addColorStop(0.5, "rgba(90,50,30,0.22)"); crease.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = crease; g.fillRect(w / 2 - 40, 0, 80, h);
  g.strokeStyle = "rgba(110,140,170,0.28)"; g.lineWidth = 2;
  for (let y = 130; y < h - 30; y += 44) { g.beginPath(); g.moveTo(40, y); g.lineTo(w / 2 - 30, y); g.moveTo(w / 2 + 30, y); g.lineTo(w - 40, y); g.stroke(); }
  g.strokeStyle = "rgba(194,89,52,0.45)"; g.beginPath(); g.moveTo(90, 30); g.lineTo(90, h - 30); g.stroke();
  g.fillStyle = "#7b2d42"; g.font = "bold 50px Georgia, serif"; g.fillText("Daily Inspiration", 110, 100);
  g.fillStyle = "#5b4a4f"; g.font = "italic 32px Georgia, serif";
  g.fillText(date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), 110, 168);
  g.fillStyle = "#d97d46"; g.beginPath(); g.ellipse(250, 400, 80, 64, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#b5541f"; g.lineWidth = 4;
  [-40, 0, 40].forEach((dx) => { g.beginPath(); g.ellipse(250 + dx, 400, 26, 62, 0, 0, Math.PI * 2); g.stroke(); });
  g.fillStyle = "#5b4a22"; g.fillRect(244, 326, 12, 20);
  g.fillStyle = "#c25934"; g.font = "38px Georgia, serif"; g.fillText("✶  ✶", 360, 300); g.fillText("✶", 140, 560);
  g.fillStyle = "#c25934"; g.font = "bold 30px Georgia, serif"; g.fillText(label, w / 2 + 60, 100);
  g.fillStyle = "#2c2024";
  let fs = 54, lines;
  for (;;) { g.font = "italic " + fs + "px Georgia, serif"; lines = wrap(g, text, w / 2 - 120); if (lines.length * fs * 1.34 <= h - 290 || fs <= 22) break; fs -= 2; }
  lines.forEach((ln, i) => g.fillText(ln, w / 2 + 60, 150 + fs + i * fs * 1.34));
  g.fillStyle = "#7b2d42"; g.font = "italic 40px Georgia, serif"; g.fillText("— J. 🍒", w - 220, h - 70);
}, { pixel: false });
