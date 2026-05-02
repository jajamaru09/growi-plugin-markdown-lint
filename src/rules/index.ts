import { directiveBlankLines } from './directive-blank-lines';
import { directiveCloserTrim } from './directive-closer-trim';
import { divBlankLine } from './div-blank-line';

export interface Rule {
  name: string;
  description: string;
  apply(text: string): string;
}

export const preFormatRules: Rule[] = [
  directiveBlankLines,
];

export const postFormatRules: Rule[] = [
  directiveCloserTrim,
  divBlankLine,
];

export function applyRules(text: string, rules: Rule[]): string {
  return rules.reduce((acc, rule) => rule.apply(acc), text);
}
