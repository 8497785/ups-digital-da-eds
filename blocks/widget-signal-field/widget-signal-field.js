/*
 * widget-signal-field
 * Animated 2D-canvas "signal field" band background (port of the source pattern):
 * a fine grid of quiet grey square dots; a handful at a time light up in the colour
 * wheel's tone (teal -> blue -> gold, turning every 18s), hold ~4s and fade; the
 * pointer (read from document events) enlarges and colours the dots near it.
 *
 * Authoring: a block whose only cell holds a link to /widgets/signal-field
 * (query params such as ?density=0.9&accent=0.12 are optional). The block moves
 * itself behind the NEXT section and takes no layout height. It also runs when the
 * link is authored on its own and auto-blocked into the `widget` block, via the
 * adapter in /widgets/signal-field.js.
 */

const GRID = 11;
const DOT = 3.6;
const LIFE = 4200;
const FADE_IN = 260;
const WHEEL_MS = 18000;
const POINTER_RADIUS = 140;
const FRAME_MS = 1000 / 30;
const MAX_BACKING_PIXELS = 6e6;
const BASE_COLOR = 'rgb(26 26 31 / 12%)';
const TONES = [
  { strong: '#0a8080', light: '#9fcbcb' },
  { strong: '#0662bb', light: '#99c0e1' },
  { strong: '#fcc400', light: '#ffd84c' },
];

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

/** Colour wheel: two neighbouring tones and how far we are between them. */
function wheel(time, offset = 0) {
  const r = (((((time / WHEEL_MS) + offset) % 1) + 1) % 1) * TONES.length;
  const i = Math.floor(r) % TONES.length;
  return {
    a: TONES[i],
    b: TONES[(i + 1) % TONES.length],
    mix: smoothstep(0.55, 1, r - Math.floor(r)),
  };
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Starts the signal field inside `host` (a positioned element). Returns a stop function.
 * @param {HTMLElement} host
 * @param {{ density?: number, accent?: number, seed?: number }} options
 */
export function mountSignalField(host, options = {}) {
  const density = Math.min(1, Math.max(0.05, Number(options.density) || 0.9));
  const rawAccent = options.accent === undefined ? NaN : Number(options.accent);
  const accent = Math.min(1, Math.max(0, Number.isFinite(rawAccent) ? rawAccent : 0.12));
  const seed = Number(options.seed) || 11;

  const canvas = document.createElement('canvas');
  canvas.className = 'widget-signal-field-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const base = document.createElement('canvas');
  const baseCtx = base.getContext('2d');

  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let grid = new Int32Array(0); /* cell -> dot index or -1 */
  let xs = [];
  let ys = [];
  let interval = LIFE;
  let running = false;
  let frameId = 0;
  let lastFrame = 0;
  let inView = false;
  let stopped = false;
  const pointer = {
    x: 0, y: 0, amount: 0, target: 0, last: 0,
  };
  const start = performance.now();

  const layout = () => {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return false;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    /* keep very tall bands within a sane backing-store budget */
    if (width * height * dpr * dpr > MAX_BACKING_PIXELS) {
      dpr = Math.max(1, Math.sqrt(MAX_BACKING_PIXELS / (width * height)));
    }
    [canvas, base].forEach((c) => {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(width / GRID) + 1;
    rows = Math.ceil(height / GRID) + 1;
    grid = new Int32Array(cols * rows).fill(-1);
    xs = [];
    ys = [];
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        if (hash(i, j, 1, seed) < density) {
          grid[j * cols + i] = xs.length;
          xs.push(i * GRID);
          ys.push(j * GRID);
        }
      }
    }
    interval = LIFE / Math.max(2, Math.round(xs.length * accent * 0.03));

    baseCtx.clearRect(0, 0, width, height);
    baseCtx.fillStyle = BASE_COLOR;
    for (let k = 0; k < xs.length; k += 1) {
      baseCtx.fillRect(xs[k] - DOT / 2, ys[k] - DOT / 2, DOT, DOT);
    }
    return true;
  };

  const draw = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(base, 0, 0, width, height);
    const count = xs.length;
    if (!count) return;

    /* lit signals */
    if (accent > 0) {
      const first = Math.floor((t - LIFE) / interval);
      const lastSignal = Math.floor(t / interval);
      for (let e = first; e <= lastSignal; e += 1) {
        const age = t - e * interval;
        if (age >= 0 && age <= LIFE) {
          const k = Math.floor(hash(e, 3, 0, seed) * count);
          const alpha = smoothstep(0, FADE_IN, age) * (1 - smoothstep(3700, LIFE, age));
          if (alpha > 0.02) {
            const tone = wheel(e * interval);
            const pick = tone.mix < 0.5 ? tone.a : tone.b;
            const s = DOT * 1.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = smoothstep(2100, 2700, age) > 0.5 ? pick.light : pick.strong;
            ctx.fillRect(xs[k] - s / 2, ys[k] - s / 2, s, s);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    /* pointer: enlarge nearby dots and colour some of them */
    if (pointer.amount > 0.01) {
      const r = POINTER_RADIUS;
      const i0 = Math.max(0, Math.floor((pointer.x - r) / GRID));
      const i1 = Math.min(cols - 1, Math.ceil((pointer.x + r) / GRID));
      const j0 = Math.max(0, Math.floor((pointer.y - r) / GRID));
      const j1 = Math.min(rows - 1, Math.ceil((pointer.y + r) / GRID));
      for (let j = j0; j <= j1; j += 1) {
        for (let i = i0; i <= i1; i += 1) {
          const k = grid[j * cols + i];
          if (k >= 0) {
            const dist = Math.hypot(xs[k] - pointer.x, ys[k] - pointer.y);
            const pv = pointer.amount * (1 - smoothstep(r * 0.3, r, dist));
            if (pv > 0.01) {
              const s = DOT * (1 + 0.35 * pv);
              if (hash(k, 8, 0, seed) < smoothstep(0.15, 0.85, pv)) {
                const tone = wheel(t, (-0.08 * dist) / r);
                ctx.fillStyle = (hash(k, 7, 0, seed) < tone.mix ? tone.b : tone.a).strong;
              } else {
                ctx.fillStyle = BASE_COLOR;
              }
              ctx.fillRect(xs[k] - s / 2, ys[k] - s / 2, s, s);
            }
          }
        }
      }
    }
  };

  const tick = (now) => {
    frameId = 0;
    if (!running) return;
    if (!host.isConnected) {
      // eslint-disable-next-line no-use-before-define
      stop();
      return;
    }
    if (now - lastFrame >= FRAME_MS) {
      const dt = lastFrame ? now - lastFrame : FRAME_MS;
      lastFrame = now;
      if (now - pointer.last > 1200) pointer.target = 0;
      pointer.amount += (pointer.target - pointer.amount) * Math.min(1, dt / 250);
      draw(now);
    }
    frameId = requestAnimationFrame(tick);
  };

  const sync = () => {
    const shouldRun = !stopped && inView && document.visibilityState !== 'hidden' && !reducedMotion();
    if (shouldRun && !running) {
      running = true;
      lastFrame = 0;
      frameId = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const drawStill = () => {
    if (!layout()) return;
    draw(start + LIFE * 0.4);
    canvas.dataset.live = 'true';
  };

  const onPointer = (e) => {
    if (!running) return;
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= -POINTER_RADIUS && y >= -POINTER_RADIUS
      && x <= rect.width + POINTER_RADIUS && y <= rect.height + POINTER_RADIUS;
    pointer.x = x;
    pointer.y = y;
    pointer.target = inside && e.pointerType !== 'touch' ? 1 : 0;
    pointer.last = performance.now();
  };

  const io = new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    sync();
  });
  io.observe(host);
  const ro = new ResizeObserver(() => drawStill());
  ro.observe(host);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = () => {
    sync();
    drawStill();
  };
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('pointermove', onPointer, { passive: true });
  motion.addEventListener('change', onMotion);

  function stop() {
    stopped = true;
    running = false;
    if (frameId) cancelAnimationFrame(frameId);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', sync);
    document.removeEventListener('pointermove', onPointer);
    motion.removeEventListener('change', onMotion);
  }
  return stop;
}

/** True when a section holds nothing but empty wrappers / section metadata. */
function sectionIsEmpty(section) {
  return [...section.children].every((child) => !child.textContent.trim()
    && !child.querySelector('img, picture, video, iframe, canvas, svg'));
}

/**
 * Moves the field behind the next section so it adds no height of its own.
 * Falls back to an in-place band when there is no following section.
 */
function placeBehindNextSection(block) {
  const section = block.closest('.section');
  const next = section?.nextElementSibling;
  if (!section || !next || !next.classList.contains('section')) {
    block.classList.add('widget-signal-field-inline');
    return block;
  }
  const wrapper = block.parentElement;
  next.prepend(block);
  if (wrapper && wrapper !== section && !wrapper.children.length) wrapper.remove();
  if (sectionIsEmpty(section)) section.hidden = true;
  if (getComputedStyle(next).position === 'static') next.style.position = 'relative';
  next.style.isolation = 'isolate';
  next.classList.add('widget-signal-field-band');
  block.classList.add('widget-signal-field-placed');
  return block;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const options = {};
  if (link) {
    try {
      new URL(link.href, window.location.href).searchParams.forEach((v, k) => { options[k] = v; });
    } catch (e) { /* ignore malformed links */ }
  }
  /* the widget block copies the link's query params into data attributes */
  ['density', 'accent', 'seed'].forEach((k) => {
    if (block.dataset[k] && options[k] === undefined) options[k] = block.dataset[k];
  });
  /* drops the link and any `widget` block the auto-blocker built around it */
  block.replaceChildren();
  block.setAttribute('aria-hidden', 'true');
  placeBehindNextSection(block);
  const stop = mountSignalField(block, options);

  const mo = new MutationObserver(() => {
    if (!block.isConnected) {
      mo.disconnect();
      stop();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
