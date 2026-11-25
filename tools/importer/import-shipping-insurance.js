/* eslint-disable */
/* global WebImporter */

import heroCalculatorParser from './parsers/hero-calculator.js';
import tableComparisonParser from './parsers/table-comparison.js';
import cardsStatAnimatedParser from './parsers/cards-stat-animated.js';
import columnsIllustrationParser from './parsers/columns-illustration.js';
import widgetSignalFieldParser from './parsers/widget-signal-field.js';
import columnsLogoGridParser from './parsers/columns-logo-grid.js';
import cardsIllustratedParser from './parsers/cards-illustrated.js';
import cardsStoryParser from './parsers/cards-story.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import quoteDrawerParser from './parsers/quote-drawer.js';
import cleanupTransformer from './transformers/insureshield-cleanup.js';
import sectionsTransformer from './transformers/insureshield-sections.js';
import dmImagesTransformer from './transformers/insureshield-dm-images.js';

const PAGE_TEMPLATE = {
  "name": "shipping-insurance",
  "urls": [
    "https://www.insureshield.com/us/en/shipping-insurance.html"
  ],
  "representativeUrl": "https://www.insureshield.com/us/en/shipping-insurance.html",
  "description": "InsureShield product landing page: hero with premium calculator, comparison table, animated stat tiles (three.js), benefits, signal-field animated band with integrations/solutions/stories, FAQ",
  "blocks": [
    {
      "name": "hero-calculator",
      "instances": [
        "#hero-section > section.m-hero-RZrYvQ",
        "#hero-section > section"
      ]
    },
    {
      "name": "table-comparison",
      "instances": [
        "#difference div.m-comparison--jz65U",
        "#difference table"
      ]
    },
    {
      "name": "cards-stat-animated",
      "instances": [
        "#standout ul.m-contents-oLI40Z",
        "#standout ul"
      ]
    },
    {
      "name": "columns-illustration",
      "instances": [
        "#benefits div._container_itksx_33._split_16j9e_76",
        "#benefits > div"
      ]
    },
    {
      "name": "widget-signal-field",
      "instances": [
        "div.m-patternBand-ymYEmd > div.m-bandPattern-W5DjCD",
        "div.m-bandPattern-W5DjCD"
      ]
    },
    {
      "name": "columns-logo-grid",
      "instances": [
        "#integrations div.m-grid-K14g0T",
        "#integrations > div > div"
      ]
    },
    {
      "name": "cards-illustrated",
      "instances": [
        "#solutions ul.m-grid-K14g0T",
        "#solutions ul"
      ]
    },
    {
      "name": "cards-story",
      "instances": [
        "#stories ul.m-grid-K14g0T",
        "#stories ul"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        "#faq div.m-list-1i41Cu",
        "#faq div.m-faq-ON5fp8 > div:last-child"
      ]
    },
    {
      "name": "quote-drawer",
      "instances": [
        "aside.m-dock-0pqo-G",
        "aside[aria-label=\"Quote monthly cost\"]"
      ]
    }
  ],
  "urlPattern": "/us/en/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Hero with premium calculator",
      "selector": [
        "#hero-section"
      ],
      "style": null,
      "blocks": [
        "hero-calculator"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Carrier vs insurance comparison",
      "selector": [
        "#difference"
      ],
      "style": null,
      "blocks": [
        "table-comparison"
      ],
      "defaultContent": [
        "#difference div.m-intro-LLXMXV"
      ]
    },
    {
      "id": "section-3",
      "name": "Why we stand out (stat tiles)",
      "selector": [
        "#standout"
      ],
      "style": "split",
      "blocks": [
        "cards-stat-animated"
      ],
      "defaultContent": [
        "#standout div.m-intro-DO5l6J"
      ]
    },
    {
      "id": "section-4",
      "name": "Benefits",
      "selector": [
        "#benefits"
      ],
      "style": null,
      "blocks": [
        "columns-illustration"
      ],
      "defaultContent": []
    },
    {
      "id": "section-5",
      "name": "Signal-field animated background",
      "selector": [
        "div.m-patternBand-ymYEmd > div.m-bandPattern-W5DjCD",
        "div.m-bandPattern-W5DjCD"
      ],
      "style": null,
      "blocks": [
        "widget-signal-field"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Integrations, related solutions, stories",
      "selector": [
        "div.m-patternBand-ymYEmd > div.m-bandContent-nsDH6A",
        "div.m-bandContent-nsDH6A"
      ],
      "style": null,
      "blocks": [
        "columns-logo-grid",
        "cards-illustrated",
        "cards-story"
      ],
      "defaultContent": [
        "#solutions div.m-intro-LLXMXV",
        "#stories div.m-intro-LLXMXV"
      ]
    },
    {
      "id": "section-7",
      "name": "FAQ",
      "selector": [
        "#faq"
      ],
      "style": "split",
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        "#faq div.m-intro-LLXMXV"
      ]
    },
    {
      "id": "section-8",
      "name": "Quote dock and Build a quote drawer",
      "selector": [
        "aside.m-dock-0pqo-G",
        "aside[aria-label=\"Quote monthly cost\"]"
      ],
      "style": null,
      "blocks": [
        "quote-drawer"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero-calculator': heroCalculatorParser,
  'table-comparison': tableComparisonParser,
  'cards-stat-animated': cardsStatAnimatedParser,
  'columns-illustration': columnsIllustrationParser,
  'widget-signal-field': widgetSignalFieldParser,
  'columns-logo-grid': columnsLogoGridParser,
  'cards-illustrated': cardsIllustratedParser,
  'cards-story': cardsStoryParser,
  'accordion-faq': accordionFaqParser,
  'quote-drawer': quoteDrawerParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [];
const transformers = [cleanupTransformer, dmImagesTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
