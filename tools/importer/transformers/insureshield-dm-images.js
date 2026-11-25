/* eslint-disable */
/* global WebImporter */

/**
 * InsureShield Dynamic Media / Scene7 transformer (afterTransform only).
 * Rewrites DM/Scene7 <img> elements into anchors that survive markdown:
 * - unlinked: <a href="DM-URL">alt</a>
 * - linked (image is the sole meaningful content of a link): keep the link
 *   href, move the DM URL to title, replace content with alt text.
 * Mixed-content anchors are skipped with a warning.
 * Empty alt becomes the sentinel "Image without alt text".
 */

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function detectDynamicMediaUrl(urlStr) {
  if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch (e) { return false; }
  if (u.pathname.startsWith('/is/image/')) return 'scene7';
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
    && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

function isSoleMeaningfulDescendant(anchor, img) {
  if (anchor.textContent.trim() !== '') return false;
  const media = anchor.querySelectorAll('img, svg, video, iframe, canvas');
  return media.length === 1 && media[0] === img;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!detectDynamicMediaUrl(src)) return;

    const altRaw = (img.getAttribute('alt') || '').trim();
    const alt = altRaw || EMPTY_ALT_SENTINEL;
    const anchor = img.closest('a');

    if (anchor) {
      if (!isSoleMeaningfulDescendant(anchor, img)) {
        // eslint-disable-next-line no-console
        console.warn(`[dm-images] skipping DM image inside mixed-content link: ${src}`);
        return;
      }
      anchor.setAttribute('title', src);
      anchor.textContent = alt;
      return;
    }

    const a = doc.createElement('a');
    a.setAttribute('href', src);
    a.textContent = alt;
    const picture = img.parentElement && img.parentElement.tagName === 'PICTURE'
      ? img.parentElement
      : null;
    (picture || img).replaceWith(a);
  });
}
