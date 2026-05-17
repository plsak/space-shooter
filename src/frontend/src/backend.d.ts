import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    getGamesPlayed(): Promise<bigint>;
    getHighScores(): Promise<Array<[string, bigint]>>;
    incrementGamesPlayed(): Promise<void>;
    submitScore(name: string, score: bigint): Promise<void>;
}
