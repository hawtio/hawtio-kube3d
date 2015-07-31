/// <reference path="../../includes.ts"/>
/// <reference path="kube3dInterfaces.ts"/>

declare var THREE; // = require('threejs-build');
var createGame = require('voxel-hello-world');
var noise = require('perlin').noise;
var walk = require('voxel-walk');
var player = require('voxel-player');
var createSky = require('voxel-sky');
var howler = require('howler');
declare var Howl;

module Kube3d {
  export var pluginName = 'Kube3d';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var templatePath = 'plugins/kube3d/html';
  export var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;


  export var HalfPI = Math.PI / 2;
  export var QuarterPI = Math.PI / 4;

  export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  export function randomGrey() {
    var rgbVal = Math.random() * 128 + 128;
    return rgbToHex(rgbVal, rgbVal, rgbVal);
  }

  export function webglAvailable() {
    try {
      var canvas = document.createElement( 'canvas' );
      return !!( (<any>window).WebGLRenderingContext && (
            canvas.getContext( 'webgl' ) ||
            canvas.getContext( 'experimental-webgl' ) )
          );
    } catch ( e ) {
      return false;
    }
  }

  export function getParticles(THREE, size, color, amount) {
    var geometry = new THREE.Geometry();
    var halfSize = size / 2.0;
    for (var i = 0; i < amount; i++) {
      var vertex = new THREE.Vector3();
      vertex.x = Math.random() * size - halfSize;
      vertex.y = Math.random() * size - halfSize;
      vertex.z = Math.random() * size - halfSize;
      geometry.vertices.push(vertex);
    }
    var material = new THREE.ParticleBasicMaterial({ color: color, size: 1 });
    return new THREE.ParticleSystem(geometry, material);
  }

  export function placeObject(cellX, cellY, isFloor = false) {
    var x = cellX * CELL_SIZE;
    var z = cellY * CELL_SIZE;
    var y = isFloor ? FLOOR_LEVEL : 0;
    return [x, y, z];
  }

  export function maybe() {
    return Math.random() < 0.5;
  }

  export function lessMaybe() {
    return Math.random() < 0.25;
  }

  export function flatTerrain(options:any = {}) {
    return (position, width) => {
      var chunk = new Int8Array(width * width * width);
      var startX = position[0] * width;
      var startY = position[1] * width;
      var startZ = position[2] * width;
      var max = 5;
      blockIterator(startX, startY, startZ, width, (x, y, z, width) => {
        if (x % 4 === 0 && z % 4 === 0) {
          max = 6;
        } else {
          max = 5;
        }
        if (position[1] === 0 && y > 0 && y < max) {
          setBlock(chunk, x, y, z, width, 1);
        } else {
          setBlock(chunk, x, y, z, width, 0);
        }
      });
      return chunk;
    }
  }

  export function cityTerrain(options:any = {}) {
    return (position, width) => {
      var chunk = new Int8Array(width * width * width);
      var startX = position[0] * width;
      var startY = position[1] * width;
      var startZ = position[2] * width;
      var endX = startX + width;
      var endY = startY + width;
      var endZ = startZ + width;
      var max = Math.random() * 30 + 10;
      var buildingSize = Math.random() * 10 + 1;
      var top = 5;
      blockIterator(startX, startY, startZ, width, (x, y, z, width) => {
        if (x < startX + buildingSize || 
            x > endX - buildingSize || 
            z < startZ + buildingSize || 
            z > endZ - buildingSize) {
          top = 5;
        } else {
          top = max;
        }
        if (position[1] === 0 && y > 0 && y < top) {
          setBlock(chunk, x, y, z, width, 1);
        } else {
          setBlock(chunk, x, y, z, width, 0);
        }
      });
      return chunk;
    }
  }

  function blockIterator(startX, startY, startZ, width, func) {
    for (var y = startY; y < startY + width; y++) {
      for (var x = startX; x < startX + width; x++) {
        for (var z = startZ; z < startZ + width; z++) {
          func(x, y, z, width);
        }
      }
    }
  }

  export function perlinTerrain(options:any = {}) {
    var seed = options.seed || 'hawtio';
    var floor = options.floor || 0;
    var ceiling = options.ceiling || 30;
    var divisor = options.divisor || 50;
    noise.seed(seed);
    return function generateChunk(position, width) {
      var startX = position[0] * width;
      var startY = position[1] * width;
      var startZ = position[2] * width;
      var chunk = new Int8Array(width * width * width);
      if (position[1] === 0) {
        pointsInside(startX, startZ, width, function(x, z) {
          var n = noise.simplex2(x / divisor , z / divisor);
          var y = ~~scale(n, -1, 1, floor, ceiling);
          if (y === floor || startY < y && y < startY + width) {
            setBlock(chunk, x, y, z, width, 1);
            // fill in underneath too
            if (y > 0) {
              for (y = y - 1; y > 0; y--) {
                setBlock(chunk, x, y, z, width, 2);
              }
            }
          }
        });
      } else {
        blockIterator(startX, startY, startZ, width, (x, y, z, width) => {
          setBlock(chunk, x, y, z, width, 0);
        });
      }
      return chunk;
    }
  }

  export function getVolume(player, entity) {
    var distX = Math.abs(player.position.x - entity.position.x);
    var distY = Math.abs(player.position.z - entity.position.z);
    var dist = ((distX + distY) / 2) + 1;
    var volume = 1.0 / (dist * 0.5);
    return volume;
  }

  export function playSound(sound, player, entity) {
    if (!sound) {
      return;
    }
    var volume = getVolume(player, entity);
    if (volume) {
      var id = sound.play();
      sound.volume(volume, id);
    }
  }

  export function getY(game, x, z) {
    var y = 1;
    var block = game.getBlock([x, y, z]);
    if (block === false) {
      return null;
    }
    while(block !== 0 && y < 40) {
      y = y + 1;
      block = game.getBlock([x, y, z]);
    }
    return y;
  }

  function setBlock(chunk, x, y, z, width, value) {
    var xidx = Math.abs((width + x % width) % width);
    var yidx = Math.abs((width + y % width) % width);
    var zidx = Math.abs((width + z % width) % width);
    var idx = xidx + yidx * width + zidx * width * width;
    chunk[idx] = value;
  }

  function pointsInside(startX, startY, width, func) {
    for (var x = startX; x < startX + width; x++)
      for (var y = startY; y < startY + width; y++)
        func(x, y);
  }

  function scale( x, fromLow, fromHigh, toLow, toHigh ) {
    return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow;
  }

}
