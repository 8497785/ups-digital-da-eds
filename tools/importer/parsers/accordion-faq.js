/* eslint-disable */
/* global WebImporter */
/**
 * accordion-faq
 * One row per FAQ item: [question] [answer (rich content preserved)]
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  let items = [...element.querySelectorAll(':scope > [class*="m-disclosure"], :scope > [class*="m-item"]')];
  if (!items.length) items = [...element.querySelectorAll('[class*="m-disclosure"]')];

  const cells = [];
  items.forEach((item) => {
    const q = item.querySelector('[class*="m-label"]') || item.querySelector('h1, h2, h3, h4, h5, h6, button');
    const question = clean(q ? q.textContent : '');

    const answerEl = item.querySelector('[class*="m-answer"]')
      || item.querySelector('[class*="m-panelInner"]')
      || item.querySelector('[class*="m-panel"]');
    const answer = [];
    if (answerEl) {
      const blocks = [...answerEl.children];
      if (blocks.length) {
        blocks.forEach((child) => {
          if (clean(child.textContent) || child.querySelector('img')) answer.push(child);
        });
      } else if (clean(answerEl.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(answerEl.textContent);
        answer.push(p);
      }
    }

    if (question || answer.length) cells.push([question, answer]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
