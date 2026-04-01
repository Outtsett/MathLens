# MathLens

Interactive math visualization app for visual learners. Browse preset functions, click to plot, drag sliders to see real-time changes. No typing math — everything is point-and-click.

**Repo**: https://github.com/Outtsett/MathLens
**Location**: `E:\source\repos\MathLens`

## Build & Run

```powershell
npm run dev        # Dev server at http://localhost:5173/
npm run build      # tsc -b && vite build (production)
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Tech Stack

| Layer        | Technology                                       |
|-------------|--------------------------------------------------|
| Framework   | React 19 + TypeScript 5.9 + Vite 8               |
| CSS         | Tailwind CSS v4 (`@tailwindcss/vite` plugin)      |
| 2D Canvas   | Mafs 0.21 (SVG-based math plots)                  |
| 3D Canvas   | Three.js 0.183 via @react-three/fiber 9 + drei 10 |
| Math Engine | mathjs 15 (parsing/eval) + nerdamer (symbolic)    |
| LaTeX       | KaTeX 0.16 via react-katex                        |
| State       | Zustand 5 (4 stores)                              |
| Animation   | framer-motion 12                                  |
| UI          | Radix UI (slider, dialog, tabs, tooltip, popover) |

## Project Structure

```
src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── index.css                  # CSS vars, Tailwind v4 import, Mafs dark overrides
│
├── canvas/                    # Rendering
│   ├── Canvas2D.tsx           # Mafs 2D canvas with ResizeObserver full-height
│   ├── Canvas2DWrapper.tsx    # Wrapper for 2D canvas context
│   ├── Canvas3D.tsx           # Three.js 3D canvas
│   ├── controls/
│   │   └── ViewControls.tsx   # Pan/zoom controls
│   ├── grids/
│   │   └── PolarGrid.tsx      # Polar coordinate grid overlay
│   └── layers/                # (empty — future layer system)
│
├── composer/                  # Function browsing & composition
│   ├── FunctionBrowser.tsx    # Category-grouped preset function cards
│   ├── FunctionList.tsx       # Active function list with visibility toggles
│   ├── FunctionBar.tsx        # Expression input bar with autocomplete
│   ├── ParamSliders.tsx       # Real-time parameter adjustment sliders
│   ├── FunctionCombiner.tsx   # Compose functions: f+g, f∘g, f*g operations
│   ├── SnapBlocks.tsx         # Drag-and-drop function building blocks
│   ├── SigmaNotation.tsx      # Σ summation explorer — 6 series, bar chart, convergence
│   └── TransformControls.tsx  # Shift/scale/reflect transforms with LaTeX preview
│
├── engine/                    # Math processing
│   ├── evaluator.ts           # math.js compile & evaluate (points, asymptotes)
│   ├── parser.ts              # Expression parsing & validation
│   ├── presets.ts             # 22 preset functions across 6 categories
│   └── symbolic.ts            # nerdamer symbolic ops (simplify, derive, integrate)
│
├── store/                     # Zustand state management
│   ├── functionStore.ts       # Active functions, params, selection, colors
│   ├── viewStore.ts           # View mode, grid, viewport, sidebar tab, panels
│   ├── animStore.ts           # Animation state (playing, speed, time)
│   └── historyStore.ts        # Expression history tracking
│
├── ui/                        # Layout & panels
│   ├── Layout.tsx             # Main layout: toolbar + sidebar (4 tabs) + canvas + overlays
│   ├── Toolbar.tsx            # Top bar: view modes, grid, panel toggles
│   ├── HistoryPanel.tsx       # Expression history overlay with search
│   ├── ExportPanel.tsx        # Export & share overlay (SVG, PNG, LaTeX, link)
│   └── GuidedExplorations.tsx # Step-by-step math exploration walkthroughs
│
├── panels/                    # Side panels
│   ├── AlgebraPanel.tsx       # Algebra workspace
│   ├── AlgebraSteps.tsx       # Step-by-step algebra solution display
│   ├── AnimationControls.tsx  # Play/pause/speed controls
│   └── Properties.tsx         # Function properties inspector
│
├── animations/                # Animation utilities
│   ├── fourier.ts             # Fourier transform animation
│   ├── morph.ts               # Function morphing transitions
│   ├── trace.ts               # Point tracing along curves
│   └── useAnimation.ts        # Animation hook (requestAnimationFrame)
│
└── types/                     # TypeScript types
    ├── function.ts            # MathFunction, FunctionParam, EvalResult, categories
    ├── nerdamer.d.ts          # Type stubs for nerdamer (no @types)
    └── react-katex.d.ts       # Type stubs for react-katex (no @types)
```

## Architecture

### Data Flow
```
User clicks preset card → functionStore.addFunction()
  → Canvas2D subscribes to functionStore
  → evaluator.ts compiles expression with math.js
  → Points rendered via Mafs <Plot.OfX>
  → ParamSliders onChange → functionStore.updateParam() → re-evaluate → re-render
```

### Sidebar Tabs (viewStore.sidebarTab)
| Tab       | Component(s)                                    |
|-----------|-------------------------------------------------|
| Browse    | FunctionBrowser → FunctionList + ParamSliders    |
| Compose   | SnapBlocks + FunctionCombiner                    |
| Σ         | SigmaNotation (series explorer)                  |
| Transform | TransformControls (shift/scale/reflect)           |

### Overlay Panels (viewStore.activePanel)
- `history` → HistoryPanel (slide-in from right)
- `export` → ExportPanel
- `guided` → GuidedExplorations

### View Modes (viewStore.mode)
- `2d` — Mafs SVG canvas (default)
- `3d` — Three.js WebGL canvas
- `split` — Side-by-side 2D + 3D

### Function Categories (22 presets)
trigonometric | polynomial | exponential | special | statistical | piecewise

## Key Patterns

### Canvas Full-Height Rendering
Mafs uses SVG viewBox that doesn't auto-stretch. Canvas2D.tsx uses ResizeObserver to measure the container div and passes explicit `height={containerHeight}` to `<Mafs>`.

### Zustand Store Design
All stores use the `create<T>((set, get) => ...)` pattern. No middleware. viewStore.setActivePanel has toggle behavior (clicking same panel closes it).

### CSS Variables (Dark Theme)
Defined in `:root` in `index.css`. All components reference CSS vars (`--bg-primary`, `--accent`, etc.) via Tailwind's `bg-[var(--bg-primary)]` syntax or direct CSS.

## Known Issues & Gotchas

| Issue | Details |
|-------|---------|
| Tailwind v4 HMR cache corruption | Vite's `.vite` cache can corrupt, causing ALL CSS to disappear. **Fix**: Delete `node_modules/.vite` + restart dev server |
| No aggressive global CSS | Adding broad CSS selectors to index.css (e.g., `.MafsView svg { height: 100% !important }`) can break Tailwind v4 processing |
| Mafs React 19 peer dep | mafs 0.21 lists React 16-18 as peer dep — works fine with React 19 but shows npm warning |
| Large JS bundle | Production build is ~3159 kB JS — needs code-splitting with dynamic imports |
| No @types for nerdamer | Custom `.d.ts` in `src/types/nerdamer.d.ts` |
| No @types for react-katex | Custom `.d.ts` in `src/types/react-katex.d.ts` |

## Remaining Work

- **Spherical coordinate grid** — 3D grid type in canvas/grids/
- **Parametric curve animation** — Animated parameter sweeps for visualizing curve families
- **Code-splitting** — Dynamic imports for heavy components (SigmaNotation, GuidedExplorations, Canvas3D)
