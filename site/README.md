# Aphelion Wiki Site

Astro Starlight site for Aphelion workflow documentation (Cloudflare Pages deployment TBD).

## Development

```bash
cd site
node ../scripts/sync-wiki.mjs  # sync wiki/*/*.md -> src/content/docs/*/*.md
npm run dev
```

Dev server starts at `http://localhost:4321`.

## Build

```bash
cd site
npm ci
node ../scripts/sync-wiki.mjs
npm run build
```

Output: `site/dist/`

## Cloudflare Pages

| Item | Value |
|------|-------|
| Framework preset | Astro |
| Build command | `cd site && npm ci && node ../scripts/sync-wiki.mjs && npm run build` |
| Build output directory | `site/dist` |
| Root directory | `/` (repo root) |
| Node.js version | 20 |

## Directory Structure

```
site/
├── astro.config.mjs         # i18n, logo, customCss configuration
├── package.json
├── tsconfig.json
├── public/                  # static assets (favicon, etc.)
└── src/
    ├── assets/
    │   └── logo.png         # copied from docs/images/aphelion-logo.png
    ├── content/
    │   ├── config.ts        # Starlight content collection definition
    │   └── docs/            # output target of sync-wiki.mjs
    │       ├── en/*.md      # synced from wiki/en/
    │       └── ja/*.md      # synced from wiki/ja/
    └── styles/
        └── custom.css       # logo-derived CSS variables (light/dark)
```

## Related

- Wiki SSOT: `../wiki/en/` and `../wiki/ja/`
- Sync script: `../scripts/sync-wiki.mjs` (created by developer phase)
- Logo source: `../docs/images/aphelion-logo.png`
