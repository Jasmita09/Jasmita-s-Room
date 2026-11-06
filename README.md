# Cherri-Picked Notes 🍒

An interactive, cozy low-poly Halloween room that doubles as **Jasmita Iragam's** portfolio and digital notebook
(CS Honors · Georgia State University). The blog lives on a real HTML screen inside the 3D monitor.

**Tech stack:** Three.js · React Three Fiber · drei · Web Audio API · Vanilla JS
*Crafted with lots of coffee and a little help from Claude for the 3D math.*

## Features
- 100% procedural geometry (no GLTF models), pixelated post-process look
- Blog on the 3D monitor + desk view, full-screen reader, and a 2D reader (`?mode=reader`, auto-fallback without WebGL)
- Live sky from your clock (solar elevation math), rain & thunder, witching hour at midnight
- Procedural Web Audio music with swappable cassette tapes and an ambient soundboard
- Bookshelf reading cards, daily notebook quotes, ML tarot, steaming mug, desk drawer, corkboard guestbook,
  pumpkin carving, a black cat who chases yarn, and a room tour menu
- Frame-rate cap + pauses rendering when the tab is hidden

## Run locally
Requires Node 18+.
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Publish on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push.

## Writing a new dispatch (blog post)
Drop a Markdown file in `src/content/dispatches/` (e.g. `04-my-post.md`) with frontmatter like the existing ones.
Files are ordered by name. `npm run dev` / `npm run build` regenerate `src/data/dispatchesData.js` automatically —
don't edit that file by hand.

## Other content
- Bookshelf cards: `src/data/readingShelf.js`
- Daily notebook quotes: `src/data/journal.js`
- Tarot cards: `src/data/oracle.js`

## Shared guestbook, comments & newsletter (optional)
Everything works offline with `localStorage`. To make notes/comments shared across visitors:
1. Create a free Supabase project and run `src/backend/supabase.sql` in its SQL editor.
2. Put your project URL and **anon** key (never the service_role key) in `src/backend/config.js`.
3. For the newsletter, add your Buttondown username to the same file.

The anon key is designed to be public; the SQL file's row-level-security policies are what protect the data.
