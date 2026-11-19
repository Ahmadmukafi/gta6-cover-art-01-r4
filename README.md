# VICE GRID — GTA VI Cover Maker

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/Ahmadmukafi/gta6-cover-art-01-r4/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/Ahmadmukafi/gta6-cover-art-01-r4/reward.svg)

Turn any photo and caption into a GTA VI-style multi-panel cover, offline in a
desktop browser. Photos never leave the machine.

## What it does

- **4-panel cover** — drag panels to swap photos, pan inside a photo to
  reframe it, scroll over a photo to zoom.
- **Grade slider** — one drag from golden hour to neon night; the same grade
  drives both the staged preview and the PNG export.
- **3 looks** — Sunset Strip, Neon Night, Heat Wave.
- **4 layouts** — 2 × 2 Grid, Hero + 3, Columns, Single.
- **Caption editing** — title and subtitle, drawn onto the cover.
- **PNG export** — 1080 × 1080, 1080 × 1350 or 1920 × 1080.
- **Keyboard shortcuts** — 1–4 switch layouts, L cycles looks, E exports.

## Try it

Serve `app/` with any static server and open `index.html`, for example:

```sh
cd app && python3 -m http.server 8080
```

then open http://localhost:8080. Add your own photo with "Add your photo",
or click a sample and then a panel to place it.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
[make.fun](https://make.fun) library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Competition: https://make.fun/bounty/gta6-cover-art-01
