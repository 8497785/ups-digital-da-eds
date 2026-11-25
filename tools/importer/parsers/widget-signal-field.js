/* eslint-disable */
/* global WebImporter */
/**
 * widget-signal-field
 * The source band is a canvas-only animated pattern; author it as a single cell
 * holding a link to the signal-field widget.
 */
export default function parse(element, { document }) {
  const a = document.createElement('a');
  a.href = '/widgets/signal-field';
  a.textContent = 'signal field';
  const p = document.createElement('p');
  p.append(a);

  const cells = [[[p]]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-signal-field', cells });
  element.replaceWith(block);
}
