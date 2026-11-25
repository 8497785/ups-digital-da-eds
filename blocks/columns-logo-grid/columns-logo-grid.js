/*
 * columns-logo-grid
 * One row: intro (heading + paragraph) | panel label ("Integrations") + logo images.
 * The logo column is the one holding the most images; its text becomes the first
 * grid cell and every image (or linked image) becomes its own bordered cell.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-logo-grid-row');
    const cols = [...row.children];
    if (!cols.length) return;
    const counts = cols.map((c) => c.querySelectorAll('img').length);
    const max = Math.max(...counts);
    const logoCol = max > 0 ? cols[counts.indexOf(max)] : null;

    cols.forEach((col) => {
      if (col !== logoCol) {
        if (col.textContent.trim() || col.querySelector('img')) col.classList.add('columns-logo-grid-intro');
        else col.remove();
      }
    });
    if (!logoCol) return;

    const grid = document.createElement('ul');
    grid.className = 'columns-logo-grid-logos';
    const label = document.createElement('li');
    label.className = 'columns-logo-grid-label';

    [...logoCol.querySelectorAll('img')].forEach((img) => {
      const unit = img.closest('a') || img.closest('picture') || img;
      const li = document.createElement('li');
      li.className = 'columns-logo-grid-logo';
      /* optional display width authored after the image in its paragraph ("110px") */
      const para = unit.closest('p');
      const size = para?.textContent.trim().match(/^(\d+(?:\.\d+)?)\s*px$/i);
      if (size) {
        li.style.setProperty('--logo-width', `${size[1]}px`);
        [...para.childNodes].forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
      }
      li.append(unit);
      grid.append(li);
      /* expose the logo's aspect ratio so CSS can give every mark the same optical area */
      const setAspect = () => {
        if (img.naturalWidth && img.naturalHeight) {
          img.style.setProperty('--logo-aspect', (img.naturalWidth / img.naturalHeight).toFixed(3));
        }
      };
      if (img.complete) setAspect();
      else img.addEventListener('load', setAspect, { once: true });
    });
    /* leftover text (the panel label) goes into the first cell */
    [...logoCol.children].forEach((el) => {
      if (el.textContent.trim()) label.append(el);
    });
    if (!label.children.length && logoCol.textContent.trim()) {
      label.textContent = logoCol.textContent.trim();
    }
    if (label.textContent.trim()) grid.prepend(label);

    logoCol.className = 'columns-logo-grid-panel';
    logoCol.replaceChildren(grid);
  });
}
