# engine/

Math computation core — parsing, evaluation, symbolic algebra, and preset definitions.

## Files

| File | Description |
|------|-------------|
| `parser.ts` | Expression parsing and validation wrapper around `math.js`. Extracts variables, validates syntax, normalizes expressions. |
| `evaluator.ts` | Function evaluation engine. Compiles expressions once with `mathjs.compile()`, then evaluates cheaply per point. Handles division-by-zero, NaN, ±Infinity, and large jumps as discontinuities. Default 2D resolution: 500 points, 3D: 100×100 grid. Y-values clamped to ±1000. |
| `symbolic.ts` | Symbolic algebra via `nerdamer` (+ Calculus, Algebra, Solve plugins). Operations: simplify, differentiate, integrate, solve. Returns step-by-step `AlgebraStep[]` with LaTeX for each intermediate result. |
| `presets.ts` | 22 preset functions across 6 categories. Each preset includes: name, expression string, LaTeX, param definitions (with label/min/max/step/description), category, and dimension (2d/3d). |

## Evaluation Flow

```
expression string (e.g. "a * sin(b * x + c) + d")
  → mathjs.compile() → EvalFunction (compiled once)
  → evaluate({x: ..., a: 1, b: 2, ...}) per point (fast)
  → PlotPoint[] with discontinuity markers
```

## Function Categories

| Category | Examples |
|----------|---------|
| `trigonometric` | Sine, Cosine, Tangent, Secant |
| `polynomial` | Quadratic, Cubic, Power |
| `exponential` | Exponential, Logarithm, Logistic |
| `special` | Absolute Value, Floor/Ceiling, Sinc |
| `statistical` | Gaussian, Sigmoid |
| `piecewise` | Step Function, Sawtooth, Triangle Wave |

## Dependencies

- **math.js** (`mathjs` v15) — Expression parsing, compilation, evaluation
- **nerdamer** (v1.1.13 + plugins) — Symbolic simplification, calculus, equation solving
- No `@types/nerdamer` available — custom type stubs in `src/types/nerdamer.d.ts`
