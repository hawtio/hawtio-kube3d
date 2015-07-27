/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class Player {
        private game;
        private avatar;
        private target;
        constructor(game: any, avatar: any, target: any);
        getName(): string;
        entity: any;
        needsSpawning(): boolean;
        shouldDie(): boolean;
        hit(): void;
        tick(delta: any): void;
        checkCollisions(entities: any): void;
        isDestroyed(): boolean;
    }
}
