import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-story
 * Row = card: photo | eyebrow, title, description, link.
 * With 3+ text elements the first short paragraph is the eyebrow ("Customer story",
 * "Article"); a heading, or the next paragraph, is the title; a trailing link-only
 * paragraph is the action. The whole card is clickable through the action link.
 */
function decorateBody(body) {
  body.className = 'cards-story-card-body';
  const els = [...body.children];
  const isLinkOnly = (el) => {
    const a = el.querySelector('a');
    return a && el.textContent.trim() === a.textContent.trim();
  };
  const action = els.length > 1 && isLinkOnly(els[els.length - 1]) ? els[els.length - 1] : null;
  const rest = els.filter((el) => el !== action);
  const headingIndex = rest.findIndex((el) => /^H[1-6]$/.test(el.tagName));
  let titleIndex = headingIndex;
  if (titleIndex < 0) titleIndex = rest.length >= 3 ? 1 : 0;
  rest.forEach((el, i) => {
    if (i === titleIndex) {
      el.classList.add('cards-story-title');
      // inline wrapper: carries the inert ::after that matches the source line balancing
      const text = document.createElement('span');
      text.className = 'cards-story-title-text';
      text.append(...el.childNodes);
      el.append(text);
    } else if (i < titleIndex) el.classList.add('cards-story-eyebrow');
    else el.classList.add('cards-story-description');
  });
  if (action) action.classList.add('cards-story-action');
  return action?.querySelector('a');
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
    if (!cells.length) return;
    const li = document.createElement('li');
    li.className = 'cards-story-card';
    cells.forEach((cell) => {
      if (cell.querySelector('picture, img') && !cell.textContent.trim()) {
        cell.className = 'cards-story-card-image';
      } else {
        const link = decorateBody(cell);
        if (link) li.classList.add('cards-story-linked');
      }
      li.append(cell);
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
