import nerdamer from 'nerdamer';
import 'nerdamer/Calculus';
import 'nerdamer/Algebra';
import 'nerdamer/Solve';

export interface AlgebraStep {
  description: string;
  expression: string;
  latex: string;
}

interface SymbolicResult {
  result: string;
  latex: string;
  steps: AlgebraStep[];
}

interface BasicResult {
  result: string;
  latex: string;
}

interface SolveResult {
  solutions: string[];
  latex: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeTeX(expr: string): string {
  try {
    return nerdamer(expr).toTeX();
  } catch {
    return expr;
  }
}

function safeSimplify(expr: string): string {
  try {
    return nerdamer.simplify(expr).toString();
  } catch {
    return expr;
  }
}

function resolveVariable(expr: string, variable?: string): string {
  if (variable) return variable;
  // Try to detect the variable used; default to 'x'
  const text = expr.toLowerCase();
  if (text.includes('x')) return 'x';
  if (text.includes('t')) return 't';
  if (text.includes('y')) return 'y';
  return 'x';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Simplify an expression and return intermediate steps. */
export function simplify(expr: string): SymbolicResult {
  try {
    const steps: AlgebraStep[] = [];

    steps.push({
      description: 'Original expression',
      expression: expr,
      latex: safeTeX(expr),
    });

    // Attempt expand first, then simplify
    let expanded: string;
    try {
      expanded = nerdamer.expand(expr).toString();
      if (expanded !== expr) {
        steps.push({
          description: 'Expand terms',
          expression: expanded,
          latex: safeTeX(expanded),
        });
      }
    } catch {
      expanded = expr;
    }

    const simplified = nerdamer.simplify(expr).toString();
    const simplifiedTeX = safeTeX(simplified);

    if (simplified !== expanded) {
      steps.push({
        description: 'Simplify',
        expression: simplified,
        latex: simplifiedTeX,
      });
    }

    // Try factoring to see if it yields a shorter form
    try {
      const factored = nerdamer.factor(simplified).toString();
      if (factored !== simplified && factored.length < simplified.length) {
        steps.push({
          description: 'Factor common terms',
          expression: factored,
          latex: safeTeX(factored),
        });
      }
    } catch {
      // factoring is optional — ignore errors
    }

    return { result: simplified, latex: simplifiedTeX, steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: expr,
      latex: safeTeX(expr),
      steps: [
        { description: 'Original expression', expression: expr, latex: safeTeX(expr) },
        { description: `Error: ${msg}`, expression: expr, latex: safeTeX(expr) },
      ],
    };
  }
}

/** Compute derivative with step-by-step breakdown. */
export function derivative(expr: string, variable?: string): SymbolicResult {
  const v = resolveVariable(expr, variable);

  try {
    const steps: AlgebraStep[] = [];

    steps.push({
      description: 'Original expression',
      expression: expr,
      latex: safeTeX(expr),
    });

    // Detect rule applied based on expression shape
    const ruleDescription = detectDerivativeRule(expr);
    steps.push({
      description: ruleDescription,
      expression: `d/d${v}(${expr})`,
      latex: `\\frac{d}{d${v}}\\left(${safeTeX(expr)}\\right)`,
    });

    const result = nerdamer.diff(expr, v);
    const resultStr = result.toString();
    const resultTeX = result.toTeX();

    steps.push({
      description: 'Compute derivative',
      expression: resultStr,
      latex: resultTeX,
    });

    // Try to simplify the result
    const simplified = safeSimplify(resultStr);
    if (simplified !== resultStr) {
      steps.push({
        description: 'Simplify result',
        expression: simplified,
        latex: safeTeX(simplified),
      });
    }

    return { result: simplified, latex: safeTeX(simplified), steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: expr,
      latex: safeTeX(expr),
      steps: [
        { description: 'Original expression', expression: expr, latex: safeTeX(expr) },
        { description: `Error computing derivative: ${msg}`, expression: expr, latex: safeTeX(expr) },
      ],
    };
  }
}

/** Compute indefinite integral. */
export function integrate(expr: string, variable?: string): BasicResult {
  const v = resolveVariable(expr, variable);

  try {
    const result = nerdamer.integrate(expr, v);
    return {
      result: result.toString(),
      latex: result.toTeX() + ' + C',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
    };
  }
}

/** Solve expression = 0 for the given variable. */
export function solve(expr: string, variable?: string): SolveResult {
  const v = resolveVariable(expr, variable);

  try {
    const result = nerdamer.solve(expr, v);
    const text = result.toString();

    // nerdamer returns solutions like "[1, -2, 3]"
    const cleaned = text.replace(/^\[|\]$/g, '');
    const solutions = cleaned
      ? cleaned.split(',').map((s) => s.trim())
      : [];

    const solutionTexParts = solutions.map((s) => `${v} = ${safeTeX(s)}`);
    const latex =
      solutions.length > 0
        ? solutionTexParts.join(', \\quad ')
        : '\\text{No real solutions}';

    return { solutions, latex };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      solutions: [],
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
    };
  }
}

/** Expand an expression. */
export function expand(expr: string): BasicResult {
  try {
    const result = nerdamer.expand(expr);
    return { result: result.toString(), latex: result.toTeX() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
    };
  }
}

/** Factor an expression. */
export function factor(expr: string): BasicResult {
  try {
    const result = nerdamer.factor(expr);
    return { result: result.toString(), latex: result.toTeX() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
    };
  }
}

/** Compose two functions: f(g(x)). */
export function compose(f: string, g: string, variable?: string): SymbolicResult {
  const v = resolveVariable(f, variable);

  try {
    const steps: AlgebraStep[] = [];

    steps.push({
      description: `Start with f(${v}) and g(${v})`,
      expression: `f = ${f}, g = ${g}`,
      latex: `f(${v}) = ${safeTeX(f)}, \\quad g(${v}) = ${safeTeX(g)}`,
    });

    // Substitute g into f
    const composed = nerdamer(f, { [v]: g });
    const composedStr = composed.toString();

    steps.push({
      description: `Substitute g(${v}) into f`,
      expression: composedStr,
      latex: safeTeX(composedStr),
    });

    // Expand
    let current = composedStr;
    try {
      const expanded = nerdamer.expand(composedStr).toString();
      if (expanded !== composedStr) {
        current = expanded;
        steps.push({
          description: 'Expand',
          expression: expanded,
          latex: safeTeX(expanded),
        });
      }
    } catch {
      // expansion optional
    }

    // Simplify
    const simplified = safeSimplify(current);
    if (simplified !== current) {
      steps.push({
        description: 'Simplify',
        expression: simplified,
        latex: safeTeX(simplified),
      });
    }

    const finalExpr = simplified;
    return { result: finalExpr, latex: safeTeX(finalExpr), steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
      steps: [
        {
          description: `Error composing functions: ${msg}`,
          expression: `f(g(${v}))`,
          latex: `\\text{Error}`,
        },
      ],
    };
  }
}

/** Add two functions: f(x) + g(x). */
export function add(f: string, g: string): SymbolicResult {
  try {
    const steps: AlgebraStep[] = [];
    const sumExpr = `(${f})+(${g})`;

    steps.push({
      description: 'Write the sum',
      expression: sumExpr,
      latex: safeTeX(f) + ' + ' + safeTeX(g),
    });

    const expanded = nerdamer.expand(sumExpr).toString();
    steps.push({
      description: 'Expand and combine like terms',
      expression: expanded,
      latex: safeTeX(expanded),
    });

    const simplified = safeSimplify(expanded);
    if (simplified !== expanded) {
      steps.push({
        description: 'Simplify',
        expression: simplified,
        latex: safeTeX(simplified),
      });
    }

    const result = simplified;
    return { result, latex: safeTeX(result), steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
      steps: [{ description: `Error: ${msg}`, expression: `${f} + ${g}`, latex: '\\text{Error}' }],
    };
  }
}

/** Multiply two functions: f(x) * g(x). */
export function multiply(f: string, g: string): SymbolicResult {
  try {
    const steps: AlgebraStep[] = [];
    const prodExpr = `(${f})*(${g})`;

    steps.push({
      description: 'Write the product',
      expression: prodExpr,
      latex: `\\left(${safeTeX(f)}\\right) \\cdot \\left(${safeTeX(g)}\\right)`,
    });

    const expanded = nerdamer.expand(prodExpr).toString();
    steps.push({
      description: 'Distribute / expand',
      expression: expanded,
      latex: safeTeX(expanded),
    });

    const simplified = safeSimplify(expanded);
    if (simplified !== expanded) {
      steps.push({
        description: 'Simplify',
        expression: simplified,
        latex: safeTeX(simplified),
      });
    }

    const result = simplified;
    return { result, latex: safeTeX(result), steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: `Error: ${msg}`,
      latex: `\\text{Error: ${msg.replace(/[{}\\]/g, '')}}`,
      steps: [{ description: `Error: ${msg}`, expression: `${f} * ${g}`, latex: '\\text{Error}' }],
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function detectDerivativeRule(expr: string): string {
  const e = expr.toLowerCase().replace(/\s/g, '');

  if (/\*/.test(e) && /sin|cos|tan|log|exp/.test(e)) return 'Apply product rule';
  if (/\//.test(e) && /[a-z]/.test(e)) return 'Apply quotient rule';
  if (/sin|cos|tan|sec|csc|cot/.test(e) && /\(.*[+\-*]/.test(e)) return 'Apply chain rule';
  if (/exp\(/.test(e) || /e\^/.test(e)) return 'Apply exponential rule';
  if (/log\(/.test(e) || /ln\(/.test(e)) return 'Apply logarithmic rule';
  if (/\^/.test(e)) return 'Apply power rule';
  return 'Differentiate term by term';
}
