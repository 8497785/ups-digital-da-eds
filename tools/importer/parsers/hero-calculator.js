/* eslint-disable */
/* global WebImporter */
/**
 * hero-calculator
 * Row: [H1 (accent words in <em>), intro paragraph, "Talk to an expert" link]
 *      [calculator: heading, key:value config list, result label, CTA link, disclaimer]
 * Source buttons carry no href, so CTAs link to the contact page.
 */
const CONTACT_URL = 'https://www.insureshield.com/us/en/about/contact-us.html';

const DEFAULT_STOPS = '50, 100, 150, 200, 300, 400, 500, 750, 1,000, 1,500, 2,000, 3,000, 4,000, 5,000, 7,500, 10,000, 15,000, 20,000, 30,000, 40,000, 50,000';
const DEFAULT_BARS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const makeLink = (text, href) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    p.append(a);
    return p;
  };

  /* ---------- cell 1: headline, lead, CTA ---------- */
  const textCell = [];
  const srcH1 = element.querySelector('h1');
  if (srcH1) {
    const h1 = document.createElement('h1');
    const walk = (node, target) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          target.append(document.createTextNode(child.textContent.replace(/\s+/g, ' ')));
        } else if (child.nodeType === 1) {
          const tag = child.tagName.toLowerCase();
          if (tag === 'button' || tag === 'em' || tag === 'i' || tag === 'strong') {
            const em = document.createElement('em');
            em.textContent = clean(child.textContent);
            target.append(em);
          } else {
            walk(child, target);
          }
        }
      });
    };
    walk(srcH1, h1);
    // normalise whitespace at edges
    h1.innerHTML = h1.innerHTML.replace(/\s{2,}/g, ' ').trim();
    textCell.push(h1);
  }
  const lead = element.querySelector('[class*="m-lead"]') || element.querySelector('[class*="m-head"] p');
  if (lead) {
    const p = document.createElement('p');
    p.textContent = clean(lead.textContent);
    textCell.push(p);
  }
  const heroCta = element.querySelector('[class*="m-actions"] a, [class*="m-actions"] button');
  if (heroCta) {
    const label = clean((heroCta.querySelector('[class*="m-label"]') || heroCta).textContent);
    const href = heroCta.getAttribute('href') || CONTACT_URL;
    if (label) textCell.push(makeLink(label, href));
  }

  /* ---------- cell 2: calculator ---------- */
  const calcCell = [];
  const aside = element.querySelector('[class*="m-aside"]') || element;
  const calcHeading = aside.querySelector('h2, h3');
  if (calcHeading) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(calcHeading.textContent);
    calcCell.push(h2);
  }

  // slider label: first visually-hidden/label span preceding the <output>
  const output = aside.querySelector('output');
  let valueLabel = 'Package value';
  if (output && output.previousElementSibling && clean(output.previousElementSibling.textContent)) {
    valueLabel = clean(output.previousElementSibling.textContent);
  }

  // initial handle values come from the spans next to the range inputs
  const handleValues = [...aside.querySelectorAll('input')]
    .map((input) => {
      const holder = input.parentElement;
      const span = holder && holder.parentElement
        ? [...holder.parentElement.children].find((c) => c.tagName === 'SPAN')
        : null;
      return span ? clean(span.textContent) : (input.getAttribute('value') || '');
    })
    .filter(Boolean);
  let min = handleValues[0] || '';
  let max = handleValues[1] || '';
  if ((!min || !max) && output) {
    const spans = [...output.querySelectorAll('span')].map((s) => clean(s.textContent));
    const range = spans.find((t) => /to/.test(t) && !/\+$/.test(t)) || spans[spans.length - 1] || '';
    const parts = range.split(/\s+to\s+/);
    if (parts.length === 2) [min, max] = parts;
  }
  if (!min) min = '$100';
  if (!max) max = '$1,000';

  // result label: the label span in the premium row
  let resultLabel = 'Estimated premium per package';
  const resultSpan = [...aside.querySelectorAll('span[id]')]
    .find((s) => /premium/i.test(s.textContent));
  if (resultSpan) resultLabel = clean(resultSpan.textContent);

  // initial premium readout ("$0.80 to $10.50"): the non-"+" value next to the result label
  let premium = '';
  if (resultSpan && resultSpan.nextElementSibling) {
    const vals = [...resultSpan.nextElementSibling.querySelectorAll('span')]
      .map((s) => clean(s.textContent)).filter(Boolean);
    premium = vals.find((t) => !/\+$/.test(t)) || '';
  }

  // The source DOM exposes no stop values, rates or bar heights (bars are unstyled spans,
  // inputs carry no min/max). The block defaults ARE the source values, so Stops/Bars are
  // only written when the DOM's stop count differs from the default 21 stops.
  const barCount = aside.querySelectorAll('[class*="m-histogram"] > span').length;
  const openEnded = output ? /\+/.test(output.textContent) : true;

  const config = [
    ['Label', valueLabel],
    ['Min', min],
    ['Max', max],
  ];
  if (barCount && barCount !== DEFAULT_BARS.length) {
    const stops = DEFAULT_STOPS.split(/,\s(?=\d)/).slice(0, barCount);
    config.push(['Stops', stops.join(', ')]);
    config.push(['Bars', DEFAULT_BARS.slice(0, barCount).join(', ')]);
  }
  config.push(
    ['Low rate', '0.80'],
    ['High rate', '1.05'],
    ['Open ended', openEnded ? 'yes' : 'no'],
  );
  // No "Result:" item: the result label paragraph below carries it (README: "otherwise the
  // first plain paragraph is used"); the block strips its trailing "$..." readout.
  if (!resultLabel) config.push(['Result', 'Estimated premium per package']);
  const ul = document.createElement('ul');
  config.forEach(([k, v]) => {
    const li = document.createElement('li');
    li.textContent = `${k}: ${v}`;
    ul.append(li);
  });
  // slider usage hint (screen-reader help in the source); no "key:" so the block ignores it
  const hint = [...aside.querySelectorAll('span[id]')]
    .find((s) => /handles|arrow keys/i.test(s.textContent));
  if (hint) {
    const li = document.createElement('li');
    li.textContent = clean(hint.textContent);
    ul.append(li);
  }
  calcCell.push(ul);

  // result label paragraph; the block strips the trailing "$..." readout
  const resultP = document.createElement('p');
  resultP.textContent = premium ? `${resultLabel}: ${premium}` : resultLabel;
  calcCell.push(resultP);

  const calcButtons = [...aside.querySelectorAll('a, button')]
    .filter((b) => b.querySelector('[class*="m-label"]'));
  const calcCta = calcButtons[calcButtons.length - 1];
  if (calcCta) {
    const label = clean(calcCta.querySelector('[class*="m-label"]').textContent);
    if (label) calcCell.push(makeLink(label, calcCta.getAttribute('href') || CONTACT_URL));
  }

  const disclaimer = [...aside.querySelectorAll('p')]
    .reverse()
    .find((p) => /estimate only|pricing/i.test(p.textContent)) || aside.querySelector('p:last-of-type');
  if (disclaimer && clean(disclaimer.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(disclaimer.textContent);
    calcCell.push(p);
  }

  /* ---------- rows 2+: accent-word definitions ---------- */
  // The source renders each definition (a react-aria popover) only while its word is hovered,
  // tapped or focused, so a static page load has none in the DOM. Use the popover when it is
  // present; otherwise fall back to the copy captured from the live page (2026-11, by hovering).
  const CAPTURED_TERMS = {
    lost: {
      label: 'About lost shipments',
      copy: 'A package that never arrives. It may be missing in transit, delivered to the wrong location, or no longer showing tracking updates.',
      link: 'Get coverage',
    },
    damaged: {
      label: 'About damaged shipments',
      copy: 'A parcel or its contents arrive visibly broken, crushed, cracked, or otherwise physically damaged.',
      link: 'Get coverage',
    },
    stolen: {
      label: 'About stolen shipments',
      copy: 'A package taken after delivery, including porch theft or “porch piracy.”',
      link: 'Get coverage',
    },
  };
  const termRows = [];
  const termButtons = srcH1 ? [...srcH1.querySelectorAll('button')] : [];
  termButtons.forEach((button) => {
    const word = clean(button.textContent);
    if (!word) return;
    const key = word.toLowerCase();
    const controls = button.getAttribute('aria-controls');
    const live = (controls && document.getElementById(controls))
      || [...document.querySelectorAll('[role="dialog"][aria-label]')]
        .find((d) => new RegExp(`\\b${key}\\b`, 'i').test(d.getAttribute('aria-label')) && !d.querySelector('form, input'));
    let def = null;
    if (live) {
      const action = live.querySelector('button, a');
      const copyEl = [...live.querySelectorAll('span, p')]
        .find((s) => !s.closest('button, a') && !s.querySelector('span, p') && clean(s.textContent));
      if (copyEl) {
        def = {
          label: clean(live.getAttribute('aria-label')),
          copy: clean(copyEl.textContent),
          link: action ? clean((action.querySelector('[class*="m-label"]') || action).textContent) : '',
        };
      }
    }
    def = def || CAPTURED_TERMS[key];
    if (!def) return;
    const wordCell = [];
    const wp = document.createElement('p');
    wp.textContent = word;
    wordCell.push(wp);
    if (def.label) {
      const lp = document.createElement('p');
      lp.textContent = def.label;
      wordCell.push(lp);
    }
    const copyCell = [];
    const cp = document.createElement('p');
    cp.textContent = def.copy;
    copyCell.push(cp);
    // "Get coverage" opens the quote drawer on the source (no href); the contact page is the fallback
    if (def.link) copyCell.push(makeLink(def.link, CONTACT_URL));
    termRows.push([wordCell, copyCell]);
  });

  const cells = [[textCell, calcCell], ...termRows];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-calculator', cells });
  element.replaceWith(block);
}
