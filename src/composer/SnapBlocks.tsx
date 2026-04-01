import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import { compose, add, multiply } from '../engine/symbolic';
import type { MathFunction } from '../types/function';

type Operation = 'compose' | 'add' | 'subtract' | 'multiply';

const OP_LABELS: Record<Operation, { symbol: string; label: string }> = {
  add:      { symbol: '+', label: 'Add' },
  subtract: { symbol: '−', label: 'Subtract' },
  multiply: { symbol: '×', label: 'Multiply' },
  compose:  { symbol: '∘', label: 'Compose' },
};

function computeResult(
  op: Operation,
  exprA: string,
  exprB: string,
): { result: string; latex: string } | null {
  try {
    switch (op) {
      case 'compose':
        return compose(exprA, exprB);
      case 'add':
        return add(exprA, exprB);
      case 'subtract':
        return add(exprA, `-(${exprB})`);
      case 'multiply':
        return multiply(exprA, exprB);
    }
  } catch {
    return null;
  }
}

function buildName(op: Operation, a: MathFunction, b: MathFunction): string {
  switch (op) {
    case 'compose':  return `${a.name}(${b.name})`;
    case 'add':      return `${a.name} + ${b.name}`;
    case 'subtract': return `${a.name} − ${b.name}`;
    case 'multiply': return `${a.name} × ${b.name}`;
  }
}

// ---------------------------------------------------------------------------
// Draggable function block
// ---------------------------------------------------------------------------

function FnBlock({
  fn,
  onDragStart,
}: {
  fn: MathFunction;
  onDragStart: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      draggable
      onDragStart={() => onDragStart(fn.id)}
      className="flex cursor-grab select-none items-center gap-2 rounded-lg px-3 py-2 transition-shadow active:cursor-grabbing"
      style={{
        background: 'var(--bg-tertiary)',
        border: `1.5px solid ${fn.color}44`,
        boxShadow: `0 0 0 0 ${fn.color}00`,
      }}
      whileHover={{
        boxShadow: `0 0 12px 2px ${fn.color}33`,
        borderColor: `${fn.color}88`,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: fn.color }}
      />
      <span className="text-xs font-medium" style={{ color: fn.color }}>
        {fn.name}
      </span>
      <span className="katex-card truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <InlineMath math={fn.latex} />
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Drop slot
// ---------------------------------------------------------------------------

function DropSlot({
  label,
  fn,
  isOver,
  onDrop,
  onClear,
  onDragOver,
  onDragLeave,
}: {
  label: string;
  fn: MathFunction | null;
  isOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onClear: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all"
      style={{
        background: isOver ? 'rgba(99,102,241,0.12)' : 'var(--bg-primary)',
        border: `1.5px dashed ${isOver ? 'var(--accent)' : fn ? fn.color : 'var(--border)'}`,
        minHeight: 44,
      }}
    >
      <span
        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', width: 40 }}
      >
        {label}
      </span>

      {fn ? (
        <div className="flex flex-1 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: fn.color }}
          />
          <span className="text-xs font-medium" style={{ color: fn.color }}>
            {fn.name}
          </span>
          <span className="katex-card truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <InlineMath math={fn.latex} />
          </span>
          <button
            onClick={onClear}
            className="ml-auto shrink-0 rounded p-0.5 text-xs transition-colors hover:bg-red-500/20 hover:text-red-400"
            style={{ color: 'var(--text-muted)' }}
            title="Clear slot"
          >
            ✕
          </button>
        </div>
      ) : (
        <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Drag a function here
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SnapBlocks component
// ---------------------------------------------------------------------------

export default function SnapBlocks() {
  const functions = useFunctionStore((s) => s.functions);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const [operation, setOperation] = useState<Operation>('add');
  const [slotAId, setSlotAId] = useState<string | null>(null);
  const [slotBId, setSlotBId] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<'A' | 'B' | null>(null);
  const [added, setAdded] = useState(false);

  const dragIdRef = useRef<string | null>(null);

  const fnA = functions.find((f) => f.id === slotAId) ?? null;
  const fnB = functions.find((f) => f.id === slotBId) ?? null;

  // Compute preview
  const preview =
    fnA && fnB ? computeResult(operation, fnA.expression, fnB.expression) : null;

  const handleDragStart = useCallback((id: string) => {
    dragIdRef.current = id;
  }, []);

  const makeDragOver = useCallback(
    (slot: 'A' | 'B') => (e: React.DragEvent) => {
      e.preventDefault();
      setOverSlot(slot);
    },
    [],
  );

  const handleDragLeave = useCallback(() => setOverSlot(null), []);

  const makeDropHandler = useCallback(
    (slot: 'A' | 'B') => (e: React.DragEvent) => {
      e.preventDefault();
      setOverSlot(null);
      const id = dragIdRef.current;
      if (!id) return;
      if (slot === 'A') setSlotAId(id);
      else setSlotBId(id);
      setAdded(false);
      dragIdRef.current = null;
    },
    [],
  );

  const handleAddToPlot = useCallback(() => {
    if (!fnA || !fnB || !preview) return;
    addFunction({
      name: buildName(operation, fnA, fnB),
      expression: preview.result,
      params: [],
      category: 'special',
      latex: preview.latex,
      dimension: '2d',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [fnA, fnB, preview, operation, addFunction]);

  // Nothing to show if no functions exist
  if (functions.length === 0) {
    return (
      <div className="px-3 py-4">
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Add at least two functions to use Snap Blocks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {/* Header */}
      <h2
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Snap Blocks
      </h2>

      {/* ── Active function blocks (draggable) ─────────────────── */}
      <div
        className="flex flex-wrap gap-1.5 rounded-lg p-2"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <AnimatePresence>
          {functions.map((fn) => (
            <FnBlock key={fn.id} fn={fn} onDragStart={handleDragStart} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Operation selector ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span
          className="mr-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Op
        </span>
        {(Object.keys(OP_LABELS) as Operation[]).map((op) => (
          <button
            key={op}
            onClick={() => {
              setOperation(op);
              setAdded(false);
            }}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-all"
            style={{
              background:
                operation === op ? 'var(--accent)' : 'var(--bg-tertiary)',
              color:
                operation === op ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${operation === op ? 'var(--accent)' : 'var(--border)'}`,
            }}
            title={OP_LABELS[op].label}
          >
            {OP_LABELS[op].symbol}
          </button>
        ))}
        <span
          className="ml-2 text-[10px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {OP_LABELS[operation].label}
        </span>
      </div>

      {/* ── Drop slots ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <DropSlot
          label={operation === 'compose' ? 'f(·)' : 'A'}
          fn={fnA}
          isOver={overSlot === 'A'}
          onDrop={makeDropHandler('A')}
          onClear={() => {
            setSlotAId(null);
            setAdded(false);
          }}
          onDragOver={makeDragOver('A')}
          onDragLeave={handleDragLeave}
        />
        <DropSlot
          label={operation === 'compose' ? 'g(x)' : 'B'}
          fn={fnB}
          isOver={overSlot === 'B'}
          onDrop={makeDropHandler('B')}
          onClear={() => {
            setSlotBId(null);
            setAdded(false);
          }}
          onDragOver={makeDragOver('B')}
          onDragLeave={handleDragLeave}
        />
      </div>

      {/* ── Result preview + Add button ────────────────────────── */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden rounded-lg p-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Result
            </span>

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

            <motion.button
              onClick={handleAddToPlot}
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
