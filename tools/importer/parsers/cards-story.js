/* eslint-disable */
/* global WebImporter */
/**
 * cards-story
 * One row per card: [photo] [eyebrow, title (h3), description, "Read the ..." link]
 * The source cue ("Read the story") is a span; it is rebuilt as a link to the title URL.
 * Scene7 photo URLs are kept as-is (the DM transformer rewrites them later).
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const list = element.matches('ul') ? element : element.querySelector('ul');
  const cards = [...(list || element).querySelectorAll(':scope > li')];

  const cells = [];
  cards.forEach((card) => {
    const titleEl = card.querySelector('h1, h2, h3, h4, h5, h6');
    const titleLink = (titleEl && titleEl.querySelector('a[href]')) || card.querySelector('a[href]');
    const href = titleLink ? titleLink.getAttribute('href') : '';
    const title = clean(titleEl ? titleEl.textContent : '');

    const media = [];
    const srcImg = card.querySelector('[class*="m-media"] img') || card.querySelector('img:not([src^="data:"])');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || title;
      media.push(img);
    }

    const body = [];
    const eyebrow = card.querySelector('[class*="m-eyebrow"]');
    if (eyebrow && clean(eyebrow.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(eyebrow.textContent);
      body.push(p);
    }
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    const desc = card.querySelector('[class*="m-body"]');
    if (desc && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      body.push(p);
    }
    const cue = card.querySelector('[class*="m-foot"] a[href], [class*="m-cue"]');
    const cueText = clean(cue ? cue.textContent : '') || (href ? 'Read more' : '');
    const cueHref = (cue && cue.getAttribute('href')) || href;
    if (cueText && cueHref) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cueHref;
      a.textContent = cueText;
      p.append(a);
      body.push(p);
    }

    cells.push([media, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-story', cells });
  element.replaceWith(block);
}
