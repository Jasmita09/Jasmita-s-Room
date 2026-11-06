import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DESK } from "./layout.js";
import { useHover } from "./cursor.js";
import { bus } from "./bus.js";
import { Bubble } from "./Bubble.jsx";
import { playBoo } from "../audio/keyClick.js";

const FUR = "#b07642", FUR_L = "#d0a06a", PAD = "#e6bd92", ORANGE = "#f06a1d", ORANGE_D = "#cf5418", GREEN = "#1d5b38", INK = "#121014";
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => x * x * (3 - 2 * x);

// Felt pumpkin costume with a black jack-o'-lantern face (u = 0.25 is the front of a three.js sphere).
function costumeTexture() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = ORANGE; g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(150,50,10,0.3)"; g.fillRect(x - 2, 0, 4, 128); }
  const cx = 64;
  g.fillStyle = INK;
  const tri = (x, y, s) => { g.beginPath(); g.moveTo(x - s, y + s * 0.8); g.lineTo(x + s, y + s * 0.8); g.lineTo(x + s * 0.15, y - s); g.closePath(); g.fill(); };
  tri(cx - 16, 50, 10); tri(cx + 16, 50, 10);
  g.beginPath(); g.moveTo(cx - 28, 70); g.quadraticCurveTo(cx, 100, cx + 28, 70); g.quadraticCurveTo(cx, 84, cx - 28, 70); g.fill();
  g.fillStyle = ORANGE; g.fillRect(cx - 12, 76, 7, 5); g.fillRect(cx + 5, 76, 7, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const LEAF = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.035, 0.008, 0.06, 0.04, 0.07, 0.075); s.bezierCurveTo(0.03, 0.07, 0.006, 0.04, 0, 0); return s; })();

// Pumpkin Bear: a teddy in a pumpkin costume next to the monitor. Every so often (or when clicked) he pops up,
// throws his paws in the air and yells "Boo!" (which spooks the cat), then settles back down.
export function Teddy({ position = [2.47, DESK.top, -3.18], rotationY = -0.38, scale = 0.85 }) {
  const pop = useRef(), head = useRef(), armL = useRef(), armR = useRef(), mouth = useRef(), eyes = useRef([]);
  const tex = useMemo(costumeTexture, []);
  const [hover, bind] = useHover(true, "\u{1F9F8} Pumpkin Bear \u00b7 click me!");
  const [boo, setBoo] = useState(false);
  const S = useMemo(() => ({ t: -1, next: 6 + Math.random() * 4, blink: 2, emitted: false, say: false }), []);
  const start = () => { if (S.t < 0) { S.t = 0; S.emitted = false; } };
  useEffect(() => bus.on("teddyPop", start), [S]);
  useFrame(({ clock }, rawDt) => {
    const g = pop.current; if (!g) return;
    const dt = Math.min(rawDt, 0.05), time = clock.elapsedTime;
    if (S.t < 0) { S.next -= dt; if (S.next <= 0) start(); }
    let up = 0, crouch = 0, open = 0, shake = 0;
    if (S.t >= 0) {
      S.t += dt; const t = S.t;
      if (t < 0.22) crouch = t / 0.22;
      else if (t < 0.42) { const p = (t - 0.22) / 0.2; crouch = 1 - p; up = p; }
      else if (t < 1.8) { up = 1; open = 1; shake = 1; }
      else if (t < 2.45) { const p = (t - 1.8) / 0.65; up = 1 - p; open = Math.max(0, 1 - p * 3); }
      else { S.t = -1; S.next = 16 + Math.random() * 14; }
      if (t > 0.36 && !S.emitted) { S.emitted = true; bus.emit("boo"); playBoo(); }
    }
    const want = S.t > 0.36 && S.t < 1.85;
    if (want !== S.say) { S.say = want; setBoo(want); }
    const u = ease(Math.min(1, Math.max(0, up)));
    g.position.set(0, u * 0.17 - crouch * 0.015 + Math.sin(time * 1.4) * 0.003, u * 0.07);
    g.rotation.set(u * 0.28 + shake * Math.sin(time * 38) * 0.035, 0, shake * Math.sin(time * 31) * 0.05);
    g.scale.set(1 + crouch * 0.05, 1 - crouch * 0.1 + u * 0.03, 1 + crouch * 0.05);
    const idle = 1 - u, waving = hover && S.t < 0 ? 1 : 0;
    head.current.rotation.set(-0.15 * u + Math.sin(time * 0.7) * 0.04, Math.sin(time * 0.45) * 0.35 * idle, (Math.sin(time * 0.6) * 0.12 + (hover ? 0.18 : 0)) * idle);
    armL.current.rotation.set(lerp(-0.75, -0.3, u), 0, lerp(0.35, 2.5, u));
    armR.current.rotation.set(lerp(-0.75, -0.3, Math.max(u, waving)), 0, lerp(-0.35, -2.5, u) - waving * (1.7 + Math.sin(time * 9) * 0.35));
    mouth.current.scale.set(1, 0.15 + open * 0.85, 1);
    S.blink -= dt; if (S.blink < -0.12) S.blink = 2.5 + Math.random() * 3;
    eyes.current.forEach((e) => { if (e) e.scale.y = S.blink < 0 ? 0.15 : 1; });
  });
  const fur = <meshStandardMaterial color={FUR} roughness={0.95} />;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group {...bind} onClick={(e) => { e.stopPropagation(); start(); }}>
        <mesh position={[0, 0.24, 0.03]}><boxGeometry args={[0.36, 0.5, 0.32]} /><meshBasicMaterial visible={false} /></mesh>
      </group>
      <group ref={pop}>
        {[1, -1].map((s) => (
          <group key={"l" + s} position={[0.065 * s, 0.05, 0.03]} rotation={[Math.PI / 2 - 0.15, 0, -0.2 * s]}>
            <mesh position={[0, 0.06, 0]}><capsuleGeometry args={[0.042, 0.08, 4, 10]} />{fur}</mesh>
            <mesh position={[0, 0.138, 0]} scale={[1, 0.25, 1]}><sphereGeometry args={[0.036, 12, 8]} /><meshStandardMaterial color={PAD} roughness={1} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.145, 0]} scale={[1, 0.98, 0.9]}><sphereGeometry args={[0.125, 26, 18]} /><meshStandardMaterial map={tex} roughness={0.95} /></mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.062, 0.022, 8, 18]} /><meshStandardMaterial color={ORANGE_D} roughness={0.95} /></mesh>
        {[1, -1].map((s, i) => (
          <group key={"a" + s} ref={i === 0 ? armL : armR} position={[0.112 * s, 0.215, 0]}>
            <mesh position={[0, -0.06, 0]}><capsuleGeometry args={[0.034, 0.075, 4, 10]} />{fur}</mesh>
            <mesh position={[0, -0.114, 0.014]} scale={[1, 0.62, 0.32]}><sphereGeometry args={[0.027, 10, 8]} /><meshStandardMaterial color={PAD} roughness={1} /></mesh>
          </group>
        ))}
        <group ref={head} position={[0, 0.34, 0]}>
          <mesh scale={[1.05, 0.98, 0.95]}><sphereGeometry args={[0.09, 22, 16]} />{fur}</mesh>
          <mesh position={[0, -0.026, 0.072]} scale={[1.15, 0.85, 0.85]}><sphereGeometry args={[0.04, 14, 10]} /><meshStandardMaterial color={FUR_L} roughness={1} /></mesh>
          <mesh position={[0, -0.012, 0.106]} scale={[1.3, 0.9, 0.8]}><sphereGeometry args={[0.0125, 10, 8]} /><meshStandardMaterial color={INK} roughness={0.3} /></mesh>
          <mesh ref={mouth} position={[0, -0.048, 0.1]} scale={[1, 0.15, 1]}><sphereGeometry args={[0.015, 10, 8]} /><meshStandardMaterial color="#3a1414" /></mesh>
          {[1, -1].map((s, i) => (
            <group key={"e" + s} ref={(el) => { eyes.current[i] = el; }} position={[0.033 * s, 0.02, 0.08]}>
              <mesh><sphereGeometry args={[0.012, 10, 8]} /><meshStandardMaterial color={INK} roughness={0.15} metalness={0.3} /></mesh>
              <mesh position={[0.004, 0.004, 0.009]}><sphereGeometry args={[0.0035, 6, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
          ))}
          {[1, -1].map((s) => (
            <group key={"r" + s} position={[0.07 * s, 0.066, -0.005]}>
              <mesh scale={[1, 1, 0.6]}><sphereGeometry args={[0.035, 12, 10]} />{fur}</mesh>
              <mesh position={[0, -0.002, 0.017]} scale={[1, 1, 0.3]}><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color={FUR_L} roughness={1} /></mesh>
            </group>
          ))}
          <group position={[0.022, 0.078, 0.004]} rotation={[0.05, 0, -0.32]}>
            <mesh scale={[1, 0.5, 1]}><sphereGeometry args={[0.065, 18, 10]} /><meshStandardMaterial color={ORANGE} roughness={0.95} /></mesh>
            <mesh position={[0.004, 0.046, 0]} rotation={[0, 0, 0.18]}><cylinderGeometry args={[0.008, 0.011, 0.07, 6]} /><meshStandardMaterial color={GREEN} roughness={0.9} /></mesh>
            <mesh position={[-0.012, 0.028, 0.02]} rotation={[-0.4, 0.4, 0.9]} scale={1.2}><shapeGeometry args={[LEAF]} /><meshStandardMaterial color={GREEN} side={THREE.DoubleSide} roughness={0.9} /></mesh>
          </group>
        </group>
        <Bubble text={boo ? "Boo!" : null} position={[0.02, 0.64, 0.05]} scale={0.19} ink="#c2410c" />
      </group>
    </group>
  );
}
