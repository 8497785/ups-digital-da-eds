/* eslint-disable */
/* global WebImporter */
/**
 * columns-illustration
 * One row: [illustration image] [H2, bulleted list (bold title + description), CTA link]
 */
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cols = [...element.children];
  const textCol = cols.find((c) => c.querySelector('h1, h2, h3, ul')) || element;
  const imageCol = cols.find((c) => c !== textCol && c.querySelector('img'));

  // image column
  // The source illustration is an inline SVG (data URI in the scrape) that markdown drops;
  // use the hosted copy whenever the image column holds a drawing (svg or data-URI img).
  const imageCell = [];
  const otherCol = imageCol || cols.find((c) => c !== textCol);
  const srcImg = otherCol ? otherCol.querySelector('img') : null;
  const srcSrc = srcImg ? srcImg.getAttribute('src') || '' : '';
  const isDrawing = otherCol && (otherCol.querySelector('svg') || /^data:image\/svg/.test(srcSrc));
  const src = isDrawing ? `${ASSET_BASE}benefits-illustration.svg?format=svg` : srcSrc;
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = (srcImg && srcImg.getAttribute('alt')) || '';
    imageCell.push(img);
  }

  // text column
  const textCell = [];
  const heading = textCol.querySelector('h1, h2, h3');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(heading.textContent);
    textCell.push(h2);
  }
  const srcList = textCol.querySelector('ul, ol');
  if (srcList) {
    const ul = document.createElement('ul');
    [...srcList.querySelectorAll(':scope > li')].forEach((li) => {
      const textWrap = li.querySelector('[class*="m-text"]') || li;
      const inner = textWrap.querySelector(':scope > span') || textWrap;
      const parts = [...inner.querySelectorAll(':scope > span')].map((s) => clean(s.textContent)).filter(Boolean);
      const item = document.createElement('li');
      if (parts.length >= 2) {
        const strong = document.createElement('strong');
        strong.textContent = parts[0];
        item.append(strong, document.createTextNode(` ${parts.slice(1).join(' ')}`));
      } else {
        item.textContent = clean(li.textContent);
      }
      if (clean(item.textContent)) ul.append(item);
    });
    textCell.push(ul);
  }
  const cta = [...textCol.querySelectorAll('a[href]')].pop();
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = clean((cta.querySelector('[class*="m-label"]') || cta).textContent);
    p.append(a);
    textCell.push(p);
  }

  const cells = [[imageCell, textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-illustration', cells });
  element.replaceWith(block);
}
