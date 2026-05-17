import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { type Meteor, useGameState } from "../hooks/useGameState";

// Shared geometries for instancing
const sharedGeometry = new THREE.IcosahedronGeometry(1, 1);

// Memoize individual meteor component with shared geometry
const MeteorMesh = memo(
  ({ meteor, texture }: { meteor: Meteor; texture: THREE.Texture }) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    return (
      <mesh
        position={meteor.position}
        rotation={meteor.rotation}
        scale={meteor.scale}
        castShadow={false}
        receiveShadow={false}
        geometry={sharedGeometry}
      >
        <meshStandardMaterial
          ref={materialRef}
          map={texture}
          roughness={0.8}
          metalness={0.3}
          emissive={meteor.emissive || "#ff6b35"}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  },
);

MeteorMesh.displayName = "MeteorMesh";

function Meteors() {
  const {
    gameState,
    meteors,
    setMeteors,
    spaceshipPosition,
    setGameState,
    playSoundEffect,
  } = useGameState();
  const spawnTimer = useRef(0);
  const meteorIdCounter = useRef(0);
  const lastCollisionCheck = useRef(0);
  const lastLogicUpdate = useRef(0);

  // Load realistic meteor textures
  const meteorTextures = {
    "realistic-small": useTexture(
      "/assets/generated/realistic-meteor-small.dim_256x256.png",
    ),
    "realistic-medium": useTexture(
      "/assets/generated/realistic-meteor-medium.dim_384x384.png",
    ),
    "realistic-large": useTexture(
      "/assets/generated/realistic-meteor-large.dim_512x512.png",
    ),
    metallic: useTexture("/assets/generated/metallic-meteor.dim_512x512.png"),
    volcanic: useTexture("/assets/generated/volcanic-meteor.dim_512x512.png"),
    comet: useTexture("/assets/generated/comet-meteor.dim_512x512.png"),
  };

  // Stable texture values — intentionally omitting meteorTextures from deps
  // because useTexture returns a new object reference each render but the
  // underlying texture objects are stable.
  // biome-ignore lint/correctness/useExhaustiveDependencies: meteorTextures identity changes every render
  const meteorTextureValues = useMemo(() => Object.values(meteorTextures), []);

  // Configure textures for performance
  useMemo(() => {
    for (const texture of meteorTextureValues) {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 2;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [meteorTextureValues]);

  // Decoupled rendering and logic updates
  useFrame((state, delta) => {
    if (gameState !== "playing") return;

    const currentTime = state.clock.elapsedTime;

    // Spawn meteors at increased rate
    spawnTimer.current += delta;
    if (spawnTimer.current > 0.5) {
      spawnTimer.current = 0;
      const scale = 0.3 + Math.random() * 0.5;

      // Higher probability of fast meteors: 60% fast, 25% medium, 15% slow
      const speedRoll = Math.random();
      let baseSpeed: number;

      if (speedRoll < 0.15) {
        baseSpeed = 0.6 + Math.random() * 0.3;
      } else if (speedRoll < 0.4) {
        baseSpeed = 1.0 + Math.random() * 0.4;
      } else {
        baseSpeed = 1.6 + Math.random() * 0.8;
      }

      // Apply 25% speed reduction
      const speed = baseSpeed * 0.75;

      // Determine texture type based on size and randomness for variety
      let textureType:
        | "realistic-small"
        | "realistic-medium"
        | "realistic-large"
        | "metallic"
        | "volcanic"
        | "comet";
      let emissiveColor: string;

      const typeRoll = Math.random();

      if (scale < 0.45) {
        // Small meteors - mostly realistic small, some special types
        if (typeRoll < 0.7) {
          textureType = "realistic-small";
          emissiveColor = "#ff6b35";
        } else if (typeRoll < 0.85) {
          textureType = "metallic";
          emissiveColor = "#8899aa";
        } else {
          textureType = "comet";
          emissiveColor = "#66ccff";
        }
      } else if (scale < 0.65) {
        // Medium meteors - variety of types
        if (typeRoll < 0.5) {
          textureType = "realistic-medium";
          emissiveColor = "#ff6b35";
        } else if (typeRoll < 0.7) {
          textureType = "volcanic";
          emissiveColor = "#ff4422";
        } else if (typeRoll < 0.85) {
          textureType = "metallic";
          emissiveColor = "#8899aa";
        } else {
          textureType = "comet";
          emissiveColor = "#66ccff";
        }
      } else {
        // Large meteors - all types possible
        if (typeRoll < 0.4) {
          textureType = "realistic-large";
          emissiveColor = "#ff6b35";
        } else if (typeRoll < 0.6) {
          textureType = "volcanic";
          emissiveColor = "#ff4422";
        } else if (typeRoll < 0.8) {
          textureType = "metallic";
          emissiveColor = "#8899aa";
        } else {
          textureType = "comet";
          emissiveColor = "#66ccff";
        }
      }

      const newMeteor: Meteor = {
        id: meteorIdCounter.current++,
        position: [(Math.random() - 0.5) * 16, 8, 0],
        velocity: [(Math.random() - 0.5) * 0.3, -speed, 0],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ],
        rotationSpeed: [
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        ],
        scale: scale,
        color: textureType,
        emissive: emissiveColor,
      };
      setMeteors((prev) => [...prev, newMeteor]);
    }

    // Logic updates throttled to ~20fps
    const shouldUpdateLogic = currentTime - lastLogicUpdate.current > 0.05;

    if (shouldUpdateLogic) {
      lastLogicUpdate.current = currentTime;

      // Batch update all meteors
      setMeteors((prevMeteors) => {
        const updatedMeteors = prevMeteors.map((meteor) => ({
          ...meteor,
          position: [
            meteor.position[0] + meteor.velocity[0] * 0.5,
            meteor.position[1] + meteor.velocity[1] * 0.5,
            meteor.position[2] + meteor.velocity[2] * 0.5,
          ] as [number, number, number],
          rotation: [
            meteor.rotation[0] + meteor.rotationSpeed[0] * 0.05,
            meteor.rotation[1] + meteor.rotationSpeed[1] * 0.05,
            meteor.rotation[2] + meteor.rotationSpeed[2] * 0.05,
          ] as [number, number, number],
        }));

        // Collision checks throttled to ~15fps
        const shouldCheckCollision =
          currentTime - lastCollisionCheck.current > 0.066;

        if (shouldCheckCollision) {
          const spaceshipPos = new THREE.Vector3(...spaceshipPosition);
          const collidedWithShip = updatedMeteors.some((meteor) => {
            const meteorPos = new THREE.Vector3(...meteor.position);
            const distance = meteorPos.distanceTo(spaceshipPos);
            return distance < meteor.scale * 0.8 + 0.5;
          });

          if (collidedWithShip) {
            playSoundEffect("gameOver");
            setGameState("gameOver");
            return prevMeteors;
          }
          lastCollisionCheck.current = currentTime;
        }

        // Remove off-screen meteors
        return updatedMeteors.filter((meteor) => meteor.position[1] > -8);
      });
    }
  });

  return (
    <group>
      {meteors.map((meteor) => {
        const textureType = meteor.color as keyof typeof meteorTextures;
        const texture =
          meteorTextures[textureType] || meteorTextures["realistic-medium"];

        return <MeteorMesh key={meteor.id} meteor={meteor} texture={texture} />;
      })}
    </group>
  );
}

export default memo(Meteors);
