/// <reference path="kube3dHelpers.ts"/>
/// <reference path="kube3dPlugin.ts"/>
module Kube3d {

  var dummy = <any> {
    play: () => {}
  }

  export var playerLaser = <any> undefined;
  export var podlekLaser = <any> undefined;
  export var laserHit = <any> undefined;
  export var podlekExplosion = <any> undefined;
  export var playerExplosion = <any> undefined;
  export var playerSpawn = <any> undefined;

  export var tracks = [];

  _module.run(() => {

    playerLaser = new Howl({
      urls: ['resources/sounds/player_laser.ogg'],
      loop: false
    });

    podlekLaser = new Howl({
      urls: ['resources/sounds/podlek_laser.ogg'],
      loop: false
    });

    laserHit = new Howl({
      urls: ['resources/sounds/hit.ogg'],
      loop: false
    });

    podlekExplosion = new Howl({
      urls: ['resources/sounds/explosion.ogg'],
      loop: false
    });

    playerExplosion = new Howl({
      urls: ['resources/sounds/player_explosion.ogg'],
      loop: false
    });

    playerSpawn = new Howl({
      urls: ['resources/sounds/player_spawn.ogg'],
      volume: 0.9,
      loop: false
    });
    _.forEach(['background1.ogg', 'background2.ogg', 'background3.ogg'], (track) => {
      tracks.push(new Howl({
        urls: [UrlHelpers.join('resources/bg_music', track)],
        volume: 0.6,
        loop: false
      }));
    });
  });


}
