import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { useHistoryStore, type HistoryEntry } from '../store/historyStore';
import { useFunctionStore } from '../store/functionStore';

type Tab = 'recent' | 'favorites';

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function HistoryRow({
  entry,
  onRestore,
}: {
  entry: HistoryEntry;
  onRestore: (entry: HistoryEntry) => void;
}) {
  const toggleFavorite = useHistoryStore((s) => s.toggleFavorite);
  const removeEntry = useHistoryStore((s) => s.removeEntry);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
      style={{ border: '1px solid transparent' }}
    >
      {/* Star toggle */}
      <button
        onClick={() => toggleFavorite(entry.id)}
        className="shrink-0 transition-colors"
        style={{ color: entry.isFavorite ? '#f59e0b' : 'var(--text-muted)' }}
        title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={entry.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>

      {/* Content — clickable to restore */}
      <button
        onClick={() => onRestore(entry)}
        className="flex flex-1 flex-col items-start gap-0.5 text-left min-w-0"
      >
        <span className="truncate text-xs font-medium w-full" style={{ color: 'var(--text-primary)' }}>
          {entry.name}
        </span>
        <span className="text-[10px] truncate w-full" style={{ color: 'var(--text-muted)' }}>
          <InlineMath math={entry.latex || entry.expression} />
        </span>
      </button>

      {/* Timestamp + remove */}
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {formatTimestamp(entry.timestamp)}
        </span>
        <button
          onClick={() => removeEntry(entry.id)}
          className="rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Remove"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function HistoryPanel() {
  const entries = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const [tab, setTab] = useState<Tab>('recent');
  const [search, setSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    let list = tab === 'favorites' ? entries.filter((e) => e.isFavorite) : entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.expression.toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, tab, search]);

  const handleRestore = (entry: HistoryEntry) => {
    addFunction({
      name: entry.name,
      expression: entry.expression,
      params: [],
      category: 'special',
      latex: entry.latex,
      dimension: '2d',
    });
  };

  const handleClear = () => {
    if (showClearConfirm) {
      clearHistory();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          History
        </h2>
        <button
          onClick={handleClear}
          className="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
          style={{
            background: showClearConfirm ? '#ef4444' : 'var(--bg-tertiary)',
            color: showClearConfirm ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${showClearConfirm ? '#ef4444' : 'var(--border)'}`,
          }}
        >
          {showClearConfirm ? 'Confirm Clear' : 'Clear All'}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors focus:ring-1"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent)',
          } as React.CSSProperties}
        />
      </div>

      {/* Tabs */}
      <div className="flex px-3 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['recent', 'favorites'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-3 py-2 text-xs font-medium capitalize transition-colors"
            style={{ color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {t === 'favorites' ? '⭐ Favorites' : '🕐 Recent'}
            {tab === t && (
              <motion.div
                layoutId="history-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: 'var(--accent)' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <span className="text-2xl mb-2">{tab === 'favorites' ? '⭐' : '📭'}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {tab === 'favorites'
                  ? 'No favorites yet. Star an expression to save it here.'
                  : search
                    ? 'No matching entries.'
                    : 'No history yet. Add a function to get started.'}
              </span>
            </motion.div>
          ) : (
            filtered.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} onRestore={handleRestore} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[10px]"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <span>{entries.length} total</span>
        <span>{entries.filter((e) => e.isFavorite).length} favorited</span>
      </div>
    </div>
  );
}
