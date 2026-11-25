import { createOptimizedPicture } from '../../scripts/aem.js';
import { bindGesture, inlineIllustration } from '../../scripts/illustration-construct.js';
import inlineLiveIllustration from '../../scripts/illustration-live.js';

/*
 * cards-illustrated
 * Row = card: illustration image | title, description, tag list, "Learn more" link.
 * The first text element is the title, a list becomes tag chips, and a trailing
 * link-only paragraph becomes the card action (aligned right).
 * Illustrations exported with construct tags build in when 30% visible and play their gesture
 * while the card is hovered or focused, as on the source; scene exports (svg[data-live]) loop
 * while the card is hovered or focused.
 */
function decorateBody(body) {
  body.className = 'cards-illustrated-card-body';
  const els = [...body.children];
  let titled = false;
  els.forEach((el, i) => {
    const onlyLink = el.querySelector('a') && el.textContent.trim() === el.querySelector('a').textContent.trim();
    if (el.matches('ul, ol')) el.classList.add('cards-illustrated-tags');
    else if (onlyLink && i === els.length - 1) el.classList.add('cards-illustrated-action');
    else if (!titled) {
      el.classList.add('cards-illustrated-title');
      titled = true;
    } else el.classList.add('cards-illustrated-description');
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
    if (!cells.length) return;
    const li = document.createElement('li');
    li.className = 'cards-illustrated-card';
    cells.forEach((cell) => {
      const onlyImage = cell.querySelector('picture, img') && !cell.textContent.trim();
      if (onlyImage) {
        cell.className = 'cards-illustrated-card-image';
        li.append(cell);
      } else {
        decorateBody(cell);
        li.append(cell);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
  ul.querySelectorAll('.cards-illustrated-card-image img').forEach((img) => {
    const card = img.closest('.cards-illustrated-card');
    inlineIllustration(img)
      .then((art) => art || inlineLiveIllustration(img))
      .then((art) => art && bindGesture(card, art.gesture, { focus: true }));
  });
}
