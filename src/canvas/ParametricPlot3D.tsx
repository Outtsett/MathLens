import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { compile, type EvalFunction } from 'mathjs';

/* ── Types ──────────────────────────────────────────────────────────── */

interface ParametricPlot3DProps {
  xExpr: string;
  yExpr: string;
  zExpr: string;
  tRange: [number, number];
  params: Record<string, number>;
  color: string;
  traceT?: number;
  showVelocity?: boolean;
  resolution?: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function safeCompile(expr: string): EvalFunction | null {
  try {
    return compile(expr);
  } catch {
    return null;
  }
}

function safeEval(compiled: EvalFunction, scope: Record<string, number>): number {
  try {
    const v = compiled.evaluate(scope);
    return typeof v === 'number' && isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/** Height→color ramp: blue→cyan→green→yellow→red */
function heightToColor(t: number): THREE.Color {
  const c = Math.max(0, Math.min(1, t));
  const stops = [
    { t: 0.0, r: 0.15, g: 0.25, b: 0.85 },
    { t: 0.25, r: 0.0, g: 0.75, b: 0.85 },
    { t: 0.5, r: 0.15, g: 0.8, b: 0.3 },
    { t: 0.75, r: 0.9, g: 0.8, b: 0.15 },
    { t: 1.0, r: 0.9, g: 0.2, b: 0.15 },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (c <= stops[i + 1].t) {
      const local = (c - stops[i].t) / (stops[i + 1].t - stops[i].t);
      const s = Math.sin(local * Math.PI * 0.5);
      return new THREE.Color(
        stops[i].r + (stops[i + 1].r - stops[i].r) * s,
        stops[i].g + (stops[i + 1].g - stops[i].g) * s,
        stops[i].b + (stops[i + 1].b - stops[i].b) * s,
      );
    }
  }
  const last = stops[stops.length - 1];
  return new THREE.Color(last.r, last.g, last.b);
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function ParametricPlot3D({
  xExpr,
  yExpr,
  zExpr,
  tRange,
  params,
  color,
  traceT,
  showVelocity = false,
  resolution = 500,
}: ParametricPlot3DProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.ArrowHelper>(null);

  const paramKey = Object.entries(params)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');

  // Build the curve geometry
  const { tubeGeometry, tracePos, velocityDir } = useMemo(() => {
    const cx = safeCompile(xExpr);
    const cy = safeCompile(yExpr);
    const cz = safeCompile(zExpr);

    if (!cx || !cy || !cz) {
      return { tubeGeometry: null, tracePos: null, velocityDir: null };
    }

    const scope: Record<string, number> = { ...params, t: 0 };
    const [tMin, tMax] = tRange;
    const dt = (tMax - tMin) / resolution;

    const points: THREE.Vector3[] = [];
    const zValues: number[] = [];

    for (let i = 0; i <= resolution; i++) {
      const t = tMin + i * dt;
      scope.t = t;
      const x = safeEval(cx, scope);
      const y = safeEval(cy, scope);
      const z = safeEval(cz, scope);
      // Three.js Y-up: mathZ → Y axis
      points.push(new THREE.Vector3(x, z, y));
      zValues.push(z);
    }

    if (points.length < 2) {
      return { tubeGeometry: null, tracePos: null, velocityDir: null };
    }

    // Build tube
    const path = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    const geo = new THREE.TubeGeometry(path, resolution, 0.06, 8, false);

    // Height-based vertex coloring
    let zMin = Infinity;
    let zMax = -Infinity;
    for (const z of zValues) {
      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;
    }
    if (zMin === zMax) {
      zMin -= 1;
      zMax += 1;
    }

    const posAttr = geo.getAttribute('position');
    const colors = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      // Use Y (which is mathZ) for coloring
      const yVal = posAttr.getY(i);
      const norm = (yVal - zMin) / (zMax - zMin);
      const c = heightToColor(norm);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Trace point calculation
    let tp: THREE.Vector3 | null = null;
    let vd: THREE.Vector3 | null = null;

    if (traceT !== undefined) {
      const tVal = tMin + traceT * (tMax - tMin);
      scope.t = tVal;
      const px = safeEval(cx, scope);
      const py = safeEval(cy, scope);
      const pz = safeEval(cz, scope);
      tp = new THREE.Vector3(px, pz, py);

      if (showVelocity) {
        const h = 0.001;
        scope.t = tVal - h;
        const x1 = safeEval(cx, scope);
        const y1 = safeEval(cy, scope);
        const z1 = safeEval(cz, scope);
        scope.t = tVal + h;
        const x2 = safeEval(cx, scope);
        const y2 = safeEval(cy, scope);
        const z2 = safeEval(cz, scope);

        const dxdt = (x2 - x1) / (2 * h);
        const dydt = (y2 - y1) / (2 * h);
        const dzdt = (z2 - z1) / (2 * h);
        vd = new THREE.Vector3(dxdt, dzdt, dydt).normalize();
      }
    }

    return { tubeGeometry: geo, tracePos: tp, velocityDir: vd };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xExpr, yExpr, zExpr, paramKey, tRange[0], tRange[1], resolution, traceT, showVelocity]);

  if (!tubeGeometry) return null;

  const baseColor = new THREE.Color(color);

  return (
    <group>
      {/* Tube curve */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.4}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow line along center */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Trace dot */}
      {tracePos && (
        <mesh ref={dotRef} position={tracePos}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive={baseColor} emissiveIntensity={2} />
        </mesh>
      )}

      {/* Velocity arrow */}
      {tracePos && velocityDir && (
        <arrowHelper
          ref={arrowRef}
          args={[velocityDir, tracePos, 1.5, 0xf59e0b, 0.2, 0.1]}
        />
      )}
    </group>
  );
}
