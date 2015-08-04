/// <reference path="kube3dHelpers.ts"/>
/// <reference path="sounds.ts"/>

module Kube3d {

  export var deathFrames = 1 *60;
  export var maxHealth = 1;

  export class Player {

    private log:Logging.Logger = Logger.get('player');
    private health = maxHealth;
    private dead = false;
    private targetTick = undefined;
    private spawned = false;

    constructor(private game, private avatar, private target, private $scope) {
      log.debug("target: ", target);
      log.debug("target.tick: ", target.tick);
      log.debug("avatar: ", avatar);
    }

    public isDead() {
      return this.dead;
    }

    public respawn() {
      this.spawned = false;
    }

    public getName() {
      return 'player';
    }

    public get entity() {
      return this.avatar;
    }

    public needsSpawning() {
      return !this.spawned;
    }

    public shouldDie() {
      return false;
    }

    public die() {
      this.log.debug("I died!");
      this.dead = true;
      this.game.interact.release();
      this.$scope.playerDeaths = this.$scope.playerDeaths + 1;
      Core.$apply(this.$scope);
      playerExplosion.play();
    }

    public spawn(self) {
      var x, y, z;
      do {
        x = Math.random() * 50 - 25;
        z = Math.random() * 50 - 25;
        y = getY(this.game, x, z);
        if (y === null) {
          return;
        }
      } while (y > 7)
      this.target.position.x = x;
      this.target.position.y = y;
      this.target.position.z = z;
      this.dead = false;
      this.health = maxHealth;
      this.spawned = true;
      Core.$apply(this.$scope);
    }

    public hit() {
      this.health = this.health - 1;
      this.log.debug("I got hit!  Health: ", this.health);
    }

    public tick(delta) {
      if (this.dead) {
        return;
      }
      if (this.health <= 0) {
        this.die();
      }
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
