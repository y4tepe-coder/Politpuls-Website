# Politpuls — Website

Die Web-Version von **Politpuls** — politische Bildung als tägliches
Entscheidungs-Spiel. Eine schön animierte Landing-Page, die erklärt,
worum es geht, plus die komplette spielbare App direkt im Browser.

> Live (GitHub Pages): _wird nach erstem Deploy verlinkt_.

## Was ist drin

- **`/`** — Landing-Page mit Animationen: Hero, Modi (100 Tage Kanzler:in,
  Tagesmission, Wahlkampf), Loop-Erklärung, 100-Tage-Grid, CTA.
- **`/play`** — das vollständige Spiel: Splash → Onboarding → Home →
  Tagesmission/Wahlkampf/100 Tage Kanzler:in. State in `localStorage`,
  kein Backend nötig.

## Stack

- Next.js 15 (App Router, static export) · React 19 · TypeScript
- Framer Motion (Animationen) · Tailwind CSS + CSS-Variablen
- Hosting: GitHub Pages (statisch, via GitHub Action)

## Lokal starten

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # baut statisch nach out/
```

## Deploy

Push auf `main` → GitHub Action `pages.yml` baut und deployt
automatisch nach GitHub Pages. Nach dem ersten Deploy einmal
**Settings → Pages → Source: GitHub Actions** aktivieren.

Der `basePath` ist auf `/Politpuls-Website` gesetzt (siehe
`next.config.mjs`). Bei Custom Domain dort entfernen.

## Verwandte Repos

- iOS-App + Redaktions-Pipeline: [`y4tepe-coder/Politpuls-iOS`](https://github.com/y4tepe-coder/Politpuls-iOS)
