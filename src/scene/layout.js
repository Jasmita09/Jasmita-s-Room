import * as THREE from "three";

export const COLORS = {
  ivory: "#fdf7f2", plum: "#2c2024", terracotta: "#c25934", amber: "#d97d46", cherry: "#7b2d42",
  olive: "#6b6b3a", cream: "#e9dcc3", navy: "#2a3550", wood: "#a0643a"
};
export const DESK = { x: 1.6, z: -3.2, top: 1.0, width: 3.4, depth: 1.5 };
// Modern 16:10 monitor, tilted back slightly so the reading view sees it head-on.
export const SCREEN = { width: 1.2, height: 0.75, x: 1.6, y: 1.56, z: -3.3, tilt: 0.1 };
SCREEN.normal = new THREE.Vector3(0, Math.sin(SCREEN.tilt), Math.cos(SCREEN.tilt));
SCREEN.center = new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z);
export const KEYBOARD = { x: 1.6, y: 1.004, z: -2.74, unit: 0.042 };
export const JOURNAL = { x: 0.65, z: -2.85 };
export const CHAIR = { x: 1.75, z: -2.0, ry: 0.4 };
export const SHELF = { x0: -4.75, xm: -3.3, x1: -1.85, zBack: -3.95, depth: 0.46, board: 0.045,
  levels: [0.12, 1.02, 1.92, 2.82, 3.72, 4.62] };
SHELF.zFront = SHELF.zBack + SHELF.depth;
export const shelfTop = (i) => SHELF.levels[i] + SHELF.board / 2;

// Reading view: fit the monitor to the viewport so 1 CSS px of the blog = 1 screen px (sharp, readable text).
const READ_FOV = 38;
export function readingFit(w, h) {
  const aspect = w / Math.max(1, h), t = Math.tan(THREE.MathUtils.degToRad(READ_FOV / 2));
  const d = Math.max(SCREEN.width / (0.95 * aspect * 2 * t), SCREEN.height / (0.8 * 2 * t));
  const focal = h / 2 / t;
  return { d, fov: READ_FOV, pxW: Math.max(320, Math.round((SCREEN.width * focal) / d)), pxH: Math.max(200, Math.round((SCREEN.height * focal) / d)) };
}

export const VIEWS = {
  ROOM_VIEW: { label: "Room", target: [-0.75, 2.4, -3.1], dir: new THREE.Vector3(0.04, 0.13, 1).normalize() },
  COMPUTER_VIEW: { label: "Computer" },
  BOOKSHELF_VIEW: { label: "Bookshelf", position: [-2.2, 2.5, 0.6], target: [-3.25, 2.35, -3.7] }
};

// Desk view: monitor + keyboard together. The camera looks slightly down at the desk and backs up until both fit
// between the HUD bars; the blog is then sized so it renders ~1:1 with screen pixels at that distance.
const DESK_FOV = 40;
const _dc = new THREE.PerspectiveCamera(), _dv = new THREE.Vector3();
const onScreen = (dx, dy) => new THREE.Vector3(SCREEN.x + dx, SCREEN.y + dy * Math.cos(SCREEN.tilt), SCREEN.z - dy * Math.sin(SCREEN.tilt));
const SCREEN_PTS = [onScreen(-0.62, 0.39), onScreen(0.62, 0.39), onScreen(-0.62, -0.39), onScreen(0.62, -0.39)];
// Desk view also frames the keyboard, the mug and the notebook so you can sip coffee while you read.
const TABLE_PTS = [...SCREEN_PTS, new THREE.Vector3(KEYBOARD.x - 0.4, KEYBOARD.y, KEYBOARD.z + 0.2), new THREE.Vector3(KEYBOARD.x + 0.4, KEYBOARD.y, KEYBOARD.z + 0.2),
  new THREE.Vector3(3.0, 1.2, -2.66), new THREE.Vector3(3.0, 1.0, -2.6), new THREE.Vector3(0.4, 1.0, -2.65)];
const DESK_DIR = new THREE.Vector3(0, Math.sin(SCREEN.tilt), Math.cos(SCREEN.tilt));
const DESK_UP = new THREE.Vector3(0, DESK_DIR.z, -DESK_DIR.y);
function ndc(pos, look, aspect, p) {
  _dc.fov = DESK_FOV; _dc.aspect = aspect; _dc.near = 0.05; _dc.far = 50; _dc.updateProjectionMatrix();
  _dc.position.copy(pos); _dc.lookAt(look); _dc.updateMatrixWorld(true);
  return _dv.copy(p).project(_dc);
}
export function deskFit(w, h, mode = "desk") {
  const DESK_PTS = mode === "screen" ? SCREEN_PTS : TABLE_PTS;
  const aspect = w / Math.max(1, h), hh = Math.max(300, h);
  const top = 1 - 150 / hh, bot = -1 + 24 / hh;
  const look = SCREEN.center.clone(), pos = new THREE.Vector3();
  const tanH = Math.tan(THREE.MathUtils.degToRad(DESK_FOV / 2));
  let d = 2;
  for (let pass = 0; pass < 3; pass++) {
    let lo = 0.5, hi = 9;
    for (let i = 0; i < 28; i++) {
      const m = (lo + hi) / 2; pos.copy(look).addScaledVector(DESK_DIR, m);
      const ok = DESK_PTS.every((p) => { const q = ndc(pos, look, aspect, p); return q.z < 1 && Math.abs(q.x) <= 0.97 && q.y <= top && q.y >= bot; });
      if (ok) hi = m; else lo = m;
    }
    d = hi; pos.copy(look).addScaledVector(DESK_DIR, d);
    const ys = DESK_PTS.map((p) => ndc(pos, look, aspect, p).y);
    look.addScaledVector(DESK_UP, ((Math.max(...ys) + Math.min(...ys)) / 2 - (top + bot) / 2) * d * tanH);
  }
  pos.copy(look).addScaledVector(DESK_DIR, d);
  const a = ndc(pos, look, aspect, onScreen(-SCREEN.width / 2, 0)).x, b = ndc(pos, look, aspect, onScreen(SCREEN.width / 2, 0)).x;
  const pxW = Math.max(320, Math.round(((b - a) / 2) * w));
  return { pos: pos.clone(), look: look.clone(), fov: DESK_FOV, pxW, pxH: Math.round((pxW * SCREEN.height) / SCREEN.width) };
}
