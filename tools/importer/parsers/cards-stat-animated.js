/* eslint-disable */
/* global WebImporter */
/**
 * cards-stat-animated
 * One row per stat tile:
 *   [poster image + animation key paragraph (none | freight-journey | claims-laptop)]
 *   [title, **stat value**, stat label, description]
 */
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';
const POSTERS = {
  none: 'stat-packages-box.svg',
  'freight-journey': 'stat-freight-journey-poster.svg',
  'claims-laptop': 'stat-claims-laptop-poster.svg',
};

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const list = element.matches('ul') ? element : element.querySelector('ul');
  const tiles = [...(list || element).querySelectorAll(':scope > li')];

  const detectKey = (tile, index, title) => {
    if (tile.querySelector('[data-freight-journey], [data-animation="freight-journey"]')) return 'freight-journey';
    if (tile.querySelector('[data-claims-laptop], [data-animation="claims-laptop"]')) return 'claims-laptop';
    if (/multi-carrier|multi-modal|freight/i.test(title)) return 'freight-journey';
    if (/claim/i.test(title)) return 'claims-laptop';
    if (tile.querySelector('canvas')) {
      if (index === 1) return 'freight-journey';
      if (index === 2) return 'claims-laptop';
    }
    return 'none';
  };

  const cells = [];
  tiles.forEach((tile, index) => {
    const titleEl = tile.querySelector('h1, h2, h3, h4, h5, h6, [class*="m-title"]');
    const title = clean(titleEl ? titleEl.textContent : '');

    // media cell: poster image + key. The source posters are inline SVG / data-URI
    // drawings (lost in markdown), so they are replaced by the hosted copies, matched
    // by animation key (title/position), never by image content.
    const key = detectKey(tile, index, title);
    const media = [];
    const posterName = POSTERS[key] || (index === 0 ? POSTERS.none : null);
    const posterSrc = tile.querySelector('[class*="m-mediaInner"] img') || tile.querySelector('img');
    const src = posterName ? `${ASSET_BASE}${posterName}?format=svg` : (posterSrc && posterSrc.getAttribute('src'));
    if (src && !/^data:/.test(src)) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = (posterSrc && posterSrc.getAttribute('alt')) || title;
      media.push(img);
    }
    const keyP = document.createElement('p');
    keyP.textContent = key;
    media.push(keyP);

    // body cell
    const body = [];
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    const value = tile.querySelector('[class*="m-statValue"]');
    if (value && clean(value.textContent)) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = clean(value.textContent);
      p.append(strong);
      body.push(p);
    }
    const label = tile.querySelector('[class*="m-statLabel"]');
    if (label && clean(label.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(label.textContent);
      body.push(p);
    }
    const desc = tile.querySelector('[class*="m-body"]');
    if (desc && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      body.push(p);
    }

    cells.push([media, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stat-animated', cells });
  element.replaceWith(block);
}
