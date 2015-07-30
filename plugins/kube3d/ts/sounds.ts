/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export var playerLaser = new Howl({
    urls: ['resources/sounds/player_laser.ogg'],
    loop: false
  });

  export var podlekLaser = new Howl({
    urls: ['resources/sounds/podlek_laser.ogg'],
    loop: false
  });

  export var laserHit = new Howl({
    urls: ['resources/sounds/hit.ogg'],
    loop: false
  });

  export var podlekExplosion = new Howl({
    urls: ['resources/sounds/explosion.ogg'],
    loop: false
  });
}
