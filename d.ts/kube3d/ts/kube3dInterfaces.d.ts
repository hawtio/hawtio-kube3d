/// <reference path="../../includes.d.ts" />
declare module Kube3d {
    interface Renderable {
        render(): void;
        destroy(): void;
    }
    interface SceneObject extends Renderable {
        getPosition(): any;
        setPosition(x: any, y: any, z: any): any;
        setRotation(rx: any, ry: any, rz: any): any;
    }
}
