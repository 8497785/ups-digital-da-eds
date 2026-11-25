/* eslint-disable */
/* global WebImporter */

/**
 * InsureShield hosted SVG transformer (afterTransform only).
 * The animated illustrations live in the code bus (/assets/shipping-insurance/<name>.svg). Many
 * exceed the 40 KB Edge Delivery allows for SVG images in content, and links or images to them are
 * rewritten by authoring/content sync, so decorative illustrations are written as icon tokens:
 *   :illustration-<name>:
 * scripts/scripts.js (buildIllustrations) turns each token into <picture><img alt=""> pointing at
 * /assets/shipping-insurance/<name>.svg before blocks are decorated.
 * Logos (logo-*.svg: small, with meaningful alt text) stay ordinary images.
 */

const PROJECT_HOST = /^[a-z0-9-]+--ups-digital-da-eds--8497785\.aem\.(page|live)$/;
const ASSET_DIR = '/assets/shipping-insurance/';

function illustrationName(src) {
  let u;
  try { u = new URL(src); } catch (e) { return null; }
  if (!PROJECT_HOST.test(u.hostname) || !u.pathname.startsWith(ASSET_DIR)) return null;
  const m = u.pathname.slice(ASSET_DIR.length).match(/^([a-z0-9-]+)\.svg$/i);
  if (!m || /^logo-/i.test(m[1])) return null;
  return m[1].toLowerCase();
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const name = illustrationName(img.getAttribute('src') || '');
    if (!name) return;
    if (img.closest('a')) {
      // eslint-disable-next-line no-console
      console.warn(`[hosted-svg] skipping linked illustration: ${name}`);
      return;
    }
    const picture = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement
      : null;
    (picture || img).replaceWith(doc.createTextNode(`:illustration-${name}:`));
  });
}
