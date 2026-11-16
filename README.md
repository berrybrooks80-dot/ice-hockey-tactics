# ICE-HOCKEY TACTICS — Position · Power Play · Penalty Kill

A static, single-page tactics playbook with animated tactic boards. Plain HTML5,
CSS3 and vanilla JavaScript — no build step, no framework, no backend.

Companion piece to the rules site, same design system, different palette: Pantone Classic Blue (#0F4C81) on deep dusk navy for the dark theme, warm paper for the light theme.

---

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site. Six anchored sections. |
| `css/style.css` | Design tokens, layout, components, theme overrides, responsive rules. |
| `js/tactics.js` | The tactic-board engine plus all 14 play definitions (PP, PK, forecheck, breakout, neutral zone, D-zone). |
| `js/ko.js` | Korean dictionary, keyed by the normalised English string. |
| `js/i18n.js` | Theme + language controller (reads `js/ko.js`, swaps text nodes). |
| `js/main.js` | Header, nav, scroll-spy, position map interaction, reveal animations. |

Open `index.html` directly, or serve locally:

```bash
python3 -m http.server 8000
```

---

## Features

- **Dark / light theme** — token-based; toggle in the header, stored in
  `localStorage["ht-theme"]`. Deep-link with `?theme=light`.
- **English / 한국어** — toggle in the header, `localStorage["ht-lang"]`,
  deep-link with `?lang=ko`.
- **Animated tactic boards** — each play is a set of player keyframes plus a
  puck path on a 600 × 280 rink. Play/pause, replay and a progress bar on every
  full board; mini boards animate while on screen.
- **Freeze a board** — `?freeze=0.45` renders every board at 45% of its loop and
  stops the clock, which is how the published screenshots were taken.
- **Step highlighting** — the step list beside each board lights up with the
  animation, so a pause leaves the caption on the current instruction.
- **Position map** — click a dot on the rink to jump to that role card.

## Adding a play

Everything lives in `PLAYS` in `js/tactics.js`:

```js
myPlay: {
  dur: 8200,                                   // loop length in ms
  name: { en: 'Name', ko: '이름' },
  sub:  { en: 'one line', ko: '한 줄' },
  steps: [{ t: 0, en: '...', ko: '...' }],     // t = 0..1
  routes: [{ d: 'M...', c: 'route route--pass' }],
  players: [{ id: 'C', tg: 'h', l: 'C', keys: [[0, 300, 140], [1, 380, 120]] }],
  puck: [[0, 300, 140], [0.5, 380, 120]]
}
```

`tg: 'h'` is the attacking five (amber), `tg: 'a'` the defending four (steel),
`gk: true` draws a goaltender. Keys are `[time, x, y]` and interpolate with a
smoothstep, so a two-key entry is a static player.

## Storage

Two `localStorage` keys, both cosmetic preferences: `ht-theme`, `ht-lang`.
No cookies, no analytics, no backend.

---

## Publish on GitHub Pages

```bash
git init && git add -A && git commit -m "ICE-HOCKEY TACTICS"
git remote add origin https://github.com/<user>/ice-hockey-tactics.git
git push -u origin main
```

Then **Settings → Pages → Deploy from a branch → main / (root)**.
`.nojekyll` is included so `css/` and `js/` are served as-is.

---

## Limitations

Inherited from the site's own Sources section: tactic names are coaching
shorthand rather than rulebook terms, diagrams are schematic (spacing is
exaggerated for readability), and no proprietary tracking data is reproduced.


## v3 (2026-11) — special situations, videos, references

- **Hero** reads `ICE-HOCKEY` / `TACTICS` with the `2026-27 Tactics Edition` kicker; the header brand stays `HOCKEY TACTICS`.
- **#special** — six boards: 5-on-3, 4-on-3, 6-on-5 extra attacker, delayed-penalty 6-on-5, 4-on-4, 3-on-3 overtime.
- **#faceoffs** — five boards: O-zone face-off win, D-zone face-off win, PP face-off, neutral-zone regroup, regroup trap.
- **#videos** — nine outbound YouTube links (English coaching channels), no embeds or third-party scripts.
- **#sources** — new "Further reading & channels" group: Johnston & Walter's *Hockey Plays and Strategies*, Ice Hockey Systems, Overload Hockey, The Coaches Site, Hockey Coach Vision, Rink Tactics, USA Hockey, Hockey Canada.
- Board count is now 27 (19 structures + 8 traditional/modern comparisons). All new plays live in `js/boards-plus.js`; `js/tactics.js` is still untouched.
