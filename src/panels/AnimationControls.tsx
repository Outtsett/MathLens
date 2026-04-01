/**
 * Animation control panel — sits below the canvas or in the sidebar.
 *
 * Provides play/pause, scrubber, speed control, and mode-specific
 * settings for Fourier, Morph, and Trace animations.
 */

import { type FC, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAnimStore, type AnimStore } from '../store/animStore';
import { useFunctionStore } from '../store/functionStore';
import { useAnimation } from '../animations/useAnimation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANIM_TYPES: Array<{
  value: AnimStore['animationType'];
  label: string;
}> = [
  { value: 'fourier', label: 'Fourier' },
  { value: 'morph', label: 'Morph' },
  { value: 'trace', label: 'Trace' },
  { value: 'parametric', label: 'Parametric' },
];

const SPEED_PRESETS = [0.25, 0.5, 1, 2, 4] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const PlayPauseButton: FC<{
  isPlaying: boolean;
  onToggle: () => void;
}> = ({ isPlaying, onToggle }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.9 }}
    onClick={onToggle}
    className="flex h-9 w-9 items-center justify-center rounded-full
               bg-indigo-600 text-white hover:bg-indigo-500
               focus:outline-none focus:ring-2 focus:ring-indigo-400"
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >
    <motion.span
      key={isPlaying ? 'pause' : 'play'}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.15 }}
      className="text-sm leading-none"
    >
      {isPlaying ? '⏸' : '▶'}
    </motion.span>
  </motion.button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AnimationControls: FC = () => {
  // Animation hook — keeps progress ticking
  const progress = useAnimation();

  // Store slices
  const {
    isPlaying,
    animationType,
    speed,
    fourierTerms,
    morphSourceId,
    morphTargetId,
    traceTargetId,
    play,
    pause,
    reset,
    setProgress,
    setSpeed,
    setAnimationType,
    setFourierTerms,
    setMorphTargets,
    setTraceTarget,
  } = useAnimStore();

  const functions = useFunctionStore((s) => s.functions);

  // Handlers
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      // If we're at the end, restart before playing
      if (progress >= 1) setProgress(0);
      play();
    }
  }, [isPlaying, progress, pause, play, setProgress]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setProgress(value);
    },
    [setProgress],
  );

  const handleAnimType = useCallback(
    (type: AnimStore['animationType']) => {
      setAnimationType(type);
    },
    [setAnimationType],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-200 backdrop-blur">
      {/* ---- Animation type selector ---- */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Mode
        </span>
        {ANIM_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleAnimType(value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              animationType === value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Transport: play / scrubber / reset ---- */}
      <div className="flex items-center gap-2">
        <PlayPauseButton isPlaying={isPlaying} onToggle={togglePlay} />

        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleScrub}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700
                     accent-indigo-500 [&::-webkit-slider-thumb]:h-3.5
                     [&::-webkit-slider-thumb]:w-3.5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-indigo-400"
          aria-label="Animation progress"
        />

        <span className="w-12 text-right text-xs tabular-nums text-slate-400">
          {(progress * 100).toFixed(0)}%
        </span>

        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          Reset
        </button>
      </div>

      {/* ---- Speed selector ---- */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Speed
        </span>
        {SPEED_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              speed === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* ---- Mode-specific controls ---- */}
      {animationType === 'fourier' && (
        <FourierControls
          fourierTerms={fourierTerms}
          setFourierTerms={setFourierTerms}
        />
      )}

      {animationType === 'morph' && (
        <MorphControls
          functions={functions}
          sourceId={morphSourceId}
          targetId={morphTargetId}
          setMorphTargets={setMorphTargets}
        />
      )}

      {animationType === 'trace' && (
        <TraceControls
          functions={functions}
          traceTargetId={traceTargetId}
          setTraceTarget={setTraceTarget}
          progress={progress}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Mode-specific panels
// ---------------------------------------------------------------------------

const FourierControls: FC<{
  fourierTerms: number;
  setFourierTerms: (n: number) => void;
}> = ({ fourierTerms, setFourierTerms }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-400">Terms</span>
    <input
      type="range"
      min={1}
      max={50}
      step={1}
      value={fourierTerms}
      onChange={(e) => setFourierTerms(parseInt(e.target.value, 10))}
      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700
                 accent-indigo-500"
      aria-label="Number of Fourier terms"
    />
    <span className="w-8 text-right text-xs tabular-nums text-indigo-300">
      {fourierTerms}
    </span>
  </div>
);

const MorphControls: FC<{
  functions: Array<{ id: string; name: string }>;
  sourceId: string | null;
  targetId: string | null;
  setMorphTargets: (src: string, tgt: string) => void;
}> = ({ functions, sourceId, targetId, setMorphTargets }) => {
  const handleSource = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMorphTargets(e.target.value, targetId ?? '');
    },
    [targetId, setMorphTargets],
  );

  const handleTarget = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMorphTargets(sourceId ?? '', e.target.value);
    },
    [sourceId, setMorphTargets],
  );

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1 text-xs text-slate-400">
        From
        <select
          value={sourceId ?? ''}
          onChange={handleSource}
          className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200"
        >
          <option value="">—</option>
          {functions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-slate-400">
        To
        <select
          value={targetId ?? ''}
          onChange={handleTarget}
          className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200"
        >
          <option value="">—</option>
          {functions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const TraceControls: FC<{
  functions: Array<{ id: string; name: string }>;
  traceTargetId: string | null;
  setTraceTarget: (id: string) => void;
  progress: number;
}> = ({ functions, traceTargetId, setTraceTarget, progress }) => {
  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTraceTarget(e.target.value);
    },
    [setTraceTarget],
  );

  // Map progress [0,1] to an x range – default [-5, 5]
  const xMin = -5;
  const xMax = 5;
  const xPos = xMin + progress * (xMax - xMin);

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-1 text-xs text-slate-400">
        Function
        <select
          value={traceTargetId ?? ''}
          onChange={handleSelect}
          className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200"
        >
          <option value="">—</option>
          {functions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <span className="ml-auto text-xs tabular-nums text-indigo-300">
        x = {xPos.toFixed(2)}
      </span>
    </div>
  );
};
