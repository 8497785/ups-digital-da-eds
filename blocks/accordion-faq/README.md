# accordion-faq

Custom **accordion** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

| accordion-faq | |
|---|---|
| Question | Answer |

One row per item, rendered as native `<details>`/`<summary>` with a plus icon on the right.
Items in a block share a `name`, so only one is open at a time. The panel animates
block-size/opacity via `::details-content` + `interpolate-size` where supported.
