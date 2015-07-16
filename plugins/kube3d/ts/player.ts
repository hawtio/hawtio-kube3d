/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export class Player implements Renderable {
    private log:Logging.Logger = Logger.get('kube3d-player');
    private domElement:any = null;
    private _lookAt:any = null;
    private pitch = new THREE.Object3D();
    private yaw = new THREE.Object3D();

    private _enabled = false;
    private _document = undefined;

    // movement booleans
    private forward = false;
    private backward = false;
    private left = false;
    private right = false;
    private canJump = true;

    // movement velocity
    private velocity = new THREE.Vector3();
    private prevTime = performance.now();

    private handlers:any = null;

    public constructor(private scene, private camera, private d) {

      camera.rotation.set(0, 0, 0);
      camera.position.set(0, 0, 0);
      this.pitch.add(camera);
      this.yaw.add(this.pitch);
      scene.add(this.yaw);

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
          pitch.rotation.x = Math.max( - HalfPI, Math.min(HalfPI, pitch.rotation.x));
        }
      };
      _.forIn(this.handlers, (handler, evt) => document.addEventListener(evt, handler, false));
    }

    public set enabled(enabled) {
      this._enabled = enabled;
    }

    public get enabled() {
      return this._enabled;
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

    public render() {
      if (!this.enabled || !havePointerLock) {
        if (this.lookAt) {
          var angle = Date.now() * 0.0001;
          this.camera.focus(this._lookAt, angle);
        }
        return;
      }
    }
  }
}
