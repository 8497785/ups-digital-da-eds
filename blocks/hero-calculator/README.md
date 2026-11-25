# hero-calculator

Custom **hero** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| hero-calculator | |
|---|---|
| H1 (emphasised words in *italics*), intro paragraph, CTA link | Calculator: heading, config list, result label, CTA link, disclaimer |
| `lost` (the word) + optional 2nd paragraph: accessible name (`About lost shipments`) | Definition paragraph(s), then an optional link (`Get coverage`) |
| `damaged` ... | ... |

**Definition rows** (optional, any number, after the first row): the first cell is an emphasised word of the
H1 (matched case-insensitively), the second its definition. A word without a row stays a plain teal accent;
a row whose word is not emphasised in the H1 is ignored. The accessible name defaults to `About {word}`.
The link is the no-JS / no-drawer fallback (the source button has no URL; the import points it at the
contact page).

Calculator config is a bulleted list of `key: value` items (all optional; defaults are the source values):

- `Label: Package value` - slider label
- `Min: $100` / `Max: $1,000` (or `Default: $100 to $1,000`) - initially selected range, snapped to the nearest stop
- `Stops: 50, 100, 150, ...` - selectable package values (default 50 ... 50,000, 21 stops)
- `Low rate: 0.8` / `High rate: 1.05` - premium rates in percent
- `Bars: 2, 3, 4, ...` - histogram heights, one per stop
- `Open ended: yes` - shows `+` when the upper handle sits on the last stop
- `Result: Estimated premium per package` - otherwise the first plain paragraph is used

## Behaviour

- **Formula** (taken from the source bundle `index-UfCqhPTV.js`, component `sD`/`FD`):
  `low = minValue x lowRate / 100`, `high = maxValue x highRate / 100`, with `lowRate = 0.80`, `highRate = 1.05`.
  $100 to $1,000 therefore reads "$0.80 to $10.50". Not a quote; pricing comes from the quote flow.
- Two overlaid native `input[type=range]` over the stop indices, so arrows, PageUp/PageDown and Home/End work. Handles may cross (the lower value always wins as minimum). The teal band between the handles can be dragged to move both.
- **Handle value bubble** (source readout): while a handle is dragged (`:active`) or keyboard-focused (`:focus-visible`), a 12/14px tabular bubble with that handle's value sits 8px above it (white, 1px `#b2b2bb`, 4px radius), fading over 100ms. Hover alone does not show it, as on the source (`data-readout="alone"`).
- **Definitions** (source `m-term` popovers): each defined word becomes `button[aria-expanded][aria-controls]` (dotted 2px underline at 4px offset, solid on hover/open, `cursor: help`, grey `#85858e` focus ring at 4px). Mouse hover opens it after 100ms and closes it 300ms after the pointer leaves both word and card; click, tap, Enter or Space pins it open and moves focus into it (`section[role=dialog][aria-label]`, non-modal). Esc, a click outside or focus leaving it closes it (focus returns to the word). The card sits 10px below the word, left-aligned with it (clamped 12px inside the viewport edge, like the source): square, 1px `#85858e`, shadow `0 1px 2px / 4%, 0 2px 6px / 6%`, 8px 12px padding, 14/20 copy at most 32ch, 12px gap, then the small tertiary link (14/20 500 `#0662bb`, underline and 2px arrow nudge on hover, `#064d93`). Enter: opacity + 4px drop over 100ms standard easing. **Get coverage** opens the quote drawer on the form with the selected range (`quote-drawer:open`, `entry: 'estimate'`, focus returns to the word), like the source; without a drawer the authored link is followed.
- **Import note**: the source renders the definitions only while a word is hovered or pressed, so a static page load has none. `tools/importer/parsers/hero-calculator.js` reads them from the DOM when a popover is present and otherwise emits the copy captured from the live page (`CAPTURED_TERMS`, 2026-11). Update those constants if the source copy changes.
- The figure updates live; a polite live region announces the new estimate 500 ms after the last change.
- Handles: ported from the source `._thumb_n76cl_90` rules. Each handle is a drawn `.hero-calculator-handle` span (24x40 hit box, 44x44 on coarse pointers) whose `::before` is the 4px teal pill bar; while hovered, dragged or keyboard-focused it widens to 8px with a 2px `#e7f2f2` ring, and keyboard focus adds the grey square ring (2px `#85858e` outline, 4px offset). The native inputs above it are invisible and take pointer and keyboard input; their state is mirrored onto the span as `data-hovered` / `data-focus-visible` / `data-dragging`.
- Styling hooks: the track gets `--lo`/`--hi` (0-100) and each handle `--at`; CSS draws the `.hero-calculator-rail` spans (with their end-stop dots, as the source `._rail_n76cl_33`), the band and the handles from them, with an 8 px gap like the source. Bars get `--bar` (height) and `--i` (stagger). In the text cell, link-only paragraphs become `.hero-calculator-actions` with `a.hero-calculator-cta` (outline pill). The H1 lead-in before the first `<em>` goes on its own `.hero-calculator-line`, and punctuation right after an accent word is wrapped in `.hero-calculator-accent` so it shows in teal.
- The CTAs keep their authored links as the no-JS / no-drawer fallback. When the page has a `quote-drawer` block, "Estimate monthly premium" opens it on the form with the selected range and "Talk to an expert" opens its talk-to-sales step (cancelable `quote-drawer:open` document event, as on the source). `data-min`/`data-max` on the card expose the selected values (the drawer also reads them when opened from its dock).
- **Lattice background**: 2D canvas, port of the source "lattice" pattern: an isometric grid (17.5 degree axes, 104 px cells) of hairline edges and grey nodes, kept by a seeded hash at density 0.62, densest on the right (behind the calculator). From 768px it fills the band, anchored at 71% of its width (measured on the source at 768-1440) and fading in between 41% and 58% of the width; below 768px it is a band from the bottom of the text column down (behind the card), full at its top and fading over its lower third. Drawn once (and on resize) at DPR up to 2, then faded in through `data-live`; no animation loop. Reduced motion only drops the fade transition.
