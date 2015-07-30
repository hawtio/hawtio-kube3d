/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    var deathFrames: number;
    var maxHealth: number;
    class Player {
        private game;
        private avatar;
        private target;
        private log;
        private health;
        private dead;
        private targetTick;
        constructor(game: any, avatar: any, target: any);
        getName(): string;
        entity: any;
        needsSpawning(): boolean;
        shouldDie(): boolean;
        die(): void;
        hit(): void;
        tick(delta: any): void;
        checkCollisions(entities: any): void;
        isDestroyed(): boolean;
    }
}
