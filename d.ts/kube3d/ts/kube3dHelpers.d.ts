/// <reference path="../../includes.d.ts" />
/// <reference path="kube3dInterfaces.d.ts" />
declare var THREE: any;
declare var createGame: any;
declare var perlin: any;
declare var walk: any;
declare var player: any;
declare var createSky: any;
declare var howler: any;
declare var Howl: any;
declare module Kube3d {
    var pluginName: string;
    var log: Logging.Logger;
    var templatePath: string;
    var havePointerLock: boolean;
    var settings: {
        destroyPods: boolean;
        music: boolean;
        blacklist: any;
    };
    var HalfPI: number;
    var QuarterPI: number;
    function rgbToHex(r: any, g: any, b: any): string;
    function randomGrey(): string;
    function webglAvailable(): boolean;
    function getParticles(THREE: any, size: any, color: any, amount: any): any;
    function placeObject(cellX: any, cellY: any, isFloor?: boolean): number[];
    function maybe(): boolean;
    function lessMaybe(): boolean;
    function flatTerrain(options?: any): (position: any, width: any) => Int8Array;
    function cityTerrain(options?: any): (position: any, width: any) => Int8Array;
    function perlinTerrain(options?: any): (position: any, width: any) => Int8Array;
    function getVolume(player: any, entity: any): number;
    function playSound(sound: any, player: any, entity: any): void;
    function getY(game: any, x: any, z: any): number;
}
