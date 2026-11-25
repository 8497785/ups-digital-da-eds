/* eslint-disable */
/* global WebImporter */
/**
 * table-comparison
 * Row 1: column headers (topic | carrier liability | shipping insurance).
 * Body rows: [topic illustration + topic title] [label + carrier text] [label + insurance text].
 * The per-cell "tag" (the column name the source shows on mobile) is kept as a leading
 * paragraph; the block marks it visually hidden. The decorative check icons are dropped
 * (the block draws its own marker on the last column).
 * Topic illustrations are inline SVGs in the source (data URIs in the scrape) and are
 * dropped by markdown, so the hosted copies are used, matched by topic title, then row index.
 */
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';
const TOPIC_ICONS = [
  { match: /general|coverage/i, file: 'compare-general-shipping-coverage.svg' },
  { match: /porch|piracy|theft/i, file: 'compare-porch-piracy-theft.svg' },
  { match: /time.?sensitive|perishable/i, file: 'compare-time-sensitive-goods.svg' },
  { match: /reship/i, file: 'compare-reshipment-speed.svg' },
  { match: /high.?value/i, file: 'compare-high-value-shipments.svg' },
  { match: /claim/i, file: 'compare-claims-process.svg' },
];

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const para = (text) => {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  };
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) return;

  const cells = [];

  const headCells = [...table.querySelectorAll('thead th, thead td')];
  const headTexts = headCells.map((th) => clean(th.textContent));
  if (headCells.length) cells.push(headTexts);
  const columns = Math.max(headCells.length, 1);

  const rows = [...table.querySelectorAll('tbody > tr')];
  rows.forEach((tr, rowIndex) => {
    const srcCells = [...tr.children].filter((c) => c.matches('th, td'));
    const row = srcCells.map((cell, i) => {
      if (i === 0) {
        const content = [];
        const titleEl = cell.querySelector('[class*="m-topicTitle"]');
        const title = clean((titleEl || cell).textContent);
        const srcImg = cell.querySelector('img');
        const srcSrc = srcImg ? srcImg.getAttribute('src') || '' : '';
        const hasDrawing = cell.querySelector('svg') || /^data:image\/svg/.test(srcSrc);
        const hosted = TOPIC_ICONS.find((t) => t.match.test(title)) || TOPIC_ICONS[rowIndex];
        let src = '';
        if (hasDrawing && hosted) src = `${ASSET_BASE}${hosted.file}?format=svg`;
        else if (srcSrc && !/^data:/.test(srcSrc)) src = srcSrc;
        if (src) {
          const icon = document.createElement('img');
          icon.src = src;
          icon.alt = (srcImg && srcImg.getAttribute('alt')) || '';
          content.push(icon);
        }
        if (title) content.push(para(title));
        return content;
      }
      const content = [];
      const tag = cell.querySelector('[class*="m-tag"]');
      const tagText = clean(tag ? tag.textContent : '');
      const answer = cell.querySelector('[class*="m-answer"]');
      let text = clean((answer || cell).textContent);
      if (!answer && tagText) text = clean(text.replace(tagText, ''));
      if (tagText && text) content.push(para(tagText));
      if (text) content.push(para(text));
      return content;
    });
    while (row.length < columns) row.push('');
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-comparison', cells });
  element.replaceWith(block);
}
