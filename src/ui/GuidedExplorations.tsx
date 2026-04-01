import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import { useFunctionStore } from '../store/functionStore';
import type { FunctionCategory } from '../types/function';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExplorationFunction {
  name: string;
  expression: string;
  latex: string;
  category: FunctionCategory;
  dimension: '2d' | '3d';
  params: {
    name: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    description?: string;
  }[];
}

interface ExplorationStep {
  title: string;
  text: string;
  functions: ExplorationFunction[];
}

interface Exploration {
  id: string;
  title: string;
  description: string;
  emoji: string;
  steps: ExplorationStep[];
}

// ─── Exploration Data ───────────────────────────────────────────────────────

const EXPLORATIONS: Exploration[] = [
  {
    id: 'what-is-sine',
    title: 'What is Sine?',
    emoji: '🌊',
    description: 'Explore the sine function — amplitude, frequency, and phase shift.',
    steps: [
      {
        title: 'The Basic Sine Wave',
        text: 'This is sin(x) — a smooth, repeating wave that oscillates between -1 and 1. It completes one full cycle every 2π ≈ 6.28 units.',
        functions: [
          {
            name: 'sin(x)',
            expression: 'sin(x)',
            latex: 'y = \\sin(x)',
            category: 'trigonometric',
            dimension: '2d',
            params: [],
          },
        ],
      },
      {
        title: 'Amplitude — How Tall?',
        text: 'Multiplying by a constant "a" stretches the wave vertically. Try adjusting the amplitude slider to see how a·sin(x) changes height.',
        functions: [
          {
            name: 'a·sin(x)',
            expression: 'a * sin(x)',
            latex: 'y = a \\cdot \\sin(x)',
            category: 'trigonometric',
            dimension: '2d',
            params: [
              { name: 'a', label: 'Amplitude', value: 2, min: 0.1, max: 5, step: 0.1 },
            ],
          },
        ],
      },
      {
        title: 'Frequency — How Fast?',
        text: 'The parameter "b" inside sin(bx) controls how many oscillations fit in the same space. Higher b = more waves.',
        functions: [
          {
            name: 'sin(bx)',
            expression: 'sin(b * x)',
            latex: 'y = \\sin(b \\cdot x)',
            category: 'trigonometric',
            dimension: '2d',
            params: [
              { name: 'b', label: 'Frequency', value: 2, min: 0.1, max: 8, step: 0.1 },
            ],
          },
        ],
      },
      {
        title: 'Phase Shift — Sliding Left/Right',
        text: 'Adding a constant "c" inside sin(x + c) shifts the wave horizontally. This is called phase shift. At c = π/2, sin becomes cos!',
        functions: [
          {
            name: 'sin(x + c)',
            expression: 'sin(x + c)',
            latex: 'y = \\sin(x + c)',
            category: 'trigonometric',
            dimension: '2d',
            params: [
              { name: 'c', label: 'Phase Shift', value: 1.57, min: -3.14, max: 3.14, step: 0.05, description: 'Horizontal shift in radians' },
            ],
          },
        ],
      },
      {
        title: 'Putting It All Together',
        text: 'The general form a·sin(bx + c) + d lets you control amplitude, frequency, phase, and vertical shift all at once.',
        functions: [
          {
            name: 'General Sine',
            expression: 'a * sin(b * x + c) + d',
            latex: 'y = a \\sin(bx + c) + d',
            category: 'trigonometric',
            dimension: '2d',
            params: [
              { name: 'a', label: 'Amplitude', value: 1.5, min: 0.1, max: 5, step: 0.1 },
              { name: 'b', label: 'Frequency', value: 1, min: 0.1, max: 8, step: 0.1 },
              { name: 'c', label: 'Phase', value: 0, min: -3.14, max: 3.14, step: 0.05 },
              { name: 'd', label: 'Vertical Shift', value: 0, min: -3, max: 3, step: 0.1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'polynomial-shapes',
    title: 'Polynomial Shapes',
    emoji: '📐',
    description: 'Compare x, x², x³, x⁴ side by side and see how degree affects shape.',
    steps: [
      {
        title: 'Linear — Degree 1',
        text: 'The simplest polynomial: y = x. A straight line through the origin with slope 1.',
        functions: [
          { name: 'y = x', expression: 'x', latex: 'y = x', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Quadratic — Degree 2',
        text: 'y = x² is a parabola. It\'s symmetric about the y-axis and always non-negative. Notice how it curves upward.',
        functions: [
          { name: 'y = x', expression: 'x', latex: 'y = x', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Cubic — Degree 3',
        text: 'y = x³ passes through the origin but is anti-symmetric: negative for x < 0, positive for x > 0. It has an inflection point at the origin.',
        functions: [
          { name: 'y = x', expression: 'x', latex: 'y = x', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x³', expression: 'x^3', latex: 'y = x^3', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'All Together — Comparing Growth',
        text: 'Higher-degree polynomials grow much faster for |x| > 1 and are flatter near the origin. Even powers are symmetric (U-shaped), odd powers are anti-symmetric (S-shaped).',
        functions: [
          { name: 'y = x', expression: 'x', latex: 'y = x', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x³', expression: 'x^3', latex: 'y = x^3', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'y = x⁴', expression: 'x^4', latex: 'y = x^4', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
    ],
  },
  {
    id: 'exp-growth-decay',
    title: 'Exponential Growth vs Decay',
    emoji: '📈',
    description: 'See how eˣ grows explosively while e⁻ˣ decays toward zero.',
    steps: [
      {
        title: 'Exponential Growth',
        text: 'y = eˣ grows without bound as x increases. At x = 0 it equals 1, at x = 1 it\'s about 2.718. This is the "natural" growth curve.',
        functions: [
          { name: 'eˣ', expression: 'exp(x)', latex: 'y = e^x', category: 'exponential', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Exponential Decay',
        text: 'y = e⁻ˣ is the mirror image — it approaches 0 as x grows. This models radioactive decay, cooling, and fading signals.',
        functions: [
          { name: 'eˣ', expression: 'exp(x)', latex: 'y = e^x', category: 'exponential', dimension: '2d', params: [] },
          { name: 'e⁻ˣ', expression: 'exp(-x)', latex: 'y = e^{-x}', category: 'exponential', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Growth Rate Comparison',
        text: 'Adjusting the rate "a" in eᵃˣ changes how fast the curve grows or decays. a > 0 is growth, a < 0 is decay.',
        functions: [
          {
            name: 'eᵃˣ',
            expression: 'exp(a * x)',
            latex: 'y = e^{ax}',
            category: 'exponential',
            dimension: '2d',
            params: [
              { name: 'a', label: 'Rate', value: 1, min: -3, max: 3, step: 0.1, description: 'Positive = growth, Negative = decay' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'fourier-squares',
    title: 'Fourier: Squares from Sines',
    emoji: '🔊',
    description: 'Build a square wave by adding sine harmonics one at a time.',
    steps: [
      {
        title: 'First Harmonic',
        text: 'A square wave can be approximated by a sum of sine waves. Start with sin(x) — the fundamental frequency.',
        functions: [
          { name: '1st harmonic', expression: 'sin(x)', latex: 'y = \\sin(x)', category: 'trigonometric', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Add the 3rd Harmonic',
        text: 'Adding sin(3x)/3 starts to flatten the top. The Fourier series only uses odd harmonics with decreasing amplitude.',
        functions: [
          { name: '2 terms', expression: 'sin(x) + sin(3*x)/3', latex: 'y = \\sin x + \\frac{\\sin 3x}{3}', category: 'trigonometric', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Add the 5th Harmonic',
        text: 'Three terms already look more square-ish! The "ringing" at the corners is called the Gibbs phenomenon.',
        functions: [
          { name: '3 terms', expression: 'sin(x) + sin(3*x)/3 + sin(5*x)/5', latex: 'y = \\sin x + \\frac{\\sin 3x}{3} + \\frac{\\sin 5x}{5}', category: 'trigonometric', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'More Harmonics',
        text: 'With N terms, the approximation gets closer and closer to a perfect square wave. Adjust N to see the convergence.',
        functions: [
          {
            name: 'Fourier Square Wave',
            expression: 'sin(x) + sin(3*x)/3 + sin(5*x)/5 + sin(7*x)/7 + sin(9*x)/9 + sin(11*x)/11 + sin(13*x)/13',
            latex: 'y = \\sum_{k=0}^{6} \\frac{\\sin((2k+1)x)}{2k+1}',
            category: 'trigonometric',
            dimension: '2d',
            params: [],
          },
        ],
      },
    ],
  },
  {
    id: 'transformations',
    title: 'Function Transformations',
    emoji: '🔄',
    description: 'See how shifting, scaling, and reflecting transforms f(x).',
    steps: [
      {
        title: 'The Base Function',
        text: 'Start with f(x) = x² — our reference parabola. We\'ll apply transformations one by one.',
        functions: [
          { name: 'f(x) = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Vertical Shift: f(x) + 2',
        text: 'Adding a constant moves the entire graph up. Every point shifts by the same amount. Subtracting moves it down.',
        functions: [
          { name: 'f(x) = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'f(x) + 2', expression: 'x^2 + 2', latex: 'y = x^2 + 2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Horizontal Compression: f(2x)',
        text: 'Replacing x with 2x compresses the graph horizontally by a factor of 2. It looks "narrower" — the parabola rises twice as fast.',
        functions: [
          { name: 'f(x) = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'f(2x)', expression: '(2*x)^2', latex: 'y = (2x)^2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'Reflection: -f(x)',
        text: 'Negating the output flips the graph over the x-axis. The parabola now opens downward.',
        functions: [
          { name: 'f(x) = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: '-f(x)', expression: '-(x^2)', latex: 'y = -x^2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
      {
        title: 'All Transformations',
        text: 'Compare all the transformations side by side. The base function (blue) is your reference — notice how each transformation changes the shape or position.',
        functions: [
          { name: 'f(x) = x²', expression: 'x^2', latex: 'y = x^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'f(x) + 2', expression: 'x^2 + 2', latex: 'y = x^2 + 2', category: 'polynomial', dimension: '2d', params: [] },
          { name: 'f(2x)', expression: '(2*x)^2', latex: 'y = (2x)^2', category: 'polynomial', dimension: '2d', params: [] },
          { name: '-f(x)', expression: '-(x^2)', latex: 'y = -x^2', category: 'polynomial', dimension: '2d', params: [] },
        ],
      },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function GuidedExplorations() {
  const clearAll = useFunctionStore((s) => s.clearAll);
  const addFunction = useFunctionStore((s) => s.addFunction);

  const [activeExploration, setActiveExploration] = useState<Exploration | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const startExploration = useCallback(
    (exploration: Exploration) => {
      setActiveExploration(exploration);
      setCurrentStep(0);
      clearAll();
      // Add functions from the first step
      for (const fn of exploration.steps[0].functions) {
        addFunction({
          name: fn.name,
          expression: fn.expression,
          params: fn.params.map((p) => ({ ...p })),
          category: fn.category,
          latex: fn.latex,
          dimension: fn.dimension,
        });
      }
    },
    [clearAll, addFunction],
  );

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (!activeExploration) return;
      const step = activeExploration.steps[stepIndex];
      if (!step) return;

      setCurrentStep(stepIndex);
      clearAll();
      for (const fn of step.functions) {
        addFunction({
          name: fn.name,
          expression: fn.expression,
          params: fn.params.map((p) => ({ ...p })),
          category: fn.category,
          latex: fn.latex,
          dimension: fn.dimension,
        });
      }
    },
    [activeExploration, clearAll, addFunction],
  );

  const exitExploration = () => {
    setActiveExploration(null);
    setCurrentStep(0);
  };

  // ── Active exploration view ──
  if (activeExploration) {
    const step = activeExploration.steps[currentStep];
    const total = activeExploration.steps.length;
    const isFirst = currentStep === 0;
    const isLast = currentStep === total - 1;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={exitExploration}
            className="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
            title="Back to list"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {activeExploration.emoji} {activeExploration.title}
            </span>
          </div>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {currentStep + 1}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'var(--bg-tertiary)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'var(--accent)' }}
            animate={{ width: `${((currentStep + 1) / total) * 100}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {step.text}
              </p>

              {/* Functions in this step */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Functions plotted
                </span>
                {step.functions.map((fn, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {fn.name}
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                      <InlineMath math={fn.latex} />
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {activeExploration.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === currentStep ? 16 : 6,
                height: 6,
                background: i === currentStep ? 'var(--accent)' : i < currentStep ? 'var(--accent)' : 'var(--border)',
                opacity: i <= currentStep ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={isFirst}
            className="flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-30"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            ← Previous
          </button>
          {isLast ? (
            <button
              onClick={exitExploration}
              className="flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              ✓ Finish
            </button>
          ) : (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Exploration list ──
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Guided Explorations
        </h2>
        <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Step-by-step walkthroughs to learn math concepts visually.
        </p>
      </div>

      {/* Exploration cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {EXPLORATIONS.map((exploration) => (
          <motion.button
            key={exploration.id}
            whileHover={{ scale: 1.01, boxShadow: '0 0 12px rgba(99,102,241,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => startExploration(exploration)}
            className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-xl shrink-0 mt-0.5">{exploration.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium block" style={{ color: 'var(--text-primary)' }}>
                {exploration.title}
              </span>
              <span className="text-[10px] leading-tight block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {exploration.description}
              </span>
              <span
                className="inline-block mt-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {exploration.steps.length} steps
              </span>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
              className="shrink-0 mt-1"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
