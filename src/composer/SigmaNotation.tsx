import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { compile } from 'mathjs';
import { useFunctionStore } from '../store/functionStore';

/* ── Series definitions ─────────────────────────────────────────────── */

interface SeriesDef {
  id: string;
  label: string;
  /** LaTeX template — N is replaced with upper bound */
  latex: (nStart: number, nEnd: number, x: number) => string;
  /** Compute the k-th term given k and parameter x (or a) */
  term: (k: number, x: number) => number;
  /** Has a convergence limit when applicable */
  convergence?: (x: number) => number | null;
  /** mathjs expression for the partial-sum function of x, parameterised by bounds */
  toExpression: (nStart: number, nEnd: number) => string;
  hasParam: boolean;
  paramLabel: string;
  paramDefault: number;
  paramMin: number;
  paramMax: number;
  paramStep: number;
}

const SERIES: SeriesDef[] = [
  {
    id: 'harmonic',
    label: 'Σ 1/n  (Harmonic)',
    latex: (s, e) => `\\sum_{n=${s}}^{${e}} \\frac{1}{n}`,
    term: (k) => (k === 0 ? 0 : 1 / k),
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = Math.max(s, 1); k <= e; k++) parts.push(`1/${k}`);
      return parts.join(' + ') || '0';
    },
    hasParam: false,
    paramLabel: '',
    paramDefault: 0,
    paramMin: 0,
    paramMax: 0,
    paramStep: 0,
  },
  {
    id: 'basel',
    label: 'Σ 1/n²  (Basel)',
    latex: (s, e) => `\\sum_{n=${s}}^{${e}} \\frac{1}{n^2}`,
    term: (k) => (k === 0 ? 0 : 1 / (k * k)),
    convergence: () => (Math.PI * Math.PI) / 6,
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = Math.max(s, 1); k <= e; k++) parts.push(`1/${k * k}`);
      return parts.join(' + ') || '0';
    },
    hasParam: false,
    paramLabel: '',
    paramDefault: 0,
    paramMin: 0,
    paramMax: 0,
    paramStep: 0,
  },
  {
    id: 'taylor_exp',
    label: 'Σ xⁿ/n!  (eˣ)',
    latex: (s, e, x) => `\\sum_{n=${s}}^{${e}} \\frac{${fmtNum(x)}^n}{n!}`,
    term: (k, x) => Math.pow(x, k) / factorial(k),
    convergence: (x) => Math.exp(x),
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = s; k <= e; k++) parts.push(`x^${k} / ${factorial(k)}`);
      return parts.join(' + ') || '0';
    },
    hasParam: true,
    paramLabel: 'x',
    paramDefault: 1,
    paramMin: -5,
    paramMax: 5,
    paramStep: 0.1,
  },
  {
    id: 'taylor_sin',
    label: 'Σ (-1)ⁿx²ⁿ⁺¹/(2n+1)!  (sin x)',
    latex: (s, e, x) =>
      `\\sum_{n=${s}}^{${e}} \\frac{(-1)^n \\cdot ${fmtNum(x)}^{2n+1}}{(2n+1)!}`,
    term: (k, x) =>
      (Math.pow(-1, k) * Math.pow(x, 2 * k + 1)) / factorial(2 * k + 1),
    convergence: (x) => Math.sin(x),
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = s; k <= e; k++)
        parts.push(`(-1)^${k} * x^${2 * k + 1} / ${factorial(2 * k + 1)}`);
      return parts.join(' + ') || '0';
    },
    hasParam: true,
    paramLabel: 'x',
    paramDefault: 1,
    paramMin: -6,
    paramMax: 6,
    paramStep: 0.1,
  },
  {
    id: 'geometric',
    label: 'Σ aⁿ  (Geometric)',
    latex: (s, e, a) => `\\sum_{n=${s}}^{${e}} ${fmtNum(a)}^n`,
    term: (k, a) => Math.pow(a, k),
    convergence: (a) => (Math.abs(a) < 1 ? 1 / (1 - a) : null),
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = s; k <= e; k++) parts.push(`x^${k}`);
      return parts.join(' + ') || '0';
    },
    hasParam: true,
    paramLabel: 'a',
    paramDefault: 0.5,
    paramMin: -2,
    paramMax: 2,
    paramStep: 0.05,
  },
  {
    id: 'half_power',
    label: 'Σ 1/2ⁿ',
    latex: (s, e) => `\\sum_{n=${s}}^{${e}} \\frac{1}{2^n}`,
    term: (k) => Math.pow(0.5, k),
    convergence: () => 2,
    toExpression: (s, e) => {
      const parts: string[] = [];
      for (let k = s; k <= e; k++) parts.push(`(1/2)^${k}`);
      return parts.join(' + ') || '0';
    },
    hasParam: false,
    paramLabel: '',
    paramDefault: 0,
    paramMin: 0,
    paramMax: 0,
    paramStep: 0,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function fmtNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function SigmaNotation() {
  const addFunction = useFunctionStore((s) => s.addFunction);

  const [seriesId, setSeriesId] = useState('geometric');
  const [nStart, setNStart] = useState(0);
  const [nEnd, setNEnd] = useState(10);
  const [paramVal, setParamVal] = useState(0.5);

  const series = SERIES.find((s) => s.id === seriesId)!;

  // Keep param in sync when switching series
  const handleSeriesChange = useCallback((id: string) => {
    const s = SERIES.find((s) => s.id === id)!;
    setSeriesId(id);
    if (s.hasParam) setParamVal(s.paramDefault);
  }, []);

  // Compute terms & partial sums
  const { terms, partials, total } = useMemo(() => {
    const ts: { k: number; value: number }[] = [];
    const ps: { k: number; sum: number }[] = [];
    let running = 0;
    for (let k = nStart; k <= nEnd; k++) {
      const v = series.term(k, paramVal);
      ts.push({ k, value: isFinite(v) ? v : 0 });
      running += isFinite(v) ? v : 0;
      ps.push({ k, sum: running });
    }
    return { terms: ts, partials: ps, total: running };
  }, [series, nStart, nEnd, paramVal]);

  const convergenceVal = series.convergence?.(paramVal) ?? null;

  // Find max absolute value for bar chart scaling
  const maxAbsPartial = useMemo(
    () => Math.max(...partials.map((p) => Math.abs(p.sum)), 1e-10),
    [partials],
  );

  // Build a plottable expression (as function of x for Taylor/geometric, else constant)
  const handleAddFunction = useCallback(() => {
    const expr = series.toExpression(nStart, nEnd);
    let latex: string;
    try {
      // Validate the expression compiles
      compile(expr);
      latex = series.latex(nStart, nEnd, paramVal);
    } catch {
      latex = expr;
    }

    addFunction({
      name: `${series.label} [${nStart}..${nEnd}]`,
      expression: expr,
      params: [],
      category: 'special',
      latex,
      dimension: '2d',
    });
  }, [series, nStart, nEnd, paramVal, addFunction]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 px-3 py-3"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* Header */}
      <h2
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Σ Sigma Notation
      </h2>

      {/* Series selector */}
      <div className="flex flex-wrap gap-1">
        {SERIES.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSeriesChange(s.id)}
            className="rounded-md px-2 py-1 text-[11px] transition-all"
            style={{
              background: seriesId === s.id ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: seriesId === s.id ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${seriesId === s.id ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* LaTeX formula */}
      <div
        className="flex items-center justify-center rounded-lg px-3 py-2"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
      >
        <InlineMath math={series.latex(nStart, nEnd, paramVal)} />
      </div>

      {/* Bound sliders */}
      <div className="grid grid-cols-2 gap-3">
        <SliderField
          label={`n start = ${nStart}`}
          value={nStart}
          min={0}
          max={20}
          step={1}
          onChange={(v) => {
            setNStart(v);
            if (v >= nEnd) setNEnd(v + 1);
          }}
        />
        <SliderField
          label={`n end = ${nEnd}`}
          value={nEnd}
          min={1}
          max={50}
          step={1}
          onChange={(v) => {
            setNEnd(v);
            if (v <= nStart) setNStart(Math.max(0, v - 1));
          }}
        />
      </div>

      {/* Parameter slider (for series that need it) */}
      <AnimatePresence>
        {series.hasParam && (
          <motion.div
            key="param"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <SliderField
              label={`${series.paramLabel} = ${fmtNum(paramVal)}`}
              value={paramVal}
              min={series.paramMin}
              max={series.paramMax}
              step={series.paramStep}
              onChange={setParamVal}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running total + convergence */}
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Partial sum&nbsp;=&nbsp;
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {total.toFixed(6)}
          </span>
        </span>
        {convergenceVal !== null && isFinite(convergenceVal) && (
          <span style={{ color: 'var(--text-muted)' }}>
            Converges →&nbsp;
            <span style={{ color: 'var(--accent)' }}>{convergenceVal.toFixed(6)}</span>
          </span>
        )}
      </div>

      {/* Bar chart of partial sums */}
      <div
        className="flex flex-col gap-0.5 rounded-lg px-3 py-2"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        <span
          className="mb-1 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Partial Sums
        </span>
        {partials.map((p, i) => {
          const pct = (p.sum / maxAbsPartial) * 100;
          const isNeg = p.sum < 0;
          return (
            <motion.div
              key={p.k}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span
                className="w-8 shrink-0 text-right text-[10px] tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                n={p.k}
              </span>
              <div
                className="relative h-3 flex-1 overflow-hidden rounded-sm"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <motion.div
                  className="absolute top-0 h-full rounded-sm"
                  style={{
                    background: isNeg ? '#f43f5e' : 'var(--accent)',
                    left: isNeg ? `${50 + (pct / 2)}%` : '50%',
                    width: `${Math.abs(pct) / 2}%`,
                    opacity: 0.8,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(pct) / 2}%` }}
                  transition={{ duration: 0.3, delay: i * 0.015 }}
                />
                {/* Center line */}
                <div
                  className="absolute left-1/2 top-0 h-full w-px"
                  style={{ background: 'var(--border)' }}
                />
              </div>
              <span
                className="w-16 shrink-0 text-right text-[10px] tabular-nums"
                style={{ color: 'var(--text-secondary)' }}
              >
                {p.sum.toFixed(4)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Terms list */}
      <div
        className="flex flex-wrap gap-1 rounded-lg px-3 py-2"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          maxHeight: 100,
          overflowY: 'auto',
        }}
      >
        {terms.map((t) => (
          <span
            key={t.k}
            className="rounded px-1.5 py-0.5 text-[10px] tabular-nums"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            a<sub>{t.k}</sub> = {t.value.toFixed(4)}
          </span>
        ))}
      </div>

      {/* Add as Function button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleAddFunction}
        className="w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Add as Function
      </motion.button>
    </motion.div>
  );
}

/* ── Reusable slider ─────────────────────────────────────────────────── */

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
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
    </div>
  );
}
