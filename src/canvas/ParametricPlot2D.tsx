import { useMemo } from 'react';
import { Plot } from 'mafs';
import { compile, type EvalFunction } from 'mathjs';

/* ── Types ──────────────────────────────────────────────────────────── */

interface ParametricPlot2DProps {
  xExpr: string;
  yExpr: string;
  tRange: [number, number];
  params: Record<string, number>;
  color: string;
  /** Current t value for the trace dot (0–1 normalized progress) */
  traceT?: number;
  showVelocity?: boolean;
  weight?: number;
  opacity?: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function safeCompile(expr: string): EvalFunction | null {
  try {
    return compile(expr);
  } catch {
    return null;
  }
}

function safeEval(compiled: EvalFunction, scope: Record<string, number>): number {
  try {
    const v = compiled.evaluate(scope);
    return typeof v === 'number' && isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function ParametricPlot2D({
  xExpr,
  yExpr,
  tRange,
  params,
  color,
  traceT,
  showVelocity = false,
  weight = 2.5,
  opacity = 1,
}: ParametricPlot2DProps) {
  const paramKey = Object.entries(params)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');

  // Compile both expressions, recompute when expressions or params change
  const evaluators = useMemo(() => {
    const cx = safeCompile(xExpr);
    const cy = safeCompile(yExpr);
    if (!cx || !cy) return null;

    const scope: Record<string, number> = { ...params, t: 0 };

    const evalXY = (t: number): [number, number] => {
      scope.t = t;
      return [safeEval(cx, scope), safeEval(cy, scope)];
    };

    return { evalXY };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xExpr, yExpr, paramKey]);

  // Trace dot + velocity vector computation
  const traceData = useMemo(() => {
    if (traceT === undefined || !evaluators) return null;

    const tVal = tRange[0] + traceT * (tRange[1] - tRange[0]);
    const [px, py] = evaluators.evalXY(tVal);

    if (!showVelocity) return { point: [px, py] as [number, number], velocity: null };

    // Numerical derivative for tangent
    const dt = 0.001;
    const [x1, y1] = evaluators.evalXY(tVal - dt);
    const [x2, y2] = evaluators.evalXY(tVal + dt);
    const dx = (x2 - x1) / (2 * dt);
    const dy = (y2 - y1) / (2 * dt);

    // Normalise to a visible arrow length
    const mag = Math.sqrt(dx * dx + dy * dy);
    const scale = mag > 0.001 ? 1.2 / mag : 0;

    return {
      point: [px, py] as [number, number],
      velocity: {
        tip: [px + dx * scale, py + dy * scale] as [number, number],
      },
    };
  }, [traceT, evaluators, tRange, showVelocity]);

  if (!evaluators) return null;

  return (
    <>
      {/* The parametric curve */}
      <Plot.Parametric
        xy={(t) => evaluators.evalXY(t) as [number, number]}
        t={tRange}
        color={color}
        weight={weight}
        opacity={opacity}
        minSamplingDepth={8}
        maxSamplingDepth={12}
      />

      {/* Fading trail when tracing */}
      {traceT !== undefined && traceT > 0 && (
        <Plot.Parametric
          xy={(t) => evaluators.evalXY(t) as [number, number]}
          t={[tRange[0], tRange[0] + traceT * (tRange[1] - tRange[0])]}
          color={color}
          weight={weight + 1.5}
          opacity={0.6}
          minSamplingDepth={8}
          maxSamplingDepth={12}
        />
      )}

      {/* Trace dot */}
      {traceData?.point && (
        <circle
          cx={0}
          cy={0}
          r={0.15}
          fill={color}
          stroke="#fff"
          strokeWidth={0.04}
          transform={`translate(${traceData.point[0]}, ${-traceData.point[1]})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}

      {/* Velocity arrow */}
      {traceData?.velocity && traceData.point && (
        <line
          x1={traceData.point[0]}
          y1={-traceData.point[1]}
          x2={traceData.velocity.tip[0]}
          y2={-traceData.velocity.tip[1]}
          stroke="#f59e0b"
          strokeWidth={0.06}
          markerEnd="url(#arrowhead)"
        />
      )}
    </>
  );
}
