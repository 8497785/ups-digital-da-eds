/* eslint-disable max-classes-per-file -- Construct and Gesture drive the same SVG together */
/*
 * Illustration construct + gesture runtime (shared by quote-drawer and the page blocks).
 *
 * The source (insureshield.com) draws its isometric illustrations in JS and plays a one-time
 * "construct" build-in when 30% of an illustration is visible (900 ms, cubic-bezier(.45,0,.55,1)),
 * and a hover/focus "gesture" once it has resolved. The hosted SVG exports under /assets carry the
 * timing tags of that renderer:
 *   - svg[data-order]   construct order of the items, svg[data-origins] each item's base point
 *   - [data-item] [data-role] [data-kind] on every drawn part, [data-guides-all] hidden guides
 *   - svg[data-construct-v="2"]  route dashes ([data-routes]) draw along the route, ground marks
 *     ([data-ground]) fade in (page exports; the quote-drawer exports keep the v1 behaviour)
 *   - svg[data-gesture]  a sibling `<name>.gesture.json` holds pre-rendered gesture frames
 * Untagged SVGs stay plain images.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
export const CONSTRUCT_MS = 900;
export const CONSTRUCT_THRESHOLD = 0.3;
/* source: 1.4 x --m-duration-slow (320 ms), eased */
const GESTURE_MS = 448;

/* cubic-bezier(.45, 0, .55, 1): the source's construct easing */
export function bezier(x1, y1, x2, y2) {
  const a = (p1, p2) => 1 - 3 * p2 + 3 * p1;
  const b = (p1, p2) => 3 * p2 - 6 * p1;
  const c = (p1) => 3 * p1;
  const calc = (t, p1, p2) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t, p1, p2) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (calc(t, x1, x2) - x) / d;
    }
    return calc(Math.min(1, Math.max(0, t)), y1, y2);
  };
}
const ease = bezier(0.45, 0, 0.55, 1);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, b) => ease(clamp01((t - a) / Math.max(1e-6, b - a)));

/* the source's "ghost" palette: what a part looks like before its colour fills up */
const GHOST = {
  top: '#fcfaf8', left: '#eceae9', right: '#efeff2', edge: '#85858e', glyph: '#85858e',
};

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function mix(from, to, k) {
  if (!from || !to) return null;
  return `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * k)).join(' ')})`;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Replays the source construct timeline on an exported illustration:
 * items (data-item, ordered by data-order) pop in from their base point (data-origins),
 * their colour fills up from the ghost palette bottom to top, emblems draw in and the
 * dashed construction guides (data-guides-all) appear and fade out. 900 ms in total.
 * Options: holder (element whose data-construct reflects the state; defaults to the closest
 * [data-construct]), onResolve (called whenever the illustration reaches its final state).
 */
export class Construct {
  constructor(svg, { holder, onResolve } = {}) {
    this.svg = svg;
    this.holder = holder === undefined ? svg.closest('[data-construct]') : holder;
    this.onResolve = onResolve;
    this.v2 = svg.dataset.constructV === '2';
    this.order = (svg.dataset.order || '').split(',').filter(Boolean).map(Number);
    this.origins = (svg.dataset.origins || '').split(';').filter(Boolean)
      .map((pair) => pair.split(' ').map(Number));
    this.items = new Map();
    this.routeParts = [];
    svg.querySelectorAll('[data-item]').forEach((node) => {
      if (node.closest('[data-guides-all]')) return;
      if (this.v2 && node.closest('[data-routes]')) {
        this.routeParts.push(node);
        return;
      }
      const k = Number(node.dataset.item);
      if (!this.items.has(k)) this.items.set(k, []);
      this.items.get(k).push({
        node,
        fill: node.getAttribute('fill'),
        stroke: node.getAttribute('stroke'),
        opacity: node.getAttribute('opacity'),
        role: node.dataset.role,
        kind: node.dataset.kind,
      });
    });
    this.guides = [...svg.querySelectorAll('[data-guides-all] > [data-item]')];
    this.guideRoot = svg.querySelector('[data-guides-all]');
    this.shadow = svg.querySelector('[data-shadow]');
    this.routes = svg.querySelector('[data-routes]');
    this.ground = this.v2 ? svg.querySelector('[data-ground]') : null;
    this.frameId = 0;
    this.state = 'resolved';
  }

  measure() {
    if (this.geometry) return;
    this.geometry = true;
    this.items.forEach((parts) => {
      let top = Infinity;
      let bottom = -Infinity;
      parts.forEach((part) => {
        try {
          const b = part.node.getBBox();
          part.cy = b.y + b.height / 2;
          top = Math.min(top, b.y);
          bottom = Math.max(bottom, b.y + b.height);
        } catch (e) {
          part.cy = 0;
        }
      });
      const h = Math.max(1e-6, bottom - top);
      parts.forEach((part) => { part.rel = clamp01((bottom - part.cy) / h); });
    });
  }

  frame(t) {
    const n = this.order.length || this.items.size;
    const step = n > 1 ? Math.min(0.09, 0.42 / (n - 1)) : 0;
    let popSum = 0;
    this.items.forEach((parts, k) => {
      const rank = Math.max(0, this.order.indexOf(k));
      const start = 0.06 + rank * step;
      const scale = Math.min(1, (1 - start) / 0.55);
      const w = (a, b) => span(t, start + a * scale, start + b * scale);
      const pop = w(0, 0.16);
      const level = w(0.2, 0.46);
      const draw = w(0.36, 0.55);
      popSum += pop;
      const [ox, oy] = this.origins[k] || [0, 0];
      const transform = pop >= 1 ? null
        : `translate(${ox} ${oy}) scale(${Math.max(pop, 1e-4)}) translate(${-ox} ${-oy})`;
      parts.forEach((part) => {
        const { node } = part;
        if (transform) node.setAttribute('transform', transform);
        else node.removeAttribute('transform');
        /* non-scaling strokes would still paint a dot at scale ~0 */
        if (pop <= 0.002) node.setAttribute('visibility', 'hidden');
        else node.removeAttribute('visibility');
        if (this.geometry && level < 1) {
          const k2 = clamp01((level - part.rel) / 0.12 + 0.5);
          const ghost = hexToRgb(GHOST[part.role] || GHOST.edge);
          if (part.fill && part.fill.startsWith('#') && part.kind !== 'emblem') {
            node.setAttribute('fill', mix(ghost, hexToRgb(part.fill), k2) || part.fill);
          }
          if (part.stroke && part.stroke.startsWith('#')) {
            node.setAttribute('stroke', mix(hexToRgb(GHOST.edge), hexToRgb(part.stroke), k2) || part.stroke);
          }
        } else {
          if (part.fill) node.setAttribute('fill', part.fill);
          if (part.stroke) node.setAttribute('stroke', part.stroke);
        }
        let opacity = part.opacity === null ? 1 : Number(part.opacity);
        if (part.kind === 'emblem' || part.kind === 'halo') opacity *= draw;
        if (part.kind === 'hatch') opacity *= level;
        if (opacity >= 1 && part.opacity === null) node.removeAttribute('opacity');
        else node.setAttribute('opacity', String(Math.round(opacity * 1000) / 1000));
      });
      const guide = this.guides.find((g) => Number(g.dataset.item) === k);
      if (guide) {
        const g = w(0, 0.14) * (1 - w(0.4, 0.55));
        const under = guide.querySelector('[data-guide=under]');
        const over = guide.querySelector('[data-guide=over]');
        under?.setAttribute('opacity', String(Math.min(1, g * 1.4)));
        over?.setAttribute('opacity', String(g));
        if (transform) over?.setAttribute('transform', transform);
        else over?.removeAttribute('transform');
      }
    });
    const avgPop = this.items.size ? popSum / this.items.size : 1;
    if (this.shadow) this.shadow.setAttribute('opacity', String(avgPop));
    if (this.v2) {
      /* source: the route polyline is cut to its eased length over 12-62%, so its dashes
         appear one after another along it; the ground marks grow in over 0-18% */
      const len = span(t, 0.12, 0.62) * this.routeParts.length;
      this.routeParts.forEach((node, i) => {
        if (t >= 1 || i < len) node.removeAttribute('visibility');
        else node.setAttribute('visibility', 'hidden');
      });
      if (this.ground) {
        if (t >= 1) this.ground.removeAttribute('opacity');
        else this.ground.setAttribute('opacity', String(span(t, 0, 0.18)));
      }
    } else if (this.routes) this.routes.setAttribute('opacity', String(span(t, 0.12, 0.62)));
    if (this.guideRoot) {
      if (t >= 1) this.guideRoot.setAttribute('display', 'none');
      else this.guideRoot.removeAttribute('display');
    }
  }

  reset() {
    cancelAnimationFrame(this.frameId);
    if (prefersReducedMotion()) {
      this.finish();
      return;
    }
    this.state = 'building';
    this.holder?.setAttribute('data-construct', 'building');
    this.frame(0);
  }

  play() {
    if (this.state !== 'building') return;
    this.state = 'playing';
    this.measure();
    let t0 = 0;
    const tick = (now) => {
      t0 = t0 || now;
      const t = clamp01((now - t0) / CONSTRUCT_MS);
      this.frame(t);
      if (t < 1) this.frameId = requestAnimationFrame(tick);
      else this.finish();
    };
    this.frameId = requestAnimationFrame(tick);
  }

  finish() {
    cancelAnimationFrame(this.frameId);
    this.frame(1);
    this.state = 'resolved';
    this.holder?.setAttribute('data-construct', 'resolved');
    this.onResolve?.(this);
  }
}

/* ---------- loading + sanitising ---------- */

const svgCache = new Map();
/** Fetches an SVG file once; resolves to its markup ('' on failure). */
export function fetchSvg(src) {
  if (!svgCache.has(src)) {
    svgCache.set(src, fetch(src).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  }
  return svgCache.get(src);
}

const ALLOWED = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'defs', 'pattern', 'clippath', 'mask', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc', 'use',
  'text', 'tspan']);

/** Sanitise by construction: only drawing elements, no handlers, styles or external references. */
function sanitize(root) {
  [root, ...root.querySelectorAll('*')].forEach((node) => {
    if (node !== root && !ALLOWED.has(node.localName.toLowerCase())) {
      node.remove();
      return;
    }
    [...node.attributes].forEach(({ name, value }) => {
      const lower = name.toLowerCase();
      if (lower.startsWith('on') || lower === 'style'
        || ((lower === 'href' || lower === 'xlink:href') && !value.startsWith('#'))
        || /javascript:|url\((?!#)/i.test(value)) node.removeAttribute(name);
    });
  });
}

let uid = 0;
/** Returns a unique id prefix for an inlined illustration. */
export const nextPrefix = (name = 'illustration') => {
  uid += 1;
  return `${name}-${uid}`;
};

/** Parses SVG markup (image/svg+xml), scopes its ids with prefix and sanitises it. */
export function parseSvg(markup, prefix) {
  if (!markup || !markup.includes('<svg')) return null;
  const scoped = markup.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
  const doc = new DOMParser().parseFromString(scoped, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== 'svg' || svg.namespaceURI !== SVG_NS) return null;
  sanitize(svg);
  return document.importNode(svg, true);
}

/* ---------- triggers ---------- */

const observers = new Map();
/** Calls cb once when `threshold` of el is visible (the source's construct trigger). */
export function whenVisible(el, cb, threshold = CONSTRUCT_THRESHOLD) {
  if (!observers.has(threshold)) {
    const callbacks = new WeakMap();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < threshold) return;
        const fn = callbacks.get(entry.target);
        io.unobserve(entry.target);
        callbacks.delete(entry.target);
        fn?.();
      });
    }, { threshold });
    observers.set(threshold, { io, callbacks });
  }
  const { io, callbacks } = observers.get(threshold);
  callbacks.set(el, cb);
  io.unobserve(el);
  io.observe(el);
  return () => {
    io.unobserve(el);
    callbacks.delete(el);
  };
}

/* ---------- gesture (hover / focus) ---------- */

const gestureCache = new Map();
function fetchGesture(url) {
  if (!gestureCache.has(url)) {
    gestureCache.set(url, fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => {
      const ok = j && Array.isArray(j.tokens) && Array.isArray(j.frames) && j.frames.length
        && ['ease', 'linear', 'loop'].includes(j.mode) && Number(j.ms) > 0;
      return ok ? j : null;
    }).catch(() => null));
  }
  return gestureCache.get(url);
}

/**
 * Plays the source gesture of an illustration from pre-rendered frames: `ease` gestures run
 * 0 -> 1 over 448 ms (cubic-bezier(.45,0,.55,1)) while active and back when left, `linear`
 * ones over `ms` scaled by the distance, `loop` ones loop every `ms` while active and blend
 * back when left.
 * Only runs once the construct has resolved, never with reduced motion.
 */
export class Gesture {
  constructor(svg, url, prefix) {
    this.svg = svg;
    this.url = url;
    this.prefix = `${prefix}-g`;
    this.main = svg.querySelector(':scope > g');
    this.value = 0;
    this.target = 0;
    this.loopT = 0;
    this.active = false;
    this.ready = false;
    this.frames = new Map();
    this.shown = -1;
    this.frameId = 0;
  }

  setActive(on) {
    this.active = !!on;
    this.update();
  }

  setReady(on) {
    this.ready = !!on;
    /* hover devices: fetch the frames once the build-in is done, so the first hover is on time */
    if (on && !this.loading && !prefersReducedMotion() && window.matchMedia('(hover: hover)').matches) {
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
      idle(() => { if (!this.loading) this.loading = this.load(); });
    }
    this.update();
  }

  load() {
    return fetchGesture(this.url).then((data) => {
      this.data = data;
      if (data) this.update();
    });
  }

  update() {
    const target = this.active && this.ready && !prefersReducedMotion() ? 1 : 0;
    if (target === 1 && !this.data) {
      if (!this.loading) this.loading = this.load();
      return;
    }
    if (!this.data || (target === this.target && (this.frameId || this.value === target))) return;
    this.target = target;
    const from = this.value;
    const { mode, ms } = this.data;
    if (mode === 'loop' && target === 1 && from < 0.01) this.loopT = 0;
    const dur = mode === 'linear' ? ms * Math.abs(target - from) : GESTURE_MS;
    let t0 = 0;
    let last = 0;
    cancelAnimationFrame(this.frameId);
    const tick = (now) => {
      t0 = t0 || now;
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      const k = dur > 0 ? clamp01((now - t0) / dur) : 1;
      this.value = from + (target - from) * (mode === 'linear' ? k : ease(k));
      if (mode === 'loop' && this.target === 1) this.loopT += dt;
      this.render();
      const running = k < 1 || (mode === 'loop' && this.target === 1);
      this.frameId = running ? requestAnimationFrame(tick) : 0;
    };
    this.frameId = requestAnimationFrame(tick);
  }

  frameNode(i) {
    if (!this.frames.has(i)) {
      const { tokens, paths = [], frames } = this.data;
      const markup = frames[i].map((entry) => {
        const [id, dx, dy] = Array.isArray(entry) ? entry : [entry];
        let token = String(tokens[id] || '');
        if (dx !== undefined) token = token.replace(/^<path /, `<path transform="translate(${Number(dx)} ${Number(dy)})" `);
        return token.replace(/ d="@(\d+)"/, (m, n) => ` d="${paths[Number(n)] || ''}"`);
      }).join('');
      const svg = parseSvg(`<svg xmlns="${SVG_NS}"><g>${markup}</g></svg>`, this.prefix);
      const frag = document.createDocumentFragment();
      if (svg?.firstElementChild) frag.append(...svg.firstElementChild.childNodes);
      this.frames.set(i, frag);
    }
    return this.frames.get(i).cloneNode(true);
  }

  render() {
    const { mode, ms, frames } = this.data;
    const n = frames.length;
    if (this.value <= 0.0005) {
      this.layer?.remove();
      this.layer = null;
      this.shown = -1;
      this.main.removeAttribute('display');
      this.main.removeAttribute('opacity');
      return;
    }
    if (!this.layer) {
      this.layer = document.createElementNS(SVG_NS, 'g');
      this.layer.setAttribute('transform', this.main.getAttribute('transform') || this.data.transform || '');
      this.main.after(this.layer);
    }
    const i = mode === 'loop'
      ? Math.floor(((this.loopT % ms) / ms) * n) % n
      : Math.min(n - 1, Math.round(this.value * (n - 1)));
    if (i !== this.shown) {
      this.layer.replaceChildren(this.frameNode(i));
      this.shown = i;
    }
    if (mode === 'loop' && this.value < 1) {
      /* blend: the source eases the looping pose back to rest; the rest drawing stays
         opaque underneath so nothing washes out */
      this.main.removeAttribute('display');
      this.layer.setAttribute('opacity', String(Math.round(this.value * 1000) / 1000));
    } else {
      this.main.setAttribute('display', 'none');
      this.main.removeAttribute('opacity');
      this.layer.removeAttribute('opacity');
    }
  }
}

/* ---------- page illustrations ---------- */

/**
 * Responsive fit. The source redraws each scene for its box: viewBox = the box in px, the scene
 * centred and scaled to fit, hairlines kept at their on-screen width. The exports are drawn at
 * the 1440 layout; svg[data-fit] (JSON, measured on the source) re-fits them on resize:
 *   c: [cx, cy]   scene offset (scene units) of the box centre
 *   max           largest scale
 *   w: [width, pad, k, b]  width-bound scale (box - min(pad, k * box + b)) / width
 *   h: [height, pad]    height-bound scale (box - pad) / height
 */
export function fitIllustration(svg) {
  let fit = null;
  try {
    fit = JSON.parse(svg.getAttribute('data-fit') || 'null');
  } catch (e) {
    fit = null;
  }
  const main = svg.querySelector(':scope > g');
  const m = /scale\(([\d.]+)\)/.exec(main?.getAttribute('transform') || '');
  if (!fit?.c || !m || typeof ResizeObserver === 'undefined') return;
  const s0 = Number(m[1]);
  /* hairline groups are drawn in scene units (no vector-effect): keep their px width */
  const hairs = [...svg.querySelectorAll('[stroke-width]:not([vector-effect])')]
    .map((el) => [el, Number(el.getAttribute('stroke-width')) * s0]);
  /* hatch patterns: px-sized tiles anchored at the viewBox origin */
  const px = (el, names) => names.map((n) => [el, n, Number(el.getAttribute(n)) * s0]);
  const tiles = [...svg.querySelectorAll('pattern[patternUnits="userSpaceOnUse"]')].flatMap((p) => [
    ...px(p, ['width', 'height']),
    ...[...p.querySelectorAll('rect')].flatMap((r) => px(r, ['width', 'height'])),
  ]);
  const apply = (w, h) => {
    let s = fit.max || Infinity;
    if (fit.w) {
      const [width, pad, k = 1, b = 0] = fit.w;
      s = Math.min(s, (w - Math.min(pad, k * w + b)) / width);
    }
    if (fit.h) s = Math.min(s, (h - fit.h[1]) / fit.h[0]);
    if (!w || !h || !(s > 0) || !Number.isFinite(s)) return;
    const tx = Math.round(w / 2 + fit.c[0] * s);
    const ty = Math.round(h / 2 + fit.c[1] * s);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.querySelectorAll(':scope > g').forEach((g) => g.setAttribute('transform', `translate(${tx} ${ty}) scale(${s})`));
    hairs.forEach(([el, v]) => el.setAttribute('stroke-width', String(v / s)));
    tiles.forEach(([el, n, v]) => el.setAttribute(n, String(v / s)));
    svg.querySelectorAll('pattern[patternUnits="userSpaceOnUse"]').forEach((p) => {
      p.setAttribute('x', String(-tx / s));
      p.setAttribute('y', String(-ty / s));
    });
  };
  new ResizeObserver(([entry]) => {
    apply(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
  }).observe(svg);
}

/**
 * Inlines a hosted illustration image (same-origin .svg) that carries construct tags, so it can
 * build in like the source; untagged images stay as they are. The <img> stays in place until the
 * SVG is ready (no-JS / failure fallback). The SVG takes the classes of the replaced element plus
 * `illustration-construct`; it is role=img with the image's alt text, or aria-hidden when the alt
 * is empty (decorative, as on the source).
 * Resolves to { svg, construct, gesture } or null.
 */
export async function inlineIllustration(img, { replace } = {}) {
  const src = img?.getAttribute('src');
  if (!src) return null;
  let url;
  try {
    url = new URL(src, window.location.href);
  } catch (e) {
    return null;
  }
  if (url.origin !== window.location.origin || !/\.svg$/i.test(url.pathname)) return null;
  const markup = await fetchSvg(url.href);
  if (!/<svg[^>]*\sdata-order="/.test(markup)) return null;
  const prefix = nextPrefix();
  const svg = parseSvg(markup, prefix);
  const target = replace || img.closest('picture') || img;
  if (!svg || !target.isConnected) return null;
  const label = (img.getAttribute('alt') || '').trim();
  svg.setAttribute('class', `${target.getAttribute('class') || ''} illustration-construct`.trim());
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('data-construct', 'resolved');
  target.replaceWith(svg);
  fitIllustration(svg);
  const gesture = svg.hasAttribute('data-gesture')
    ? new Gesture(svg, url.pathname.replace(/\.svg$/i, '.gesture.json'), prefix) : null;
  const construct = new Construct(svg, { holder: svg, onResolve: () => gesture?.setReady(true) });
  construct.reset();
  if (construct.state === 'building') whenVisible(svg, () => construct.play());
  return { svg, construct, gesture };
}

/** Drives a gesture from hover (and optionally focus within) on el, like the source tiles. */
export function bindGesture(el, gesture, { focus = false } = {}) {
  if (!el || !gesture) return;
  let hover = false;
  let focused = false;
  const sync = () => gesture.setActive(hover || focused);
  el.addEventListener('pointerenter', () => { hover = true; sync(); });
  el.addEventListener('pointerleave', () => { hover = false; sync(); });
  if (focus) {
    el.addEventListener('focusin', () => { focused = true; sync(); });
    el.addEventListener('focusout', (e) => {
      if (el.contains(e.relatedTarget)) return;
      focused = false;
      sync();
    });
  }
}
