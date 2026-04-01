/**
 * React hook that drives animations via requestAnimationFrame.
 *
 * Reads `isPlaying`, `speed`, and `progress` from the animation store
 * and advances `progress` at ~60 fps. A full cycle takes roughly 5 s
 * at speed = 1.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useAnimStore } from '../store/animStore';

/** Duration (in seconds) for one full 0→1 cycle at speed = 1. */
const BASE_DURATION = 5;

export function useAnimation(): number {
  const isPlaying = useAnimStore((s) => s.isPlaying);
  const speed = useAnimStore((s) => s.speed);
  const progress = useAnimStore((s) => s.progress);
  const setProgress = useAnimStore((s) => s.setProgress);
  const pause = useAnimStore((s) => s.pause);

  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // Use refs so the RAF callback always sees the latest values without
  // needing to restart the loop on every progress change.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      const step = (delta * speedRef.current) / BASE_DURATION;
      const next = progressRef.current + step;

      if (next >= 1) {
        setProgress(1);
        pause();
      } else {
        setProgress(next);
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [setProgress, pause],
  );

  useEffect(() => {
    if (isPlaying) {
      // Reset the timestamp so delta is correct on resume
      lastTimeRef.current = undefined;
      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [isPlaying, animate]);

  return progress;
}
