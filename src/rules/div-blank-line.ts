import type { Rule } from './index';

const DIV_OPEN_AT_EOL = /<div\b[^>]*>\s*$/i;
const DIV_CLOSE = /<\/div\s*>/i;
const FENCE = /^\s*(`{3,}|~{3,})/;

export const divBlankLine: Rule = {
  name: 'div-blank-line',
  description: 'Ensure a blank line after a <div> opening tag',
  apply(text: string): string {
    const lines = text.split('\n');
    const out: string[] = [];
    let inFence = false;
    let fenceChar: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const fenceMatch = line.match(FENCE);
      if (fenceMatch) {
        const ch = fenceMatch[1][0];
        if (!inFence) {
          inFence = true;
          fenceChar = ch;
        } else if (fenceChar === ch) {
          inFence = false;
          fenceChar = null;
        }
        out.push(line);
        continue;
      }

      out.push(line);

      if (inFence) continue;

      if (DIV_OPEN_AT_EOL.test(line) && !DIV_CLOSE.test(line)) {
        const next = lines[i + 1];
        if (next !== undefined && next !== '') out.push('');
      }
    }

    return out.join('\n');
  },
};
