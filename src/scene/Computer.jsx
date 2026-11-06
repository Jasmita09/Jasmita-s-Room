import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SCREEN, DESK } from "./layout.js";
import { useHover } from "./cursor.js";
import { ui } from "./bus.js";
import { Keyboard } from "./Keyboard.jsx";
import { NotesApp } from "../blog/NotesApp.jsx";

const BLACK = "#141216", ALU = "#b9b4b0";
const stop = (e) => e.stopPropagation();
// Keep clicks/scrolls on the blog from also hitting 3D objects behind the screen.
const STOP = { onPointerDown: stop, onPointerUp: stop, onPointerMove: stop, onClick: stop, onDoubleClick: stop, onContextMenu: stop, onWheel: stop };

// Modern slim 16:10 monitor. The blog is real HTML on the glass (<Html transform occlude="blending">),
// sized so it renders 1:1 with screen pixels in the reading view.
export function Computer({ view, setView, fit, fullscreen }) {
  const active = view === "COMPUTER_VIEW";
  const [, bind] = useHover(!active, "Click to read · scroll here to skim");
  const { x, y, z, width: W, height: H, tilt } = SCREEN;
  const zoom = (e) => { e.stopPropagation(); if (!active) setView("COMPUTER_VIEW"); };
  // Lay the site out narrower than the on-screen size so the text is magnified and easy to read.
  const mag = Math.max(1, fit.pxW / 760), cw = Math.round(fit.pxW / mag), ch = Math.round(fit.pxH / mag);
  return (
    <group>
      <group position={[x, y, z]} rotation={[-tilt, 0, 0]}>
        <group {...bind} onPointerOver={(e) => { bind.onPointerOver(e); ui.overScreen = true; }} onPointerOut={(e) => { bind.onPointerOut(e); ui.overScreen = false; }} onClick={zoom}>
          <mesh position={[0, -0.012, -0.018]}><boxGeometry args={[W + 0.036, H + 0.06, 0.034]} /><meshStandardMaterial color={BLACK} roughness={0.4} metalness={0.2} /></mesh>
          <mesh position={[0, -0.02, -0.06]}><boxGeometry args={[W - 0.1, H - 0.1, 0.05]} /><meshStandardMaterial color={ALU} metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0, -H / 2 - 0.028, 0.0005]}><boxGeometry args={[0.05, 0.008, 0.002]} /><meshStandardMaterial color="#d97d46" emissive="#ff9a3c" emissiveIntensity={active ? 2 : 0.8} toneMapped={false} /></mesh>
        </group>
        <Html transform occlude="blending" geometry={<planeGeometry args={[W, H]} />} position={[0, 0, 0.0012]} distanceFactor={(W * 400) / cw} zIndexRange={[20, 0]}>
          <div className={"crt" + (active ? " is-active" : "")} style={{ width: cw, height: ch }} {...STOP}>
            {fullscreen ? <div className="crt-away">{"Reading in full screen…"}</div> : <NotesApp active={active} width={cw} />}
            {!active && (
              <button className="crt-wake" onClick={() => setView("COMPUTER_VIEW")}>
                <span>{"▶ Click to read Cherri-Picked Notes 🍒"}</span>
              </button>
            )}
          </div>
        </Html>
      </group>
      {/* stand */}
      <mesh position={[x, DESK.top + 0.26, z - 0.11]} rotation={[-0.12, 0, 0]}><boxGeometry args={[0.08, 0.5, 0.03]} /><meshStandardMaterial color={ALU} metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[x, DESK.top + 0.008, z - 0.06]}><boxGeometry args={[0.36, 0.016, 0.24]} /><meshStandardMaterial color={ALU} metalness={0.6} roughness={0.35} /></mesh>
      <pointLight position={[x, y, z + 0.5]} color="#fff0dc" intensity={active ? 1.2 : 0.8} distance={2.2} decay={2} />
      <Keyboard active={active} onWake={() => setView("COMPUTER_VIEW")} />
      {/* desk mat + mouse */}
      <mesh position={[1.75, DESK.top + 0.002, -2.72]}><boxGeometry args={[1.25, 0.004, 0.46]} /><meshStandardMaterial color="#3a2a30" roughness={0.95} /></mesh>
      <mesh position={[2.22, DESK.top + 0.014, -2.7]} scale={[0.55, 0.22, 0.9]}><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial color="#f4efe9" roughness={0.4} /></mesh>
    </group>
  );
}
