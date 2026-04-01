import { useMemo } from 'react';
import { Mafs, Coordinates, Plot } from 'mafs';
import { compile } from 'mathjs';
import { useFunctionStore } from '../store/functionStore';
import { useViewStore } from '../store/viewStore';
import type { MathFunction } from '../types/function';

/** Compile once per expression, then evaluate cheaply per x */
function makeEvaluator(fn: MathFunction) {
  try {
    const compiled = compile(fn.expression);
    const scope: Record<string, number> = {};
    fn.params.forEach((p) => {
      scope[p.name] = p.value;
    });
    return (x: number): number => {
      scope.x = x;
      try {
        const result = compiled.evaluate({ ...scope });
        return typeof result === 'number' && isFinite(result) ? result : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    return () => NaN;
  }
}

export default function Canvas2D() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedId = useFunctionStore((s) => s.selectedId);
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);

  // Build stable evaluator references — recompute when params change
  const evaluators = useMemo(() => {
    const map = new Map<string, (x: number) => number>();
    functions.forEach((fn) => {
      if (fn.visible && fn.dimension === '2d') {
        map.set(fn.id, makeEvaluator(fn));
      }
    });
    return map;
  }, [functions]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        preserveAspectRatio={false}
        pan
        zoom
      >
        <Coordinates.Cartesian
          xAxis={{ lines: 1, labels: (n) => (Number.isInteger(n) ? String(n) : '') }}
          yAxis={{ lines: 1, labels: (n) => (Number.isInteger(n) ? String(n) : '') }}
        />

        {functions
          .filter((fn) => fn.visible && fn.dimension === '2d')
          .map((fn) => {
            const evaluate = evaluators.get(fn.id);
            if (!evaluate) return null;
            return (
              <Plot.OfX
                key={fn.id}
                y={evaluate}
                color={fn.color}
                weight={fn.id === selectedId ? 3.5 : 2}
                opacity={fn.id === selectedId ? 1 : 0.8}
              />
            );
          })}
      </Mafs>
    </div>
  );
}
