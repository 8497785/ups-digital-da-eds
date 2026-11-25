/*
 * hero-calculator
 * Row 1: [text cell: H1, paragraph, CTA] [calculator cell: heading, config list,
 * result label, CTA link, disclaimer]. The block draws the isometric "lattice"
 * background into a 2D canvas (fades in once, then static) and turns the
 * calculator cell into a two-handle package-value range with a live premium estimate.
 *
 * Premium formula (from the source bundle): low = minValue * 0.80 / 100,
 * high = maxValue * 1.05 / 100, "+" when the upper handle sits on the open-ended last stop.
 */

const DEFAULTS = {
  valueLabel: 'Package value',
  resultLabel: 'Estimated premium per package',
  stops: [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000,
    7500, 10000, 15000, 20000, 30000, 40000, 50000],
  start: [100, 1000],
  rateLow: 0.8,
  rateHigh: 1.05,
  bars: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  openEnded: true,
};

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

const money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function parseAmount(text) {
  const m = String(text).replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*(k|m)?/i);
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]?.toLowerCase() === 'k') v *= 1e3;
  if (m[2]?.toLowerCase() === 'm') v *= 1e6;
  return v;
}

const parseList = (text) => text.split(/[,;|]/).map(parseAmount).filter(Number.isFinite);

function parseRange(text) {
  let parts = String(text).split(/\s+(?:to|-|–|—)\s+|\s*[–—]\s*/i).map(parseAmount);
  if (parts.length < 2) parts = String(text).split('-').map(parseAmount);
  return parts.length >= 2 && parts.every(Number.isFinite) ? [parts[0], parts[1]] : null;
}

/** Reads `key: value` list items into a config object. Unknown keys are ignored. */
function readConfig(list) {
  const config = { ...DEFAULTS, start: [...DEFAULTS.start] };
  if (!list) return config;
  [...list.querySelectorAll('li')].forEach((li) => {
    const text = li.textContent.trim();
    const i = text.indexOf(':');
    if (i < 0) return;
    const key = text.slice(0, i).trim().toLowerCase();
    const value = text.slice(i + 1).trim();
    if (!value) return;
    if (/^result|premium/.test(key)) config.resultLabel = value;
    else if (/label|slider/.test(key)) config.valueLabel = value;
    else if (/^(min|from|low|start)/.test(key) && !/rate/.test(key)) {
      const v = parseAmount(value);
      if (Number.isFinite(v)) config.start[0] = v;
    } else if (/^(max|to|high|end)/.test(key) && !/rate/.test(key)) {
      const v = parseAmount(value);
      if (Number.isFinite(v)) config.start[1] = v;
    } else if (/^(default|range)/.test(key)) {
      const r = parseRange(value);
      if (r) config.start = r;
    } else if (/^(stops|scale|values|steps)/.test(key)) {
      const s = parseList(value).sort((a, b) => a - b);
      if (s.length >= 2) config.stops = [...new Set(s)];
    } else if (/rate/.test(key) && /(low|min)/.test(key)) {
      const v = parseAmount(value);
      if (Number.isFinite(v)) config.rateLow = v;
    } else if (/rate/.test(key) && /(high|max)/.test(key)) {
      const v = parseAmount(value);
      if (Number.isFinite(v)) config.rateHigh = v;
    } else if (/^(bars|histogram)/.test(key)) {
      const b = parseList(value);
      if (b.length) config.bars = b;
    } else if (/^open/.test(key)) {
      config.openEnded = !/^(no|false|off|0)$/i.test(value);
    }
  });
  return config;
}

const nearestIndex = (stops, v) => stops.reduce(
  (best, s, i) => (Math.abs(s - v) < Math.abs(stops[best] - v) ? i : best),
  0,
);

/* ---------- lattice background (port of the source "lattice" pattern) ---------- */

/* eslint-disable no-bitwise -- integer hash ported from the source pattern */
function hash(a, b = 0, c = 0, d = 0) {
  let i = (Math.imul(a | 0, 668265261) ^ Math.imul(b | 0, 374761393)
    ^ Math.imul(c | 0, 2654435761) ^ Math.imul(d | 0, 2246822519)) >>> 0;
  i = Math.imul(i ^ (i >>> 15), 739982445) >>> 0;
  i = Math.imul(i ^ (i >>> 12), 695872825) >>> 0;
  i = (i ^ (i >>> 15)) >>> 0;
  return i / 4294967296;
}
/* eslint-enable no-bitwise */

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const ISO_H = Math.asin(Math.tan((17.5 * Math.PI) / 180));
/* source hero config: lattice, accent 0, pointer on, pointerStrength 1 (speed 1, seed 7) */
const LATTICE = {
  cell: 104, density: 0.62, seed: 7, node: 2.2, pointerStrength: 1, speed: 1, still: 5200,
};
/* source palette (light theme), resolved from its CSS custom properties */
const LATTICE_TOKENS = {
  hair: '#b2b2bb',
  hairLow: '#1a1a1f1f',
  'teal-strong': '#0a8080',
  'blue-strong': '#0662bb',
  'gold-strong': '#fcc400',
};
/* resolved like the source (_d + um): painted on a 1x1 canvas and read back as rgba() */
const LATTICE_COLORS = {};
function resolveLatticeColors() {
  if (Object.keys(LATTICE_COLORS).length) return;
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  Object.entries(LATTICE_TOKENS).forEach(([name, css]) => {
    if (!pctx) {
      LATTICE_COLORS[name] = css;
      return;
    }
    pctx.clearRect(0, 0, 1, 1);
    pctx.fillStyle = css;
    pctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = pctx.getImageData(0, 0, 1, 1).data;
    LATTICE_COLORS[name] = `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
  });
}
/* colour wheel: teal -> blue -> gold, one turn every 18 s (source pS / mS / hS) */
const WHEEL = ['teal', 'blue', 'gold'];
const WHEEL_MS = 18000;
function wheelTone(time, offset, pick) {
  const n = WHEEL.length;
  const r = ((((time / WHEEL_MS + offset) % 1) + 1) % 1) * n;
  const i = Math.floor(r) % n;
  const mix = smoothstep(0.55, 1, r - Math.floor(r));
  return pick < mix ? WHEEL[(i + 1) % n] : WHEEL[i];
}

/* pointer influence (source hm): full within 30% of the radius, eased out to the radius */
function pointerInfluence(pointer, radius, x, y) {
  if (!pointer || pointer.amount <= 0.001) return 0;
  const dx = x - pointer.x;
  const dy = y - pointer.y;
  if (dx > radius || dx < -radius || dy > radius || dy < -radius) return 0;
  return pointer.amount * (1 - smoothstep(radius * 0.3, radius, Math.hypot(dx, dy)));
}

/*
 * Batched canvas painter (source cm/pm): shapes with the same paint and alpha share one path,
 * alpha is quantised to 1/24 steps, groups are emitted in first-use order on flush.
 */
const ALPHA_STEPS = 24;
class LatticePainter {
  constructor(ctx) {
    this.ctx = ctx;
    this.open = new Map();
    this.order = [];
  }

  sink(paint, alpha) {
    const q = Math.round(Math.min(1, alpha) * ALPHA_STEPS);
    if (q <= 0) return null;
    const key = `${paint.fill || ''}|${paint.stroke || ''}|${paint.width || 1}|${q}`;
    let group = this.open.get(key);
    if (!group) {
      group = { paint, alpha: q / ALPHA_STEPS, path: new Path2D() };
      this.open.set(key, group);
      this.order.push(group);
    }
    return group.path;
  }

  line(paint, x1, y1, x2, y2, alpha = 1) {
    const path = this.sink(paint, alpha);
    if (!path) return;
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
  }

  circle(paint, x, y, r, alpha = 1) {
    if (r <= 0.05) return;
    const path = this.sink(paint, alpha);
    if (!path) return;
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, Math.PI * 2);
  }

  flush() {
    const { ctx } = this;
    this.order.forEach(({ paint, alpha, path }) => {
      ctx.globalAlpha = alpha;
      if (paint.fill) {
        ctx.fillStyle = LATTICE_COLORS[paint.fill];
        ctx.fill(path);
      }
      if (paint.stroke) {
        ctx.strokeStyle = LATTICE_COLORS[paint.stroke];
        ctx.lineWidth = paint.width || 1;
        ctx.setLineDash([]);
        ctx.stroke(path);
      }
    });
    ctx.globalAlpha = 1;
    this.open = new Map();
    this.order = [];
  }
}

/* builds the lattice nodes and edges for a w x h band (geometry as the source yS) */
function buildLattice(w, h) {
  const n = LATTICE.cell;
  const a = Math.SQRT1_2 * n;
  const o = Math.SQRT1_2 * Math.sin(ISO_H) * n;
  const wide = w >= 768;
  /* source anchors the lattice at 71% of the band width when wide (measured phase 0.71w at
     768-1440), at the centre on narrow screens */
  const cx = wide ? w * 0.71 : w / 2;
  const cy = h / 2;
  const pad = n * 0.6;
  /* wide: densest on the right (behind the calculator), soft top/bottom edges;
     narrow: the canvas is a band below the text, full at its top, fading over its lower third */
  /* wide = source frame "left" (Vf + Kf): zone from 58% of the width, feathered over 16% of
     the width on the left and 7% of the height top and bottom */
  const fadeAt = (x, y) => {
    if (!wide) return 1 - smoothstep(h * 0.64, h, y);
    const l = h * 0.07;
    const edgeFade = smoothstep(0, l, y) * (1 - smoothstep(h - l, h, y));
    return smoothstep(w * 0.42, w * 0.58, x) * edgeFade;
  };

  const i0 = Math.floor((-pad - cx) / a);
  const i1 = Math.ceil((w + pad - cx) / a);
  const j0 = Math.floor((-pad - cy) / o);
  const j1 = Math.ceil((h + pad - cy) / o);
  const nodes = [];
  const index = new Map();
  const key = (i, j) => (i + 4096) * 8192 + (j + 4096);
  for (let j = j0; j <= j1; j += 1) {
    for (let i = i0; i <= i1; i += 1) {
      if ((((i + j) % 2) + 2) % 2 === 0) {
        const x = cx + i * a;
        const y = cy + j * o;
        const fade = fadeAt(x, y);
        if (fade > 0.02) {
          index.set(key(i, j), nodes.length);
          nodes.push({
            x, y, fade, adj: 0,
          });
        }
      }
    }
  }
  const edges = [];
  const along = 0.3 + LATTICE.density * 0.55;
  const down = 0.2 + LATTICE.density * 0.5;
  const link = (p, q, limit, r) => {
    if (p === undefined || q === undefined || r >= limit) return;
    edges.push([p, q]);
    nodes[p].adj += 1;
    nodes[q].adj += 1;
  };
  for (let j = j0; j <= j1; j += 1) {
    for (let i = i0; i <= i1; i += 1) {
      const p = index.get(key(i, j));
      if (p !== undefined) {
        const f = nodes[p].fade ** 0.6;
        link(p, index.get(key(i + 1, j + 1)), along * f, hash(i, j, 1, LATTICE.seed));
        link(p, index.get(key(i - 1, j + 1)), along * f, hash(i, j, 2, LATTICE.seed));
        link(p, index.get(key(i, j + 2)), down * f, hash(i, j, 3, LATTICE.seed));
      }
    }
  }
  nodes.forEach((node) => {
    const isolated = !node.adj && node.fade > 0.6;
    if (isolated && hash(Math.round(node.x), Math.round(node.y), 4, LATTICE.seed) < 0.7) {
      node.fade = 0;
    }
  });
  return { nodes, edges };
}

const PAINT = {
  hairLow: { stroke: 'hairLow' },
  hair: { stroke: 'hair' },
  node: { fill: 'hair' },
};
const tonePaint = new Map();
const toned = (tone, fill) => {
  const k = `${tone}${fill}`;
  if (!tonePaint.has(k)) {
    tonePaint.set(k, fill ? { fill: `${tone}-strong` } : { stroke: `${tone}-strong`, width: 2 });
  }
  return tonePaint.get(k);
};

/*
 * One frame (source yS draw, accent 0): hairline edges and grey nodes; near the pointer the
 * lattice comes forward (darker edges, nodes up to 1.5x) and the nearest edges and their nodes
 * light up in the colour wheel tone.
 */
function renderLattice(painter, { nodes, edges }, time, pointer) {
  const radius = 70 + 150 * LATTICE.pointerStrength;
  const near = pointer
    ? nodes.map((node) => pointerInfluence(pointer, radius, node.x, node.y))
    : null;
  const lit = near ? new Float32Array(nodes.length) : null;
  const litTone = lit ? nodes.map(() => null) : [];
  const later = [];
  edges.forEach(([p, q], e) => {
    const A = nodes[p];
    const B = nodes[q];
    const d = Math.min(A.fade, B.fade);
    painter.line(PAINT.hairLow, A.x, A.y, B.x, B.y, 0.35 + 0.65 * d);
    if (!near) return;
    const f = Math.min(near[p], near[q]);
    if (f > 0.02) painter.line(PAINT.hair, A.x, A.y, B.x, B.y, f * d);
    if (f > 0.35) {
      const alpha = Math.min(1, (f - 0.35) * 1.8) * d;
      const tone = wheelTone(time, -0.06 * (1 - f), hash(e, 6, 0, LATTICE.seed));
      later.push(() => painter.line(toned(tone, false), A.x, A.y, B.x, B.y, alpha));
      [p, q].forEach((k) => {
        if (alpha > lit[k]) {
          lit[k] = alpha;
          litTone[k] = tone;
        }
      });
    }
  });
  painter.flush();
  later.forEach((draw) => draw());
  painter.flush();
  const litNodes = [];
  nodes.forEach((node, k) => {
    if (node.fade <= 0) return;
    const r = LATTICE.node * (near ? 1 + near[k] * 0.5 : 1);
    const on = lit ? lit[k] : 0;
    painter.circle(PAINT.node, node.x, node.y, r, (0.35 + 0.65 * node.fade) * (1 - on));
    if (on > 0.02 && litTone[k]) {
      litNodes.push(() => painter.circle(toned(litTone[k], true), node.x, node.y, r, on));
    }
  });
  painter.flush();
  litNodes.forEach((draw) => draw());
  painter.flush();
}

function mountLattice(block, text) {
  const host = document.createElement('div');
  host.className = 'hero-calculator-lattice';
  host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  host.append(canvas);
  block.prepend(host);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  resolveLatticeColors();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* source narrow pattern is a band: it starts where the text column ends (behind the card) */
  const place = () => {
    const band = text && block.querySelector('.hero-calculator-card') && block.clientWidth < 768;
    const top = band ? `${text.offsetTop + text.offsetHeight}px` : '';
    if (host.style.top !== top) host.style.top = top;
  };

  let geometry = null;
  let size = [0, 0];
  let dpr = 1;
  /* pattern clock: runs while the band is on screen (source: time advances every visible frame) */
  let clock = LATTICE.still;
  let visibleSince = 0;
  const now = () => clock + (visibleSince ? (performance.now() - visibleSince) * LATTICE.speed : 0);
  const target = { x: 0, y: 0, inside: false };
  const pointer = { x: 0, y: 0, amount: 0 };

  const paint = (withPointer) => {
    if (!geometry) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size[0], size[1]);
    const active = withPointer && pointer.amount > 0.001 ? pointer : null;
    renderLattice(new LatticePainter(ctx), geometry, now(), active);
  };
  const layout = () => {
    place();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    size = [w, h];
    geometry = buildLattice(w, h);
    paint(true);
    canvas.dataset.live = 'true';
  };

  /* pointer easing as the source: position follows with 1 - e^(-dt/90), presence with
     1 - e^(-dt/160) (half of --m-duration-slow); frames run only while something moves */
  let raf = 0;
  let last = 0;
  let visible = false;
  const frame = (t) => {
    raf = 0;
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    const follow = 1 - Math.exp(-dt / 90);
    const settle = 1 - Math.exp(-dt / 160);
    if (pointer.amount < 0.002 && target.inside) {
      pointer.x = target.x;
      pointer.y = target.y;
    }
    pointer.x += (target.x - pointer.x) * follow;
    pointer.y += (target.y - pointer.y) * follow;
    pointer.amount += (Number(target.inside) - pointer.amount) * settle;
    const moving = Math.abs(Number(target.inside) - pointer.amount) > 0.002
      || Math.hypot(target.x - pointer.x, target.y - pointer.y) > 0.5;
    if (!moving && !target.inside) pointer.amount = 0;
    paint(true);
    /* keep animating while the tone wheel matters (pointer present) or the pointer settles */
    if (visible && (moving || target.inside)) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const kick = () => {
    if (!raf && visible && geometry && !reduced.matches) raf = requestAnimationFrame(frame);
  };
  block.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reduced.matches) return;
    const r = canvas.getBoundingClientRect();
    target.x = e.clientX - r.left;
    target.y = e.clientY - r.top;
    target.inside = true;
    kick();
  });
  block.addEventListener('pointerleave', () => {
    target.inside = false;
    kick();
  });
  const io = new IntersectionObserver(([entry]) => {
    const on = entry.isIntersecting && document.visibilityState !== 'hidden';
    if (on === visible) return;
    visible = on;
    if (on) visibleSince = performance.now();
    else {
      clock = now();
      visibleSince = 0;
    }
    if (on) kick();
  });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    const on = document.visibilityState !== 'hidden';
    if (!on && visible) {
      clock = now();
      visibleSince = 0;
      visible = false;
    }
  });

  let pending = 0;
  const relayout = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      layout();
    });
  };
  const ro = new ResizeObserver(() => {
    if (!block.isConnected) {
      ro.disconnect();
      io.disconnect();
      return;
    }
    relayout();
  });
  ro.observe(host);
  ro.observe(block);
}

/* ---------- calculator ---------- */

function buildCalculator(cell) {
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const list = cell.querySelector('ul, ol');
  const config = readConfig(list);
  const ctaLink = [...cell.querySelectorAll('a[href]')].pop();
  const ctaBlock = ctaLink ? (ctaLink.closest('p') || ctaLink) : null;
  const texts = [...cell.querySelectorAll('p')]
    .filter((p) => p !== ctaBlock && !p.querySelector('a, picture, img') && p.textContent.trim());
  let note = null;
  if (texts.length) {
    const last = texts[texts.length - 1];
    const all = [...cell.querySelectorAll('*')];
    const afterCta = ctaBlock && all.indexOf(last) > all.indexOf(ctaBlock);
    if (texts.length > 1 || afterCta) {
      note = texts.pop();
    }
  }
  const labelP = texts.shift();
  if (labelP && !list?.textContent.match(/result\s*:/i)) {
    config.resultLabel = labelP.textContent.replace(/[:\s]*\$[\d.,]+.*$/, '').trim() || config.resultLabel;
  }

  const { stops } = config;
  const last = stops.length - 1;
  let lo = nearestIndex(stops, Math.min(...config.start));
  let hi = nearestIndex(stops, Math.max(...config.start));

  const card = document.createElement('section');
  card.className = 'hero-calculator-card';
  const titleId = nextId('hero-calculator-title');
  if (heading) {
    heading.id = heading.id || titleId;
    heading.classList.add('hero-calculator-title');
    card.setAttribute('aria-labelledby', heading.id);
    card.append(heading);
  }

  const term = document.createElement('div');
  term.className = 'hero-calculator-term';

  const bars = document.createElement('div');
  bars.className = 'hero-calculator-bars';
  bars.setAttribute('aria-hidden', 'true');
  const maxBar = Math.max(...config.bars, 1);
  const barEls = stops.map((_, i) => {
    const bar = document.createElement('span');
    const v = config.bars[Math.min(i, config.bars.length - 1)] ?? 1;
    bar.style.setProperty('--bar', (v / maxBar).toFixed(3));
    bar.style.setProperty('--i', String(i));
    bars.append(bar);
    return bar;
  });

  const sliderId = nextId('hero-calculator-value');
  const head = document.createElement('div');
  head.className = 'hero-calculator-slider-head';
  const label = document.createElement('span');
  label.className = 'hero-calculator-label';
  label.id = sliderId;
  label.textContent = config.valueLabel;
  const readout = document.createElement('output');
  readout.className = 'hero-calculator-readout';
  head.append(label, readout);

  const track = document.createElement('div');
  track.className = 'hero-calculator-track';
  const band = document.createElement('div');
  band.className = 'hero-calculator-band';
  const makeInput = (name, value) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = String(last);
    input.step = '1';
    input.value = String(value);
    input.className = `hero-calculator-thumb hero-calculator-thumb-${name}`;
    input.setAttribute('aria-label', `${name === 'min' ? 'Minimum' : 'Maximum'} ${config.valueLabel.toLowerCase()}`);
    input.setAttribute('aria-describedby', sliderId);
    return input;
  };
  const inputA = makeInput('min', lo);
  const inputB = makeInput('max', hi);
  /* value bubble above each handle while it is dragged or keyboard-focused (source readout) */
  const makeBubble = (name) => {
    const bubble = document.createElement('span');
    bubble.className = `hero-calculator-bubble hero-calculator-bubble-${name}`;
    bubble.setAttribute('aria-hidden', 'true');
    return bubble;
  };
  const bubbleA = makeBubble('min');
  const bubbleB = makeBubble('max');
  /* drawn handles (source ._thumb_n76cl_90); invisible native inputs above take pointer and keys */
  const makeHandle = () => {
    const h = document.createElement('span');
    h.className = 'hero-calculator-handle';
    h.setAttribute('aria-hidden', 'true');
    return h;
  };
  const handleA = makeHandle();
  const handleB = makeHandle();
  /* inactive rails with their end-stop dots (source ._rail_n76cl_33) */
  const makeRail = (side) => {
    const r = document.createElement('span');
    r.className = 'hero-calculator-rail';
    r.dataset.side = side;
    r.setAttribute('aria-hidden', 'true');
    return r;
  };
  track.append(makeRail('start'), makeRail('end'), band, handleA, handleB, inputA, inputB, bubbleA, bubbleB);
  [[inputA, handleA], [inputB, handleB]].forEach(([input, h]) => {
    input.addEventListener('pointerenter', () => { h.dataset.hovered = 'true'; });
    input.addEventListener('pointerleave', () => { delete h.dataset.hovered; });
    input.addEventListener('focus', () => {
      if (input.matches(':focus-visible')) h.dataset.focusVisible = 'true';
    });
    input.addEventListener('keydown', () => { h.dataset.focusVisible = 'true'; });
    input.addEventListener('blur', () => { delete h.dataset.focusVisible; });
    input.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      h.dataset.dragging = 'true';
      input.dataset.dragging = 'true';
      const end = () => {
        delete h.dataset.dragging;
        delete input.dataset.dragging;
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  });

  term.append(bars, head, track);

  const outcome = document.createElement('div');
  outcome.className = 'hero-calculator-outcome';
  const resultId = nextId('hero-calculator-result');
  const resultLabel = document.createElement('span');
  resultLabel.className = 'hero-calculator-result-label';
  resultLabel.id = resultId;
  resultLabel.textContent = config.resultLabel;
  const figure = document.createElement('span');
  figure.className = 'hero-calculator-figure';
  const reserve = document.createElement('span');
  reserve.className = 'hero-calculator-figure-reserve';
  reserve.setAttribute('aria-hidden', 'true');
  reserve.textContent = `${money2.format((stops[last] * config.rateLow) / 100)} to ${money2.format((stops[last] * config.rateHigh) / 100)}${config.openEnded ? '+' : ''}`;
  const value = document.createElement('span');
  value.className = 'hero-calculator-figure-value';
  figure.append(reserve, value);
  const result = document.createElement('div');
  result.className = 'hero-calculator-result';
  result.setAttribute('role', 'group');
  result.setAttribute('aria-labelledby', resultId);
  result.append(resultLabel, figure);
  outcome.append(result);
  if (ctaBlock) {
    ctaBlock.classList.add('hero-calculator-action');
    outcome.append(ctaBlock);
  }

  const live = document.createElement('p');
  live.className = 'hero-calculator-live';
  live.setAttribute('aria-live', 'polite');

  card.append(term, outcome, live);
  texts.forEach((p) => card.append(p));
  if (note) {
    note.classList.add('hero-calculator-note');
    card.append(note);
  }

  const fmtStop = (i) => `${money0.format(stops[i])}${config.openEnded && i === last ? '+' : ''}`;
  let announced = '';
  let liveTimer = 0;
  const update = () => {
    const a = Number(inputA.value);
    const b = Number(inputB.value);
    lo = Math.min(a, b);
    hi = Math.max(a, b);
    inputA.setAttribute('aria-valuetext', fmtStop(a));
    inputB.setAttribute('aria-valuetext', fmtStop(b));
    readout.textContent = `${fmtStop(lo)} to ${fmtStop(hi)}`;
    const pct = (i) => (last ? (i / last) * 100 : 0);
    /* rails, band and handles are positioned in CSS from these percentages */
    track.style.setProperty('--lo', pct(lo).toFixed(4));
    track.style.setProperty('--hi', pct(hi).toFixed(4));
    bubbleA.textContent = fmtStop(a);
    bubbleB.textContent = fmtStop(b);
    bubbleA.style.setProperty('--at', pct(a).toFixed(4));
    bubbleB.style.setProperty('--at', pct(b).toFixed(4));
    handleA.style.setProperty('--at', pct(a).toFixed(4));
    handleB.style.setProperty('--at', pct(b).toFixed(4));
    barEls.forEach((bar, i) => bar.classList.toggle('is-selected', i >= lo && i <= hi));
    const text = `${money2.format((stops[lo] * config.rateLow) / 100)} to ${money2.format((stops[hi] * config.rateHigh) / 100)}${config.openEnded && hi === last ? '+' : ''}`;
    value.textContent = text;
    card.dataset.min = String(stops[lo]);
    card.dataset.max = String(stops[hi]);
    if (!announced) {
      announced = text;
      return;
    }
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      if (text === announced) return;
      announced = text;
      live.textContent = `${config.resultLabel}: ${text}`;
    }, 500);
  };
  inputA.addEventListener('input', update);
  inputB.addEventListener('input', update);

  /* drag the selected band to move both handles together */
  band.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const width = track.getBoundingClientRect().width || 1;
    const startLo = lo;
    const startHi = hi;
    band.setPointerCapture(e.pointerId);
    const move = (ev) => {
      let shift = Math.round(((ev.clientX - startX) / width) * last);
      shift = Math.max(-startLo, Math.min(last - startHi, shift));
      inputA.value = String(startLo + shift);
      inputB.value = String(startHi + shift);
      update();
    };
    const end = () => {
      band.removeEventListener('pointermove', move);
      band.removeEventListener('pointerup', end);
      band.removeEventListener('pointercancel', end);
    };
    band.addEventListener('pointermove', move);
    band.addEventListener('pointerup', end);
    band.addEventListener('pointercancel', end);
  });

  update();
  return card;
}

/** Marks link-only paragraphs as actions and keeps punctuation after accent words teal. */
function decorateText(text) {
  text.querySelectorAll('p').forEach((p) => {
    const links = [...p.querySelectorAll('a[href]')];
    const linkText = links.map((a) => a.textContent).join('').replace(/\s+/g, '');
    if (links.length && p.textContent.replace(/\s+/g, '') === linkText) {
      p.classList.add('hero-calculator-actions');
      links.forEach((a) => a.classList.add('hero-calculator-cta'));
    }
  });
  /* the source sets the words before the first accent on their own line */
  const h1 = text.querySelector('h1');
  const firstAccent = h1?.querySelector(':scope > em, :scope > i');
  if (firstAccent && firstAccent.previousSibling?.textContent.trim()) {
    const lead = document.createElement('span');
    const rest = document.createElement('span');
    lead.className = 'hero-calculator-line';
    rest.className = 'hero-calculator-line';
    const nodes = [...h1.childNodes];
    const at = nodes.indexOf(firstAccent);
    lead.append(...nodes.slice(0, at));
    /* with several accents the last one starts a third line ("stolen shipments"), as the source */
    const accents = nodes.filter((n) => n.nodeType === Node.ELEMENT_NODE && /^(EM|I)$/.test(n.tagName));
    const lastAt = accents.length > 1 ? nodes.indexOf(accents[accents.length - 1]) : -1;
    if (lastAt > at) {
      const tail = document.createElement('span');
      tail.className = 'hero-calculator-line';
      rest.append(...nodes.slice(at, lastAt));
      tail.append(...nodes.slice(lastAt));
      h1.replaceChildren(lead, ' ', rest, ' ', tail);
    } else {
      rest.append(...nodes.slice(at));
      h1.replaceChildren(lead, ' ', rest);
    }
  }
  text.querySelectorAll('h1 em, h1 i').forEach((em) => {
    const next = em.nextSibling;
    if (next?.nodeType !== Node.TEXT_NODE) return;
    const [punct] = next.textContent.match(/^[,;:.!?]+/) || [];
    if (!punct) return;
    const accent = document.createElement('span');
    accent.className = 'hero-calculator-accent';
    accent.textContent = punct;
    next.textContent = next.textContent.slice(punct.length);
    em.after(accent);
  });
}

/* ---------- accent-word definitions (source "term" popovers) ---------- */

const ARROW_PATH = 'M686-450H190q-13 0-21.5-8.5T160-480q0-13 8.5-21.5T190-510h496L459-737q-9-9-9-21t9-21q9-9 21-9t21 9l278 278q5 5 7 10t2 11q0 6-2 11t-7 10L501-181q-9 9-21 9t-21-9q-9-9-9-21t9-21l227-227Z';
const HOVER_OPEN_MS = 100;
const HOVER_CLOSE_MS = 300;

const normWord = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** A definition row: [word (+ optional accessible name)] [copy paragraph(s) + optional link]. */
const isTermRow = (row) => {
  const cells = [...row.children];
  if (cells.length < 2 || row.querySelector('h1, h2, h3, ul, ol, input')) return false;
  return normWord(cells[0].textContent).length > 0 && normWord(cells[0].textContent).length < 80;
};

function readTerms(rows) {
  const terms = new Map();
  rows.forEach((row) => {
    const [wordCell, copyCell] = row.children;
    const lines = [...wordCell.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean);
    const word = lines[0] || wordCell.textContent.trim();
    const link = [...copyCell.querySelectorAll('a[href]')].pop() || null;
    const copy = [...copyCell.querySelectorAll('p')].filter((p) => !(link && p.contains(link)));
    if (!copy.length && copyCell.textContent.trim() && !copyCell.querySelector('p')) {
      const p = document.createElement('p');
      p.append(...[...copyCell.childNodes].filter((n) => !(link && n.contains?.(link))));
      copy.push(p);
    }
    terms.set(normWord(word), { label: lines[1] || `About ${word}`, copy, link });
  });
  return terms;
}

/**
 * Turns the H1 accent words that have a definition row into buttons that show a small
 * non-modal dialog (copy + "Get coverage") on hover, tap, Enter or Space, as on the source.
 */
function buildTerms(block, text, terms) {
  const h1 = text.querySelector('h1');
  if (!h1 || !terms.size) return;
  const entries = [];
  let current = null;
  let openTimer = 0;
  let closeTimer = 0;

  const place = ({ trigger, tip }) => {
    const host = text.getBoundingClientRect();
    const r = trigger.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    /* source clamps the popover 12px inside the viewport edge */
    const room = Math.max(0, viewport - host.left - 12 - tip.offsetWidth);
    tip.style.left = `${Math.max(0, Math.min(r.left - host.left, room))}px`;
    tip.style.top = `${r.bottom - host.top + 10}px`;
  };

  const close = (entry, { restoreFocus = false } = {}) => {
    if (!entry || entry.tip.hidden) return;
    const { trigger, tip } = entry;
    const hadFocus = tip.contains(document.activeElement);
    trigger.setAttribute('aria-expanded', 'false');
    delete tip.dataset.open;
    entry.pinned = false;
    if (current === entry) current = null;
    const hide = () => {
      if (!tip.dataset.open) tip.hidden = true;
    };
    tip.addEventListener('transitionend', hide, { once: true });
    setTimeout(hide, 200);
    if (restoreFocus || hadFocus) trigger.focus({ preventScroll: true });
  };

  const open = (entry, { pin = false } = {}) => {
    clearTimeout(closeTimer);
    if (current && current !== entry) close(current);
    current = entry;
    const { trigger, tip } = entry;
    entry.pinned = entry.pinned || pin;
    trigger.setAttribute('aria-expanded', 'true');
    if (tip.hidden) {
      tip.hidden = false;
      place(entry);
      tip.getBoundingClientRect();
    }
    tip.dataset.open = '';
    if (pin) tip.focus({ preventScroll: true });
  };

  const scheduleClose = (entry) => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    if (entry.pinned) return;
    closeTimer = setTimeout(() => close(entry), HOVER_CLOSE_MS);
  };

  h1.querySelectorAll('em, i').forEach((em) => {
    const def = terms.get(normWord(em.textContent));
    if (!def) return;
    const tipId = nextId('hero-calculator-tip');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'hero-calculator-define';
    trigger.textContent = em.textContent.trim();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', tipId);
    em.classList.add('hero-calculator-defined');
    em.replaceChildren(trigger);

    const tip = document.createElement('section');
    tip.className = 'hero-calculator-tip';
    tip.id = tipId;
    tip.hidden = true;
    tip.tabIndex = -1;
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', def.label);
    const body = document.createElement('div');
    body.className = 'hero-calculator-tip-body';
    def.copy.forEach((p) => {
      p.classList.add('hero-calculator-tip-copy');
      body.append(p);
    });
    if (def.link) {
      def.link.className = 'hero-calculator-tip-link';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 -960 960 960');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', ARROW_PATH);
      icon.append(path);
      def.link.append(icon);
      body.append(def.link);
    }
    tip.append(body);
    text.append(tip);
    const entry = { trigger, tip, pinned: false };
    entries.push(entry);

    trigger.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      if (current === entry) return;
      openTimer = setTimeout(() => open(entry), HOVER_OPEN_MS);
    });
    trigger.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && current === entry) scheduleClose(entry);
      else clearTimeout(openTimer);
    });
    tip.addEventListener('pointerenter', () => clearTimeout(closeTimer));
    tip.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') scheduleClose(entry);
    });
    trigger.addEventListener('click', () => {
      clearTimeout(openTimer);
      if (current === entry && entry.pinned) close(entry);
      else open(entry, { pin: true });
    });
    tip.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close(entry, { restoreFocus: true });
    });
    tip.addEventListener('focusout', (e) => {
      if (!e.relatedTarget || tip.contains(e.relatedTarget) || e.relatedTarget === trigger) return;
      close(entry);
    });

    /* "Get coverage" opens the quote drawer with the selected range; the link is the fallback */
    def.link?.addEventListener('click', (e) => {
      const card = block.querySelector('.hero-calculator-card');
      const values = card ? [Number(card.dataset.min), Number(card.dataset.max)] : undefined;
      const event = new CustomEvent('quote-drawer:open', {
        cancelable: true, detail: { entry: 'estimate', values, trigger },
      });
      if (!document.dispatchEvent(event)) {
        e.preventDefault();
        close(entry);
      }
    });
  });
  if (!entries.length) return;

  text.classList.add('hero-calculator-has-terms');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) close(current, { restoreFocus: current.trigger === document.activeElement });
  });
  document.addEventListener('pointerdown', (e) => {
    if (!current || current.tip.contains(e.target) || current.trigger.contains(e.target)) return;
    close(current);
  });
  window.addEventListener('resize', () => {
    if (current) place(current);
  });
}

/**
 * The CTAs open the quote drawer (blocks/quote-drawer) when the page has one, as on the source:
 * "Estimate monthly premium" opens the form with the selected range, "Talk to an expert" opens
 * talk to sales. Without a drawer the authored links work as before.
 */
function wireQuoteDrawer(block) {
  const card = block.querySelector('.hero-calculator-card');
  const wire = (link, entry) => link?.addEventListener('click', (e) => {
    const values = card ? [Number(card.dataset.min), Number(card.dataset.max)] : undefined;
    const event = new CustomEvent('quote-drawer:open', {
      cancelable: true, detail: { entry, values, trigger: link },
    });
    if (!document.dispatchEvent(event)) e.preventDefault();
  });
  wire(block.querySelector('.hero-calculator-action a[href]'), 'estimate');
  wire(block.querySelector('.hero-calculator-text .hero-calculator-cta'), 'sales');
}

export default function decorate(block) {
  /* rows after the first that hold [word] [copy] are accent-word definitions */
  const termRows = [...block.children].slice(1).filter(isTermRow);
  termRows.forEach((row) => row.remove());
  const terms = readTerms(termRows);
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const isCalc = (c) => c.querySelector('ul, ol, input') || (c.querySelector('h2, h3, h4') && !c.querySelector('h1'));
  const calcCell = cells.length > 1 ? cells.slice(1).find(isCalc) || cells[cells.length - 1] : null;
  const textCells = cells.filter((c) => c !== calcCell);

  const inner = document.createElement('div');
  inner.className = 'hero-calculator-inner';
  const text = document.createElement('div');
  text.className = 'hero-calculator-text';
  textCells.forEach((c) => text.append(...c.childNodes));
  decorateText(text);
  inner.append(text);
  if (calcCell) inner.append(buildCalculator(calcCell));
  else block.classList.add('hero-calculator-no-calculator');

  block.replaceChildren(inner);
  buildTerms(block, text, terms);
  mountLattice(block, text);
  wireQuoteDrawer(block);
}
