import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { type Projectile, useGameState } from "../hooks/useGameState";

// Shared geometry for all projectiles (instancing optimization)
const sharedGeometry = new THREE.SphereGeometry(0.15, 8, 8);
const sharedMaterial = new THREE.MeshBasicMaterial({ color: "#fbbf24" });

// Memoize individual projectile component with shared resources
const ProjectileMesh = memo(
  ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh
        castShadow={false}
        receiveShadow={false}
        geometry={sharedGeometry}
        material={sharedMaterial}
      />
      <pointLight
        intensity={1}
        color="#fbbf24"
        distance={2}
        decay={2}
        castShadow={false}
      />
    </group>
  ),
);

ProjectileMesh.displayName = "ProjectileMesh";

// Explosion effect component with realistic circular radial burst
interface Explosion {
  id: number;
  position: [number, number, number];
  startTime: number;
  rotation: number;
}

const ExplosionEffect = memo(
  ({
    explosion,
    texture,
    currentTime,
  }: { explosion: Explosion; texture: THREE.Texture; currentTime: number }) => {
    const age = currentTime - explosion.startTime;
    const maxAge = 0.7; // 700ms explosion duration for more dramatic effect
    const progress = Math.min(age / maxAge, 1);

    // Radial burst effect: rapid expansion then slow fade
    const scale =
      progress < 0.25
        ? 0.2 + (progress / 0.25) * 2.3 // Fast expansion to 2.5 in first 25%
        : 2.5 + (progress - 0.25) * 0.8; // Slow expansion to 3.1

    // Smooth fade out with extended glow
    const opacity =
      progress < 0.15
        ? 1.0 // Full brightness initially
        : progress < 0.4
          ? 1.0 - ((progress - 0.15) / 0.25) * 0.2 // Fade to 0.8
          : 0.8 - ((progress - 0.4) / 0.6) * 0.8; // Fade to 0

    if (progress >= 1) return null;

    return (
      <group position={explosion.position}>
        {/* Main explosion sprite with rotation - using additive blending for circular effect */}
        <sprite scale={[scale, scale, 1]} rotation={[0, 0, explosion.rotation]}>
          <spriteMaterial
            map={texture}
            transparent
            opacity={opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={true}
            toneMapped={false}
          />
        </sprite>

        {/* Secondary glow layer for depth - counter-rotated */}
        <sprite
          scale={[scale * 0.8, scale * 0.8, 1]}
          rotation={[0, 0, -explosion.rotation * 0.6]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={opacity * 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={true}
            color="#ff9933"
            toneMapped={false}
          />
        </sprite>

        {/* Tertiary layer for more volume */}
        <sprite
          scale={[scale * 0.5, scale * 0.5, 1]}
          rotation={[0, 0, explosion.rotation * 1.5]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={opacity * 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={true}
            color="#ffaa44"
            toneMapped={false}
          />
        </sprite>

        {/* Bright flash at center during initial burst */}
        {progress < 0.25 && (
          <sprite scale={[scale * 0.4, scale * 0.4, 1]}>
            <spriteMaterial
              transparent
              opacity={(1 - progress / 0.25) * 0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
              color="#ffffff"
              toneMapped={false}
            />
          </sprite>
        )}

        {/* Outer ring effect for more realistic explosion */}
        {progress > 0.1 && progress < 0.6 && (
          <sprite
            scale={[scale * 1.2, scale * 1.2, 1]}
            rotation={[0, 0, -explosion.rotation * 0.3]}
          >
            <spriteMaterial
              map={texture}
              transparent
              opacity={opacity * 0.3 * (1 - (progress - 0.1) / 0.5)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
              color="#ff6600"
              toneMapped={false}
            />
          </sprite>
        )}

        {/* Point light for illumination effect */}
        <pointLight
          intensity={progress < 0.3 ? (1 - progress / 0.3) * 4 : 0}
          color="#ff6600"
          distance={scale * 2.5}
          decay={2}
          castShadow={false}
        />
      </group>
    );
  },
);

ExplosionEffect.displayName = "ExplosionEffect";

function Projectiles() {
  const {
    gameState,
    projectiles,
    setProjectiles,
    spaceshipPosition,
    meteors,
    setMeteors,
    incrementScore,
    decrementScore,
    playSoundEffect,
  } = useGameState();
  const projectileIdCounter = useRef(0);
  const explosionIdCounter = useRef(0);
  const shootTimer = useRef(0);
  const canShoot = useRef(true);
  const isMouseDown = useRef(false);
  const isSpacebarDown = useRef(false);
  const isMobileShootDown = useRef(false);
  const lastCollisionCheck = useRef(0);
  const lastLogicUpdate = useRef(0);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const currentTimeRef = useRef(0);

  // Load circular explosion texture
  const explosionTexture = useTexture(
    "/assets/generated/circular-explosion-radial-transparent.dim_256x256.png",
  );

  const fireProjectile = useCallback(() => {
    if (!canShoot.current) return;

    const newProjectile: Projectile = {
      id: projectileIdCounter.current++,
      position: [
        spaceshipPosition[0],
        spaceshipPosition[1] + 0.8,
        spaceshipPosition[2],
      ],
      velocity: [0, 15, 0],
    };
    setProjectiles((prev) => [...prev, newProjectile]);
    decrementScore(1);
    playSoundEffect("shoot");
    canShoot.current = false;
    setTimeout(() => {
      canShoot.current = true;
    }, 75);
  }, [spaceshipPosition, setProjectiles, decrementScore, playSoundEffect]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (gameState !== "playing") return;
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea")
      )
        return;
      isMouseDown.current = true;
      fireProjectile();
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (event.key === " ") {
        event.preventDefault();
        if (!isSpacebarDown.current) {
          isSpacebarDown.current = true;
          fireProjectile();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        isSpacebarDown.current = false;
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, fireProjectile]);

  useEffect(() => {
    const handleMobileShootStart = () => {
      if (gameState !== "playing") return;
      isMobileShootDown.current = true;
      fireProjectile();
    };

    const handleMobileShootEnd = () => {
      isMobileShootDown.current = false;
    };

    window.addEventListener("mobile-shoot-start", handleMobileShootStart);
    window.addEventListener("mobile-shoot-end", handleMobileShootEnd);

    return () => {
      window.removeEventListener("mobile-shoot-start", handleMobileShootStart);
      window.removeEventListener("mobile-shoot-end", handleMobileShootEnd);
    };
  }, [gameState, fireProjectile]);

  // Decoupled rendering and logic updates
  useFrame((state, delta) => {
    if (gameState !== "playing") return;

    const currentTime = state.clock.elapsedTime;
    currentTimeRef.current = currentTime;

    // Clean up old explosions
    setExplosions((prev) =>
      prev.filter((exp) => currentTime - exp.startTime < 0.7),
    );

    // Rapid fire when mouse, spacebar, or mobile shoot button is held
    if (
      isMouseDown.current ||
      isSpacebarDown.current ||
      isMobileShootDown.current
    ) {
      shootTimer.current += delta;
      if (shootTimer.current > 0.075) {
        shootTimer.current = 0;
        fireProjectile();
      }
    } else {
      shootTimer.current = 0;
    }

    // Logic updates throttled to ~20fps
    const shouldUpdateLogic = currentTime - lastLogicUpdate.current > 0.05;

    if (shouldUpdateLogic) {
      lastLogicUpdate.current = currentTime;

      // Update projectiles
      setProjectiles((prevProjectiles) => {
        const updatedProjectiles = prevProjectiles.map((projectile) => ({
          ...projectile,
          position: [
            projectile.position[0] + projectile.velocity[0] * 0.05,
            projectile.position[1] + projectile.velocity[1] * 0.05,
            projectile.position[2] + projectile.velocity[2] * 0.05,
          ] as [number, number, number],
        }));

        // Collision checks throttled to ~15fps
        const shouldCheckCollision =
          currentTime - lastCollisionCheck.current > 0.066;

        if (shouldCheckCollision) {
          const hitMeteorIds: number[] = [];
          const hitProjectileIds: number[] = [];
          const explosionData: {
            position: [number, number, number];
            rotation: number;
          }[] = [];
          let totalScore = 0;

          for (const projectile of updatedProjectiles) {
            const projectilePos = new THREE.Vector3(...projectile.position);
            for (const meteor of meteors) {
              if (hitMeteorIds.includes(meteor.id)) continue; // Skip already hit meteors

              const meteorPos = new THREE.Vector3(...meteor.position);
              const distance = projectilePos.distanceTo(meteorPos);

              // Enhanced collision detection with very generous radius
              // Using meteor.scale * 1.5 + 0.4 to ensure no shots pass through
              const collisionRadius = meteor.scale * 1.5 + 0.4;

              if (distance < collisionRadius) {
                if (!hitMeteorIds.includes(meteor.id)) {
                  hitMeteorIds.push(meteor.id);
                  // Random rotation for each explosion for variety
                  explosionData.push({
                    position: [...meteor.position],
                    rotation: Math.random() * Math.PI * 2,
                  });
                  const basePoints = 35 - Math.floor(meteor.scale * 30);
                  totalScore += basePoints;
                }
                if (!hitProjectileIds.includes(projectile.id)) {
                  hitProjectileIds.push(projectile.id);
                }
              }
            }
          }

          if (hitMeteorIds.length > 0) {
            // Remove hit meteors
            setMeteors((prev) =>
              prev.filter((m) => !hitMeteorIds.includes(m.id)),
            );

            // Create explosion effects for each destroyed meteor with random rotation
            const newExplosions = explosionData.map((data) => ({
              id: explosionIdCounter.current++,
              position: data.position,
              startTime: currentTime,
              rotation: data.rotation,
            }));
            setExplosions((prev) => [...prev, ...newExplosions]);

            // Play meteor explosion sound (once per collision batch)
            playSoundEffect("meteorExplosion");
            playSoundEffect("explosion");

            incrementScore(totalScore);
          }

          lastCollisionCheck.current = currentTime;

          return updatedProjectiles.filter(
            (p) => p.position[1] < 8 && !hitProjectileIds.includes(p.id),
          );
        }

        return updatedProjectiles.filter((p) => p.position[1] < 8);
      });
    }
  });

  return (
    <group>
      {projectiles.map((projectile) => (
        <ProjectileMesh key={projectile.id} position={projectile.position} />
      ))}
      {explosions.map((explosion) => (
        <ExplosionEffect
          key={explosion.id}
          explosion={explosion}
          texture={explosionTexture}
          currentTime={currentTimeRef.current}
        />
      ))}
    </group>
  );
}

export default memo(Projectiles);
