# IBL Group · The Experience — Vercel deployment package

Production source of the redesigned IBL Group experience: cinematic
single-page site, live pulse with the bridge-mode fleet instrument,
scroll-scrubbed two-century timeline, newsroom, living constellation,
cluster chapters with self-inking engineering plates, network map,
people mosaic, investor room with the annual report builder, trust
center, knowledge desk (chatbot) and the signature custom cursor.

## Deploy on Vercel

**Option A · Git (recommended)**
1. Create a repository and push the contents of this folder (it already
   carries a `.gitignore`).
2. On vercel.com: *Add New → Project → Import* the repository.
3. Framework preset auto-detects **Next.js**. Leave every build setting
   at its default (`npm run build`). Deploy.
4. Attach a custom domain (e.g. iblgroup.com) in *Settings → Domains*.

**Option B · Vercel CLI**
```bash
npm i -g vercel
cd ibl-group-experience
vercel          # preview
vercel --prod   # production
```

No environment variables are required. Two optional behaviours:

- **Knowledge desk (chatbot):** the `/api/ask` route calls the
  z-ai SDK. Without credentials it degrades gracefully to the verified
  WhatsApp handoff message. Add the SDK's credentials as environment
  variables in *Settings → Environment Variables* to enable full
  answers.
- **Engagement ledger & incident reports:** the deployment package
  ships an in-memory ledger mirrored to server logs (see
  `src/lib/db.ts`). Read entries under *Observability → Logs*, or wire
  a real database there when you want persistence.

## Dependencies are pinned and install-verified

Every dependency is pinned to the exact version the experience was
built and verified against, and a `package-lock.json` ships with the
package, so Vercel installs the identical tree (`npm ci`) instead of
resolving fresh ranges. The install itself was verified against the
real npm registry and the package was production-built green
(`VERCEL=1 next build`) before shipping — the exact pipeline Vercel
runs.

Local development: `npm install && npm run dev`.
Exact verified install: `npm ci && npm run dev`.
Local production run: `VERCEL=1 npm run build && VERCEL=1 npm start`
(the `VERCEL` flag switches the config to its deployed posture).

## What the deployed build protects

The package is encoded so the experience cannot be saved, printed or
copied in any usable form:

- **No source maps.** `productionBrowserSourceMaps: false` and the
  platform's minified, mangled bundles mean the craft cannot be read
  back from the browser.
- **No selection, no context menu, no copy/cut, no image dragging.**
  Active in production builds only (the component is inert in dev).
- **Save / print / view-source / devtools shortcuts intercepted**
  (`Ctrl/Cmd + S, P, U`, `F12`, `Ctrl/Cmd + Shift + I/J/C`).
- **Printing returns a single copyright line.** The *Build my annual
  report* flow no longer prints at all: it assembles a true PDF file
  with jsPDF and hands it over as a download, so the browser's print
  pipeline (and the web address it stamps in its header) never touches
  the document. The file carries its own cover, running heads, page
  numbers and engraved figures: the eight-year dividend chart and the
  cluster revenue chart.
- **Saved copies refuse to run.** A page saved to disk and reopened
  from `file://` replaces itself with a copyright notice, and its
  bundles and assets no longer resolve locally anyway.
- **No embedding.** `X-Frame-Options: SAMEORIGIN` (set only on Vercel
  builds, so local previews are unaffected) blocks the experience
  being wrapped in someone else's page.
- **No archive copies.** `X-Robots-Tag: noarchive` plus robots.txt
  entries refusing `ia_archiver`, `archive.org_bot` and `ArchiveTeam`.
- **No fingerprint.** `poweredByHeader: false`, MIME sniffing blocked,
  strict referrer policy.

An honest limit: any website's rendered HTML is technically fetchable
with a command line, on this or any other site on the internet. What
these measures guarantee is that nothing usable can be *taken*: no
readable code, no selectable content, no printable pages, no savable
copy, no embeddable mirror.

## The dark grades are IBL navy

Both dark grades carry the brand's ink-navy identity rather than a
generic black: the default abyss grade is a lifted midnight navy
field (#151b4a, unmistakably the #212979 family), and the OLED
"true night" grade is a navy-tinted near-black (#060a1e) that keeps
its power-saving depth without ever breaking the brand. Every dark
surface (hero veil, trust vault, ocean chart, movements board, pulse
photo shades, planet band) tracks the same navy family.

## The dark grades are a projected film

The night navy is graded, never a flat painted wall. Two fixed layers
(`body::before` / `body::after` in globals.css, "THE NIGHT GRADE
ATMOSPHERE") are painted below all content: a teal key light from
above, a plum counter-light rising toward the footer, an industrials
ember low-left, a vertical navy depth ladder, monochrome film grain
across the whole field, and a soft corner vignette. Where the browser
supports scroll-driven animation the stage lights recede as the page
descends (opacity 1 to 0.42), so the story opens key-lit and ends in
the small hours; every other browser keeps the static graded field.
Glass panels catch light on their top edge, OLED runs a quieter and
deeper cut of the same lighting, the ADHD profile drops the ambient
grain, print drops both layers, and the paper grades (light, sepia)
are untouched. No JavaScript was added - it is all CSS.

## Package differences from the authoring sandbox

| Concern | Sandbox | This package |
| --- | --- | --- |
| Ledger | Prisma + SQLite | In-memory, mirrored to logs |
| Build output | Standalone server | Vercel-native (auto-detected) |
| Copy guards | Inert (dev mode) | Active (production) |

Everything else is byte-identical to the verified build.
