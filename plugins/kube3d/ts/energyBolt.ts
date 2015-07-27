/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export class EnergyBolt {

    private entity:any = undefined;
    private lastPosition = undefined;
    private destroyed = false;

    public constructor(private game, private origin, private direction) {
      var mesh = this.createMesh();
      mesh.position.set(origin.position.x, origin.position.y + 1, origin.position.z);
      var velocity = new game.THREE.Vector3(direction[0], direction[1], direction[2]);
      velocity.multiplyScalar(0.05);
      var item:any = {
        mesh: mesh,
        size: 0.8,
        velocity: velocity
      }
      this.entity = game.addItem(item);
    }

    public destroy() {
      this.game.removeItem(this.entity);
      this.destroyed = true;
    }

    public isDestroyed() {
      return this.destroyed;
    }

    public checkCollisions(entities) {
      if (this.destroyed) {
        return;
      }
      var bulletAABB = this.entity.aabb();
      var hit = false;
      _.forIn(entities, (creature, key) => {
        if (!creature.inGame() || hit) {
          return;
        }
        if (bulletAABB.intersects(creature.entity.aabb())) {
          hit = true;
          this.destroy();
          creature.hit = true;
        }
      });
    }

    public tick(delta) {
      if (this.destroyed) {
        return;
      }
      if (this.lastPosition) {
        var pos = this.entity.mesh.position;
        var last = this.lastPosition;
        if (pos.x.toFixed(2) === last.x && pos.y.toFixed(2) === last.y && pos.z.toFixed(2) === last.z) {
          this.destroy();
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
      var bullet = new game.THREE.Mesh(new game.THREE.SphereGeometry(0.25, 32, 32), new game.THREE.MeshPhongMaterial({
        color: 0x888888,
      }));
      return bullet;
    }

  }

}
