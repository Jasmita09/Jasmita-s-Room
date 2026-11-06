// Frame-rate cap (keeps laptops cool). Rendering also pauses entirely while the tab is hidden.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
export const FPS_OPTIONS = [[60, "Smooth · 60 fps"], [30, "Cool · 30 fps"], [15, "Battery saver · 15 fps"]];
let fps = (() => { try { const v = +localStorage.getItem("cpn-fps"); return [60, 30, 15].includes(v) ? v : 60; } catch { return 60; } })();
const subs = new Set();
export const getFps = () => fps;
export const onFps = (f) => { subs.add(f); return () => subs.delete(f); };
export function setFps(v) { fps = v; try { localStorage.setItem("cpn-fps", v); } catch {} subs.forEach((f) => f(v)); }
export function FrameDriver() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf, last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (t - last >= 1000 / fps - 3) { last = t; invalidate(); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);
  return null;
}
export const hasWebGL = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };
export const isTouch = () => typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820);
