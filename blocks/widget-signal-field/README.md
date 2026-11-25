# widget-signal-field

Custom **widget** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

Put the block in its own section, directly before the section it decorates:

| widget-signal-field |
|---|
| [signal field](/widgets/signal-field) |

Optional link query params: `density` (0-1, default 0.9), `accent` (0-1, default 0.12), `seed`.
A bare `/widgets/signal-field` link (no block table) also works: `scripts.js` auto-blocks it into the `widget` block, which loads the adapter at `/widgets/signal-field.{html,css,js}`, and that adapter runs this block's code.

## Behaviour

- On decorate the block moves into the next section as an absolute, `z-index: -1` layer (the section gets `position: relative; isolation: isolate`), so it adds no height. If its own section is then empty, that section is hidden. With no following section it renders in place as a 320 px band.
- 2D canvas, port of the source "signal-field" pattern: square grey dots on an 11 px grid (3.6 px, 12% ink, density 0.9). Signals: about 4.2 s each, a few dozen lit at once at 1.5x size in the colour wheel's tone (teal, blue, gold, turning every 18 s), going from strong to light tone before fading. The pointer (document `pointermove`, the canvas has no pointer events) enlarges dots within 140 px and colours some of them in the wheel tone.
- The static dot layer is pre-rendered once into an offscreen canvas; each frame only draws the signals and the pointer area, at 30 fps.
- Pauses when off-screen, when the tab is hidden and under `prefers-reduced-motion` (a still frame is drawn). Listeners and observers are removed when the block leaves the DOM. DPR is capped at 2, and lowered further (not below 1) for very tall bands to keep the backing store under about 6 MP.
