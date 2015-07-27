/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class EnergyBolt {
        private game;
        private origin;
        private direction;
        private entity;
        private lastPosition;
        private destroyed;
        constructor(game: any, origin: any, direction: any);
        destroy(): void;
        isDestroyed(): boolean;
        checkCollisions(entities: any): void;
        tick(delta: any): void;
        private createMesh();
    }
}
