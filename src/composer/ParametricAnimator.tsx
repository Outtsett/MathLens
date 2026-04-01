import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineMath } from 'react-katex';
import * as Slider from '@radix-ui/react-slider';
import { useParametricStore, PARAMETRIC_PRESETS } from '../store/parametricStore';
import { useAnimStore } from '../store/animStore';
import { useAnimation } from '../animations/useAnimation';

/* ── Preset card ────────────────────────────────────────────────────── */

function PresetCard({ id, name, latex }: { id: string; name: string; latex: string }) {
  const selectPreset = useParametricStore((s) => s.selectPreset);
  const setAnimationType = useAnimStore((s) => s.setAnimationType);

  const handleClick = useCallback(() => {
    selectPreset(id);
    setAnimationType('parametric');
  }, [id, selectPreset, setAnimationType]);

  return (
    <button
      onClick={handleClick}
      className="katex-card flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
        {name}
      </span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
        <InlineMath math={latex} />
      </span>
    </button>
  );
}

/* ── Inline slider component ─────────────────────────────────────────── */

function MiniSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <Slider.Root
        className="relative flex h-4 flex-1 touch-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>
      <span
        className="w-10 shrink-0 text-right font-mono text-[11px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {value.toFixed(step < 1 ? 2 : 0)}
      </span>
    </div>
  );
}

/* ── Active curve card ───────────────────────────────────────────────── */

function ActiveCurveCard({ curveId }: { curveId: string }) {
  const curves = useParametricStore((s) => s.curves);
  const selectedCurveId = useParametricStore((s) => s.selectedCurveId);
  const selectCurve = useParametricStore((s) => s.selectCurve);
  const removeCurve = useParametricStore((s) => s.removeCurve);
  const updateParam = useParametricStore((s) => s.updateParam);
  const setTRange = useParametricStore((s) => s.setTRange);
  const toggleTrace = useParametricStore((s) => s.toggleTrace);
  const toggleVelocity = useParametricStore((s) => s.toggleVelocity);

  const curve = curves.find((c) => c.id === curveId);
  if (!curve) return null;

  const isSelected = selectedCurveId === curveId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg p-2.5"
      style={{
        background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-tertiary)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <button
          onClick={() => selectCurve(curveId)}
          className="flex items-center gap-1.5"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: curve.color }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {curve.name}
          </span>
        </button>
        <button
          onClick={() => removeCurve(curveId)}
          className="flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Remove curve"
        >
          ✕
        </button>
      </div>

      {/* Param sliders */}
      {curve.params.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {curve.params.map((p) => (
            <MiniSlider
              key={p.name}
              label={p.label}
              value={p.value}
              min={p.min}
              max={p.max}
              step={p.step}
              onChange={(v) => updateParam(curveId, p.name, v)}
            />
          ))}
        </div>
      )}

      {/* t range */}
      <div className="mb-2 flex flex-col gap-1">
        <MiniSlider
          label="t min"
          value={curve.tMin}
          min={-20}
          max={curve.tMax - 0.1}
          step={0.1}
          onChange={(v) => setTRange(curveId, v, curve.tMax)}
        />
        <MiniSlider
          label="t max"
          value={curve.tMax}
          min={curve.tMin + 0.1}
          max={40}
          step={0.1}
          onChange={(v) => setTRange(curveId, curve.tMin, v)}
        />
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-3">
        <ToggleBtn
          label="Trace"
          active={curve.showTrace}
          onClick={() => toggleTrace(curveId)}
        />
        <ToggleBtn
          label="Velocity"
          active={curve.showVelocity}
          onClick={() => toggleVelocity(curveId)}
        />
      </div>
    </motion.div>
  );
}

function ToggleBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-all"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  );
}

/* ── Animation controls ──────────────────────────────────────────────── */

function AnimControls() {
  const progress = useAnimation();
  const isPlaying = useAnimStore((s) => s.isPlaying);
  const speed = useAnimStore((s) => s.speed);
  const play = useAnimStore((s) => s.play);
  const pause = useAnimStore((s) => s.pause);
  const reset = useAnimStore((s) => s.reset);
  const setProgress = useAnimStore((s) => s.setProgress);
  const setSpeed = useAnimStore((s) => s.setSpeed);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (progress >= 1) reset();
      play();
    }
  }, [isPlaying, progress, play, pause, reset]);

  return (
    <div className="flex flex-col gap-2 rounded-lg p-2.5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <rect x="1" y="1" width="3" height="8" rx="0.5" />
              <rect x="6" y="1" width="3" height="8" rx="0.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M2 1l7 4-7 4z" />
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
          title="Reset"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1v4h4M11 11V7H7" />
            <path d="M10.2 4.5A5 5 0 001 6M1.8 7.5A5 5 0 0011 6" />
          </svg>
        </button>

        {/* Progress bar */}
        <Slider.Root
          className="relative flex h-4 flex-1 touch-none items-center"
          min={0}
          max={1}
          step={0.001}
          value={[progress]}
          onValueChange={([v]) => setProgress(v)}
        >
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb />
        </Slider.Root>

        <span className="w-9 shrink-0 text-right font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Speed</span>
        {[0.25, 0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="rounded px-1.5 py-0.5 text-[10px] font-medium transition-all"
            style={{
              background: Math.abs(speed - s) < 0.01 ? 'var(--accent)' : 'transparent',
              color: Math.abs(speed - s) < 0.01 ? '#fff' : 'var(--text-muted)',
            }}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export default function ParametricAnimator() {
  const curves = useParametricStore((s) => s.curves);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Presets grid */}
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Presets
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PARAMETRIC_PRESETS.map((p) => (
            <PresetCard key={p.id} id={p.id} name={p.name} latex={p.latex} />
          ))}
        </div>
      </div>

      {/* Divider */}
      {curves.length > 0 && (
        <div className="mx-0 my-0.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }} />
      )}

      {/* Active curves */}
      {curves.length > 0 && (
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Curves
          </h3>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {curves.map((c) => (
                <ActiveCurveCard key={c.id} curveId={c.id} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Animation controls */}
      {curves.length > 0 && (
        <>
          <div className="mx-0 my-0.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }} />
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Animation
            </h3>
            <AnimControls />
          </div>
        </>
      )}
    </div>
  );
}
