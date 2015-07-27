/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class EnergyBolt {
        private game;
        private origin;
        private direction;
        private name;
        private _entity;
        private lastPosition;
        private destroyed;
        private log;
        constructor(game: any, origin: any, direction: any);
        entity: any;
        die(playerHit: any): void;
        hit(): void;
        needsSpawning(): boolean;
        shouldDie(): boolean;
        getName(): string;
        destroy(): void;
        isDestroyed(): boolean;
        checkCollisions(entities: any): void;
        tick(delta: any): void;
        private createMesh();
    }
}
