/* eslint-disable */
/* global WebImporter */

/**
 * InsureShield cleanup transformer.
 * Selectors taken from migration-work/cleaned.html
 * (https://www.insureshield.com/us/en/shipping-insurance.html).
 *
 * beforeTransform: remove site chrome and overlays that could be mistaken
 * for authorable content during block matching. Canvas hosts inside
 * #hero-section, #standout and div.m-bandPattern-W5DjCD are intentionally
 * kept so the parsers can match them.
 * afterTransform: final sweep of non-authorable leftovers. HTML comments are
 * never removed here.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    removeAll(element, [
      // skip link
      'div._skip_itksx_21',
      // global header and footer
      'header.m-header-32X6I2',
      'footer.m-footer-x-jtwu',
      // (the floating "Quote monthly cost" dock is kept: the quote-drawer parser maps it)
      // OneTrust cookie consent
      '#onetrust-consent-sdk',
      'iframe.ot-text-resize',
      // tracking pixels / beacons
      '#ttdUniversalPixelTag',
      'iframe[id^="universal_pixel"]',
      'iframe#db-sync',
      'img#db_lr_pixel_ad',
      '[id^="batBeacon"]',
      'img[src*="bat.bing.com"]',
      'img[src*="rlcdn.com"]',
      'iframe[src*="doubleclick.net"]',
      'iframe[src*="adsrvr.org"]',
      'iframe[src*="company-target.com"]',
    ]);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      'header',
      'footer',
      '#onetrust-consent-sdk',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'canvas',
    ]);

    element.querySelectorAll('*').forEach((el) => {
      ['data-analytics', 'data-track', 'onclick', 'onload'].forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });
  }
}
