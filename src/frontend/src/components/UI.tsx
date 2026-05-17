import {
  AlertTriangle,
  BookOpen,
  Gamepad2,
  Rocket,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGameState } from "../hooks/useGameState";
import {
  useGamesPlayed,
  useHighScores,
  useIncrementGamesPlayed,
  useSubmitScore,
} from "../hooks/useQueries";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

export default function UI() {
  const {
    gameState,
    score,
    setGameState,
    resetGame,
    soundEnabled,
    toggleSound,
    playSoundEffect,
  } = useGameState();
  const [playerName, setPlayerName] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const submitScoreMutation = useSubmitScore();
  const incrementGamesPlayedMutation = useIncrementGamesPlayed();
  const { data: highScores, isLoading: highScoresLoading } = useHighScores();
  const { data: gamesPlayed } = useGamesPlayed();

  // Increment games played counter when game ends (not when it starts)
  // biome-ignore lint/correctness/useExhaustiveDependencies: mutate ref is stable
  useEffect(() => {
    if (gameState === "gameOver") {
      setScoreSubmitted(false);
      setPlayerName("");
      incrementGamesPlayedMutation.mutate();
    }
  }, [gameState]);

  const handleStart = () => {
    resetGame();
    playSoundEffect("shoot"); // warm up AudioContext on first user gesture
    setGameState("playing");
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await submitScoreMutation.mutateAsync({
        playerName: playerName.trim(),
        score: BigInt(score),
      });
      setScoreSubmitted(true);
      toast.success("Score submitted successfully!");
      setTimeout(() => setGameState("welcome"), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit score";
      toast.error(msg);
    }
  };

  const handleBackToWelcome = () => {
    setGameState("welcome");
  };

  const handleMobileShootStart = () => {
    window.dispatchEvent(new Event("mobile-shoot-start"));
  };

  const handleMobileShootEnd = () => {
    window.dispatchEvent(new Event("mobile-shoot-end"));
  };

  if (gameState === "playing") {
    return (
      <>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-4 sm:p-8">
          <div className="flex w-full items-start justify-between">
            <Card className="border-primary/20 bg-background/80 backdrop-blur-sm">
              <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                <Target className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Score
                  </p>
                  <p className="text-2xl font-bold text-primary sm:text-3xl">
                    {score}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground/60 sm:text-sm">
              <span className="hidden sm:inline">
                Move: Mouse or WASD/Arrows • Shoot: Hold Click or Spacebar
              </span>
              <span className="sm:hidden">Tap to move • Hold FIRE button</span>
            </p>
          </div>
        </div>

        {/* Mobile Shoot Button */}
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
          <button
            type="button"
            className="relative flex h-28 w-28 touch-none select-none items-center justify-center overflow-hidden rounded-lg shadow-2xl transition-transform active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #450a0a 100%)",
              boxShadow:
                "0 8px 32px rgba(185, 28, 28, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.3)",
              border: "2px solid rgba(220, 38, 38, 0.3)",
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMobileShootStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMobileShootEnd();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMobileShootStart();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              handleMobileShootEnd();
            }}
            onMouseLeave={(e) => {
              e.preventDefault();
              handleMobileShootEnd();
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)",
              }}
            />
            <span
              className="relative z-10 text-2xl font-bold tracking-widest"
              style={{
                color: "#ffffff",
                textShadow:
                  "0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 255, 255, 0.3)",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              FIRE
            </span>
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%)",
              }}
            />
          </button>
        </div>
      </>
    );
  }

  if (gameState === "gameOver") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:h-16 sm:w-16">
              <Rocket className="h-6 w-6 text-destructive sm:h-8 sm:w-8" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Game Over!</CardTitle>
            <CardDescription>Your spaceship was destroyed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center sm:p-6">
              <p className="text-sm text-muted-foreground">Final Score</p>
              <p className="text-4xl font-bold text-blue-400 sm:text-5xl">
                {score}
              </p>
            </div>

            {scoreSubmitted ? (
              <div className="rounded-lg bg-green-900/30 border border-green-500/30 p-4 text-center">
                <p className="font-semibold text-green-400">
                  ✓ Score submitted!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  data-ocid="gameover.input"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitScore()}
                  className="text-center"
                />
                <Button
                  data-ocid="gameover.submit_button"
                  onClick={handleSubmitScore}
                  disabled={submitScoreMutation.isPending}
                  size="lg"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                >
                  {submitScoreMutation.isPending
                    ? "Submitting..."
                    : "Submit Score"}
                </Button>
              </div>
            )}
            <Button
              data-ocid="gameover.back_button"
              onClick={handleBackToWelcome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Back to Welcome
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === "welcome") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-background/90 p-4">
        <ScrollArea className="h-full w-full">
          <div className="mx-auto w-full max-w-2xl py-8">
            <div className="space-y-6 lg:space-y-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:mb-6 sm:h-20 sm:w-20">
                  <Rocket className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                </div>
                <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  <span
                    className="text-3d-silver inline-block"
                    style={{
                      fontWeight: "900",
                      letterSpacing: "0.05em",
                      color: "#e5e5e5",
                      textShadow: `
                        0.5px 0.5px 0 #c0c0c0,
                        1px 1px 0 #b0b0b0,
                        1.5px 1.5px 0 #a0a0a0,
                        2px 2px 0 #909090,
                        2.5px 2.5px 0 #808080,
                        3px 3px 0 #707070,
                        3.5px 3.5px 0 #606060,
                        4px 4px 0 #505050,
                        4.5px 4.5px 5px rgba(0, 0, 0, 0.6),
                        5px 5px 7.5px rgba(0, 0, 0, 0.5),
                        6px 6px 10px rgba(0, 0, 0, 0.4),
                        0 0 15px rgba(255, 255, 255, 0.3)
                      `,
                      transform: "perspective(500px) rotateX(10deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    Space Shooter
                  </span>
                </h1>
                <p
                  className="text-lg sm:text-xl lg:text-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #a1a1aa 0%, #d4d4d8 25%, #f4f4f5 50%, #d4d4d8 75%, #a1a1aa 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow:
                      "0 0 20px rgba(244, 244, 245, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)",
                    filter:
                      "drop-shadow(0 3px 6px rgba(161, 161, 170, 0.4)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))",
                    fontWeight: "600",
                    letterSpacing: "0.02em",
                  }}
                >
                  Defend against the meteor storm
                </p>
              </div>

              <Card className="border-primary/20">
                <CardContent className="space-y-3 p-6 sm:space-y-4 sm:p-8">
                  <div className="flex items-center gap-2">
                    <Button
                      data-ocid="welcome.start_button"
                      onClick={handleStart}
                      size="lg"
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 text-base sm:text-lg"
                    >
                      Start Game
                    </Button>
                    <button
                      type="button"
                      data-ocid="welcome.sound_toggle"
                      onClick={toggleSound}
                      title={soundEnabled ? "Sound: ON" : "Sound: OFF"}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
                    <DialogTrigger asChild>
                      <Button
                        data-ocid="welcome.rules_button"
                        variant="outline"
                        size="lg"
                        className="w-full text-base sm:text-lg"
                      >
                        <BookOpen className="mr-2 h-5 w-5" />
                        Rules
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                          <BookOpen className="h-6 w-6 text-primary" />
                          Game Rules
                        </DialogTitle>
                        <DialogDescription>
                          Learn how to play Space Shooter
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <h3 className="mb-2 font-semibold text-primary">
                            Objective
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Destroy incoming meteors while avoiding collisions
                            with your spaceship. Survive as long as possible and
                            achieve the highest score!
                          </p>
                        </div>

                        <div>
                          <h3 className="mb-2 font-semibold text-primary">
                            Controls
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              <strong>Desktop:</strong>
                            </p>
                            <ul className="ml-4 list-disc space-y-1">
                              <li>
                                Move: Mouse cursor, WASD keys, or Arrow keys
                              </li>
                              <li>
                                Shoot: Hold left click or Spacebar for rapid
                                fire
                              </li>
                            </ul>
                            <p className="mt-2">
                              <strong>Mobile:</strong>
                            </p>
                            <ul className="ml-4 list-disc space-y-1">
                              <li>Move: Drag or tap on screen</li>
                              <li>
                                Shoot: Hold the FIRE button for rapid fire
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-2 font-semibold text-primary">
                            Meteors
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              Meteors come in three sizes: small, medium, and
                              large.
                            </p>
                            <ul className="ml-4 list-disc space-y-1">
                              <li>
                                <strong>Small meteors:</strong> Worth more
                                points when destroyed
                              </li>
                              <li>
                                <strong>Medium meteors:</strong> Worth moderate
                                points
                              </li>
                              <li>
                                <strong>Large meteors:</strong> Worth fewer
                                points
                              </li>
                            </ul>
                            <p className="mt-2">
                              Meteors can appear at different speeds, with
                              faster meteors worth more points!
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg border-2 border-warning/30 bg-warning/5 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                            <h3 className="font-semibold text-warning">
                              Shooting Penalty
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>
                              Each shot fired decreases your score by 1 point.
                            </strong>{" "}
                            This encourages strategic shooting and accuracy.
                            Only shoot when you have a clear target to maximize
                            your score!
                          </p>
                        </div>

                        <div>
                          <h3 className="mb-2 font-semibold text-primary">
                            Game Over
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            The game ends when a meteor collides with your
                            spaceship. Submit your score to compete on the
                            leaderboard!
                          </p>
                        </div>

                        <div className="rounded-lg bg-accent/10 p-3">
                          <p className="text-sm font-medium text-accent">
                            💡 Strategy Tip: Be selective with your shots! Focus
                            on smaller meteors for higher scores, but remember
                            that every shot costs you a point. Aim carefully and
                            shoot only when necessary!
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    {gamesPlayed !== undefined && (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3 sm:p-4">
                        <Gamepad2 className="h-5 w-5 text-accent" />
                        <span className="text-sm text-muted-foreground">
                          Games Played:
                        </span>
                        <span className="text-lg font-bold text-accent">
                          {Number(gamesPlayed)}
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        App Version: 0.1.10
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* High Scores Leaderboard — always visible */}
              <Card className="border-blue-500/30" data-ocid="leaderboard.card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-blue-400">High Scores</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {highScoresLoading ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Loading scores...
                      </p>
                    </div>
                  ) : highScores && highScores.length > 0 ? (
                    <div className="space-y-2">
                      {highScores
                        .slice(0, 5)
                        .map(([name, scoreValue], index) => (
                          <div
                            key={name}
                            data-ocid={`leaderboard.item.${index + 1}`}
                            className="flex items-center justify-between rounded-lg bg-muted/50 p-2 sm:p-3"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                                  index === 0
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : index === 1
                                      ? "bg-slate-400/20 text-slate-300"
                                      : index === 2
                                        ? "bg-orange-700/20 text-orange-400"
                                        : "bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="truncate font-medium">
                                {name}
                              </span>
                            </div>
                            <span className="text-base font-bold text-blue-400 sm:text-lg">
                              {Number(scoreValue)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div
                      data-ocid="leaderboard.empty_state"
                      className="py-4 text-center"
                    >
                      <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        No scores yet — be the first on the board!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <footer className="text-center text-xs text-muted-foreground sm:text-sm">
                © {new Date().getFullYear()}. Built with love using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </footer>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return null;
}
