import { useMemo } from 'react';
import { useTransformContext } from 'mafs';
import { compile } from 'mathjs';
import { useViewStore } from '../../store/viewStore';

/* ------------------------------------------------------------------ */
/*  Polar grid: concentric circles + radial lines rendered as SVG      */
/* ------------------------------------------------------------------ */

const RADIAL_LINE_ANGLES_DEG = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const MAX_RADIUS = 12;
const CIRCLE_STEP = 1;

/** Human-friendly angle labels */
const ANGLE_LABELS: Array<{ deg: number; label: string }> = [
  { deg: 0, label: '0' },
  { deg: 30, label: 'π/6' },
  { deg: 60, label: 'π/3' },
  { deg: 90, label: 'π/2' },
  { deg: 120, label: '2π/3' },
  { deg: 150, label: '5π/6' },
  { deg: 180, label: 'π' },
  { deg: 210, label: '7π/6' },
  { deg: 240, label: '4π/3' },
  { deg: 270, label: '3π/2' },
  { deg: 300, label: '5π/3' },
  { deg: 330, label: '11π/6' },
];

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function PolarGrid() {
  const gridType = useViewStore((s) => s.gridType);
  const { viewTransform } = useTransformContext();

  const circleRadii = useMemo(() => {
    const radii: number[] = [];
    for (let r = CIRCLE_STEP; r <= MAX_RADIUS; r += CIRCLE_STEP) {
      radii.push(r);
    }
    return radii;
  }, []);

  if (gridType !== 'polar') return null;

  // viewTransform maps math coords → pixel coords
  // We need it to figure out font sizes and such, but we draw in math coords
  // via an SVG group. Mafs <svg> is in pixel space, so we need to convert.
  //
  // The transform is a DOMMatrix. We can extract the scale from it.
  // vec.Matrix is [a, b, c, d, e, f] — a 2x3 affine matrix
  const scaleX = viewTransform[0]; // pixels per math unit (x)
  const scaleY = -viewTransform[3]; // pixels per math unit (y), negated because SVG y is down

  // Pixel-space offset of origin
  const originPx = viewTransform[4];
  const originPy = viewTransform[5];

  return (
    <g>
      {/* Concentric circles */}
      {circleRadii.map((r) => (
        <circle
          key={`ring-${r}`}
          cx={originPx}
          cy={originPy}
          r={r * scaleX}
          fill="none"
          stroke="rgba(100, 100, 140, 0.25)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ))}

      {/* Radius labels on the +X axis */}
      {circleRadii
        .filter((r) => r % 2 === 0 || r <= 4)
        .map((r) => (
          <text
            key={`rlabel-${r}`}
            x={originPx + r * scaleX + 4}
            y={originPy - 4}
            fill="rgba(136, 136, 160, 0.6)"
            fontSize={10}
            fontFamily="monospace"
          >
            {r}
          </text>
        ))}

      {/* Radial lines */}
      {RADIAL_LINE_ANGLES_DEG.map((deg) => {
        const rad = degToRad(deg);
        const endX = Math.cos(rad) * MAX_RADIUS;
        const endY = Math.sin(rad) * MAX_RADIUS;

        // Convert to pixel space
        const px1 = originPx;
        const py1 = originPy;
        const px2 = originPx + endX * scaleX;
        const py2 = originPy - endY * scaleY; // subtract because SVG y is down

        return (
          <line
            key={`radial-${deg}`}
            x1={px1}
            y1={py1}
            x2={px2}
            y2={py2}
            stroke="rgba(100, 100, 140, 0.2)"
            strokeWidth={1}
          />
        );
      })}

      {/* Angle labels */}
      {ANGLE_LABELS.map(({ deg, label }) => {
        const rad = degToRad(deg);
        const labelR = MAX_RADIUS + 0.6;
        const lx = originPx + Math.cos(rad) * labelR * scaleX;
        const ly = originPy - Math.sin(rad) * labelR * scaleY;

        return (
          <text
            key={`alabel-${deg}`}
            x={lx}
            y={ly}
            fill="rgba(136, 136, 160, 0.55)"
            fontSize={9}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Polar function plotting helper                                     */
/*  r = f(θ) → parametric (x, y) curve                                */
/* ------------------------------------------------------------------ */

export interface PolarCurvePoint {
  x: number;
  y: number;
}

/**
 * Sample a polar function r = f(θ) and return cartesian points.
 * Use the returned array with Mafs Plot.Parametric or an SVG <polyline>.
 */
export function samplePolarFunction(
  expression: string,
  params: Array<{ name: string; value: number }>,
  thetaMin: number = 0,
  thetaMax: number = 2 * Math.PI,
  samples: number = 360,
): PolarCurvePoint[] {
  let compiled;
  try {
    compiled = compile(expression);
  } catch {
    return [];
  }

  const scope: Record<string, number> = {};
  params.forEach((p) => {
    scope[p.name] = p.value;
  });

  const points: PolarCurvePoint[] = [];
  const step = (thetaMax - thetaMin) / samples;

  for (let i = 0; i <= samples; i++) {
    const theta = thetaMin + i * step;
    scope.theta = theta;
    scope.t = theta; // alias

    let r: number;
    try {
      r = compiled.evaluate(scope);
      if (!isFinite(r) || isNaN(r)) continue;
    } catch {
      continue;
    }

    points.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
    });
  }

  return points;
}

/* ------------------------------------------------------------------ */
/*  SVG path from polar points (for rendering inside Mafs)             */
/* ------------------------------------------------------------------ */

interface PolarCurvePathProps {
  points: PolarCurvePoint[];
  color: string;
  strokeWidth?: number;
}

export function PolarCurvePath({
  points,
  color,
  strokeWidth = 2,
}: PolarCurvePathProps) {
  const { viewTransform } = useTransformContext();

  if (points.length < 2) return null;

  const d = points
    .map((p, i) => {
      // Transform math coords to pixel coords via the viewTransform
      const px = viewTransform[0] * p.x + viewTransform[2] * p.y + viewTransform[4];
      const py = viewTransform[1] * p.x + viewTransform[3] * p.y + viewTransform[5];
      return `${i === 0 ? 'M' : 'L'}${px},${py}`;
    })
    .join(' ');

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
