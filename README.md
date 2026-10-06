# Arcade

The hub page for **menj.buzz/arcade/** — a card grid of small browser games.
Static HTML/CSS/JS, no build step, no backend.

## Structure

```
index.html        page shell (settings dialog included)
games.json        site info + the list of games
css/hub.css       retro-neon layout and colour schemes (CSS variables)
js/theme.js       applies saved theme before first paint
js/hub.js         builds the card row and the settings dialog
js/ads.js         Google AdSense: consent, lazy-loaded ad slots (off by default)
css/ads.css       ad boxes and the consent bar
fonts/            Special Elite (WOFF2), see fonts/README.md
img/              favicon, share image, card thumbnails (img/cards/<slug>.png)
build/            ai-discovery.mjs + ai-data.json: writes the AI discovery files (optional, run by hand)
requirements/     YAML briefs for the games (requirements/pixel-run.yml)
```

Games live in their own folders next to this one (`/arcade/<slug>/`): `beberd/` and `pixel-run/`.

## Adding a game

1. Put the game in `/arcade/<slug>/` (it should ship a `game.json`).
2. Add an entry to `games.json`:

```json
{ "id": "pixel-run", "title": "Pixel Run", "status": "live", "path": "pixel-run/",
  "tagline": "…", "thumbnail": "img/cards/pixel-run.png" }
```

Use `"status": "soon"` for a placeholder tile.
The heading text (eyebrow, title, tagline) comes from `site` in `games.json`. The hub fetches `<path>game.json` and lets its `title`, `tagline` and `thumbnail` override
the entry above, so a game can keep its own blurb current. If that file is missing, the
`games.json` data is used. Each card shows the title, thumbnail, tagline and a Play link.
Tags, badges, categories and search are not used. Paths in `game.json` (thumbnail etc.) are
relative to the game's folder.

## Best scores

Games write to one shared `localStorage` key, `arcade.stats`:

```json
{ "<game id>": { "best": 1234, "plays": 5, "last": 900, "lastPlayed": 1700000000000 } }
```

The hub shows `best` (and `plays`) on the card. Games only write their own entry and never
record god-mode runs. Games also share the player's display name under `arcade_name`.
`requirements/pixel-run.yml` lists what Pixel Run needs to work fully alongside Beberd.

## Themes and settings

Settings (gear icon) are tabbed: **Appearance** (Auto, Midnight, Daylight, Ocean, Sunset, Minimal)
and **Accessibility** (reduce motion, larger text). Saved under `arcade.hub.settings`.
Add a scheme by defining a `[data-theme="name"]` block in `css/hub.css` and listing it in
`SCHEMES` in `js/hub.js`.

## Ads (Google AdSense)

Off by default. To switch on, edit the `ads` block in `games.json`:

```json
"ads": { "enabled": true, "client": "ca-pub-0000000000000000",
         "slots": { "banner": { "id": "1234567890", "enabled": true },
                    "card":   { "id": "2345678901", "enabled": true } } }
```

- `client` is your AdSense publisher ID; each slot `id` is an ad unit ID from AdSense. A slot with no valid ID is skipped, and `"enabled": false` turns a slot off.
- Slots: `card` is a "Sponsored" tile at the end of the card row; `banner` sits below it.
- Nothing is requested from Google until the visitor taps **Allow ads** in the consent bar. Their choice is saved on their device and can be changed under Settings > Privacy. Ads load lazily, in boxes with a reserved height so the page does not jump.
- If you have visitors in the EEA, UK or Switzerland, AdSense requires a Google-certified consent platform (e.g. Funding Choices in your AdSense account). The built-in bar is a simple opt-in and does not replace one.
- Put `ads.txt` at the domain root (`https://menj.buzz/ads.txt`), not in this repo: `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`.
- Each game is its own repo and manages its own ad slots; the hub never controls them.

## Hosting

Serve the folder over HTTP (opening `index.html` from disk can't fetch `games.json`).
Make sure `/arcade` redirects to `/arcade/` so relative paths resolve.

- Apache: default `DirectoryIndex` handles it.
- nginx: `location = /arcade { return 301 /arcade/; }`

Before launch, fill `site.tipUrl` in `games.json` if wanted.

## AI discovery files

`node build/ai-discovery.mjs` writes the ten AI Discovery Files (llms.txt, llm.txt, llms.html, ai.txt, ai.json, identity.json, brand.txt, faq-ai.txt, developer-ai.txt, robots-ai.txt, spec v2.2.2) into this folder, so they are served at `menj.buzz/arcade/`. Edit `build/ai-data.json` for policy, FAQs and crawlers; live games are read from `games.json`. Re-run after adding a game and commit the output. The hub itself still has no build step.
