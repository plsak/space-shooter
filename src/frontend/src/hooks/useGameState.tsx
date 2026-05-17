import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useSoundEffects } from "./useSoundEffects";

type GameState = "welcome" | "menu" | "playing" | "gameOver";

interface Meteor {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  rotationSpeed: [number, number, number];
  scale: number;
  color?: string;
  emissive?: string;
}

interface Projectile {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
}

interface GameStateContext {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  score: number;
  incrementScore: (amount: number) => void;
  decrementScore: (amount: number) => void;
  resetGame: () => void;
  spaceshipPosition: [number, number, number];
  setSpaceshipPosition: (pos: [number, number, number]) => void;
  meteors: Meteor[];
  setMeteors: (meteors: Meteor[] | ((prev: Meteor[]) => Meteor[])) => void;
  projectiles: Projectile[];
  setProjectiles: (
    projectiles: Projectile[] | ((prev: Projectile[]) => Projectile[]),
  ) => void;
  playSoundEffect: (type: import("./useSoundEffects").SoundType) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const GameStateContext = createContext<GameStateContext | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [score, setScore] = useState(0);
  const [spaceshipPosition, setSpaceshipPosition] = useState<
    [number, number, number]
  >([0, -3, 0]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const { playSoundEffect, soundEnabled, toggleSound } = useSoundEffects();

  const incrementScore = useCallback((amount: number) => {
    setScore((prev) => prev + amount);
  }, []);

  const decrementScore = useCallback((amount: number) => {
    setScore((prev) => Math.max(0, prev - amount)); // Prevent negative scores
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setSpaceshipPosition([0, -3, 0]);
    setMeteors([]);
    setProjectiles([]);
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        gameState,
        setGameState,
        score,
        incrementScore,
        decrementScore,
        resetGame,
        spaceshipPosition,
        setSpaceshipPosition,
        meteors,
        setMeteors,
        projectiles,
        setProjectiles,
        playSoundEffect,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within GameProvider");
  }
  return context;
}

export type { Meteor, Projectile };
