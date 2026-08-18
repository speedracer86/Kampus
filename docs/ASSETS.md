# Kampus Assets: Illustrations & Icons

Complete asset reference. All 80 illustration SVGs are bundled in `blobs/`; all UI icons are inline SVG code (copy-paste below). Nothing else — no icon font, no emoji in chrome, no raster images.

---

## 1. Illustration set ("blobs")

Flat vector blob characters doing activities. Shared palette (corals, golds, blues, greens, ink details), transparent background, no canvas outline. Render with `<img src="blobs/Name.svg">` + `object-fit: contain`.

### 1.1 Rules
- **One blob per surface**, always paired with text — never wallpaper, never repeated in a grid (avatar/world pickers are the exception).
- **Never** recolor, tint, crop, outline, flip, or put a background behind one.
- Blobs overhang the text block's left edge by −6 to −18px margin.
- The Play mascot is the only interactive blob (poke → wobble). Everywhere else static.
- New screen? Pick semantically from the inventory below before asking for new art.

### 1.2 Sizes
| Context | Size | Notes |
| --- | --- | --- |
| Onboarding hero | 150–170px | margin `0 0 8px -18px` |
| Screen header | 82px | baseline-aligned with H1 |
| Play mascot | 132 / 100 / 76px | grade band 3–4 / 5–6 / 7–8; pokeable |
| Feature/jump-back cards | 84–96px | |
| Small cards, avatar pickers | 52–66px (104px picker buttons) | |
| Empty states | 60–80px | opacity .8–.85 |
| Header avatar chip | 36px | white bg, 1px border, r6, 3px padding |

### 1.3 Current role assignments (don't reassign)
| Role | File |
| --- | --- |
| Kid avatars | `Thinker`, `Magic`, `Skating`, `Explore` |
| World mascots | `Ice_cream` (The Kitchen), `Cash` (The Store), `Rain` (The Trip), `Learning` (The Build) |
| Celebration / ≥80% round | `Party` |
| Test pass | `Winner` |
| Test intro | `Target` |
| Tickets / rewards | `Savings` |
| Lemonade stand | `Startup` |
| Shop | `Shopping` |
| Grown-ups | `Analytics` |
| Empty: nothing pending | `Timer` |
| Empty: no runs yet | `Coffee` |
| Empty: no stand result | `Vision` |

### 1.4 Full inventory (80) with suggested uses
**Money & business** — `Accounting` (parent reports), `Bill`, `Card` (payments), `Cash`★, `Discount` (sales/percent content), `Finance`, `Finance-1` (charts), `Fortune` (jackpots), `Growth` (progress/level-up), `Investment`, `Investor`, `Invoice`, `Invoice-1`, `Marketing` (stand upgrades), `Networking`, `Passive`, `Pitch` (stand intro), `Savings`★, `Savings-1` (alt piggy), `Security`, `Access` (parent PIN), `Shopping`★, `Startup`★, `Strategy` (planning), `Transfer`, `Vault` (big balances).
**Learning & making** — `Learning`★, `Artboard` (themes), `Drone`, `Emailing` (parent digest), `Idea` (hints/tips), `Laptop`, `Note`, `Painting` (themes), `Photography`, `Settings` (settings), `Target`★, `Tasks` (checklists), `Vision`★, `Work`, `Writing` (open-answer future mode), `Analytics`★.
**People & moods** — `Thinker`★, `Magic`★, `Explore`★, `Coach` (parent onboarding/tips), `Selfie` (profile), `Talk` (read-aloud/voice), `Attract`, `Love` (favorites), `Party`★, `Winner`★, `Singing`.
**Sports & movement** (breaks, streaks, "go move around") — `Badminton`, `Basketball`, `Bowling`, `Boxing`, `Cyclist`, `Football`, `Golf`, `Hunting`, `Jumping`, `Kettlebell`, `Lifter`, `Ping-pong`, `Pull-up`, `Runner`, `Skating`★, `Surfing`, `Swimmer`, `Volleyball`, `Play` (recess).
**Daily life** — `Coffee`★, `Eating`, `Gardening`, `Hydration` (break reminders), `Ice_cream`★, `Plants` (growth streaks), `Rain`★, `Timer`★.
★ = already assigned (§1.3).

---

## 2. Icon set (inline SVG)

All icons: 24 viewBox, rendered 14–18px, `#23252B` 1.8–2px strokes, round caps/joins, flat accent fills. Copy these verbatim.

### Kredit coin (the currency mark)
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#23252B" stroke-width="2" fill="#E8C94F"/><text x="12" y="16.2" text-anchor="middle" font-size="12" font-weight="800" fill="#a8862a" font-family="Inter Tight, sans-serif">K</text></svg>
```
Use at 14–15px in chips/buttons next to the count. Never separate the K from the coin.

### Ticket (real-world rewards)
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13V16C3 16.6 3.4 17 4 17H20C20.6 17 21 16.6 21 16V13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9V6C21 5.4 20.6 5 20 5H4C3.4 5 3 5.4 3 6V9Z" stroke="#a8862a" stroke-width="1.8" stroke-linejoin="round" fill="#E8C94F"/></svg>
```

### Logo pennant (brand mark, pairs with "Kampus" 19px/800)
```html
<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 21V3" stroke="#23252B" stroke-width="2" stroke-linecap="round"/><path d="M5 4H19L15.5 8L19 12H5V4Z" stroke="#23252B" stroke-width="1.8" stroke-linejoin="round" fill="#EE8A55"/></svg>
```

### Bulb (Teach me)
```html
<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 18H15M10 21H14M12 3C8.7 3 6 5.7 6 9C6 11.2 7.2 12.7 8.2 14C8.7 14.6 9 15.3 9 16H15C15 15.3 15.3 14.6 15.8 14C16.8 12.7 18 11.2 18 9C18 5.7 15.3 3 12 3Z" stroke="#23252B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### Speaker (Read it / read-aloud)
```html
<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="#23252B" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 9C16.2 10.2 16.2 13.8 15 15M18 6.5C20.5 9 20.5 15 18 17.5" stroke="#23252B" stroke-width="1.8" stroke-linecap="round"/></svg>
```

### Check (passed)
```html
<svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 12L10 18L20 6" stroke="#58B372" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

### Padlock (locked)
```html
<svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6z" stroke="#8a8578" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>
```

### Close (✕)
Plain text "✕" at 16px in a 38px white bordered square button — not an SVG.

### Shop upgrade icons (28px, one accent fill each)
```html
<!-- Coin Jar -->
<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M7 8H17V19C17 20.1 16.1 21 15 21H9C7.9 21 7 20.1 7 19V8Z" stroke="#23252B" stroke-width="1.8" fill="#F4BE93" stroke-linejoin="round"/><path d="M6 8H18M9 4H15V8" stroke="#23252B" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="14" r="2.5" stroke="#a8862a" stroke-width="1.5"/></svg>
<!-- Market Stall -->
<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 9L5 4H19L21 9H3Z" stroke="#23252B" stroke-width="1.8" fill="#EE8A55" stroke-linejoin="round"/><path d="M5 9V20M19 9V20M5 15H19" stroke="#23252B" stroke-width="1.8" stroke-linecap="round"/></svg>
<!-- Food Truck -->
<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M2 8H14V17H2V8Z" stroke="#23252B" stroke-width="1.8" fill="#8F97DE" stroke-linejoin="round"/><path d="M14 11H19L21 14V17H14V11Z" stroke="#23252B" stroke-width="1.8" stroke-linejoin="round"/><circle cx="6" cy="18.5" r="2" stroke="#23252B" stroke-width="1.8" fill="#fff"/><circle cx="17" cy="18.5" r="2" stroke="#23252B" stroke-width="1.8" fill="#fff"/></svg>
<!-- Storefront -->
<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 10L6 5H18L20 10" stroke="#23252B" stroke-width="1.8" fill="#5E9FE0" stroke-linejoin="round"/><path d="M5 10V20H19V10M10 20V14H14V20" stroke="#23252B" stroke-width="1.8" stroke-linejoin="round"/></svg>
<!-- Franchise (growth chart) -->
<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 19L9 12L13 15L21 5" stroke="#23252B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 5H21V10" stroke="#23252B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 21H21" stroke="#D9DE62" stroke-width="2.5" stroke-linecap="round"/></svg>
```

### Structural glyphs (not icons, drawn per-instance)
- **Nav/status dots**: 7–9px circles, `border-radius: 99px`, semantic color.
- **Tier dots**: 9px, `#E8C94F` earned / `#ECE9E1` empty, gap 6.
- **Teach step circles**: 22–26px, `1.5px solid #E8C94F` ring, `#A8862A` 800-weight number.
- **Number line** (interactive): 2px ink axis; ticks = 5.5px white circles w/ 1.4px ink stroke, 15px invisible hit circle, labels 13px `#5D5A52` below; START point 7px `#5E9FE0` with 11px 800 label above; feedback fills `#58B372` / `#E4766C`; Teach version adds `#EE8A55` 2.5px dashed-draw arc.
- **Fraction bar** (Teach): flex row, 30px cells, 6px gap, r6, 1.5px ink border, filled = `#F0AFCE`.

### If an icon doesn't exist here
Draw it in the same grammar: 24 viewBox, 1.8–2px ink stroke, round caps, one flat accent fill from the palette, no gradients, no filled-black glyphs. (Lucide outline icons are an acceptable base — restroke to ink and add the accent fill.)

### Emoji surfaces (only place emoji is allowed)
Shop pets `🐸 🐙 🐧 🐉` and theme icons `📄 🍑 🌙 🌸 🌿` at 30px in shop cards. Nowhere else.
