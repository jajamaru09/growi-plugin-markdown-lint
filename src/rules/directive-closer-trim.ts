import type { Rule } from './index';

const CLOSING_INDENTED = /^[ \t]+:::+\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

export const directiveCloserTrim: Rule = {
  name: 'directive-closer-trim',
  description: 'Strip leading whitespace Prettier prepends to ::: closer lines',
  apply(text: string): string {
    const lines = text.split('\n');
    const out: string[] = [];
    let inFence = false;
    let fenceChar: string | null = null;

    for (const line of lines) {
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

      if (CLOSING_INDENTED.test(line)) {
        out.push(line.replace(/^[ \t]+/, ''));
      } else {
        out.push(line);
      }
    }

    return out.join('\n');
  },
};
