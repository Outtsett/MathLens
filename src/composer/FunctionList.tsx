import { useFunctionStore } from '../store/functionStore';
import { InlineMath } from 'react-katex';
import { motion, AnimatePresence } from 'framer-motion';

export default function FunctionList() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedId = useFunctionStore((s) => s.selectedId);
  const selectFunction = useFunctionStore((s) => s.selectFunction);
  const toggleVisible = useFunctionStore((s) => s.toggleVisible);
  const removeFunction = useFunctionStore((s) => s.removeFunction);

  return (
    <div className="flex flex-col px-3 py-3">
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Active ({functions.length})
      </h2>

      {functions.length === 0 && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Click a function above to get started
        </p>
      )}

      <AnimatePresence>
        {functions.map((fn) => (
          <motion.div
            key={fn.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => selectFunction(fn.id)}
            className="mb-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors"
            style={{
              background: selectedId === fn.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${selectedId === fn.id ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            {/* Color dot */}
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: fn.color, opacity: fn.visible ? 1 : 0.3 }}
            />

            {/* Name + LaTeX */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className="truncate text-xs font-medium"
                style={{ color: 'var(--text-primary)', opacity: fn.visible ? 1 : 0.5 }}
              >
                {fn.name}
              </span>
              <span className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <InlineMath math={fn.latex} />
              </span>
            </div>

            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVisible(fn.id);
              }}
              className="shrink-0 rounded p-1 text-xs transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
              title={fn.visible ? 'Hide' : 'Show'}
            >
              {fn.visible ? '👁' : '👁‍🗨'}
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFunction(fn.id);
              }}
              className="shrink-0 rounded p-1 text-xs transition-colors hover:bg-red-500/20 hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
              title="Remove"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
