import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CHAIR } from "./layout.js";
import { useHover } from "./cursor.js";

const FRAME = "#1c1b1e", SEAT = "#7b2d42", SEAT2 = "#93405a";
const LEGS = [0, 1, 2, 3, 4].map((i) => (i * Math.PI * 2) / 5);

// Rolling desk chair: five-star base on casters, gas lift, cherry cushions. Rolls aside in the computer view; click to spin.
export function Chair({ view }) {
  const g = useRef(), top = useRef(), spin = useRef({ a: 0, target: 0 });
  const [, bind] = useHover(true, "↻ Spin the chair");
  useFrame((_, dt) => {
    if (!g.current) return;
    const away = view === "COMPUTER_VIEW";
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 2.6);
    const tx = CHAIR.x + (away ? 1.25 : 0), tz = CHAIR.z + (away ? 0.6 : 0), tr = CHAIR.ry + (away ? 0.9 : 0);
    g.current.position.x += (tx - g.current.position.x) * k;
    g.current.position.z += (tz - g.current.position.z) * k;
    g.current.rotation.y += (tr - g.current.rotation.y) * k;
    const s = spin.current;
    s.a += (s.target - s.a) * (1 - Math.exp(-Math.min(dt, 0.1) * 2.2));
    if (top.current) top.current.rotation.y = s.a;
  });
  return (
    <group ref={g} position={[CHAIR.x, 0, CHAIR.z]} rotation={[0, CHAIR.ry, 0]} {...bind}
      onClick={(e) => { e.stopPropagation(); spin.current.target += Math.PI * 2; }}>
      {LEGS.map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh position={[0.17, 0.075, 0]} rotation={[0, 0, -0.08]}><boxGeometry args={[0.34, 0.035, 0.05]} /><meshStandardMaterial color={FRAME} metalness={0.6} roughness={0.35} /></mesh>
          <mesh position={[0.33, 0.035, 0]}><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#2c2024" roughness={0.5} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.05, 0.06, 0.06, 10]} /><meshStandardMaterial color={FRAME} metalness={0.6} /></mesh>
      <group ref={top}>
        <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.024, 0.024, 0.32, 10]} /><meshStandardMaterial color="#a3a3ab" metalness={0.85} roughness={0.25} /></mesh>
        <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.3, 0.04, 0.3]} /><meshStandardMaterial color={FRAME} /></mesh>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.56, 0.09, 0.52]} /><meshStandardMaterial color={SEAT} roughness={0.85} /></mesh>
        <mesh position={[0, 0.548, 0.01]}><boxGeometry args={[0.5, 0.012, 0.46]} /><meshStandardMaterial color={SEAT2} roughness={0.9} /></mesh>
        <mesh position={[0, 0.66, 0.3]}><boxGeometry args={[0.07, 0.34, 0.04]} /><meshStandardMaterial color={FRAME} /></mesh>
        <group position={[0, 0.98, 0.31]} rotation={[-0.12, 0, 0]}>
          <mesh><boxGeometry args={[0.52, 0.56, 0.08]} /><meshStandardMaterial color={SEAT} roughness={0.85} /></mesh>
          <mesh position={[0, 0, -0.042]}><boxGeometry args={[0.44, 0.46, 0.01]} /><meshStandardMaterial color={SEAT2} roughness={0.9} /></mesh>
        </group>
        {[-0.3, 0.3].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.63, 0.04]}><boxGeometry args={[0.035, 0.2, 0.035]} /><meshStandardMaterial color={FRAME} /></mesh>
            <mesh position={[x, 0.74, 0.02]}><boxGeometry args={[0.07, 0.03, 0.28]} /><meshStandardMaterial color="#2c2024" roughness={0.7} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
