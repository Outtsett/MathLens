// A math function that can be plotted
export interface MathFunction {
  id: string;
  /** Display name like "Sine Wave" */
  name: string;
  /** The expression string like "a * sin(b * x + c) + d" */
  expression: string;
  /** Parameters with their current values, min, max, step */
  params: FunctionParam[];
  /** Auto-assigned color (hex) */
  color: string;
  /** Is it visible on the canvas */
  visible: boolean;
  /** Category for the browser */
  category: FunctionCategory;
  /** LaTeX representation */
  latex: string;
  /** Is this a 2D (y=f(x)) or 3D (z=f(x,y)) function */
  dimension: '2d' | '3d';
}

export interface FunctionParam {
  name: string;
  /** Human-readable: "Amplitude", "Frequency" */
  label: string;
  /** Current value */
  value: number;
  min: number;
  max: number;
  step: number;
  /** Tooltip explaining what this param does */
  description?: string;
}

export type FunctionCategory =
  | 'trigonometric'
  | 'polynomial'
  | 'exponential'
  | 'special'
  | 'statistical'
  | 'piecewise';

/** A point to plot */
export interface PlotPoint {
  x: number;
  y: number;
  /** Break the line here (asymptote) */
  discontinuity?: boolean;
}

/** Evaluation result */
export interface EvalResult {
  points: PlotPoint[];
  domain: [number, number];
  hasAsymptotes: boolean;
}

/** Color palette for auto-assigning */
export const FUNCTION_COLORS = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#ef4444', // red
  '#3b82f6', // blue
] as const;
