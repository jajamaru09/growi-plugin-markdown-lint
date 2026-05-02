import type { Rule } from './index';

const OPENING = /^\s*:::+[a-zA-Z]/;
const CLOSING = /^\s*:::+\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

export const directiveBlankLines: Rule = {
  name: 'directive-blank-lines',
  description: 'Ensure a blank line before each :::name opener and after each ::: closer',
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

      if (inFence) {
        out.push(line);
        continue;
      }

      if (OPENING.test(line)) {
        const prev = out[out.length - 1];
        if (prev !== undefined && prev !== '') out.push('');
      }

      out.push(line);

      if (CLOSING.test(line)) {
        const next = lines[i + 1];
        if (next !== undefined && next !== '') out.push('');
      }
    }

    return out.join('\n');
  },
};
