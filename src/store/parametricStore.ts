import { create } from 'zustand';

/* ── Types ──────────────────────────────────────────────────────────── */

export interface ParametricParam {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface ParametricCurve {
  id: string;
  name: string;
  xExpr: string;
  yExpr: string;
  zExpr?: string;
  params: ParametricParam[];
  tMin: number;
  tMax: number;
  color: string;
  showTrace: boolean;
  showVelocity: boolean;
}

/* ── Preset curves ──────────────────────────────────────────────────── */

export interface PresetDef {
  id: string;
  name: string;
  xExpr: string;
  yExpr: string;
  zExpr?: string;
  latex: string;
  params: ParametricParam[];
  tMin: number;
  tMax: number;
}

export const PARAMETRIC_PRESETS: PresetDef[] = [
  {
    id: 'circle',
    name: 'Circle',
    xExpr: 'r * cos(t)',
    yExpr: 'r * sin(t)',
    latex: 'x = r\\cos t,\\; y = r\\sin t',
    params: [{ name: 'r', label: 'Radius', value: 3, min: 0.5, max: 8, step: 0.1 }],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'ellipse',
    name: 'Ellipse',
    xExpr: 'a * cos(t)',
    yExpr: 'b * sin(t)',
    latex: 'x = a\\cos t,\\; y = b\\sin t',
    params: [
      { name: 'a', label: 'Semi-major', value: 4, min: 0.5, max: 8, step: 0.1 },
      { name: 'b', label: 'Semi-minor', value: 2, min: 0.5, max: 8, step: 0.1 },
    ],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'lissajous',
    name: 'Lissajous',
    xExpr: 'sin(a * t)',
    yExpr: 'sin(b * t)',
    latex: 'x = \\sin(at),\\; y = \\sin(bt)',
    params: [
      { name: 'a', label: 'Freq A', value: 3, min: 1, max: 10, step: 1 },
      { name: 'b', label: 'Freq B', value: 2, min: 1, max: 10, step: 1 },
    ],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'spiral',
    name: 'Spiral',
    xExpr: 't * cos(t)',
    yExpr: 't * sin(t)',
    latex: 'x = t\\cos t,\\; y = t\\sin t',
    params: [],
    tMin: 0,
    tMax: 6 * Math.PI,
  },
  {
    id: 'rose',
    name: 'Rose Curve',
    xExpr: 'cos(n * t) * cos(t)',
    yExpr: 'cos(n * t) * sin(t)',
    latex: 'r = \\cos(nt)',
    params: [{ name: 'n', label: 'Petals', value: 3, min: 1, max: 12, step: 1 }],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'cardioid',
    name: 'Cardioid',
    xExpr: '(1 + cos(t)) * cos(t)',
    yExpr: '(1 + cos(t)) * sin(t)',
    latex: 'r = 1 + \\cos t',
    params: [],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    xExpr: 'sin(t) * (exp(cos(t)) - 2 * cos(4*t) - sin(t/12)^5)',
    yExpr: 'cos(t) * (exp(cos(t)) - 2 * cos(4*t) - sin(t/12)^5)',
    latex: 'r = e^{\\cos t} - 2\\cos 4t - \\sin^5\\!\\tfrac{t}{12}',
    params: [],
    tMin: 0,
    tMax: 12 * Math.PI,
  },
  {
    id: 'hypotrochoid',
    name: 'Hypotrochoid',
    xExpr: '(R - r) * cos(t) + d * cos((R - r) / r * t)',
    yExpr: '(R - r) * sin(t) - d * sin((R - r) / r * t)',
    latex: 'x = (R{-}r)\\cos t + d\\cos\\!\\tfrac{(R{-}r)t}{r}',
    params: [
      { name: 'R', label: 'Outer R', value: 5, min: 1, max: 10, step: 0.5 },
      { name: 'r', label: 'Inner r', value: 3, min: 0.5, max: 9, step: 0.5 },
      { name: 'd', label: 'Offset d', value: 3, min: 0.5, max: 8, step: 0.5 },
    ],
    tMin: 0,
    tMax: 6 * Math.PI,
  },
  {
    id: 'figure8',
    name: 'Figure-8',
    xExpr: 'a * sin(t)',
    yExpr: 'a * sin(t) * cos(t)',
    latex: 'x = a\\sin t,\\; y = a\\sin t\\cos t',
    params: [{ name: 'a', label: 'Scale', value: 3, min: 0.5, max: 8, step: 0.1 }],
    tMin: 0,
    tMax: 2 * Math.PI,
  },
  {
    id: 'helix3d',
    name: 'Helix (3D)',
    xExpr: 'r * cos(t)',
    yExpr: 'r * sin(t)',
    zExpr: 'h * t',
    latex: 'x = r\\cos t,\\; y = r\\sin t,\\; z = ht',
    params: [
      { name: 'r', label: 'Radius', value: 3, min: 0.5, max: 8, step: 0.1 },
      { name: 'h', label: 'Pitch', value: 0.3, min: 0.05, max: 2, step: 0.05 },
    ],
    tMin: 0,
    tMax: 6 * Math.PI,
  },
];

const CURVE_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
] as const;

let colorIdx = 0;
function nextColor(): string {
  const c = CURVE_COLORS[colorIdx % CURVE_COLORS.length];
  colorIdx++;
  return c;
}

/* ── Store ──────────────────────────────────────────────────────────── */

interface ParametricStore {
  curves: ParametricCurve[];
  selectedCurveId: string | null;

  addCurve: (curve: ParametricCurve) => void;
  removeCurve: (id: string) => void;
  selectCurve: (id: string | null) => void;
  updateParam: (curveId: string, paramName: string, value: number) => void;
  setTRange: (curveId: string, tMin: number, tMax: number) => void;
  toggleTrace: (curveId: string) => void;
  toggleVelocity: (curveId: string) => void;
  selectPreset: (presetId: string) => void;
  updateCurveColor: (curveId: string, color: string) => void;
}

function makeCurveFromPreset(preset: PresetDef): ParametricCurve {
  return {
    id: `${preset.id}-${Date.now()}`,
    name: preset.name,
    xExpr: preset.xExpr,
    yExpr: preset.yExpr,
    zExpr: preset.zExpr,
    params: preset.params.map((p) => ({ ...p })),
    tMin: preset.tMin,
    tMax: preset.tMax,
    color: nextColor(),
    showTrace: true,
    showVelocity: false,
  };
}

export const useParametricStore = create<ParametricStore>((set) => ({
  curves: [],
  selectedCurveId: null,

  addCurve: (curve) =>
    set((s) => ({
      curves: [...s.curves, curve],
      selectedCurveId: curve.id,
    })),

  removeCurve: (id) =>
    set((s) => ({
      curves: s.curves.filter((c) => c.id !== id),
      selectedCurveId: s.selectedCurveId === id ? null : s.selectedCurveId,
    })),

  selectCurve: (id) => set({ selectedCurveId: id }),

  updateParam: (curveId, paramName, value) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === curveId
          ? {
              ...c,
              params: c.params.map((p) =>
                p.name === paramName ? { ...p, value } : p,
              ),
            }
          : c,
      ),
    })),

  setTRange: (curveId, tMin, tMax) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === curveId ? { ...c, tMin, tMax } : c,
      ),
    })),

  toggleTrace: (curveId) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === curveId ? { ...c, showTrace: !c.showTrace } : c,
      ),
    })),

  toggleVelocity: (curveId) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === curveId ? { ...c, showVelocity: !c.showVelocity } : c,
      ),
    })),

  selectPreset: (presetId) => {
    const preset = PARAMETRIC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const curve = makeCurveFromPreset(preset);
    set((s) => ({
      curves: [...s.curves, curve],
      selectedCurveId: curve.id,
    }));
  },

  updateCurveColor: (curveId, color) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id === curveId ? { ...c, color } : c,
      ),
    })),
}));
