# store/

Zustand state management — all global application state lives here.

## Stores

| File | Description |
|------|-------------|
| `functionStore.ts` | Active functions on the canvas. Tracks `MathFunction[]` with auto-assigned colors, param values, visibility. Actions: `addFunction`, `removeFunction`, `updateParam`, `toggleVisible`, `selectFunction`, `clearAll`, `updateExpression`. |
| `viewStore.ts` | View settings. Mode (`2d`/`3d`/`split`), gridType (`cartesian`/`polar`/`spherical`), viewport bounds (xMin/xMax/yMin/yMax), camera position, sidebar state, active sidebar tab (`browse`/`compose`/`sigma`/`transform`), and active overlay panel (`null`/`history`/`export`/`guided`). |
| `animStore.ts` | Animation state. `isPlaying`, `progress` (0→1), `speed` multiplier, `animationType` (`none`/`fourier`/`morph`/`trace`/`parametric`), and type-specific state (fourierTerms, morphSourceId/targetId, traceTargetId). |
| `historyStore.ts` | Expression history with localStorage persistence. Tracks entries with name, expression, LaTeX, timestamp, favorites. Actions: `addEntry`, `toggleFavorite`, `removeEntry`, `clearHistory`. |
| `parametricStore.ts` | Parametric curve state. Manages `ParametricCurve` objects with x(t)/y(t)/z(t) expressions, parameter values, t-range, trace/velocity toggles. |

## Patterns

- All stores use `create<T>((set, get) => ...)` — no middleware
- `viewStore.setActivePanel` has **toggle behavior**: clicking the same panel closes it
- `functionStore` auto-assigns colors from a 10-color palette, cycling via `nextColorIndex`
- `historyStore` persists to `localStorage` under key `mathlens-history`

## Subscribing

Components subscribe to individual slices for minimal re-renders:
```tsx
const functions = useFunctionStore((s) => s.functions);
const mode = useViewStore((s) => s.mode);
```
