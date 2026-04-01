import { create } from 'zustand';
import type { MathFunction, FunctionPreset } from '../types';

const COLORS = [
  '#6366f1', // indigo
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#fb923c', // orange
  '#2dd4bf', // teal
  '#e879f9', // fuchsia
  '#facc15', // yellow
];

let nextColorIndex = 0;

function getNextColor(): string {
  const color = COLORS[nextColorIndex % COLORS.length];
  nextColorIndex++;
  return color;
}

function generateId(): string {
  return `fn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface MathStore {
  functions: MathFunction[];
  selectedId: string | null;

  addFunction: (preset: FunctionPreset) => void;
  removeFunction: (id: string) => void;
  selectFunction: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  updateParam: (fnId: string, paramName: string, value: number) => void;
  updateExpression: (fnId: string, expression: string, latex: string) => void;
  addCustomFunction: (
    name: string,
    expression: string,
    latex: string,
  ) => void;
}

export const useMathStore = create<MathStore>((set) => ({
  functions: [],
  selectedId: null,

  addFunction: (preset) => {
    const newFn: MathFunction = {
      id: generateId(),
      name: preset.name,
      category: preset.category,
      expression: preset.expression,
      latex: preset.latex,
      description: preset.description,
      params: preset.params.map((p) => ({ ...p })),
      color: getNextColor(),
      visible: true,
    };
    set((state) => ({
      functions: [...state.functions, newFn],
      selectedId: newFn.id,
    }));
  },

  removeFunction: (id) =>
    set((state) => ({
      functions: state.functions.filter((f) => f.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectFunction: (id) => set({ selectedId: id }),

  toggleVisibility: (id) =>
    set((state) => ({
      functions: state.functions.map((f) =>
        f.id === id ? { ...f, visible: !f.visible } : f,
      ),
    })),

  updateParam: (fnId, paramName, value) =>
    set((state) => ({
      functions: state.functions.map((f) =>
        f.id === fnId
          ? {
              ...f,
              params: f.params.map((p) =>
                p.name === paramName ? { ...p, value } : p,
              ),
            }
          : f,
      ),
    })),

  updateExpression: (fnId, expression, latex) =>
    set((state) => ({
      functions: state.functions.map((f) =>
        f.id === fnId ? { ...f, expression, latex } : f,
      ),
    })),

  addCustomFunction: (name, expression, latex) => {
    const newFn: MathFunction = {
      id: generateId(),
      name: name || 'Custom',
      category: 'Special',
      expression,
      latex,
      description: 'Custom function',
      params: [],
      color: getNextColor(),
      visible: true,
    };
    set((state) => ({
      functions: [...state.functions, newFn],
      selectedId: newFn.id,
    }));
  },
}));
