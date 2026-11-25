# columns-illustration

Custom **columns** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| columns-illustration | |
|---|---|
| Illustration image | H2, bulleted list (bold title + description per item), CTA link |

The image column is detected by content. Lists in the text column get a CSS check marker.

## Illustration animation

Illustrations that are hosted exports in `/assets/shipping-insurance/` with construct tags
(`svg[data-order]`) are fetched, sanitised (parsed as `image/svg+xml`; only drawing elements, no
scripts, handlers, styles or external references) and inlined by `scripts/illustration-construct.js`.
The `<img>` stays until the SVG is ready (no-JS fallback); the inlined SVG takes the same box and is
`aria-hidden` when the alt text is empty (decorative, as on the source), otherwise `role="img"` with the alt.
Any other image stays a plain image.

- **Responsive fit**: an export with `svg[data-fit]` is redrawn for its box like the source (viewBox = the box,
  scene centred and scaled by the measured rule, 1 px hairlines and hatch tiles kept at their on-screen size);
  see `fitIllustration()` in `scripts/illustration-construct.js`.
- **Build-in** (source "construct"): plays once when 30% of the illustration is visible, 900 ms,
  `cubic-bezier(.45,0,.55,1)`: items pop in one after another from their base point (start
  `0.06 + rank x min(.09, .42/(n-1))`), fill up from the ghost palette, emblems draw in, dashed
  construction guides appear and fade, route dashes appear along the route (12-62%), ground marks fade in (0-18%).
- **Gesture** (source hover pose): plays once the build-in has resolved, while the pointer is over the illustration. Frames come from
  `<name>.gesture.json` next to the SVG (fetched at idle on hover devices, else on first use):
  448 ms eased there and back for most scenes, 1500 ms linear for the Parcel Pro vault, a 3.6 s loop
  for the reshipment box (blends back on leave).
- Reduced motion: final drawing, no gesture.
