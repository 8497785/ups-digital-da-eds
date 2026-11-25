// media query that switches between the mobile (hamburger popover) and desktop layouts
const isDesktop = window.matchMedia('(width >= 1024px)');

// minimum gap kept between an open dropdown and the viewport edge
const VIEWPORT_GUTTER = 12;

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;

  const fragment = document.createElement('div');
  fragment.innerHTML = await resp.text();

  // resolve relative media paths against the fragment location, not the page
  const base = new URL(resp.url || '/nav.plain.html', window.location.href);
  fragment.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/\/)/i.test(src)) img.src = new URL(src, base).href;
  });
  return fragment;
}

/**
 * Picks the brand, main-nav and utility sections from the fragment.
 * Authors may reorder or omit sections, so detection is content-based.
 * @param {HTMLElement} fragment
 */
function classifySections(fragment) {
  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const main = sections.find((s) => s.querySelector('li > ul'))
    || sections.find((s) => s.querySelector('ul'));
  const brand = sections.find((s) => s !== main && s.querySelector('a, img') && !s.querySelector('ul'))
    || sections.find((s) => s !== main);
  const utility = sections.find((s) => s !== main && s !== brand && s.querySelector('ul'));
  return { brand, main, utility };
}

/**
 * Text of a list item, excluding its nested list.
 * @param {Element} li
 */
function ownLabel(li) {
  const clone = li.cloneNode(true);
  clone.querySelectorAll('ul').forEach((ul) => ul.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

function closeAllDropdowns(nav, focusTrigger = false) {
  nav.querySelectorAll('.nav-trigger[aria-expanded="true"]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
    if (focusTrigger) trigger.focus();
  });
}

/**
 * Keeps an open dropdown inside the viewport (left aligned with its trigger,
 * shifted left when it would overflow the right edge).
 * @param {HTMLElement} panel
 */
function clampDropdown(panel) {
  panel.style.removeProperty('left');
  const rect = panel.getBoundingClientRect();
  const maxRight = window.innerWidth - VIEWPORT_GUTTER;
  if (rect.right > maxRight) {
    panel.style.left = `${Math.round(maxRight - rect.right)}px`;
  }
}

function openDropdown(trigger) {
  trigger.setAttribute('aria-expanded', 'true');
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));
  if (panel) clampDropdown(panel);
}

/**
 * Builds the main navigation list. Items with a nested list become dropdown
 * triggers; items with a link stay plain links.
 * @param {Element} section main nav section from the fragment
 * @param {string} idPrefix
 */
function buildMainList(section, idPrefix) {
  const list = document.createElement('ul');
  list.className = 'nav-list';
  const sourceList = section.querySelector('ul');
  if (!sourceList) return list;

  [...sourceList.children].forEach((li, index) => {
    const item = document.createElement('li');
    item.className = 'nav-item';
    const subList = li.querySelector(':scope > ul');

    if (subList) {
      const label = ownLabel(li);
      const panelId = `${idPrefix}-dropdown-${index}`;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'nav-trigger';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panelId);
      const text = document.createElement('span');
      text.className = 'nav-trigger-label';
      text.textContent = label;
      const chevron = document.createElement('span');
      chevron.className = 'nav-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      trigger.append(text, chevron);

      const panel = document.createElement('ul');
      panel.className = 'nav-dropdown';
      panel.id = panelId;
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-label', label);
      subList.querySelectorAll(':scope > li').forEach((subLi) => {
        const link = subLi.querySelector('a');
        if (!link) return;
        const entry = document.createElement('li');
        entry.setAttribute('role', 'none');
        link.setAttribute('role', 'menuitem');
        link.className = 'nav-dropdown-link';
        entry.append(link);
        panel.append(entry);
      });

      item.classList.add('nav-drop');
      item.append(trigger, panel);
    } else {
      const link = li.querySelector('a');
      if (!link) return;
      link.className = 'nav-link';
      item.append(link);
    }
    list.append(item);
  });
  return list;
}

/**
 * Builds the utility list (login, contact, locale, search links).
 * @param {Element} section
 * @param {string} linkClass
 */
function buildUtilityList(section, linkClass) {
  const list = document.createElement('ul');
  if (!section) return list;
  section.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    const item = document.createElement('li');
    const clone = link.cloneNode(true);
    clone.className = linkClass;
    clone.querySelectorAll('img').forEach((img) => {
      img.classList.add('nav-icon');
      img.setAttribute('aria-hidden', 'true');
      img.width = 16;
      img.height = 16;
    });
    item.append(clone);
    list.append(item);
  });
  return list;
}

/**
 * Moves keyboard focus between the links of an open dropdown.
 * @param {HTMLElement} panel
 * @param {number} step +1 / -1, or 0 for the first item
 */
function focusMenuItem(panel, step) {
  const links = [...panel.querySelectorAll('a')];
  if (!links.length) return;
  const current = links.indexOf(document.activeElement);
  let next = 0;
  if (step !== 0 && current >= 0) next = (current + step + links.length) % links.length;
  if (step < 0 && current < 0) next = links.length - 1;
  links[next].focus();
}

/**
 * Source behaviour: the sticky header slides away while the page scrolls down (once past its
 * own height) and comes back as soon as the page scrolls up by 8px or returns to the top.
 * CSS (styles.css, `header[data-hidden]`) does the motion and keeps it while focus is inside.
 * @param {HTMLElement} host the page's <header>
 */
function hideOnScroll(host) {
  const UP_THRESHOLD = 8;
  let last = window.scrollY;
  let frame = 0;
  const update = () => {
    frame = 0;
    const y = window.scrollY;
    const delta = y - last;
    if (y <= host.offsetHeight) {
      host.removeAttribute('data-hidden');
      last = y;
    } else if (delta > 0) {
      host.setAttribute('data-hidden', '');
      last = y;
    } else if (delta <= -UP_THRESHOLD) {
      host.removeAttribute('data-hidden');
      last = y;
    }
  };
  window.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
}

function setMenuOpen(wrapper, hamburger, open) {
  wrapper.classList.toggle('is-menu-open', open);
  hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  // the source locks page scroll while the menu popover is open
  document.documentElement.style.overflow = open ? 'hidden' : '';
}

/**
 * Syncs trigger attributes with the active layout: on mobile the dropdown
 * groups are always expanded inside the hamburger popover.
 * @param {HTMLElement} nav
 */
function syncLayout(nav) {
  nav.querySelectorAll('.nav-trigger').forEach((trigger) => {
    if (isDesktop.matches) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('tabindex');
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      trigger.setAttribute('tabindex', '-1');
    }
  });
  nav.querySelectorAll('.nav-dropdown').forEach((panel) => panel.style.removeProperty('left'));
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const { brand, main, utility } = classifySections(fragment);
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';

  // row 0: utility navigation
  if (utility) {
    const utilityNav = document.createElement('nav');
    utilityNav.className = 'nav-utility';
    utilityNav.setAttribute('aria-label', 'Utility');
    const utilityList = buildUtilityList(utility, 'nav-utility-link');
    utilityList.className = 'nav-utility-list';
    utilityNav.append(utilityList);
    wrapper.append(utilityNav);
  }

  // row 1: brand, main navigation, hamburger
  const inner = document.createElement('div');
  inner.className = 'nav-inner';

  const brandEl = document.createElement('div');
  brandEl.className = 'nav-brand';
  const brandLink = brand && brand.querySelector('a');
  if (brandLink) {
    brandLink.className = 'nav-brand-link';
    const logo = brandLink.querySelector('img');
    if (logo) {
      logo.className = 'nav-logo';
      logo.width = 128;
      logo.height = 48;
      logo.loading = 'eager';
    }
    brandEl.append(brandLink);
  } else if (brand) {
    brandEl.append(...brand.childNodes);
  }

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'nav-main';
  nav.setAttribute('aria-label', 'Main');
  const mainList = main ? buildMainList(main, 'nav') : document.createElement('ul');
  if (!main) mainList.className = 'nav-list';

  // mobile popover also lists the utility links as a final group
  if (utility) {
    const utilityGroup = document.createElement('li');
    utilityGroup.className = 'nav-item nav-utility-group';
    const groupList = buildUtilityList(utility, 'nav-dropdown-link');
    groupList.className = 'nav-dropdown nav-dropdown-utility';
    groupList.setAttribute('role', 'menu');
    groupList.setAttribute('aria-label', 'Utility');
    groupList.querySelectorAll('li').forEach((li) => li.setAttribute('role', 'none'));
    groupList.querySelectorAll('a').forEach((a) => a.setAttribute('role', 'menuitem'));
    utilityGroup.append(groupList);
    mainList.append(utilityGroup);
  }
  nav.append(mainList);

  const end = document.createElement('div');
  end.className = 'nav-end';
  const hamburgerWrap = document.createElement('div');
  hamburgerWrap.className = 'nav-hamburger';
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Menu');
  hamburger.setAttribute('aria-haspopup', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', 'nav');
  const hamburgerIcon = document.createElement('span');
  hamburgerIcon.className = 'nav-hamburger-icon';
  hamburgerIcon.setAttribute('aria-hidden', 'true');
  hamburger.append(hamburgerIcon);
  hamburgerWrap.append(hamburger);
  end.append(hamburgerWrap);

  inner.append(brandEl, nav, end);
  wrapper.append(inner);
  block.append(wrapper);

  // desktop dropdowns: click toggles; clicking another trigger while one is
  // open only closes the open one (mirrors the source popover behaviour)
  nav.querySelectorAll('.nav-trigger').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (!isDesktop.matches) return;
      e.stopPropagation();
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const otherOpen = nav.querySelector('.nav-trigger[aria-expanded="true"]');
      closeAllDropdowns(nav);
      if (!expanded && !otherOpen) openDropdown(trigger);
    });
    trigger.addEventListener('keydown', (e) => {
      if (!isDesktop.matches) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        closeAllDropdowns(nav);
        openDropdown(trigger);
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (panel) focusMenuItem(panel, e.key === 'ArrowDown' ? 0 : -1);
      }
    });
  });

  nav.querySelectorAll('.nav-drop .nav-dropdown').forEach((panel) => {
    panel.addEventListener('keydown', (e) => {
      if (!isDesktop.matches) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); focusMenuItem(panel, 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); focusMenuItem(panel, -1); }
    });
  });

  // mobile hamburger popover
  hamburger.addEventListener('click', (e) => {
    if (isDesktop.matches) return;
    e.stopPropagation();
    setMenuOpen(wrapper, hamburger, !wrapper.classList.contains('is-menu-open'));
  });

  // close on outside click
  document.addEventListener('click', (e) => {
    if (isDesktop.matches) {
      const openPanel = nav.querySelector('.nav-trigger[aria-expanded="true"] + .nav-dropdown');
      if (openPanel && !openPanel.contains(e.target)) closeAllDropdowns(nav);
    } else if (wrapper.classList.contains('is-menu-open') && !nav.contains(e.target)) {
      setMenuOpen(wrapper, hamburger, false);
    }
  });

  // close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isDesktop.matches) {
      const open = nav.querySelector('.nav-trigger[aria-expanded="true"]');
      if (open) {
        closeAllDropdowns(nav);
        open.focus();
      }
    } else if (wrapper.classList.contains('is-menu-open')) {
      setMenuOpen(wrapper, hamburger, false);
      hamburger.focus();
    }
  });

  // close when focus leaves the navigation
  nav.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget !== hamburger) {
      if (isDesktop.matches) closeAllDropdowns(nav);
      else setMenuOpen(wrapper, hamburger, false);
    }
  });

  // keep open dropdowns inside the viewport while resizing
  window.addEventListener('resize', () => {
    const open = nav.querySelector('.nav-trigger[aria-expanded="true"] + .nav-dropdown');
    if (open && isDesktop.matches) clampDropdown(open);
  });

  // switching between mobile and desktop resets all open states
  isDesktop.addEventListener('change', () => {
    setMenuOpen(wrapper, hamburger, false);
    syncLayout(nav);
  });
  syncLayout(nav);

  const host = block.closest('header');
  if (host) hideOnScroll(host);
}
