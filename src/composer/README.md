# composer/

Function browsing, composition, and exploration components — the primary user interaction layer.

## Files

| File | Description |
|------|-------------|
| `FunctionBrowser.tsx` | Visual grid of clickable preset function cards organized by category (trig, polynomial, exponential, special, statistical, piecewise). Click a card → `functionStore.addFunction()` → instant plot. Shows LaTeX preview via `react-katex`. |
| `FunctionList.tsx` | Active functions panel — color-coded list with visibility toggles, selection highlight, and remove buttons. |
| `FunctionBar.tsx` | Expression input bar with autocomplete dropdown. Secondary UX — most users interact via FunctionBrowser instead. |
| `ParamSliders.tsx` | Auto-generated parameter sliders for the selected function. Drag any slider → `functionStore.updateParam()` → real-time canvas update. |
| `FunctionCombiner.tsx` | Compose two active functions: `f + g`, `f ∘ g`, `f × g`. Creates new combined function in the store. |
| `SnapBlocks.tsx` | Drag-and-drop function building blocks. Visual composition without typing — drag functions into slots, pick an operation, see the result. |
| `SigmaNotation.tsx` | Σ summation notation explorer. 6 series types (Harmonic, 1/n², Basel, Geometric, Taylor sin, Taylor e^x). Animated bar chart of partial sums, convergence display, "Add as Function" button. |
| `TransformControls.tsx` | Function transform sliders — horizontal/vertical shift, horizontal/vertical scale, reflection toggles. Live LaTeX preview of the transformed expression. "Apply Transform" creates a new function. |

## UX Philosophy

**Plug-and-play first.** The primary interaction is:
1. Click a function card in `FunctionBrowser`
2. Drag sliders in `ParamSliders`
3. Watch the graph update in real time

No math typing required. `FunctionBar` exists for power users.
