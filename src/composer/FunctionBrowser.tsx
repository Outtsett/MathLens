import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { getPresets } from '../engine/presets';
import { useFunctionStore } from '../store/functionStore';
import type { FunctionCategory } from '../types/function';

const CATEGORY_LABELS: Record<FunctionCategory, string> = {
  trigonometric: '🌊 Trig',
  polynomial: '📐 Polynomial',
  exponential: '📈 Exponential',
  special: '✨ Special',
  statistical: '📊 Statistical',
  piecewise: '🧩 Piecewise',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as FunctionCategory[];

export default function FunctionBrowser() {
  const [activeCategory, setActiveCategory] = useState<FunctionCategory>('trigonometric');
  const addFunction = useFunctionStore((s) => s.addFunction);
  const presets = useMemo(() => getPresets(), []);

  const handleAdd = (preset: (typeof presets)[FunctionCategory][number]) => {
    addFunction({
      name: preset.name,
      expression: preset.expression,
      params: preset.params.map((p) => ({ ...p })),
      category: preset.category,
      latex: preset.latex,
      dimension: preset.dimension,
    });
  };

  return (
    <div className="flex flex-col px-3 py-3">
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Functions
      </h2>

      {/* Category tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="rounded-md px-2 py-1 text-xs transition-all"
            style={{
              background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Function cards */}
      <div className="grid grid-cols-2 gap-2">
        {(presets[activeCategory] ?? []).map((preset, i) => (
          <motion.button
            key={`${activeCategory}-${i}`}
            whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdd(preset)}
            className="flex flex-col items-start gap-1 rounded-lg p-3 text-left transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {preset.name}
            </span>
            <span className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
              <InlineMath math={preset.latex} />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
