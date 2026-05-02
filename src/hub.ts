export const PLUGIN_NAME = 'growi-plugin-markdown-lint';
export const PLUGIN_LABEL = 'Markdown Lint / Format';

const HUB_SETTINGS_KEY = 'growiPluginHub:settings';

export interface GrowiPageContext {
  pageId: string;
  mode: 'view' | 'edit';
  revisionId?: string;
  path?: string;
}

export interface PluginRegistration {
  id: string;
  label: string;
  icon?: string;
  order?: number;
  required?: boolean;
  menuItem?: boolean;
  onAction?: (pageId: string) => void;
  onPageChange?: (ctx: GrowiPageContext) => void;
  onDisable?: () => void;
}

interface HubPluginState {
  registration: { id: string };
  status: 'active' | 'disabled' | 'error';
}

export interface HubLike {
  register?: (plugin: PluginRegistration) => void;
  unregister?: (id: string) => void;
  log?: (pluginId: string, ...args: unknown[]) => void;
  _getPluginStates?: () => HubPluginState[];
  _queue?: PluginRegistration[];
}

export function getHub(): HubLike | undefined {
  return (window as unknown as { growiPluginHub?: HubLike }).growiPluginHub;
}

export function registerToHub(plugin: PluginRegistration): void {
  const hub = getHub();
  if (hub?.register) {
    hub.register(plugin);
    return;
  }
  const w = window as unknown as { growiPluginHub?: HubLike };
  if (!w.growiPluginHub) w.growiPluginHub = {};
  if (!w.growiPluginHub._queue) w.growiPluginHub._queue = [];
  w.growiPluginHub._queue.push(plugin);
}

export function unregisterFromHub(): void {
  getHub()?.unregister?.(PLUGIN_NAME);
}

export function log(...args: unknown[]): void {
  const hub = getHub();
  if (hub?.log) {
    hub.log(PLUGIN_NAME, ...args);
    return;
  }
  try {
    const raw = localStorage.getItem(HUB_SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { debug?: boolean; debugPlugins?: string[] };
    if (parsed.debug !== true) return;
    if (Array.isArray(parsed.debugPlugins) && parsed.debugPlugins.includes(PLUGIN_NAME)) return;
    console.log(`[${PLUGIN_NAME}]`, ...args);
  } catch {
    // localStorage unavailable — silent
  }
}

export function isPluginActiveInHub(): boolean | null {
  const hub = getHub();
  if (!hub?._getPluginStates) return null;
  const me = hub._getPluginStates().find(p => p.registration.id === PLUGIN_NAME);
  if (!me) return null;
  return me.status === 'active';
}
