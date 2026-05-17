import { memo, useEffect, useState } from "react";

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memory?: number;
}

function PerformanceOverlay() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
  });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let _lastFrameTime = lastTime;
    let animationFrameId: number;

    const updateStats = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update every second
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const frameTime = (currentTime - lastTime) / frameCount;

        const memory = (performance as { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize
          ? Math.round(
              (performance as { memory?: { usedJSHeapSize: number } }).memory!
                .usedJSHeapSize / 1048576,
            )
          : undefined;

        setStats({ fps, frameTime: Math.round(frameTime * 100) / 100, memory });

        frameCount = 0;
        lastTime = currentTime;
      }

      _lastFrameTime = currentTime;
      animationFrameId = requestAnimationFrame(updateStats);
    };

    animationFrameId = requestAnimationFrame(updateStats);

    // Toggle visibility with Ctrl+Shift+P
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!visible) return null;

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return "text-green-400";
    if (fps >= 30) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 font-mono text-xs pointer-events-none select-none">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">FPS:</span>
          <span className={`font-bold ${getFpsColor(stats.fps)}`}>
            {stats.fps}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60">Frame:</span>
          <span className="text-blue-400">{stats.frameTime}ms</span>
        </div>
        {stats.memory !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/60">Memory:</span>
            <span className="text-purple-400">{stats.memory}MB</span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 text-white/40 text-[10px]">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

export default memo(PerformanceOverlay);
