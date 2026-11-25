/* eslint-disable */
/* global WebImporter */

/**
 * InsureShield hosted SVG transformer (afterTransform only).
 * The animated illustrations live in the code bus (/assets/shipping-insurance/...) and many are
 * larger than the 40 KB Edge Delivery allows for SVG images in content, so they can't be
 * authored as images. Each <img> pointing at a project-hosted /assets/*.svg becomes a link:
 *   <a href="https://main--ups-digital-da-eds--8497785.aem.page/assets/.../name.svg">alt</a>
 * Empty alt becomes the sentinel "Image without alt text".
 * scripts/scripts.js (localizeProjectAssets) turns these links back into <picture><img>
 * before blocks are decorated.
 */

const EMPTY_ALT_SENTINEL = 'Image without alt text';
const PROJECT_HOST = /^[a-z0-9-]+--ups-digital-da-eds--8497785\.aem\.(page|live)$/;

function hostedSvgUrl(src) {
  let u;
  try { u = new URL(src); } catch (e) { return null; }
  if (!PROJECT_HOST.test(u.hostname) || !u.pathname.startsWith('/assets/')) return null;
  if (!u.pathname.toLowerCase().endsWith('.svg')) return null;
  // ?format=svg only kept the importer from turning <img> into :icon: tokens; links don't need it
  u.searchParams.delete('format');
  return u.toString();
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const href = hostedSvgUrl(img.getAttribute('src') || '');
    if (!href) return;
    if (img.closest('a')) {
      // eslint-disable-next-line no-console
      console.warn(`[hosted-svg] skipping linked image: ${href}`);
      return;
    }
    const a = doc.createElement('a');
    a.setAttribute('href', href);
    a.textContent = (img.getAttribute('alt') || '').trim() || EMPTY_ALT_SENTINEL;
    const picture = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement
      : null;
    (picture || img).replaceWith(a);
  });
}
