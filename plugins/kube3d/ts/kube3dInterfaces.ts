/// <reference path="../../includes.ts"/>
module Kube3d {

  export var W = 1;
  export var S = 0;
  export var WALL = W;
  export var SPACE = S;

  export var CELL_SIZE = 100;
  export var FLOOR_LEVEL = -CELL_SIZE;

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
