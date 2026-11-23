// Shared behavior for the owner console and the affiliate portal:
// collapsible sidebar / mobile drawer, profile menu, dialogs, toast and password reveal.
import { ICONS } from '../lib/icons.mjs';

// Tiny element builder: data goes in through textContent, never innerHTML.
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...kids.flat().filter((kid) => kid != null && kid !== false));
  return el;
}

// Icons are static strings from our own icon set, so innerHTML is safe here.
export function svg(name) {
  const template = document.createElement('template');
  template.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  return template.content.firstChild;
}

export const showError = (el, message) => { el.textContent = message; el.hidden = !message; };

const SIDE_KEY = 'ccact-console-sidebar';

export function setupShell(root, { onAction = () => {} } = {}) {
  const $ = (selector) => root.querySelector(selector);

  /* Toast */
  let toastTimer;
  function toast(message, kind = 'ok') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = kind;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 4500);
  }

  /* Password reveal: any button with data-pw-toggle="<input id>" */
  for (const button of root.querySelectorAll('[data-pw-toggle]')) {
    button.addEventListener('click', () => {
      const input = root.querySelector(`#${button.dataset.pwToggle}`);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      button.replaceChildren(svg(show ? 'eyeoff' : 'eye'));
    });
  }

  /* Profile menu */
  const menu = $('#profile-menu');
  const menuButton = $('#profile-btn');
  function closeMenu(restoreFocus = false) {
    if (!menu) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton.focus();
  }
  if (menu && menuButton) {
    menuButton.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuButton.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('[role="menuitem"]').focus();
    });
    document.addEventListener('click', (event) => {
      if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    menu.addEventListener('keydown', (event) => {
      const items = [...menu.querySelectorAll('[role="menuitem"]')];
      const at = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') { event.preventDefault(); items[(at + 1) % items.length].focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); items[(at - 1 + items.length) % items.length].focus(); }
    });
    menu.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      closeMenu();
      onAction(action);
    });
  }

  /* Dialogs: backdrop click and [data-close] buttons */
  for (const dialog of root.querySelectorAll('dialog')) {
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  }

  /* Sidebar: collapsible rail on desktop, drawer on mobile */
  const side = $('#sidebar');
  const sideToggle = $('#side-toggle');
  const narrow = window.matchMedia('(max-width: 860px)');
  function syncToggle() {
    if (!side) return;
    const collapsed = side.dataset.collapsed === 'true';
    const open = narrow.matches ? root.dataset.drawer === 'open' : !collapsed;
    sideToggle.setAttribute('aria-expanded', String(open));
    sideToggle.setAttribute('aria-label', narrow.matches ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  }
  function setCollapsed(collapsed) {
    side.dataset.collapsed = String(collapsed);
    try { localStorage.setItem(SIDE_KEY, collapsed ? '1' : '0'); } catch { /* private mode: keep in memory */ }
    closeMenu();
    syncToggle();
  }
  function setDrawer(open) {
    if (open) root.dataset.drawer = 'open'; else delete root.dataset.drawer;
    syncToggle();
    if (open) sideToggle.focus(); else if (narrow.matches) $('#drawer-open')?.focus();
  }
  if (side && sideToggle) {
    try { side.dataset.collapsed = localStorage.getItem(SIDE_KEY) === '1' ? 'true' : 'false'; } catch { /* default expanded */ }
    sideToggle.addEventListener('click', () => (narrow.matches ? setDrawer(false) : setCollapsed(side.dataset.collapsed !== 'true')));
    $('#drawer-open')?.addEventListener('click', () => setDrawer(true));
    $('#side-scrim')?.addEventListener('click', () => setDrawer(false));
    side.querySelectorAll('.nav__link').forEach((link) => link.addEventListener('click', () => { if (narrow.matches) delete root.dataset.drawer; }));
    narrow.addEventListener('change', () => { delete root.dataset.drawer; syncToggle(); });
    syncToggle();
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (menu && !menu.hidden) closeMenu(true);
    else if (root.dataset.drawer === 'open') setDrawer(false);
  });

  /* Hash tabs: links with data-tab show the matching #panel-<tab> */
  const tabs = [...root.querySelectorAll('[data-tab]')];
  function route() {
    if (!tabs.length) return;
    const names = tabs.map((link) => link.dataset.tab);
    const wanted = location.hash.slice(1);
    const tab = names.includes(wanted) ? wanted : names[0];
    for (const link of tabs) {
      if (link.dataset.tab === tab) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    for (const name of names) {
      const panel = $(`#panel-${name}`);
      if (panel) panel.hidden = name !== tab;
    }
  }
  window.addEventListener('hashchange', route);
  route();

  return { toast, closeMenu, route };
}
