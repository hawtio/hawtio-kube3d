/// <reference path="kube3dInterfaces.d.ts" />
declare module Kube3d {
    class SceneObjectBase implements SceneObject {
        scene: any;
        geometry: any;
        private boundingBox;
        constructor(scene: any, geometry: any);
        destroy(): void;
        debug(enable: any): void;
        move(x: any, y: any, z: any): void;
        rotate(rx: any, ry: any, rz: any): void;
        getPosition(): any;
        setPosition(x: any, y: any, z: any): void;
        setRotation(rx: any, ry: any, rz: any): void;
        render(): void;
    }
    class PodObject extends SceneObjectBase {
        scene: any;
        hostObject: HostObject;
        id: string;
        obj: any;
        private angle;
        private circle;
        private rotation;
        constructor(scene: any, hostObject: HostObject, id: string, obj: any);
        update(model: any, pod: any): void;
        destroy(): void;
        private distance();
        private angleOfVelocity();
        render(): void;
    }
    class HostObject extends SceneObjectBase {
        id: string;
        obj: any;
        private offsetX;
        private offsetY;
        pods: {};
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        constructor(scene: any, id: string, obj: any);
        update(model: any, host: any): void;
        debug(enable: any): void;
        destroy(): void;
        removePod(id: any): void;
        addPod(key: any, p: any): void;
        hasPod(id: any): boolean;
        private step;
        render(): void;
    }
}
