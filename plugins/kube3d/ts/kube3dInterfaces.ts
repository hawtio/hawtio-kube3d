/// <reference path="../../includes.ts"/>
module Kube3d {

  export interface Renderable {
    render():void;
    destroy():void;
  }

  export interface SceneObject extends Renderable{
    getPosition():any;
    setPosition(x, y, z);
    setRotation(rx, ry, rz);
  };
}
