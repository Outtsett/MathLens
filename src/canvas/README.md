# canvas/

Rendering layer — all 2D and 3D visualization components.

## Files

| File | Description |
|------|-------------|
| `Canvas2D.tsx` | Mafs-based 2D plotting canvas. Uses `ResizeObserver` to measure container height and passes it to `<Mafs height={...}>`. Renders `Plot.OfX` for each visible 2D function. Includes coordinate hover overlay. |
| `Canvas2DWrapper.tsx` | Thin wrapper providing context for the 2D canvas. |
| `Canvas3D.tsx` | Three.js 3D canvas via `@react-three/fiber`. Builds `BufferGeometry` surface meshes from `z = f(x, y)`. Height-mapped coloring (blue → cyan → green → yellow → red). Orbit controls, wireframe toggle, camera reset. Conditionally renders `SphericalGrid` when grid type is `'spherical'`. |
| `ParametricPlot2D.tsx` | Renders parametric curves `(x(t), y(t))` inside the Mafs canvas using `Plot.Parametric`. Supports trace dot and velocity vector. |
| `ParametricPlot3D.tsx` | Three.js 3D parametric curve renderer — tube/line geometry with animated tracing. |

## Subdirectories

### `controls/`
| File | Description |
|------|-------------|
| `ViewControls.tsx` | Pan/zoom controls for the canvas. |

### `grids/`
| File | Description |
|------|-------------|
| `PolarGrid.tsx` | Polar coordinate grid overlay for 2D. |
| `SphericalGrid.tsx` | Spherical coordinate grid for 3D — renders latitude/longitude lines every 30°. Equator and prime meridians drawn in accent color. Accepts `radius`, `opacity`, and optional `surfaceFunction` for ρ=f(θ,φ). |

### `layers/`
Reserved for future layer system (function layers, point overlays, vector fields).

## Key Patterns

- **Canvas2D height**: Mafs won't auto-fill flex containers. `Canvas2D.tsx` uses a `ResizeObserver` on the parent div and passes explicit pixel `height` to `<Mafs>`.
- **Canvas3D surfaces**: Evaluates `z = f(x,y)` on a grid, builds `Float32Array` position/color buffers, creates `BufferGeometry` with triangle indices. Uses Y-up convention (math-Z → Three.js Y).
- **SphericalGrid**: Uses `THREE.Line` via `<primitive object={...}>` to avoid react-three-fiber SVG type conflicts.
