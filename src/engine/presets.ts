import type { MathFunction, FunctionCategory } from '../types/function';

type PresetFunction = Omit<MathFunction, 'id' | 'color' | 'visible'>;

/**
 * Returns every preset function organized by category.
 *
 * Each preset ships with sensible defaults, descriptive parameter labels,
 * and valid KaTeX-compatible LaTeX strings.
 */
export function getPresets(): Record<FunctionCategory, PresetFunction[]> {
  return {
    trigonometric: trigPresets(),
    polynomial: polynomialPresets(),
    exponential: exponentialPresets(),
    special: specialPresets(),
    statistical: statisticalPresets(),
    piecewise: piecewisePresets(),
  };
}

// ─── Trigonometric ──────────────────────────────────────────────────────────

function trigPresets(): PresetFunction[] {
  return [
    {
      name: 'Sine Wave',
      expression: 'a * sin(b * x + c) + d',
      latex: 'y = a \\sin(b x + c) + d',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Amplitude',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Height of the wave peaks. Larger values produce taller waves.',
        },
        {
          name: 'b',
          label: 'Frequency',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'Controls how fast the wave oscillates. Higher = more waves per unit.',
        },
        {
          name: 'c',
          label: 'Phase Shift',
          value: 0,
          min: -3.14,
          max: 3.14,
          step: 0.05,
          description:
            'Slides the wave left or right along the x-axis.',
        },
        {
          name: 'd',
          label: 'Vertical Shift',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Moves the entire wave up or down.',
        },
      ],
    },
    {
      name: 'Cosine Wave',
      expression: 'a * cos(b * x + c) + d',
      latex: 'y = a \\cos(b x + c) + d',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Amplitude',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Height of the wave peaks. Larger values produce taller waves.',
        },
        {
          name: 'b',
          label: 'Frequency',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'Controls how fast the wave oscillates. Higher = more waves per unit.',
        },
        {
          name: 'c',
          label: 'Phase Shift',
          value: 0,
          min: -3.14,
          max: 3.14,
          step: 0.05,
          description:
            'Slides the wave left or right along the x-axis.',
        },
        {
          name: 'd',
          label: 'Vertical Shift',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Moves the entire wave up or down.',
        },
      ],
    },
    {
      name: 'Tangent',
      expression: 'a * tan(b * x + c)',
      latex: 'y = a \\tan(b x + c)',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Amplitude',
          value: 1,
          min: 0.1,
          max: 3,
          step: 0.1,
          description: 'Vertical stretch of the tangent curve.',
        },
        {
          name: 'b',
          label: 'Frequency',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Controls the period. Higher values compress the curve horizontally.',
        },
        {
          name: 'c',
          label: 'Phase Shift',
          value: 0,
          min: -3.14,
          max: 3.14,
          step: 0.05,
          description: 'Shifts the asymptotes left or right.',
        },
      ],
    },
    {
      name: 'Sine + Cosine Combo',
      expression: 'a * sin(x) + b * cos(x)',
      latex: 'y = a \\sin(x) + b \\cos(x)',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Sine Coefficient',
          value: 1,
          min: -3,
          max: 3,
          step: 0.1,
          description:
            'Weight of the sine component. Negative values flip it.',
        },
        {
          name: 'b',
          label: 'Cosine Coefficient',
          value: 1,
          min: -3,
          max: 3,
          step: 0.1,
          description:
            'Weight of the cosine component. Changing the ratio rotates the phase.',
        },
      ],
    },
    {
      name: 'Damped Oscillation',
      expression: 'a * exp(-b * x) * sin(c * x)',
      latex: 'y = a \\, e^{-b x} \\sin(c x)',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Initial Amplitude',
          value: 2,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Starting height of the oscillation before decay takes over.',
        },
        {
          name: 'b',
          label: 'Decay Rate',
          value: 0.3,
          min: 0,
          max: 2,
          step: 0.05,
          description:
            'How quickly the wave dies out. 0 = no decay, larger = faster decay.',
        },
        {
          name: 'c',
          label: 'Oscillation Frequency',
          value: 3,
          min: 0.5,
          max: 15,
          step: 0.5,
          description: 'Speed of the oscillation inside the envelope.',
        },
      ],
    },
    {
      name: 'Secant',
      expression: 'a / cos(b * x + c)',
      latex: 'y = \\frac{a}{\\cos(b x + c)}',
      category: 'trigonometric',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Amplitude',
          value: 1,
          min: 0.1,
          max: 3,
          step: 0.1,
          description: 'Vertical stretch of the secant curve.',
        },
        {
          name: 'b',
          label: 'Frequency',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Controls spacing between asymptotes.',
        },
        {
          name: 'c',
          label: 'Phase Shift',
          value: 0,
          min: -3.14,
          max: 3.14,
          step: 0.05,
          description: 'Shifts the curve horizontally.',
        },
      ],
    },
  ];
}

// ─── Polynomial ─────────────────────────────────────────────────────────────

function polynomialPresets(): PresetFunction[] {
  return [
    {
      name: 'Linear',
      expression: 'a * x + b',
      latex: 'y = a x + b',
      category: 'polynomial',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Slope',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Rise over run. Positive = uphill, negative = downhill, 0 = flat.',
        },
        {
          name: 'b',
          label: 'Y-Intercept',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Where the line crosses the y-axis.',
        },
      ],
    },
    {
      name: 'Quadratic',
      expression: 'a * x^2 + b * x + c',
      latex: 'y = a x^{2} + b x + c',
      category: 'polynomial',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Leading Coefficient',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Controls width and direction. Positive = opens up, negative = opens down.',
        },
        {
          name: 'b',
          label: 'Linear Coefficient',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Shifts the vertex horizontally.',
        },
        {
          name: 'c',
          label: 'Constant',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Shifts the parabola up or down.',
        },
      ],
    },
    {
      name: 'Cubic',
      expression: 'a * x^3 + b * x^2 + c * x + d',
      latex: 'y = a x^{3} + b x^{2} + c x + d',
      category: 'polynomial',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Cubic Coefficient',
          value: 1,
          min: -3,
          max: 3,
          step: 0.1,
          description:
            'Controls the overall S-shape steepness and direction.',
        },
        {
          name: 'b',
          label: 'Quadratic Coefficient',
          value: 0,
          min: -3,
          max: 3,
          step: 0.1,
          description: 'Adds a parabolic "bump" to the curve.',
        },
        {
          name: 'c',
          label: 'Linear Coefficient',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Tilts the curve near the origin.',
        },
        {
          name: 'd',
          label: 'Constant',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Vertical shift of the entire curve.',
        },
      ],
    },
    {
      name: 'Power Function',
      expression: 'a * x^n',
      latex: 'y = a \\, x^{n}',
      category: 'polynomial',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Coefficient',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Scales the curve vertically.',
        },
        {
          name: 'n',
          label: 'Exponent',
          value: 2,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'The power to raise x to. Integers give classic polynomials; fractional values give roots.',
        },
      ],
    },
    {
      name: 'Quartic',
      expression: 'a * x^4 + b * x^2 + c',
      latex: 'y = a x^{4} + b x^{2} + c',
      category: 'polynomial',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Quartic Coefficient',
          value: 1,
          min: -2,
          max: 2,
          step: 0.05,
          description: 'Controls the "W" or "M" shape steepness.',
        },
        {
          name: 'b',
          label: 'Quadratic Coefficient',
          value: -2,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Negative values create a double-well shape; positive flattens the bottom.',
        },
        {
          name: 'c',
          label: 'Constant',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Vertical offset.',
        },
      ],
    },
  ];
}

// ─── Exponential ────────────────────────────────────────────────────────────

function exponentialPresets(): PresetFunction[] {
  return [
    {
      name: 'Exponential Growth / Decay',
      expression: 'a * exp(b * x)',
      latex: 'y = a \\, e^{b x}',
      category: 'exponential',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Initial Value',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'The y-value at x = 0. Think of it as the starting amount.',
        },
        {
          name: 'b',
          label: 'Growth Rate',
          value: 1,
          min: -3,
          max: 3,
          step: 0.1,
          description:
            'Positive = exponential growth, negative = exponential decay.',
        },
      ],
    },
    {
      name: 'Natural Logarithm',
      expression: 'a * log(b * x + c) + d',
      latex: 'y = a \\ln(b x + c) + d',
      category: 'exponential',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Vertical Stretch',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Scales the logarithm vertically. Negative flips it.',
        },
        {
          name: 'b',
          label: 'Horizontal Compress',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Compresses or stretches the curve horizontally.',
        },
        {
          name: 'c',
          label: 'Horizontal Shift',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Shifts the vertical asymptote. Ensure b*x + c > 0 for real output.',
        },
        {
          name: 'd',
          label: 'Vertical Shift',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description: 'Moves the entire curve up or down.',
        },
      ],
    },
    {
      name: 'Logistic (Sigmoid)',
      expression: 'L / (1 + exp(-k * (x - x0)))',
      latex: 'y = \\frac{L}{1 + e^{-k(x - x_0)}}',
      category: 'exponential',
      dimension: '2d',
      params: [
        {
          name: 'L',
          label: 'Maximum Value',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description: 'The upper asymptote — the curve levels off at this value.',
        },
        {
          name: 'k',
          label: 'Steepness',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'How sharply the curve transitions. Higher = more step-like.',
        },
        {
          name: 'x0',
          label: 'Midpoint',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'The x-value where the curve is at 50% of its maximum.',
        },
      ],
    },
    {
      name: 'Exponential Decay with Offset',
      expression: 'a * exp(-b * x) + c',
      latex: 'y = a \\, e^{-b x} + c',
      category: 'exponential',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Initial Amplitude',
          value: 3,
          min: 0.1,
          max: 10,
          step: 0.1,
          description: 'Height above the offset at x = 0.',
        },
        {
          name: 'b',
          label: 'Decay Rate',
          value: 0.5,
          min: 0.01,
          max: 5,
          step: 0.05,
          description:
            'Speed of decay. Larger = faster approach to the offset.',
        },
        {
          name: 'c',
          label: 'Offset',
          value: 0,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'The horizontal asymptote the curve decays toward.',
        },
      ],
    },
  ];
}

// ─── Special ────────────────────────────────────────────────────────────────

function specialPresets(): PresetFunction[] {
  return [
    {
      name: 'Absolute Value',
      expression: 'a * abs(b * x + c) + d',
      latex: 'y = a \\left| b x + c \\right| + d',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Slope',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Steepness of the V-shape. Negative flips it upside-down.',
        },
        {
          name: 'b',
          label: 'Horizontal Scale',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Compresses or stretches the V horizontally.',
        },
        {
          name: 'c',
          label: 'Horizontal Shift',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Moves the vertex left (positive) or right (negative).',
        },
        {
          name: 'd',
          label: 'Vertical Shift',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Moves the vertex up or down.',
        },
      ],
    },
    {
      name: 'Square Root',
      expression: 'a * sqrt(b * x + c)',
      latex: 'y = a \\sqrt{b x + c}',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Vertical Stretch',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Scales the output. Negative reflects it below the x-axis.',
        },
        {
          name: 'b',
          label: 'Horizontal Scale',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Compresses the curve horizontally. The domain starts where b*x + c ≥ 0.',
        },
        {
          name: 'c',
          label: 'Shift',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'Shifts the starting point of the curve left or right.',
        },
      ],
    },
    {
      name: 'Gaussian (Bell Curve)',
      expression: 'a * exp(-((x - mu)^2) / (2 * sigma^2))',
      latex: 'y = a \\, e^{-\\frac{(x - \\mu)^2}{2\\sigma^2}}',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Height',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Peak height of the bell curve.',
        },
        {
          name: 'mu',
          label: 'Center (μ)',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'The x-position of the peak. Slide to move the bell left/right.',
        },
        {
          name: 'sigma',
          label: 'Width (σ)',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Standard deviation — controls how wide or narrow the bell is. Smaller = sharper peak.',
        },
      ],
    },
    {
      name: 'Sinc Function',
      expression: 'sin(a * x) / (a * x)',
      latex: 'y = \\frac{\\sin(a x)}{a x}',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Frequency',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'Compresses the sinc lobes. Higher values = more oscillations per unit.',
        },
      ],
    },
    {
      name: 'Reciprocal (1/x)',
      expression: 'a / (x - h) + k',
      latex: 'y = \\frac{a}{x - h} + k',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Scale',
          value: 1,
          min: -5,
          max: 5,
          step: 0.1,
          description:
            'Scales the hyperbola. Negative flips it across the x-axis.',
        },
        {
          name: 'h',
          label: 'Vertical Asymptote',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'The x-position of the vertical asymptote (where the function blows up).',
        },
        {
          name: 'k',
          label: 'Horizontal Asymptote',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'The y-value the curve approaches as x goes to ±∞.',
        },
      ],
    },
    {
      name: 'Circular / Semicircle',
      expression: 'a * sqrt(r^2 - (x - h)^2) + k',
      latex: 'y = a \\sqrt{r^{2} - (x - h)^{2}} + k',
      category: 'special',
      dimension: '2d',
      params: [
        {
          name: 'r',
          label: 'Radius',
          value: 3,
          min: 0.5,
          max: 10,
          step: 0.1,
          description: 'Radius of the semicircle.',
        },
        {
          name: 'a',
          label: 'Direction',
          value: 1,
          min: -1,
          max: 1,
          step: 2,
          description:
            '1 = upper semicircle, -1 = lower semicircle.',
        },
        {
          name: 'h',
          label: 'Center X',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Horizontal position of the center.',
        },
        {
          name: 'k',
          label: 'Center Y',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Vertical position of the center.',
        },
      ],
    },
  ];
}

// ─── Statistical ────────────────────────────────────────────────────────────

function statisticalPresets(): PresetFunction[] {
  return [
    {
      name: 'Normal Distribution PDF',
      expression:
        '(1 / (sigma * sqrt(2 * pi))) * exp(-((x - mu)^2) / (2 * sigma^2))',
      latex:
        'y = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
      category: 'statistical',
      dimension: '2d',
      params: [
        {
          name: 'mu',
          label: 'Mean (μ)',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description:
            'Center of the distribution. The peak is always at x = μ.',
        },
        {
          name: 'sigma',
          label: 'Std Dev (σ)',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Width of the bell. ~68% of area falls within ±σ of the mean.',
        },
      ],
    },
    {
      name: 'Sigmoid',
      expression: '1 / (1 + exp(-k * (x - x0)))',
      latex: 'y = \\frac{1}{1 + e^{-k(x - x_0)}}',
      category: 'statistical',
      dimension: '2d',
      params: [
        {
          name: 'k',
          label: 'Steepness',
          value: 1,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'How steep the transition is. Higher = more step-like.',
        },
        {
          name: 'x0',
          label: 'Midpoint',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'The x-value where the output is exactly 0.5.',
        },
      ],
    },
    {
      name: 'Laplace Distribution',
      expression: '(1 / (2 * b)) * exp(-abs(x - mu) / b)',
      latex:
        'y = \\frac{1}{2b} \\, e^{-\\frac{|x - \\mu|}{b}}',
      category: 'statistical',
      dimension: '2d',
      params: [
        {
          name: 'mu',
          label: 'Location (μ)',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'Center of the peak.',
        },
        {
          name: 'b',
          label: 'Scale (b)',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          description:
            'Controls the width. Larger = wider and shorter peak.',
        },
      ],
    },
    {
      name: 'Log-Normal PDF Approx',
      expression:
        '(1 / (x * sigma * sqrt(2 * pi))) * exp(-((log(x) - mu)^2) / (2 * sigma^2))',
      latex:
        'y = \\frac{1}{x \\sigma \\sqrt{2\\pi}} \\, e^{-\\frac{(\\ln x - \\mu)^2}{2\\sigma^2}}',
      category: 'statistical',
      dimension: '2d',
      params: [
        {
          name: 'mu',
          label: 'Log-Mean (μ)',
          value: 0,
          min: -2,
          max: 2,
          step: 0.1,
          description: 'Mean of the underlying normal distribution of ln(x).',
        },
        {
          name: 'sigma',
          label: 'Log-Std Dev (σ)',
          value: 0.5,
          min: 0.1,
          max: 2,
          step: 0.05,
          description:
            'Standard deviation of ln(x). Larger = heavier right tail.',
        },
      ],
    },
  ];
}

// ─── Piecewise / Step ───────────────────────────────────────────────────────

function piecewisePresets(): PresetFunction[] {
  return [
    {
      name: 'Step Function (tanh approx)',
      expression: '0.5 * (1 + tanh(k * (x - c)))',
      latex:
        'y = \\frac{1}{2}\\left(1 + \\tanh\\bigl(k(x - c)\\bigr)\\right)',
      category: 'piecewise',
      dimension: '2d',
      params: [
        {
          name: 'k',
          label: 'Sharpness',
          value: 5,
          min: 0.5,
          max: 50,
          step: 0.5,
          description:
            'How abrupt the step is. Low = smooth ramp, high = near-instant jump.',
        },
        {
          name: 'c',
          label: 'Step Location',
          value: 0,
          min: -10,
          max: 10,
          step: 0.1,
          description: 'The x-value where the transition happens.',
        },
      ],
    },
    {
      name: 'Smooth Ramp',
      expression: 'x * 0.5 * (1 + tanh(k * x))',
      latex:
        'y = \\frac{x}{2}\\left(1 + \\tanh(k x)\\right)',
      category: 'piecewise',
      dimension: '2d',
      params: [
        {
          name: 'k',
          label: 'Sharpness',
          value: 5,
          min: 0.5,
          max: 50,
          step: 0.5,
          description:
            'Transition sharpness at x = 0. High = hard ReLU, low = soft bend.',
        },
      ],
    },
    {
      name: 'Bump Function',
      expression:
        'a * exp(-1 / (1 - (x / r)^2)) * (abs(x) < r)',
      latex:
        'y = a \\, e^{-\\frac{1}{1 - (x/r)^2}} \\; \\text{for } |x| < r',
      category: 'piecewise',
      dimension: '2d',
      params: [
        {
          name: 'a',
          label: 'Height',
          value: 2.72,
          min: 0.1,
          max: 10,
          step: 0.1,
          description:
            'Peak height of the bump (e ≈ 2.72 makes the peak ≈ 1).',
        },
        {
          name: 'r',
          label: 'Radius',
          value: 3,
          min: 0.5,
          max: 10,
          step: 0.1,
          description:
            'The bump is non-zero only on (-r, r). Everything outside is exactly 0.',
        },
      ],
    },
  ];
}
