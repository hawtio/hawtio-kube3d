/// <reference path="kube3dHelpers.d.ts" />
/// <reference path="world.d.ts" />
declare module Kube3d {
    class Player implements Renderable {
        private scene;
        private camera;
        private d;
        private world;
        private log;
        private domElement;
        private _lookAt;
        private pitch;
        private yaw;
        private _enabled;
        private _document;
        private getWorldObjects;
        private raycaster;
        private forward;
        private backward;
        private left;
        private right;
        private canJump;
        private velocity;
        private prevTime;
        private handlers;
        constructor(scene: any, camera: any, d: any, world: World);
        enabled: boolean;
        setWorldObjectsCallback(func: any): void;
        object: any;
        lookAt(box: any): void;
        destroy(): void;
        render(): void;
    }
}
