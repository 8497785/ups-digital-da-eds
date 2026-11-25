/*
 * Hover loops of the source's scene illustrations, replayed procedurally.
 *
 * Two source illustrations are not built in but loop while their tile is hovered or focused:
 *   - packages-million (stat card "62M"): the kraft box shrinks into the first of 62 boxes, 61 drop
 *     into a stack, colour waves cross it, the gaps close and the stack melts back into one box
 *     (7524 ms loop; on leave it eases back to the still over 550 ms)
 *   - scan-shield (CommerceShield card): parcels pass a scan beam every 2450 ms, a scan line sweeps
 *     each and a shield pops up from it with a spin (runs from 0 while active; the still on leave)
 * The hosted SVG exports (svg[data-live]) hold the still drawing plus part templates
 * (defs[data-live-templates]) and the scene constants (data-live-constants). The timelines below
 * are ports of the source frame functions; every part is a template placed with
 * translate/scale/opacity/clip, depth sorted like the source renderer.
 */
import {
  bezier, fetchSvg, nextPrefix, parseSvg, prefersReducedMotion,
} from './illustration-construct.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ease = bezier(0.45, 0, 0.55, 1);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const r2 = (v) => {
  const t = Math.round(v * 100) / 100;
  return Object.is(t, -0) ? '0' : String(t);
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/* convex hull (monotone chain), as the source */
function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  pts.forEach((p) => {
    while (lower.length >= 2
      && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  });
  const upper = [];
  [...pts].reverse().forEach((p) => {
    while (upper.length >= 2
      && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  });
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
const pathOf = (pts) => `${pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('')}Z`;

/* ---------- source timelines ---------- */

/* packages-million (stat card): port of the source frame(ms, rest) */
const PK = {
  count: 62, layers: 4, ratio: 1.7, unit: 0.5, drop: 1.5, fall: 240, settle: 260,
};
const PK_TONES = ['teal', 'blue', 'gold', 'coral'];
function packagesGrid() {
  const out = [];
  for (let y = 0; y < PK.layers; y += 1) {
    for (let d = 0; d <= 6; d += 1) {
      for (let a = 0; a < PK.layers; a += 1) {
        const b = d - a;
        if (b >= 0 && b < PK.layers) {
          out.push({
            x: 1 + ((a - 1.5) * PK.unit) / PK.ratio,
            z: 1 + ((b - 1.5) * PK.unit) / PK.ratio,
            y: y * PK.unit,
          });
        }
      }
    }
  }
  return out.slice(0, PK.count);
}
function packagesBounce(t) {
  if (t <= 0) return PK.drop;
  if (t < PK.fall) {
    const k = t / PK.fall;
    return PK.drop * (1 - k * k);
  }
  const s = t - PK.fall;
  if (s > PK.settle) return 0;
  return 0.07 * Math.exp(-s / 70) * Math.abs(Math.sin((s / PK.settle) * 2 * Math.PI));
}
function packagesTimeline(c) {
  const p = c.pO;
  const grid = packagesGrid();
  const intro = p.shrink + (PK.count - 1) * p.stagger + PK.fall + PK.settle;
  const total = intro + p.dance + p.melt + p.hold;
  const frame = (ms, rest) => {
    const n = Math.max(0, ms) % total;
    const shrink = smooth(n / p.shrink) * (1 - rest);
    const i = n - intro;
    const melt = smooth((i - p.dance) / p.melt);
    const pitch = p.pitch + (p.large / PK.layers - p.pitch) * melt;
    const small = p.small + (p.large / PK.layers - p.small) * melt;
    const placed = grid.map((g, k) => {
      const l = n - p.shrink - k * p.stagger;
      const stacked = +(melt < 1);
      const opacity = k === 0
        ? stacked + (1 - stacked) * rest : smooth(l / 90) * (1 - rest) * stacked;
      const f = Math.max(0, i - (k % 16) * 35);
      const beat = Math.floor(f / 400);
      const wave = Math.sin(Math.PI * ((f % 400) / 400)) ** 2;
      const amount = i < 0 ? 0 : wave * (1 - smooth((i - p.dance + 600) / 600));
      const gx = 1 + ((g.x - 1) * pitch) / PK.unit;
      const gz = 1 + ((g.z - 1) * pitch) / PK.unit;
      return {
        key: `m${k}`,
        tpl: k === 0 ? 'big' : 'small',
        x: k === 0 ? 1 + (gx - 1) * shrink : gx,
        z: k === 0 ? 1 + (gz - 1) * shrink : gz,
        lift: k === 0 ? 0 : (g.y * pitch) / PK.unit + packagesBounce(l),
        scale: k === 0 ? p.large + (small - p.large) * shrink : small,
        opacity,
        metric: { opacity: k === 0 ? 1 - 0.55 * shrink : 0.45, compact: k === 0 ? shrink : 1 },
        tint: { tone: rest === 1 ? 'teal' : PK_TONES[(k + beat) % PK_TONES.length], amount: amount * (1 - rest) },
      };
    });
    const label = smooth((melt - 0.55) / 0.45);
    placed.push({
      key: 'merged',
      tpl: 'big',
      x: 1,
      z: 1,
      lift: 0,
      scale: p.large,
      opacity: melt * (1 - rest),
      foreground: true,
      metric: { opacity: label, slide: (1 - label) * 0.65 },
    });
    return { placed, overlay: [] };
  };
  return {
    frame,
    /* source: rest eases 1 -> 0 (enter) or back to 1 (leave) over 550 ms; time loops while on */
    drive(scene, on) {
      const o = on && scene.state.rest === 1 ? { ms: 0, rest: 0 } : { ...scene.state };
      let l = 0;
      let u = performance.now();
      return (now) => {
        l += Math.min(64, Math.max(0, now - u));
        u = now;
        const k = ease(Math.min(1, l / 550));
        const rest = on ? o.rest * (1 - k) : o.rest + (1 - o.rest) * k;
        const ms = on ? (o.ms + l) % total : o.ms;
        scene.state = { ms, rest };
        if (!on && rest >= 1) return null;
        return frame(ms, rest);
      };
    },
  };
}

/* scan-shield (CommerceShield card): port of the source parcel / shield / beam timeline */
function scanTimeline(c) {
  const { YT: Y, XT: T, ZT: SHIELD } = c;
  const pop = (v) => {
    const t = clamp01(v);
    return 1 + 2.9 * (t - 1) ** 3 + 1.9 * (t - 1) ** 2;
  };
  const parcel = (t) => {
    let x;
    if (t < T.in1) x = Y.from + (Y.x - Y.from) * smooth(t / T.in1);
    else if (t < T.go) x = Y.x;
    else x = Y.x + (Y.to - Y.x) * smooth((t - T.go) / (T.gone1 - T.go));
    const opacity = Math.min(smooth(t / 300), 1 - smooth((t - T.gone0) / (T.gone1 - T.gone0)));
    const s = (t - T.sweep0) / (T.sweep1 - T.sweep0);
    let sweep = null;
    if (s > 0 && s < 1) sweep = Y.beam * (s < 0.5 ? 1 - smooth(s * 2) : smooth((s - 0.5) * 2));
    return {
      x,
      opacity,
      sweep,
      pop: clamp01((t - T.pop0) / (T.pop1 - T.pop0)),
      lit: +(t >= T.in1 && t <= T.pop0),
    };
  };
  const alive = (t) => {
    const out = [];
    const n = Math.floor(t / T.every);
    for (let r = n; r >= 0 && r > n - Math.ceil(T.gone1 / T.every) - 1; r -= 1) {
      const local = t - r * T.every;
      if (local <= T.gone1) out.push({ n: r, t: local, p: parcel(local) });
    }
    return out;
  };
  const frame = (t) => {
    const list = alive(t);
    const placed = [];
    list.forEach(({ n, p }) => {
      placed.push({
        key: `p${n}`, tpl: 'parcel', x: p.x, z: Y.z, lift: 0, scale: Y.parcel, opacity: p.opacity, split: Y.x,
      });
      if (p.pop > 0) {
        placed.push({
          key: `s${n}`,
          tpl: 'shield-0',
          kind: 'shield',
          x: p.x,
          z: Y.z,
          lift: Y.parcel * 0.6 + Y.parcel * 0.5 * smooth(p.pop * 1.6),
          scale: SHIELD * pop(p.pop),
          opacity: p.opacity,
          spin: 360 * (1 - (1 - p.pop) ** 3),
        });
      }
    });
    const lit = Math.max(0, ...list.map(({ p }) => p.lit));
    const z0 = Y.z - 0.45;
    const z1 = Y.z + 0.45;
    const depthAt = [Y.x, Y.parcel / 2, Y.z];
    const overlay = [{
      key: 'beam', kind: 'beam', depthAt, opacity: 0.16 + 0.22 * lit, pts: [[Y.x, 0, z0], [Y.x, 0, z1], [Y.x, Y.beam, z1], [Y.x, Y.beam, z0]],
    }];
    list.forEach(({ n, p }) => {
      if (p.sweep === null) return;
      overlay.push({
        key: `scan${n}`,
        kind: 'scan',
        depthAt,
        pts: [[Y.x, p.sweep - 0.025, z0], [Y.x, p.sweep - 0.025, z1],
          [Y.x, p.sweep + 0.025, z1], [Y.x, p.sweep + 0.025, z0]],
      });
    });
    return { placed, overlay };
  };
  return {
    frame,
    /* source: the clock runs from 0 while active (frame steps capped at 64 ms); still when left */
    drive(scene, on) {
      if (!on) return () => null;
      let t = 0;
      let u = performance.now();
      return (now) => {
        t += Math.min(64, Math.max(0, now - u));
        u = now;
        return frame(t);
      };
    },
  };
}

const TIMELINES = { 'packages-million': packagesTimeline, 'scan-shield': scanTimeline };

/* ---------- renderer (port of the source's placed-item renderer) ---------- */

class LiveScene {
  constructor(svg, prefix) {
    this.svg = svg;
    this.prefix = prefix;
    this.c = JSON.parse(svg.dataset.liveConstants || '{}');
    const { c } = this;
    this.ww = (p) => [dot(p, c.right) * 100, -dot(p, c.up) * 100];
    this.at = (x, y, z) => [(x - c.nx / 2) * c.pitch, y * c.yPitch, (z - c.nz / 2) * c.pitch];
    this.p2 = (x, lift, z) => {
      const a = this.at(x, 0, z);
      return [a[0], a[1] + lift, a[2]];
    };
    this.depth = (p) => dot(p, c.toViewer);
    this.timeline = TIMELINES[svg.dataset.live](c);
    const defs = svg.querySelector(':scope > [data-live-templates]');
    this.ground = svg.querySelector(':scope > [data-ground]');
    this.still = [...svg.children].filter((n) => n !== defs && n !== this.ground);
    this.pattern = svg.querySelector('[data-shadow] pattern')?.id;
    this.nodes = new Map();
    this.state = { ms: 0, rest: 1 };
    this.active = false;
    this.frameId = 0;
    this.uid = 0;
  }

  template(name) {
    return this.svg.querySelector(`[id="${this.prefix}-t-${name}"]`);
  }

  /* the API the blocks use for gestures */
  setReady(on) {
    this.ready = !!on;
  }

  setActive(on) {
    const active = !!on && !prefersReducedMotion();
    if (active === this.active) return;
    this.active = active;
    cancelAnimationFrame(this.frameId);
    const step = this.timeline.drive(this, active);
    const tick = (now) => {
      const f = step(now);
      if (!f) {
        this.showStill();
        return;
      }
      this.draw(f);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  showStill() {
    this.frameId = 0;
    this.live?.remove();
    this.live = null;
    this.nodes.clear();
    this.still.forEach((n) => n.removeAttribute('display'));
  }

  ensureLive() {
    if (this.live) return;
    this.live = document.createElementNS(SVG_NS, 'g');
    this.shadows = document.createElementNS(SVG_NS, 'g');
    this.items = document.createElementNS(SVG_NS, 'g');
    this.live.append(this.shadows, this.items);
    (this.ground || this.svg.querySelector(':scope > [data-live-templates]')).after(this.live);
    this.still.forEach((n) => n.setAttribute('display', 'none'));
  }

  /* a template clone whose stroke widths follow the item scale (the source draws 1/(k x scale)) */
  drawing(name) {
    const tpl = this.template(name);
    const g = document.createElementNS(SVG_NS, 'g');
    if (!tpl) return { g, strokes: [], base: 1 };
    [...tpl.childNodes].forEach((n) => g.append(n.cloneNode(true)));
    g.querySelectorAll('defs').forEach((n) => n.remove());
    g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    const strokes = [...g.querySelectorAll('[stroke-width]')].map((n) => [n, Number(n.getAttribute('stroke-width'))]);
    return { g, strokes, base: Number(tpl.dataset.scale) || 1 };
  }

  static scaleStrokes(d, scale) {
    if (d.scale === scale) return;
    d.scale = scale;
    d.strokes.forEach(([n, w]) => n.setAttribute('stroke-width', String(Math.round(((w * d.base) / scale) * 1e5) / 1e5)));
  }

  itemNode(key, item) {
    let e = this.nodes.get(key);
    if (!e) {
      const outer = document.createElementNS(SVG_NS, 'g');
      const inner = document.createElementNS(SVG_NS, 'g');
      outer.append(inner);
      e = { outer, inner };
      this.nodes.set(key, e);
    }
    if (e.tpl !== item.tpl) {
      e.tpl = item.tpl;
      e.draw = this.drawing(item.tpl);
      e.inner.replaceChildren(e.draw.g);
      e.tint = null;
      e.metric = null;
    }
    const s = this.ww(this.p2(item.x, item.lift || 0, item.z));
    let transform = `translate(${s[0]} ${s[1]}) scale(${item.scale})`;
    if (item.spin) {
      /* turn about the vertical axis: the shield's face plane (screen horizontal at rest) */
      const a = (item.spin * Math.PI) / 180;
      const h = Math.SQRT1_2;
      const ra = [h * (Math.cos(a) - Math.sin(a)), 0, -h * (Math.sin(a) + Math.cos(a))];
      const [mx, my] = this.ww(ra);
      const sx = Math.abs(mx) < 0.1 ? Math.sign(mx || 1) * 0.001 : mx / 100;
      transform += ` matrix(${Math.round(sx * 1e4) / 1e4} ${Math.round(my * 100) / 1e4} 0 1 0 0)`;
    }
    e.inner.setAttribute('transform', transform);
    if (item.opacity < 1) e.inner.setAttribute('opacity', String(Math.round(item.opacity * 1000) / 1000));
    else e.inner.removeAttribute('opacity');
    LiveScene.scaleStrokes(e.draw, item.scale);
    this.updateTint(e, item);
    this.updateMetric(e, key, item);
    return e;
  }

  updateTint(e, item) {
    const amount = item.tint?.amount || 0;
    if (amount <= 0) {
      e.tint?.wrap.remove();
      e.tint = null;
      return;
    }
    const name = `${item.tpl}-${item.tint.tone}`;
    if (!e.tint || e.tint.name !== name) {
      e.tint?.wrap.remove();
      const wrap = document.createElementNS(SVG_NS, 'g');
      const d = this.drawing(name);
      wrap.append(d.g);
      e.draw.g.after(wrap);
      e.tint = { wrap, d, name };
    }
    LiveScene.scaleStrokes(e.tint.d, item.scale);
    e.tint.wrap.setAttribute('opacity', String(Math.round(amount * 1000) / 1000));
  }

  updateMetric(e, key, item) {
    const m = item.metric;
    if (!m) return;
    if (!e.metric) {
      const tpl = this.template('metric');
      if (!tpl) return;
      const groups = [...tpl.children].map((g) => g.cloneNode(true));
      e.inner.append(...groups);
      e.metric = groups.map((g) => {
        const wrap = g.firstElementChild;
        const body = wrap?.firstElementChild;
        const label = [...g.querySelectorAll('text')].find((t) => t.getAttribute('font-size') === '0.14');
        return {
          g, wrap, body, label,
        };
      });
    }
    e.metric.forEach((part, side) => {
      if (!part.body) return;
      part.body.setAttribute('opacity', String(Math.round(m.opacity * 1000) / 1000));
      part.body.setAttribute('transform', `translate(0 ${m.slide || 0})`);
      if (part.label) {
        if (m.compact === 1) part.label.setAttribute('display', 'none');
        else {
          part.label.removeAttribute('display');
          part.label.setAttribute('opacity', String(1 - (m.compact || 0)));
        }
      }
      if ((m.slide || 0) > 0) {
        if (!part.clip) {
          this.uid += 1;
          part.clip = document.createElementNS(SVG_NS, 'clipPath');
          part.clip.id = `${this.prefix}-live-m${this.uid}-${side}`;
          const rect = document.createElementNS(SVG_NS, 'rect');
          rect.setAttribute('width', '0.84');
          rect.setAttribute('height', '0.66');
          part.clip.append(rect);
          part.g.insertBefore(part.clip, part.wrap);
          part.wrap.setAttribute('clip-path', `url(#${part.clip.id})`);
        }
      } else if (part.clip) {
        part.clip.remove();
        part.clip = null;
        part.wrap.removeAttribute('clip-path');
      }
    });
  }

  overlayNode(key, o) {
    let e = this.nodes.get(key);
    if (!e) {
      const tpl = this.template(o.kind);
      const path = tpl ? tpl.cloneNode(true) : document.createElementNS(SVG_NS, 'path');
      path.removeAttribute('id');
      e = { outer: path };
      this.nodes.set(key, e);
    }
    const pts = o.pts.map(([x, y, z]) => this.ww(this.p2(x, y, z)));
    e.outer.setAttribute('d', pathOf(pts));
    if (o.opacity !== undefined && o.opacity < 1) e.outer.setAttribute('opacity', String(Math.round(o.opacity * 1000) / 1000));
    else e.outer.removeAttribute('opacity');
    return e;
  }

  draw({ placed, overlay }) {
    this.ensureLive();
    const { c } = this;
    /* shadows (hatch), in placed order */
    const groundY = this.at(0, 0, 0)[1];
    const shadows = placed.filter((it) => it.opacity > 0.01).map((it) => {
      const [a, o, s] = it.kind === 'shield' ? [0.4, 0.08, 1] : [0.5, 0.5, 1];
      const base = this.at(it.x, 0, it.z);
      const lift = it.lift || 0;
      const pts = [];
      [-1, 1].forEach((e) => [-1, 1].forEach((t) => [lift, lift + it.scale * s].forEach((h) => {
        const x = base[0] + e * a * it.scale + h * c.zb[0];
        const z = base[2] + t * o * it.scale + h * c.zb[1];
        pts.push(this.ww([x, groundY, z]));
      })));
      return { d: pathOf(hull(pts)), opacity: it.opacity };
    });
    while (this.shadows.children.length > shadows.length) this.shadows.lastChild.remove();
    shadows.forEach((sh, i) => {
      let g = this.shadows.children[i];
      if (!g) {
        g = document.createElementNS(SVG_NS, 'g');
        const p = document.createElementNS(SVG_NS, 'path');
        if (this.pattern) p.setAttribute('fill', `url(#${this.pattern})`);
        g.append(p);
        this.shadows.append(g);
      }
      g.firstChild.setAttribute('d', sh.d);
      if (sh.opacity < 1) g.setAttribute('opacity', String(Math.round(sh.opacity * 1000) / 1000));
      else g.removeAttribute('opacity');
    });
    /* items and overlay, depth sorted */
    const list = [];
    const seen = new Set();
    placed.forEach((it) => {
      if (it.opacity <= 0.01) return;
      const r3 = this.p2(it.x, it.lift || 0, it.z);
      const a = it.scale;
      const center = [r3[0], r3[1] + a * 0.5, r3[2]];
      const sx = it.split === undefined
        ? null : this.p2(it.split, (it.lift || 0) + a * 0.5, it.z)[0];
      const key = `p${it.key}`;
      const e = this.itemNode(key, it);
      seen.add(key);
      if (sx === null || sx <= r3[0] - a / 2 || sx >= r3[0] + a / 2) {
        e.outer.removeAttribute('clip-path');
        list.push({ depth: it.foreground ? 1e6 : this.depth(center), node: e.outer });
        return;
      }
      const m = this.depth(this.p2(it.split, (it.lift || 0) + a * 0.5, it.z));
      const h = a / 2;
      const corners = [];
      const zs = [r3[2] - h, r3[2] + h];
      [sx, r3[0] + h].forEach((x) => [r3[1], r3[1] + a].forEach((y) => zs.forEach((z) => {
        corners.push(this.ww([x, y, z]));
      })));
      const fkey = `pf${it.key}`;
      const f = this.itemNode(fkey, it);
      seen.add(fkey);
      if (!f.clip) {
        this.uid += 1;
        f.clip = document.createElementNS(SVG_NS, 'clipPath');
        f.clip.id = `${this.prefix}-live-c${this.uid}`;
        f.clip.append(document.createElementNS(SVG_NS, 'path'));
        f.holder = document.createElementNS(SVG_NS, 'g');
        f.holder.append(f.clip, f.outer);
        f.outer.setAttribute('clip-path', `url(#${f.clip.id})`);
      }
      f.clip.firstChild.setAttribute('d', pathOf(hull(corners)));
      list.push({ depth: m - 0.02, node: e.outer }, { depth: m + 0.02, node: f.holder });
    });
    overlay.forEach((o) => {
      if ((o.opacity ?? 1) <= 0.01) return;
      const key = `o${o.key}`;
      const e = this.overlayNode(key, o);
      seen.add(key);
      const at = this.p2(...o.depthAt);
      list.push({ depth: this.depth(at) + (o.kind === 'scan' ? 0.01 : 0), node: e.outer });
    });
    [...this.nodes.keys()].forEach((key) => {
      if (seen.has(key)) return;
      const e = this.nodes.get(key);
      (e.holder || e.outer).remove();
      this.nodes.delete(key);
    });
    list.sort((a, b) => a.depth - b.depth);
    const order = list.map((x) => x.node);
    const current = [...this.items.children];
    const changed = order.length !== current.length || order.some((n, i) => n !== current[i]);
    if (changed) this.items.replaceChildren(...order);
  }
}

/**
 * Inlines a hosted live-scene SVG (svg[data-live]) in place of its image and returns
 * { svg, gesture } where gesture.setActive(on) plays the source hover loop; null otherwise.
 * The <img> stays until the SVG is ready; alt text becomes role=img + aria-label (or aria-hidden).
 */
export default async function inlineLiveIllustration(img, { replace } = {}) {
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
  const kind = (markup.match(/<svg[^>]*\sdata-live="([a-z-]+)"/) || [])[1];
  if (!kind || !TIMELINES[kind]) return null;
  const prefix = nextPrefix('live');
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
  target.replaceWith(svg);
  return { svg, gesture: new LiveScene(svg, prefix) };
}
