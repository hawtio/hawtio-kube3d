/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export var deathFrames = 1 *60;
  export var maxHealth = 1;

  export class Player {

    private log:Logging.Logger = Logger.get('player');
    private health = maxHealth;
    private dead = false;
    private targetTick = undefined;

    constructor(private game, private avatar, private target) {
      log.debug("target: ", target);
      log.debug("target.tick: ", target.tick);
      log.debug("avatar: ", avatar);
      /*
      this.targetTick = angular.bind(this.target, this.target.tick);
      this.target.tick = (delta) => {
        if (!this.dead) {
          this.targetTick(delta);
        }
        this.tickInternal(delta);
      };
      */
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

    public die() {
      this.log.debug("I died!");
      this.dead = true;
    }

    public hit() {
      this.health = this.health - 1;
      this.log.debug("I got hit!  Health: ", this.health);
    }

    public tick(delta) {
      /*
      if (this.dead) {
        return;
      }
      if (this.health <= 0) {
        this.die();
      }
      */
      //this.targetTick(delta);
      var target = this.target;
      walk.render(target.playerSkin);
      var vx = Math.abs(target.velocity.x);
      var vz = Math.abs(target.velocity.z);
      if (vx > 0.001 || vz > 0.001) {
        walk.stopWalking();
      } else {
        walk.startWalking()
      }
      // nothing to do here
    }

    public checkCollisions(entities) {

    }

    public isDestroyed() {
      return false;
    }

  }

}
