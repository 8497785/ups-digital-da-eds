/* eslint-disable */
/* global WebImporter */

/**
 * InsureShield sections transformer.
 * Uses payload.template.sections from tools/importer/page-templates.json.
 *
 * beforeTransform: insert <hr> section breaks before every non-first section
 * (while parser targets still exist). Styled sections get a temporary
 * data-excat-section-id marker on their <hr>; a styled first section gets a
 * temporary marked <hr> that is removed in afterTransform.
 * afterTransform: insert Section Metadata for styled sections after the
 * surviving section element (or after the marker <hr> if the parser replaced
 * the element), then clean up markers.
 */

const MARKER_ATTR = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const sel = selectors[i];
    if (sel) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
        // invalid selector, try next
      }
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (el) {
        if (i > 0 || section.style) {
          const hr = doc.createElement('hr');
          if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
          if (i === 0) hr.setAttribute('data-excat-first-section', 'true');
          el.before(hr);
        }
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      if (section.style) {
        const metadata = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        const el = findSectionElement(element, section);
        if (el) {
          el.after(metadata);
        } else if (marker) {
          marker.after(metadata);
        }
      }
      if (marker) {
        if (marker.hasAttribute('data-excat-first-section')) {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER_ATTR);
        }
      }
    }
  }
}
