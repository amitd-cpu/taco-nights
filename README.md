# Taco Nights

A browser game in the spirit of the Israeli classic "מלך הפלאפל" (Falafel King), rebuilt from
scratch as a late-night taco stand parked outside the bars on Main Street. 20 levels, three
languages (English / Español / עברית), no dependencies, works offline, installs on a phone.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole game. Self-hosted / installable version. |
| `manifest.webmanifest`, `sw.js`, `icon*.{svg,png}` | Phone-app (PWA) files: home-screen install, fullscreen landscape, offline cache. |
| `build_artifact.py` → `dist/taco-nights.html` | The copy published to claude.ai as the share link (the Artifact host adds its own page wrapper and cannot run service workers, so this strips those lines). Re-run after editing `index.html`, then republish. |

## Run it

Double-click `index.html`, or serve the folder (needed for the phone-app features):

```
python -m http.server 8788 --directory taco-stand
```

then open http://localhost:8788. From the Games folder, `.claude/launch.json` already has this
server configured for the Claude desktop preview.

## Phone app

Host the folder on any static HTTPS site (GitHub Pages, Netlify, a Cloud Run bucket, …) and open
it on the phone. Android Chrome offers "Install app"; on iPhone use Share → "Add to Home Screen".
The installed app opens fullscreen in landscape and keeps working offline. The game is designed
for landscape; in portrait it shows a "turn your phone sideways" screen. On a phone-sized
landscape viewport (wider than 1.6:1 and under 600 px tall) the game switches to a compact
layout: a shorter street with smaller customers so the counter and its tap targets get about a
quarter more screen. The ⛶ button in the HUD
requests fullscreen in browsers that allow it.

The claude.ai share link also works on a phone (landscape), but installs only as a bookmark,
not as an offline app.

## Leaderboard

Players enter a name when they finish a level; the game then posts each cleared level (level,
earnings, stars) and the Leaderboard screen ranks players by the sum of their best earnings per
level. The shared store is a Google Sheet behind a Google Apps Script web app, which is free and
needs no server. Follow the four setup steps at the top of `leaderboard/Code.gs` (create a sheet,
paste the script, deploy as web app for "Anyone", paste the `/exec` URL into `LEADERBOARD_URL`
in `index.html`). Until the URL is set, the board shows the player's own device only and says so.

Players are identified by a random id stored in their browser, so renaming keeps their history.
Names are capped at 20 characters and stripped of angle brackets both in the game and in the
script; numbers are clamped server-side.

## How it plays

- Customers arrive with a speech bubble: tortilla, meat and how many scoops, toppings, and the
  price. Their patience bar drains while they wait; faces go from happy to furious.
- **Plancha**: click a meat bin (carne asada, al pastor, pollo) to drop a portion on the plancha
  (4 slots). Raw for 3 s, then ready (golden), then charred. The ready window shrinks from 7 s at
  level 1 to 3.5 s at level 20. Charred meat must be clicked away (-$1).
- **Build**: take a tortilla (corn / flour / crunchy), then click ready meat and toppings. The
  taco glows green and rings when it exactly matches a waiting customer; it turns red when no
  customer's order can still be satisfied. Trash costs the ingredients.
- **Serve**: click the matching customer. Faster service = bigger tip (up to $4).
- **Toppings**: onion-cilantro, salsa verde, queso, pico de gallo, guacamole, jalapeño,
  introduced in that order across the levels. Six big tiles so they are easy to tap on a phone
  (salsa roja, crema and lime are still drawn in `ICON` if you want them back in `TOPS`). Trays hold 8; the prep cook
  restocks in 2.5 s. From level 3 flies land on trays: a buzzing tray is unusable and after 8 s
  they spoil its stock. The fan shoos them.
- **Speaker**: every $40 earned grants a song (max 3). It tops up patience and pauses arrivals
  for 6 s.
- **Levels and progress**: each level is a timed shift (90 s at level 1, growing to 150 s) with
  a cash goal shown in the HUD; the earnings
  pill fills up as you make money. Reaching the goal unlocks the next level and shows a banner:
  keep serving for more stars, or tap it (or Enter) to finish. Stars per level: ★ = goal,
  ★★ = 1.5× goal, ★★★ = 2× goal. Three customers leaving angry ends the level with no stars.
  Progress (unlocked level, stars, best score) is saved in the browser.
- Space pauses, M mutes.

## The 20 levels

Everything moves monotonically with the level number in `levelCfg(n)`:

| | Level 1 | Level 10 | Level 20 |
|---|---|---|---|
| Toppings on the menu | 2 | 4 | 6 |
| Toppings per order | 1 | 2–3 | 3–4 |
| Meats / scoops | asada, 1 | asada + pastor, 2 | all three, up to 3 |
| Tortillas | corn | corn, flour | all three |
| Customers at once | 2 | 4 | 4 |
| Shift length | 90 s | 118 s | 150 s |
| Arrival every | 5.5 s | ~4.3 s | 3 s |
| Patience | 30 s | ~23 s | 16 s |
| Cash goal | $90 | $283 | $611 |

About 1 in 20 guests orders meat only; everyone else wants toppings.

## Tuning

Balance lives at the top of the script in `index.html`: `levelCfg(n)`, `RAW_T`, `MAX_STOCK`,
`TOKEN_EVERY`, prices in `ING` and `BREAD`, star thresholds in `starsFor`. Strings for all three
languages are in `STR`. `window.TacoNights` exposes `step(seconds)`, `startDay(n)` and
`snapshot()` for testing from the console.
