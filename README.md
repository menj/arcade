# Arcade

The hub page for **menj.buzz/arcade/** — a card grid of small browser games.
Static HTML/CSS/JS, no build step, no backend.

## Structure

```
index.html        page shell (settings dialog included)
games.json        site info + the list of games
css/hub.css       layout and colour schemes (CSS variables)
js/theme.js       applies saved theme before first paint
js/hub.js         builds the grid, filters, search, settings dialog
img/              favicon, share image, card thumbnails (img/cards/<slug>.png)
requirements/     YAML briefs for the games (requirements/pixel-run.yml)
```

Games live in their own folders next to this one (`/arcade/<slug>/`): `beberd/` and `pixel-run/`.

## Adding a game

1. Put the game in `/arcade/<slug>/` (it should ship a `game.json`).
2. Add an entry to `games.json`:

```json
{ "id": "pixel-run", "title": "Pixel Run", "status": "live", "path": "pixel-run/",
  "category": "Runners", "tagline": "…", "badges": ["…"], "thumbnail": "img/cards/pixel-run.png" }
```

Use `"status": "soon"` for a placeholder tile. The hub fetches `<path>game.json` and
lets its `title`, `tagline`, `badges` and `thumbnail` override the entry above, so a
game can keep its own blurb current. If that file is missing, the `games.json` data is used.
Category filter tabs appear automatically once there are two or more categories.
A game's `game.json` can also supply `summary`, `tags` and `features` (shown as badges when
there is no `badges` list). Tags become chips and, with the title, tagline and summary, feed
the search box. Paths in `game.json` (thumbnail etc.) are relative to the game's folder.

## Best scores

Games write to one shared `localStorage` key, `arcade.stats`:

```json
{ "<game id>": { "best": 1234, "plays": 5, "last": 900, "lastPlayed": 1700000000000 } }
```

The hub shows `best` (and `plays`) on the card. Games only write their own entry and never
record god-mode runs. Games also share the player's display name under `arcade_name`.
`requirements/pixel-run.yml` lists what Pixel Run needs to work fully alongside Beberd.

## Themes and settings

Settings (gear icon) are tabbed: **Appearance** (Auto, Midnight, Daylight, Ocean, Sunset)
and **Accessibility** (reduce motion, larger text). Saved under `arcade.hub.settings`.
Add a scheme by defining a `[data-theme="name"]` block in `css/hub.css` and listing it in
`SCHEMES` in `js/hub.js`.

## Hosting

Serve the folder over HTTP (opening `index.html` from disk can't fetch `games.json`).
Make sure `/arcade` redirects to `/arcade/` so relative paths resolve.

- Apache: default `DirectoryIndex` handles it.
- nginx: `location = /arcade { return 301 /arcade/; }`

Before launch, set an absolute `og:image` URL in `index.html` and fill `site.tipUrl` in `games.json` if wanted.
