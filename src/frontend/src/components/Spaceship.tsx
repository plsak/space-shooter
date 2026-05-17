import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameState } from "../hooks/useGameState";

// Memoize lighting components
const SpaceshipLights = memo(() => (
  <>
    <pointLight
      position={[0, 0, 0.5]}
      intensity={2.0}
      color="#ffffff"
      distance={3.5}
      decay={2}
      castShadow={false}
    />
    <pointLight
      position={[0, 0, 2.5]}
      intensity={1.5}
      color="#f5f5f5"
      distance={4.0}
      decay={2}
      castShadow={false}
    />
    <pointLight
      position={[0, 0, -1.5]}
      intensity={1.0}
      color="#e5e5e5"
      distance={3.0}
      decay={2}
      castShadow={false}
    />
  </>
));

SpaceshipLights.displayName = "SpaceshipLights";

// Dynamic Ion Drive Effect - animated, glowing, visually energetic
const IonDrive = memo(() => {
  const ionRef1 = useRef<THREE.Mesh>(null);
  const ionRef2 = useRef<THREE.Mesh>(null);
  const ionRef3 = useRef<THREE.Mesh>(null);
  const glowRef1 = useRef<THREE.Mesh>(null);
  const glowRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Animate ion flames with pulsing effect
    if (ionRef1.current) {
      ionRef1.current.scale.y = 1 + Math.sin(time * 8) * 0.3;
      (ionRef1.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 + Math.sin(time * 8) * 0.2;
    }
    if (ionRef2.current) {
      ionRef2.current.scale.y = 1 + Math.sin(time * 10 + 1) * 0.25;
      (ionRef2.current.material as THREE.MeshBasicMaterial).opacity =
        0.6 + Math.sin(time * 10 + 1) * 0.2;
    }
    if (ionRef3.current) {
      ionRef3.current.scale.y = 1 + Math.sin(time * 12 + 2) * 0.2;
      (ionRef3.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 + Math.sin(time * 12 + 2) * 0.2;
    }

    // Animate glow rings
    if (glowRef1.current) {
      glowRef1.current.scale.setScalar(1 + Math.sin(time * 6) * 0.15);
      (glowRef1.current.material as THREE.MeshBasicMaterial).opacity =
        0.6 + Math.sin(time * 6) * 0.2;
    }
    if (glowRef2.current) {
      glowRef2.current.scale.setScalar(1 + Math.sin(time * 7 + 1) * 0.2);
      (glowRef2.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 + Math.sin(time * 7 + 1) * 0.15;
    }
  });

  return (
    <group position={[0, -0.7, 0]}>
      {/* Core ion flame - bright cyan/blue */}
      <mesh
        ref={ionRef1}
        position={[0, -0.3, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Middle ion flame - electric blue */}
      <mesh
        ref={ionRef2}
        position={[0, -0.4, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[0.2, 0.8, 8]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent={true}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer ion flame - deep blue with white tips */}
      <mesh
        ref={ionRef3}
        position={[0, -0.5, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[0.25, 1.0, 8]} />
        <meshBasicMaterial
          color="#2563eb"
          transparent={true}
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glow ring 1 - bright white/cyan */}
      <mesh
        ref={glowRef1}
        position={[0, 0.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[0.15, 0.25, 16]} />
        <meshBasicMaterial
          color="#dbeafe"
          transparent={true}
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glow ring 2 - electric blue */}
      <mesh
        ref={glowRef2}
        position={[0, 0.05, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[0.2, 0.35, 16]} />
        <meshBasicMaterial
          color="#93c5fd"
          transparent={true}
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light for ion drive glow */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={2.5}
        color="#60a5fa"
        distance={3.0}
        decay={2}
        castShadow={false}
      />

      {/* Additional particles for energy effect */}
      <mesh position={[0, -0.2, 0]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
});

IonDrive.displayName = "IonDrive";

// Original 3D spaceship model using Three.js primitives with silver tones
const SpaceshipModel = memo(() => {
  // Memoize materials for performance
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a1a1aa",
        metalness: 0.9,
        roughness: 0.2,
        emissive: "#71717a",
        emissiveIntensity: 0.2,
      }),
    [],
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d4d4d8",
        metalness: 0.95,
        roughness: 0.1,
        emissive: "#a1a1aa",
        emissiveIntensity: 0.3,
      }),
    [],
  );

  const cockpitMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e4e4e7",
        metalness: 0.95,
        roughness: 0.05,
        emissive: "#d4d4d8",
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  return (
    <group>
      {/* Main body - cone shape */}
      <mesh
        rotation={[Math.PI, 0, 0]}
        material={bodyMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[0.4, 1.2, 8]} />
      </mesh>

      {/* Cockpit - sphere */}
      <mesh
        position={[0, 0.5, 0]}
        material={cockpitMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
      </mesh>

      {/* Wings - left and right */}
      <mesh
        position={[-0.5, -0.1, 0]}
        rotation={[0, 0, Math.PI / 6]}
        material={accentMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[0.8, 0.1, 0.3]} />
      </mesh>
      <mesh
        position={[0.5, -0.1, 0]}
        rotation={[0, 0, -Math.PI / 6]}
        material={accentMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[0.8, 0.1, 0.3]} />
      </mesh>

      {/* Engine pods - left and right */}
      <mesh
        position={[-0.6, -0.5, 0]}
        material={bodyMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <cylinderGeometry args={[0.1, 0.15, 0.4, 8]} />
      </mesh>
      <mesh
        position={[0.6, -0.5, 0]}
        material={bodyMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <cylinderGeometry args={[0.1, 0.15, 0.4, 8]} />
      </mesh>

      {/* Engine glow rings */}
      <mesh
        position={[-0.6, -0.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color="#e4e4e7" transparent={true} opacity={0.7} />
      </mesh>
      <mesh
        position={[0.6, -0.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[0.12, 0.18, 16]} />
        <meshBasicMaterial color="#e4e4e7" transparent={true} opacity={0.7} />
      </mesh>
    </group>
  );
});

SpaceshipModel.displayName = "SpaceshipModel";

function Spaceship() {
  const meshRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const { gameState, setSpaceshipPosition, spaceshipPosition } = useGameState();

  const targetPosition = useRef(new THREE.Vector3(0, -3, 0));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const lastUpdateTime = useRef(0);
  const rafId = useRef<number>(0);

  // Memoize event handlers with requestAnimationFrame throttling
  const handleMouseMove = useMemo(() => {
    let scheduled = false;
    return (event: MouseEvent) => {
      if (gameState !== "playing" || scheduled) return;

      scheduled = true;
      rafId.current = requestAnimationFrame(() => {
        scheduled = false;

        const x = (event.clientX / size.width) * 2 - 1;
        const y = -(event.clientY / size.height) * 2 + 1;

        const vector = new THREE.Vector3(x, y, 0);
        vector.unproject(camera);

        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        targetPosition.current.set(
          THREE.MathUtils.clamp(pos.x, -8, 8),
          THREE.MathUtils.clamp(pos.y, -5, 5),
          0,
        );
      });
    };
  }, [camera, size, gameState]);

  const handleTouchMove = useMemo(() => {
    let scheduled = false;
    return (event: TouchEvent) => {
      if (gameState !== "playing" || scheduled) return;
      event.preventDefault();

      scheduled = true;
      rafId.current = requestAnimationFrame(() => {
        scheduled = false;

        const touch = event.touches[0];
        const x = (touch.clientX / size.width) * 2 - 1;
        const y = -(touch.clientY / size.height) * 2 + 1;

        const vector = new THREE.Vector3(x, y, 0);
        vector.unproject(camera);

        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        targetPosition.current.set(
          THREE.MathUtils.clamp(pos.x, -8, 8),
          THREE.MathUtils.clamp(pos.y, -5, 5),
          0,
        );
      });
    };
  }, [camera, size, gameState]);

  const handleKeyDown = useMemo(
    () => (event: KeyboardEvent) => {
      if (gameState !== "playing") return;

      const speed = 0.3;
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          velocity.current.y = speed;
          break;
        case "s":
        case "arrowdown":
          velocity.current.y = -speed;
          break;
        case "a":
        case "arrowleft":
          velocity.current.x = -speed;
          break;
        case "d":
        case "arrowright":
          velocity.current.x = speed;
          break;
      }
    },
    [gameState],
  );

  const handleKeyUp = useMemo(
    () => (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "s":
        case "arrowup":
        case "arrowdown":
          velocity.current.y = 0;
          break;
        case "a":
        case "d":
        case "arrowleft":
        case "arrowright":
          velocity.current.x = 0;
          break;
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleMouseMove, handleTouchMove, handleKeyDown, handleKeyUp]);

  // Optimized frame update with decoupled rendering and logic
  useFrame((state, _delta) => {
    if (!meshRef.current || gameState !== "playing") return;

    // Rendering updates (every frame for smoothness)
    const lerpFactor = 0.15;
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPosition.current.x + velocity.current.x,
      lerpFactor,
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetPosition.current.y + velocity.current.y,
      lerpFactor,
    );

    // Clamp position
    meshRef.current.position.x = THREE.MathUtils.clamp(
      meshRef.current.position.x,
      -8,
      8,
    );
    meshRef.current.position.y = THREE.MathUtils.clamp(
      meshRef.current.position.y,
      -5,
      5,
    );

    // Tilt based on movement for dynamic feel
    const tiltX = (targetPosition.current.y - meshRef.current.position.y) * 0.3;
    const tiltZ = (meshRef.current.position.x - targetPosition.current.x) * 0.2;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      tiltX,
      0.1,
    );
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      tiltZ,
      0.1,
    );

    // Logic updates (throttled to reduce state updates)
    const currentTime = state.clock.elapsedTime;
    if (currentTime - lastUpdateTime.current > 0.033) {
      // ~30fps for state updates
      setSpaceshipPosition([
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
      ]);
      lastUpdateTime.current = currentTime;
    }
  });

  return (
    <group ref={meshRef} position={spaceshipPosition}>
      {/* Silver-toned 3D spaceship model */}
      <SpaceshipModel />

      <SpaceshipLights />

      {/* Dynamic Ion Drive Effect */}
      <IonDrive />
    </group>
  );
}

export default memo(Spaceship);
