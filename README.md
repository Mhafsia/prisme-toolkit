# WCST (MVP)

A minimal Wisconsin Card Sorting Test implemented as a web app (React + TypeScript + Vite). Runs on desktop and iPad. Includes deterministic rule engine, trial-by-trial logging, and CSV export.

## Quick start

```powershell
# From this folder
npm install
npm run dev
# To allow iPad on your LAN to access your PC dev server
# (replace with your PC's LAN IP; Vite prints it when using --host)
npm run dev -- --host
```

Then open the local URL shown in the terminal (e.g., `http://192.168.1.x:5173`) on your browser (PC or iPad).

## Features
- **Rules**: Color → Shape → Number, shift after 10 consecutive correct.
- **Deck**: All 64 combinations (4 colors × 4 shapes × 4 numbers), shuffled by seed.
- **Error types**: Perseverative vs non-perseverative; set-maintenance flag.
- **Metrics in CSV**: Trial index, correctness, error type, RT ms, rule in force, categories achieved, device info, seed, timestamps.
- **Determinism**: Seed captured per session; deck order is reproducible.
- **Audio**: Countdown beeps + optional correct/incorrect beeps (toggle "Son").

## Usage
1. Fill Participant ID (optional), Session ID, and Seed (auto-filled) and click "Démarrer".
2. Tap/click one of the four key cards to respond.
3. Feedback appears immediately (green/red).
4. End condition: 6 categories completed or 128 trials (configurable).
5. Click "Exporter CSV" to download trial-level data.

### Configurable trials
- In the header (gear icon), set "Max essais" to the number of trials you want for the session.

## Documentation
- 📖 **[MECHANICS.md](./MECHANICS.md)** (English) — Detailed game mechanics, error classification, scoring, and post-processing formulas.
- 📖 **[MECHANICS_FR.md](./MECHANICS_FR.md)** (Français) — Mécanique de jeu détaillée, classification des erreurs, calcul des scores et formules de post-traitement.

## Tech
- React 18, TypeScript 5, Vite 5

## iPad setup
- **Fastest (Dev)**: Run locally with `npm run dev -- --host`, then on iPad Safari open `http://<PC_LAN_IP>:5173`. Add to Home Screen for a full-screen experience.
- **Shareable**: Deploy to GitHub Pages (or Vercel/Netlify), open the URL on iPad, then "Add to Home Screen".
- **Kiosk**: The app is configured as a PWA (Progressive Web App). Once added to the Home Screen, it launches without an address bar. Use iOS Guided Access to lock the iPad to the app during testing.
