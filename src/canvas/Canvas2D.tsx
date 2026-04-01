import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Mafs, Coordinates, Plot } from 'mafs';
import { compile } from 'mathjs';
import { useFunctionStore } from '../store/functionStore';
import { useViewStore } from '../store/viewStore';
import type { MathFunction } from '../types/function';

/**
 * Compile once per expression, then evaluate cheaply per x.
 * Param values are snapshotted into the scope so Mafs can
 * call the returned function thousands of times per frame.
 */
function makeEvaluator(fn: MathFunction) {
  try {
    const compiled = compile(fn.expression);
    const baseScope: Record<string, number> = {};
    fn.params.forEach((p) => {
      baseScope[p.name] = p.value;
    });
    return (x: number): number => {
      baseScope.x = x;
      try {
        const result = compiled.evaluate(baseScope);
        return typeof result === 'number' && isFinite(result) ? result : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    return () => NaN;
  }
}

// ── Coordinate hover overlay ─────────────────────────────────────────────────

function CoordinateOverlay({
  containerRef,
  xMin,
  xMax,
  yMin,
  yMax,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      setCoords({
        x: parseFloat((xMin + px * (xMax - xMin)).toFixed(2)),
        y: parseFloat((yMax - py * (yMax - yMin)).toFixed(2)),
      });
    },
    [xMin, xMax, yMin, yMax, containerRef],
  );

  const handleMouseLeave = useCallback(() => setCoords(null), []);

  return (
    <>
      {/* Invisible overlay to capture mouse events */}
      <div
        className="absolute inset-0 z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ pointerEvents: 'auto' }}
      />
      {/* Coordinate display badge */}
      {coords && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-md px-2.5 py-1 font-mono text-[11px] tabular-nums backdrop-blur-sm"
          style={{
            background: 'rgba(17, 17, 24, 0.85)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>x: </span>
          <span style={{ color: 'var(--text-primary)' }}>{coords.x}</span>
          <span className="mx-1.5" style={{ color: 'var(--border)' }}>│</span>
          <span style={{ color: 'var(--text-muted)' }}>y: </span>
          <span style={{ color: 'var(--text-primary)' }}>{coords.y}</span>
        </div>
      )}
    </>
  );
}

// ── Main Canvas2D ────────────────────────────────────────────────────────────

export default function Canvas2D() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedId = useFunctionStore((s) => s.selectedId);
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setContainerHeight(h);
      }
    });
    ro.observe(el);
    if (el.clientHeight > 0) setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // Build evaluators — recomputed when any function/param changes
  const evaluators = useMemo(() => {
    const map = new Map<string, (x: number) => number>();
    functions.forEach((fn) => {
      if (fn.visible && fn.dimension === '2d') {
        map.set(fn.id, makeEvaluator(fn));
      }
    });
    return map;
  }, [functions]);

  const visibleFns = functions.filter(
    (fn) => fn.visible && fn.dimension === '2d',
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* Coordinate display on hover */}
      <CoordinateOverlay
        containerRef={containerRef}
        xMin={xMin}
        xMax={xMax}
        yMin={yMin}
        yMax={yMax}
      />

      {/* Mafs canvas — fills container */}
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        preserveAspectRatio={false}
        height={containerHeight}
        pan
        zoom
      >
        <Coordinates.Cartesian
          xAxis={{
            lines: 1,
            labels: (n) => (Number.isInteger(n) ? String(n) : ''),
          }}
          yAxis={{
            lines: 1,
            labels: (n) => (Number.isInteger(n) ? String(n) : ''),
          }}
        />

        {visibleFns.map((fn) => {
          const evaluate = evaluators.get(fn.id);
          if (!evaluate) return null;
          const isSelected = fn.id === selectedId;
          return (
            <Plot.OfX
              key={fn.id}
              y={evaluate}
              color={fn.color}
              weight={isSelected ? 3.5 : 2}
              opacity={isSelected ? 1 : 0.75}
            />
          );
        })}
      </Mafs>

      {/* Empty state overlay */}
      {visibleFns.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div
            className="rounded-lg px-6 py-4 text-center backdrop-blur-sm"
            style={{
              background: 'rgba(17, 17, 24, 0.6)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Add a function to start visualizing
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Browse the sidebar or type a custom expression
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
