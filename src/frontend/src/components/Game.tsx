import { useThree } from "@react-three/fiber";
import { memo, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import Meteors from "./Meteors";
import Projectiles from "./Projectiles";
import Spaceship from "./Spaceship";
import StarField from "./StarField";

// Memoize lighting setup to prevent re-creation
const GameLighting = memo(() => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow={false} />
    <pointLight
      position={[0, 0, 8]}
      intensity={0.6}
      color="#4a9eff"
      distance={15}
      decay={2}
    />
  </>
));

GameLighting.displayName = "GameLighting";

function Game() {
  const { gameState, resetGame } = useGameState();
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (gameState === "menu") {
      resetGame();
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    // Set camera position for better view
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Ultra-optimized performance settings
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gl.shadowMap.enabled = false;
    gl.shadowMap.autoUpdate = false;
    gl.sortObjects = false;
    gl.info.autoReset = false;

    // Additional optimizations
    scene.matrixAutoUpdate = false;

    // Force compile scene for smoother initial render
    gl.compile(scene, camera);
  }, [camera, gl, scene]);

  return (
    <>
      <GameLighting />
      <StarField />

      {gameState !== "menu" && (
        <>
          <Spaceship />
          <Meteors />
          <Projectiles />
        </>
      )}
    </>
  );
}

export default memo(Game);
