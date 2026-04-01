export interface Param {
  name: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export type Category =
  | 'Trigonometric'
  | 'Polynomial'
  | 'Exponential'
  | 'Special'
  | 'Statistical';

export interface FunctionPreset {
  name: string;
  category: Category;
  expression: string;
  latex: string;
  description: string;
  params: Param[];
}

export interface MathFunction {
  id: string;
  name: string;
  category: Category;
  expression: string;
  latex: string;
  description: string;
  params: Param[];
  color: string;
  visible: boolean;
}
