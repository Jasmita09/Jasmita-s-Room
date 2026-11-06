import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useHover } from "./cursor.js";
import { bus } from "./bus.js";
import { Bubble } from "./Bubble.jsx";

const SKIN = "#e2ad80", SKIN_SH = "#c98f63", HAIR = "#17111a", CLOAK = "#3b1f4a", CLOAK_DARK = "#2a1436", LINING = "#7b2d42";
const BAND = "#e8772e", WOOD = "#8b5a2b", STRAW = "#d9a94e", INK = "#1a1014", GOLD = "#ffd27a";

// Easter egg: a chibi witch flying laps around the room with a golden sparkle trail.
const PATH = [[-1.55, 2.55, -2.75], [-0.2, 3.05, -3.25], [1.6, 3.85, -3.35], [3.3, 3.25, -2.1], [2.2, 3.45, -0.3], [-0.3, 3.0, -0.5], [-1.9, 2.75, -1.5]];
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _t2 = new THREE.Vector3();

// Little personality loop: she cycles through moods; hovering makes her wave, Pumpkin Bear's BOO! startles her.
const MOODS = ["happy", "giggle", "wave", "happy", "twirl", "wink", "happy", "sleepy", "giggle", "twirl"];
const SAY = {
  wave: ["Hi there! \u2728", "Hello, friend!", "Click me!"],
  giggle: ["hehe~", "tee-hee!"],
  twirl: ["Wheee!", "Loop-de-loop!"],
  sleepy: ["*yawn*", "zzz\u2026"],
  surprised: ["Eek!", "Boo to you too!"],
  wink: ["\u2606 wink \u2606"]
};
const pick = (a) => a[(Math.random() * a.length) | 0];
const M = ({ c, ...p }) => <meshStandardMaterial color={c} roughness={0.75} {...p} />;

// World-space golden sparkle trail streaming off the broom.
function Trail({ src }) {
  const N = 48;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const init = useRef(false);
  useFrame(({ clock }) => {
    const o = src.current; if (!o) return;
    const pos = geo.attributes.position.array, col = geo.attributes.color.array;
    o.localToWorld(tmp.set(-0.72, 0, 0));
    if (!init.current) { for (let i = 0; i < N; i++) tmp.toArray(pos, i * 3); init.current = true; }
    pos.copyWithin(3, 0, (N - 1) * 3);
    pos[0] = tmp.x + (Math.random() - 0.5) * 0.05; pos[1] = tmp.y + (Math.random() - 0.5) * 0.05; pos[2] = tmp.z + (Math.random() - 0.5) * 0.05;
    for (let i = 0; i < N; i++) { const f = Math.pow(1 - i / N, 1.6) * (0.75 + 0.25 * Math.sin(clock.elapsedTime * 9 + i)); col[i * 3] = f; col[i * 3 + 1] = f * 0.8; col[i * 3 + 2] = f * 0.42; }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial size={0.045} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

export function Witch({ scale = 0.72, onClick }) {
  const root = useRef(), inner = useRef(), bub = useRef();
  const eyes = useRef(), eyeL = useRef(), eyeR = useRef(), happyEyes = useRef(), smile = useRef(), mouthO = useRef();
  const brows = useRef(), armR = useRef(), cape = useRef(), hatTip = useRef(), hair = useRef(), legs = useRef(), bucket = useRef();
  const [hover, bind] = useHover(true, "\u2728 psst\u2026 click me");
  const [say, setSay] = useState(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p)), true, "centripetal"), []);
  const u = useRef(0), speed = useRef(1);
  const S = useRef({ mood: "happy", t: 0, dur: 4, blink: 1.5, hover: false, i: 0 });
  const setMood = (mood, dur) => { const s = S.current; s.mood = mood; s.t = 0; s.dur = dur; setSay(SAY[mood] ? pick(SAY[mood]) : null); };
  useEffect(() => bus.on("boo", () => setMood("surprised", 2.4)), []);
  const loop = useRef(0);
  useEffect(() => bus.on("witching", () => { loop.current = 3.4; setMood("giggle", 3.6); }), []);

  useFrame(({ clock }, rawDt) => {
    const r = root.current; if (!r || !inner.current) return;
    const dt = Math.min(rawDt, 0.05), t = clock.elapsedTime, s = S.current, k = (x) => 1 - Math.exp(-dt * x);
    // flight along the loop (slows right down while hovered so she is easy to click)
    speed.current += ((hover ? 0.12 : s.mood === "twirl" ? 1.5 : 1) - speed.current) * 0.06;
    u.current = (u.current + dt * 0.018 * speed.current) % 1;
    curve.getPointAt(u.current, _p); curve.getTangentAt(u.current, _t); curve.getTangentAt((u.current + 0.03) % 1, _t2);
    r.position.set(_p.x, _p.y + Math.sin(t * 1.8) * 0.08, _p.z);
    const yaw = Math.atan2(-_t.z, _t.x), yaw2 = Math.atan2(-_t2.z, _t2.x);
    const turn = Math.atan2(Math.sin(yaw2 - yaw), Math.cos(yaw2 - yaw));
    r.rotation.order = "YXZ";
    r.rotation.y = yaw;
    r.rotation.x = THREE.MathUtils.clamp(-turn * 2.2, -0.45, 0.45);
    r.rotation.z = Math.asin(THREE.MathUtils.clamp(_t.y, -1, 1)) + Math.sin(t * 1.8 + 0.8) * 0.06;
    r.scale.setScalar(THREE.MathUtils.lerp(r.scale.x, scale * (hover ? 1.12 : 1), 0.15));
    if (loop.current > 0) {
      loop.current = Math.max(0, loop.current - dt);
      const p = 1 - loop.current / 3.4, w = Math.min(1, p * 5, (1 - p) * 5), a = p * Math.PI * 4;
      r.position.lerp(_p.set(0.6 + Math.cos(a) * 2.4, 4.15 + Math.sin(a * 2) * 0.25, -1.6 + Math.sin(a) * 1.7), w);
      r.rotation.y = THREE.MathUtils.lerp(r.rotation.y, Math.atan2(-Math.cos(a), -Math.sin(a)), w);
      r.rotation.x = w * p * Math.PI * 4; r.rotation.z = w * 0.35;
    }

    // mood machine
    s.t += dt;
    if (hover && !s.hover && s.mood !== "surprised") setMood("wave", 2.6);
    s.hover = hover;
    if (s.t > s.dur) {
      s.i = (s.i + 1) % MOODS.length;
      const nx = hover ? "wave" : MOODS[s.i];
      setMood(nx, nx === "twirl" ? 1.6 : nx === "happy" ? 4 + Math.random() * 3 : 2.8);
    }
    const mood = s.mood;

    // face: blinking, winking, giggly ^^ eyes, surprised O-mouth, raised brows
    s.blink -= dt;
    let open = 1;
    if (s.blink < 0) { open = 0.08; if (s.blink < -0.12) s.blink = 1.8 + Math.random() * 3; }
    if (mood === "sleepy") open = 0.22 + 0.12 * Math.sin(t * 2);
    if (mood === "surprised") open = 1.35;
    const wink = mood === "wink" && s.t > 0.25 && s.t < 1.7;
    eyeL.current.scale.y += ((wink ? 0.08 : open) - eyeL.current.scale.y) * k(28);
    eyeR.current.scale.y += (open - eyeR.current.scale.y) * k(28);
    const giggle = mood === "giggle";
    eyes.current.visible = !giggle; happyEyes.current.visible = giggle;
    const oMouth = mood === "surprised" || mood === "sleepy" || mood === "twirl";
    smile.current.visible = !oMouth; mouthO.current.visible = oMouth;
    mouthO.current.scale.setScalar(mood === "surprised" || mood === "twirl" ? 1 : 0.6);
    brows.current.position.y += ((mood === "surprised" ? 0.014 : mood === "sleepy" ? -0.008 : mood === "wave" ? 0.006 : 0) - brows.current.position.y) * k(10);

    // waving arm (also flings both hands up in surprise)
    const up = mood === "wave" || mood === "surprised" || mood === "twirl";
    const armGoal = up ? 2.35 + (mood === "wave" ? Math.sin(t * 13) * 0.4 : 0) : 0.75;
    armR.current.rotation.z += (armGoal - armR.current.rotation.z) * k(12);

    // body: giggle bounce, twirl = barrel roll around the broom, sleepy droop
    const ib = inner.current;
    ib.rotation.x = mood === "twirl" ? THREE.MathUtils.smootherstep(s.t / s.dur, 0, 1) * Math.PI * 2 : ib.rotation.x * (1 - k(10));
    ib.position.y = giggle ? Math.abs(Math.sin(t * 16)) * 0.025 : ib.position.y * (1 - k(10));
    ib.rotation.z += ((mood === "sleepy" ? -0.14 : mood === "surprised" ? 0.12 : 0) - ib.rotation.z) * k(6);

    // cloth + hair flutter with flight speed
    const fl = 0.6 + speed.current * 0.6;
    cape.current.rotation.z = -0.55 - Math.sin(t * 7.5) * 0.12 * fl;
    cape.current.rotation.x = Math.sin(t * 5.1) * 0.08 * fl;
    hatTip.current.rotation.z = 0.55 + Math.sin(t * 3.2) * 0.2;
    hair.current.rotation.z = Math.sin(t * 5) * 0.05 * fl;
    legs.current.rotation.z = Math.sin(t * 2.4) * 0.14;
    bucket.current.rotation.x = Math.sin(t * 2.1) * 0.25;

    // speech bubble rides above her (outside the rotating group so it stays upright)
    bub.current.position.set(r.position.x, r.position.y + 0.62 * r.scale.x, r.position.z);
  });

  return (
    <>
      <Trail src={root} />
      <group ref={bub}><Bubble text={say} scale={0.2} /></group>
      <group ref={root} scale={scale} {...bind} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
        <mesh position={[0.05, 0.2, 0]}><sphereGeometry args={[0.55, 8, 6]} /><meshBasicMaterial visible={false} /></mesh>
        {/* broomstick with bound straw bristles */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.02, 0, 0]}><cylinderGeometry args={[0.018, 0.016, 0.98, 7]} /><M c={WOOD} flatShading /></mesh>
        <mesh position={[0.52, 0, 0]}><sphereGeometry args={[0.024, 7, 5]} /><M c={WOOD} flatShading /></mesh>
        {[-0.44, -0.49].map((x, i) => <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}><cylinderGeometry args={[0.034, 0.034, 0.025, 8]} /><M c={i ? CLOAK : BAND} /></mesh>)}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.63, 0, 0]}><coneGeometry args={[0.11, 0.28, 9]} /><M c={STRAW} flatShading /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={"s" + i} position={[-0.74, Math.sin(a) * 0.075, Math.cos(a) * 0.075]} rotation={[a, 0, Math.PI / 2 + Math.sin(a) * 0.15]}><cylinderGeometry args={[0.006, 0.003, 0.12, 3]} /><M c="#c8933e" /></mesh>; })}
        <Sparkles position={[-0.85, 0, 0]} count={40} scale={[0.8, 0.35, 0.35]} size={3} speed={0.7} color="#ffd27a" opacity={0.9} />
        {/* trick-or-treat pumpkin pail swinging from the broom */}
        <group ref={bucket} position={[0.36, -0.01, 0]}>
          <mesh position={[0, -0.04, 0]}><torusGeometry args={[0.035, 0.004, 4, 10, Math.PI]} /><M c="#1c1b1e" /></mesh>
          <mesh position={[0, -0.09, 0]} scale={[1, 0.85, 1]}><sphereGeometry args={[0.045, 10, 8]} /><M c={BAND} emissive="#c25934" emissiveIntensity={0.25} /></mesh>
          {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.015, -0.082, 0.042]}><boxGeometry args={[0.012, 0.012, 0.004]} /><meshBasicMaterial color={GOLD} /></mesh>)}
          <mesh position={[0, -0.105, 0.04]}><boxGeometry args={[0.03, 0.007, 0.004]} /><meshBasicMaterial color={GOLD} /></mesh>
        </group>

        <group ref={inner}>
          {/* legs: striped stockings + curly-toed boots, kicking gently */}
          <group ref={legs} position={[0.1, 0.0, 0]}>
            {[0.05, -0.04].map((z, i) => (
              <group key={i} position={[0, -0.06, z]}>
                <mesh><cylinderGeometry args={[0.02, 0.019, 0.12, 7]} /><M c="#2a1a2a" /></mesh>
                {[0.035, 0.0, -0.035].map((y, j) => <mesh key={j} position={[0, y, 0]}><cylinderGeometry args={[0.021, 0.021, 0.014, 7]} /><M c={BAND} /></mesh>)}
                <mesh position={[0.022, -0.07, 0]} scale={[1.6, 0.8, 1]}><sphereGeometry args={[0.028, 7, 5]} /><M c="#1e1418" flatShading /></mesh>
                <mesh position={[0.065, -0.058, 0]} rotation={[0, 0, 0.9]}><coneGeometry args={[0.012, 0.04, 5]} /><M c="#1e1418" /></mesh>
              </group>
            ))}
          </group>
          {/* dress + cloak */}
          <mesh position={[0.08, 0.13, 0]}><coneGeometry args={[0.16, 0.3, 10]} /><M c={CLOAK} flatShading /></mesh>
          <mesh position={[0.08, 0.0, 0]} rotation={[Math.PI, 0, 0]}><cylinderGeometry args={[0.165, 0.17, 0.025, 10, 1, true]} /><M c={BAND} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0.08, 0.17, 0.0]}><cylinderGeometry args={[0.105, 0.115, 0.02, 10]} /><M c="#1c1b1e" /></mesh>
          <mesh position={[0.08, 0.17, 0.11]}><boxGeometry args={[0.028, 0.026, 0.008]} /><M c={GOLD} metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0.08, 0.27, 0]}><torusGeometry args={[0.06, 0.02, 6, 12]} /><M c={CLOAK_DARK} /></mesh>
          <mesh position={[0.08, 0.26, 0.07]}><sphereGeometry args={[0.012, 6, 5]} /><M c={GOLD} emissive="#ffb84a" emissiveIntensity={0.6} /></mesh>
          {/* fluttering cape */}
          <group ref={cape} position={[0.04, 0.28, -0.04]}>
            <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.012, 0.3, 0.26]} /><M c={CLOAK_DARK} flatShading /></mesh>
            <mesh position={[0.007, -0.15, 0]}><boxGeometry args={[0.004, 0.28, 0.24]} /><M c={LINING} /></mesh>
          </group>
          {/* arms: left holds the broom, right waves */}
          <group position={[0.08, 0.25, -0.08]} rotation={[0, 0, 0.75]}>
            <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.022, 0.027, 0.2, 7]} /><M c={CLOAK} flatShading /></mesh>
            <mesh position={[0, -0.22, 0]}><sphereGeometry args={[0.025, 7, 5]} /><M c={SKIN} /></mesh>
          </group>
          <group ref={armR} position={[0.08, 0.25, 0.08]} rotation={[0, 0, 0.75]}>
            <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.022, 0.027, 0.2, 7]} /><M c={CLOAK} flatShading /></mesh>
            <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.029, 0.029, 0.02, 7]} /><M c={BAND} /></mesh>
            <mesh position={[0, -0.23, 0]}><sphereGeometry args={[0.025, 7, 5]} /><M c={SKIN} /></mesh>
          </group>
          {/* head */}
          <group position={[0.08, 0.41, 0]}>
            <mesh><sphereGeometry args={[0.13, 18, 14]} /><M c={SKIN} roughness={0.8} /></mesh>
            <mesh position={[0, -0.028, 0.128]}><sphereGeometry args={[0.009, 6, 5]} /><M c={SKIN_SH} /></mesh>
            {[-1, 1].map((sd) => <mesh key={"ear" + sd} position={[sd * 0.128, -0.02, 0]}><sphereGeometry args={[0.022, 7, 5]} /><M c={SKIN} /></mesh>)}
            {[-1, 1].map((sd) => <mesh key={"ring" + sd} position={[sd * 0.132, -0.05, 0.005]}><sphereGeometry args={[0.009, 6, 5]} /><M c={BAND} emissive={BAND} emissiveIntensity={0.4} /></mesh>)}
            {/* hair: cap, fringe, shoulder-length sides and back, gently swaying */}
            <group ref={hair}>
              <mesh position={[0, 0.01, -0.025]} scale={[1, 1, 0.95]}><sphereGeometry args={[0.138, 16, 12]} /><M c={HAIR} roughness={0.55} /></mesh>
              <mesh position={[0, 0.07, 0.02]} scale={[1, 0.55, 0.9]}><sphereGeometry args={[0.135, 16, 10]} /><M c={HAIR} roughness={0.55} /></mesh>
              {[-0.06, 0, 0.06].map((x, i) => <mesh key={"f" + i} position={[x, 0.05, 0.118]} rotation={[0.4, 0, -x * 4]} scale={[1, 1, 0.5]}><coneGeometry args={[0.032, 0.06, 5]} /><M c={HAIR} /></mesh>)}
              {[0.118, -0.118].map((x, i) => <mesh key={i} position={[x, -0.085, -0.01]}><capsuleGeometry args={[0.045, 0.13, 4, 8]} /><M c={HAIR} roughness={0.55} /></mesh>)}
              <mesh position={[0, -0.095, -0.07]}><capsuleGeometry args={[0.095, 0.09, 4, 8]} /><M c={HAIR} roughness={0.55} /></mesh>
              {[0.12, -0.12].map((x, i) => <mesh key={"tip" + i} position={[x * 1.05, -0.17, 0.0]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}><coneGeometry args={[0.03, 0.05, 5]} /><M c={HAIR} /></mesh>)}
            </group>
            {/* eyes (with sparkle highlights) */}
            <group ref={eyes}>
              {[0.048, -0.048].map((x, i) => (
                <group key={i} ref={i ? eyeR : eyeL} position={[x, -0.01, 0.118]}>
                  <mesh scale={[1, 1.3, 0.5]}><sphereGeometry args={[0.021, 10, 8]} /><meshStandardMaterial color={INK} roughness={0.3} /></mesh>
                  <mesh position={[0, -0.006, 0.006]} scale={[1, 0.8, 0.4]}><sphereGeometry args={[0.013, 8, 6]} /><meshStandardMaterial color="#6a3a7a" roughness={0.3} /></mesh>
                  <mesh position={[-0.007, 0.01, 0.011]}><sphereGeometry args={[0.0065, 6, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>
                  <mesh position={[0.006, -0.008, 0.011]}><sphereGeometry args={[0.003, 5, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>
                </group>
              ))}
            </group>
            <group ref={happyEyes} visible={false}>
              {[0.048, -0.048].map((x, i) => <mesh key={i} position={[x, -0.015, 0.123]}><torusGeometry args={[0.016, 0.004, 4, 10, Math.PI]} /><meshStandardMaterial color={INK} /></mesh>)}
            </group>
            <group ref={brows}>
              {[0.05, -0.05].map((x, i) => <mesh key={i} position={[x, 0.032, 0.122]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><boxGeometry args={[0.03, 0.006, 0.004]} /><meshStandardMaterial color={HAIR} /></mesh>)}
            </group>
            {[0.048, -0.048].map((x, i) => <mesh key={"ch" + i} position={[x * 1.65, -0.048, 0.1]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.022, 7, 5]} /><meshStandardMaterial color="#e98a8a" transparent opacity={0.7} /></mesh>)}
            <mesh ref={smile} position={[0, -0.052, 0.122]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.019, 0.0045, 4, 10, Math.PI]} /><meshStandardMaterial color="#7b2d42" /></mesh>
            <mesh ref={mouthO} visible={false} position={[0, -0.058, 0.121]}><circleGeometry args={[0.013, 12]} /><meshStandardMaterial color="#5a1a2c" /></mesh>
            {/* witch hat: brim, orange band, buckle, floppy tip with a star */}
            <group position={[0, 0.11, -0.01]} rotation={[-0.08, 0, 0.12]}>
              <mesh><cylinderGeometry args={[0.22, 0.22, 0.016, 18]} /><M c={CLOAK_DARK} flatShading /></mesh>
              <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.118, 0.12, 0.04, 14]} /><M c={BAND} /></mesh>
              <mesh position={[0, 0.03, 0.12]}><boxGeometry args={[0.038, 0.036, 0.008]} /><M c={GOLD} emissive="#ffb84a" emissiveIntensity={0.6} metalness={0.5} /></mesh>
              <mesh position={[0, 0.03, 0.125]}><boxGeometry args={[0.02, 0.018, 0.006]} /><M c={BAND} /></mesh>
              <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.055, 0.115, 0.2, 12]} /><M c={CLOAK} flatShading /></mesh>
              <group ref={hatTip} position={[0, 0.245, 0]} rotation={[0, 0, 0.55]}>
                <mesh position={[0, 0.06, 0]}><coneGeometry args={[0.055, 0.15, 10]} /><M c={CLOAK} flatShading /></mesh>
                <mesh position={[0, 0.14, 0]}><octahedronGeometry args={[0.022, 0]} /><M c={GOLD} emissive="#ffd27a" emissiveIntensity={1.4} toneMapped={false} /></mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
