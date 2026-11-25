# cards-stat-animated

Custom **cards** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

One row per card:

| cards-stat-animated | |
|---|---|
| Poster image + paragraph with the animation key (`none`, `freight-journey` or `claims-laptop`) | Title paragraph, **stat value** (bold-only paragraph), stat label, description |

The body cell is grouped into `.cards-stat-animated-head` (title), `.cards-stat-animated-stat-group` (value + label) and `.cards-stat-animated-text` (description). On desktop the tiles share these rows through a CSS subgrid, so the stats line up across tiles. In a `split` section the intro heading (default content) is styled as the first bordered tile.

## Animations

- `none`: the poster image is shown (card 1, the "1M Packages" box).
- `freight-journey` (`freight-journey.js`): procedural three.js port of the source `freightJourneyRenderer`: teal truck (cab, cargo box, glass, mirrors, lights, 4 wheels with treads and lug nuts), container ship (hull, stacked coloured containers, bridge, water strips) and cargo plane (fuselage, wings, engines, teal tail, drifting clouds). Orthographic camera on the 17.5 degree isometric axis, hatched ground shadow, ACES tone mapping. At rest the truck stands still; while active the wheels turn and the truck drives off, the ship cruises in and out, then the plane, looping (1280 ms cruise, 480 ms exit/enter).
- `claims-laptop` (`claims-laptop.js`): port of `claimsLaptopRenderer`: dark laptop with keyboard, gold Enter key and a claim form on screen. While active it loops a 3.36 s cycle: Enter key press, upload bar fills, a teal shield with a check spins in, confetti burst, then the form returns. Inactive = rest frame.
- **Activation**: pointer hover or focus within the card; on touch-only devices, while the card is at least 60% in view.
- **Loading**: three.js (`/scripts/vendor/three.module.min.js`, r170, MIT) and the renderer module are imported only when an animated card comes within 200 px of the viewport, so they stay off the LCP path.
- **Fallbacks**: the poster stays when `prefers-reduced-motion: reduce` is set (also if it turns on later), when WebGL2 is unavailable, or when the renderer fails or loses its context.
- Rendering pauses when the card is off-screen or the tab is hidden. Renderers, geometries, materials and shadow maps are disposed when the block leaves the DOM. DPR is capped at 2.

## Static card poster loop

A `none` card whose poster is a scene export (`svg[data-live]`, the 62M boxes) is inlined by
`scripts/illustration-live.js` and loops while the card is hovered or focused, as on the source: the
box shrinks into the first of 62 boxes (650 ms), 61 drop into a stack (34 ms apart), colour waves
cross it (2400 ms), the stack melts back into one box (1100 ms) and holds (800 ms): a 7524 ms loop.
Leaving eases back to the still over 550 ms (`cubic-bezier(.45,0,.55,1)`). Reduced motion: still only.
The three.js cards are unchanged.
