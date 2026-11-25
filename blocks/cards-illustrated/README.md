# cards-illustrated

Custom **cards** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| cards-illustrated | |
|---|---|
| Illustration image | Title, description, bulleted tag list, "Learn more" link |

## Illustration animation

Illustrations that are hosted exports in `/assets/shipping-insurance/` with construct tags
(`svg[data-order]`) are fetched, sanitised (parsed as `image/svg+xml`; only drawing elements, no
scripts, handlers, styles or external references) and inlined by `scripts/illustration-construct.js`.
The `<img>` stays until the SVG is ready (no-JS fallback); the inlined SVG takes the same box and is
`aria-hidden` when the alt text is empty (decorative, as on the source), otherwise `role="img"` with the alt.
Any other image stays a plain image.

- **Build-in** (source "construct"): plays once when 30% of the illustration is visible, 900 ms,
  `cubic-bezier(.45,0,.55,1)`: items pop in one after another from their base point (start
  `0.06 + rank x min(.09, .42/(n-1))`), fill up from the ghost palette, emblems draw in, dashed
  construction guides appear and fade, route dashes appear along the route (12-62%), ground marks fade in (0-18%).
- **Gesture** (source hover pose): plays once the build-in has resolved, while the card is hovered or has focus. Frames come from
  `<name>.gesture.json` next to the SVG (fetched at idle on hover devices, else on first use):
  448 ms eased there and back for most scenes, 1500 ms linear for the Parcel Pro vault, a 3.6 s loop
  for the reshipment box (blends back on leave).
- Reduced motion: final drawing, no gesture.
- **Scene loops** (`svg[data-live]`, the CommerceShield scan-shield): no build-in; while the card is
  hovered or focused, `scripts/illustration-live.js` replays the source timeline from part templates in
  the SVG: a parcel slides in (1100 ms), the beam lights, a scan line sweeps it (1150-1900 ms), a shield
  pops up with a spin (1900-2300 ms) and rides off (2450-3550 ms); a new parcel every 2450 ms. Leaving
  shows the still at once (source behaviour). Reduced motion: still only.
