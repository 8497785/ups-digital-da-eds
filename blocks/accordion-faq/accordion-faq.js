/*
 * accordion-faq
 * Each row = question | answer, rendered as native <details>/<summary>.
 * A row with a single cell uses its first heading/paragraph as the question and
 * the rest as the answer; empty rows are dropped.
 * Items share a `name`, so opening one closes the others (as on the source).
 */
let blockCount = 0;

export default function decorate(block) {
  blockCount += 1;
  const groupName = `accordion-faq-${blockCount}`;
  const items = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length || !row.textContent.trim()) return;

    let labelNodes;
    let body;
    if (cells.length >= 2) {
      labelNodes = [...cells[0].childNodes];
      [, body] = cells;
      cells.slice(2).forEach((extra) => body.append(...extra.childNodes));
    } else {
      const [only] = cells;
      const first = only.firstElementChild;
      labelNodes = first ? [first] : [...only.childNodes];
      body = only;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    const text = document.createElement('span');
    text.className = 'accordion-faq-item-text';
    /* unwrap a single paragraph/heading so the summary holds inline text */
    const single = labelNodes
      .filter((n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim());
    const [labelEl] = single;
    if (single.length === 1 && labelEl.nodeType === Node.ELEMENT_NODE && /^(P|H[1-6])$/.test(labelEl.tagName)) {
      text.append(...labelEl.childNodes);
      labelEl.remove();
    } else {
      text.append(...labelNodes);
    }
    const icon = document.createElement('span');
    icon.className = 'accordion-faq-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(text, icon);

    body.className = 'accordion-faq-item-body';
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.setAttribute('name', groupName);
    details.append(summary, body);
    items.push(details);
  });
  block.replaceChildren(...items);
}
