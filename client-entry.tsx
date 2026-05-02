import { activate, deactivate } from './src/activate';

const PLUGIN_NAME = 'growi-plugin-markdown-lint';

declare global {
  interface Window {
    pluginActivators?: Record<string, { activate: () => void; deactivate: () => void }>;
  }
}

if (window.pluginActivators == null) {
  window.pluginActivators = {};
}
window.pluginActivators[PLUGIN_NAME] = { activate, deactivate };
