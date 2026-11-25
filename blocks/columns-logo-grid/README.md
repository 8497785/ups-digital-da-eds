# columns-logo-grid

Custom **columns** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| columns-logo-grid | |
|---|---|
| H2 + paragraph | Label paragraph ("Integrations") + logo images (optionally linked) |

The column holding the most images becomes a 3-column grid of bordered cells: the label first, then one cell per logo.

Each logo may be followed, in the same paragraph, by its display width (`110px`), the source's per-mark
`--logo-width`. Without it every mark gets the same optical area from its aspect ratio
(`60px * sqrt(aspect)`). A mark wider than its cell's content box overflows it, centred, instead of shrinking (as on the source,
e.g. ShipStation at 154px in a 375px viewport).
