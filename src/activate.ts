import { formatMarkdownInEditor } from './format';
import {
  PLUGIN_NAME,
  PLUGIN_LABEL,
  registerToHub,
  unregisterFromHub,
  isPluginActiveInHub,
  log,
  type GrowiPageContext,
} from './hub';

const BUTTON_ID = 'growi-plugin-markdown-lint-format-btn';
const TOOLBAR_SELECTOR = '[class*="codemirror-editor-toolbar"] .simplebar-content .d-flex.gap-2';

let toolbarButton: HTMLButtonElement | null = null;
let enabled = true;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let navListening = false;

function buildButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.type = 'button';
  btn.className = 'btn btn-toolbar-button';
  btn.title = 'Format Markdown with Prettier';

  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined fs-5';
  icon.textContent = 'format_align_left';
  btn.appendChild(icon);

  btn.addEventListener('click', async () => {
    if (btn.dataset.busy === 'true') return;
    if (!isEnabled()) {
      log('click ignored — plugin disabled');
      return;
    }
    btn.dataset.busy = 'true';
    btn.disabled = true;
    const prevTitle = btn.title;
    btn.title = 'Formatting…';
    log('format start');
    try {
      const result = await formatMarkdownInEditor();
      if (!result.ok) {
        console.error('[growi-plugin-markdown-lint]', result.reason);
        log('format failed:', result.reason);
        btn.title = `Failed: ${result.reason}`;
        setTimeout(() => { btn.title = prevTitle; }, 2000);
      } else {
        log('format done');
      }
    } finally {
      btn.disabled = false;
      btn.dataset.busy = 'false';
    }
  });

  return btn;
}

function isEnabled(): boolean {
  if (enabled) return true;
  const hubStatus = isPluginActiveInHub();
  if (hubStatus === true) {
    enabled = true;
    return true;
  }
  return false;
}

function addToolbarButton(): void {
  if (!isEnabled()) return;
  if (toolbarButton && document.contains(toolbarButton)) return;
  const toolbar = document.querySelector(TOOLBAR_SELECTOR);
  if (!toolbar) return;
  if (document.getElementById(BUTTON_ID)) return;
  toolbarButton = buildButton();
  toolbar.appendChild(toolbarButton);
  log('button injected');
}

function removeToolbarButton(): void {
  toolbarButton?.remove();
  toolbarButton = null;
  document.getElementById(BUTTON_ID)?.remove();
}

function clearPoll(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function waitForToolbar(): void {
  clearPoll();
  const maxAttempts = 20;
  let attempts = 0;
  const tryAdd = (): void => {
    attempts++;
    if (!isEnabled()) {
      pollTimer = null;
      return;
    }
    if (document.querySelector(TOOLBAR_SELECTOR)) {
      addToolbarButton();
      pollTimer = null;
      return;
    }
    if (attempts < maxAttempts) {
      pollTimer = setTimeout(tryAdd, 200);
    } else {
      pollTimer = null;
      log('toolbar not found after retries');
    }
  };
  tryAdd();
}

function syncToHash(hash: string): void {
  if (hash === '#edit') {
    waitForToolbar();
  } else {
    clearPoll();
    removeToolbarButton();
  }
}

function onHubPageChange(ctx: GrowiPageContext): void {
  enabled = true;
  log('onPageChange', ctx.mode, ctx.pageId);
  if (ctx.mode === 'edit') {
    waitForToolbar();
  } else {
    clearPoll();
    removeToolbarButton();
  }
}

function onHubDisable(): void {
  enabled = false;
  log('onDisable');
  clearPoll();
  removeToolbarButton();
}

function onNavigate(e: Event): void {
  const dest = (e as unknown as { destination?: { url?: string } }).destination;
  if (!dest?.url) return;
  syncToHash(new URL(dest.url).hash);
}

function onHashChange(): void {
  syncToHash(location.hash);
}

function startStandaloneListener(): void {
  if (navListening) return;
  navListening = true;
  const nav = (window as unknown as { navigation?: EventTarget }).navigation;
  if (nav) {
    nav.addEventListener('navigate', onNavigate);
    log('standalone: using Navigation API');
  } else {
    window.addEventListener('hashchange', onHashChange);
    log('standalone: using hashchange (Navigation API unavailable)');
  }
  syncToHash(location.hash);
}

function stopStandaloneListener(): void {
  if (!navListening) return;
  navListening = false;
  const nav = (window as unknown as { navigation?: EventTarget }).navigation;
  nav?.removeEventListener('navigate', onNavigate);
  window.removeEventListener('hashchange', onHashChange);
}

export function activate(): void {
  enabled = true;
  log('activate');

  registerToHub({
    id: PLUGIN_NAME,
    label: PLUGIN_LABEL,
    icon: 'format_align_left',
    menuItem: false,
    onPageChange: onHubPageChange,
    onDisable: onHubDisable,
  });

  startStandaloneListener();
}

export function deactivate(): void {
  log('deactivate');
  enabled = false;
  clearPoll();
  removeToolbarButton();
  stopStandaloneListener();
  unregisterFromHub();
}
