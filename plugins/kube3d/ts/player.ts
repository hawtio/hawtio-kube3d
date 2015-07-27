/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export class Player {

    constructor(private game, private avatar, private target) {

    }

    public getName() {
      return 'player';
    }

    public get entity() {
      return this.avatar;
    }

    public needsSpawning() {
      return false;
    }

    public shouldDie() {
      return false;
    }

    public hit() {

    }

    public tick(delta) {
      var target = this.target;
      walk.render(target.playerSkin);
      var vx = Math.abs(target.velocity.x);
      var vz = Math.abs(target.velocity.z);
      if (vx > 0.001 || vz > 0.001) {
        walk.stopWalking();
      } else {
        walk.startWalking()
      }
    }

    public checkCollisions(entities) {

    }

    public isDestroyed() {
      return false;
    }

  }

}
