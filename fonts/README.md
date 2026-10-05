# Fonts

**Special Elite** (`SpecialElite-Regular.woff2`), (c) 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI),
licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0). Converted from the
original TTF to WOFF2 with no other changes. Used for the title, labels and buttons; it has a single weight, so the CSS sets
`font-synthesis: none` to avoid fake bold.

Only freely licensed fonts belong here, because this repository is public. Commercial fonts need a web-font
licence and should not be committed.

## Sabon Next LT (licensed, not in the repo)

Tagline and consent text use **Sabon Next LT** (Monotype). It is a commercial font, so `fonts/SabonNextLT.woff2`
is git-ignored and must be uploaded to the server's `/arcade/fonts/` folder by hand, under your web-font licence.
Without the file the hub falls back to Special Elite, so nothing breaks. If your licence allows publishing the file
in a public repository, remove the line from `.gitignore` and commit it.
