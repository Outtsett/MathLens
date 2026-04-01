import { useState, useCallback, useEffect, useRef } from 'react';
import { useViewStore } from '../../store/viewStore';
import { useFunctionStore } from '../../store/functionStore';

/* ------------------------------------------------------------------ */
/*  ViewControls — floating control panel on the canvas                */
/* ------------------------------------------------------------------ */

export default function ViewControls() {
  const mode = useViewStore((s) => s.mode);
  const gridType = useViewStore((s) => s.gridType);
  const setMode = useViewStore((s) => s.setMode);
  const setGridType = useViewStore((s) => s.setGridType);
  const resetViewport = useViewStore((s) => s.resetViewport);
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);

  const functions = useFunctionStore((s) => s.functions);

  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);

  // Track mouse position within the canvas for coordinate readout
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      // Map pixel position to math coordinates
      const x = xMin + nx * (xMax - xMin);
      const y = yMax - ny * (yMax - yMin); // invert Y

      setMouseCoord({ x, y });
    },
    [xMin, xMax, yMin, yMax],
  );

  const handleMouseLeave = useCallback(() => {
    setMouseCoord(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Zoom-to-fit: expand viewport to contain all function domains
  const handleZoomToFit = useCallback(() => {
    const visibleFns = functions.filter((f) => f.visible);
    if (visibleFns.length === 0) {
      resetViewport();
      return;
    }
    // Use sensible defaults that show all standard function behavior
    useViewStore.getState().setViewport(-12, 12, -8, 8);
  }, [functions, resetViewport]);

  return (
    <div
      ref={containerRef}
      className="absolute right-3 top-3 z-10 flex flex-col gap-2"
      style={{
        pointerEvents: 'auto',
      }}
    >
      {/* View mode toggle */}
      <ControlGroup label="View">
        <ModeButton
          active={mode === '2d'}
          onClick={() => setMode('2d')}
          icon="📐"
          title="2D View"
        />
        <ModeButton
          active={mode === '3d'}
          onClick={() => setMode('3d')}
          icon="🧊"
          title="3D View"
        />
        <ModeButton
          active={mode === 'split'}
          onClick={() => setMode('split')}
          icon="⬚"
          title="Split View"
        />
      </ControlGroup>

      {/* Grid type toggle (2D only) */}
      {mode !== '3d' && (
        <ControlGroup label="Grid">
          <ModeButton
            active={gridType === 'cartesian'}
            onClick={() => setGridType('cartesian')}
            icon="#"
            title="Cartesian Grid"
          />
          <ModeButton
            active={gridType === 'polar'}
            onClick={() => setGridType('polar')}
            icon="◎"
            title="Polar Grid"
          />
        </ControlGroup>
      )}

      {/* Action buttons */}
      <ControlGroup>
        <IconButton
          onClick={resetViewport}
          icon="🎯"
          title="Reset Zoom & Pan"
        />
        <IconButton
          onClick={handleZoomToFit}
          icon="⊞"
          title="Zoom to Fit"
        />
      </ControlGroup>

      {/* Coordinate readout */}
      {mode !== '3d' && mouseCoord && (
        <div
          className="rounded-md px-2.5 py-1.5 font-mono text-[10px]"
          style={{
            background: 'rgba(17, 17, 24, 0.85)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ color: '#ef4444' }}>x</span>
          <span style={{ color: 'var(--text-primary)' }}>
            ={mouseCoord.x.toFixed(2)}
          </span>{' '}
          <span style={{ color: '#22c55e' }}>y</span>
          <span style={{ color: 'var(--text-primary)' }}>
            ={mouseCoord.y.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface ControlGroupProps {
  label?: string;
  children: React.ReactNode;
}

function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg p-1"
      style={{
        background: 'rgba(17, 17, 24, 0.85)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {label && (
        <span
          className="px-1 text-[9px] font-medium uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      )}
      <div className="flex gap-0.5">{children}</div>
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
}

function ModeButton({ active, onClick, icon, title }: ModeButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-sm transition-all"
      style={{
        background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
      }}
    >
      {icon}
    </button>
  );
}

interface IconButtonProps {
  onClick: () => void;
  icon: string;
  title: string;
}

function IconButton({ onClick, icon, title }: IconButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-sm transition-colors hover:bg-white/10"
      style={{ color: 'var(--text-secondary)' }}
    >
      {icon}
    </button>
  );
}
