import { inlineIllustration } from '../../scripts/illustration-construct.js';

/*
 * table-comparison
 * Row 1 = column headers (topic | carrier liability | shipping insurance).
 * Following rows = icon image + topic | carrier text | insurance text.
 * The last column is the highlighted ("recommended") column; its body cells get a
 * check marker. Rows with missing cells are padded so columns stay aligned.
 * Topic illustrations exported with construct tags build in when 30% visible and play their
 * gesture while the row is active (hovered, tapped or focused), as on the source.
 */

/** Inlines the topic illustrations and drives their gestures from the active row. */
function animateIcons(tbody) {
  const rows = [...tbody.querySelectorAll(':scope > tr')];
  const gestures = new Map();
  let hovered = null;
  let focused = null;
  const sync = () => gestures.forEach((g, row) => g.setActive(row === hovered || row === focused));
  rows.forEach((row) => {
    const img = row.querySelector('.table-comparison-topic img');
    if (!img) return;
    row.addEventListener('pointerenter', () => { hovered = row; sync(); });
    row.addEventListener('pointerleave', () => { if (hovered === row) hovered = null; sync(); });
    row.addEventListener('click', () => { hovered = row; sync(); });
    row.addEventListener('focusin', () => { focused = row; sync(); });
    row.addEventListener('focusout', () => { if (focused === row) focused = null; sync(); });
    inlineIllustration(img).then((art) => {
      if (!art?.gesture) return;
      gestures.set(row, art.gesture);
      sync();
    });
  });
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) return;
  const columns = Math.max(...rows.map((row) => row.children.length));
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const headTexts = [...rows[0].children].map((cell) => norm(cell.textContent));

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, r) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];
    for (let c = 0; c < columns; c += 1) {
      const cell = cells[c];
      const isHead = r === 0;
      const el = document.createElement(isHead || c === 0 ? 'th' : 'td');
      if (isHead) el.scope = 'col';
      else if (c === 0) el.scope = 'row';
      if (cell) el.append(...cell.childNodes);
      if (c === columns - 1 && columns > 1) el.classList.add('table-comparison-highlight');
      /* optional per-cell label (the source's mobile "tag"): a leading paragraph that repeats
         the column header is kept for screen readers but visually hidden */
      if (!isHead && c > 0) {
        const first = el.firstElementChild;
        const repeatsHeader = headTexts[c] && norm(first?.textContent) === headTexts[c];
        if (first && el.children.length > 1 && repeatsHeader) {
          first.classList.add('table-comparison-label');
        }
        /* group the answer (everything after the label) so the check marker sits beside it */
        const answer = document.createElement('div');
        answer.className = 'table-comparison-answer';
        answer.append(...[...el.childNodes].filter((n) => !n.classList?.contains('table-comparison-label')));
        if (answer.textContent.trim() || answer.querySelector('img, picture')) el.append(answer);
      }
      if (!isHead && c === 0) {
        const pic = el.querySelector('picture, img');
        if (pic) {
          const icon = pic.closest('picture') || pic;
          const holder = icon.parentElement !== el && !icon.parentElement.textContent.trim()
            ? icon.parentElement : icon;
          holder.classList.add('table-comparison-icon');
          el.classList.add('table-comparison-topic');
        }
      }
      tr.append(el);
    }
    (r === 0 ? thead : tbody).append(tr);
  });

  table.append(thead, tbody);
  /* rows are laid out as CSS grid, so keep the table semantics explicit */
  table.setAttribute('role', 'table');
  [thead, tbody].forEach((group) => group.setAttribute('role', 'rowgroup'));
  table.querySelectorAll('tr').forEach((tr) => tr.setAttribute('role', 'row'));
  thead.querySelectorAll('th').forEach((th) => th.setAttribute('role', 'columnheader'));
  tbody.querySelectorAll('th').forEach((th) => th.setAttribute('role', 'rowheader'));
  tbody.querySelectorAll('td').forEach((td) => td.setAttribute('role', 'cell'));
  block.replaceChildren(table);
  animateIcons(tbody);
}
