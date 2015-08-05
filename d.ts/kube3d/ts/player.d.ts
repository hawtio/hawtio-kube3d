/// <reference path="kube3dHelpers.d.ts" />
/// <reference path="sounds.d.ts" />
declare module Kube3d {
    var deathFrames: number;
    var maxHealth: number;
    class Player {
        private game;
        private avatar;
        private target;
        private $scope;
        private log;
        private health;
        private dead;
        private targetTick;
        private spawned;
        private spawning;
        private spawnClicked;
        constructor(game: any, avatar: any, target: any, $scope: any);
        isDead(): boolean;
        respawn(): void;
        getName(): string;
        entity: any;
        needsSpawning(): boolean;
        isSpawning(): boolean;
        shouldDie(): boolean;
        die(): void;
        spawn(self: any): void;
        hit(): void;
        tick(delta: any): void;
        checkCollisions(entities: any): void;
        isDestroyed(): boolean;
    }
}
