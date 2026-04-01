import { compile } from 'mathjs';
import type { PlotPoint, EvalResult, FunctionParam } from '../types/function';

/** Default number of sample points for 2D plots */
const DEFAULT_RESOLUTION_2D = 500;

/** Default grid size per axis for 3D plots */
const DEFAULT_RESOLUTION_3D = 100;

/** Y-values beyond this magnitude are clamped */
const Y_CLAMP = 1_000;

/**
 * When the absolute jump between two consecutive points exceeds this
 * fraction of the visible Y-range, AND the sign changes, we mark
 * a discontinuity (e.g. tan(x) crossing an asymptote).
 */
const DISCONTINUITY_JUMP_THRESHOLD = 200;

/**
 * Evaluate y = f(x) over [xMin, xMax] at the given resolution.
 * Substitutes current param values into the compiled expression.
 *
 * Handles:
 * - Division by zero  → marks discontinuity
 * - NaN / ±Infinity   → marks discontinuity
 * - Large jumps with sign change → marks discontinuity
 */
export function evaluateFunction(
  expression: string,
  params: FunctionParam[],
  xMin: number,
  xMax: number,
  resolution: number = DEFAULT_RESOLUTION_2D,
): EvalResult {
  const compiled = compile(expression);

  // Build a scope from current param values
  const scope: Record<string, number> = {};
  for (const p of params) {
    scope[p.name] = p.value;
  }

  const step = (xMax - xMin) / (resolution - 1);
  const points: PlotPoint[] = [];
  let hasAsymptotes = false;
  let prevY: number | null = null;
  let prevValid = false;

  for (let i = 0; i < resolution; i++) {
    const x = xMin + i * step;
    scope['x'] = x;

    let y: number;
    try {
      y = compiled.evaluate(scope) as number;
    } catch {
      // Expression blew up (e.g. sqrt of negative)
      points.push({ x, y: 0, discontinuity: true });
      hasAsymptotes = true;
      prevY = null;
      prevValid = false;
      continue;
    }

    // Detect non-finite results
    if (!Number.isFinite(y)) {
      points.push({ x, y: 0, discontinuity: true });
      hasAsymptotes = true;
      prevY = null;
      prevValid = false;
      continue;
    }

    // Detect discontinuity via large jump + sign change
    const isDiscontinuity =
      prevValid &&
      prevY !== null &&
      Math.abs(y - prevY) > DISCONTINUITY_JUMP_THRESHOLD &&
      Math.sign(y) !== Math.sign(prevY);

    if (isDiscontinuity) {
      // Mark the *previous* point as a break so the line renderer
      // lifts the pen before drawing to this point.
      if (points.length > 0) {
        points[points.length - 1] = {
          ...points[points.length - 1],
          discontinuity: true,
        };
      }
      hasAsymptotes = true;
    }

    // Clamp to avoid rendering issues
    const clamped = Math.max(-Y_CLAMP, Math.min(Y_CLAMP, y));
    points.push({ x, y: clamped });

    prevY = y;
    prevValid = true;
  }

  return {
    points,
    domain: [xMin, xMax],
    hasAsymptotes,
  };
}

/**
 * Evaluate z = f(x, y) over a 2D grid for 3D surface plots.
 *
 * Returns flat x[] and y[] arrays (one entry per grid line) and
 * a z[][] matrix where z[iy][ix] is the height at (x[ix], y[iy]).
 */
export function evaluateFunction3D(
  expression: string,
  params: FunctionParam[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  resolution: number = DEFAULT_RESOLUTION_3D,
): { x: number[]; y: number[]; z: number[][] } {
  const compiled = compile(expression);

  const scope: Record<string, number> = {};
  for (const p of params) {
    scope[p.name] = p.value;
  }

  const xStep = (xMax - xMin) / (resolution - 1);
  const yStep = (yMax - yMin) / (resolution - 1);

  const xArr: number[] = [];
  const yArr: number[] = [];
  const zMatrix: number[][] = [];

  for (let ix = 0; ix < resolution; ix++) {
    xArr.push(xMin + ix * xStep);
  }
  for (let iy = 0; iy < resolution; iy++) {
    yArr.push(yMin + iy * yStep);
  }

  for (let iy = 0; iy < resolution; iy++) {
    const row: number[] = [];
    scope['y'] = yArr[iy];

    for (let ix = 0; ix < resolution; ix++) {
      scope['x'] = xArr[ix];

      let z: number;
      try {
        z = compiled.evaluate(scope) as number;
      } catch {
        z = 0;
      }

      if (!Number.isFinite(z)) {
        z = 0;
      }
      row.push(Math.max(-Y_CLAMP, Math.min(Y_CLAMP, z)));
    }

    zMatrix.push(row);
  }

  return { x: xArr, y: yArr, z: zMatrix };
}
