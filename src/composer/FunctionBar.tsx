import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import { parseExpression, toLatex } from '../engine/parser';

// ── Autocomplete suggestions ─────────────────────────────────────────────────

const SUGGESTIONS = [
  { name: 'sin(x)', desc: 'Sine' },
  { name: 'cos(x)', desc: 'Cosine' },
  { name: 'tan(x)', desc: 'Tangent' },
  { name: 'asin(x)', desc: 'Inverse sine' },
  { name: 'acos(x)', desc: 'Inverse cosine' },
  { name: 'atan(x)', desc: 'Inverse tangent' },
  { name: 'sinh(x)', desc: 'Hyperbolic sine' },
  { name: 'cosh(x)', desc: 'Hyperbolic cosine' },
  { name: 'log(x)', desc: 'Natural log' },
  { name: 'log10(x)', desc: 'Log base 10' },
  { name: 'log2(x)', desc: 'Log base 2' },
  { name: 'exp(x)', desc: 'Exponential' },
  { name: 'sqrt(x)', desc: 'Square root' },
  { name: 'abs(x)', desc: 'Absolute value' },
  { name: 'ceil(x)', desc: 'Ceiling' },
  { name: 'floor(x)', desc: 'Floor' },
  { name: 'sign(x)', desc: 'Sign function' },
  { name: 'x^2', desc: 'Square' },
  { name: 'x^3', desc: 'Cube' },
  { name: '1/x', desc: 'Reciprocal' },
  { name: 'pi', desc: '3.14159…' },
  { name: 'e', desc: '2.71828…' },
];

// ── Main FunctionBar ─────────────────────────────────────────────────────────

export default function FunctionBar() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFunction = useFunctionStore((s) => s.addFunction);

  // Filter suggestions based on current input (last token)
  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return [];
    // Get last partial token: split by operators/spaces and take the last part
    const tokens = input.split(/[\s+\-*/^(),]+/);
    const lastToken = tokens[tokens.length - 1]?.toLowerCase() ?? '';
    if (!lastToken || lastToken.length < 1) return [];
    return SUGGESTIONS.filter(
      (s) =>
        s.name.toLowerCase().startsWith(lastToken) &&
        s.name.toLowerCase() !== lastToken,
    ).slice(0, 6);
  }, [input]);

  // Real-time validation
  const isValid = useMemo(() => {
    if (!input.trim()) return null; // neutral state
    const result = parseExpression(input.trim());
    return result.valid;
  }, [input]);

  // LaTeX preview
  const latexPreview = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return toLatex(input.trim());
    } catch {
      return null;
    }
  }, [input]);

  // Border color based on validation state
  const borderColor =
    isValid === null
      ? 'var(--border)'
      : isValid
        ? '#22c55e'
        : '#ef4444';

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
    setShowSuggestions(false);
  }, [input, addFunction]);

  const applySuggestion = useCallback(
    (suggestion: string) => {
      // Replace the last partial token with the suggestion
      const tokens = input.split(/(\s+|[+\-*/^(),]+)/);
      tokens[tokens.length - 1] = suggestion;
      setInput(tokens.join(''));
      setError(null);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [input],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.function-bar-wrapper')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      className="function-bar-wrapper relative flex flex-col gap-1 px-3 py-2"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Custom Expression
      </span>

      <div className="relative">
        {/* Autocomplete dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-md border"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            {filteredSuggestions.map((s, i) => (
              <button
                key={s.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestion(s.name);
                }}
                className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs transition-colors"
                style={{
                  background:
                    i === selectedSuggestion
                      ? 'var(--bg-tertiary)'
                      : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="font-mono">{s.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
              setShowSuggestions(true);
              setSelectedSuggestion(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (
                e.key === 'ArrowDown' &&
                showSuggestions &&
                filteredSuggestions.length > 0
              ) {
                e.preventDefault();
                setSelectedSuggestion((prev) =>
                  Math.min(prev + 1, filteredSuggestions.length - 1),
                );
              } else if (e.key === 'ArrowUp' && showSuggestions) {
                e.preventDefault();
                setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
              } else if (
                e.key === 'Tab' &&
                showSuggestions &&
                filteredSuggestions.length > 0
              ) {
                e.preventDefault();
                applySuggestion(filteredSuggestions[selectedSuggestion].name);
              } else if (e.key === 'Enter') {
                if (
                  showSuggestions &&
                  filteredSuggestions.length > 0 &&
                  selectedSuggestion < filteredSuggestions.length
                ) {
                  e.preventDefault();
                  applySuggestion(filteredSuggestions[selectedSuggestion].name);
                } else {
                  handleSubmit();
                }
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            placeholder="e.g. sin(x) * x^2"
            className="flex-1 rounded border bg-transparent px-2 py-1 text-xs outline-none transition-colors duration-200 focus:ring-1"
            style={{
              color: 'var(--text-primary)',
              borderColor,
              boxShadow:
                isValid === true
                  ? '0 0 0 1px rgba(34, 197, 94, 0.2)'
                  : isValid === false
                    ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
                    : 'none',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="rounded px-2.5 py-1 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}

      {/* LaTeX preview */}
      {latexPreview && !error && (
        <span
          className="katex-card text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <InlineMath math={latexPreview} />
        </span>
      )}
    </div>
  );
}
