import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { compile, type EvalFunction } from 'mathjs';
import { useFunctionStore } from '../store/functionStore';
import { useViewStore } from '../store/viewStore';
import type { MathFunction } from '../types/function';

/* ------------------------------------------------------------------ */
/*  Color mapping: height → blue → cyan → green → yellow → red        */
/* ------------------------------------------------------------------ */

function heightToColor(t: number): { r: number; g: number; b: number } {
  const clamped = Math.max(0, Math.min(1, t));

  // 5-stop gradient: blue(0) → cyan(0.25) → green(0.5) → yellow(0.75) → red(1)
  const stops = [
    { t: 0.0, r: 0.15, g: 0.25, b: 0.85 },
    { t: 0.25, r: 0.0, g: 0.75, b: 0.85 },
    { t: 0.5, r: 0.15, g: 0.8, b: 0.3 },
    { t: 0.75, r: 0.9, g: 0.8, b: 0.15 },
    { t: 1.0, r: 0.9, g: 0.2, b: 0.15 },
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped <= stops[i + 1].t) {
      const local = (clamped - stops[i].t) / (stops[i + 1].t - stops[i].t);
      const s = Math.sin(local * Math.PI * 0.5); // smooth ease
      return {
        r: stops[i].r + (stops[i + 1].r - stops[i].r) * s,
        g: stops[i].g + (stops[i + 1].g - stops[i].g) * s,
        b: stops[i].b + (stops[i + 1].b - stops[i].b) * s,
      };
    }
  }

  return stops[stops.length - 1];
}

/* ------------------------------------------------------------------ */
/*  Build surface geometry from expression                             */
/* ------------------------------------------------------------------ */

interface SurfaceData {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  zMin: number;
  zMax: number;
}

function buildSurfaceGeometry(
  expression: string,
  params: Array<{ name: string; value: number }>,
  xRange: [number, number],
  yRange: [number, number],
  resolution: number = 80,
  is2D: boolean = false,
): SurfaceData | null {
  let compiled: EvalFunction;
  try {
    compiled = compile(expression);
  } catch {
    return null;
  }

  const vertexCount = (resolution + 1) * (resolution + 1);
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indexCount = resolution * resolution * 6;
  const indices = new Uint32Array(indexCount);

  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;

  const scope: Record<string, number> = {};
  params.forEach((p) => {
    scope[p.name] = p.value;
  });

  let zMin = Infinity;
  let zMax = -Infinity;
  const zValues: number[] = [];

  // First pass: compute z values and find range
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      scope.x = x;
      if (!is2D) {
        scope.y = y;
      }

      let z: number;
      try {
        z = compiled.evaluate(scope);
        if (!isFinite(z) || isNaN(z)) z = 0;
      } catch {
        z = 0;
      }

      z = Math.max(-10, Math.min(10, z));
      zValues.push(z);

      if (z < zMin) zMin = z;
      if (z > zMax) zMax = z;
    }
  }

  if (zMin === zMax) {
    zMin -= 1;
    zMax += 1;
  }

  // Second pass: fill buffers with normalized colors
  let idx = 0;
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      const z = zValues[idx];

      const vi = idx * 3;
      // Three.js Y-up convention: math-Y maps to Z, math-Z maps to Y
      positions[vi] = x;
      positions[vi + 1] = z;
      positions[vi + 2] = y;

      const t = (z - zMin) / (zMax - zMin);
      const color = heightToColor(t);
      colors[vi] = color.r;
      colors[vi + 1] = color.g;
      colors[vi + 2] = color.b;

      idx++;
    }
  }

  // Generate triangle indices
  let ii = 0;
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (resolution + 1) + j;
      const d = c + 1;

      indices[ii++] = a;
      indices[ii++] = b;
      indices[ii++] = c;

      indices[ii++] = b;
      indices[ii++] = d;
      indices[ii++] = c;
    }
  }

  return { positions, colors, indices, zMin, zMax };
}

/* ------------------------------------------------------------------ */
/*  Surface mesh component                                             */
/* ------------------------------------------------------------------ */

interface SurfaceMeshProps {
  fn: MathFunction;
  xRange: [number, number];
  yRange: [number, number];
  resolution?: number;
  wireframe: boolean;
  onHover?: (point: { x: number; y: number; z: number } | null) => void;
}

function SurfaceMesh({
  fn,
  xRange,
  yRange,
  resolution = 80,
  wireframe,
  onHover,
}: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  const paramValues = fn.params.map((p) => p.value).join(',');
  const is2D = fn.dimension === '2d';

  const surfaceData = useMemo(() => {
    return buildSurfaceGeometry(
      fn.expression,
      fn.params,
      xRange,
      yRange,
      resolution,
      is2D,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn.expression, paramValues, xRange[0], xRange[1], yRange[0], yRange[1], resolution, is2D]);

  const geometry = useMemo(() => {
    if (!surfaceData) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(surfaceData.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(surfaceData.colors, 3));
    geo.setIndex(new THREE.BufferAttribute(surfaceData.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [surfaceData]);

  const wireframeGeo = useMemo(() => {
    if (!geometry) return null;
    return new THREE.WireframeGeometry(geometry);
  }, [geometry]);

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (onHover) {
        const p = e.point;
        // Convert back from Three.js coords: x stays, z→mathY, y→mathZ
        onHover({ x: p.x, y: p.z, z: p.y });
      }
    },
    [onHover],
  );

  const handlePointerLeave = useCallback(() => {
    if (onHover) onHover(null);
  }, [onHover]);

  if (!geometry) return null;

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.55}
          metalness={0.1}
          flatShading={false}
        />
      </mesh>
      {wireframe && wireframeGeo && (
        <lineSegments ref={wireframeRef} geometry={wireframeGeo}>
          <lineBasicMaterial color="#ffffff" opacity={0.06} transparent />
        </lineSegments>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Axis labels                                                        */
/* ------------------------------------------------------------------ */

function AxisLabels() {
  const labelColor = '#8888a0';
  const fontSize = 0.35;
  return (
    <group>
      <Text position={[6, 0, 0]} fontSize={fontSize} color={labelColor} anchorX="center">
        X
      </Text>
      <Text position={[0, 6, 0]} fontSize={fontSize} color={labelColor} anchorX="center">
        Z
      </Text>
      <Text position={[0, 0, 6]} fontSize={fontSize} color={labelColor} anchorX="center">
        Y
      </Text>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Axis lines (thin colored lines along each axis)                    */
/* ------------------------------------------------------------------ */

function AxisLines() {
  return (
    <group>
      {/* X axis - red */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-10, 0, 0, 10, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" opacity={0.5} transparent />
      </line>
      {/* Y axis (Three.js up = Z math) - blue */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -10, 0, 0, 10, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
      </line>
      {/* Z axis (Three.js Z = Y math) - green */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -10, 0, 0, 10]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" opacity={0.5} transparent />
      </line>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera controller with reset support                               */
/* ------------------------------------------------------------------ */

const DEFAULT_CAMERA: [number, number, number] = [6, 5, 6];

interface CameraControllerProps {
  resetTrigger: number;
}

function CameraController({ resetTrigger }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      camera.position.set(...DEFAULT_CAMERA);
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.12}
      minDistance={2}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.85}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Scene content                                                      */
/* ------------------------------------------------------------------ */

interface SceneProps {
  functions3D: MathFunction[];
  wireframe: boolean;
  resetTrigger: number;
  onHover: (point: { x: number; y: number; z: number } | null) => void;
}

function Scene({ functions3D, wireframe, resetTrigger, onHover }: SceneProps) {
  const xMin = useViewStore((s) => s.xMin);
  const xMax = useViewStore((s) => s.xMax);
  const yMin = useViewStore((s) => s.yMin);
  const yMax = useViewStore((s) => s.yMax);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 8, -6]} intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.2} />
      <Environment preset="night" />

      {/* Camera controls */}
      <CameraController resetTrigger={resetTrigger} />

      {/* Floor grid */}
      <Grid
        args={[20, 20]}
        position={[0, -10.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a2a3a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a3a4a"
        fadeDistance={25}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Axis lines & labels */}
      <AxisLines />
      <AxisLabels />

      {/* Surface meshes */}
      {functions3D.map((fn) => (
        <SurfaceMesh
          key={fn.id}
          fn={fn}
          xRange={[xMin, xMax]}
          yRange={[yMin, yMax]}
          wireframe={wireframe}
          onHover={onHover}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip overlay                                                    */
/* ------------------------------------------------------------------ */

interface TooltipProps {
  point: { x: number; y: number; z: number } | null;
}

function CoordinateTooltip({ point }: TooltipProps) {
  if (!point) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-4 left-4 rounded-lg px-3 py-2 font-mono text-xs"
      style={{
        background: 'rgba(17, 17, 24, 0.9)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ color: '#ef4444' }}>x</span>={point.x.toFixed(2)}{' '}
      <span style={{ color: '#22c55e' }}>y</span>={point.y.toFixed(2)}{' '}
      <span style={{ color: '#3b82f6' }}>z</span>={point.z.toFixed(2)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Canvas3D component                                            */
/* ------------------------------------------------------------------ */

export default function Canvas3D() {
  const functions = useFunctionStore((s) => s.functions);
  const [wireframe, setWireframe] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [hoverPoint, setHoverPoint] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  // Collect all visible 3D functions + 2D functions shown as extruded surfaces
  const renderableFunctions = useMemo(
    () => functions.filter((f) => f.visible),
    [functions],
  );

  const handleResetCamera = useCallback(() => {
    setResetTrigger((n) => n + 1);
  }, []);

  return (
    <div className="relative h-full w-full" style={{ background: '#0a0a0f' }}>
      <Canvas
        camera={{ position: DEFAULT_CAMERA, fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        style={{ background: '#0a0a0f' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 20, 40]} />
        <Scene
          functions3D={renderableFunctions}
          wireframe={wireframe}
          resetTrigger={resetTrigger}
          onHover={setHoverPoint}
        />
      </Canvas>

      {/* Coordinate tooltip */}
      <CoordinateTooltip point={hoverPoint} />

      {/* Floating controls */}
      <div
        className="absolute right-3 top-3 flex flex-col gap-1.5"
        style={{
          background: 'rgba(17, 17, 24, 0.85)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.4rem',
          backdropFilter: 'blur(12px)',
        }}
      >
        <ControlButton
          title="Reset Camera"
          onClick={handleResetCamera}
          label="🎯"
        />
        <ControlButton
          title={wireframe ? 'Hide Wireframe' : 'Show Wireframe'}
          onClick={() => setWireframe((w) => !w)}
          label="◇"
          active={wireframe}
        />
      </div>

      {/* Empty state */}
      {renderableFunctions.length === 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="text-center">
            <div className="text-3xl">🧊</div>
            <p className="mt-2 text-sm">Add a function to see the 3D surface</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small icon button                                                  */
/* ------------------------------------------------------------------ */

interface ControlButtonProps {
  title: string;
  onClick: () => void;
  label: string;
  active?: boolean;
}

function ControlButton({ title, onClick, label, active }: ControlButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-sm transition-colors hover:bg-white/10"
      style={{
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      {label}
    </button>
  );
}
