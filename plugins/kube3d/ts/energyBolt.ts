/// <reference path="kube3dHelpers.ts"/>
/// <reference path="sounds.ts"/>

module Kube3d {

  var deathFrames = 0.5 * 60;
  var maxHealth = 1;

  function randomColor() {
    return "#FF0000".replace(/0/g,function(){return (~~(Math.random() * 6 + 2)).toString(16);});
  }

  export class EnergyBolt {

    private name:string = undefined;
    private _entity:any = undefined;
    private lastPosition = undefined;
    private dead = false;
    private dying = false;
    private log:Logging.Logger = undefined;
    private health = maxHealth;
    private deathFrameCount = 0;
    private bullet:any = undefined;
    private cloud:any = undefined;
    private position:any = undefined;

    public constructor(private game, private origin, private direction, private owner:string) {
      var mesh = this.createMesh();
      mesh.position.set(origin.position.x, origin.position.y + 0.5, origin.position.z);
      var velocity = new game.THREE.Vector3(direction[0], direction[1], direction[2]);
      velocity.multiplyScalar(0.05);
      var item:any = {
        mesh: mesh,
        size: 0.8,
        velocity: velocity
      }
      this.entity = game.addItem(item);
      this.name = 'projectile-' + Date.now();
      this.log = Logger.get(this.getName());
      this.position = this.entity.yaw.position;
    }

    public get entity() {
      return this._entity;
    }

    public set entity(e) {
      this._entity = e;
    }

    public die(playerHit = false) {
      if (this.dying) {
        return;
      }
      this.dying = true;
      if (this.bullet) {
        this.bullet.visible = false;
      }
      if (this.cloud) {
        this.cloud.visible = true;
      }
      playSound(laserHit, this.origin, this);
    }

    public hit() {
      this.health = this.health - 1;
      this.log.debug("I got hit!, health: ", this.health);
    }

    public needsSpawning() {
      return false;
    }

    public shouldDie() {
      return this.isDestroyed();
    }

    public getName() {
      return this.name;
    }

    public destroy() {
      this.game.removeItem(this.entity);
      this.dead = true;
    }

    public isDestroyed() {
      return this.dead;
    }

    public checkCollisions(entities) {
      if (this.dead || this.dying) {
        return;
      }
      var bulletAABB = this.entity.aabb();
      var hit = false;
      _.forIn(entities, (creature, key) => {
        if (hit) {
          return;
        }
        if (key === this.getName() || key === this.owner) {
          return;
        }
        if (creature.needsSpawning()) {
          return;
        }
        if (bulletAABB.intersects(creature.entity.aabb())) {
          this.log.debug("I hit ", creature.getName());
          hit = true;
          this.hit();
          creature.hit();
        }
      });
    }

    public tick(delta) {
      if (this.dead) {
        return;
      }
      if (this.health <= 0) {
        this.die();
      }
      if (this.dying) {
        this.entity.velocity.x = 0;
        this.entity.velocity.y = 0;
        this.entity.velocity.z = 0;
        this.cloud.scale.x = this.cloud.scale.x + 0.5;
        this.cloud.scale.y = this.cloud.scale.y + 0.5;
        this.cloud.scale.z = this.cloud.scale.z + 0.5;
        this.deathFrameCount = this.deathFrameCount + 1;
        if (this.deathFrameCount > deathFrames) {
          this.destroy();
        }
        return;
      }
      if (this.lastPosition) {
        var pos = this.entity.mesh.position;
        var last = this.lastPosition;
        if (pos.x.toFixed(2) === last.x && pos.y.toFixed(2) === last.y && pos.z.toFixed(2) === last.z) {
          this.die();
        }
      }
      this.lastPosition = {
        x: this.entity.mesh.position.x.toFixed(2),
        y: this.entity.mesh.position.y.toFixed(2),
        z: this.entity.mesh.position.z.toFixed(2)
      }

    }

    private createMesh() {
      var game = this.game;
      var THREE = game.THREE;
      var answer = new THREE.Object3D();
      var color = randomColor();
      var bullet = new game.THREE.Mesh(new game.THREE.SphereGeometry(0.125, 8, 8), new game.THREE.MeshBasicMaterial({
        color: color
      }));
      var cloud = getParticles(THREE, 0.125, color, 100);
      bullet.visible = true;
      cloud.visible = false;
      this.bullet = bullet;
      this.cloud = cloud;
      answer.add(bullet);
      answer.add(cloud);
      return answer;
    }

  }

}
