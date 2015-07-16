/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    class World implements Renderable {
        private scene;
        private ambient;
        private light;
        constructor(scene: any);
        render(): void;
        destroy(): void;
    }
}
