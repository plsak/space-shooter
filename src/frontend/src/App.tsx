import { Canvas } from "@react-three/fiber";
import { ThemeProvider } from "next-themes";
import { Suspense, memo } from "react";
import Game from "./components/Game";
import PerformanceOverlay from "./components/PerformanceOverlay";
import UI from "./components/UI";
import { Toaster } from "./components/ui/sonner";
import { GameProvider } from "./hooks/useGameState";

// Memoize Canvas to prevent unnecessary re-renders
const MemoizedCanvas = memo(() => (
  <Canvas
    camera={{ position: [0, 0, 10], fov: 75 }}
    gl={{
      antialias: false, // Disable for better performance
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
      logarithmicDepthBuffer: false,
    }}
    dpr={[1, 2]}
    frameloop="always"
    performance={{ min: 0.5 }}
    flat
    linear
  >
    <Suspense fallback={null}>
      <Game />
    </Suspense>
  </Canvas>
));

MemoizedCanvas.displayName = "MemoizedCanvas";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <GameProvider>
        <div className="relative h-screen w-screen overflow-hidden bg-black">
          <MemoizedCanvas />
          <UI />
          <Toaster />
          {import.meta.env.DEV && <PerformanceOverlay />}
        </div>
      </GameProvider>
    </ThemeProvider>
  );
}
