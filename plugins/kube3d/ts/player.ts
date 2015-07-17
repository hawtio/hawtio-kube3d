/// <reference path="kube3dHelpers.ts"/>
/// <reference path="world.ts"/>

module Kube3d {

  export class Player implements Renderable {
    private log:Logging.Logger = Logger.get('kube3d-player');
    private domElement:any = null;
    private _lookAt:any = null;
    private pitch = new THREE.Object3D();
    private yaw = new THREE.Object3D();

    private _enabled = false;
    private _document = undefined;

    private getWorldObjects:any = () => [];

    private raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // movement booleans
    private forward = false;
    private backward = false;
    private left = false;
    private right = false;
    private canJump = true;
    private running = false;

    // movement velocity
    private velocity = new THREE.Vector3();
    private prevTime = performance.now();

    // key/mouse handlers
    private handlers:any = null;

    public constructor(private scene, private camera, private d, private world:World) {

      camera.rotation.set(0, 0, 0);
      camera.position.set(0, 0, 0);
      this.pitch.add(camera);
      this.yaw.add(this.pitch);
      scene.add(this.yaw);

      this.yaw.position.set(0, 0, -5);

      var domElement = this.domElement = $(d);

      if (!havePointerLock) {
        this.enabled = true;
      }

      var self = this;

      self.handlers = {
        'keydown': (event:any) => {
          switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
              self.forward = true;
              break;
            case 37: // left
            case 65: // a
              self.left = true; 
              break;
            case 40: // down
            case 83: // s
              self.backward = true;
              break;
            case 39: // right
            case 68: // d
              self.right = true;
              break;
            case 16: // shift
              self.running = true;
              break;
            case 32: // space
              if (self.canJump === true) {
                self.velocity.y += 350;
                self.canJump = false;
              }
              break;
          }
        },
        'keyup': (event:any) => {
          switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
              self.forward = false;
              break;
            case 37: // left
            case 65: // a
              self.left = false; 
              break;
            case 40: // down
            case 83: // s
              self.backward = false;
              break;
            case 39: // right
            case 68: // d
              self.right = false;
              break;
            case 16: // shift
              self.running = false;
              break;
          }
        },
        'mousemove': (event:any) => {
          if (!self._enabled || !havePointerLock) {
            return;
          }
          var yaw = self.yaw;
          var pitch = self.pitch;
          var deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
          var deltaY = event.movementY || event.mozMovementX || event.webkitMovementX || 0;
          yaw.rotation.y -= deltaX * 0.002;
          pitch.rotation.x -= deltaY * 0.002;
          pitch.rotation.x = Math.max(-HalfPI, Math.min(HalfPI, pitch.rotation.x));
        }
      };
      _.forIn(this.handlers, (handler, evt) => document.addEventListener(evt, handler, false));
    }

    public set enabled(enabled) {
      this._enabled = enabled;
      if (enabled) {
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        this.object.position.set(0, 0, 0);
        var angle = THREE.Math.degToRad(THREE.Math.random16() * 360);
        this.yaw.rotation.set(0, angle, 0);
        this.world.placePlayer(this.object);
      } else {
        this.yaw.position.set(0, 0, 0);
        this.yaw.rotation.set(0, 0, 0);
        this.pitch.rotation.set(0, 0, 0);
      }

    }

    public setWorldObjectsCallback(func) {
      this.getWorldObjects = func;
    }

    public get enabled() {
      return this._enabled;
    }

    public get object() {
      return this.yaw;
    }

    public lookAt(box) {
      this._lookAt = box;
    }

    public destroy() {
      this.scene.remove(this.yaw);
      this.yaw.dispose();
      this.pitch.dispose();
      _.forIn(this.handlers, (handler, evt) => document.removeEventListener(evt, handler));
    }

    private walkingModifier = 500;
    private runningModifier = 200;

    public render() {
      if (!this.enabled || !havePointerLock) {
        if (this._lookAt) {
          var angle = Date.now() * 0.0001;
          this.camera.focus(this._lookAt, angle);
        }
        return;
      }

      var raycaster = this.raycaster;
      var velocity = this.velocity;
      var me = this.object;

      raycaster.ray.origin.copy( this.yaw.position );
      raycaster.ray.origin.y -= 10;

      var objects = this.getWorldObjects();

      var intersections = raycaster.intersectObjects(objects);

      var isOnObject = intersections.length > 0;

      var time = performance.now();
      var modifier = this.running ? this.runningModifier : this.walkingModifier;
      var delta = (time - this.prevTime) / modifier;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      if (this.forward) velocity.z -= 400.0 * delta;
      if (this.backward) velocity.z += 400.0 * delta;
      if (this.left) velocity.x -= 400.0 * delta;
      if (this.right) velocity.x += 400.0 * delta;

      if ( isOnObject === true ) {
        velocity.y = Math.max( 0, velocity.y );
        this.canJump = true;
      }

      me.translateX( velocity.x * delta );
      me.translateY( velocity.y * delta );
      me.translateZ( velocity.z * delta );

      if ( me.position.y < 10 ) {

        velocity.y = 0;
        me.position.y = 10;
        this.canJump = true;
      }

      this.prevTime = time;
    }
  }
}
