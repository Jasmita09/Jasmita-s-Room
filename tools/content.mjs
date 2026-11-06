// Markdown content pipeline: src/content/dispatches/*.md  \u2192  src/data/dispatchesData.js
// Each file = frontmatter (key: value, nested with dots like tributeCard.label) + body paragraphs
// separated by blank lines. Files are ordered by name, so prefix them 01-, 02-, 03-\u2026
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
export function parseDispatch(src, file = "") {
  const m = src.replace(/\r/g, "").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("Missing frontmatter in " + file);
  const d = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":"); if (i < 0) throw new Error("Bad frontmatter line in " + file + ": " + line);
    const key = line.slice(0, i).trim(); let v = line.slice(i + 1).trim();
    if (/^".*"$/.test(v)) v = v.slice(1, -1);
    v = v === "true" ? true : v === "false" ? false : v.replace(/\\n/g, "\n");
    const [a, b] = key.split(".");
    if (b) (d[a] = d[a] || {})[b] = v; else d[a] = v;
  }
  const paras = m[2].split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  if (paras.length) d.paragraphs = paras;
  if (!d.id) throw new Error("Missing id in " + file);
  return d;
}
export function genContent(src) {
  const dir = src + "content/dispatches/";
  if (!existsSync(dir)) return null;
  const list = readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => parseDispatch(readFileSync(dir + f, "utf8"), f));
  writeFileSync(src + "data/dispatchesData.js", "// GENERATED from src/content/dispatches/*.md by tools/content.mjs. Edit the .md files, not this file.\nexport const DISPATCHES = " + JSON.stringify(list, null, 2) + ";\nexport default DISPATCHES;\n");
  return list;
}

// CLI: `node tools/content.mjs` regenerates src/data/dispatchesData.js (runs before dev/build).
import { fileURLToPath } from "url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const list = genContent("./src/");
  console.log(`content: ${list ? list.length : 0} dispatches -> src/data/dispatchesData.js`);
}
