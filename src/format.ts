import prettier from 'prettier/standalone';
import markdownPlugin from 'prettier/plugins/markdown';
import { getEditorView } from './editor-view';
import { applyRules, preFormatRules, postFormatRules } from './rules';

export async function formatMarkdownInEditor(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const view = getEditorView();
  if (!view) return { ok: false, reason: 'EditorView not found. Open the editor first.' };

  const original = view.state.doc.toString();
  let text = applyRules(original, preFormatRules);

  try {
    text = await prettier.format(text, {
      parser: 'markdown',
      plugins: [markdownPlugin],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Prettier failed: ${msg}` };
  }

  text = applyRules(text, postFormatRules);

  if (text === original) return { ok: true };

  const fresh = getEditorView();
  if (!fresh) return { ok: false, reason: 'EditorView disappeared during format.' };

  fresh.dispatch({
    changes: { from: 0, to: fresh.state.doc.length, insert: text },
  });
  return { ok: true };
}
