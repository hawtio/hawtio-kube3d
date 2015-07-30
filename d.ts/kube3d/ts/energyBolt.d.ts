/// <reference path="kube3dHelpers.d.ts" />
/// <reference path="sounds.d.ts" />
declare module Kube3d {
    class EnergyBolt {
        private game;
        private origin;
        private direction;
        private owner;
        private name;
        private _entity;
        private lastPosition;
        private dead;
        private dying;
        private log;
        private health;
        private deathFrameCount;
        private bullet;
        private cloud;
        private position;
        constructor(game: any, origin: any, direction: any, owner: string);
        entity: any;
        die(playerHit?: boolean): void;
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
