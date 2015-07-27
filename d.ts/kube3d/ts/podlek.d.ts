/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class Podlek {
        private model;
        private game;
        private _name;
        private _pod;
        deleted: boolean;
        hit: boolean;
        private _entity;
        private _clearInterval;
        private log;
        constructor(model: any, game: any, _name: string, _pod: any);
        private createMesh();
        destroy(): void;
        tick(delta: any): void;
        die(): void;
        spawn(player: any): void;
        inGame(): boolean;
        name: string;
        pod: any;
        clearInterval: () => void;
        entity: any;
    }
}
