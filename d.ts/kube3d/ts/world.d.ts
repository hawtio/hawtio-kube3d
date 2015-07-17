/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class World implements Renderable {
        private scene;
        private ambient;
        private light;
        constructor(scene: any);
        placePlayer(object: any): void;
        placeObject(object: any): void;
        render(): void;
        destroy(): void;
    }
}
