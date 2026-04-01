# animations/

Animation utilities for visualizing mathematical transformations over time.

## Files

| File | Description |
|------|-------------|
| `useAnimation.ts` | Core animation hook using `requestAnimationFrame`. Reads `isPlaying`, `speed`, and `progress` from `animStore`. Advances progress 0→1 over ~5 seconds at speed=1. Uses refs to avoid restarting the RAF loop on every progress tick. Pauses automatically when progress reaches 1. |
| `fourier.ts` | Fourier series decomposition. Computes coefficients (a₀, aₙ, bₙ) via trapezoidal numerical integration over [-π, π] with 1024 sample points. Builds partial sums for animating "adding one term at a time" visualizations. |
| `morph.ts` | Function morphing — smooth interpolation between two functions. Generates intermediate curves by blending `f(x)` and `g(x)` based on animation progress `t ∈ [0,1]`. |
| `trace.ts` | Point tracing along curves. Computes position and tangent at a specific x-value for drawing animated dots that travel along function curves. |

## Animation Flow

```
animStore.play()
  → useAnimation() hook starts RAF loop
  → Each frame: delta_t × speed / 5s → progress increment
  → progress stored in animStore
  → Canvas components read progress → render animated state
  → At progress=1: auto-pause
```

## Usage

```tsx
import { useAnimation } from '../animations/useAnimation';

function MyComponent() {
  const progress = useAnimation(); // 0 to 1
  // Use progress to drive visuals
}
```
