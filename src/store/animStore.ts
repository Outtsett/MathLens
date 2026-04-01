import { create } from 'zustand';

export interface AnimStore {
  /** Is an animation currently playing */
  isPlaying: boolean;
  /** Current animation type */
  animationType: 'none' | 'fourier' | 'morph' | 'trace' | 'parametric';
  /** Animation progress (0 to 1) */
  progress: number;
  /** Playback speed multiplier */
  speed: number;
  /** Fourier-specific: number of terms */
  fourierTerms: number;
  /** Morph-specific: source function ID */
  morphSourceId: string | null;
  /** Morph-specific: target function ID */
  morphTargetId: string | null;
  /** Trace-specific: function ID being traced */
  traceTargetId: string | null;

  // Actions
  play: () => void;
  pause: () => void;
  reset: () => void;
  setProgress: (p: number) => void;
  setSpeed: (s: number) => void;
  setAnimationType: (type: AnimStore['animationType']) => void;
  setFourierTerms: (n: number) => void;
  setMorphTargets: (sourceId: string, targetId: string) => void;
  setTraceTarget: (id: string) => void;
}

export const useAnimStore = create<AnimStore>((set) => ({
  isPlaying: false,
  animationType: 'none',
  progress: 0,
  speed: 1,
  fourierTerms: 5,
  morphSourceId: null,
  morphTargetId: null,
  traceTargetId: null,

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  reset: () =>
    set({
      isPlaying: false,
      progress: 0,
    }),

  setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),

  setSpeed: (s) => set({ speed: Math.max(0.1, Math.min(10, s)) }),

  setAnimationType: (type) =>
    set({
      animationType: type,
      isPlaying: false,
      progress: 0,
    }),

  setFourierTerms: (n) =>
    set({ fourierTerms: Math.max(1, Math.min(50, Math.round(n))) }),

  setMorphTargets: (sourceId, targetId) =>
    set({
      morphSourceId: sourceId,
      morphTargetId: targetId,
      animationType: 'morph',
      progress: 0,
    }),

  setTraceTarget: (id) =>
    set({
      traceTargetId: id,
      animationType: 'trace',
      progress: 0,
    }),
}));
