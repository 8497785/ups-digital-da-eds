/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-shipping-insurance.js
  var import_shipping_insurance_exports = {};
  __export(import_shipping_insurance_exports, {
    default: () => import_shipping_insurance_default
  });

  // tools/importer/parsers/hero-calculator.js
  var CONTACT_URL = "https://www.insureshield.com/us/en/about/contact-us.html";
  var DEFAULT_STOPS = "50, 100, 150, 200, 300, 400, 500, 750, 1,000, 1,500, 2,000, 3,000, 4,000, 5,000, 7,500, 10,000, 15,000, 20,000, 30,000, 40,000, 50,000";
  var DEFAULT_BARS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  var clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  function parse(element, { document }) {
    const makeLink = (text, href) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      p.append(a);
      return p;
    };
    const textCell = [];
    const srcH1 = element.querySelector("h1");
    if (srcH1) {
      const h1 = document.createElement("h1");
      const walk = (node, target) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            target.append(document.createTextNode(child.textContent.replace(/\s+/g, " ")));
          } else if (child.nodeType === 1) {
            const tag = child.tagName.toLowerCase();
            if (tag === "button" || tag === "em" || tag === "i" || tag === "strong") {
              const em = document.createElement("em");
              em.textContent = clean(child.textContent);
              target.append(em);
            } else {
              walk(child, target);
            }
          }
        });
      };
      walk(srcH1, h1);
      h1.innerHTML = h1.innerHTML.replace(/\s{2,}/g, " ").trim();
      textCell.push(h1);
    }
    const lead = element.querySelector('[class*="m-lead"]') || element.querySelector('[class*="m-head"] p');
    if (lead) {
      const p = document.createElement("p");
      p.textContent = clean(lead.textContent);
      textCell.push(p);
    }
    const heroCta = element.querySelector('[class*="m-actions"] a, [class*="m-actions"] button');
    if (heroCta) {
      const label = clean((heroCta.querySelector('[class*="m-label"]') || heroCta).textContent);
      const href = heroCta.getAttribute("href") || CONTACT_URL;
      if (label) textCell.push(makeLink(label, href));
    }
    const calcCell = [];
    const aside = element.querySelector('[class*="m-aside"]') || element;
    const calcHeading = aside.querySelector("h2, h3");
    if (calcHeading) {
      const h2 = document.createElement("h2");
      h2.textContent = clean(calcHeading.textContent);
      calcCell.push(h2);
    }
    const output = aside.querySelector("output");
    let valueLabel = "Package value";
    if (output && output.previousElementSibling && clean(output.previousElementSibling.textContent)) {
      valueLabel = clean(output.previousElementSibling.textContent);
    }
    const handleValues = [...aside.querySelectorAll("input")].map((input) => {
      const holder = input.parentElement;
      const span = holder && holder.parentElement ? [...holder.parentElement.children].find((c) => c.tagName === "SPAN") : null;
      return span ? clean(span.textContent) : input.getAttribute("value") || "";
    }).filter(Boolean);
    let min = handleValues[0] || "";
    let max = handleValues[1] || "";
    if ((!min || !max) && output) {
      const spans = [...output.querySelectorAll("span")].map((s) => clean(s.textContent));
      const range = spans.find((t) => /to/.test(t) && !/\+$/.test(t)) || spans[spans.length - 1] || "";
      const parts = range.split(/\s+to\s+/);
      if (parts.length === 2) [min, max] = parts;
    }
    if (!min) min = "$100";
    if (!max) max = "$1,000";
    let resultLabel = "Estimated premium per package";
    const resultSpan = [...aside.querySelectorAll("span[id]")].find((s) => /premium/i.test(s.textContent));
    if (resultSpan) resultLabel = clean(resultSpan.textContent);
    let premium = "";
    if (resultSpan && resultSpan.nextElementSibling) {
      const vals = [...resultSpan.nextElementSibling.querySelectorAll("span")].map((s) => clean(s.textContent)).filter(Boolean);
      premium = vals.find((t) => !/\+$/.test(t)) || "";
    }
    const barCount = aside.querySelectorAll('[class*="m-histogram"] > span').length;
    const openEnded = output ? /\+/.test(output.textContent) : true;
    const config = [
      ["Label", valueLabel],
      ["Min", min],
      ["Max", max]
    ];
    if (barCount && barCount !== DEFAULT_BARS.length) {
      const stops = DEFAULT_STOPS.split(/,\s(?=\d)/).slice(0, barCount);
      config.push(["Stops", stops.join(", ")]);
      config.push(["Bars", DEFAULT_BARS.slice(0, barCount).join(", ")]);
    }
    config.push(
      ["Low rate", "0.80"],
      ["High rate", "1.05"],
      ["Open ended", openEnded ? "yes" : "no"]
    );
    if (!resultLabel) config.push(["Result", "Estimated premium per package"]);
    const ul = document.createElement("ul");
    config.forEach(([k, v]) => {
      const li = document.createElement("li");
      li.textContent = `${k}: ${v}`;
      ul.append(li);
    });
    const hint = [...aside.querySelectorAll("span[id]")].find((s) => /handles|arrow keys/i.test(s.textContent));
    if (hint) {
      const li = document.createElement("li");
      li.textContent = clean(hint.textContent);
      ul.append(li);
    }
    calcCell.push(ul);
    const resultP = document.createElement("p");
    resultP.textContent = premium ? `${resultLabel}: ${premium}` : resultLabel;
    calcCell.push(resultP);
    const calcButtons = [...aside.querySelectorAll("a, button")].filter((b) => b.querySelector('[class*="m-label"]'));
    const calcCta = calcButtons[calcButtons.length - 1];
    if (calcCta) {
      const label = clean(calcCta.querySelector('[class*="m-label"]').textContent);
      if (label) calcCell.push(makeLink(label, calcCta.getAttribute("href") || CONTACT_URL));
    }
    const disclaimer = [...aside.querySelectorAll("p")].reverse().find((p) => /estimate only|pricing/i.test(p.textContent)) || aside.querySelector("p:last-of-type");
    if (disclaimer && clean(disclaimer.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean(disclaimer.textContent);
      calcCell.push(p);
    }
    const CAPTURED_TERMS = {
      lost: {
        label: "About lost shipments",
        copy: "A package that never arrives. It may be missing in transit, delivered to the wrong location, or no longer showing tracking updates.",
        link: "Get coverage"
      },
      damaged: {
        label: "About damaged shipments",
        copy: "A parcel or its contents arrive visibly broken, crushed, cracked, or otherwise physically damaged.",
        link: "Get coverage"
      },
      stolen: {
        label: "About stolen shipments",
        copy: "A package taken after delivery, including porch theft or \u201Cporch piracy.\u201D",
        link: "Get coverage"
      }
    };
    const termRows = [];
    const termButtons = srcH1 ? [...srcH1.querySelectorAll("button")] : [];
    termButtons.forEach((button) => {
      const word = clean(button.textContent);
      if (!word) return;
      const key = word.toLowerCase();
      const controls = button.getAttribute("aria-controls");
      const live = controls && document.getElementById(controls) || [...document.querySelectorAll('[role="dialog"][aria-label]')].find((d) => new RegExp(`\\b${key}\\b`, "i").test(d.getAttribute("aria-label")) && !d.querySelector("form, input"));
      let def = null;
      if (live) {
        const action = live.querySelector("button, a");
        const copyEl = [...live.querySelectorAll("span, p")].find((s) => !s.closest("button, a") && !s.querySelector("span, p") && clean(s.textContent));
        if (copyEl) {
          def = {
            label: clean(live.getAttribute("aria-label")),
            copy: clean(copyEl.textContent),
            link: action ? clean((action.querySelector('[class*="m-label"]') || action).textContent) : ""
          };
        }
      }
      def = def || CAPTURED_TERMS[key];
      if (!def) return;
      const wordCell = [];
      const wp = document.createElement("p");
      wp.textContent = word;
      wordCell.push(wp);
      if (def.label) {
        const lp = document.createElement("p");
        lp.textContent = def.label;
        wordCell.push(lp);
      }
      const copyCell = [];
      const cp = document.createElement("p");
      cp.textContent = def.copy;
      copyCell.push(cp);
      if (def.link) copyCell.push(makeLink(def.link, CONTACT_URL));
      termRows.push([wordCell, copyCell]);
    });
    const cells = [[textCell, calcCell], ...termRows];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-calculator", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-comparison.js
  var ASSET_BASE = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  var TOPIC_ICONS = [
    { match: /general|coverage/i, file: "compare-general-shipping-coverage.svg" },
    { match: /porch|piracy|theft/i, file: "compare-porch-piracy-theft.svg" },
    { match: /time.?sensitive|perishable/i, file: "compare-time-sensitive-goods.svg" },
    { match: /reship/i, file: "compare-reshipment-speed.svg" },
    { match: /high.?value/i, file: "compare-high-value-shipments.svg" },
    { match: /claim/i, file: "compare-claims-process.svg" }
  ];
  function parse2(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const para = (text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    };
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) return;
    const cells = [];
    const headCells = [...table.querySelectorAll("thead th, thead td")];
    const headTexts = headCells.map((th) => clean2(th.textContent));
    if (headCells.length) cells.push(headTexts);
    const columns = Math.max(headCells.length, 1);
    const rows = [...table.querySelectorAll("tbody > tr")];
    rows.forEach((tr, rowIndex) => {
      const srcCells = [...tr.children].filter((c) => c.matches("th, td"));
      const row = srcCells.map((cell, i) => {
        if (i === 0) {
          const content2 = [];
          const titleEl = cell.querySelector('[class*="m-topicTitle"]');
          const title = clean2((titleEl || cell).textContent);
          const srcImg = cell.querySelector("img");
          const srcSrc = srcImg ? srcImg.getAttribute("src") || "" : "";
          const hasDrawing = cell.querySelector("svg") || /^data:image\/svg/.test(srcSrc);
          const hosted = TOPIC_ICONS.find((t) => t.match.test(title)) || TOPIC_ICONS[rowIndex];
          let src = "";
          if (hasDrawing && hosted) src = `${ASSET_BASE}${hosted.file}?format=svg`;
          else if (srcSrc && !/^data:/.test(srcSrc)) src = srcSrc;
          if (src) {
            const icon = document.createElement("img");
            icon.src = src;
            icon.alt = srcImg && srcImg.getAttribute("alt") || "";
            content2.push(icon);
          }
          if (title) content2.push(para(title));
          return content2;
        }
        const content = [];
        const tag = cell.querySelector('[class*="m-tag"]');
        const tagText = clean2(tag ? tag.textContent : "");
        const answer = cell.querySelector('[class*="m-answer"]');
        let text = clean2((answer || cell).textContent);
        if (!answer && tagText) text = clean2(text.replace(tagText, ""));
        if (tagText && text) content.push(para(tagText));
        if (text) content.push(para(text));
        return content;
      });
      while (row.length < columns) row.push("");
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-comparison", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stat-animated.js
  var ASSET_BASE2 = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  var POSTERS = {
    none: "stat-packages-box.svg",
    "freight-journey": "stat-freight-journey-poster.svg",
    "claims-laptop": "stat-claims-laptop-poster.svg"
  };
  function parse3(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const list = element.matches("ul") ? element : element.querySelector("ul");
    const tiles = [...(list || element).querySelectorAll(":scope > li")];
    const detectKey = (tile, index, title) => {
      if (tile.querySelector('[data-freight-journey], [data-animation="freight-journey"]')) return "freight-journey";
      if (tile.querySelector('[data-claims-laptop], [data-animation="claims-laptop"]')) return "claims-laptop";
      if (/multi-carrier|multi-modal|freight/i.test(title)) return "freight-journey";
      if (/claim/i.test(title)) return "claims-laptop";
      if (tile.querySelector("canvas")) {
        if (index === 1) return "freight-journey";
        if (index === 2) return "claims-laptop";
      }
      return "none";
    };
    const cells = [];
    tiles.forEach((tile, index) => {
      const titleEl = tile.querySelector('h1, h2, h3, h4, h5, h6, [class*="m-title"]');
      const title = clean2(titleEl ? titleEl.textContent : "");
      const key = detectKey(tile, index, title);
      const media = [];
      const posterName = POSTERS[key] || (index === 0 ? POSTERS.none : null);
      const posterSrc = tile.querySelector('[class*="m-mediaInner"] img') || tile.querySelector("img");
      const src = posterName ? `${ASSET_BASE2}${posterName}?format=svg` : posterSrc && posterSrc.getAttribute("src");
      if (src && !/^data:/.test(src)) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = posterSrc && posterSrc.getAttribute("alt") || title;
        media.push(img);
      }
      const keyP = document.createElement("p");
      keyP.textContent = key;
      media.push(keyP);
      const body = [];
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const value = tile.querySelector('[class*="m-statValue"]');
      if (value && clean2(value.textContent)) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = clean2(value.textContent);
        p.append(strong);
        body.push(p);
      }
      const label = tile.querySelector('[class*="m-statLabel"]');
      if (label && clean2(label.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(label.textContent);
        body.push(p);
      }
      const desc = tile.querySelector('[class*="m-body"]');
      if (desc && clean2(desc.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(desc.textContent);
        body.push(p);
      }
      cells.push([media, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stat-animated", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-illustration.js
  var ASSET_BASE3 = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  function parse4(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const cols = [...element.children];
    const textCol = cols.find((c) => c.querySelector("h1, h2, h3, ul")) || element;
    const imageCol = cols.find((c) => c !== textCol && c.querySelector("img"));
    const imageCell = [];
    const otherCol = imageCol || cols.find((c) => c !== textCol);
    const srcImg = otherCol ? otherCol.querySelector("img") : null;
    const srcSrc = srcImg ? srcImg.getAttribute("src") || "" : "";
    const isDrawing = otherCol && (otherCol.querySelector("svg") || /^data:image\/svg/.test(srcSrc));
    const src = isDrawing ? `${ASSET_BASE3}benefits-illustration.svg?format=svg` : srcSrc;
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = srcImg && srcImg.getAttribute("alt") || "";
      imageCell.push(img);
    }
    const textCell = [];
    const heading = textCol.querySelector("h1, h2, h3");
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = clean2(heading.textContent);
      textCell.push(h2);
    }
    const srcList = textCol.querySelector("ul, ol");
    if (srcList) {
      const ul = document.createElement("ul");
      [...srcList.querySelectorAll(":scope > li")].forEach((li) => {
        const textWrap = li.querySelector('[class*="m-text"]') || li;
        const inner = textWrap.querySelector(":scope > span") || textWrap;
        const parts = [...inner.querySelectorAll(":scope > span")].map((s) => clean2(s.textContent)).filter(Boolean);
        const item = document.createElement("li");
        if (parts.length >= 2) {
          const strong = document.createElement("strong");
          strong.textContent = parts[0];
          item.append(strong, document.createTextNode(` ${parts.slice(1).join(" ")}`));
        } else {
          item.textContent = clean2(li.textContent);
        }
        if (clean2(item.textContent)) ul.append(item);
      });
      textCell.push(ul);
    }
    const cta = [...textCol.querySelectorAll("a[href]")].pop();
    if (cta) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = clean2((cta.querySelector('[class*="m-label"]') || cta).textContent);
      p.append(a);
      textCell.push(p);
    }
    const cells = [[imageCell, textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-illustration", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget-signal-field.js
  function parse5(element, { document }) {
    const a = document.createElement("a");
    a.href = "/widgets/signal-field";
    a.textContent = "signal field";
    const p = document.createElement("p");
    p.append(a);
    const cells = [[[p]]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget-signal-field", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-logo-grid.js
  var SOURCE_ORIGIN = "https://www.insureshield.com";
  var ASSET_BASE4 = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  var LOGOS = [
    { name: "Shopify", src: `${SOURCE_ORIGIN}/assets/insureshield/shopify-m40Qf4lq.svg`, width: "110px" },
    { name: "ShipStation", src: `${SOURCE_ORIGIN}/assets/insureshield/shipstation-b6mFKFub.svg`, width: "154px" },
    { name: "Shippo", src: `${SOURCE_ORIGIN}/assets/insureshield/shippo-D6PlM04S.svg`, width: "110px" },
    { name: "AfterShip", src: `${SOURCE_ORIGIN}/assets/insureshield/aftership-duFfXxE8.svg`, width: "125px" },
    { name: "WooCommerce", src: `${ASSET_BASE4}logo-woocommerce.svg`, width: "91px" }
  ];
  function parse6(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const intro = [];
    const introWrap = element.querySelector('[class*="m-intro"]') || element;
    const heading = introWrap.querySelector("h1, h2, h3");
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = clean2(heading.textContent);
      intro.push(h2);
    }
    [...introWrap.querySelectorAll("p")].forEach((p) => {
      if (!clean2(p.textContent)) return;
      const np = document.createElement("p");
      np.textContent = clean2(p.textContent);
      intro.push(np);
    });
    const panel = [];
    const labelEl = element.querySelector('[class*="m-label"] h3, [class*="m-label"]');
    if (labelEl && clean2(labelEl.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean2(labelEl.textContent);
      panel.push(p);
    }
    const logoCells = [...element.querySelectorAll('li[class*="m-cell"]')];
    logoCells.forEach((cell, i) => {
      const srcImg = cell.querySelector('img:not([src^="data:"])');
      const fallback = LOGOS[i];
      let src = srcImg && srcImg.getAttribute("src") || fallback && fallback.src;
      if (!src) return;
      if (/^https?:.*\.svg$/i.test(src)) src += "?format=svg";
      const img = document.createElement("img");
      img.src = src;
      img.alt = srcImg && srcImg.getAttribute("alt") || clean2(cell.textContent) || (fallback ? fallback.name : "");
      const mark = cell.querySelector('[style*="--logo-width"]');
      const styled = mark && (mark.getAttribute("style") || "").match(/--logo-width:\s*([\d.]+px)/);
      const width = styled && styled[1] || fallback && fallback.width || "";
      const p = document.createElement("p");
      const link = cell.querySelector("a[href]");
      if (link) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.append(img);
        p.append(a);
      } else {
        p.append(img);
      }
      if (width) p.append(document.createTextNode(` ${width}`));
      panel.push(p);
    });
    const cells = [[intro, panel]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-logo-grid", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-illustrated.js
  var ASSET_BASE5 = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  var ILLUSTRATIONS = [
    { match: /commerceshield/i, file: "solution-commerceshield.svg" },
    { match: /parcel\s*pro/i, file: "solution-parcel-pro.svg" }
  ];
  function parse7(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const list = element.matches("ul") ? element : element.querySelector("ul");
    const cards = [...(list || element).querySelectorAll(":scope > li")];
    const cells = [];
    cards.forEach((card, cardIndex) => {
      const titleEl = card.querySelector("h1, h2, h3, h4, h5, h6");
      const titleLink = titleEl && titleEl.querySelector("a[href]") || card.querySelector("a[href]");
      const href = titleLink ? titleLink.getAttribute("href") : "";
      const title = clean2(titleEl ? titleEl.textContent : "");
      const media = [];
      const mediaWrap = card.querySelector('[class*="m-media"]') || card;
      const srcImg = mediaWrap.querySelector("img");
      const srcSrc = srcImg ? srcImg.getAttribute("src") || "" : "";
      const hosted = ILLUSTRATIONS.find((m) => m.match.test(title)) || ILLUSTRATIONS[cardIndex];
      const isDrawing = mediaWrap.querySelector("svg") || /^data:image\/svg/.test(srcSrc) || !srcSrc;
      const src = isDrawing && hosted ? `${ASSET_BASE5}${hosted.file}?format=svg` : srcSrc;
      if (src && !/^data:/.test(src)) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = srcImg && srcImg.getAttribute("alt") || "";
        media.push(img);
      }
      const body = [];
      if (title) {
        const h3 = document.createElement("h3");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = title;
          h3.append(a);
        } else {
          h3.textContent = title;
        }
        body.push(h3);
      }
      const desc = card.querySelector('[class*="m-body"]');
      if (desc && clean2(desc.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(desc.textContent);
        body.push(p);
      }
      const tags = [...card.querySelectorAll('[class*="m-extra"] li')].map((li) => clean2(li.textContent)).filter(Boolean);
      if (tags.length) {
        const ul = document.createElement("ul");
        tags.forEach((t) => {
          const li = document.createElement("li");
          li.textContent = t;
          ul.append(li);
        });
        body.push(ul);
      }
      const cue = card.querySelector('[class*="m-foot"] a, [class*="m-cue"]');
      const cueText = clean2(cue ? cue.textContent : "");
      if (cueText) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cue.getAttribute && cue.getAttribute("href") || href;
        a.textContent = cueText;
        p.append(a);
        body.push(p);
      }
      cells.push([media, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-illustrated", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-story.js
  function parse8(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const list = element.matches("ul") ? element : element.querySelector("ul");
    const cards = [...(list || element).querySelectorAll(":scope > li")];
    const cells = [];
    cards.forEach((card) => {
      const titleEl = card.querySelector("h1, h2, h3, h4, h5, h6");
      const titleLink = titleEl && titleEl.querySelector("a[href]") || card.querySelector("a[href]");
      const href = titleLink ? titleLink.getAttribute("href") : "";
      const title = clean2(titleEl ? titleEl.textContent : "");
      const media = [];
      const srcImg = card.querySelector('[class*="m-media"] img') || card.querySelector('img:not([src^="data:"])');
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || title;
        media.push(img);
      }
      const body = [];
      const eyebrow = card.querySelector('[class*="m-eyebrow"]');
      if (eyebrow && clean2(eyebrow.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(eyebrow.textContent);
        body.push(p);
      }
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const desc = card.querySelector('[class*="m-body"]');
      if (desc && clean2(desc.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean2(desc.textContent);
        body.push(p);
      }
      const cue = card.querySelector('[class*="m-foot"] a[href], [class*="m-cue"]');
      const cueText = clean2(cue ? cue.textContent : "") || (href ? "Read more" : "");
      const cueHref = cue && cue.getAttribute("href") || href;
      if (cueText && cueHref) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cueHref;
        a.textContent = cueText;
        p.append(a);
        body.push(p);
      }
      cells.push([media, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-story", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse9(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    let items = [...element.querySelectorAll(':scope > [class*="m-disclosure"], :scope > [class*="m-item"]')];
    if (!items.length) items = [...element.querySelectorAll('[class*="m-disclosure"]')];
    const cells = [];
    items.forEach((item) => {
      const q = item.querySelector('[class*="m-label"]') || item.querySelector("h1, h2, h3, h4, h5, h6, button");
      const question = clean2(q ? q.textContent : "");
      const answerEl = item.querySelector('[class*="m-answer"]') || item.querySelector('[class*="m-panelInner"]') || item.querySelector('[class*="m-panel"]');
      const answer = [];
      if (answerEl) {
        const blocks = [...answerEl.children];
        if (blocks.length) {
          blocks.forEach((child) => {
            if (clean2(child.textContent) || child.querySelector("img")) answer.push(child);
          });
        } else if (clean2(answerEl.textContent)) {
          const p = document.createElement("p");
          p.textContent = clean2(answerEl.textContent);
          answer.push(p);
        }
      }
      if (question || answer.length) cells.push([question, answer]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-drawer.js
  var ASSET_BASE6 = "https://main--ups-digital-da-eds--8497785.aem.page/assets/shipping-insurance/";
  var LEAD_API = "https://www.insureshield.com";
  var HELP = "Handles can pass one another. Drag the selected band to move the whole range. Focus it and use arrow keys, Page Up or Page Down, Home or End.";
  var LOGO_IS = ["logo-insureshield", "InsureShield Shipping Insurance by UPS Capital"];
  var DRAWER = {
    title: "Build a quote",
    country: {
      label: "What country is your business based in?",
      list: ["United States", "Australia", "Brazil", "Canada", "China", "France", "Germany", "India", "Italy", "Japan", "Mexico", "Netherlands", "Singapore", "South Korea", "Spain", "United Kingdom"]
    },
    outside: "We currently serve businesses based in the United States. Tell us how to reach you and a specialist will follow up about your business in {country}.",
    values: ["Typical package value", [
      ["Stops", "$50, $100, $150, $200, $300, $400, $500, $750, $1,000, $1,500, $2,000, $3,000, $4,000, $5,000, $7,500, $10,000, $15,000, $20,000, $30,000, $40,000, $50,000"],
      ["Default", "$100 to $1,000"],
      ["Format", "currency"],
      ["Open ended", "yes"],
      ["Help", HELP]
    ]],
    volume: ["Shipments a week", [
      ["Stops", "1, 5, 10, 25, 50, 100, 250, 500, 1,000, 2,500, 5,000, 10,000"],
      ["Default", "50 to 250"],
      ["Format", "number"],
      ["Open ended", "yes"],
      ["Help", HELP]
    ]],
    questions: [
      { key: "Solution", label: "What kind of solution do you need?", options: [
        ["platform", "carriers", "Shipping, labeling and insurance", "All in one platform"],
        ["insurance", "shield-alone", "Insurance", "For shipping you already have set up"]
      ] },
      { key: "Shipment types", label: "What types of shipments do you typically send?", pairs: [
        ["Description", "Choose all that apply."],
        ["Removed", "Freight was removed. It is available with insurance only."]
      ], options: [
        ["parcel", "parcel-shield", "Small parcel"],
        ["freight", "freight", "Freight"],
        ["luxury", "luxury-goods", "Luxury goods"]
      ] },
      { key: "Carriers", label: "Who do you ship with?", pairs: [
        ["Description", "Choose all that apply."],
        ["Other", "Other provider"],
        ["Field", "Provider name"],
        ["Cancel", "Cancel"]
      ], options: [
        ["ups", "", "UPS"],
        ["usps", "", "USPS"],
        ["dhl", "", "DHL"],
        ["fedex", "", "FedEx"]
      ] },
      { key: "Coverage", label: "Do you have a coverage type preference?", options: [
        ["blanket", "merchants-protected", "Blanket", "Coverage for every shipment"],
        ["transactional", "coverage-shield", "Transactional", "Coverage per shipment"],
        ["unsure", "coverage-unsure", "No preference / unsure", "Help me choose"]
      ] }
    ],
    estimate: ["Estimated monthly premium", [
      ["Note", "A range from your package values and weekly shipments, at {low} to {high} per $100 of value."],
      ["Low rate", "0.80"],
      ["High rate", "1.05"]
    ]],
    buttons: [
      ["Continue", "Continue"],
      ["Continue with quote", "Continue with quote"],
      ["Expert help", "Expert help"],
      ["Back", "Back"],
      ["Close", "Close"],
      ["Minimum", "Minimum"],
      ["Maximum", "Maximum"],
      ["Move range", "Move entire {label} range: {value}"]
    ],
    recommendation: ["Your recommendation", [
      ["Eyebrow", "Recommended for you"],
      ["Or", "or"],
      ["Choose", "Two products fit. Choose one to continue."],
      ["Continue", "Continue"],
      ["Privacy", "Your information is secure and never shared."]
    ]],
    products: [
      {
        id: "connect",
        art: "product-shipping-insurance",
        logo: LOGO_IS,
        name: "InsureShield\xAE Connect",
        points: ["Connect shipments via API, Webhooks, and more", "All carriers and modes, including freight", "Flexible, case-by-case insurance solutions", "Pay-as-you-go billed monthly"],
        rates: "0.80 to 1.05",
        brand: "insureshield",
        link: ["https://signup.upscapital.com/products/insureshield-connect", "Continue to InsureShield Connect sign-up"]
      },
      {
        id: "complete",
        art: "product-shipping-insurance",
        logo: LOGO_IS,
        name: "InsureShield\xAE Complete",
        points: [],
        rates: "0.25 to 0.35",
        brand: "insureshield",
        link: ["https://signup.upscapital.com/products/insureshield-complete", "Continue to InsureShield Complete sign-up"]
      },
      {
        id: "for-ups",
        art: "product-shipping-insurance",
        logo: LOGO_IS,
        name: "InsureShield\xAE for UPS",
        points: [],
        rates: "0.80 to 1.05",
        brand: "insureshield",
        link: ["https://signup.upscapital.com/products/insureshield-4ups", "Continue to InsureShield for UPS sign-up"]
      },
      {
        id: "parcel-pro",
        art: "product-parcelpro",
        logo: ["logo-parcel-pro", "Parcel Pro"],
        name: "Parcel Pro",
        points: [],
        rates: "0.35 to 0.45",
        brand: "parcel-pro",
        link: ["https://signup.parcelpro.com/products/parcelpro", "Continue to Parcel Pro sign-up"]
      }
    ],
    reasons: [
      ["High value", "Because your packages are typically worth $50,000 or more."],
      ["Platform", "Because you want shipping, labeling and insurance in one platform."],
      ["Luxury", "Because you ship high-value luxury goods."],
      ["UPS only", "Because you ship only with UPS."],
      ["Transactional", "Because you want to choose which shipments are insured."],
      ["Blanket", "Because you want every shipment covered."],
      ["Unsure", "Connect insures the shipments you choose. Complete covers every shipment."]
    ],
    sales: {
      title: "Talk to sales",
      art: "email-verify",
      lead: "Provide contact information so sales can reach out.",
      pairs: [
        ["First name", "First name"],
        ["Last name", "Last name"],
        ["Business email", "Business email"],
        ["Company name", "Company name"],
        ["ZIP code", "ZIP code"],
        ["Postal code", "Postal code"],
        ["Phone", "Phone number (optional)"],
        ["Required", "Enter this to continue."],
        ["Email error", "Enter a business email address, like name@company.com."],
        ["ZIP error", "Enter a 5-digit ZIP code, like 30301 or 30301-1234."],
        ["Postal error", "Enter a postal code using letters, numbers, spaces or hyphens."],
        ["Phone error", "Enter a 10-digit phone number, like (555) 010-0199."],
        ["Phone international error", "Enter a phone number with 7 to 15 digits, including the country code."],
        ["Send", "Send"],
        ["Privacy", "Your information is secure and never shared."],
        ["Unavailable", "Something went wrong. Try again later."],
        ["Failed", "Something went wrong. Try again."],
        ["Done title", "Thanks for reaching out"],
        ["Done", "An InsureShield representative will contact you soon."],
        ["Close", "Close"],
        /* lead API base: the form POSTs to {base}/api/lead (source config leadApiUrl) */
        ["Lead API", [LEAD_API, LEAD_API]]
      ]
    }
  };
  function parse10(element, { document }) {
    const clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
    const img = (name, alt = "") => {
      const i = document.createElement("img");
      i.src = `${ASSET_BASE6}${name}.svg?format=svg`;
      i.alt = alt;
      return i;
    };
    const link = ([href, text]) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      return a;
    };
    const list = (items) => {
      const ul = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
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
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    };
    const button = element.querySelector("button");
    const dockLabel = clean2(element.getAttribute("aria-label")) || clean2(button && button.textContent) || "Quote monthly cost";
    const cells = [["Quote Drawer"]];
    cells.push(["Dock", dockLabel]);
    cells.push(["Title", DRAWER.title]);
    cells.push(["Country", DRAWER.country.label, list(DRAWER.country.list)]);
    cells.push(["Outside", DRAWER.outside]);
    cells.push(["Package value", DRAWER.values[0], list(DRAWER.values[1])]);
    cells.push(["Shipments", DRAWER.volume[0], list(DRAWER.volume[1])]);
    DRAWER.questions.forEach((q) => {
      cells.push(q.pairs ? [q.key, q.label, list(q.pairs)] : [q.key, q.label]);
      q.options.forEach(([value, art, label, detail]) => {
        const row = ["Option", value, art ? img(art) : "", label];
        if (detail) row.push(detail);
        cells.push(row);
      });
    });
    cells.push(["Estimate", DRAWER.estimate[0], list(DRAWER.estimate[1])]);
    cells.push(["Buttons", list(DRAWER.buttons)]);
    cells.push(["Recommendation", DRAWER.recommendation[0], list(DRAWER.recommendation[1])]);
    DRAWER.products.forEach((p) => {
      cells.push([
        "Product",
        p.id,
        [img(p.art), img(p.logo[0], p.logo[1])],
        p.name,
        p.points.length ? list(p.points) : "",
        list([["Rates", p.rates], ["Brand", p.brand], ["Link", p.link]])
      ]);
    });
    cells.push(["Reasons", list(DRAWER.reasons)]);
    cells.push(["Sales", DRAWER.sales.title, [img(DRAWER.sales.art), para(DRAWER.sales.lead)], list(DRAWER.sales.pairs)]);
    const block = WebImporter.Blocks.createBlock(document, { name: "quote-drawer", cells: cells.slice(1) });
    element.replaceWith(block);
  }

  // tools/importer/transformers/insureshield-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, [
        // skip link
        "div._skip_itksx_21",
        // global header and footer
        "header.m-header-32X6I2",
        "footer.m-footer-x-jtwu",
        // (the floating "Quote monthly cost" dock is kept: the quote-drawer parser maps it)
        // OneTrust cookie consent
        "#onetrust-consent-sdk",
        "iframe.ot-text-resize",
        // tracking pixels / beacons
        "#ttdUniversalPixelTag",
        'iframe[id^="universal_pixel"]',
        "iframe#db-sync",
        "img#db_lr_pixel_ad",
        '[id^="batBeacon"]',
        'img[src*="bat.bing.com"]',
        'img[src*="rlcdn.com"]',
        'iframe[src*="doubleclick.net"]',
        'iframe[src*="adsrvr.org"]',
        'iframe[src*="company-target.com"]'
      ]);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header",
        "footer",
        "#onetrust-consent-sdk",
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "canvas"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        ["data-analytics", "data-track", "onclick", "onload"].forEach((attr) => {
          if (el.hasAttribute(attr)) el.removeAttribute(attr);
        });
      });
    }
  }

  // tools/importer/transformers/insureshield-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const sel = selectors[i];
      if (sel) {
        try {
          const el = root.querySelector(sel);
          if (el) return el;
        } catch (e) {
        }
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (el) {
          if (i > 0 || section.style) {
            const hr = doc.createElement("hr");
            if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
            if (i === 0) hr.setAttribute("data-excat-first-section", "true");
            el.before(hr);
          }
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (section.style) {
          const metadata = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const el = findSectionElement(element, section);
          if (el) {
            el.after(metadata);
          } else if (marker) {
            marker.after(metadata);
          }
        }
        if (marker) {
          if (marker.hasAttribute("data-excat-first-section")) {
            marker.remove();
          } else {
            marker.removeAttribute(MARKER_ATTR);
          }
        }
      }
    }
  }

  // tools/importer/transformers/insureshield-dm-images.js
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function detectDynamicMediaUrl(urlStr) {
    if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) return "scene7";
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  function isSoleMeaningfulDescendant(anchor, img) {
    if (anchor.textContent.trim() !== "") return false;
    const media = anchor.querySelectorAll("img, svg, video, iframe, canvas");
    return media.length === 1 && media[0] === img;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const altRaw = (img.getAttribute("alt") || "").trim();
      const alt = altRaw || EMPTY_ALT_SENTINEL;
      const anchor = img.closest("a");
      if (anchor) {
        if (!isSoleMeaningfulDescendant(anchor, img)) {
          console.warn(`[dm-images] skipping DM image inside mixed-content link: ${src}`);
          return;
        }
        anchor.setAttribute("title", src);
        anchor.textContent = alt;
        return;
      }
      const a = doc.createElement("a");
      a.setAttribute("href", src);
      a.textContent = alt;
      const picture = img.parentElement && img.parentElement.tagName === "PICTURE" ? img.parentElement : null;
      (picture || img).replaceWith(a);
    });
  }

  // tools/importer/transformers/insureshield-hosted-svg.js
  var PROJECT_HOST = /^[a-z0-9-]+--ups-digital-da-eds--8497785\.aem\.(page|live)$/;
  var ASSET_DIR = "/assets/shipping-insurance/";
  function illustrationName(src) {
    let u;
    try {
      u = new URL(src);
    } catch (e) {
      return null;
    }
    if (!PROJECT_HOST.test(u.hostname) || !u.pathname.startsWith(ASSET_DIR)) return null;
    const m = u.pathname.slice(ASSET_DIR.length).match(/^([a-z0-9-]+)\.svg$/i);
    if (!m || /^logo-/i.test(m[1])) return null;
    return m[1].toLowerCase();
  }
  function transform4(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const name = illustrationName(img.getAttribute("src") || "");
      if (!name) return;
      if (img.closest("a")) {
        console.warn(`[hosted-svg] skipping linked illustration: ${name}`);
        return;
      }
      const picture = img.parentElement && img.parentElement.tagName === "PICTURE" ? img.parentElement : null;
      (picture || img).replaceWith(doc.createTextNode(`:illustration-${name}:`));
    });
  }

  // tools/importer/import-shipping-insurance.js
  var PAGE_TEMPLATE = {
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
          'aside[aria-label="Quote monthly cost"]'
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
          'aside[aria-label="Quote monthly cost"]'
        ],
        "style": null,
        "blocks": [
          "quote-drawer"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "hero-calculator": parse,
    "table-comparison": parse2,
    "cards-stat-animated": parse3,
    "columns-illustration": parse4,
    "widget-signal-field": parse5,
    "columns-logo-grid": parse6,
    "cards-illustrated": parse7,
    "cards-story": parse8,
    "accordion-faq": parse9,
    "quote-drawer": parse10
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [];
  var transformers = [transform, transform3, transform4, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_shipping_insurance_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_shipping_insurance_exports);
})();
