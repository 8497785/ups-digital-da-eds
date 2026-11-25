# quote-drawer

Custom block: the floating **"Quote monthly cost"** dock and the **"Build a quote"** side sheet it opens
(source: insureshield.com shipping-insurance, `aside.m-dock-0pqo-G` + lazy chunk `QuoteDrawer-IDD6-v3F.js`).

## Authoring (Document Authoring)

Model: `standalone`. Put the block in its own last section (before Metadata). The section takes no
space: the dock is fixed to the viewport corner and the sheet is a modal `<dialog>`.

One row per item. The **first cell is the row key** (case-insensitive); `Option` rows belong to the
question row above them. Lists of `Key: value` items hold short labels. Copy, options, images and links
all come from the table; the block only builds the controls.

| Key | Cell 2 | Cell 3 | Cell 4 | Cell 5 |
|---|---|---|---|---|
| `Dock` | Dock button label | | | |
| `Title` | Form step title (`Build a quote`) | | | |
| `Country` | Question | Bulleted list of countries. **The first one is the served country** (US); others route to talk to sales | | |
| `Outside` | Lead shown in talk to sales for other countries; `{country}` is replaced | | | |
| `Package value` | Slider label | `Stops:` comma list, `Default: $100 to $1,000`, `Format: currency`, `Open ended: yes`, `Help:` screen-reader hint | | |
| `Shipments` | Slider label | same keys (`Format: number`) | | |
| `Solution` / `Shipment types` / `Carriers` / `Coverage` | Question | optional list: `Description:`, and for types `Removed:` (live message), for carriers `Other:` (button), `Field:` (provider field label), `Cancel:` | | |
| `Option` | value id (see below) | illustration image (optional) | label | detail (optional) |
| `Estimate` | Result label | `Note:` with `{low}`/`{high}` rate placeholders, `Low rate:`, `High rate:` (percent of value) | | |
| `Buttons` | list: `Continue`, `Continue with quote`, `Expert help`, `Back`, `Close`, `Minimum`, `Maximum`, `Move range` (`{label}`, `{value}`) | | | |
| `Recommendation` | Step title | list: `Eyebrow`, `Or`, `Choose`, `Continue`, `Privacy` | | |
| `Product` | product id | art image, then logo image | name | points list (optional) + list: `Rates: 0.80 to 1.05`, `Brand: insureshield \| parcel-pro`, `Link:` sign-up URL |
| `Reasons` | list keyed by reason id: `High value`, `Platform`, `Luxury`, `UPS only`, `Transactional`, `Blanket`, `Unsure` | | | |
| `Sales` | Step title | illustration + lead paragraph | list of field labels and errors (`First name`, `Last name`, `Business email`, `Company name`, `ZIP code`, `Postal code`, `Phone`, `Required`, `Email error`, `ZIP error`, `Postal error`, `Phone error`, `Phone international error`, `Send`, `Privacy`) and `Contact page:` link | |

**Value ids drive the recommendation rules** (ported from the source) and must stay as authored:
solution `platform` / `insurance`; types `parcel` / `freight` / `luxury`; carriers `ups` / `usps` / `dhl` / `fedex`;
coverage `blanket` / `transactional` / `unsure`; products `connect` / `complete` / `for-ups` / `parcel-pro`.
Labels, details, images and order are free. Freight is not offered with `platform` (source rule).

Illustrations are the hosted SVG exports in `/assets/shipping-insurance/`, authored as icon tokens
`:illustration-<name>:` (e.g. `:illustration-carriers:`); scripts.js turns each token into
`<picture><img alt="">` before the block runs. Tokens are used because the animated SVGs exceed the
40 KB limit for SVG images in content, and plain text survives authoring and content sync. Logos
(`logo-*.svg`, small and with alt text) stay ordinary images. The illustrations carry `data-item`, `data-order`, `data-origins` and a hidden
`data-guides-all` group that the construct animation uses; any other SVG or image still works (static).

## Behaviour

- **Dock**: fixed 24 px from the bottom right with a 14 px label (16 px inset and a 16 px label below 768 px, as on the source). Shown once the page is scrolled past
  60% of the hero section height (source rule; it is not hidden near the footer). Entry: opacity and
  `translate: 0 16px` over 200 ms `cubic-bezier(.2,0,0,1)`. Pulse dot: `::after` ping, 1.28 s, exit easing
  `cubic-bezier(.3,0,1,1)`, `scale 1 -> 2.4` and fade by 75%, infinite. Hover `#6fb1b1`, pressed `#075a5a`.
- **Sheet**: native `<dialog>` opened with `showModal()`, `aria-labelledby` the step title, 480 px wide and
  full height on the right (full width below 600 px), shadow-5. Type: below 768 px every text in the sheet is 16 px
  (12/14 -> 16/16, 14/20 and 16/24 -> 16/20, 20/28 -> 16/24), the source's mobile ramp (`--qd-type-*` tokens). Slides in over 320 ms enter easing
  (`cubic-bezier(0,0,0,1)`) and out with the exit easing, `::backdrop` fades to `rgb(54 50 48 / 50%)`, using
  `@starting-style` + `transition-behavior: allow-discrete` with `overlay`/`display` in the transition list.
  Without allow-discrete support a JS fallback toggles `.is-open` and closes on `transitionend`.
  Light dismiss (`closedby="any"`, with a backdrop-click fallback where `closedBy` is unsupported), Esc and
  the Close button close it; focus returns to the launcher; page scroll is locked while open.
- **Form step**: listbox select (button + popover listbox: arrows, Home/End, PageUp/Down, typeahead,
  Enter/Space, Esc, Left/Right on the closed trigger), two dual-thumb sliders (as hero-calculator: two
  native range inputs, handles can cross, the band is a focusable button that drags/moves both with
  arrows, PageUp/Down, Home/End; clicking the rail moves the nearest handle), then radio/checkbox tiles with
  visually-hidden native inputs. Later questions reveal with `grid-template-rows: 0fr -> 1fr` + fade (320 ms
  enter easing). The footer shows the monthly estimate once a shipment type is chosen
  (`weekly x 52/12 x value x rate / 100`, low = low ends x low rate, high = high ends x high rate, `+` when a
  range is open ended) and, once every answer is in (US), an inline recommendation card and
  "Continue with quote".
- **Recommendation step**: offer card (eyebrow, product names, reason, per-product estimate and note, logo,
  art, points), a product choice when two fit, Continue + Expert help. Parcel Pro offers take the Parcel Pro
  theme (`#004791`).
- **Hand-off (source behaviour kept)**: Continue goes to the product's authored sign-up `Link` with the
  answers, exactly as the source: `?country=US&avgpkgvalue=<max value>&shipmenttype=<ids>&avgweeklyshipments=<max>&carriers=<labels>&coveragetype=<Transactional|Blanket|Unsure>`.
- **Talk to sales** ("Expert help", or "Talk to an expert" in the hero): the source posts a lead to
  `/api/lead`. There is no backend here, so the form is replicated with the source validation rules and
  messages (US ZIP/phone formats, international postal/phone), and a valid **Send goes to the authored
  `Contact page`** (https://www.insureshield.com/us/en/about/contact-us.html). Nothing is submitted
  and no personal data leaves the page. The source "Thanks for reaching out" state is therefore not shown.
- **Other blocks** open the sheet with
  `document.dispatchEvent(new CustomEvent('quote-drawer:open', { cancelable: true, detail: { entry: 'estimate' | 'sales', values: [min, max], trigger } }))`;
  the drawer calls `preventDefault()`, so the caller keeps its link as the fallback. Opening from the dock
  takes the hero calculator's current range (`.hero-calculator-card[data-min][data-max]`), like the source.
- **Construct animation** (shared with the page blocks in `scripts/illustration-construct.js`; port of the source timeline, 900 ms, starts when 30% of the art is visible,
  replays each time the sheet or a step is shown): items are ranked by `data-order`; each starts at
  `0.06 + rank x min(.09, .42/(n-1))`, its window scaled by `min(1, (1-start)/.55)`; within it the item pops in
  from its base point (`data-origins`) over 0-16%, its colour fills up from the ghost palette bottom to top over
  20-46%, emblems draw in over 36-55%, and the dashed construction guides fade in over 0-14% and out over
  40-55%. Easing `cubic-bezier(.45,0,.55,1)`. Shadow hatching follows the average pop.
- **Checkbox**: teal fill wipes in from the left (200 ms) and the tick draws via `stroke-dashoffset` on a
  `pathLength=1` path (200 ms after 100 ms). **Radio**: 16 px ring, 2 px -> 4 px teal border (100 ms).
- **Reduced motion**: sheet and backdrop fade only (100 ms), no dock movement or pulse, no reveal/construct
  animation (illustrations render complete), instant control transitions.
- The primary button carries the source's hatch layer, which the source only shows under
  `[data-elevation-style=hatch]` (not set on this page), so the disabled Continue is the flat grey
  `#eceae9` pill as on the source.

## Known differences

- The sheet and tiles switch at 600 px (project rule) where the source uses 480 px (sheet width) and 768 px (tile columns); the dock follows the source 768 px.
- The construct animation approximates the source per part: colour fill is per path (by its height in the item) rather than per-face level clipping, emblems fade rather than trace, guides fade rather than grow.
- Analytics (Tealium/Pendo events) are not migrated.
