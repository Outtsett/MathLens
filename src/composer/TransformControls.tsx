import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import { toLatex } from '../engine/parser';

/* ── Component ───────────────────────────────────────────────────────── */

export default function TransformControls() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedId = useFunctionStore((s) => s.selectedId);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const selectedFn = functions.find((f) => f.id === selectedId) ?? null;

  // Transform parameters
  const [h, setH] = useState(0); // horizontal shift
  const [k, setK] = useState(0); // vertical shift
  const [b, setB] = useState(1); // horizontal scale
  const [a, setA] = useState(1); // vertical scale
  const [reflectX, setReflectX] = useState(false); // f(-x)
  const [reflectY, setReflectY] = useState(false); // -f(x)

  // Reset all transforms
  const handleReset = useCallback(() => {
    setH(0);
    setK(0);
    setB(1);
    setA(1);
    setReflectX(false);
    setReflectY(false);
  }, []);

  // Build the transformed expression string from the original
  const transformed = useMemo(() => {
    if (!selectedFn) return { expression: '', latex: '', label: '' };

    const orig = selectedFn.expression;

    // Build inner argument transformation: replace x → (b*(±x) - h)
    let innerArg = 'x';
    if (reflectX) innerArg = `(-${innerArg})`;
    if (b !== 1) innerArg = `(${fmtCoeff(b)} * ${innerArg})`;
    if (h !== 0) innerArg = `(${innerArg} ${h > 0 ? '-' : '+'} ${Math.abs(h)})`;

    // Replace all occurrences of standalone 'x' in the expression
    let expr = replaceVariable(orig, 'x', innerArg);

    // Apply vertical scale
    if (a !== 1) expr = `(${fmtCoeff(a)}) * (${expr})`;

    // Apply vertical reflection
    if (reflectY) expr = `-(${expr})`;

    // Apply vertical shift
    if (k !== 0) expr = `(${expr}) ${k > 0 ? '+' : '-'} ${Math.abs(k)}`;

    // Generate LaTeX
    let latex: string;
    try {
      latex = toLatex(expr);
    } catch {
      latex = expr;
    }

    // Readable label
    const parts: string[] = [];
    if (a !== 1) parts.push(`a=${fmtCoeff(a)}`);
    if (reflectY) parts.push('-f');
    if (b !== 1) parts.push(`b=${fmtCoeff(b)}`);
    if (reflectX) parts.push('f(-x)');
    if (h !== 0) parts.push(`h=${fmtCoeff(h)}`);
    if (k !== 0) parts.push(`k=${fmtCoeff(k)}`);
    const label =
      parts.length > 0
        ? `${selectedFn.name} [${parts.join(', ')}]`
        : `${selectedFn.name} (copy)`;

    return { expression: expr, latex, label };
  }, [selectedFn, h, k, b, a, reflectX, reflectY]);

  const hasAnyTransform =
    h !== 0 || k !== 0 || b !== 1 || a !== 1 || reflectX || reflectY;

  const handleApply = useCallback(() => {
    if (!selectedFn || !transformed.expression) return;
    addFunction({
      name: transformed.label,
      expression: transformed.expression,
      params: [],
      category: selectedFn.category,
      latex: transformed.latex,
      dimension: '2d',
    });
  }, [selectedFn, transformed, addFunction]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 px-3 py-3"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Transform Controls
        </h2>
        {hasAnyTransform && (
          <button
            onClick={handleReset}
            className="rounded px-2 py-0.5 text-[10px] transition-colors hover:opacity-80"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* No function selected */}
      {!selectedFn && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Select a function to apply transforms
        </p>
      )}

      <AnimatePresence>
        {selectedFn && (
          <motion.div
            key={selectedFn.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            {/* Source function badge */}
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: selectedFn.color }}
              />
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedFn.name}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <InlineMath math={selectedFn.latex} />
              </span>
            </div>

            {/* Sliders grid */}
            <div className="grid grid-cols-2 gap-3">
              <TransformSlider
                label="Horizontal shift (h)"
                description="f(x − h)"
                value={h}
                min={-10}
                max={10}
                step={0.1}
                onChange={setH}
              />
              <TransformSlider
                label="Vertical shift (k)"
                description="f(x) + k"
                value={k}
                min={-10}
                max={10}
                step={0.1}
                onChange={setK}
              />
              <TransformSlider
                label="Horizontal scale (b)"
                description="f(bx)"
                value={b}
                min={-5}
                max={5}
                step={0.1}
                onChange={setB}
              />
              <TransformSlider
                label="Vertical scale (a)"
                description="a·f(x)"
                value={a}
                min={-5}
                max={5}
                step={0.1}
                onChange={setA}
              />
            </div>

            {/* Reflection toggles */}
            <div className="flex gap-2">
              <ToggleButton
                label="Reflect y-axis  f(−x)"
                active={reflectX}
                onClick={() => setReflectX((v) => !v)}
              />
              <ToggleButton
                label="Reflect x-axis  −f(x)"
                active={reflectY}
                onClick={() => setReflectY((v) => !v)}
              />
            </div>

            {/* Transformed expression preview */}
            <AnimatePresence>
              {hasAnyTransform && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex flex-col gap-1 rounded-lg px-3 py-2"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Transformed
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      <InlineMath math={transformed.latex} />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Apply button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleApply}
              disabled={!hasAnyTransform}
              className="w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                background: hasAnyTransform ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: '#fff',
                border: hasAnyTransform ? 'none' : '1px solid var(--border)',
              }}
            >
              Apply Transform
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function TransformSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={parseFloat(value.toFixed(2))}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="w-14 rounded border bg-transparent px-1 py-0.5 text-right text-[10px] tabular-nums"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{
          accentColor: 'var(--accent)',
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
        }}
      />
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {description}
      </span>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-all"
      style={{
        background: active ? 'rgba(99,102,241,0.2)' : 'var(--bg-tertiary)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {label}
    </motion.button>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function fmtCoeff(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/**
 * Replace standalone occurrences of variable `name` in `expr` with `replacement`.
 * Avoids replacing inside longer identifiers (e.g. "exp" won't match "x").
 */
function replaceVariable(expr: string, name: string, replacement: string): string {
  // Word-boundary-safe replacement for single-char variables
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z0-9])`, 'g');
  return expr.replace(pattern, replacement);
}
