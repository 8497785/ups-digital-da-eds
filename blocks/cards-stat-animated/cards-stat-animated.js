import { createOptimizedPicture } from '../../scripts/aem.js';
import { bindGesture } from '../../scripts/illustration-construct.js';
import inlineLiveIllustration from '../../scripts/illustration-live.js';

/*
 * cards-stat-animated
 * Row = card. Cell 1: poster image + animation key paragraph (none | freight-journey |
 * claims-laptop). Cell 2: title, **stat value**, stat label, description.
 * Animated cards lazy-load three.js (scripts/vendor) and their renderer module
 * only when the card nears the viewport; the poster stays when motion is reduced,
 * WebGL is missing, or a renderer fails. A static card whose poster is a scene export
 * (svg[data-live], e.g. the 62M boxes) is inlined and loops while the card is hovered or focused.
 */

const RENDERERS = {
  'freight-journey': () => import('./freight-journey.js'),
  'claims-laptop': () => import('./claims-laptop.js'),
};
const KEY_PATTERN = /^(none|static|freight-journey|claims-laptop)$/i;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover)').matches;

let webglSupport;
function hasWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas');
      webglSupport = !!canvas.getContext('webgl2');
    } catch (e) {
      webglSupport = false;
    }
  }
  return webglSupport;
}

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/** Reads and removes the animation key from the media cell; returns the key. */
function extractKey(cell) {
  let key = 'none';
  [...cell.querySelectorAll('p, div, span')].forEach((el) => {
    if (el.querySelector('picture, img')) return;
    const text = el.textContent.trim().toLowerCase().replace(/^animation\s*:\s*/, '');
    if (KEY_PATTERN.test(text)) {
      key = text === 'static' ? 'none' : text;
      el.remove();
    }
  });
  /* bare text node directly in the cell */
  [...cell.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent.trim().toLowerCase();
    if (KEY_PATTERN.test(text)) {
      key = text === 'static' ? 'none' : text;
      node.remove();
    }
  });
  return key;
}

/** Wraps elements in a div with the given class; returns null when there are none. */
function group(els, className) {
  if (!els.length) return null;
  const div = document.createElement('div');
  div.className = className;
  div.append(...els);
  return div;
}

/**
 * Classes the body elements and groups them into at most three rows
 * (head, stat, text) so tiles can share rows through a CSS subgrid.
 */
function decorateBody(body) {
  body.className = 'cards-stat-animated-card-body';
  const els = [...body.children];
  const statIndex = els.findIndex((el) => {
    const strong = el.querySelector('strong, b');
    return strong && el.textContent.trim() === strong.textContent.trim() && !el.querySelector('a');
  });
  const headEnd = statIndex < 0 ? Math.min(els.length, 1) : statIndex;
  const statEnd = statIndex < 0 ? headEnd : Math.min(els.length, statIndex + 2);
  els.forEach((el, i) => {
    if (i === 0 && statIndex !== 0) el.classList.add('cards-stat-animated-title');
    else if (i === statIndex) el.classList.add('cards-stat-animated-stat');
    else if (statIndex >= 0 && i === statIndex + 1) el.classList.add('cards-stat-animated-stat-label');
    else el.classList.add('cards-stat-animated-description');
  });
  body.replaceChildren(...[
    group(els.slice(0, headEnd), 'cards-stat-animated-head'),
    group(els.slice(headEnd, statEnd), 'cards-stat-animated-stat-group'),
    group(els.slice(statEnd), 'cards-stat-animated-text'),
  ].filter(Boolean));
}

/** Watches for the block leaving the document so renderers can be disposed. */
function onDisconnect(el, cb) {
  const mo = new MutationObserver(() => {
    if (!el.isConnected) {
      mo.disconnect();
      cb();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  return () => mo.disconnect();
}

function setupAnimation(card, media, key, cleanups) {
  const load = RENDERERS[key];
  if (!load || reducedMotion() || !hasWebGL()) return;

  const stage = document.createElement('div');
  stage.className = 'cards-stat-animated-stage';
  stage.setAttribute('aria-hidden', 'true');
  media.append(stage);

  let renderer = null;
  let loading = false;
  let inView = false;
  let hovered = false;
  let focused = false;
  let mostlyInView = false;
  const pageVisible = () => document.visibilityState !== 'hidden';

  const showPoster = () => {
    media.dataset.renderer = 'poster';
    renderer?.dispose();
    renderer = null;
  };
  const sync = () => {
    if (!renderer) return;
    renderer.setVisible(inView && pageVisible());
    const touchActive = !canHover() && mostlyInView;
    const active = hovered || focused || touchActive;
    card.dataset.active = String(active);
    renderer.setPlayback(active);
  };

  const mount = async () => {
    if (loading || renderer) return;
    loading = true;
    try {
      const mod = await load();
      if (!card.isConnected) return;
      renderer = mod.default(stage, { onFail: showPoster });
      media.dataset.renderer = 'webgl';
      sync();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`cards-stat-animated: ${key} unavailable; showing the poster.`, err);
      showPoster();
    }
  };

  /* lazy mount shortly before the card scrolls in */
  const nearObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      nearObserver.disconnect();
      mount();
    }
  }, { rootMargin: '200px 0px' });
  nearObserver.observe(media);

  /* pause off-screen; on touch devices play while mostly in view */
  const viewObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      inView = e.isIntersecting;
      mostlyInView = e.intersectionRatio >= 0.6;
    });
    sync();
  }, { threshold: [0, 0.6] });
  viewObserver.observe(media);

  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    hovered = true;
    sync();
  });
  card.addEventListener('pointerleave', () => { hovered = false; sync(); });
  card.addEventListener('focusin', () => { focused = true; sync(); });
  card.addEventListener('focusout', (e) => {
    if (card.contains(e.relatedTarget)) return;
    focused = false;
    sync();
  });
  document.addEventListener('visibilitychange', sync);

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotionChange = () => { if (motionQuery.matches) showPoster(); };
  motionQuery.addEventListener('change', onMotionChange);

  cleanups.push(() => {
    nearObserver.disconnect();
    viewObserver.disconnect();
    document.removeEventListener('visibilitychange', sync);
    motionQuery.removeEventListener('change', onMotionChange);
    renderer?.dispose();
    renderer = null;
  });
}

export default function decorate(block) {
  /* optimize first: createOptimizedPicture replaces the <picture> the poster class goes on */
  optimizePictures(block);
  const ul = document.createElement('ul');
  const animated = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const li = document.createElement('li');
    li.className = 'cards-stat-animated-card';

    const isKeyOnly = (c) => KEY_PATTERN.test(c.textContent.trim().replace(/^animation\s*:\s*/i, ''));
    const mediaCell = cells.find((c) => c.querySelector('picture, img'))
      || cells.find((c) => cells.length > 1 && isKeyOnly(c));
    const bodyCell = cells.find((c) => c !== mediaCell && c.textContent.trim()) || null;

    if (mediaCell) {
      const key = extractKey(mediaCell);
      const media = document.createElement('div');
      media.className = 'cards-stat-animated-card-media';
      media.dataset.animation = key;
      media.dataset.renderer = 'poster';
      const poster = mediaCell.querySelector('picture') || mediaCell.querySelector('img');
      if (poster) {
        poster.classList.add('cards-stat-animated-poster');
        const alt = (poster.querySelector('img') || poster).getAttribute('alt');
        if (alt && key !== 'none') {
          media.setAttribute('role', 'img');
          media.setAttribute('aria-label', alt);
        }
        media.append(poster);
      }
      li.append(media);
      if (key !== 'none') animated.push({ li, media, key });
      else if (poster) {
        const img = poster.querySelector('img') || poster;
        inlineLiveIllustration(img, { replace: poster })
          .then((art) => art && bindGesture(li, art.gesture, { focus: true }));
      }
    }

    if (bodyCell) {
      decorateBody(bodyCell);
      li.append(bodyCell);
    }
    ul.append(li);
  });

  block.replaceChildren(ul);

  if (!animated.length) return;
  const cleanups = [];
  animated.forEach(({ li, media, key }) => setupAnimation(li, media, key, cleanups));
  if (cleanups.length) {
    onDisconnect(block, () => cleanups.forEach((fn) => fn()));
  }
}
