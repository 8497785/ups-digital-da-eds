import { bindGesture, inlineIllustration } from '../../scripts/illustration-construct.js';

/*
 * columns-illustration
 * One row: illustration image | heading, check list, CTA. Either order works; the
 * image column is detected by content. Extra rows are laid out the same way.
 * An illustration exported with construct tags builds in when 30% visible and plays its
 * gesture while hovered, as on the source.
 */

/**
 * Split a list item into title + description.
 * Preferred: authored bold (<strong>/<b>) at the start of the item.
 * Fallback: plain text where the title runs straight into the description
 * ("Peace of mindApply, review ..."), split at the first lowercase-to-capital
 * boundary that is followed by a sentence.
 */
function decorateItem(li) {
  const text = document.createElement('span');
  text.className = 'columns-illustration-item-text';

  const first = [...li.childNodes]
    .find((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
  const isBold = first && first.nodeType === Node.ELEMENT_NODE && first.matches('strong, b');
  const bold = isBold ? first : null;

  if (bold) {
    const title = document.createElement('span');
    title.className = 'columns-illustration-item-title';
    title.append(...bold.childNodes);
    bold.remove();
    const desc = document.createElement('span');
    desc.className = 'columns-illustration-item-desc';
    desc.append(...li.childNodes);
    if (desc.firstChild && desc.firstChild.nodeType === Node.TEXT_NODE) {
      desc.firstChild.textContent = desc.firstChild.textContent.replace(/^\s+/, '');
    }
    text.append(title);
    if (desc.textContent.trim()) text.append(desc);
  } else if (li.children.length === 0) {
    const raw = li.textContent.trim();
    const match = raw.match(/^(.+?[a-z)])([A-Z][a-z]*[\s,].+)$/);
    if (match) {
      const [, titleText, descText] = match;
      const title = document.createElement('span');
      title.className = 'columns-illustration-item-title';
      title.textContent = titleText;
      const desc = document.createElement('span');
      desc.className = 'columns-illustration-item-desc';
      desc.textContent = descText;
      text.append(title, desc);
    } else {
      text.textContent = raw;
    }
    li.textContent = '';
  } else {
    text.append(...li.childNodes);
  }
  li.append(text);
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-illustration-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture, img');
      const hasText = [...col.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')]
        .some((el) => !el.querySelector('picture, img') && el.textContent.trim());
      if (pic && !hasText) {
        col.classList.add('columns-illustration-media');
        const img = col.querySelector('img');
        if (img) inlineIllustration(img).then((art) => art && bindGesture(art.svg, art.gesture));
      } else if (col.textContent.trim()) {
        col.classList.add('columns-illustration-content');
        col.querySelectorAll('ul').forEach((ul) => {
          ul.classList.add('columns-illustration-checklist');
          ul.querySelectorAll(':scope > li').forEach(decorateItem);
        });
        // a paragraph holding only a link is the outlined pill CTA
        col.querySelectorAll('p').forEach((p) => {
          const links = p.querySelectorAll('a[href]');
          if (links.length === 1 && p.textContent.trim() === links[0].textContent.trim()
            && !links[0].querySelector('img, picture')) {
            p.classList.add('columns-illustration-cta-wrapper');
            links[0].classList.add('columns-illustration-cta');
          }
        });
      } else col.remove();
    });
  });
}
