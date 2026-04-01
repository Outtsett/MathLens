# ui/

Layout orchestration and overlay panels.

## Files

| File | Description |
|------|-------------|
| `Layout.tsx` | Main app layout (~260 lines). Orchestrates: top toolbar, animated sidebar (4 tabs via `viewStore.sidebarTab`), center canvas area (2D/3D/Split), right algebra panel, and overlay panels (History/Export/Guided) with `AnimatePresence` backdrop + slide-in animation. |
| `Toolbar.tsx` | Top bar with: MathLens logo, sidebar toggle, view mode switcher (2D/3D/Split), grid type cycler (XY → Polar → Sphere), and panel toggle buttons (History, Export & Share, Guided Explorations, Algebra, Settings). |
| `HistoryPanel.tsx` | Overlay panel (slides from right) showing expression history. Search bar, Recent/Favorites tabs, clickable entries to re-add functions. |
| `ExportPanel.tsx` | Overlay panel for exporting — SVG, PNG, LaTeX, shareable link. |
| `GuidedExplorations.tsx` | Step-by-step interactive math walkthroughs. Pre-built exploration sequences teaching concepts like "What does amplitude do?" through guided slider interactions. |

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Toolbar (fixed height)                         │
├──────────┬────────────────────────┬─────────────┤
│ Sidebar  │                        │  Algebra    │
│ (320px)  │     Canvas Area        │  Panel      │
│ 4 tabs:  │   (2D / 3D / Split)   │  (optional) │
│ Browse   │                        │             │
│ Compose  │                        │             │
│ Σ        │                        │             │
│ Transform│                        │             │
│          ├────────────────────────┤             │
│          │  ParamSliders (bottom) │             │
├──────────┴────────────────────────┴─────────────┤
│              Overlay Panels (z-40/z-50)          │
│         History | Export | Guided                │
└─────────────────────────────────────────────────┘
```

## Overlay Panel System

- Controlled by `viewStore.activePanel` (null | 'history' | 'export' | 'guided')
- Backdrop: `fixed inset-0 z-40` with 45% black opacity, click-to-dismiss
- Panel: `fixed right-0 top-0 z-50 w-[360px]`, spring animation in/out
- Toggle behavior: clicking same toolbar button closes the panel
