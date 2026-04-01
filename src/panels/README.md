# panels/

Side panels for algebra workspace and function inspection.

## Files

| File | Description |
|------|-------------|
| `AlgebraPanel.tsx` | Right-side algebra workspace panel. Shows step-by-step algebra and function properties for the selected function. Has its own `AnimatePresence` slide-in animation (350px wide). Contains tabs for "Steps" and "Properties". |
| `AlgebraSteps.tsx` | Step-by-step algebra solution display using KaTeX. Shows each simplification/differentiation/integration step with LaTeX rendering. |
| `AnimationControls.tsx` | Play/pause button, speed slider, and progress bar for animations. Reads from `animStore`. |
| `Properties.tsx` | Function properties inspector — displays domain, range, zeros, extrema, and other characteristics of the selected function. |

## Panel Behavior

- `AlgebraPanel` is controlled by `viewStore.algebraPanelOpen` / `toggleAlgebraPanel()`
- It manages its own `<AnimatePresence>` independently from the overlay panel system
- Opens from the right side, adjacent to the canvas area
- Requires a function to be selected (`functionStore.selectedId`) to show content
