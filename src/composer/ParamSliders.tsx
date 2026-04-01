import { useFunctionStore } from '../store/functionStore';
import { InlineMath } from 'react-katex';

export default function ParamSliders() {
  const selectedId = useFunctionStore((s) => s.selectedId);
  const fn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId)
  );
  const updateParam = useFunctionStore((s) => s.updateParam);

  if (!selectedId || !fn || fn.params.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-2 px-4 py-3"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: fn.color }}
        />
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {fn.name}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <InlineMath math={fn.latex} />
        </span>
      </div>

      {/* Sliders */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {fn.params.map((p) => (
          <div key={p.name} className="flex min-w-[200px] flex-1 flex-col gap-0.5">
            {/* Label + value */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {p.label} ({p.name})
              </span>
              <input
                type="number"
                min={p.min}
                max={p.max}
                step={p.step}
                value={p.value}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) updateParam(fn.id, p.name, v);
                }}
                className="w-16 rounded border bg-transparent px-1 py-0.5 text-right text-xs"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              />
            </div>

            {/* Slider */}
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={p.value}
              onChange={(e) => updateParam(fn.id, p.name, parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
              style={{
                accentColor: fn.color,
                background: `linear-gradient(to right, ${fn.color} ${((p.value - p.min) / (p.max - p.min)) * 100}%, var(--border) ${((p.value - p.min) / (p.max - p.min)) * 100}%)`,
              }}
            />

            {/* Description */}
            {p.description && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {p.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
