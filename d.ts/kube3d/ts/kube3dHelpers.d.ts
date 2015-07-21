/// <reference path="../../includes.d.ts" />
/// <reference path="kube3dInterfaces.d.ts" />
declare var THREE: any;
declare var createGame: any;
declare var terrain: any;
declare module Kube3d {
    var pluginName: string;
    var log: Logging.Logger;
    var templatePath: string;
    var havePointerLock: boolean;
    var HalfPI: number;
    function rgbToHex(r: any, g: any, b: any): string;
    function randomGrey(): string;
    function webglAvailable(): boolean;
    function placeObject(cellX: any, cellY: any, isFloor?: boolean): number[];
}
