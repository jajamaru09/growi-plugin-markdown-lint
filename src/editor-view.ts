export interface EditorViewLike {
  state: {
    doc: { toString(): string; length: number };
  };
  dispatch(spec: { changes: { from: number; to: number; insert: string } }): void;
  dom: HTMLElement;
}

export function getEditorView(): EditorViewLike | null {
  const content = document.querySelector('.cm-content');
  if (!content) return null;
  const tile = (content as unknown as { cmTile?: { parent?: { view?: EditorViewLike }; view?: EditorViewLike } }).cmTile;
  if (!tile) return null;
  return tile.parent?.view ?? tile.view ?? null;
}
