import { parse, type MathNode } from 'mathjs';

// Well-known math.js function names to exclude from "variables"
const KNOWN_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'cbrt', 'abs', 'ceil', 'floor', 'round', 'sign',
  'exp', 'log', 'log2', 'log10', 'ln',
  'pow', 'mod', 'factorial',
  'min', 'max', 'sum', 'mean',
  'pi', 'e', 'i', 'Infinity', 'NaN',
  'sec', 'csc', 'cot',
]);

export interface ParseSuccess {
  valid: true;
  node: MathNode;
  variables: string[];
}

export interface ParseFailure {
  valid: false;
  error: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

/**
 * Parse an expression string and validate it.
 * Returns the AST node and extracted variable names on success.
 */
export function parseExpression(expr: string): ParseResult {
  try {
    const processed = preprocess(expr);
    const node = parse(processed);
    const variables = extractVariables(node);
    return { valid: true, node, variables };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown parse error';
    return { valid: false, error: message };
  }
}

/**
 * Walk the AST and collect every SymbolNode name that
 * isn't a built-in function or constant.
 */
export function extractVariables(node: MathNode): string[] {
  const vars = new Set<string>();

  node.traverse((child: MathNode) => {
    if (child.type === 'SymbolNode') {
      const name = (child as MathNode & { name: string }).name;
      if (!KNOWN_FUNCTIONS.has(name)) {
        vars.add(name);
      }
    }
  });

  return [...vars].sort();
}

/**
 * Convert an expression string to a LaTeX string via math.js.
 */
export function toLatex(expr: string): string {
  try {
    const processed = preprocess(expr);
    return parse(processed).toTex();
  } catch {
    return expr;
  }
}

/**
 * Pre-process user-friendly shorthand into math.js-compatible syntax.
 *
 * - "2x"   → "2*x"          (implicit multiplication)
 * - "sinx" → "sin(x)"       (bare trig shorthand)
 * - "lnx"  → "log(x)"       (natural log alias)
 * - "x^2"  stays as-is
 */
export function preprocess(raw: string): string {
  let s = raw.trim();

  // Replace common aliases
  s = s.replace(/\bln\b/g, 'log');

  // "sinx" / "cosx" / "tanx" / "expx" / "sqrtx" / "absx" → fn(x)
  s = s.replace(
    /\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|exp|sqrt|abs|log|sec|csc|cot)([a-zA-Z])/g,
    '$1($2)',
  );
  // Close a paren only if one was just opened and the very next char is
  // a letter that ends the token: sin(x  →  sin(x)
  // The regex above only inserts the opening paren, so we need to close it
  // when the function argument is a single variable.
  // Actually, let's do a smarter version: match function-name followed by a
  // single letter that is NOT already wrapped in parens.
  // We already converted "sinx" to "sin(x" above.  We need to close it.
  // Strategy: find "sin(x" where x is a-z and the next char is NOT a letter
  // or is end-of-string, and append ")".
  s = s.replace(
    /\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|exp|sqrt|abs|log|sec|csc|cot)\(([a-zA-Z])(?=[^a-zA-Z(]|$)/g,
    '$1($2)',
  );
  // (The match already has the opening paren, so we just re-emit it.)
  // Now close any unmatched "fn(letter" by scanning:
  s = closeSingleArgFunctions(s);

  // Implicit multiplication: "2x" → "2*x", "3sin" → "3*sin", ")x" → ")*x"
  // number followed by letter
  s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  // closing paren followed by letter or digit
  s = s.replace(/\)([a-zA-Z0-9])/g, ')*$1');
  // letter/digit followed by opening paren (but not function names)
  s = s.replace(
    /([a-zA-Z0-9])(\()(?<![a-zA-Z]\()/g,
    (match, before: string, paren: string) => {
      // If 'before' is the last char of a known function, don't insert *
      const lookBehindStr = s.substring(
        0,
        s.indexOf(match) + before.length,
      );
      for (const fn of KNOWN_FUNCTIONS) {
        if (lookBehindStr.endsWith(fn)) return match;
      }
      return `${before}*${paren}`;
    },
  );

  return s;
}

/**
 * After converting "sinx" → "sin(x", close any single-variable
 * function args that are missing closing parens.
 *
 * Simple heuristic: scan for function names followed by "(" + single
 * letter, and if the char after that letter isn't already a ")", insert one.
 */
function closeSingleArgFunctions(s: string): string {
  const fnPattern =
    /\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|exp|sqrt|abs|log|sec|csc|cot)\(([a-zA-Z])([^)a-zA-Z]|$)/g;

  return s.replace(fnPattern, (_match, fn: string, v: string, after: string) => {
    return `${fn}(${v})${after}`;
  });
}
