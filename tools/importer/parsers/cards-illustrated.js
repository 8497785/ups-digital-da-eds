/* eslint-disable */
/* global WebImporter */
/**
 * cards-illustrated
 * One row per card: [illustration image] [title, description, tag list, "Learn more" link]
 * The source card is fully clickable via the title link; the "Learn more" cue is a
 * span, so it is rebuilt as a link to the same URL.
 */
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';
const ILLUSTRATIONS = [
  { match: /commerceshield/i, file: 'solution-commerceshield.svg' },
  { match: /parcel\s*pro/i, file: 'solution-parcel-pro.svg' },
];

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const list = element.matches('ul') ? element : element.querySelector('ul');
  const cards = [...(list || element).querySelectorAll(':scope > li')];

  const cells = [];
  cards.forEach((card, cardIndex) => {
    const titleEl = card.querySelector('h1, h2, h3, h4, h5, h6');
    const titleLink = (titleEl && titleEl.querySelector('a[href]')) || card.querySelector('a[href]');
    const href = titleLink ? titleLink.getAttribute('href') : '';
    const title = clean(titleEl ? titleEl.textContent : '');

    // image cell
    // The source illustrations are inline SVGs (data URIs in the scrape) that markdown
    // drops; use the hosted copies, matched by card title, then by position.
    const media = [];
    const mediaWrap = card.querySelector('[class*="m-media"]') || card;
    const srcImg = mediaWrap.querySelector('img');
    const srcSrc = srcImg ? srcImg.getAttribute('src') || '' : '';
    const hosted = ILLUSTRATIONS.find((m) => m.match.test(title)) || ILLUSTRATIONS[cardIndex];
    const isDrawing = mediaWrap.querySelector('svg') || /^data:image\/svg/.test(srcSrc) || !srcSrc;
    const src = isDrawing && hosted ? `${ASSET_BASE}${hosted.file}?format=svg` : srcSrc;
    if (src && !/^data:/.test(src)) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = (srcImg && srcImg.getAttribute('alt')) || '';
      media.push(img);
    }

    // body cell
    const body = [];
    if (title) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      body.push(h3);
    }
    const desc = card.querySelector('[class*="m-body"]');
    if (desc && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      body.push(p);
    }
    const tags = [...card.querySelectorAll('[class*="m-extra"] li')]
      .map((li) => clean(li.textContent)).filter(Boolean);
    if (tags.length) {
      const ul = document.createElement('ul');
      tags.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.append(li);
      });
      body.push(ul);
    }
    const cue = card.querySelector('[class*="m-foot"] a, [class*="m-cue"]');
    const cueText = clean(cue ? cue.textContent : '');
    if (cueText) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = (cue.getAttribute && cue.getAttribute('href')) || href;
      a.textContent = cueText;
      p.append(a);
      body.push(p);
    }

    cells.push([media, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-illustrated', cells });
  element.replaceWith(block);
}
