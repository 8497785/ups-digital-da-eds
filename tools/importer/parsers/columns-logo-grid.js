/* eslint-disable */
/* global WebImporter */
/**
 * columns-logo-grid
 * One row: [H2 + paragraph] [label paragraph ("Integrations") + logo images]
 *
 * The source renders the partner logos as CSS-masked spans (span.m-mark-*) with no
 * <img> in the DOM. The logo assets are taken from the source bundle (index-UfCqhPTV.js),
 * in the order the source renders them. WooCommerce is inlined there as a data URI, so it
 * points at the hosted copy in /assets/shipping-insurance/ instead.
 * A real (non data-URI) <img> or link inside a source cell wins over the fallback.
 * Each logo paragraph ends with the mark's display width ("110px", the source --logo-width).
 */
const SOURCE_ORIGIN = 'https://www.insureshield.com';
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';
// width: the source's per-mark --logo-width (inline style on span.m-mark-*), used when absent
const LOGOS = [
  { name: 'Shopify', src: `${SOURCE_ORIGIN}/assets/insureshield/shopify-m40Qf4lq.svg`, width: '110px' },
  { name: 'ShipStation', src: `${SOURCE_ORIGIN}/assets/insureshield/shipstation-b6mFKFub.svg`, width: '154px' },
  { name: 'Shippo', src: `${SOURCE_ORIGIN}/assets/insureshield/shippo-D6PlM04S.svg`, width: '110px' },
  { name: 'AfterShip', src: `${SOURCE_ORIGIN}/assets/insureshield/aftership-duFfXxE8.svg`, width: '125px' },
  { name: 'WooCommerce', src: `${ASSET_BASE}logo-woocommerce.svg`, width: '91px' },
];

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // intro column
  const intro = [];
  const introWrap = element.querySelector('[class*="m-intro"]') || element;
  const heading = introWrap.querySelector('h1, h2, h3');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(heading.textContent);
    intro.push(h2);
  }
  [...introWrap.querySelectorAll('p')].forEach((p) => {
    if (!clean(p.textContent)) return;
    const np = document.createElement('p');
    np.textContent = clean(p.textContent);
    intro.push(np);
  });

  // logo panel column
  const panel = [];
  const labelEl = element.querySelector('[class*="m-label"] h3, [class*="m-label"]');
  if (labelEl && clean(labelEl.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(labelEl.textContent);
    panel.push(p);
  }
  const logoCells = [...element.querySelectorAll('li[class*="m-cell"]')];
  logoCells.forEach((cell, i) => {
    const srcImg = cell.querySelector('img:not([src^="data:"])');
    const fallback = LOGOS[i];
    let src = (srcImg && srcImg.getAttribute('src')) || (fallback && fallback.src);
    if (!src) return;
    // html2md turns any <img src="*.svg"> into an :icon: token; a query string keeps the
    // logo a real image asset (the block needs <img> elements to build the grid).
    if (/^https?:.*\.svg$/i.test(src)) src += '?format=svg';
    const img = document.createElement('img');
    img.src = src;
    img.alt = (srcImg && srcImg.getAttribute('alt')) || clean(cell.textContent) || (fallback ? fallback.name : '');
    // the mark's display width follows the image in the same paragraph ("110px")
    const mark = cell.querySelector('[style*="--logo-width"]');
    const styled = mark && (mark.getAttribute('style') || '').match(/--logo-width:\s*([\d.]+px)/);
    const width = (styled && styled[1]) || (fallback && fallback.width) || '';
    const p = document.createElement('p');
    const link = cell.querySelector('a[href]');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.append(img);
      p.append(a);
    } else {
      p.append(img);
    }
    if (width) p.append(document.createTextNode(` ${width}`));
    panel.push(p);
  });

  const cells = [[intro, panel]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-logo-grid', cells });
  element.replaceWith(block);
}
