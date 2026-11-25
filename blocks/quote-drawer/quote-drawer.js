/*
 * quote-drawer
 * The floating "Quote monthly cost" dock and the "Build a quote" side sheet it opens
 * (source: insureshield.com shipping-insurance, m-dock + QuoteDrawer). All copy, options,
 * products and illustrations come from the authored table (see README.md); this file builds
 * the controls, the step logic (form, recommendation, talk to sales) and the motion.
 *
 * Other blocks open the sheet with a cancelable document event:
 *   document.dispatchEvent(new CustomEvent('quote-drawer:open', { cancelable: true,
 *     detail: { entry: 'estimate' | 'sales', values: [min, max], trigger: element } }));
 * The drawer calls preventDefault() on it, so the caller can keep its link as a fallback.
 */

import { toClassName } from '../../scripts/aem.js';
import {
  Construct, fetchSvg, parseSvg, prefersReducedMotion,
} from '../../scripts/illustration-construct.js';

const OPEN_EVENT = 'quote-drawer:open';
const WEEKS_PER_MONTH = 52 / 12;
const SVG_NS = 'http://www.w3.org/2000/svg';

/* Material Symbols (rounded 300) paths, as used by the source design system */
const ICONS = {
  shield: 'M470.12-85q-4.56-1-9.12-3-139-47-220-168.5t-81-266.61V-719q0-19.26 10.88-34.66Q181.75-769.07 199-776l260-97q11-4 21-4t21 4l260 97q17.25 6.93 28.13 22.34Q800-738.26 800-719v195.89Q800-378 719-256.5T499-88q-4.56 2-9.12 3T480-84q-5.32 0-9.88-1Zm9.88-58q115-38 187.5-143.5T740-523v-196l-260-98-260 98v196q0 131 72.5 236.5T480-143Zm0-337Z',
  close: 'M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z',
  chevron_left: 'm406-481 177 177q9 9 8.5 21t-9.5 21q-9 9-21.5 9t-21.5-9L341-460q-5-5-7-10t-2-11q0-6 2-11t7-10l199-199q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L406-481Z',
  arrow_forward: 'M686-450H190q-13 0-21.5-8.5T160-480q0-13 8.5-21.5T190-510h496L459-737q-9-9-9-21t9-21q9-9 21-9t21 9l278 278q5 5 7 10t2 11q0 6-2 11t-7 10L501-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l227-227Z',
  keyboard_arrow_down: 'M469-358q-5-2-10-7L261-563q-9-9-8.5-21.5T262-606q9-9 21.5-9t21.5 9l175 176 176-176q9-9 21-8.5t21 9.5q9 9 9 21.5t-9 21.5L501-365q-5 5-10 7t-11 2q-6 0-11-2Z',
  check: 'm378-332 363-363q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L399-267q-9 9-21 9t-21-9L175-449q-9-9-8.5-21.5T176-492q9-9 21.5-9t21.5 9l159 160Z',
  add: 'M450-450H230q-12.75 0-21.37-8.68-8.63-8.67-8.63-21.5 0-12.82 8.63-21.32 8.62-8.5 21.37-8.5h220v-220q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v220h220q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5H510v220q0 12.75-8.68 21.37-8.67 8.63-21.5 8.63-12.82 0-21.32-8.63-8.5-8.62-8.5-21.37v-220Z',
  check_circle: 'm421-389-98-98q-9-9-22-9t-23 10q-9 9-9 22t9 22l122 123q9 9 21 9t21-9l239-239q10-10 10-23t-10-23q-10-9-23.5-8.5T635-603L421-389Zm59 309q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z',
  error: 'M503.5-289.48q9.5-9.48 9.5-23.5t-9.48-23.52q-9.48-9.5-23.5-9.5t-23.52 9.48q-9.5 9.48-9.5 23.5t9.48 23.52q9.48 9.5 23.5 9.5t23.52-9.48Zm1-152.15q8.5-8.62 8.5-21.37v-193q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v193q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63 12.82 0 21.32-8.63ZM480.27-80q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z',
};

/* ---------- small DOM helpers ---------- */

let uid = 0;
const nextId = (prefix) => {
  uid += 1;
  return `quote-drawer-${prefix}-${uid}`;
};

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null || v === false) return;
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  });
  return node;
}

function icon(name, size = 20, className = 'quote-drawer-icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', className);
  svg.dataset.size = String(size);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}

const clean = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
const fill = (template, values) => String(template || '')
  .replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? values[k] : m));

/* ---------- number helpers ---------- */

const money = (digits) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits,
});
const money0 = money(0);
const money2 = money(2);
const number0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function parseAmount(textValue) {
  const m = String(textValue).replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*(k|m)?/i);
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]?.toLowerCase() === 'k') v *= 1e3;
  if (m[2]?.toLowerCase() === 'm') v *= 1e6;
  return v;
}

const parseList = (textValue) => String(textValue).split(/[;|]|,\s+/).map(parseAmount)
  .filter(Number.isFinite);

function parseRange(textValue) {
  const parts = String(textValue).split(/\s+(?:to|-|–|—)\s+/i).map(parseAmount);
  return parts.length >= 2 && parts.every(Number.isFinite) ? [parts[0], parts[1]] : null;
}

const nearestIndex = (stops, v) => stops.reduce(
  (best, s, i) => (Math.abs(s - v) < Math.abs(stops[best] - v) ? i : best),
  0,
);

/* ---------- authored content ---------- */

/** Reads "Key: value" list items (or paragraphs) into a map keyed by class-name keys. */
function readPairs(cell) {
  const map = {};
  if (!cell) return map;
  const items = cell.querySelectorAll('li').length ? cell.querySelectorAll('li') : cell.querySelectorAll('p');
  [...items].forEach((item) => {
    const textValue = clean(item);
    const i = textValue.indexOf(':');
    if (i < 1) return;
    const key = toClassName(textValue.slice(0, i));
    const link = item.querySelector('a[href]');
    map[key] = link ? link.getAttribute('href') : textValue.slice(i + 1).trim();
  });
  return map;
}

const QUESTION_KEYS = {
  solution: 'solution',
  'shipment-types': 'types',
  types: 'types',
  carriers: 'carriers',
  coverage: 'coverage',
};

function readRange(cells, fallbackFormat) {
  const pairs = readPairs(cells[2]);
  const stops = pairs.stops ? [...new Set(parseList(pairs.stops))].sort((a, b) => a - b) : [];
  const range = parseRange(pairs.default || '') || [stops[0], stops[stops.length - 1]];
  return {
    label: clean(cells[1]),
    stops,
    start: range,
    currency: /currency|\$/i.test(pairs.format || fallbackFormat),
    openEnded: !/^(no|false|off|0)$/i.test(pairs['open-ended'] || 'yes'),
    help: pairs.help || '',
  };
}

function readProduct(cells) {
  const imgs = [...cells.flatMap((c) => [...c.querySelectorAll('img')])];
  const lists = cells.slice(2).flatMap((c) => [...c.querySelectorAll('ul, ol')]);
  const isConfig = (list) => [...list.querySelectorAll('li')].every((li) => /^\s*(rates?|brand|link)\s*:/i.test(li.textContent));
  const config = lists.find(isConfig);
  const points = lists.find((l) => l !== config);
  const pairs = config ? readPairs(config.parentElement) : {};
  const rates = parseRange(pairs.rates || pairs.rate || '') || [0, 0];
  const name = cells.slice(2).map((c) => {
    const copy = c.cloneNode(true);
    copy.querySelectorAll('ul, ol, picture, img').forEach((n) => n.remove());
    return clean(copy);
  }).find(Boolean) || '';
  return {
    id: toClassName(clean(cells[1])),
    name,
    art: imgs[0] || null,
    logo: imgs[1] || null,
    points: points ? [...points.querySelectorAll('li')].map(clean) : [],
    rates: { low: rates[0], high: rates[1] },
    brand: toClassName(pairs.brand || ''),
    link: pairs.link || '',
  };
}

function readContent(block) {
  const c = {
    questions: {}, products: {}, reasons: {}, labels: {}, rec: {}, sales: {}, estimate: {},
  };
  let question = null;
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = toClassName(clean(cells[0]));
    if (key === 'option') {
      if (!question) return;
      const textCells = cells.slice(2).filter((x) => clean(x) && !x.querySelector('img'));
      question.options.push({
        value: toClassName(clean(cells[1])),
        label: clean(textCells[0]),
        detail: clean(textCells[1]),
        img: row.querySelector('img'),
      });
      return;
    }
    question = null;
    if (key === 'dock') c.dock = clean(cells[1]);
    else if (key === 'title') c.title = clean(cells[1]);
    else if (key === 'country') {
      const list = cells[2]?.querySelectorAll('li');
      const countries = list?.length ? [...list].map(clean) : clean(cells[2]).split(/,\s*/);
      c.country = { label: clean(cells[1]), list: countries.filter(Boolean) };
    } else if (key === 'outside') c.outside = clean(cells[1]);
    else if (key === 'package-value' || key === 'values') c.values = readRange(cells, 'currency');
    else if (key === 'shipments' || key === 'volume') c.volume = readRange(cells, 'number');
    else if (QUESTION_KEYS[key]) {
      const pairs = readPairs(cells[2]);
      question = {
        label: clean(cells[1]), pairs, description: pairs.description || '', options: [],
      };
      c.questions[QUESTION_KEYS[key]] = question;
    } else if (key === 'estimate') {
      const pairs = readPairs(cells[2]);
      c.estimate = {
        label: clean(cells[1]),
        note: pairs.note || '',
        rates: {
          low: parseAmount(pairs['low-rate'] ?? NaN),
          high: parseAmount(pairs['high-rate'] ?? NaN),
        },
      };
    } else if (key === 'buttons' || key === 'labels') c.labels = readPairs(cells[1]);
    else if (key === 'recommendation') c.rec = { title: clean(cells[1]), ...readPairs(cells[2]) };
    else if (key === 'product') {
      const product = readProduct(cells);
      if (product.id) c.products[product.id] = product;
    } else if (key === 'reasons') c.reasons = readPairs(cells[1]);
    else if (key === 'sales') {
      const media = cells[2];
      const lead = [...(media?.querySelectorAll('p') || [])].map(clean).find(Boolean)
        || (media && !media.querySelector('img') ? clean(media) : '');
      c.sales = {
        title: clean(cells[1]), art: media?.querySelector('img') || null, lead, ...readPairs(cells[3]),
      };
    }
  });
  return c;
}

/* ---------- recommendation rules (port of the source routing) ---------- */

const allowedType = (type, solution) => type !== 'freight' || solution !== 'platform';

function isComplete(f) {
  return f.types.length > 0 && f.solution !== null
    && (f.carriers.length > 0 || f.other.trim() !== '') && f.coverage !== null;
}

function recommend(f) {
  if (!isComplete(f) || (f.solution === 'platform' && f.types.includes('freight'))) return null;
  const byCoverage = () => {
    if (f.coverage === 'transactional') return { products: ['connect'], reason: 'transactional' };
    if (f.coverage === 'blanket') return { products: ['complete'], reason: 'blanket' };
    return { products: ['connect', 'complete'], reason: 'unsure' };
  };
  if (f.coverage === 'blanket') return byCoverage();
  const other = f.other.trim() !== '';
  const notDhlOnly = f.carriers.length !== 1 || f.carriers[0] !== 'dhl' || other;
  if (notDhlOnly && f.types.includes('luxury')) return { products: ['parcel-pro'], reason: 'luxury' };
  if (f.types.includes('freight')) return byCoverage();
  if (notDhlOnly && f.values[1] >= 50000) return { products: ['parcel-pro'], reason: 'high-value' };
  if (notDhlOnly && f.solution === 'platform') return { products: ['parcel-pro'], reason: 'platform' };
  if (f.carriers.length === 1 && f.carriers[0] === 'ups' && !other) return { products: ['for-ups'], reason: 'ups-only' };
  return byCoverage();
}

const monthly = (perWeek, rate, value) => perWeek * WEEKS_PER_MONTH * ((value * rate) / 100);

/* ---------- construct (build-in) animation of the inlined illustrations ---------- */

/* the source timeline lives in scripts/illustration-construct.js (shared with the page blocks) */
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const constructs = new WeakMap();
const artObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const svg = entry.target.querySelector('svg');
    const c = svg && constructs.get(svg);
    if (c && c.state === 'building') {
      c.play();
      artObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

/** Returns a media holder for an authored illustration and inlines the SVG so parts can animate. */
function artFor(img, className = 'quote-drawer-art') {
  const holder = el('span', className, { 'aria-hidden': 'true', 'data-construct': 'resolved' });
  if (!img) return holder;
  const src = img.currentSrc || img.getAttribute('src');
  const fallback = el('img', '', { src, alt: '', loading: 'lazy' });
  holder.append(fallback);
  if (!/\.svg(\?|$)/i.test(src)) return holder;
  fetchSvg(src).then((markup) => {
    const node = parseSvg(markup, nextId('art'));
    if (!node) return;
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    node.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    fallback.replaceWith(node);
    constructs.set(node, new Construct(node, { holder: node.closest('.quote-drawer-art') }));
    if (holder.dataset.pending === 'true') {
      delete holder.dataset.pending;
      constructs.get(node).reset();
      artObserver.observe(holder);
    }
  });
  return holder;
}

/** Rewinds every illustration under root and replays it once it scrolls into view. */
function replayArt(root) {
  root.querySelectorAll('.quote-drawer-art, .quote-drawer-offer-art, .quote-drawer-graphic-art').forEach((holder) => {
    const svg = holder.querySelector('svg');
    const c = svg && constructs.get(svg);
    if (!c) {
      holder.dataset.pending = 'true';
      return;
    }
    c.reset();
    artObserver.unobserve(holder);
    artObserver.observe(holder);
  });
}

/* ---------- controls ---------- */

function button(labelText, {
  variant = 'primary', size = 'normal', trailing, leading,
} = {}) {
  const btn = el('button', 'quote-drawer-button', { type: 'button', 'data-variant': variant, 'data-size': size });
  if (variant === 'primary') btn.append(el('span', 'quote-drawer-button-hatch', { 'aria-hidden': 'true' }));
  if (leading) {
    const lead = el('span', 'quote-drawer-button-icon', { 'aria-hidden': 'true' });
    lead.append(icon(leading, size === 'small' ? 16 : 20));
    btn.append(lead);
  }
  btn.append(el('span', 'quote-drawer-button-label', { text: labelText }));
  if (trailing) {
    const trail = el('span', 'quote-drawer-button-icon quote-drawer-button-trailing', { 'aria-hidden': 'true' });
    trail.append(icon(trailing, 20));
    btn.append(trail);
  }
  return btn;
}

function iconButton(name, label) {
  const btn = el('button', 'quote-drawer-icon-button', { type: 'button', 'aria-label': label });
  btn.append(icon(name, 20));
  return btn;
}

/** Listbox select styled like the source (button trigger + popover listbox). */
function selectField({
  label, options, value, onChange,
}) {
  const field = el('div', 'quote-drawer-select');
  const labelId = nextId('select-label');
  const valueId = nextId('select-value');
  const listId = nextId('listbox');
  const labelEl = el('span', 'quote-drawer-select-label', { id: labelId, text: label });
  const trigger = el('button', 'quote-drawer-select-control', {
    type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-labelledby': `${valueId} ${labelId}`, 'aria-controls': listId,
  });
  const valueEl = el('span', 'quote-drawer-select-value', { id: valueId });
  trigger.append(valueEl, icon('keyboard_arrow_down', 20, 'quote-drawer-icon quote-drawer-select-caret'));
  const usePopover = typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');
  const pop = el('div', 'quote-drawer-listbox-popover', usePopover ? { popover: 'auto' } : { hidden: true });
  const list = el('div', 'quote-drawer-listbox', {
    id: listId, role: 'listbox', 'aria-labelledby': labelId, tabindex: '-1',
  });
  pop.append(el('span', 'quote-drawer-listbox-shadow', { 'aria-hidden': 'true' }), list);
  let current = value;
  const optionEls = options.map((opt) => {
    const o = el('div', 'quote-drawer-option', {
      role: 'option', id: nextId('option'), tabindex: '-1', 'data-value': opt,
    });
    o.append(el('span', 'quote-drawer-option-label', { text: opt }));
    o.append(icon('check', 16, 'quote-drawer-icon quote-drawer-option-check'));
    list.append(o);
    return o;
  });
  const render = () => {
    valueEl.textContent = current;
    optionEls.forEach((o) => {
      const sel = o.dataset.value === current;
      o.setAttribute('aria-selected', String(sel));
      o.tabIndex = sel ? 0 : -1;
    });
  };
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const place = () => {
    const r = trigger.getBoundingClientRect();
    const origin = { left: 0, top: 0 };
    const host = usePopover ? origin : pop.offsetParent?.getBoundingClientRect() || origin;
    pop.style.left = `${r.left - host.left}px`;
    pop.style.top = `${r.bottom + 4 - host.top}px`;
    pop.style.width = `${r.width}px`;
    pop.style.maxHeight = `${Math.max(120, window.innerHeight - r.bottom - 20)}px`;
  };
  const focusOption = (o) => {
    if (!o) return;
    optionEls.forEach((x) => { x.tabIndex = x === o ? 0 : -1; x.removeAttribute('data-focused'); });
    o.dataset.focused = 'true';
    o.focus({ preventScroll: false });
  };
  const close = (refocus = true) => {
    if (!isOpen()) return;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('data-pressed');
    if (usePopover) {
      try { pop.hidePopover(); } catch (e) { /* already hidden */ }
    } else pop.hidden = true;
    if (refocus) trigger.focus();
  };
  const open = (focusLast = false) => {
    if (isOpen()) return;
    place();
    if (usePopover) pop.showPopover(); else pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.dataset.pressed = 'true';
    const sel = optionEls.find((o) => o.dataset.value === current);
    focusOption(focusLast ? optionEls[optionEls.length - 1] : sel || optionEls[0]);
  };
  const choose = (v) => {
    const changed = v !== current;
    current = v;
    render();
    if (changed) onChange(v);
  };
  if (usePopover) {
    pop.addEventListener('toggle', (e) => {
      if (e.newState === 'closed' && isOpen()) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('data-pressed');
      }
    });
  }
  let typed = '';
  let typedTimer = 0;
  const typeahead = (key, from) => {
    clearTimeout(typedTimer);
    typed += key.toLowerCase();
    typedTimer = setTimeout(() => { typed = ''; }, 700);
    const start = Math.max(0, from);
    const ordered = [...optionEls.slice(start), ...optionEls.slice(0, start)];
    return ordered.find((o) => o.dataset.value.toLowerCase().startsWith(typed));
  };
  let wasOpen = false;
  trigger.addEventListener('pointerdown', () => { wasOpen = isOpen(); });
  trigger.addEventListener('click', (e) => {
    const openNow = e.detail ? wasOpen || isOpen() : isOpen();
    wasOpen = false;
    if (openNow) close(); else open();
  });
  trigger.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open(e.key === 'ArrowUp');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const i = options.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
      if (options[i]) choose(options[i]);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const match = typeahead(e.key, options.indexOf(current) + (typed ? 0 : 1));
      if (match) choose(match.dataset.value);
    }
  });
  list.addEventListener('keydown', (e) => {
    const i = optionEls.indexOf(document.activeElement);
    const moves = {
      ArrowDown: i + 1,
      ArrowUp: i - 1,
      Home: 0,
      End: optionEls.length - 1,
      PageDown: i + 8,
      PageUp: i - 8,
    };
    if (e.key in moves) {
      e.preventDefault();
      focusOption(optionEls[Math.max(0, Math.min(optionEls.length - 1, moves[e.key]))]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (optionEls[i]) choose(optionEls[i].dataset.value);
      close();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      focusOption(typeahead(e.key, i + (typed ? 0 : 1)));
    }
  });
  optionEls.forEach((o) => {
    o.addEventListener('pointermove', () => { if (document.activeElement !== o) focusOption(o); });
    o.addEventListener('click', () => {
      choose(o.dataset.value);
      close();
    });
  });
  render();
  field.append(labelEl, trigger, pop);
  return {
    el: field,
    setValue: (v) => { current = v; render(); },
    close: () => close(false),
  };
}

/** Two-handle range over a fixed scale (as hero-calculator: crossing handles, draggable band). */
function rangeField(config, labels, { onChange, onChangeEnd }) {
  const { stops } = config;
  const last = stops.length - 1;
  const fmt = (v) => (config.currency ? money0.format(v) : number0.format(v));
  const fmtStop = (i) => `${fmt(stops[i])}${config.openEnded && i === last ? '+' : ''}`;
  const root = el('div', 'quote-drawer-range', { role: 'group', 'data-size': 'sm' });
  const labelId = nextId('range-label');
  const helpId = nextId('range-help');
  root.setAttribute('aria-labelledby', labelId);
  const head = el('div', 'quote-drawer-range-head');
  const labelEl = el('span', 'quote-drawer-range-label', { id: labelId, text: config.label });
  const readout = el('output', 'quote-drawer-range-readout');
  const reserve = el('span', 'quote-drawer-range-reserve', { 'aria-hidden': 'true', text: `${fmt(stops[last])} to ${fmt(stops[last])}${config.openEnded ? '+' : ''}` });
  const readValue = el('span', 'quote-drawer-range-value');
  readout.append(reserve, readValue);
  head.append(labelEl, readout);
  const help = el('span', 'quote-drawer-visually-hidden', { id: helpId, text: config.help });
  const track = el('div', 'quote-drawer-range-track');
  const railStart = el('span', 'quote-drawer-range-rail', { 'data-side': 'start', 'aria-hidden': 'true' });
  const railEnd = el('span', 'quote-drawer-range-rail', { 'data-side': 'end', 'aria-hidden': 'true' });
  const band = el('button', 'quote-drawer-range-band', { type: 'button', 'aria-describedby': config.help ? helpId : undefined });
  const thumb = (v) => el('input', 'quote-drawer-range-thumb', {
    type: 'range', min: '0', max: String(last), step: '1', value: String(v), 'aria-describedby': config.help ? helpId : undefined,
  });
  const a = thumb(nearestIndex(stops, Math.min(...config.start)));
  const b = thumb(nearestIndex(stops, Math.max(...config.start)));
  track.append(railStart, railEnd, band, a, b);
  root.append(head, help, track);

  let lo = 0;
  let hi = last;
  const update = (fire = true) => {
    const va = Number(a.value);
    const vb = Number(b.value);
    lo = Math.min(va, vb);
    hi = Math.max(va, vb);
    a.setAttribute('aria-label', va <= vb ? labels.minimum : labels.maximum);
    b.setAttribute('aria-label', va <= vb ? labels.maximum : labels.minimum);
    a.setAttribute('aria-valuetext', fmtStop(va));
    b.setAttribute('aria-valuetext', fmtStop(vb));
    const textValue = `${fmtStop(lo)} to ${fmtStop(hi)}`;
    readValue.textContent = textValue;
    band.setAttribute('aria-label', fill(labels.moveRange, { label: config.label.toLowerCase(), value: textValue }));
    band.disabled = lo === hi;
    track.style.setProperty('--rs-start', String(last ? lo / last : 0));
    track.style.setProperty('--rs-end', String(last ? hi / last : 1));
    if (fire) onChange([stops[lo], stops[hi]]);
  };
  [a, b].forEach((input) => {
    input.addEventListener('input', () => update());
    input.addEventListener('change', () => onChangeEnd?.());
  });
  const shift = (delta) => {
    const d = Math.max(-lo, Math.min(last - hi, delta));
    a.value = String(Number(a.value) + d);
    b.value = String(Number(b.value) + d);
    update();
  };
  band.addEventListener('keydown', (e) => {
    const page = Math.max(1, Math.round(last / 10));
    const moves = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: page,
      PageDown: -page,
      Home: -lo,
      End: last - hi,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    shift(moves[e.key]);
    onChangeEnd?.();
  });
  band.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    band.focus();
    const startX = e.clientX;
    const width = track.getBoundingClientRect().width || 1;
    const startA = Number(a.value);
    const startB = Number(b.value);
    const startLo = lo;
    const startHi = hi;
    band.setPointerCapture(e.pointerId);
    band.dataset.dragging = 'true';
    const move = (ev) => {
      const raw = Math.round(((ev.clientX - startX) / width) * last);
      const d = Math.max(-startLo, Math.min(last - startHi, raw));
      a.value = String(startA + d);
      b.value = String(startB + d);
      update();
    };
    const end = () => {
      delete band.dataset.dragging;
      band.removeEventListener('pointermove', move);
      band.removeEventListener('pointerup', end);
      band.removeEventListener('pointercancel', end);
      onChangeEnd?.();
    };
    band.addEventListener('pointermove', move);
    band.addEventListener('pointerup', end);
    band.addEventListener('pointercancel', end);
  });
  /* clicking the rail moves the nearest handle there */
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target !== track && !e.target.classList.contains('quote-drawer-range-rail'))) return;
    const r = track.getBoundingClientRect();
    const i = Math.round(clamp01((e.clientX - r.left) / r.width) * last);
    const near = Math.abs(Number(a.value) - i) <= Math.abs(Number(b.value) - i) ? a : b;
    near.value = String(i);
    update();
    onChangeEnd?.();
  });
  update(false);
  return {
    el: root,
    setValues: (values) => {
      a.value = String(nearestIndex(stops, Math.min(...values)));
      b.value = String(nearestIndex(stops, Math.max(...values)));
      update(false);
    },
    values: () => [stops[lo], stops[hi]],
  };
}

function checkMark() {
  const box = el('span', 'quote-drawer-check', { 'aria-hidden': 'true' });
  box.append(el('span', 'quote-drawer-check-fill'));
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', 'quote-drawer-check-mark');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M3.6 8.4L6.6 11.3L12.4 4.9');
  path.setAttribute('pathLength', '1');
  svg.append(path);
  box.append(svg);
  return box;
}

/** Radio (single) or checkbox (multiple) tiles with visually-hidden native inputs. */
function tileGroup({
  label, description, multiple = false, columns = 2, options, onChange, media = true,
}) {
  const group = el('div', 'quote-drawer-group', { role: multiple ? 'group' : 'radiogroup' });
  const labelId = nextId('group-label');
  group.setAttribute('aria-labelledby', labelId);
  group.append(el('span', 'quote-drawer-group-label', { id: labelId, text: label }));
  if (description) {
    const descId = nextId('group-desc');
    group.setAttribute('aria-describedby', descId);
    group.append(el('p', 'quote-drawer-group-description', { id: descId, text: description }));
  }
  const tiles = el('div', 'quote-drawer-tiles', { 'data-columns': String(columns) });
  const name = nextId('choice');
  const inputs = options.map((opt) => {
    const tile = el('label', `quote-drawer-tile quote-drawer-tile-${opt.value}`);
    const input = el('input', 'quote-drawer-visually-hidden', { type: multiple ? 'checkbox' : 'radio', name, value: opt.value });
    tile.append(input);
    if (media && opt.img) {
      tile.dataset.media = '';
      const holder = el('span', 'quote-drawer-tile-media', { 'aria-hidden': 'true' });
      holder.append(artFor(opt.img));
      tile.append(holder);
    }
    tile.append(multiple ? checkMark() : el('span', 'quote-drawer-ring', { 'aria-hidden': 'true' }));
    const textEl = el('span', 'quote-drawer-tile-text');
    textEl.append(el('span', 'quote-drawer-tile-choice', { text: opt.label }));
    if (opt.detail) textEl.append(el('span', 'quote-drawer-tile-detail', { text: opt.detail }));
    tile.append(textEl);
    tiles.append(tile);
    input.addEventListener('change', () => {
      onChange(inputs.filter((i) => i.checked).map((i) => i.value));
    });
    return input;
  });
  group.append(tiles);
  return {
    el: group,
    tiles,
    setValue: (values) => inputs.forEach((i) => { i.checked = values.includes(i.value); }),
    show: (fn) => {
      let visible = 0;
      inputs.forEach((i) => {
        const on = fn(i.value);
        i.closest('label').hidden = !on;
        if (on) visible += 1;
      });
      return visible;
    },
  };
}

function textField({
  label, required, type = 'text', autocomplete, inputmode,
}) {
  const field = el('div', 'quote-drawer-field');
  const id = nextId('field');
  const errId = nextId('field-error');
  const labelEl = el('label', 'quote-drawer-field-label', { for: id });
  labelEl.append(el('span', '', { text: label }));
  if (required) labelEl.append(el('span', 'quote-drawer-field-required', { 'aria-hidden': 'true', text: '*' }));
  const control = el('div', 'quote-drawer-field-control');
  const input = el('input', 'quote-drawer-field-input', {
    id, type, autocomplete, inputmode, required, 'aria-required': required ? 'true' : undefined,
  });
  control.append(input);
  const error = el('p', 'quote-drawer-field-error', { id: errId, 'aria-live': 'polite', hidden: true });
  field.append(labelEl, control, error);
  return {
    el: field,
    input,
    setLabel: (t) => { labelEl.firstChild.textContent = t; },
    setError: (msg) => {
      error.replaceChildren();
      if (msg) {
        error.append(icon('error', 14), el('span', '', { text: msg }));
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errId);
        control.dataset.invalid = '';
      } else {
        error.hidden = true;
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        delete control.dataset.invalid;
      }
    },
  };
}

function reveal(...children) {
  const outer = el('div', 'quote-drawer-reveal');
  const inner = el('div', 'quote-drawer-reveal-inner');
  inner.inert = true;
  inner.append(...children);
  outer.append(inner);
  return {
    el: outer,
    set: (open) => {
      outer.toggleAttribute('data-open', open);
      inner.inert = !open;
    },
  };
}

/* ---------- validation (port of the source contact rules) ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP = /^\d{5}(?:-\d{4})?$/;
const POSTAL = /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/;

function formatPhone(value, us) {
  if (!us) return value.replace(/[^\d+().\s-]/g, '').replace(/(?!^)\+/g, '').slice(0, 24);
  const d = value.replace(/\D/g, '').replace(/^1(?=\d)/, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function validPhone(value, us) {
  const v = value.trim();
  if (!v) return true;
  const digits = v.replace(/\D/g, '');
  return us ? /^[2-9]\d{9}$/.test(digits)
    : /^\+?[\d\s().-]+$/.test(v) && digits.length >= 7 && digits.length <= 15;
}

/* ---------- the drawer ---------- */

export default function decorate(block) {
  const c = readContent(block);
  const L = {
    continue: c.labels.continue || '',
    continueQuote: c.labels['continue-with-quote'] || c.labels.continue || '',
    expert: c.labels['expert-help'] || '',
    back: c.labels.back || '',
    close: c.labels.close || '',
    minimum: c.labels.minimum || '',
    maximum: c.labels.maximum || '',
    moveRange: c.labels['move-range'] || '',
  };
  const countries = c.country?.list || [];
  const served = countries[0] || '';
  const valuesCfg = c.values || {
    label: '', stops: [100, 1000], start: [100, 1000], currency: true, openEnded: false,
  };
  const volumeCfg = c.volume || {
    label: '', stops: [1, 10], start: [1, 10], currency: false, openEnded: false,
  };
  const Q = c.questions;
  const optionLabel = (q, v) => Q[q]?.options.find((o) => o.value === v)?.label || v;

  const state = {
    step: 'form',
    previous: null,
    chosen: null,
    result: null,
    attempted: false,
    salesAttempted: false,
    form: {
      country: served,
      values: [...valuesCfg.start],
      volume: [...volumeCfg.start],
      solution: null,
      types: [],
      carriers: [],
      other: '',
      otherOpen: false,
      coverage: null,
    },
  };
  const inUs = () => state.form.country === served;

  /* ----- dock ----- */
  const dock = el('aside', 'quote-drawer-dock', { 'aria-label': c.dock, 'aria-hidden': 'true' });
  dock.inert = true;
  const dockRaised = el('div', 'quote-drawer-dock-raised');
  const dockButton = el('button', 'quote-drawer-dock-button', { type: 'button' });
  dockButton.append(icon('shield', 20), el('span', '', { text: c.dock }), el('span', 'quote-drawer-pulse', { 'aria-hidden': 'true' }));
  dockRaised.append(el('span', 'quote-drawer-dock-shadow', { 'aria-hidden': 'true' }), dockButton);
  dock.append(dockRaised);

  /* ----- sheet ----- */
  const dialog = el('dialog', 'quote-drawer-sheet', { 'data-step': 'form', tabindex: '-1' });
  const titleId = nextId('title');
  dialog.setAttribute('aria-labelledby', titleId);
  const supportsClosedBy = 'closedBy' in HTMLDialogElement.prototype;
  dialog.setAttribute('closedby', 'any');
  const panel = el('div', 'quote-drawer-panel');
  const header = el('div', 'quote-drawer-header');
  const lead = el('div', 'quote-drawer-header-lead');
  const backButton = iconButton('chevron_left', L.back);
  const title = el('h2', 'quote-drawer-title', { id: titleId });
  lead.append(backButton, title);
  const closeButton = iconButton('close', L.close);
  header.append(lead, closeButton);
  const body = el('div', 'quote-drawer-body');
  const foot = el('div', 'quote-drawer-foot');
  panel.append(header, body, foot);
  dialog.append(panel);

  /* ----- form step ----- */
  const formStep = el('section', 'quote-drawer-step', { tabindex: '-1', 'data-step': 'form' });
  // eslint-disable-next-line no-use-before-define
  const changed = () => update();
  const country = selectField({
    label: c.country?.label || '',
    options: countries,
    value: served,
    onChange: (v) => { state.form.country = v; changed(); },
  });
  const valuesRange = rangeField(valuesCfg, L, {
    onChange: (v) => { state.form.values = v; changed(); },
  });
  const volumeRange = rangeField(volumeCfg, L, {
    onChange: (v) => { state.form.volume = v; changed(); },
  });

  const removedLive = el('span', 'quote-drawer-visually-hidden', { 'aria-live': 'polite' });
  const applyTypesFor = (solution) => {
    const removed = state.form.types.filter((t) => !allowedType(t, solution));
    state.form.types = state.form.types.filter((t) => allowedType(t, solution));
    removedLive.textContent = removed.length ? Q.types?.pairs.removed || '' : '';
  };
  const solutionGroup = tileGroup({
    label: Q.solution?.label || '',
    description: Q.solution?.description,
    columns: 2,
    options: Q.solution?.options || [],
    onChange: ([v]) => {
      const run = () => {
        state.form.solution = v;
        applyTypesFor(v);
        changed();
      };
      const hadSolution = state.form.solution !== null;
      if (hadSolution && document.startViewTransition && !prefersReducedMotion()) {
        document.startViewTransition(run);
      } else run();
    },
  });
  const typesGroup = tileGroup({
    label: Q.types?.label || '',
    description: Q.types?.description,
    multiple: true,
    columns: 3,
    options: Q.types?.options || [],
    onChange: (v) => {
      removedLive.textContent = '';
      state.form.types = v.filter((t) => allowedType(t, state.form.solution));
      changed();
    },
  });
  const typesReveal = reveal(typesGroup.el, removedLive);

  const carriersGroup = tileGroup({
    label: Q.carriers?.label || '',
    description: Q.carriers?.description,
    multiple: true,
    columns: 4,
    media: false,
    options: Q.carriers?.options || [],
    onChange: (v) => { state.form.carriers = v; changed(); },
  });
  const otherButtonWrap = el('div', 'quote-drawer-other');
  const otherButton = button(Q.carriers?.pairs.other || '', { variant: 'tertiary', size: 'small', leading: 'add' });
  otherButtonWrap.append(otherButton);
  const otherField = textField({ label: Q.carriers?.pairs.field || '', autocomplete: 'off' });
  otherField.el.classList.add('quote-drawer-grow');
  const otherCancel = button(Q.carriers?.pairs.cancel || '', { variant: 'tertiary' });
  const otherInline = el('div', 'quote-drawer-inline');
  otherInline.append(otherField.el, otherCancel);
  const otherReveal = reveal(otherInline);
  const carriersFields = el('div', 'quote-drawer-fields');
  carriersFields.append(carriersGroup.el, otherButtonWrap, otherReveal.el);
  const coverageGroup = tileGroup({
    label: Q.coverage?.label || '',
    description: Q.coverage?.description,
    columns: 3,
    options: Q.coverage?.options || [],
    onChange: ([v]) => { state.form.coverage = v; changed(); },
  });
  const laterBody = el('div', 'quote-drawer-stack');
  laterBody.append(carriersFields, coverageGroup.el);
  const laterReveal = reveal(laterBody);
  const arrive = el('div', 'quote-drawer-arrive', { 'aria-live': 'polite' });
  formStep.append(country.el, valuesRange.el, volumeRange.el, solutionGroup.el);
  formStep.append(typesReveal.el, laterReveal.el, arrive);

  otherButton.addEventListener('click', () => {
    state.form.otherOpen = true;
    changed();
    otherField.input.focus();
  });
  otherCancel.addEventListener('click', () => {
    state.form.otherOpen = false;
    state.form.other = '';
    otherField.input.value = '';
    changed();
    otherButton.focus();
  });
  otherField.input.addEventListener('input', () => { state.form.other = otherField.input.value; changed(); });

  /* form footer */
  const footInner = el('div', 'quote-drawer-foot-inner');
  const estimateWrap = el('div', 'quote-drawer-fade');
  const footActions = el('div', 'quote-drawer-actions');
  const continueButton = button(L.continue, { trailing: 'arrow_forward' });
  const expertButton = button(L.expert, { variant: 'secondary' });
  footActions.append(continueButton, expertButton);
  footInner.append(estimateWrap, footActions);
  foot.append(footInner);

  const rangeText = (rates) => {
    const f = state.form;
    const low = monthly(f.volume[0], rates.low, f.values[0]);
    const high = monthly(f.volume[1], rates.high, f.values[1]);
    const more = (valuesCfg.openEnded && f.values[1] >= valuesCfg.stops[valuesCfg.stops.length - 1])
      || (volumeCfg.openEnded && f.volume[1] >= volumeCfg.stops[volumeCfg.stops.length - 1]);
    return `${money0.format(low)} to ${money0.format(high)}${more ? '+' : ''}`;
  };
  const noteText = (rates) => fill(c.estimate.note, {
    low: money2.format(rates.low), high: money2.format(rates.high),
  });

  function estimateBlock() {
    const result = el('div', 'quote-drawer-result');
    result.append(el('p', 'quote-drawer-result-label', { text: c.estimate.label }));
    result.append(el('p', 'quote-drawer-result-value', { text: rangeText(c.estimate.rates) }));
    if (c.estimate.note) result.append(el('p', 'quote-drawer-result-note', { text: noteText(c.estimate.rates) }));
    return result;
  }

  /* the inline offer keeps its illustration while the products stay the same */
  const offerArt = { key: '', holder: null, fresh: false };
  function offerCard(result, compact) {
    const ids = result.products.filter((id) => c.products[id]);
    const first = c.products[ids[0]];
    const card = el('div', 'quote-drawer-offer', { 'data-compact': compact || undefined, 'data-brand': first?.brand || undefined });
    const headEl = el('div', 'quote-drawer-offer-head');
    const titleEl = el('div', 'quote-drawer-offer-title');
    titleEl.append(el('p', 'quote-drawer-offer-eyebrow', { text: c.rec.eyebrow }));
    titleEl.append(el('p', 'quote-drawer-offer-name', { text: ids.map((id) => c.products[id].name).join(` ${c.rec.or || 'or'} `) }));
    if (c.reasons[result.reason]) titleEl.append(el('p', 'quote-drawer-offer-reason', { text: c.reasons[result.reason] }));
    if (state.form.types.length) {
      const price = el('div', 'quote-drawer-offer-price');
      price.append(el('span', 'quote-drawer-offer-eyebrow', { text: c.estimate.label }));
      ids.forEach((id) => {
        const p = c.products[id];
        const est = el('span', 'quote-drawer-offer-estimate');
        if (ids.length > 1) est.append(el('span', 'quote-drawer-offer-eyebrow', { text: p.name }));
        est.append(el('span', 'quote-drawer-offer-amount', { text: rangeText(p.rates) }));
        est.append(el('span', 'quote-drawer-offer-eyebrow', { text: noteText(p.rates) }));
        price.append(est);
      });
      titleEl.append(price);
    }
    headEl.append(titleEl);
    if (first) {
      const brand = el('div', 'quote-drawer-offer-brand');
      if (first.logo) {
        brand.append(el('img', 'quote-drawer-offer-logo', { src: first.logo.getAttribute('src'), alt: first.logo.getAttribute('alt') || '' }));
      }
      const key = ids.join();
      let holder;
      if (compact && offerArt.key === key && offerArt.holder) holder = offerArt.holder;
      else {
        holder = artFor(first.art, 'quote-drawer-offer-art');
        if (compact) Object.assign(offerArt, { key, holder, fresh: true });
      }
      brand.append(holder);
      headEl.append(brand);
    }
    card.append(headEl);
    if (!compact && ids.length === 1 && first.points.length) {
      const list = el('ul', 'quote-drawer-points', { 'aria-label': first.name });
      first.points.forEach((pt) => {
        const li = el('li', 'quote-drawer-point');
        li.append(icon('check_circle', 16), el('span', '', { text: pt }));
        list.append(li);
      });
      card.append(list);
    }
    return card;
  }

  /* ----- recommend step ----- */
  const recStep = el('section', 'quote-drawer-step', { tabindex: '-1', 'data-step': 'recommend' });
  const handoffUrl = (id) => {
    const p = c.products[id];
    if (!p?.link) return '';
    const f = state.form;
    const url = new URL(p.link, window.location.href);
    url.searchParams.set('country', 'US');
    url.searchParams.set('avgpkgvalue', String(f.values[1]));
    url.searchParams.set('shipmenttype', f.types.join(','));
    url.searchParams.set('avgweeklyshipments', String(f.volume[1]));
    if (f.carriers.length) url.searchParams.set('carriers', f.carriers.map((v) => optionLabel('carriers', v)).join(','));
    url.searchParams.set('coveragetype', f.coverage.charAt(0).toUpperCase() + f.coverage.slice(1));
    return url.toString();
  };
  function renderRecommend() {
    const { result } = state;
    recStep.replaceChildren();
    if (!result) return;
    recStep.append(offerCard(result, false));
    const ids = result.products.filter((id) => c.products[id]);
    if (state.chosen && !ids.includes(state.chosen)) state.chosen = null;
    if (ids.length === 1) [state.chosen] = ids;
    const actions = el('div', 'quote-drawer-actions');
    const cont = button(c.rec.continue || L.continue, { trailing: 'arrow_forward' });
    const sync = () => {
      cont.disabled = !state.chosen;
      actions.dataset.brand = c.products[state.chosen]?.brand || '';
    };
    if (ids.length > 1) {
      const choose = tileGroup({
        label: c.rec.choose || '',
        columns: 2,
        media: false,
        options: ids.map((id) => ({ value: id, label: c.products[id].name })),
        onChange: ([v]) => { state.chosen = v; sync(); },
      });
      choose.setValue(state.chosen ? [state.chosen] : []);
      recStep.append(choose.el);
    }
    const fields = el('div', 'quote-drawer-fields');
    const expert = button(L.expert, { variant: inUs() ? 'secondary' : 'primary' });
    // eslint-disable-next-line no-use-before-define
    expert.addEventListener('click', () => goSales());
    cont.addEventListener('click', () => {
      const url = state.chosen && handoffUrl(state.chosen);
      if (url) window.location.assign(url);
    });
    actions.append(cont, expert);
    fields.append(actions);
    if (c.rec.privacy) fields.append(el('p', 'quote-drawer-note', { text: c.rec.privacy }));
    recStep.append(fields);
    sync();
  }

  /* ----- sales step ----- */
  const S = c.sales;
  const salesStep = el('section', 'quote-drawer-step', { tabindex: '-1', 'data-step': 'sales' });
  const outsideLead = el('p', 'quote-drawer-lead', { hidden: true });
  const graphic = el('div', 'quote-drawer-graphic');
  graphic.append(artFor(S.art, 'quote-drawer-graphic-art'));
  if (S.lead) graphic.append(el('p', 'quote-drawer-graphic-text', { text: S.lead }));
  const callout = el('div', 'quote-drawer-callout');
  const salesFields = el('div', 'quote-drawer-fields');
  const pair = el('div', 'quote-drawer-pair');
  const fFirst = textField({ label: S['first-name'] || '', required: true, autocomplete: 'given-name' });
  const fLast = textField({ label: S['last-name'] || '', required: true, autocomplete: 'family-name' });
  pair.append(fFirst.el, fLast.el);
  const fEmail = textField({
    label: S['business-email'] || '', required: true, type: 'email', autocomplete: 'email',
  });
  const fCompany = textField({ label: S['company-name'] || '', required: true, autocomplete: 'organization' });
  const fPostal = textField({ label: S['zip-code'] || '', required: true, autocomplete: 'postal-code' });
  const fPhone = textField({
    label: S.phone || '', type: 'tel', autocomplete: 'tel', inputmode: 'tel',
  });
  const send = button(S.send || '', { trailing: 'arrow_forward' });
  const sendActions = el('div', 'quote-drawer-actions');
  sendActions.append(send);
  salesFields.append(pair, fEmail.el, fCompany.el, fPostal.el, fPhone.el, sendActions);
  if (S.privacy) salesFields.append(el('p', 'quote-drawer-note', { text: S.privacy }));
  callout.append(salesFields);
  salesStep.append(outsideLead, graphic, callout);

  const salesErrors = () => {
    const us = inUs();
    const v = (f) => f.input.value.trim();
    return [
      [fFirst, !v(fFirst) && S.required],
      [fLast, !v(fLast) && S.required],
      [fEmail, !EMAIL.test(v(fEmail)) && S['email-error']],
      [fCompany, !v(fCompany) && S.required],
      [fPostal, !(us ? ZIP : POSTAL).test(v(fPostal)) && (us ? S['zip-error'] : S['postal-error'])],
      [fPhone, !validPhone(fPhone.input.value, us) && (us ? S['phone-error'] : S['phone-international-error'])],
    ];
  };
  const showSalesErrors = () => {
    const errs = salesErrors();
    if (state.salesAttempted) errs.forEach(([f, msg]) => f.setError(msg || ''));
    return errs.filter(([, msg]) => msg);
  };
  [fFirst, fLast, fEmail, fCompany, fPostal, fPhone].forEach((f) => f.input.addEventListener('input', showSalesErrors));
  fPhone.input.addEventListener('input', () => {
    const formatted = formatPhone(fPhone.input.value, inUs());
    if (formatted !== fPhone.input.value) fPhone.input.value = formatted;
  });
  /* no lead API here: once valid, continue on the contact page (nothing is submitted) */
  send.addEventListener('click', () => {
    state.salesAttempted = true;
    const errs = showSalesErrors();
    if (errs.length) {
      errs[0][0].input.focus();
      return;
    }
    if (S['contact-page']) window.location.assign(S['contact-page']);
  });

  body.append(formStep, recStep, salesStep);

  /* ----- state -> DOM ----- */
  let lastComplete = false;
  function update() {
    const f = state.form;
    const us = inUs();
    const hasTypes = f.types.length > 0;
    const valid = recommend(f) !== null;
    const complete = us && valid;
    solutionGroup.setValue(f.solution ? [f.solution] : []);
    const visibleTypes = typesGroup.show((v) => allowedType(v, f.solution));
    typesGroup.tiles.dataset.columns = visibleTypes === 2 ? '2' : '3';
    typesGroup.setValue(f.types);
    typesReveal.set(f.solution !== null);
    carriersGroup.setValue(f.carriers);
    coverageGroup.setValue(f.coverage ? [f.coverage] : []);
    laterReveal.set(hasTypes);
    const otherOpen = f.otherOpen || f.other.trim() !== '';
    otherButtonWrap.hidden = otherOpen;
    otherReveal.set(otherOpen);

    /* footer */
    estimateWrap.replaceChildren();
    if (hasTypes && !complete) estimateWrap.append(estimateBlock());
    estimateWrap.hidden = !estimateWrap.children.length;
    continueButton.hidden = !us;
    continueButton.disabled = !valid;
    continueButton.querySelector('.quote-drawer-button-label').textContent = complete ? L.continueQuote : L.continue;
    expertButton.dataset.variant = us ? 'secondary' : 'primary';
    const rec = complete ? recommend(f) : null;
    footActions.dataset.brand = rec ? c.products[rec.products[0]]?.brand || '' : '';

    /* inline recommendation once every answer is in */
    arrive.replaceChildren();
    arrive.hidden = !rec;
    if (rec) {
      arrive.append(offerCard(rec, true));
      if (offerArt.fresh) {
        offerArt.fresh = false;
        replayArt(arrive);
      }
      if (!lastComplete && dialog.open) {
        requestAnimationFrame(() => arrive.scrollIntoView({ block: 'end', behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
      }
    }
    lastComplete = Boolean(rec);
  }

  function show(step, { focus = true } = {}) {
    state.step = step;
    dialog.dataset.step = step;
    country.close();
    formStep.hidden = step !== 'form';
    recStep.hidden = step !== 'recommend';
    salesStep.hidden = step !== 'sales';
    foot.hidden = step !== 'form';
    const titles = { form: c.title, recommend: c.rec.title, sales: S.title };
    title.textContent = titles[step] || '';
    const back = { recommend: 'form', sales: state.previous };
    backButton.hidden = !back[step];
    if (step === 'recommend') renderRecommend();
    if (step === 'sales') {
      outsideLead.hidden = inUs();
      outsideLead.textContent = fill(c.outside, { country: state.form.country });
      fPostal.setLabel(inUs() ? S['zip-code'] || '' : S['postal-code'] || S['zip-code'] || '');
      fPostal.input.inputMode = inUs() ? 'numeric' : 'text';
    }
    const active = { form: formStep, recommend: recStep, sales: salesStep }[step];
    replayArt(active);
    if (focus) {
      body.scrollTo({ top: 0 });
      active.focus({ preventScroll: true });
    }
  }

  function goSales() {
    state.previous = state.step === 'sales' ? state.previous : state.step;
    state.salesAttempted = false;
    show('sales');
  }

  backButton.addEventListener('click', () => {
    const target = state.step === 'sales' ? state.previous : 'form';
    if (target) show(target);
  });
  expertButton.addEventListener('click', goSales);
  continueButton.addEventListener('click', () => {
    const result = recommend(state.form);
    if (!result) return;
    if (!inUs()) {
      goSales();
      return;
    }
    state.result = result;
    state.chosen = result.products.length === 1 ? result.products[0] : null;
    show('recommend');
  });

  /* ----- open / close ----- */
  const legacy = !(window.CSS && CSS.supports('transition-behavior', 'allow-discrete'));
  if (legacy) block.classList.add('quote-drawer-legacy');
  let launcher = null;
  let savedOverflow = '';

  const finishClose = () => {
    if (dialog.open) dialog.close();
  };

  function closeSheet() {
    if (!dialog.open) return;
    if (!legacy) {
      dialog.close();
      return;
    }
    dialog.classList.remove('is-open');
    const done = () => {
      dialog.removeEventListener('transitionend', done);
      finishClose();
    };
    dialog.addEventListener('transitionend', done);
    setTimeout(done, 400);
  }

  function openSheet({ entry = 'estimate', values, trigger } = {}) {
    launcher = trigger || document.activeElement;
    const heroCard = document.querySelector('.hero-calculator-card');
    const heroValues = heroCard?.dataset.min
      ? [Number(heroCard.dataset.min), Number(heroCard.dataset.max)] : null;
    const start = values || heroValues;
    if (start && start.every(Number.isFinite)) {
      state.form.values = [Math.min(...start), Math.max(...start)];
      valuesRange.setValues(state.form.values);
      state.form.values = valuesRange.values();
    }
    state.previous = null;
    state.salesAttempted = false;
    [fFirst, fLast, fEmail, fCompany, fPostal, fPhone].forEach((f) => f.setError(''));
    update();
    if (!dialog.open) {
      savedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
      if (legacy) requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
    }
    show(entry === 'sales' ? 'sales' : 'form', { focus: false });
    body.scrollTo({ top: 0 });
    dialog.focus({ preventScroll: true });
  }

  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = savedOverflow;
    dialog.classList.remove('is-open');
    country.close();
    const target = launcher && launcher.isConnected ? launcher : dockButton;
    target.focus({ preventScroll: true });
  });
  if (legacy) {
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeSheet();
    });
  }
  /* light dismiss: native closedby="any", or a click on the backdrop where unsupported */
  if (!supportsClosedBy) {
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right
        && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeSheet();
    });
  }
  closeButton.addEventListener('click', closeSheet);
  dockButton.addEventListener('click', () => openSheet({ entry: 'estimate', trigger: dockButton }));
  document.addEventListener(OPEN_EVENT, (e) => {
    e.preventDefault();
    openSheet({ ...(e.detail || {}) });
  });

  /* ----- dock visibility: past 60% of the hero ----- */
  const main = block.closest('main') || document;
  const heroSection = () => main.querySelector('.hero-calculator')?.closest('.section')
    || main.querySelector('.section');
  let ticking = false;
  const syncDock = () => {
    ticking = false;
    const hero = heroSection();
    const visible = hero ? window.scrollY > hero.offsetHeight * 0.6 : true;
    dock.toggleAttribute('data-visible', visible);
    dock.inert = !visible;
    if (visible) dock.removeAttribute('aria-hidden');
    else dock.setAttribute('aria-hidden', 'true');
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncDock);
  }, { passive: true });

  block.replaceChildren(dock, dialog);
  update();
  show('form', { focus: false });
  syncDock();
}
