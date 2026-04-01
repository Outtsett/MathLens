/**
 * Fourier series decomposition and animation utilities.
 *
 * All functions assume the input domain is [-π, π] for coefficient
 * computation, though the resulting approximation can be evaluated
 * at any x value.
 */

export interface FourierCoefficients {
  a0: number;
  an: number[];
  bn: number[];
}

/**
 * Compute Fourier coefficients for f(x) over [-π, π] using the
 * trapezoidal rule for numerical integration.
 *
 *   a0 = (1/π) ∫[-π,π] f(x) dx
 *   an = (1/π) ∫[-π,π] f(x) cos(nx) dx
 *   bn = (1/π) ∫[-π,π] f(x) sin(nx) dx
 */
export function computeFourierCoefficients(
  f: (x: number) => number,
  numTerms: number,
): FourierCoefficients {
  // Number of integration sample points – more gives better accuracy
  const N = 1024;
  const dx = (2 * Math.PI) / N;

  let a0 = 0;
  const an: number[] = new Array(numTerms).fill(0);
  const bn: number[] = new Array(numTerms).fill(0);

  for (let i = 0; i <= N; i++) {
    const x = -Math.PI + i * dx;
    const fx = f(x);

    // Trapezoidal weight: half-weight at endpoints
    const w = i === 0 || i === N ? 0.5 : 1;

    a0 += w * fx;

    for (let n = 0; n < numTerms; n++) {
      const nFreq = n + 1;
      an[n] += w * fx * Math.cos(nFreq * x);
      bn[n] += w * fx * Math.sin(nFreq * x);
    }
  }

  // Normalise: multiply by dx/π
  const scale = dx / Math.PI;
  a0 *= scale;
  for (let n = 0; n < numTerms; n++) {
    an[n] *= scale;
    bn[n] *= scale;
  }

  return { a0, an, bn };
}

/**
 * Build the Fourier partial-sum approximation for the first `numTerms`:
 *
 *   S_N(x) = a0/2 + Σ_{n=1}^{N} [an·cos(nx) + bn·sin(nx)]
 *
 * `numTerms` may be ≤ the length of the coefficient arrays.
 */
export function fourierApproximation(
  coefficients: FourierCoefficients,
  numTerms: number,
): (x: number) => number {
  const { a0, an, bn } = coefficients;
  const N = Math.min(numTerms, an.length);

  return (x: number): number => {
    let sum = a0 / 2;
    for (let n = 0; n < N; n++) {
      const nFreq = n + 1;
      sum += an[n] * Math.cos(nFreq * x) + bn[n] * Math.sin(nFreq * x);
    }
    return sum;
  };
}

/**
 * Return an array of cumulative component functions, one per added term.
 *
 * Element 0: just a0/2 (the DC offset)
 * Element k (k ≥ 1): a0/2 + Σ_{n=1}^{k} [an·cos(nx) + bn·sin(nx)]
 *
 * Useful for animating terms being added one-by-one.
 */
export function fourierComponents(
  coefficients: FourierCoefficients,
): Array<{ term: number; fn: (x: number) => number; label: string }> {
  const { a0, an, bn } = coefficients;
  const components: Array<{
    term: number;
    fn: (x: number) => number;
    label: string;
  }> = [];

  // DC component
  components.push({
    term: 0,
    fn: (_x: number) => a0 / 2,
    label: `a₀/2 = ${(a0 / 2).toFixed(3)}`,
  });

  // Harmonic components (cumulative)
  for (let k = 0; k < an.length; k++) {
    const termsUpTo = k + 1;
    const partial = fourierApproximation(coefficients, termsUpTo);

    const anK = an[k].toFixed(3);
    const bnK = bn[k].toFixed(3);
    components.push({
      term: termsUpTo,
      fn: partial,
      label: `n=${termsUpTo}: ${anK}·cos(${termsUpTo}x) + ${bnK}·sin(${termsUpTo}x)`,
    });
  }

  return components;
}
