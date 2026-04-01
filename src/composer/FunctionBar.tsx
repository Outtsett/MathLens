import { useState, useCallback } from 'react';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import { parseExpression, toLatex } from '../engine/parser';

export default function FunctionBar() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;

    const result = parseExpression(input.trim());
    if (!result.valid) {
      setError(result.error ?? 'Invalid expression');
      return;
    }

    let latex: string;
    try {
      latex = toLatex(input.trim());
    } catch {
      latex = input.trim();
    }

    addFunction({
      name: `Custom: ${input.trim()}`,
      expression: input.trim(),
      params: [],
      category: 'special',
      latex,
      dimension: '2d',
    });

    setInput('');
    setError(null);
  }, [input, addFunction]);

  const latexPreview = (() => {
    if (!input.trim()) return null;
    try {
      return toLatex(input.trim());
    } catch {
      return null;
    }
  })();

  return (
    <div
      className="flex flex-col gap-1 px-3 py-2"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Custom Expression
      </span>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. sin(x) * x^2"
          className="flex-1 rounded border bg-transparent px-2 py-1 text-xs outline-none transition-colors focus:border-indigo-500"
          style={{
            color: 'var(--text-primary)',
            borderColor: error ? '#ef4444' : 'var(--border)',
          }}
        />
        <button
          onClick={handleSubmit}
          className="rounded px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Add
        </button>
      </div>

      {error && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}

      {latexPreview && !error && (
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <InlineMath math={latexPreview} />
        </span>
      )}
    </div>
  );
}
