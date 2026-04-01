import { useState, useCallback, useEffect, useRef } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { useFunctionStore } from '../store/functionStore';
import * as symbolic from '../engine/symbolic';

interface FunctionProperties {
  domain: string;
  range: string;
  zeros: string[];
  yIntercept: string;
  derivative: string;
  derivativeLatex: string;
  extrema: { x: string; type: 'min' | 'max' }[];
  symmetry: 'even' | 'odd' | 'neither';
  period: string | null;
}

function detectDomain(expr: string): string {
  const e = expr.toLowerCase();
  if (/\/.*x/.test(e) || /x.*\//.test(e)) return 'x \\neq 0 \\text{ (check denominator)}';
  if (/sqrt\(/.test(e)) return 'x \\geq 0 \\text{ (or radicand } \\geq 0\\text{)}';
  if (/log\(|ln\(/.test(e)) return 'x > 0 \\text{ (or argument } > 0\\text{)}';
  if (/1\/\(/.test(e)) return '\\text{Excludes denominator zeros}';
  if (/tan\(/.test(e)) return 'x \\neq \\frac{\\pi}{2} + n\\pi';
  if (/sec\(|csc\(/.test(e)) return '\\text{Excludes asymptote points}';
  return '\\mathbb{R} \\text{ (all real numbers)}';
}

function detectSymmetry(expr: string): 'even' | 'odd' | 'neither' {
  try {
    // f(-x) via nerdamer
    const original = symbolic.simplify(expr).result;
    const negated = symbolic.simplify(expr.replace(/x/g, '(-x)')).result;
    const negResult = symbolic.simplify(`-(${expr})`).result;

    if (negated === original) return 'even';
    if (negated === negResult) return 'odd';
  } catch {
    // detection is best-effort
  }
  return 'neither';
}

function detectPeriod(expr: string): string | null {
  const e = expr.toLowerCase();
  // Check for trig functions
  if (/\btan\b/.test(e) || /\bcot\b/.test(e)) return '\\pi';
  if (/\bsin\b/.test(e) || /\bcos\b/.test(e) || /\bsec\b/.test(e) || /\bcsc\b/.test(e)) return '2\\pi';
  return null;
}

function computeYIntercept(expr: string): string {
  try {
    const result = symbolic.simplify(expr.replace(/x/g, '(0)'));
    return result.result;
  } catch {
    return '\\text{undefined}';
  }
}

export default function Properties() {
  const selectedFn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId),
  );
  const [props, setProps] = useState<FunctionProperties | null>(null);
  const [computing, setComputing] = useState(false);
  const cacheKeyRef = useRef<string>('');

  const compute = useCallback(() => {
    if (!selectedFn) return;

    const cacheKey = `${selectedFn.id}:${selectedFn.expression}:${JSON.stringify(selectedFn.params.map((p) => p.value))}`;
    if (cacheKey === cacheKeyRef.current && props) return;
    cacheKeyRef.current = cacheKey;

    setComputing(true);

    // Run computations (synchronous via nerdamer)
    try {
      const expr = selectedFn.expression;

      // Zeros
      const solveResult = symbolic.solve(expr);
      const zeros = solveResult.solutions;

      // Derivative
      const derivResult = symbolic.derivative(expr);

      // Extrema — solve f'(x) = 0
      let extrema: { x: string; type: 'min' | 'max' }[] = [];
      try {
        const criticalPoints = symbolic.solve(derivResult.result);
        // Classify via second derivative
        const secondDeriv = symbolic.derivative(derivResult.result);
        extrema = criticalPoints.solutions.map((cp) => {
          try {
            const secondVal = symbolic.simplify(
              secondDeriv.result.replace(/x/g, `(${cp})`),
            ).result;
            const num = parseFloat(secondVal);
            if (!isNaN(num)) {
              return { x: cp, type: num > 0 ? 'min' as const : 'max' as const };
            }
          } catch {
            // classification failed
          }
          return { x: cp, type: 'min' as const };
        });
      } catch {
        // extrema computation failed — non-critical
      }

      // Y-intercept
      const yIntercept = computeYIntercept(expr);

      // Domain / symmetry / period
      const domain = detectDomain(expr);
      const symmetry = detectSymmetry(expr);
      const period = detectPeriod(expr);

      setProps({
        domain,
        range: '\\text{Computed from viewport}',
        zeros,
        yIntercept,
        derivative: derivResult.result,
        derivativeLatex: derivResult.latex,
        extrema,
        symmetry,
        period,
      });
    } catch {
      setProps(null);
    } finally {
      setComputing(false);
    }
  }, [selectedFn, props]);

  // Auto-compute when selection changes
  useEffect(() => {
    if (selectedFn) {
      const cacheKey = `${selectedFn.id}:${selectedFn.expression}:${JSON.stringify(selectedFn.params.map((p) => p.value))}`;
      if (cacheKey !== cacheKeyRef.current) {
        setProps(null);
      }
    }
  }, [selectedFn]);

  if (!selectedFn) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12"
           style={{ color: 'var(--text-muted)' }}>
        <span className="text-3xl mb-3">📊</span>
        <p className="text-sm text-center">
          Select a function to view<br />its properties
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      {/* Calculate button */}
      {!props && (
        <button
          onClick={compute}
          disabled={computing}
          className="w-full rounded-lg py-2 text-sm font-medium transition-all duration-200"
          style={{
            background: computing ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: computing ? 'var(--text-muted)' : '#fff',
            border: '1px solid var(--accent)',
          }}
        >
          {computing ? 'Computing…' : 'Calculate Properties'}
        </button>
      )}

      {/* Properties cards */}
      {props && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-2"
        >
          <PropertyCard label="Domain" delay={0}>
            <InlineMath math={props.domain} />
          </PropertyCard>

          <PropertyCard label="Y-intercept" delay={0.05}>
            <InlineMath math={`f(0) = ${props.yIntercept}`} />
          </PropertyCard>

          <PropertyCard label="Zeros / Roots" delay={0.1}>
            {props.zeros.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {props.zeros.map((z, i) => (
                  <span key={i} className="rounded px-1.5 py-0.5 text-xs"
                        style={{ background: 'var(--bg-primary)' }}>
                    <InlineMath math={`x = ${z}`} />
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No real roots found
              </span>
            )}
          </PropertyCard>

          <PropertyCard label="Derivative f′(x)" delay={0.15}>
            <InlineMath math={props.derivativeLatex} />
          </PropertyCard>

          <PropertyCard label="Extrema" delay={0.2}>
            {props.extrema.length > 0 ? (
              <div className="flex flex-col gap-1">
                {props.extrema.map((e, i) => (
                  <span key={i} className="text-xs">
                    <span className="rounded px-1 py-0.5 mr-1 text-[10px] uppercase font-semibold"
                          style={{
                            background: e.type === 'min' ? '#0c4a6e' : '#7c2d12',
                            color: e.type === 'min' ? '#38bdf8' : '#fb923c',
                          }}>
                      {e.type}
                    </span>
                    <InlineMath math={`x = ${e.x}`} />
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No critical points found
              </span>
            )}
          </PropertyCard>

          <PropertyCard label="Symmetry" delay={0.25}>
            <span className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: props.symmetry === 'neither' ? 'var(--bg-primary)' : '#1e1b4b',
                    color: props.symmetry === 'neither' ? 'var(--text-muted)' : '#a5b4fc',
                  }}>
              {props.symmetry === 'even' && 'Even — f(-x) = f(x)'}
              {props.symmetry === 'odd' && 'Odd — f(-x) = -f(x)'}
              {props.symmetry === 'neither' && 'Neither even nor odd'}
            </span>
          </PropertyCard>

          <PropertyCard label="Period" delay={0.3}>
            {props.period ? (
              <InlineMath math={`T = ${props.period}`} />
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Not periodic
              </span>
            )}
          </PropertyCard>

          {/* Recalculate button */}
          <button
            onClick={() => {
              cacheKeyRef.current = '';
              setProps(null);
            }}
            className="mt-1 w-full rounded-md py-1.5 text-xs transition-colors duration-200"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            Recalculate
          </button>
        </motion.div>
      )}
    </div>
  );
}

/** Reusable property row card. */
function PropertyCard({
  label,
  delay,
  children,
}: {
  label: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="rounded-lg px-3 py-2.5"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
    >
      <span className="block text-[10px] uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
        {children}
      </div>
    </motion.div>
  );
}
