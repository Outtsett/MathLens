import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import { compose, add, multiply } from '../engine/symbolic';

type CombineOp = 'add' | 'subtract' | 'multiply' | 'divide' | 'compose';

const OP_OPTIONS: { value: CombineOp; label: string }[] = [
  { value: 'add',      label: 'f + g' },
  { value: 'subtract', label: 'f − g' },
  { value: 'multiply', label: 'f × g' },
  { value: 'divide',   label: 'f ÷ g' },
  { value: 'compose',  label: 'f(g(x))' },
];

function computeCombination(
  op: CombineOp,
  exprA: string,
  exprB: string,
): { result: string; latex: string } | null {
  try {
    switch (op) {
      case 'add':
        return add(exprA, exprB);
      case 'subtract':
        return add(exprA, `-(${exprB})`);
      case 'multiply':
        return multiply(exprA, exprB);
      case 'divide':
        return multiply(exprA, `1/(${exprB})`);
      case 'compose':
        return compose(exprA, exprB);
    }
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Styled select wrapper
// ---------------------------------------------------------------------------

function StyledSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-md px-2 py-1.5 text-xs outline-none transition-colors"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2388889a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          paddingRight: 24,
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FunctionCombiner component
// ---------------------------------------------------------------------------

export default function FunctionCombiner() {
  const functions = useFunctionStore((s) => s.functions);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const [fnAId, setFnAId] = useState<string>('');
  const [fnBId, setFnBId] = useState<string>('');
  const [operation, setOperation] = useState<CombineOp>('add');
  const [added, setAdded] = useState(false);

  const fnA = functions.find((f) => f.id === fnAId) ?? null;
  const fnB = functions.find((f) => f.id === fnBId) ?? null;

  const preview = useMemo(() => {
    if (!fnA || !fnB) return null;
    return computeCombination(operation, fnA.expression, fnB.expression);
  }, [fnA, fnB, operation]);

  const handleAdd = useCallback(() => {
    if (!fnA || !fnB || !preview) return;

    const opSymbols: Record<CombineOp, string> = {
      add: '+',
      subtract: '−',
      multiply: '×',
      divide: '÷',
      compose: '∘',
    };

    const name =
      operation === 'compose'
        ? `${fnA.name}(${fnB.name})`
        : `${fnA.name} ${opSymbols[operation]} ${fnB.name}`;

    addFunction({
      name,
      expression: preview.result,
      params: [],
      category: 'special',
      latex: preview.latex,
      dimension: '2d',
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [fnA, fnB, preview, operation, addFunction]);

  if (functions.length < 2) {
    return (
      <div className="px-3 py-3">
        <h2
          className="mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Quick Combine
        </h2>
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Add at least two functions to combine them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Quick Combine
      </h2>

      {/* ── Selectors row ──────────────────────────────────────── */}
      <div
        className="grid gap-2 rounded-lg p-2.5"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'end',
        }}
      >
        {/* Function A */}
        <StyledSelect
          label="Function A"
          value={fnAId}
          onChange={(v) => {
            setFnAId(v);
            setAdded(false);
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {functions.map((fn) => (
            <option key={fn.id} value={fn.id}>
              {fn.name}
            </option>
          ))}
        </StyledSelect>

        {/* Operation */}
        <StyledSelect
          label="Op"
          value={operation}
          onChange={(v) => {
            setOperation(v as CombineOp);
            setAdded(false);
          }}
        >
          {OP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </StyledSelect>

        {/* Function B */}
        <StyledSelect
          label="Function B"
          value={fnBId}
          onChange={(v) => {
            setFnBId(v);
            setAdded(false);
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {functions.map((fn) => (
            <option key={fn.id} value={fn.id}>
              {fn.name}
            </option>
          ))}
        </StyledSelect>
      </div>

      {/* ── Preview ────────────────────────────────────────────── */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 rounded-lg p-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {/* LaTeX preview */}
            <div className="flex items-center gap-2">
              {fnA && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: fnA.color }}
                />
              )}
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Preview
              </span>
              {fnB && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: fnB.color }}
                />
              )}
            </div>

            <div
              className="katex-card overflow-x-auto text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              <InlineMath math={preview.latex} />
            </div>

            <code
              className="block truncate rounded px-2 py-1 text-[10px]"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {preview.result}
            </code>

            {/* Add button */}
            <motion.button
              onClick={handleAdd}
              disabled={added}
              className="mt-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60"
              style={{
                background: added ? '#10b981' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: added ? 'default' : 'pointer',
              }}
              whileHover={added ? {} : { scale: 1.03 }}
              whileTap={added ? {} : { scale: 0.97 }}
            >
              {added ? '✓ Added!' : 'Add to Plot'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
