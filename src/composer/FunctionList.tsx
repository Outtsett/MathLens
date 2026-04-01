import { useFunctionStore } from '../store/functionStore';
import { InlineMath } from 'react-katex';
import { motion, AnimatePresence } from 'framer-motion';

// ── SVG icons ────────────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 8s3-5.5 7-5.5S15 8 15 8s-3 5.5-7 5.5S1 8 1 8z" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s3-5.5 7-5.5S15 8 15 8s-3 5.5-7 5.5S1 8 1 8z" opacity="0.3" />
      <circle cx="8" cy="8" r="2" opacity="0.3" />
      <path d="M2 14L14 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  );
}

// ── Main FunctionList ────────────────────────────────────────────────────────

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

      {/* Empty state */}
      {functions.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
            <circle cx="16" cy="16" r="12" />
            <path d="M12 16h8M16 12v8" />
          </svg>
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            Click a function above to get started
          </p>
        </div>
      )}

      {/* Function rows */}
      <AnimatePresence>
        {functions.map((fn) => {
          const isSelected = selectedId === fn.id;
          return (
            <motion.div
              key={fn.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => selectFunction(fn.id)}
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors duration-150"
              style={{
                background: isSelected
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'transparent',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              {/* Color dot */}
              <span
                className="h-3 w-3 shrink-0 rounded-full transition-opacity"
                style={{
                  background: fn.color,
                  opacity: fn.visible ? 1 : 0.25,
                }}
              />

              {/* Name + LaTeX */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className="truncate text-xs font-medium transition-opacity"
                  style={{
                    color: 'var(--text-primary)',
                    opacity: fn.visible ? 1 : 0.45,
                  }}
                >
                  {fn.name}
                </span>
                <span
                  className="katex-card truncate text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <InlineMath math={fn.latex} />
                </span>
              </div>

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(fn.id);
                }}
                className="shrink-0 rounded p-1 transition-colors duration-150 hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
                title={fn.visible ? 'Hide function' : 'Show function'}
              >
                <EyeIcon visible={fn.visible} />
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFunction(fn.id);
                }}
                className="shrink-0 rounded p-1 transition-colors duration-150 hover:bg-red-500/20 hover:text-red-400"
                style={{ color: 'var(--text-muted)' }}
                title="Remove function"
              >
                <CloseIcon />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
