import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Types ──────────────────────────────────────────────── */
interface MouseState {
  x: number;
  y: number;
}

/* ─── Energy Rings ───────────────────────────────────────── */
const EnergyRings: React.FC = () => {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);

  const ringConfigs = useMemo(
    () => [
      { radius: 0.8, tube: 0.004, opacity: 0.6, tiltX: 0.4, tiltZ: 0.2, speed: 0.6, ref: ring1 },
      { radius: 1.1, tube: 0.004, opacity: 0.4, tiltX: 1.1, tiltZ: -0.3, speed: -0.45, ref: ring2 },
      { radius: 1.4, tube: 0.004, opacity: 0.2, tiltX: 0.2, tiltZ: 0.7, speed: 0.3, ref: ring3 },
    ],
    []
  );

  useFrame((_, delta) => {
    ringConfigs.forEach((cfg) => {
      if (cfg.ref.current) {
        cfg.ref.current.rotation.z += delta * cfg.speed;
      }
    });
  });

  return (
    <>
      {ringConfigs.map((cfg, i) => (
        <mesh
          key={i}
          ref={cfg.ref}
          rotation={[cfg.tiltX, 0, cfg.tiltZ]}
          position={[0, 0, 0]}
        >
          <torusGeometry args={[cfg.radius, cfg.tube, 16, 128]} />
          <meshStandardMaterial
            color="#CCFF00"
            emissive="#CCFF00"
            emissiveIntensity={0.8}
            opacity={cfg.opacity}
            transparent
          />
        </mesh>
      ))}
    </>
  );
};

/* ─── Particles ──────────────────────────────────────────── */
interface ParticleData {
  pos: [number, number, number];
  offset: number;
  speed: number;
}

const Particles: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = 100;

  const particles = useMemo<ParticleData[]>(() => {
    const arr: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 1.3;
      arr.push({
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ],
        offset: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      const drift = Math.sin(t * p.speed + p.offset) * 0.08;
      dummy.position.set(p.pos[0], p.pos[1] + drift, p.pos[2]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.008, 4, 4]} />
      <meshStandardMaterial
        color="#CCFF00"
        emissive="#CCFF00"
        emissiveIntensity={1}
        opacity={0.35}
        transparent
      />
    </instancedMesh>
  );
};

/* ─── Ground Disc ────────────────────────────────────────── */
const GroundDisc: React.FC = () => {
  const discRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (discRef.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.03;
      discRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <circleGeometry args={[1.2, 64]} />
      <meshStandardMaterial
        color="#CCFF00"
        emissive="#CCFF00"
        emissiveIntensity={0.5}
        opacity={0.06}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/* ─── Html Badge ─────────────────────────────────────────── */
interface BadgeProps {
  position: [number, number, number];
  title: string;
  value: string;
  subtitle?: string;
}

const StatBadge: React.FC<BadgeProps> = ({ position, title, value, subtitle }) => (
  <Html position={position} center>
    <div
      style={{
        background: 'rgba(0,0,0,0.82)',
        border: '1px solid rgba(204,255,0,0.2)',
        borderRadius: '12px',
        padding: '8px 14px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        animation: 'badgeFloat 3s ease-in-out infinite',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px',
          color: '#666',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '28px',
          color: '#CCFF00',
          lineHeight: 1,
          letterSpacing: '0.04em',
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '11px',
            color: '#CCFF00',
            opacity: 0.7,
            letterSpacing: '0.06em',
            marginTop: '2px',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  </Html>
);

/* ─── Athlete Scene ──────────────────────────────────────── */
interface AthleteSceneProps {
  mouse: React.RefObject<MouseState>;
}

const AthleteScene: React.FC<AthleteSceneProps> = ({ mouse }) => {
  const athleteGroupRef = useRef<THREE.Group>(null!);
  const torsoRef = useRef<THREE.Mesh>(null!);
  const rightUpperArmRef = useRef<THREE.Mesh>(null!);
  const leftUpperArmRef = useRef<THREE.Mesh>(null!);
  const rightUpperLegRef = useRef<THREE.Mesh>(null!);
  const leftUpperLegRef = useRef<THREE.Mesh>(null!);

  /* Geometries */
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.18, 8, 8), []);
  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.09, 0.15, 8), []);
  const torsoGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.16, 0.55, 8), []);
  const shoulderGeo = useMemo(() => new THREE.SphereGeometry(0.11, 8, 8), []);
  const upperArmGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.06, 0.32, 8), []);
  const lowerArmGeo = useMemo(() => new THREE.CylinderGeometry(0.055, 0.045, 0.28, 8), []);
  const hipsGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.16, 0.2, 8), []);
  const upperLegGeo = useMemo(() => new THREE.CylinderGeometry(0.09, 0.075, 0.42, 8), []);
  const lowerLegGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.055, 0.38, 8), []);
  const footGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.06, 0.2), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    /* Breathe */
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.008;
    }

    /* Arm pump */
    if (rightUpperArmRef.current) {
      rightUpperArmRef.current.rotation.x = Math.sin(t * 2) * 0.3;
    }
    if (leftUpperArmRef.current) {
      leftUpperArmRef.current.rotation.x = Math.sin(t * 2 + Math.PI) * 0.2;
    }

    /* Leg swing */
    if (rightUpperLegRef.current) {
      rightUpperLegRef.current.rotation.x = Math.sin(t * 2) * 0.15;
    }
    if (leftUpperLegRef.current) {
      leftUpperLegRef.current.rotation.x = Math.sin(t * 2 + Math.PI) * 0.15;
    }

    /* Mouse tracking + slow spin */
    if (athleteGroupRef.current) {
      const targetY = mouse.current ? mouse.current.x * 0.5 : 0;
      const targetX = mouse.current ? mouse.current.y * 0.1 : 0;
      athleteGroupRef.current.rotation.y +=
        (targetY + athleteGroupRef.current.rotation.y * 0.004 - athleteGroupRef.current.rotation.y) * 0.05 + 0.004;
      athleteGroupRef.current.rotation.x +=
        (targetX - athleteGroupRef.current.rotation.x) * 0.05;
    }
  });

  const solidMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#0D0D0D', roughness: 0.3, metalness: 0.7 }),
    []
  );
  const wireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#CCFF00',
        opacity: 0.08,
        transparent: true,
        wireframe: true,
      }),
    []
  );


  return (
    <group ref={athleteGroupRef} position={[0, 0, 0]}>

      {/* HEAD */}
      <mesh position={[0, 1.55, 0]} geometry={headGeo} material={solidMat}>
        <mesh scale={1.02} geometry={headGeo} material={wireMat} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 1.3, 0]} geometry={neckGeo} material={solidMat}>
        <mesh scale={1.02} geometry={neckGeo} material={wireMat} />
      </mesh>

      {/* TORSO */}
      <mesh ref={torsoRef} position={[0, 0.9, 0]} geometry={torsoGeo} material={solidMat}>
        <mesh scale={1.02} geometry={torsoGeo} material={wireMat} />
      </mesh>

      {/* LEFT SHOULDER */}
      <mesh position={[-0.28, 1.15, 0]} geometry={shoulderGeo} material={solidMat}>
        <mesh scale={1.02} geometry={shoulderGeo} material={wireMat} />
      </mesh>

      {/* RIGHT SHOULDER */}
      <mesh position={[0.28, 1.15, 0]} geometry={shoulderGeo} material={solidMat}>
        <mesh scale={1.02} geometry={shoulderGeo} material={wireMat} />
      </mesh>

      {/* LEFT UPPER ARM — angled 35deg */}
      <mesh
        ref={leftUpperArmRef}
        position={[-0.38, 0.95, 0]}
        rotation={[THREE.MathUtils.degToRad(35), 0, THREE.MathUtils.degToRad(-15)]}
        geometry={upperArmGeo}
        material={solidMat}
      >
        <mesh scale={1.02} geometry={upperArmGeo} material={wireMat} />
      </mesh>

      {/* RIGHT UPPER ARM — raised 60deg */}
      <mesh
        ref={rightUpperArmRef}
        position={[0.38, 1.0, 0]}
        rotation={[THREE.MathUtils.degToRad(-60), 0, THREE.MathUtils.degToRad(20)]}
        geometry={upperArmGeo}
        material={solidMat}
      >
        <mesh scale={1.02} geometry={upperArmGeo} material={wireMat} />
      </mesh>

      {/* LEFT LOWER ARM */}
      <mesh
        position={[-0.46, 0.68, 0]}
        rotation={[THREE.MathUtils.degToRad(20), 0, THREE.MathUtils.degToRad(-8)]}
        geometry={lowerArmGeo}
        material={solidMat}
      >
        <mesh scale={1.02} geometry={lowerArmGeo} material={wireMat} />
      </mesh>

      {/* RIGHT LOWER ARM */}
      <mesh
        position={[0.52, 0.78, 0]}
        rotation={[THREE.MathUtils.degToRad(-40), 0, THREE.MathUtils.degToRad(12)]}
        geometry={lowerArmGeo}
        material={solidMat}
      >
        <mesh scale={1.02} geometry={lowerArmGeo} material={wireMat} />
      </mesh>

      {/* HIPS */}
      <mesh position={[0, 0.53, 0]} geometry={hipsGeo} material={solidMat}>
        <mesh scale={1.02} geometry={hipsGeo} material={wireMat} />
      </mesh>

      {/* LEFT UPPER LEG */}
      <mesh ref={leftUpperLegRef} position={[-0.12, 0.13, 0]} geometry={upperLegGeo} material={solidMat}>
        <mesh scale={1.02} geometry={upperLegGeo} material={wireMat} />
      </mesh>

      {/* RIGHT UPPER LEG — angled 20deg forward */}
      <mesh
        ref={rightUpperLegRef}
        position={[0.12, 0.13, 0]}
        rotation={[THREE.MathUtils.degToRad(20), 0, 0]}
        geometry={upperLegGeo}
        material={solidMat}
      >
        <mesh scale={1.02} geometry={upperLegGeo} material={wireMat} />
      </mesh>

      {/* LEFT LOWER LEG */}
      <mesh position={[-0.12, -0.38, 0]} geometry={lowerLegGeo} material={solidMat}>
        <mesh scale={1.02} geometry={lowerLegGeo} material={wireMat} />
      </mesh>

      {/* RIGHT LOWER LEG */}
      <mesh position={[0.12, -0.38, 0.08]} geometry={lowerLegGeo} material={solidMat}>
        <mesh scale={1.02} geometry={lowerLegGeo} material={wireMat} />
      </mesh>

      {/* LEFT FOOT */}
      <mesh position={[-0.12, -0.78, 0.04]} geometry={footGeo} material={solidMat}>
        <mesh scale={1.02} geometry={footGeo} material={wireMat} />
      </mesh>

      {/* RIGHT FOOT */}
      <mesh position={[0.12, -0.78, 0.12]} geometry={footGeo} material={solidMat}>
        <mesh scale={1.02} geometry={footGeo} material={wireMat} />
      </mesh>

      {/* ENERGY RINGS */}
      <EnergyRings />

      {/* STAT BADGES */}
      <StatBadge
        position={[1.2, 1.5, 0]}
        title="Pulse Score"
        value="847"
      />
      <StatBadge
        position={[-1.4, 0.8, 0]}
        title="Squad Chemistry"
        value="94%"
      />
      <StatBadge
        position={[1.0, -0.5, 0]}
        title="Level 41"
        value="ELITE"
        subtitle="PHANTOM"
      />
    </group>
  );
};

/* ─── Mouse Tracker ──────────────────────────────────────── */
const MouseTracker: React.FC<{ mouse: React.RefObject<MouseState> }> = ({ mouse }) => {
  const { size } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouse.current) {
        mouse.current.x = (e.clientX / size.width - 0.5) * 2;
        mouse.current.y = -(e.clientY / size.height - 0.5) * 2;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouse, size]);

  return null;
};

/* ─── Scan Line Overlay ──────────────────────────────────── */
const ScanLine: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 10,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, #CCFF00 50%, transparent 100%)',
        opacity: 0.15,
        animation: 'scanline 4s linear infinite',
      }}
    />
    <style>{`
      @keyframes scanline {
        0%   { top: -2px; }
        100% { top: 100%; }
      }
      @keyframes badgeFloat {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-6px); }
      }
    `}</style>
  </div>
);

/* ─── Main Export ────────────────────────────────────────── */
const AthleteCanvas: React.FC = () => {
  const mouseRef = useRef<MouseState>({ x: 0, y: 0 });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <MouseTracker mouse={mouseRef} />

        {/* Lighting */}
        <ambientLight color="#111111" intensity={0.4} />
        <pointLight color="#CCFF00" intensity={3} position={[2, 3, 2]} />
        <pointLight color="#003300" intensity={1.5} position={[-2, 1, -1]} />
        <spotLight color="#ffffff" intensity={1} position={[0, 5, 3]} angle={0.4} penumbra={0.5} />

        {/* Athlete */}
        <AthleteScene mouse={mouseRef} />

        {/* Particles */}
        <Particles />

        {/* Ground */}
        <GroundDisc />
      </Canvas>

      {/* Scan Line (DOM overlay) */}
      <ScanLine />
    </div>
  );
};

export default AthleteCanvas;
export { AthleteCanvas };
