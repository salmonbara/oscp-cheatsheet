# OSCP Command Suggest

Static command suggestion UI generated from the OSCP Cheatsheet notes.

## Local Use

```sh
node scripts/build-data.mjs
python -m http.server 1234
```

Open `http://localhost:1234`.

On Windows PowerShell, `npm.ps1` may be blocked by execution policy. If you prefer npm scripts, use `npm.cmd run build:data` instead of `npm run build:data`.

## Data Flow

- Notes remain the source of truth in `../OSCP Cheatsheet`.
- `scripts/build-data.mjs` reads `_data/taxonomy.yml`, `_data/commands.yml`, and tagged markdown code blocks.
- Generated JSON is written to `data/taxonomy.json` and `data/commands.json`.
- Unavailable tags are disabled when adding them would produce zero matching command cards.

## GitHub Pages

This folder is static. For GitHub Pages, build data first, then publish the `oscp-web` directory as the Pages artifact.
