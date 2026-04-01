import { useState, useCallback } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunctionStore } from '../store/functionStore';
import type { AlgebraStep } from '../engine/symbolic';
import * as symbolic from '../engine/symbolic';

type Operation = 'simplify' | 'derivative' | 'integral' | 'factor' | 'expand';

const OPERATIONS: { key: Operation; label: string; icon: string }[] = [
  { key: 'simplify', label: 'Simplify', icon: '⚡' },
  { key: 'derivative', label: 'Derivative', icon: 'd/dx' },
  { key: 'integral', label: 'Integral', icon: '∫' },
  { key: 'factor', label: 'Factor', icon: '{ }' },
  { key: 'expand', label: 'Expand', icon: '↔' },
];

export default function AlgebraSteps() {
  const selectedFn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId),
  );
  const [steps, setSteps] = useState<AlgebraStep[]>([]);
  const [activeOp, setActiveOp] = useState<Operation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runOperation = useCallback(
    (op: Operation) => {
      if (!selectedFn) return;
      const expr = selectedFn.expression;

      setError(null);
      setActiveOp(op);
      setSteps([]);

      try {
        switch (op) {
          case 'simplify': {
            const r = symbolic.simplify(expr);
            setSteps(r.steps);
            break;
          }
          case 'derivative': {
            const r = symbolic.derivative(expr);
            setSteps(r.steps);
            break;
          }
          case 'integral': {
            const r = symbolic.integrate(expr);
            setSteps([
              { description: 'Original expression', expression: expr, latex: selectedFn.latex || expr },
              { description: 'Integrate with respect to x', expression: r.result, latex: r.latex },
            ]);
            break;
          }
          case 'factor': {
            const r = symbolic.factor(expr);
            setSteps([
              { description: 'Original expression', expression: expr, latex: selectedFn.latex || expr },
              { description: 'Factor', expression: r.result, latex: r.latex },
            ]);
            break;
          }
          case 'expand': {
            const r = symbolic.expand(expr);
            setSteps([
              { description: 'Original expression', expression: expr, latex: selectedFn.latex || expr },
              { description: 'Expand', expression: r.result, latex: r.latex },
            ]);
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Operation failed');
      }
    },
    [selectedFn],
  );

  if (!selectedFn) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12"
           style={{ color: 'var(--text-muted)' }}>
        <span className="text-3xl mb-3">∑</span>
        <p className="text-sm text-center">
          Select a function to view<br />algebraic operations
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      {/* Operation buttons */}
      <div className="flex flex-wrap gap-1.5">
        {OPERATIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => runOperation(key)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200"
            style={{
              background: activeOp === key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeOp === key ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeOp === key ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <span className="text-[10px] opacity-70">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md px-3 py-2 text-xs"
             style={{ background: '#371520', color: '#f87171', border: '1px solid #5c1d2e' }}>
          {error}
        </div>
      )}

      {/* Steps display */}
      <AnimatePresence mode="wait">
        {steps.length > 0 && (
          <motion.div
            key={activeOp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {steps.map((step, i) => (
              <div key={`${activeOp}-${i}`}>
                {/* Arrow + description between steps */}
                {i > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.15 }}
                    className="flex items-center gap-2 py-1.5 pl-4"
                  >
                    <span className="text-sm" style={{ color: 'var(--accent)' }}>↓</span>
                    <span className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                      {step.description}
                    </span>
                  </motion.div>
                )}

                {/* Expression card */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.15 + 0.05 }}
                  className="rounded-lg px-3 py-2.5 overflow-x-auto"
                  style={{
                    background: i === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: `1px solid ${i === steps.length - 1 ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {i === 0 && (
                    <span className="block text-[10px] uppercase tracking-wider mb-1"
                          style={{ color: 'var(--text-muted)' }}>
                      {step.description}
                    </span>
                  )}
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <BlockMath math={step.latex} />
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
