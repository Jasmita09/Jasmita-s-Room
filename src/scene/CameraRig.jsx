import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { VIEWS, SCREEN, readingFit } from "./layout.js";

const tmp = new THREE.PerspectiveCamera();
const v = new THREE.Vector3();
const CORNERS = [];
for (const x of [-4.85, 3.35]) for (const y of [0, 4.85]) for (const z of [-3.95, -2.25]) CORNERS.push(new THREE.Vector3(x, y, z));
CORNERS.push(new THREE.Vector3(-4.3, 0, -1.8), new THREE.Vector3(-3.7, 0, -1.8));

function fits(pos, target, fov, aspect) {
  tmp.fov = fov; tmp.aspect = aspect; tmp.near = 0.05; tmp.far = 100; tmp.updateProjectionMatrix();
  tmp.position.copy(pos); tmp.lookAt(target); tmp.updateMatrixWorld(true);
  return CORNERS.every((c) => { v.copy(c).project(tmp); return v.z < 1 && Math.abs(v.x) <= 0.96 && v.y <= 0.9 && v.y >= -0.8; });
}
// Room view: back the camera up (and widen the lens if the front wall is in the way) until the whole shelf + desk fit.
export function roomFit(aspect) {
  const T = new THREE.Vector3(...VIEWS.ROOM_VIEW.target), dir = VIEWS.ROOM_VIEW.dir;
  const at = (d) => T.clone().addScaledVector(dir, d);
  let lo = 2, hi = 40;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (fits(at(m), T, 50, aspect)) hi = m; else lo = m; }
  let d = hi, fov = 50;
  const maxD = (6.6 - T.z) / dir.z;
  if (d > maxD) {
    d = maxD; let flo = 50, fhi = 110;
    for (let i = 0; i < 24; i++) { const m = (flo + fhi) / 2; if (fits(at(d), T, m, aspect)) fhi = m; else flo = m; }
    fov = fhi;
  }
  return { position: at(d), target: T, fov };
}

// Smoothly lerps camera position, look-at target and lens between views.
export function CameraRig({ view, fit }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const room = useMemo(() => roomFit(aspect), [aspect]);
  const look = useRef(room.target.clone());
  const goal = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 50 }), []);
  useFrame((state, dt) => {
    const wide = aspect < 1 ? Math.min(85, 50 / Math.pow(aspect, 0.6)) : 50;
    if (view === "COMPUTER_VIEW") {
      goal.look.copy(fit.look); goal.pos.copy(fit.pos); goal.fov = fit.fov;
    } else if (view === "BOOKSHELF_VIEW") {
      goal.look.set(...VIEWS.BOOKSHELF_VIEW.target); goal.pos.set(...VIEWS.BOOKSHELF_VIEW.position); goal.fov = wide;
    } else {
      goal.look.copy(room.target); goal.pos.copy(room.position); goal.fov = room.fov;
      goal.pos.x += state.pointer.x * 0.25; goal.pos.y += state.pointer.y * 0.12;
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3.4);
    camera.position.lerp(goal.pos, k);
    look.current.lerp(goal.look, k);
    camera.lookAt(look.current);
    if (Math.abs(camera.fov - goal.fov) > 0.01) { camera.fov += (goal.fov - camera.fov) * k; camera.updateProjectionMatrix(); }
  });
  return null;
}
