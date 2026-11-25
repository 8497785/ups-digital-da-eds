/* eslint-disable */
/* global WebImporter */
/**
 * quote-drawer
 * Source: the floating dock aside.m-dock-0pqo-G ("Quote monthly cost") and the "Build a quote"
 * side sheet it opens (lazy React chunk QuoteDrawer-*.js).
 *
 * Only the dock is in the scraped DOM: its label is read from the page. The sheet is not rendered
 * until the dock is pressed, so its copy (steps, questions, options, products, reasons, talk-to-sales
 * labels, sign-up links) is emitted from constants captured from the live source
 * (QuoteDrawer-IDD6-v3F.js, 2026-11-24). Illustrations are drawn at runtime in the source and are
 * referenced as the hosted SVG exports in /assets/shipping-insurance/ (the hosted-svg
 * transformer turns all but logos into :illustration-<name>: tokens).
 *
 * Table: one row per item, first cell = row key (see blocks/quote-drawer/README.md).
 */
// Absolute: the importer resolves relative image URLs against the source origin.
const ASSET_BASE = 'https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/';
const LEAD_API = 'https://www.insureshield.com';
const HELP = 'Handles can pass one another. Drag the selected band to move the whole range. Focus it and use arrow keys, Page Up or Page Down, Home or End.';
const LOGO_IS = ['logo-insureshield', 'InsureShield Shipping Insurance by UPS Capital'];

const DRAWER = {
  title: 'Build a quote',
  country: {
    label: 'What country is your business based in?',
    list: ['United States', 'Australia', 'Brazil', 'Canada', 'China', 'France', 'Germany', 'India', 'Italy', 'Japan', 'Mexico', 'Netherlands', 'Singapore', 'South Korea', 'Spain', 'United Kingdom'],
  },
  outside: 'We currently serve businesses based in the United States. Tell us how to reach you and a specialist will follow up about your business in {country}.',
  values: ['Typical package value', [
    ['Stops', '$50, $100, $150, $200, $300, $400, $500, $750, $1,000, $1,500, $2,000, $3,000, $4,000, $5,000, $7,500, $10,000, $15,000, $20,000, $30,000, $40,000, $50,000'],
    ['Default', '$100 to $1,000'], ['Format', 'currency'], ['Open ended', 'yes'], ['Help', HELP]]],
  volume: ['Shipments a week', [
    ['Stops', '1, 5, 10, 25, 50, 100, 250, 500, 1,000, 2,500, 5,000, 10,000'],
    ['Default', '50 to 250'], ['Format', 'number'], ['Open ended', 'yes'], ['Help', HELP]]],
  questions: [
    { key: 'Solution', label: 'What kind of solution do you need?', options: [
      ['platform', 'carriers', 'Shipping, labeling and insurance', 'All in one platform'],
      ['insurance', 'shield-alone', 'Insurance', 'For shipping you already have set up']] },
    { key: 'Shipment types', label: 'What types of shipments do you typically send?', pairs: [
      ['Description', 'Choose all that apply.'], ['Removed', 'Freight was removed. It is available with insurance only.']], options: [
      ['parcel', 'parcel-shield', 'Small parcel'], ['freight', 'freight', 'Freight'], ['luxury', 'luxury-goods', 'Luxury goods']] },
    { key: 'Carriers', label: 'Who do you ship with?', pairs: [
      ['Description', 'Choose all that apply.'], ['Other', 'Other provider'], ['Field', 'Provider name'], ['Cancel', 'Cancel']], options: [
      ['ups', '', 'UPS'], ['usps', '', 'USPS'], ['dhl', '', 'DHL'], ['fedex', '', 'FedEx']] },
    { key: 'Coverage', label: 'Do you have a coverage type preference?', options: [
      ['blanket', 'merchants-protected', 'Blanket', 'Coverage for every shipment'],
      ['transactional', 'coverage-shield', 'Transactional', 'Coverage per shipment'],
      ['unsure', 'coverage-unsure', 'No preference / unsure', 'Help me choose']] },
  ],
  estimate: ['Estimated monthly premium', [
    ['Note', 'A range from your package values and weekly shipments, at {low} to {high} per $100 of value.'],
    ['Low rate', '0.80'], ['High rate', '1.05']]],
  buttons: [['Continue', 'Continue'], ['Continue with quote', 'Continue with quote'], ['Expert help', 'Expert help'],
    ['Back', 'Back'], ['Close', 'Close'], ['Minimum', 'Minimum'], ['Maximum', 'Maximum'],
    ['Move range', 'Move entire {label} range: {value}']],
  recommendation: ['Your recommendation', [
    ['Eyebrow', 'Recommended for you'], ['Or', 'or'], ['Choose', 'Two products fit. Choose one to continue.'],
    ['Continue', 'Continue'], ['Privacy', 'Your information is secure and never shared.']]],
  products: [
    { id: 'connect', art: 'product-shipping-insurance', logo: LOGO_IS, name: 'InsureShield® Connect',
      points: ['Connect shipments via API, Webhooks, and more', 'All carriers and modes, including freight', 'Flexible, case-by-case insurance solutions', 'Pay-as-you-go billed monthly'],
      rates: '0.80 to 1.05', brand: 'insureshield', link: ['https://signup.upscapital.com/products/insureshield-connect', 'Continue to InsureShield Connect sign-up'] },
    { id: 'complete', art: 'product-shipping-insurance', logo: LOGO_IS, name: 'InsureShield® Complete', points: [],
      rates: '0.25 to 0.35', brand: 'insureshield', link: ['https://signup.upscapital.com/products/insureshield-complete', 'Continue to InsureShield Complete sign-up'] },
    { id: 'for-ups', art: 'product-shipping-insurance', logo: LOGO_IS, name: 'InsureShield® for UPS', points: [],
      rates: '0.80 to 1.05', brand: 'insureshield', link: ['https://signup.upscapital.com/products/insureshield-4ups', 'Continue to InsureShield for UPS sign-up'] },
    { id: 'parcel-pro', art: 'product-parcelpro', logo: ['logo-parcel-pro', 'Parcel Pro'], name: 'Parcel Pro', points: [],
      rates: '0.35 to 0.45', brand: 'parcel-pro', link: ['https://signup.parcelpro.com/products/parcelpro', 'Continue to Parcel Pro sign-up'] },
  ],
  reasons: [
    ['High value', 'Because your packages are typically worth $50,000 or more.'],
    ['Platform', 'Because you want shipping, labeling and insurance in one platform.'],
    ['Luxury', 'Because you ship high-value luxury goods.'],
    ['UPS only', 'Because you ship only with UPS.'],
    ['Transactional', 'Because you want to choose which shipments are insured.'],
    ['Blanket', 'Because you want every shipment covered.'],
    ['Unsure', 'Connect insures the shipments you choose. Complete covers every shipment.']],
  sales: {
    title: 'Talk to sales', art: 'email-verify', lead: 'Provide contact information so sales can reach out.',
    pairs: [['First name', 'First name'], ['Last name', 'Last name'], ['Business email', 'Business email'],
      ['Company name', 'Company name'], ['ZIP code', 'ZIP code'], ['Postal code', 'Postal code'],
      ['Phone', 'Phone number (optional)'], ['Required', 'Enter this to continue.'],
      ['Email error', 'Enter a business email address, like name@company.com.'],
      ['ZIP error', 'Enter a 5-digit ZIP code, like 30301 or 30301-1234.'],
      ['Postal error', 'Enter a postal code using letters, numbers, spaces or hyphens.'],
      ['Phone error', 'Enter a 10-digit phone number, like (555) 010-0199.'],
      ['Phone international error', 'Enter a phone number with 7 to 15 digits, including the country code.'],
      ['Send', 'Send'], ['Privacy', 'Your information is secure and never shared.'],
      ['Unavailable', 'Something went wrong. Try again later.'],
      ['Failed', 'Something went wrong. Try again.'],
      ['Done title', 'Thanks for reaching out'],
      ['Done', 'An InsureShield representative will contact you soon.'],
      ['Close', 'Close'],
      /* lead API base: the form POSTs to {base}/api/lead (source config leadApiUrl) */
      ['Lead API', [LEAD_API, LEAD_API]]],
  },
};

export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const img = (name, alt = '') => {
    const i = document.createElement('img');
    i.src = `${ASSET_BASE}${name}.svg?format=svg`;
    i.alt = alt;
    return i;
  };
  const link = ([href, text]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  };
  const list = (items) => {
    const ul = document.createElement('ul');
    items.forEach((item) => {
      const li = document.createElement('li');
      if (Array.isArray(item)) {
        const [key, value] = item;
        li.append(`${key}: `);
        if (Array.isArray(value)) li.append(link(value));
        else li.append(value);
      } else li.textContent = item;
      ul.append(li);
    });
    return ul;
  };
  const para = (text) => {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  };

  const button = element.querySelector('button');
  const dockLabel = clean(element.getAttribute('aria-label'))
    || clean(button && button.textContent) || 'Quote monthly cost';

  const cells = [['Quote Drawer']];
  cells.push(['Dock', dockLabel]);
  cells.push(['Title', DRAWER.title]);
  cells.push(['Country', DRAWER.country.label, list(DRAWER.country.list)]);
  cells.push(['Outside', DRAWER.outside]);
  cells.push(['Package value', DRAWER.values[0], list(DRAWER.values[1])]);
  cells.push(['Shipments', DRAWER.volume[0], list(DRAWER.volume[1])]);
  DRAWER.questions.forEach((q) => {
    cells.push(q.pairs ? [q.key, q.label, list(q.pairs)] : [q.key, q.label]);
    q.options.forEach(([value, art, label, detail]) => {
      const row = ['Option', value, art ? img(art) : '', label];
      if (detail) row.push(detail);
      cells.push(row);
    });
  });
  cells.push(['Estimate', DRAWER.estimate[0], list(DRAWER.estimate[1])]);
  cells.push(['Buttons', list(DRAWER.buttons)]);
  cells.push(['Recommendation', DRAWER.recommendation[0], list(DRAWER.recommendation[1])]);
  DRAWER.products.forEach((p) => {
    cells.push(['Product', p.id, [img(p.art), img(p.logo[0], p.logo[1])], p.name,
      p.points.length ? list(p.points) : '',
      list([['Rates', p.rates], ['Brand', p.brand], ['Link', p.link]])]);
  });
  cells.push(['Reasons', list(DRAWER.reasons)]);
  cells.push(['Sales', DRAWER.sales.title, [img(DRAWER.sales.art), para(DRAWER.sales.lead)], list(DRAWER.sales.pairs)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-drawer', cells: cells.slice(1) });
  element.replaceWith(block);
}
