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

Local development: `npm install && npm run dev`.
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

## Package differences from the authoring sandbox

| Concern | Sandbox | This package |
| --- | --- | --- |
| Ledger | Prisma + SQLite | In-memory, mirrored to logs |
| Build output | Standalone server | Vercel-native (auto-detected) |
| Copy guards | Inert (dev mode) | Active (production) |

Everything else is byte-identical to the verified build.
