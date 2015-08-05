/// <reference path="kube3dHelpers.d.ts" />
/// <reference path="sounds.d.ts" />
declare module Kube3d {
    class Podlek {
        private model;
        private game;
        private _name;
        private _pod;
        private $scope;
        private playerHit;
        private dead;
        private dying;
        private deleteCalled;
        private _entity;
        private _clearInterval;
        private log;
        private health;
        private deathFrameCount;
        private box;
        private cloud;
        private position;
        private rotation;
        private player;
        private desiredAngle;
        private turning;
        private noticed;
        private cooldown;
        private actions;
        constructor(model: any, game: any, _name: string, _pod: any, $scope: any);
        getName(): string;
        private createMesh();
        destroy(): void;
        checkCollisions(entities: any): void;
        lookAt(obj: any): void;
        notice(target: any, radius: any): any;
        jump(amount?: number): void;
        forward(amount?: number): void;
        tick(delta: any): void;
        shouldDie(): boolean;
        isDestroyed(): boolean;
        isDying(): boolean;
        hit(): void;
        die(playerHit?: boolean): void;
        spawn(player: any): void;
        turn(): void;
        needsSpawning(): boolean;
        name: string;
        pod: any;
        clearInterval: () => void;
        entity: any;
    }
}
