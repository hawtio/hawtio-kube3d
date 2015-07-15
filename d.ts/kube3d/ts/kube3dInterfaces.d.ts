/// <reference path="../../includes.d.ts" />
declare module Kube3d {
    interface Point3d {
        x: number;
        y: number;
        z: number;
    }
    interface Size3d {
        width: number;
        height: number;
        depth: number;
    }
    interface SceneObject {
        render(): void;
        destroy(): void;
        getPosition(): Point3d;
        setPosition(x: any, y: any, z: any): any;
        setRotation(rx: any, ry: any, rz: any): any;
    }
}
