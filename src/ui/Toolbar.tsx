import { motion } from 'framer-motion';
import { useViewStore } from '../store/viewStore';

type ViewMode = '2d' | '3d' | 'split';

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: '2d', label: '2D' },
  { key: '3d', label: '3D' },
  { key: 'split', label: 'Split' },
];

export default function Toolbar() {
  const mode = useViewStore((s) => s.mode);
  const setMode = useViewStore((s) => s.setMode);
  const gridType = useViewStore((s) => s.gridType);
  const setGridType = useViewStore((s) => s.setGridType);
  const algebraPanelOpen = useViewStore((s) => s.algebraPanelOpen);
  const toggleAlgebraPanel = useViewStore((s) => s.toggleAlgebraPanel);
  const toggleSidebar = useViewStore((s) => s.toggleSidebar);
  const sidebarOpen = useViewStore((s) => s.sidebarOpen);

  return (
    <div
      className="flex h-12 shrink-0 items-center px-3 gap-3"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Logo + sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded p-1.5 transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <span className="text-sm font-bold tracking-tight select-none" style={{ color: 'var(--accent)' }}>
          Math<span style={{ color: 'var(--text-primary)' }}>Lens</span>
        </span>
      </div>

      {/* Center: View mode buttons */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex rounded-lg p-0.5" style={{ background: 'var(--bg-tertiary)' }}>
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="relative rounded-md px-4 py-1 text-xs font-medium transition-colors duration-200"
              style={{
                color: mode === key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {mode === key && (
                <motion.div
                  layoutId="toolbar-view-mode"
                  className="absolute inset-0 rounded-md"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Grid toggle, Algebra panel, Settings */}
      <div className="flex items-center gap-1">
        {/* Grid type toggle */}
        <button
          onClick={() => setGridType(gridType === 'cartesian' ? 'polar' : 'cartesian')}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title={`Switch to ${gridType === 'cartesian' ? 'polar' : 'cartesian'} grid`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            {gridType === 'cartesian' ? (
              // Cartesian grid icon
              <>
                <path d="M7 1v12M1 7h12" />
                <path d="M1 1v12h12" opacity="0.3" />
              </>
            ) : (
              // Polar grid icon
              <>
                <circle cx="7" cy="7" r="3" />
                <circle cx="7" cy="7" r="6" />
                <path d="M7 1v12M1 7h12" />
              </>
            )}
          </svg>
          <span className="hidden sm:inline">
            {gridType === 'cartesian' ? 'XY' : 'Polar'}
          </span>
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: 'var(--border)' }} />

        {/* Algebra panel toggle */}
        <button
          onClick={toggleAlgebraPanel}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200"
          style={{
            background: algebraPanelOpen ? 'var(--accent)' : 'transparent',
            color: algebraPanelOpen ? '#fff' : 'var(--text-secondary)',
          }}
          title={algebraPanelOpen ? 'Hide algebra panel' : 'Show algebra panel'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
          </svg>
          <span className="hidden sm:inline">Algebra</span>
        </button>

        {/* Settings gear */}
        <button
          className="rounded-md p-1.5 transition-colors duration-200 hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
