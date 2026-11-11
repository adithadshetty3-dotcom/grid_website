# GRID Timeline pilot

This is an isolated React + Vite pilot for the GRID Timeline section only. It does not create a separate GRID website and does not modify other groups' pages.

## Run locally

Use Node.js 20.19+ or 22.12+ for the current Vite 8 toolchain. Check your installed version with `node -v`.

From the repository root on macOS, Linux, Windows PowerShell or Git Bash:

```bash
cd react-pilot
npm install
npm run dev
```

The dev server binds to `0.0.0.0` so another device on the **same trusted Wi-Fi network** can open the preview. Open the `Network` URL printed by Vite on your phone (for example `http://192.168.1.20:5173/`). If Vite does not print it, get your Mac's Wi-Fi IP with `ipconfig getifaddr en0` and open `http://<MAC-IP>:5173/` on the phone. Do not use `localhost` on the phone: that points to the phone itself. This is a temporary development preview, not a public deployment; keep it on a trusted network and stop it with `Ctrl+C` when finished. If it still cannot connect, make sure both devices are on the same Wi-Fi and macOS Firewall is not blocking incoming connections for Node/Vite.

To verify a production build:

```bash
npm run build
npm test
```

The pilot imports the repository-root `style.css` from `src/main.jsx`. Keep this folder inside the GRID repository so that shared stylesheet path continues to resolve.

## Timeline preview features

- Chronological milestones grouped by year.
- Year and category filters.
- Click a milestone card to open its full details and photo gallery.
- Use **Admin preview** to add, edit and delete milestones.
- The date field supplies the month and year automatically; time is optional.
- Multiple photos can be selected (up to 8 raster images, 10 MB each and 40 MB combined). SVG and unsupported formats are rejected.
- Form validation checks real calendar dates, time format, supported category, required descriptions, text limits and photo limits.
- A successful delete can be undone until another milestone is saved or the page is refreshed.
- The event-detail dialog traps keyboard focus and returns focus to the triggering element when it closes.

## Separate Timeline Admin API foundation

An isolated Flask backend is available in [`backend/`](backend/README.md). The Timeline-only admin uses backend authentication and milestone APIs, and public rendering merges published API milestones with the existing read-only IndexedDB records. IndexedDB records and Blob photos remain preserved locally; administrators can review and explicitly import them. Page configuration still uses localStorage. Follow the backend guide to create a Python virtual environment, configure the API secret, apply SQLite migrations, create an initial admin, and run backend tests.

## Validation tests

The milestone validation rules use Node's built-in test runner; no extra test dependency is needed:

```bash
npm test
```

## Important prototype limitations

- **Admin preview is not authentication.** The visible switch is deliberately a UI-review control. Before deployment, replace it with the main website's verified admin permission check.
- **Storage is browser-local.** Milestones and image Blobs use IndexedDB on the current browser/device. This is not a shared database and changes will not appear to other visitors. Replace `src/timelineRepository.js` with the team's approved API integration before public use.
- Seeded cards are labelled `DEMO CONTENT`. Remove them and add only milestones, dates, details and images verified by the GRID team.
- Timeline milestones are a curated history, not the separate Event Archive.

## Required Git handoff check

From the repository root, enable the checked-in hook once per local clone:

```bash
git config core.hooksPath .githooks
```

On macOS/Linux/Git Bash, also make the hook executable if needed:

```bash
chmod +x .githooks/pre-commit
```

Every commit must include an updated and staged root-level `AI_HANDOFF.md`. The hook blocks the commit if that file is not staged. Windows contributors can use Git Bash for the hook setup command if PowerShell does not preserve the executable bit.
