import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Extended actor interface for game backend methods not yet in generated types
interface GameActor {
  getHighScores: () => Promise<Array<[string, bigint]>>;
  submitScore: (playerName: string, score: bigint) => Promise<void>;
  getGamesPlayed: () => Promise<bigint>;
  incrementGamesPlayed: () => Promise<void>;
}

function asGameActor(actor: unknown): GameActor | null {
  if (!actor || typeof actor !== "object") return null;
  return actor as GameActor;
}

export function useHighScores() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Array<[string, bigint]>>({
    queryKey: ["highScores"],
    queryFn: async () => {
      const gameActor = asGameActor(actor);
      if (!gameActor || typeof gameActor.getHighScores !== "function")
        return [];
      const scores = await gameActor.getHighScores();
      return scores.sort((a, b) => Number(b[1] - a[1]));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitScore() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerName,
      score,
    }: { playerName: string; score: bigint }) => {
      if (!actor) {
        throw new Error("Actor not ready — please try again in a moment");
      }
      const gameActor = asGameActor(actor);
      if (!gameActor || typeof gameActor.submitScore !== "function") {
        throw new Error("submitScore method not available on actor");
      }
      await gameActor.submitScore(playerName, score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highScores"] });
    },
  });
}

export function useGamesPlayed() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<bigint>({
    queryKey: ["gamesPlayed"],
    queryFn: async () => {
      const gameActor = asGameActor(actor);
      if (!gameActor || typeof gameActor.getGamesPlayed !== "function")
        return BigInt(0);
      return await gameActor.getGamesPlayed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIncrementGamesPlayed() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const gameActor = asGameActor(actor);
      if (!gameActor || typeof gameActor.incrementGamesPlayed !== "function")
        return;
      await gameActor.incrementGamesPlayed();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamesPlayed"] });
    },
  });
}
