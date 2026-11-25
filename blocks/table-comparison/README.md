# table-comparison

Custom **table** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| table-comparison | | |
|---|---|---|
| What's covered? | Carrier liability | Shipping insurance |
| icon image + topic | carrier text | insurance text |

Optional per-cell label: a body cell may start with a paragraph that repeats its column header (e.g. "Carrier liability", followed by the answer paragraph). This is the source's mobile tag (`.table-comparison-label`): it shows above the answer on mobile, where the topic cell spans the full row and the two value cells sit side by side. On desktop it is visually hidden but still read by screen readers.

The first row becomes the header, the first column the row headers. The last column is highlighted and its body cells get a CSS check marker. Short rows are padded with empty cells.

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
- **Gesture** (source hover pose): plays once the build-in has resolved, while the row is active: hovered, tapped (stays until another row is tapped or hovered) or focused. Frames come from
  `<name>.gesture.json` next to the SVG (fetched at idle on hover devices, else on first use):
  448 ms eased there and back for most scenes, 1500 ms linear for the Parcel Pro vault, a 3.6 s loop
  for the reshipment box (blends back on leave).
- Reduced motion: final drawing, no gesture.
