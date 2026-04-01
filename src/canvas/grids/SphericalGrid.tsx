import { useMemo } from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Spherical coordinate grid: latitude/longitude lines on a sphere    */
/* ------------------------------------------------------------------ */

const SEGMENTS = 128;
const ANGLE_STEP_DEG = 30;

/** Dark-theme colours */
const COLOR_GRID = '#2a2a3a';
const COLOR_MAJOR = '#3a3a4a';
const COLOR_ACCENT = '#6366f1';

/* ------------------------------------------------------------------ */
/*  Helper: generate a circle of points in 3D                          */
/* ------------------------------------------------------------------ */

function makeCirclePoints(
  radius: number,
  axis: 'x' | 'y' | 'z',
  angleDeg: number,
  segments: number,
  surfaceFn?: (theta: number, phi: number) => number,
): Float32Array {
  const pts = new Float32Array((segments + 1) * 3);

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;

    let x: number, y: number, z: number;

    if (axis === 'y') {
      // Latitude line: fixed polar angle (phi), sweep azimuthal (theta)
      const phi = (angleDeg * Math.PI) / 180;
      const r = surfaceFn ? surfaceFn(t, phi) : radius;
      x = r * Math.sin(phi) * Math.cos(t);
      y = r * Math.cos(phi);
      z = r * Math.sin(phi) * Math.sin(t);
    } else {
      // Longitude line: fixed azimuthal angle (theta), sweep polar angle (phi)
      const theta = (angleDeg * Math.PI) / 180;
      const phi = (i / segments) * Math.PI; // 0 → π
      const r = surfaceFn ? surfaceFn(theta, phi) : radius;
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi);
      z = r * Math.sin(phi) * Math.sin(theta);
    }

    pts[i * 3] = x;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = z;
  }

  return pts;
}

/* ------------------------------------------------------------------ */
/*  Individual line component                                          */
/* ------------------------------------------------------------------ */

interface GridLineProps {
  points: Float32Array;
  color: string;
  opacity: number;
}

function GridLine({ points, color, opacity }: GridLineProps) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const mat = new THREE.LineBasicMaterial({ color, opacity, transparent: true });
    return new THREE.Line(geo, mat);
  }, [points, color, opacity]);

  return <primitive object={lineObj} />;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface SphericalGridProps {
  radius?: number;
  opacity?: number;
  surfaceFunction?: (theta: number, phi: number) => number;
}

export default function SphericalGrid({
  radius = 5,
  opacity = 0.3,
  surfaceFunction,
}: SphericalGridProps) {
  const lines = useMemo(() => {
    const result: Array<{ key: string; points: Float32Array; color: string; opacity: number }> = [];

    // --- Latitude lines (parallels) every 30° of polar angle (phi) ---
    // phi = 0 is the north pole, phi = 180 is the south pole
    // skip 0° and 180° (degenerate single points)
    for (let phiDeg = ANGLE_STEP_DEG; phiDeg < 180; phiDeg += ANGLE_STEP_DEG) {
      const isEquator = phiDeg === 90;
      const isMajorLat = phiDeg % 60 === 0;
      const color = isEquator ? COLOR_ACCENT : isMajorLat ? COLOR_MAJOR : COLOR_GRID;
      const op = isEquator ? Math.min(opacity * 2, 1) : opacity;

      result.push({
        key: `lat-${phiDeg}`,
        points: makeCirclePoints(radius, 'y', phiDeg, SEGMENTS, surfaceFunction),
        color,
        opacity: op,
      });
    }

    // --- Longitude lines (meridians) every 30° of azimuthal angle (theta) ---
    // Each meridian is a half-great-circle from pole to pole;
    // opposite meridians (theta and theta+180) form a full great circle.
    // We only need 0–150° since the loop sweeps phi 0→π for each theta.
    for (let thetaDeg = 0; thetaDeg < 180; thetaDeg += ANGLE_STEP_DEG) {
      const isPrime = thetaDeg === 0;
      const is90 = thetaDeg === 90;
      const isAccent = isPrime || is90;
      const isMajorLon = thetaDeg % 60 === 0;
      const color = isAccent ? COLOR_ACCENT : isMajorLon ? COLOR_MAJOR : COLOR_GRID;
      const op = isAccent ? Math.min(opacity * 2, 1) : opacity;

      // Full great circle: sweep both the meridian and its opposite
      const pts = new Float32Array((SEGMENTS + 1) * 3);
      const thetaRad = (thetaDeg * Math.PI) / 180;

      for (let i = 0; i <= SEGMENTS; i++) {
        // Go from north pole (phi=0) to south pole (phi=π) and back via opposite meridian
        const frac = i / SEGMENTS;
        let phi: number, theta: number;

        if (frac <= 0.5) {
          phi = frac * 2 * Math.PI; // 0 → π
          theta = thetaRad;
        } else {
          phi = (1 - frac) * 2 * Math.PI; // π → 0
          theta = thetaRad + Math.PI;
        }

        const r = surfaceFunction ? surfaceFunction(theta, phi) : radius;
        pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pts[i * 3 + 1] = r * Math.cos(phi);
        pts[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }

      result.push({
        key: `lon-${thetaDeg}`,
        points: pts,
        color,
        opacity: op,
      });
    }

    // --- Three principal axis circles (always drawn as accent) ---

    // Equator (XZ plane, phi = 90°) — already covered above, so skip duplicate

    // Prime meridian circle (XY plane, theta=0 / theta=180) — already covered

    // 90° meridian circle (YZ plane, theta=90 / theta=270) — already covered

    return result;
  }, [radius, opacity, surfaceFunction]);

  return (
    <group>
      {lines.map((l) => (
        <GridLine
          key={l.key}
          points={l.points}
          color={l.color}
          opacity={l.opacity}
        />
      ))}
    </group>
  );
}
