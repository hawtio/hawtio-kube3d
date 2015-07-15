/// <reference path="../../includes.ts"/>
module Kube3d {

  export interface Point3d {
    x:number;
    y:number;
    z:number;
  }

  export interface Size3d {
    width: number;
    height: number;
    depth: number;
  }

  export interface SceneObject {
    render():void;
    destroy():void;
    getPosition():Point3d;
    setPosition(x, y, z);
    setRotation(rx, ry, rz);
  };
}
