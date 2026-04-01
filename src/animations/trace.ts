/**
 * Point tracing along a curve with tangent, normal, and curvature
 * visualisation data.
 */

import { compile, derivative as mathDerivative } from 'mathjs';

export interface TraceData {
  point: { x: number; y: number };
  /** dy/dx at this point */
  slope: number;
  /** Tangent line segment centred on the point */
  tangentLine: { x1: number; y1: number; x2: number; y2: number };
  /** Normal line segment centred on the point */
  normalLine: { x1: number; y1: number; x2: number; y2: number };
  /** κ = |f″| / (1 + f′²)^(3/2) */
  curvature: number;
  /** R = 1/κ  (Infinity when curvature ≈ 0) */
  radiusOfCurvature: number;
  /** Centre of the osculating circle */
  centerOfCurvature: { x: number; y: number };
}

/**
 * Compute full trace information for a math expression at a given x.
 *
 * @param expression  A math.js-compatible expression in the variable `x`
 *                    (and optional named parameters).
 * @param params      Parameter name/value pairs that are substituted
 *                    into the expression before evaluation.
 * @param x           The x-coordinate at which to evaluate.
 * @param tangentHalfLen  Half-length of the tangent/normal segments
 *                        (visual extent, default 1.5 coordinate units).
 */
export function computeTracePoint(
  expression: string,
  params: Array<{ name: string; value: number }>,
  x: number,
  tangentHalfLen = 1.5,
): TraceData {
  // Build scope from params
  const scope: Record<string, number> = {};
  for (const p of params) {
    scope[p.name] = p.value;
  }

  // --- f(x) ---
  const compiled = compile(expression);
  const evalF = (xv: number): number => compiled.evaluate({ ...scope, x: xv });

  const y = evalF(x);

  // --- f'(x) via math.js symbolic derivative ---
  let fpExpr: string;
  try {
    fpExpr = mathDerivative(expression, 'x').toString();
  } catch {
    // Fallback: central difference for the first derivative
    fpExpr = '';
  }

  let fp: number; // first derivative
  if (fpExpr) {
    const compiledFp = compile(fpExpr);
    fp = compiledFp.evaluate({ ...scope, x }) as number;
  } else {
    const h = 1e-6;
    fp = (evalF(x + h) - evalF(x - h)) / (2 * h);
  }

  // --- f''(x) via central difference ---
  // We always use numerical differentiation for the second derivative
  // because chaining math.js derivative twice can be fragile.
  const h2 = 1e-5;
  const fpp = (evalF(x + h2) - 2 * y + evalF(x - h2)) / (h2 * h2);

  // --- Derived quantities ---
  const slope = fp;

  // Curvature: κ = |f''| / (1 + f'^2)^(3/2)
  const denom = Math.pow(1 + fp * fp, 1.5);
  const curvature = Math.abs(fpp) / denom;
  const radiusOfCurvature = curvature > 1e-12 ? 1 / curvature : Infinity;

  // Centre of osculating circle:
  //   Cx = x - f'(1 + f'^2) / f''
  //   Cy = y + (1 + f'^2) / f''
  const fpSqPlus1 = 1 + fp * fp;
  const centerOfCurvature =
    Math.abs(fpp) > 1e-12
      ? {
          x: x - (fp * fpSqPlus1) / fpp,
          y: y + fpSqPlus1 / fpp,
        }
      : { x: Infinity, y: Infinity };

  // --- Tangent line ---
  // Direction vector along tangent: (1, f')  normalised then scaled
  const tLen = Math.sqrt(1 + fp * fp);
  const tx = tangentHalfLen / tLen;
  const ty = (tangentHalfLen * fp) / tLen;

  const tangentLine = {
    x1: x - tx,
    y1: y - ty,
    x2: x + tx,
    y2: y + ty,
  };

  // --- Normal line ---
  // Perpendicular to tangent: (-f', 1)  normalised then scaled
  const nx = (-tangentHalfLen * fp) / tLen;
  const ny = tangentHalfLen / tLen;

  const normalLine = {
    x1: x - nx,
    y1: y - ny,
    x2: x + nx,
    y2: y + ny,
  };

  return {
    point: { x, y },
    slope,
    tangentLine,
    normalLine,
    curvature,
    radiusOfCurvature,
    centerOfCurvature,
  };
}
