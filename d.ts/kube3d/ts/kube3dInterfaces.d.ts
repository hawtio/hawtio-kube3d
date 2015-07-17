/// <reference path="../../includes.d.ts" />
declare module Kube3d {
    var W: number;
    var S: number;
    var WALL: number;
    var SPACE: number;
    var CELL_SIZE: number;
    var FLOOR_LEVEL: number;
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
