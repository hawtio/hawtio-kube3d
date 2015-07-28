/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  var deathFrames = 1 * 60;
  var maxHealth = 1;

  export class Podlek {
    private playerHit = false;
    private dead = false;
    private dying = false;
    private deleteCalled = false;
    private _entity:any = undefined;
    private _clearInterval:() => void = undefined;
    private log:Logging.Logger = undefined;
    private health = maxHealth;
    private deathFrameCount = 0;

    private box:any = undefined;
    private cloud:any = undefined;

    private position:any = undefined;
    private rotation:any = undefined;

    public constructor(private model, private game, private _name:string, private _pod:any) {
      this.log = Logger.get('podlek-' + _name);
    }

    public getName() {
      return this._name;
    }

    private createMesh() {
      var game = this.game;
      var THREE = game.THREE;
      var answer = new THREE.Object3D();
      var boxTexture = THREE.ImageUtils.loadTexture(this._pod.$iconUrl);
      boxTexture.minFilter = THREE.NearestFilter;
      // commenting these now so I remember which element = which axis
      var materials = [
        new THREE.MeshLambertMaterial({ color: 0xffffff }), // + x-axis
        new THREE.MeshLambertMaterial({ color: 0xffffff }), // - x-axis
        new THREE.MeshLambertMaterial({ color: 0xffffff }), // + y-axis
        new THREE.MeshLambertMaterial({ color: 0xffffff }), // - y-axis
        new THREE.MeshLambertMaterial({ map: boxTexture }), // + z-axis
        new THREE.MeshLambertMaterial({ color: 0xffffff })  // - z-axis
      ];
      var boxMaterial = new THREE.MeshFaceMaterial(materials);
      var box = this.box = new THREE.Mesh(new THREE.CubeGeometry(game.cubeSize, game.cubeSize, game.cubeSize), boxMaterial);
      var cloud = this.cloud = getParticles(THREE, game.cubeSize, 0xffffff, 1000);
      box.visible = true;
      cloud.visible = false;
      answer.add(box);
      answer.add(cloud);
      answer.add(new THREE.AxisHelper(5));
      return answer;
    }

    public destroy() {
      this.dead = true;
      if (this.entity) {
        this.game.removeItem(this.entity);
      }
      if (this.clearInterval) {
        this.clearInterval();
      }
    }

    public checkCollisions(entities) {
      // TODO
    }

    public lookAt(obj) {
      var a = obj.position || obj;
      var b = this.position;
      this.rotation.y = Math.atan2(a.x - b.x, a.z - b.z) + Math.random() * 1/4 - 1/8;
    }

    public jump(amount = 0.015) {
      this.log.debug("Jumping!");
      this.entity.velocity.y = amount;
      this.entity.resting = false;
    }

    public forward(amount = 0.015) {
      /*
      var angle = this.rotation.y;
      var x = this.game.cubeSize / 2 * Math.sin(angle);
      var z = this.game.cubeSize / 2 * Math.cos(angle);
      this.entity.velocity.x = x * 0.01;
      */
      this.entity.velocity.z = amount;
      this.entity.resting = false;

      var angle = this.rotation.y;
      var pt = this.position.clone();
      pt.y = this.position.y;
      pt.x += this.game.cubeSize / 2 * Math.sin(angle);
      pt.z += this.game.cubeSize / 2 * Math.cos(angle);
      if (this.game.getBlock(pt)) {
        log.debug("block");
        this.game.setTimeout(() => { this.jump() }, 10);
      }
    }

    public move(x, y, z) {
      this.entity.velocity.x += x;
      this.entity.velocity.y  = y;
      this.entity.velocity.z += z;
      this.entity.resting = false;

      if (this.entity.velocity.y === 0) {
        var angle = this.rotation.y;
        var pt = this.position.clone();
        pt.y = this.position.y;
        pt.x += this.game.cubeSize / 2 * Math.sin(angle);
        pt.z += this.game.cubeSize / 2 * Math.cos(angle);
        if (this.game.getBlock(pt)) {
          log.debug("block");
          this.game.setTimeout(() => { this.jump() }, 10);
        }
      }
    }

    public tick(delta) {
      if (this.dead || !this._entity) {
        return;
      }
      if (this.health <= 0 && !this.dying) {
        this.die();
      }
      if (this.dying) {
        this.entity.velocity.x = 0;
        this.entity.velocity.y = 0;
        this.entity.velocity.z = 0;
        this.entity.mesh.scale.x = this.entity.mesh.scale.x + 0.2;
        this.entity.mesh.scale.y = this.entity.mesh.scale.y + 0.2;
        this.entity.mesh.scale.z = this.entity.mesh.scale.z + 0.2;
        this.deathFrameCount = this.deathFrameCount + 1;
        if (this.deathFrameCount > deathFrames) {
          this.destroy();
        }
      } else {
        if (this.entity.mesh.position.y < -5) {
          this.log.debug("I fell off the world!  dying...");
          this.die(false);
        }
      }
    }

    public shouldDie() {
      return (!(this._name in this.model.podsByKey));
    }

    public isDestroyed() {
      return this.dead;
    }

    public isDying() {
      return this.dying || this.dead;
    }

    public hit() {
      this.playerHit = true;
      this.health = this.health - 1;
      this.log.debug("I got hit!, health: ", this.health);
    }

    public die(playerHit = this.playerHit) {
      if (this.dying) {
        return;
      }
      this.log.debug("I'm dying!");
      this.dying = true;
      if (this.playerHit && !this.deleteCalled) {
        this.log.debug("Deleting resource");
        this.model['podsResource'].delete({ id: Kubernetes.getName(this.pod) });
        this.deleteCalled = true;
      }
      if (this.clearInterval) {
        this.clearInterval();
        delete this.clearInterval;
      }
      if (this.box) {
        this.box.visible = false;
      }
      if (this.cloud) {
        this.cloud.visible = true;
      }
      this.entity.resting = true;
    }

    public spawn(player) {
      var mesh = this.createMesh();
      mesh.name = this._name;
      var playerX = player.position.x;
      var playerZ = player.position.z;
      var distX = Math.random() * 30 + 10;
      var distZ = Math.random() * 30 + 10;
      distX = maybe() ? distX : distX * -1;
      distZ = maybe() ? distZ : distZ * -1;
      var x = playerX + distX;
      var z = playerZ + distZ;
      this.log.debug("Spawning at x:", x, " z:", z, " player at x:", playerX, " z:", playerZ);
      //mesh.position.set(x, 30, z);
      var item:any = {
        mesh: mesh,
        size: this.game.cubeSize,
        velocity: { x: 0, y: 0, z: 0 }
      };
      this.entity = this.game.addItem(item);
      this.position = this.entity.yaw.position;
      this.rotation = this.entity.yaw.rotation;
      this.position.set(x, 20, z);

      var walkAround = () => {
        if (this.dying || this.dead || !this.entity || !this.rotation) {
          return;
        }
        this.rotation.y += Math.random() * Math.PI / 2 - Math.PI / 4;
        // this.jump();
        this.forward();
        this.clearInterval = this.game.setTimeout(walkAround, 1000);
      }

      walkAround();

      /*this.clearInterval = this.game.setInterval(() => {
        if (this.dying || this.dead) {
          return;
        }
        this.entity.velocity.x = (Math.random() * 10 - 5) * 0.005;
        this.entity.velocity.z = (Math.random() * 10 - 5) * 0.005;
        this.entity.velocity.y = (Math.random() * 10 - 5) * 0.005;
        this.entity.resting = false;
      }, Math.random() * 5000 + 500);
      */
    }

    public needsSpawning() {
      return !angular.isDefined(this._entity);
    }

    public get name() {
      return this._name;
    }

    public get pod() {
      return this._pod;
    }

    public set pod(p:any) {
      try {
        angular.copy(p, this._pod);
      } catch (e) {
        // most likely an identical object
      }
    }

    public get clearInterval() {
      return this._clearInterval;
    }

    public set clearInterval(f:() => void) {
      this._clearInterval = f;
    }

    public get entity() {
      return this._entity;
    }

    public set entity(e:any) {
      this._entity = e;
    }

  }

}
