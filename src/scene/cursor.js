import React, { useEffect, useMemo, useState } from "react";

// Shared hover state: pointer cursor + a small label that follows the mouse (no drei <Html> needed).
const hovered = new Map();
const subs = new Set();
let n = 0;
function apply(id, on, label) {
  if (on) hovered.set(id, label || ""); else hovered.delete(id);
  document.body.style.cursor = hovered.size ? "pointer" : "auto";
  const labels = [...hovered.values()].filter(Boolean);
  const text = labels.length ? labels[labels.length - 1] : "";
  subs.forEach((f) => f(text));
}
export function useHover(enabled = true, label = "") {
  const id = useMemo(() => "h" + n++, []);
  const [h, setH] = useState(false);
  useEffect(() => { apply(id, h && enabled, label); }, [h, enabled, id, label]);
  useEffect(() => () => apply(id, false), [id]);
  const bind = useMemo(() => ({
    onPointerOver: (e) => { e.stopPropagation(); setH(true); },
    onPointerOut: () => setH(false)
  }), []);
  return [h, bind];
}
export function CursorTag() {
  const [text, setText] = useState("");
  const [pos, setPos] = useState([0, 0]);
  useEffect(() => {
    subs.add(setText);
    const mv = (e) => setPos([e.clientX, e.clientY]);
    window.addEventListener("pointermove", mv);
    return () => { subs.delete(setText); window.removeEventListener("pointermove", mv); };
  }, []);
  if (!text) return null;
  return React.createElement("div", { className: "scene-tag cursor-tag", style: { left: pos[0], top: pos[1] } }, text);
}
