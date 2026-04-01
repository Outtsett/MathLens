import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunctionStore } from '../store/functionStore';

type CopyState = 'idle' | 'copied' | 'error';

function useCopyFeedback(): [CopyState, (text: string) => Promise<void>] {
  const [state, setState] = useState<CopyState>('idle');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2000);
  };

  return [state, copy];
}

function ExportButton({
  icon,
  label,
  description,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-white/5 w-full"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          {badge && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
          {description}
        </span>
      </div>
    </motion.button>
  );
}

function getSvgContent(): string | null {
  const svg = document.querySelector('.MafsView svg') as SVGSVGElement | null;
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Ensure the SVG has proper namespace and dimensions
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('width')) {
    const box = svg.getBoundingClientRect();
    clone.setAttribute('width', String(box.width));
    clone.setAttribute('height', String(box.height));
  }
  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const functions = useFunctionStore((s) => s.functions);
  const selectedFn = useFunctionStore((s) =>
    s.functions.find((f) => f.id === s.selectedId),
  );

  const [copyLatexState, copyLatex] = useCopyFeedback();
  const [copyAllState, copyAll] = useCopyFeedback();
  const [shareLinkState, copyShareLink] = useCopyFeedback();
  const [screenshotDone, setScreenshotDone] = useState(false);

  const handleCopyLatex = () => {
    if (selectedFn) {
      copyLatex(selectedFn.latex || selectedFn.expression);
    }
  };

  const handleCopyAllLatex = () => {
    const allLatex = functions
      .map((f) => f.latex || f.expression)
      .join('\n');
    copyAll(allLatex);
  };

  const handleShareLink = () => {
    const configs = functions.map((f) => ({
      name: f.name,
      expression: f.expression,
      latex: f.latex,
      category: f.category,
      dimension: f.dimension,
      params: f.params.map((p) => ({
        name: p.name,
        label: p.label,
        value: p.value,
        min: p.min,
        max: p.max,
        step: p.step,
      })),
    }));
    const encoded = btoa(encodeURIComponent(JSON.stringify(configs)));
    const url = `${window.location.origin}${window.location.pathname}?functions=${encoded}`;
    copyShareLink(url);
  };

  const handleDownloadSvg = () => {
    const svgContent = getSvgContent();
    if (svgContent) {
      downloadBlob(svgContent, 'mathlens-plot.svg', 'image/svg+xml');
    }
  };

  const handleScreenshot = async () => {
    const svgContent = getSvgContent();
    if (!svgContent) return;

    // Render SVG to a canvas for PNG export
    const svg = document.querySelector('.MafsView svg') as SVGSVGElement | null;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const img = new Image();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Dark background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, box.width, box.height);
      ctx.drawImage(img, 0, 0, box.width, box.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = 'mathlens-plot.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setScreenshotDone(true);
        setTimeout(() => setScreenshotDone(false), 2000);
      }, 'image/png');
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Export &amp; Share
        </h2>
      </div>

      {/* Export options */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Screenshot */}
        <ExportButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          }
          label="Screenshot"
          description="Download the current plot as a PNG image"
          onClick={handleScreenshot}
          badge={screenshotDone ? '✓ Saved' : undefined}
        />

        {/* Download SVG */}
        <ExportButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
          label="Download SVG"
          description="Export the plot as a scalable vector graphic"
          onClick={handleDownloadSvg}
        />

        {/* Copy LaTeX (selected) */}
        <ExportButton
          icon={
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Σ
            </span>
          }
          label="Copy LaTeX"
          description={
            selectedFn
              ? `Copy LaTeX for "${selectedFn.name}"`
              : 'Select a function first'
          }
          onClick={handleCopyLatex}
          badge={copyLatexState === 'copied' ? '✓ Copied' : undefined}
        />

        {/* Copy All LaTeX */}
        <ExportButton
          icon={
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Σ+
            </span>
          }
          label="Copy All LaTeX"
          description={`Copy LaTeX for all ${functions.length} function(s)`}
          onClick={handleCopyAllLatex}
          badge={copyAllState === 'copied' ? '✓ Copied' : undefined}
        />

        {/* Share Link */}
        <ExportButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          }
          label="Share Link"
          description="Generate a shareable URL with your current functions"
          onClick={handleShareLink}
          badge={shareLinkState === 'copied' ? '✓ Link Copied' : undefined}
        />

        {/* Info */}
        {functions.length === 0 && (
          <div
            className="rounded-lg p-3 text-center text-[10px]"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Add some functions to the plot to enable export options.
          </div>
        )}
      </div>
    </div>
  );
}
