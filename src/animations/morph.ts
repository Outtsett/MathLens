/**
 * Function morphing — smooth interpolation between two functions.
 */

/**
 * Create a morph that linearly interpolates between `f` and `g`.
 *
 *   morph(x, 0) = f(x)
 *   morph(x, 1) = g(x)
 *   morph(x, t) = (1 - t) * f(x) + t * g(x)
 *
 * `t` is clamped to [0, 1].
 */
export function createMorphFunction(
  f: (x: number) => number,
  g: (x: number) => number,
): (x: number, t: number) => number {
  return (x: number, t: number): number => {
    const tc = Math.max(0, Math.min(1, t));
    return (1 - tc) * f(x) + tc * g(x);
  };
}

/**
 * Smooth-step easing: easeInOutCubic.
 *
 *   ease(t) = 3t² − 2t³   for t ∈ [0, 1]
 */
function easeInOutCubic(t: number): number {
  const tc = Math.max(0, Math.min(1, t));
  return tc * tc * (3 - 2 * tc);
}

/**
 * Create an eased morph using easeInOutCubic on the interpolation
 * parameter so the transition starts and ends smoothly.
 *
 *   morph(x, t) = (1 - ease(t)) * f(x) + ease(t) * g(x)
 */
export function createEasedMorph(
  f: (x: number) => number,
  g: (x: number) => number,
): (x: number, t: number) => number {
  return (x: number, t: number): number => {
    const et = easeInOutCubic(t);
    return (1 - et) * f(x) + et * g(x);
  };
}
