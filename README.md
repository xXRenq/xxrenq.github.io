# xXRenq

Personal site: link hub, tools, projects, and games, built with React, TypeScript, Tailwind CSS, and React Router.

## Development

```
npm install
npm run dev
```

## Production build

```
npm run build
```

Outputs a standard multi-file build to `dist/`, ready to deploy to any static host (GitHub Pages, Vercel, Netlify).

## Single-file preview build

```
npm run build:preview
```

Outputs a single self-contained `dist-preview/index.html` with all JS and CSS inlined. Useful for quick sharing or sandboxed previews.

## Editing your info

All identity, social links, projects, and games content lives in one place: `src/data/site.ts`. Update the values there, no need to touch any components.

## Steam Points Converter

`src/components/SteamPointsConverter.tsx` implements the converter. It uses the fixed Steam rate of 100 points per US dollar, then applies a live exchange rate fetched from a free public API (`src/lib/exchangeRates.ts`), with a cached and fallback-rate path if the request fails.

## Structure

```
src/
  components/   reusable UI building blocks
  pages/        one file per route
  data/         site content and config
  lib/          currency conversion and small utilities
```
