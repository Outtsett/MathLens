import { useMemo, type ReactNode } from 'react';
import { Mafs, Coordinates } from 'mafs';
import { useViewStore } from '../store/viewStore';
import 'mafs/core.css';

/* ------------------------------------------------------------------ */
/*  Canvas2DWrapper                                                    */
/*  Wraps <Mafs> and syncs the viewBox with the zustand viewStore      */
/* ------------------------------------------------------------------ */

interface Canvas2DWrapperProps {
  children?: ReactNode;
}

export default function Canvas2DWrapper({ children }: Canvas2DWrapperProps) {
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);
  const gridType = useViewStore((s) => s.gridType);

  // Compute the view box for Mafs
  const viewBox = useMemo(
    () => ({
      x: [xMin, xMax] as [number, number],
      y: [yMin, yMax] as [number, number],
    }),
    [xMin, xMax, yMin, yMax],
  );

  return (
    <div className="relative h-full w-full" style={{ background: '#0a0a0f' }}>
      <Mafs
        viewBox={viewBox}
        preserveAspectRatio={false}
        pan
        zoom
      >
        {/* Cartesian grid lines (only shown for cartesian mode) */}
        {gridType === 'cartesian' && (
          <Coordinates.Cartesian
            xAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : '') }}
            yAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : '') }}
          />
        )}

        {/* For polar mode, we still show light axes for reference */}
        {gridType === 'polar' && (
          <Coordinates.Cartesian
            xAxis={{ lines: false }}
            yAxis={{ lines: false }}
          />
        )}

        {/* Canvas content (function plots, polar grid, etc.) */}
        {children}
      </Mafs>
    </div>
  );
}
