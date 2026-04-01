# MathLens 🔍📐

**Interactive math visualization for visual learners.** Browse functions, click to plot, drag sliders — no math typing required.

Built for people who learn by *seeing* how functions behave, not by writing equations.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

## ✨ Features

- **📚 22 Preset Functions** — Trig, polynomial, exponential, special, statistical, piecewise. Click a card to plot instantly.
- **🎚️ Real-Time Sliders** — Drag parameter sliders (amplitude, frequency, phase...) and watch the graph update live.
- **🧩 Function Composition** — Combine functions with drag-and-drop blocks: f+g, f∘g, f×g operations.
- **Σ Sigma Explorer** — Visualize 6 series types with animated bar charts, partial sums, and convergence.
- **🔄 Transform Controls** — Apply shift, scale, and reflection transforms with instant LaTeX preview.
- **📊 2D / 3D / Split View** — Mafs for 2D SVG plots, Three.js for 3D WebGL, or side-by-side.
- **🌙 Dark Theme** — Purpose-built dark UI with indigo accents.
- **📜 History & Export** — Track expression history, export as SVG/PNG/LaTeX.
- **🎓 Guided Explorations** — Step-by-step walkthroughs for discovering math concepts visually.

## 🚀 Quick Start

```bash
git clone https://github.com/Outtsett/MathLens.git
cd MathLens
npm install
npm run dev
```

Open http://localhost:5173

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite 8 |
| 2D Plotting | [Mafs](https://mafs.dev) (SVG-based) |
| 3D Plotting | Three.js via @react-three/fiber |
| Math Engine | [math.js](https://mathjs.org) + [nerdamer](https://nerdamer.com) (symbolic) |
| LaTeX | KaTeX via react-katex |
| State | Zustand |
| Styling | Tailwind CSS v4 + framer-motion |
| UI | Radix UI primitives |

## 📁 Project Structure

```
src/
├── canvas/       # 2D (Mafs) and 3D (Three.js) rendering
├── composer/     # Function browser, combiner, sigma, transforms
├── engine/       # Math evaluation, parsing, presets, symbolic ops
├── store/        # Zustand stores (functions, view, anim, history)
├── ui/           # Layout, toolbar, overlay panels
├── panels/       # Algebra, animation controls, properties
├── animations/   # Fourier, morphing, tracing utilities
└── types/        # TypeScript types and declaration stubs
```

## 📜 License

MIT
