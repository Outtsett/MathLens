# types/

TypeScript type definitions and declaration stubs.

## Files

| File | Description |
|------|-------------|
| `function.ts` | Core data types for the app. `MathFunction` (id, name, expression, params, color, visible, category, latex, dimension), `FunctionParam` (name, label, value, min/max/step, description), `FunctionCategory` (6 categories), `PlotPoint`, `EvalResult`. Also exports `FUNCTION_COLORS` — 10-color palette for auto-assignment. |
| `nerdamer.d.ts` | Type stubs for the `nerdamer` package (no `@types/nerdamer` on npm). Declares module with core API: `nerdamer()`, `.simplify()`, `.differentiate()`, `.integrate()`, `.solveFor()`, `.toTeX()`. |
| `react-katex.d.ts` | Type stubs for `react-katex` (no `@types/react-katex`). Declares `InlineMath` and `BlockMath` components with `math: string` and optional `errorColor` props. |

## Key Types

```ts
interface MathFunction {
  id: string;
  name: string;           // "Sine Wave"
  expression: string;     // "a * sin(b * x + c) + d"
  params: FunctionParam[];
  color: string;          // Auto-assigned hex
  visible: boolean;
  category: FunctionCategory;
  latex: string;          // KaTeX-compatible
  dimension: '2d' | '3d';
}

type FunctionCategory =
  | 'trigonometric' | 'polynomial' | 'exponential'
  | 'special' | 'statistical' | 'piecewise';
```
