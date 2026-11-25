/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;

  const fragment = document.createElement('div');
  fragment.innerHTML = await resp.text();

  // resolve relative media paths against the fragment location, not the page
  const base = new URL(resp.url || '/footer.plain.html', window.location.href);
  fragment.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/\/)/i.test(src)) img.src = new URL(src, base).href;
  });
  return fragment;
}

/**
 * Picks the notes, link-columns and legal sections from the fragment.
 * Authors may reorder or omit sections, so detection is content-based.
 * @param {HTMLElement} fragment
 */
function classifySections(fragment) {
  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const links = sections.find((s) => s.querySelector('h3, h4') && s.querySelector('ul'));
  const legal = [...sections].reverse().find((s) => s !== links && s.querySelector('ul'));
  const notes = sections.filter((s) => s !== links && s !== legal);
  return { notes, links, legal };
}

/**
 * Splits link text and the optional trailing icon into styleable parts.
 * An image inside a link marks it as opening in a new tab; the image alt
 * text becomes the screen-reader hint.
 * @param {HTMLAnchorElement} link
 */
function decorateLink(link) {
  const picture = link.querySelector('picture');
  const img = link.querySelector('img');
  if (picture && img) picture.replaceWith(img);
  if (img) img.remove();

  const text = document.createElement('span');
  text.className = 'footer-link-text';
  text.textContent = link.textContent.replace(/\s+/g, ' ').trim();
  link.replaceChildren(text);

  if (img) {
    const hint = (img.getAttribute('alt') || '').trim();
    img.alt = '';
    img.className = 'footer-link-icon';
    img.setAttribute('aria-hidden', 'true');
    img.width = 16;
    img.height = 16;
    img.loading = 'lazy';
    link.append(img);
    if (hint) {
      const sr = document.createElement('span');
      sr.className = 'footer-sr-only';
      sr.textContent = ` ${hint}`;
      link.append(sr);
    }
    link.target = '_blank';
    link.rel = 'noreferrer';
  }
}

/**
 * Builds the visually hidden section heading and the link columns.
 * Every h3/h4 starts a new column; the list that follows holds its links.
 * @param {Element} section
 * @returns {Element[]} nodes to append to the footer
 */
function buildColumns(section) {
  const nodes = [];
  const grid = document.createElement('div');
  grid.className = 'footer-columns';
  let column = null;

  const startColumn = (heading) => {
    column = document.createElement('nav');
    column.className = 'footer-column';
    if (heading) {
      heading.id = `footer-column-${grid.children.length}`;
      heading.className = 'footer-column-title';
      column.setAttribute('aria-labelledby', heading.id);
      column.append(heading);
    }
    grid.append(column);
  };

  [...section.children].forEach((child) => {
    if (child.tagName === 'H2') {
      child.className = 'footer-sr-only';
      nodes.push(child);
    } else if (/^H[3-6]$/.test(child.tagName)) {
      startColumn(child);
    } else if (child.tagName === 'UL') {
      if (!column) startColumn(null);
      child.className = 'footer-list';
      column.append(child);
    } else if (column) {
      column.append(child);
    }
  });

  nodes.push(grid);
  return nodes;
}

/**
 * Builds the bottom bar: legal links and copyright.
 * @param {Element} section
 */
function buildBottom(section) {
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  [...section.children].forEach((child) => {
    if (child.tagName === 'UL') child.className = 'footer-legal';
    else if (child.tagName === 'P') child.className = 'footer-copyright';
    bottom.append(child);
  });
  return bottom;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  fragment.querySelectorAll('a').forEach(decorateLink);
  const { notes, links, legal } = classifySections(fragment);

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  notes.forEach((section) => {
    section.className = 'footer-notes';
    inner.append(section);
  });
  if (links) inner.append(...buildColumns(links));
  if (legal) inner.append(buildBottom(legal));

  block.append(inner);
}
