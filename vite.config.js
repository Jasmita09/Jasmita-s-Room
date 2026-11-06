import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, existsSync } from "fs";
import { parseDispatch } from "./tools/content.mjs";

// SEO: put a plain-HTML copy of every published essay (and JSON-LD) into index.html at build time.
// Search engines and no-JS readers see it; React replaces it once the 3D room loads.
const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function seo() {
  return {
    name: "cpn-seo",
    transformIndexHtml(html) {
      const dir = "./src/content/dispatches/";
      const list = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => parseDispatch(readFileSync(dir + f, "utf8"), f)).filter((d) => !d.isDraft) : [];
      const arts = list.map((d) => `<article id="${esc(d.id)}"><h2>${esc(d.title)}</h2><p><em>${esc(d.subtitle || d.deck)}</em></p><p>${esc(d.date)} · ${esc(d.location || "")}</p>${(d.paragraphs || []).map((x) => `<p>${esc(x)}</p>`).join("")}${d.closingText ? `<p>${esc(d.closingText)}</p>` : ""}</article>`).join("");
      const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Blog", name: "Cherri-Picked Notes", author: { "@type": "Person", name: "Jasmita Iragam" },
        blogPost: list.map((d) => ({ "@type": "BlogPosting", headline: d.title, description: d.subtitle, author: { "@type": "Person", name: "Jasmita Iragam" } })) }).replace(/</g, "\\u003c");
      return html
        .replace("<!--SEO_JSONLD-->", `<script type="application/ld+json">${ld}</script>`)
        .replace("<!--SEO_STATIC-->", `<main class="seo-static"><h1>Cherri-Picked Notes · Jasmita Iragam</h1><p>A notebook on data science research, mathematical models and college life at Georgia State University, presented as an interactive 3D room.</p>${arts}</main>`);
    }
  };
}

export default defineConfig({
  base: "./", // relative paths so it works on GitHub Pages under /<repo>/
  plugins: [react(), seo()],
  build: { chunkSizeWarningLimit: 2000 }
});
